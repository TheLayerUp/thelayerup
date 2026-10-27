"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { getSession } from "@/server/session";
import { createPendingOrder, markOrderPaid, priceCart, type PricedCart } from "@/server/services/orders";
import { getRazorpay, razorpayEnabled, testPaymentsEnabled, verifyPaymentSignature } from "@/server/payments/razorpay";
import { cartLineSchema, checkoutSchema, type CheckoutInput } from "@/lib/validators";
import { site } from "@/config/site";
import { toPaise } from "@/lib/pricing";
import { RATE_LIMITED, rateLimit } from "@/server/security/rate-limit";

export async function quoteCart(
  items: { productId: string; quantity: number }[],
  couponCode?: string
): Promise<PricedCart> {
  const parsed = z.array(cartLineSchema).max(50).safeParse(items);
  if (!parsed.success) {
    return { lines: [], subtotal: 0, discount: 0, shipping: 0, total: 0, coupon: null, problems: ["Invalid cart"] };
  }
  return priceCart(parsed.data, couponCode || undefined);
}

export type StartCheckoutResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      amount: number;
      mode: "razorpay" | "test";
      razorpayOrderId?: string;
      razorpayKey?: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string; errors?: Record<string, string>; priced?: PricedCart };

export async function startCheckout(input: CheckoutInput): Promise<StartCheckoutResult> {
  const session = await getSession();
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: "Please sign in to continue." };
  }
  if (!(await rateLimit("checkout", session.user.id))) {
    return { ok: false, error: RATE_LIMITED };
  }
  if (!razorpayEnabled && !testPaymentsEnabled) {
    return { ok: false, error: "Payments are temporarily unavailable. Please try again shortly." };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Please fix the highlighted fields.", errors };
  }
  const data = parsed.data;

  const priced = await priceCart(data.items, data.couponCode);
  if (priced.lines.length === 0) {
    return { ok: false, error: "Your cart is empty.", priced };
  }
  // If anything changed since the shopper last saw the totals, show them first.
  const changed =
    priced.problems.length > 0 ||
    priced.lines.length !== data.items.length ||
    priced.lines.some((l) => data.items.find((i) => i.productId === l.productId)?.quantity !== l.quantity);
  if (changed) {
    return { ok: false, error: priced.problems[0] ?? "Your cart was updated. Please review it.", priced };
  }

  const userId = session.user.id;
  if (data.saveAddress) {
    const count = await prisma.address.count({ where: { userId } });
    await prisma.address.create({
      data: { ...data.address, line2: data.address.line2 || null, userId, isDefault: count === 0 },
    });
  }

  const order = await createPendingOrder(userId, session.user.email, data, priced);

  const prefill = {
    name: data.address.fullName,
    email: session.user.email,
    // Razorpay only prefills the contact field when it includes the country code.
    contact: `+91${data.address.phone}`,
  };

  if (!razorpayEnabled) {
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber, amount: order.total, mode: "test", prefill };
  }

  const rzpOrder = await getRazorpay().orders.create({
    amount: toPaise(order.total),
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order.id },
  });
  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzpOrder.id } });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    mode: "razorpay",
    razorpayOrderId: rzpOrder.id,
    razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    prefill,
  };
}

const confirmSchema = z.object({
  orderId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function confirmRazorpayPayment(
  input: z.infer<typeof confirmSchema>
): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  const session = await getSession();
  const parsed = confirmSchema.safeParse(input);
  if (!session?.user?.id || !parsed.success) return { ok: false, error: "Invalid request" };
  const p = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: p.orderId, userId: session.user.id, razorpayOrderId: p.razorpay_order_id },
  });
  if (!order) return { ok: false, error: "Order not found" };

  if (!verifyPaymentSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature)) {
    return {
      ok: false,
      error: "Payment could not be verified. If money was deducted, it will be refunded automatically.",
    };
  }

  await markOrderPaid(order.id, { razorpayPaymentId: p.razorpay_payment_id, method: "RAZORPAY" });
  return { ok: true, orderNumber: order.orderNumber };
}

export async function confirmTestPayment(
  orderId: string
): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  if (!testPaymentsEnabled) return { ok: false, error: "Test payments are disabled." };
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id } });
  if (!order) return { ok: false, error: "Order not found" };

  await markOrderPaid(order.id, { method: "TEST" });
  return { ok: true, orderNumber: order.orderNumber };
}

export async function getCheckoutConfig() {
  return {
    mode: razorpayEnabled ? "razorpay" : testPaymentsEnabled ? "test" : "disabled",
    freeShippingAbove: site.shipping.freeAbove,
  } as const;
}
