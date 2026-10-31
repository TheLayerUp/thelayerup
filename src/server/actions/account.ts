"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSession } from "@/server/session";
import { signOut } from "@/server/auth";
import type { FormState } from "./public";
import { site } from "@/config/site";
import { notifyStore } from "@/server/email";
import { returnWindowOpen } from "@/lib/returns";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function deleteAddress(formData: FormData) {
  const session = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!session?.user?.id || !id) return;
  await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath("/account");
}

export async function makeDefaultAddress(formData: FormData) {
  const session = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!session?.user?.id || !id) return;
  const userId = session.user.id;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.updateMany({ where: { id, userId }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account");
}

const reviewInput = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5, "Tell us a little more (5+ characters)").max(1000),
});

export async function submitReview(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, message: "Please sign in." };
  const parsed = reviewInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { productId, rating, comment } = parsed.data;
  const userId = session.user.id;

  // Only customers whose order for this product was delivered can review it.
  const delivered = await prisma.orderItem.findFirst({
    where: { productId, order: { userId, status: "DELIVERED" } },
    select: { id: true },
  });
  if (!delivered) return { ok: false, message: "You can review items once they've been delivered." };

  await prisma.review.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId, rating, comment, isVerifiedPurchase: true },
    update: { rating, comment },
  });
  updateTag("reviews");
  updateTag("products");
  return { ok: true, message: "Thanks for your review!" };
}

export type WishlistResult = { status: "added" | "removed" | "login" };

/** Adds or removes a product from the signed-in user's wishlist. */
export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  const session = await getSession();
  if (!session?.user?.id) return { status: "login" };
  const userId = session.user.id;
  const id = z.string().min(1).max(64).parse(productId);

  const removed = await prisma.wishlistItem.deleteMany({ where: { userId, productId: id } });
  if (removed.count === 0) {
    const product = await prisma.product.findFirst({ where: { id, isActive: true }, select: { id: true } });
    if (!product) return { status: "removed" };
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: id } },
      create: { userId, productId: id },
      update: {},
    });
  }
  revalidatePath("/account/wishlist");
  return { status: removed.count === 0 ? "added" : "removed" };
}

const returnInput = z.object({
  orderId: z.string().min(1),
  reason: z.enum(site.returns.reasons),
  details: z.string().trim().min(10, "Tell us what happened (10+ characters)").max(1000),
  photoUrl: z.url("Enter a valid link to your photos").optional().or(z.literal("")),
});

/** Damage / defect claim on a delivered order, within the policy window. */
export async function requestReturn(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, message: "Please sign in." };
  const parsed = returnInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: d.orderId, userId: session.user.id, status: "DELIVERED" },
    include: { shipping: true, returns: { where: { status: { in: ["REQUESTED", "APPROVED", "RECEIVED"] } } } },
  });
  if (!order) return { ok: false, message: "Returns are available on delivered orders." };
  if (!returnWindowOpen(order.shipping?.deliveredAt ?? order.updatedAt)) {
    return {
      ok: false,
      message: `The ${site.returns.windowHours}-hour window for this order has passed. Please contact us.`,
    };
  }
  if (order.returns.length > 0) return { ok: false, message: "You already have an open request for this order." };

  await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      userId: session.user.id,
      reason: d.reason,
      details: d.details,
      photoUrl: d.photoUrl || null,
    },
  });
  await notifyStore(
    `Return request for ${order.orderNumber}: ${d.reason}`,
    `${order.shipName} (${order.email})\n\n${d.details}${d.photoUrl ? `\n\nPhotos: ${d.photoUrl}` : ""}`,
    "/admin/returns"
  );
  revalidatePath(`/account/orders/${order.orderNumber}`);
  return { ok: true, message: "Request received. We'll reply within one business day with a reprint or refund." };
}

const pushInput = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Saves this browser's push subscription for order updates. */
export async function savePushSubscription(sub: unknown): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false };
  const parsed = pushInput.safeParse(sub);
  if (!parsed.success) return { ok: false };
  const { endpoint, keys } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: session.user.id },
  });
  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) return;
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });
}
