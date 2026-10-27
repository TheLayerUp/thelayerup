"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { getSession } from "@/server/session";
import { signOut } from "@/server/auth";
import type { FormState } from "./public";

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
