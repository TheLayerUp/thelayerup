// Pure money rules — no I/O, so they're unit-tested in pricing.test.ts.
// All amounts are whole rupees.

export type CouponRule = {
  code: string;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
};

/** Why a coupon can't be used right now, or null if it can. */
export function couponProblem(c: CouponRule, subtotal: number, now = new Date()): string | null {
  if (!c.isActive) return "That coupon code isn't valid.";
  if (c.expiresAt && c.expiresAt < now) return "That coupon has expired.";
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return "That coupon has reached its usage limit.";
  if (subtotal < c.minOrderValue) return `Add items worth ₹${c.minOrderValue - subtotal} more to use ${c.code}.`;
  return null;
}

/** Discount in rupees: percentages round down, capped by maxDiscount and the subtotal. */
export function couponDiscount(c: Pick<CouponRule, "type" | "value" | "maxDiscount">, subtotal: number): number {
  let discount = c.type === "PERCENTAGE" ? Math.floor((subtotal * c.value) / 100) : c.value;
  if (c.maxDiscount !== null) discount = Math.min(discount, c.maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}

/** Amount in paise for Razorpay. Throws on anything that isn't whole rupees. */
/** COD fee for an order total, or null when COD isn't offered for it. */
export function codFeeFor(total: number, cod: { enabled: boolean; fee: number; maxOrder: number }): number | null {
  if (!cod.enabled || total <= 0 || total > cod.maxOrder) return null;
  return cod.fee;
}

export function toPaise(rupees: number): number {
  if (!Number.isInteger(rupees) || rupees < 0) throw new Error(`Invalid rupee amount: ${rupees}`);
  return rupees * 100;
}
