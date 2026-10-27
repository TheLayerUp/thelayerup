"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { CustomOrderStatus, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { assertAdmin } from "@/server/session";
import { couponSchema, productSchema } from "@/lib/validators";
import { sendStatusUpdate } from "@/server/email";
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
  const badUrl = imageUrls.find((u) => !isAllowedImageUrl(u));
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

const STATUS_EMAILS: Partial<Record<OrderStatus, [string, string]>> = {
  PROCESSING: [
    "Your order is being printed",
    "Good news — your order is on the print bed. We'll let you know as soon as it ships.",
  ],
  SHIPPED: ["Your order has shipped", "Your order is on its way! Use the tracking link below to follow it."],
  DELIVERED: [
    "Your order was delivered",
    "Your order has been delivered. We hope you love it — reply to this email if anything's not right.",
  ],
  CANCELLED: [
    "Your order was cancelled",
    "Your order has been cancelled. If you were charged, a refund is on its way to your original payment method.",
  ],
};

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
    return tx.order.update({ where: { id: d.orderId }, data: { status: d.status } });
  });
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

  const email = STATUS_EMAILS[d.status];
  if (d.notify && email) {
    await sendStatusUpdate(order, email[0], email[1]).catch((e) => console.error("[email]", e));
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
