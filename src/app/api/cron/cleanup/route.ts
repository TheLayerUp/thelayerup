import crypto from "node:crypto";
import { connection } from "next/server";
import { prisma } from "@/server/db";

// Unpaid orders older than this are abandoned checkouts. Razorpay payments
// complete within minutes, so a week leaves a wide margin for late webhooks.
const PENDING_ORDER_TTL_DAYS = 7;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/**
 * Daily housekeeping, triggered by Vercel Cron (see vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set in the project.
 */
export async function GET(request: Request) {
  await connection();
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const pendingBefore = new Date(now.getTime() - PENDING_ORDER_TTL_DAYS * 24 * 60 * 60 * 1000);

  const [orders, rateLimits, tokens] = await prisma.$transaction([
    prisma.order.deleteMany({ where: { status: "PENDING", createdAt: { lt: pendingBefore } } }),
    prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
  ]);

  const result = {
    abandonedOrders: orders.count,
    expiredRateLimits: rateLimits.count,
    expiredTokens: tokens.count,
  };
  console.info(JSON.stringify({ level: "info", message: "cron cleanup", ...result }));
  return Response.json(result);
}
