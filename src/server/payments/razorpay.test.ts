import crypto from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

let mod: typeof import("./razorpay");

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_unit");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "unit-secret");
  vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "unit-webhook-secret");
  mod = await import("./razorpay");
});

const hmac = (secret: string, data: string) => crypto.createHmac("sha256", secret).update(data).digest("hex");

describe("verifyPaymentSignature", () => {
  it("accepts Razorpay's order|payment HMAC", () => {
    expect(mod.verifyPaymentSignature("order_1", "pay_1", hmac("unit-secret", "order_1|pay_1"))).toBe(true);
  });
  it("rejects a signature for a different order", () => {
    expect(mod.verifyPaymentSignature("order_2", "pay_1", hmac("unit-secret", "order_1|pay_1"))).toBe(false);
  });
  it("rejects garbage without throwing", () => {
    expect(mod.verifyPaymentSignature("order_1", "pay_1", "nope")).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts the raw-body HMAC and rejects tampering", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(mod.verifyWebhookSignature(body, hmac("unit-webhook-secret", body))).toBe(true);
    expect(mod.verifyWebhookSignature(body + " ", hmac("unit-webhook-secret", body))).toBe(false);
  });
});

describe("test payments", () => {
  it("are disabled whenever real Razorpay keys exist", () => {
    expect(mod.razorpayEnabled).toBe(true);
    expect(mod.testPaymentsEnabled).toBe(false);
  });
});
