import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { HONEYPOT_FIELD } from "@/lib/honeypot";

type Rule = { limit: number; windowSec: number };

// Per-IP budgets. Generous enough for real shoppers, tight enough to stop scripts.
export const RULES = {
  login: { limit: 10, windowSec: 15 * 60 },
  register: { limit: 5, windowSec: 60 * 60 },
  passwordReset: { limit: 5, windowSec: 60 * 60 },
  contact: { limit: 5, windowSec: 60 * 60 },
  customOrder: { limit: 5, windowSec: 60 * 60 },
  newsletter: { limit: 5, windowSec: 60 * 60 },
  track: { limit: 30, windowSec: 15 * 60 },
  checkout: { limit: 20, windowSec: 15 * 60 },
  pincode: { limit: 30, windowSec: 15 * 60 },
} satisfies Record<string, Rule>;

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window counter stored in Postgres, so it holds across serverless
 * instances without extra infrastructure. Returns true when allowed.
 */
export async function rateLimit(name: keyof typeof RULES, id?: string): Promise<boolean> {
  const rule = RULES[name];
  const key = `${name}:${id ?? (await clientIp())}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + rule.windowSec * 1000);

  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    // Occasionally sweep expired windows so the table stays small.
    if (Math.random() < 0.01) {
      await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
    }
    return rows[0].count <= rule.limit;
  } catch (err) {
    // Never lock customers out because the limiter itself failed.
    console.error("[rate-limit]", err);
    return true;
  }
}

export const RATE_LIMITED = "Too many attempts. Please wait a few minutes and try again.";

export function isBot(formData: FormData) {
  return Boolean(formData.get(HONEYPOT_FIELD));
}
