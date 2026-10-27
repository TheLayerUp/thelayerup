import { z } from "zod";

const DEV_SECRET_PREFIX = "dev-only-secret";

const productionSchema = z.object({
  POSTGRES_PRISMA_URL: z.string().startsWith("postgres"),
  DATABASE_URL_UNPOOLED: z.string().startsWith("postgres"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters (run `npx auth secret`)")
    .refine((v) => !v.startsWith(DEV_SECRET_PREFIX), "AUTH_SECRET is still the local dev value"),
  NEXT_PUBLIC_APP_URL: z.url().startsWith("https://", "NEXT_PUBLIC_APP_URL must be https in production"),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().startsWith("rzp_"),
  RAZORPAY_KEY_SECRET: z.string().min(10),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(8, "Set RAZORPAY_WEBHOOK_SECRET from the Razorpay dashboard"),
});

/**
 * Fails fast at server start in production when configuration is missing,
 * instead of failing at the first checkout. Called from instrumentation.ts.
 */
export function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;
  const result = productionSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid production environment:\n${problems}`);
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("[env] RESEND_API_KEY is not set — order and password-reset emails will NOT be sent.");
  }
  if (!process.env.STORE_NOTIFY_EMAIL) {
    console.warn("[env] STORE_NOTIFY_EMAIL is not set — you will NOT be emailed about new orders or payment problems.");
  }
  if (!process.env.CRON_SECRET) {
    console.warn("[env] CRON_SECRET is not set — the daily cleanup job will be rejected.");
  }
  if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith("rzp_test_")) {
    console.warn("[env] Razorpay is in TEST mode — no real money will be collected.");
  }
}
