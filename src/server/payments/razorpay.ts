import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpayEnabled = Boolean(keyId && keySecret);

// Test-payment mode lets the full checkout run locally without Razorpay keys.
// It is never available in production.
export const testPaymentsEnabled = !razorpayEnabled && process.env.NODE_ENV !== "production";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayEnabled) throw new Error("Razorpay is not configured");
  client ??= new Razorpay({ key_id: keyId!, key_secret: keySecret! });
  return client;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", keySecret!).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

export function verifyWebhookSignature(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return safeEqual(expected, signature);
}
