"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { CustomOrderStatus, OrderStatus, Prisma, ReturnStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { assertAdmin } from "@/server/session";
import { couponSchema, productSchema } from "@/lib/validators";
import { sendCustomerNote, sendStatusUpdate } from "@/server/email";
import { emailCopy } from "@/server/email-copy";
import { rewardReferrer } from "@/server/services/referrals";
import { generateLabel, shipOrder, shiprocketEnabled } from "@/server/shipping/shiprocket";
import { sendPush } from "@/server/push";
import { slugify } from "@/lib/utils";
import { IMAGE_HOSTS, isAllowedImageUrl } from "@/config/images";
import type { FormState } from "./public";

function refreshCatalog(slug?: string) {
  updateTag("products");
  updateTag("categories");
  if (slug) updateTag(`product:${slug}`);
}

export async function saveProduct(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse({
    ...raw,
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[i.path.join(".")] ??= i.message;
    return { ok: false, errors, message: "Please fix the highlighted fields." };
  }
  const d = parsed.data;
  const slug = d.slug || slugify(d.name);
  const imageUrls = (d.imageUrls ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const badUrl = [...imageUrls, ...(d.modelUrl ? [d.modelUrl] : [])].find((u) => !isAllowedImageUrl(u));
  if (badUrl) {
    return {
      ok: false,
      errors: {
        imageUrls: `Unsupported image link: ${badUrl}. Use a /public path or an https link from ${IMAGE_HOSTS.join(", ")}.`,
      },
    };
  }
  const data = {
    name: d.name,
    slug,
    description: d.description,
    nameHi: d.nameHi || null,
    descriptionHi: d.descriptionHi || null,
    features: (d.features ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    price: d.price,
    compareAtPrice: d.compareAtPrice ?? null,
    stock: d.stock,
    material: d.material || null,
    color: d.color || null,
    dimensions: d.dimensions || null,
    weightGrams: d.weightGrams ?? null,
    modelUrl: d.modelUrl || null,
    categoryId: d.categoryId,
    isActive: d.isActive,
    isFeatured: d.isFeatured,
  };

  try {
    const product = id ? await prisma.product.update({ where: { id }, data }) : await prisma.product.create({ data });
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: product.id } }),
      prisma.productImage.createMany({
        data: imageUrls.map((url, i) => ({ productId: product.id, url, altText: product.name, displayOrder: i })),
      }),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, errors: { slug: "Another product already uses this URL slug." } };
    }
    throw e;
  }

  refreshCatalog(slug);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function archiveProduct(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const product = await prisma.product.update({ where: { id }, data: { isActive: false } });
  refreshCatalog(product.slug);
  revalidatePath("/admin/products");
}

const statusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(OrderStatus),
  courierName: z.string().trim().optional(),
  awbNumber: z.string().trim().optional(),
  trackingUrl: z.url().optional().or(z.literal("")),
  notify: z.boolean(),
});

export async function updateOrderStatus(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = statusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    courierName: formData.get("courierName") || undefined,
    awbNumber: formData.get("awbNumber") || undefined,
    trackingUrl: formData.get("trackingUrl") || "",
    notify: formData.get("notify") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;

  const before = await prisma.order.findUniqueOrThrow({ where: { id: d.orderId }, include: { items: true } });
  const wasStockHeld = ["PAID", "PROCESSING", "SHIPPED"].includes(before.status);
  const releasesStock = d.status === "CANCELLED" || d.status === "REFUNDED";

  const order = await prisma.$transaction(async (tx) => {
    // Return stock when a paid order is cancelled before delivery.
    if (wasStockHeld && releasesStock) {
      for (const item of before.items) {
        if (item.productId) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }
    }
    // Cash on delivery: the money arrives with the parcel.
    const cashCollected = d.status === "DELIVERED" && before.paymentMethod === "COD" && !before.paidAt;
    return tx.order.update({
      where: { id: d.orderId },
      data: { status: d.status, ...(cashCollected && { paidAt: new Date() }) },
    });
  });
  if (order.paymentMethod === "COD" && d.status === "DELIVERED") {
    await rewardReferrer(order.userId).catch((e) => console.error("[referral]", e));
  }
  if (wasStockHeld && releasesStock) refreshCatalog();

  if (d.awbNumber || d.courierName || d.trackingUrl || d.status === "SHIPPED" || d.status === "DELIVERED") {
    const now = new Date();
    const shippingData = {
      courierName: d.courierName || undefined,
      awbNumber: d.awbNumber || undefined,
      trackingUrl: d.trackingUrl || undefined,
      status: d.status,
      ...(d.status === "SHIPPED" && { shippedAt: now }),
      ...(d.status === "DELIVERED" && { deliveredAt: now }),
    };
    await prisma.shipping.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, ...shippingData },
      update: shippingData,
    });
  }

  // In the customer's language (chosen at checkout).
  const email = emailCopy(order.locale).status[d.status];
  if (d.notify && email) {
    await sendStatusUpdate(order, email[0], email[1]).catch((e) => console.error("[email]", e));
    await sendPush(order.userId, {
      title: email[0],
      body: `${order.orderNumber}: ${email[1]}`,
      url: `/account/orders/${order.orderNumber}`,
    }).catch((e) => console.error("[push]", e));
  }

  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");
  return {
    ok: true,
    message: `Order marked ${d.status.toLowerCase()}${d.notify && email ? " and customer notified" : ""}.`,
  };
}

export async function updateCustomOrder(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const status = z.enum(CustomOrderStatus).parse(formData.get("status"));
  const quoted = Number(formData.get("quotedPrice"));
  await prisma.customOrder.update({
    where: { id },
    data: {
      status,
      quotedPrice: Number.isFinite(quoted) && quoted > 0 ? Math.round(quoted) : null,
      adminNotes: String(formData.get("adminNotes") ?? "") || null,
    },
  });
  revalidatePath("/admin/requests");
}

export async function toggleMessageRead(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const msg = await prisma.contactMessage.findUniqueOrThrow({ where: { id } });
  await prisma.contactMessage.update({ where: { id }, data: { isRead: !msg.isRead } });
  revalidatePath("/admin/requests");
}

export async function createCoupon(_: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const blankToUndef = (k: string) => (formData.get(k) ? formData.get(k) : undefined);
  const expires = formData.get("expiresAt") ? new Date(String(formData.get("expiresAt"))).toISOString() : undefined;
  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderValue: formData.get("minOrderValue") || 0,
    maxDiscount: blankToUndef("maxDiscount"),
    usageLimit: blankToUndef("usageLimit"),
    expiresAt: expires,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.type === "PERCENTAGE" && d.value > 90) return { ok: false, message: "Percentage discounts are capped at 90%." };

  try {
    await prisma.coupon.create({ data: { ...d, expiresAt: d.expiresAt ? new Date(d.expiresAt) : null } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, message: "That code already exists." };
    }
    throw e;
  }
  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${d.code} created.` };
}

export async function toggleCoupon(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const c = await prisma.coupon.findUniqueOrThrow({ where: { id } });
  await prisma.coupon.update({ where: { id }, data: { isActive: !c.isActive } });
  revalidatePath("/admin/coupons");
}

async function refreshReviews(productId: string) {
  const p = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  updateTag("reviews");
  refreshCatalog(p?.slug);
  revalidatePath("/admin/reviews");
}

/** Hide a review from the storefront, or publish it again. */
export async function toggleReviewPublished(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const r = await prisma.review.findUniqueOrThrow({ where: { id } });
  await prisma.review.update({ where: { id }, data: { isPublished: !r.isPublished } });
  await refreshReviews(r.productId);
}

export async function deleteReview(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const r = await prisma.review.delete({ where: { id } });
  await refreshReviews(r.productId);
}

/** Marks a cash-on-delivery order as confirmed with the customer (phone / WhatsApp). */
export async function confirmCodOrder(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  await prisma.order.updateMany({
    where: { id, paymentMethod: "COD", codConfirmedAt: null },
    data: { codConfirmedAt: new Date() },
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

/** Moves a return/damage request along and (optionally) emails the customer. */
export async function updateReturn(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const status = z.enum(ReturnStatus).parse(formData.get("status"));
  const adminNotes = String(formData.get("adminNotes") ?? "").trim() || null;
  const r = await prisma.returnRequest.update({
    where: { id },
    data: { status, adminNotes },
    include: { order: { select: { orderNumber: true, email: true, locale: true } } },
  });
  const c = emailCopy(r.order.locale);
  const message = c.returnStatus[status];
  if (message && formData.get("notify") === "on") {
    await sendCustomerNote(
      r.order.email,
      c.returnSubject(r.order.orderNumber),
      `${message}${adminNotes ? `\n\n${adminNotes}` : ""}`,
      { label: c.viewOrder, path: `/account/orders/${r.order.orderNumber}` }
    ).catch((e) => console.error("[email] return update", e));
  }
  revalidatePath("/admin/returns");
}

export type ShipResult = { ok: boolean; message: string };

/** Books the shipment with Shiprocket (courier + AWB) and saves the tracking details. */
export async function createShiprocketShipment(_: ShipResult | null, formData: FormData): Promise<ShipResult> {
  await assertAdmin();
  if (!shiprocketEnabled()) return { ok: false, message: "Add the SHIPROCKET_* settings first." };
  const id = String(formData.get("id"));
  const order = await prisma.order.findUniqueOrThrow({
    where: { id },
    include: { items: { include: { product: { select: { weightGrams: true } } } }, shipping: true },
  });
  if (order.shipping?.awbNumber) return { ok: false, message: "This order already has an AWB." };
  if (!["PAID", "PROCESSING"].includes(order.status)) {
    return { ok: false, message: "Only paid or processing orders can be shipped." };
  }

  // Unknown weights fall back to 250 g per item; packaging adds ~80 g.
  const weight = order.items.reduce((g, i) => g + (i.product?.weightGrams ?? 250) * i.quantity, 80);
  try {
    const r = await shipOrder(order, weight);
    const data = {
      shiprocketOrderId: String(r.shipmentId), // stores the shipment id, needed for labels
      awbNumber: r.awbCode ?? undefined,
      courierName: r.courierName ?? undefined,
      trackingUrl: r.awbCode ? `https://shiprocket.co/tracking/${r.awbCode}` : undefined,
    };
    await prisma.shipping.upsert({ where: { orderId: id }, create: { orderId: id, ...data }, update: data });
    revalidatePath(`/admin/orders/${id}`);
    return r.awbCode
      ? { ok: true, message: `Booked with ${r.courierName} · AWB ${r.awbCode}. Print the label, then mark it shipped.` }
      : { ok: true, message: "Shipment created, but no courier was assigned yet. Pick one in the Shiprocket panel." };
  } catch (err) {
    console.error("[shiprocket] create shipment", err);
    return { ok: false, message: err instanceof Error ? err.message.slice(0, 300) : "Shiprocket request failed." };
  }
}

/** Opens Shiprocket's printable shipping label for this order. */
export async function shiprocketLabel(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id"));
  const shipping = await prisma.shipping.findUnique({ where: { orderId: id } });
  if (!shipping?.shiprocketOrderId) throw new Error("No Shiprocket shipment for this order");
  const res = await generateLabel(Number(shipping.shiprocketOrderId));
  if (!res?.label_url) throw new Error("Shiprocket didn't return a label");
  redirect(res.label_url);
}
