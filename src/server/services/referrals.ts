import "server-only";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { site } from "@/config/site";
import { sendCustomerNote } from "@/server/email";
import { emailCopy } from "@/server/email-copy";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rand = (n: number) => [...crypto.randomBytes(n)].map((b) => ALPHABET[b % ALPHABET.length]).join("");
const days = (n: number) => new Date(Date.now() + n * 86_400_000);
const isUniqueClash = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/** The user's shareable code (e.g. ARAVIND7K), created the first time it's needed. */
export async function ensureReferralCode(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true, name: true },
  });
  if (user.referralCode) return user.referralCode;
  const stem =
    (user.name ?? "")
      .replace(/[^a-z]/gi, "")
      .toUpperCase()
      .slice(0, 7) || "FRIEND";
  for (let i = 0; i < 5; i++) {
    const code = `${stem}${rand(2)}`;
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch (e) {
      if (!isUniqueClash(e)) throw e;
    }
  }
  throw new Error("Could not allocate a referral code");
}

async function createCoupon(prefix: string, data: Omit<Prisma.CouponCreateInput, "code">) {
  for (let i = 0; i < 5; i++) {
    try {
      return await prisma.coupon.create({ data: { ...data, code: `${prefix}-${rand(6)}` } });
    } catch (e) {
      if (!isUniqueClash(e)) throw e;
    }
  }
  throw new Error("Could not allocate a coupon code");
}

/**
 * Links a new account to the referrer and gives the friend a single-use welcome
 * coupon. Returns the coupon code, or null if the referral code is unknown.
 */
export async function applyReferral(newUserId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const referrer = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!referrer || referrer.id === newUserId) return null;

  const linked = await prisma.user.updateMany({
    where: { id: newUserId, referredById: null },
    data: { referredById: referrer.id },
  });
  if (linked.count === 0) return null;

  const r = site.referral;
  const coupon = await createCoupon("WELCOME", {
    type: "PERCENTAGE",
    value: r.friendPercent,
    maxDiscount: r.friendMaxDiscount,
    usageLimit: 1,
    expiresAt: days(60),
  });
  return coupon.code;
}

/**
 * Rewards the referrer once, the first time a referred customer's order is
 * confirmed as paid. Safe to call on every order: the claim is atomic.
 */
export async function rewardReferrer(friendUserId: string) {
  const claimed = await prisma.user.updateMany({
    where: { id: friendUserId, referredById: { not: null }, referralRewardedAt: null },
    data: { referralRewardedAt: new Date() },
  });
  if (claimed.count === 0) return;

  const friend = await prisma.user.findUniqueOrThrow({
    where: { id: friendUserId },
    select: { name: true, referredBy: { select: { email: true, locale: true } } },
  });
  if (!friend.referredBy) return;

  const r = site.referral;
  const coupon = await createCoupon("THANKS", {
    type: "FLAT",
    value: r.referrerFlat,
    minOrderValue: r.referrerMinOrder,
    usageLimit: 1,
    expiresAt: days(90),
  });
  const c = emailCopy(friend.referredBy.locale);
  await sendCustomerNote(
    friend.referredBy.email,
    c.rewardSubject(r.referrerFlat),
    c.rewardText(friend.name?.split(" ")[0] ?? c.yourFriend, r.referrerFlat, r.referrerMinOrder, coupon.code),
    { label: c.shopNow, path: "/products" }
  ).catch((e) => console.error("[email] referral reward", e));
}
