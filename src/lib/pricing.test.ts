import { describe, expect, it } from "vitest";
import { couponDiscount, couponProblem, toPaise, type CouponRule } from "./pricing";
import { shippingFor } from "@/config/site";
import { isAllowedImageUrl } from "@/config/images";
import { addressSchema, checkoutSchema } from "./validators";

const base: CouponRule = {
  code: "TEST",
  type: "PERCENTAGE",
  value: 10,
  minOrderValue: 0,
  maxDiscount: null,
  usageLimit: null,
  usedCount: 0,
  expiresAt: null,
  isActive: true,
};

describe("couponDiscount", () => {
  it("rounds percentage discounts down to whole rupees", () => {
    expect(couponDiscount({ ...base, value: 10 }, 3297)).toBe(329);
  });
  it("caps percentage discounts at maxDiscount", () => {
    expect(couponDiscount({ ...base, value: 10, maxDiscount: 300 }, 3297)).toBe(300);
  });
  it("never discounts more than the subtotal", () => {
    expect(couponDiscount({ ...base, type: "FLAT", value: 500 }, 299)).toBe(299);
  });
  it("applies flat discounts as-is", () => {
    expect(couponDiscount({ ...base, type: "FLAT", value: 150 }, 1499)).toBe(150);
  });
});

describe("couponProblem", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  it("accepts a valid coupon", () => {
    expect(couponProblem(base, 1000, now)).toBeNull();
  });
  it("rejects inactive, expired and used-up coupons", () => {
    expect(couponProblem({ ...base, isActive: false }, 1000, now)).toMatch(/isn't valid/);
    expect(couponProblem({ ...base, expiresAt: new Date("2026-10-01") }, 1000, now)).toMatch(/expired/);
    expect(couponProblem({ ...base, usageLimit: 5, usedCount: 5 }, 1000, now)).toMatch(/usage limit/);
  });
  it("tells the shopper how much more to add for a minimum order", () => {
    expect(couponProblem({ ...base, minOrderValue: 1499 }, 1000, now)).toBe("Add items worth ₹499 more to use TEST.");
  });
});

describe("shippingFor", () => {
  it("is free from ₹999 and flat below", () => {
    expect(shippingFor(999)).toBe(0);
    expect(shippingFor(998)).toBe(79);
    expect(shippingFor(0)).toBe(0);
  });
});

describe("toPaise", () => {
  it("converts whole rupees", () => expect(toPaise(2997)).toBe(299700));
  it("refuses fractional or negative amounts", () => {
    expect(() => toPaise(10.5)).toThrow();
    expect(() => toPaise(-1)).toThrow();
  });
});

describe("validators", () => {
  const address = {
    fullName: "Asha",
    phone: "+91 98401 23456",
    line1: "12 Test Street",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600040",
  };
  it("normalises Indian phone numbers", () => {
    expect(addressSchema.parse(address).phone).toBe("9840123456");
  });
  it("rejects bad pincodes and phones", () => {
    expect(addressSchema.safeParse({ ...address, pincode: "6000" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...address, phone: "12345" }).success).toBe(false);
  });
  it("caps per-line quantity", () => {
    const r = checkoutSchema.safeParse({ address, items: [{ productId: "p1", quantity: 999 }] });
    expect(r.success).toBe(false);
  });
});

describe("isAllowedImageUrl", () => {
  it("allows local paths and whitelisted https hosts only", () => {
    expect(isAllowedImageUrl("/images/products/a.svg")).toBe(true);
    expect(isAllowedImageUrl("https://res.cloudinary.com/x/y.jpg")).toBe(true);
    expect(isAllowedImageUrl("http://res.cloudinary.com/x/y.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://evil.example.com/a.png")).toBe(false);
    expect(isAllowedImageUrl("//evil.example.com/a.png")).toBe(false);
  });
});
