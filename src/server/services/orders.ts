import "server-only";
import crypto from "node:crypto";
import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { shippingFor, site } from "@/config/site";
import { couponDiscount, couponProblem } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { notifyStore, sendOrderConfirmation } from "@/server/email";
import { rewardReferrer } from "@/server/services/referrals";
import type { CheckoutInput } from "@/lib/validators";

export type PricedLine = {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type PricedCart = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: { id: string; code: string } | null;
  problems: string[];
};

/**
 * Prices a cart from the database. Client-supplied prices are never trusted:
 * the browser only tells us which products and how many.
 */
export async function priceCart(
  items: { productId: string; quantity: number }[],
  couponCode?: string
): Promise<PricedCart> {
  const problems: string[] = [];
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { images: { orderBy: { displayOrder: "asc" }, take: 1 } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: PricedLine[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || !p.isActive) {
      problems.push("An item in your cart is no longer available and was removed.");
      continue;
    }
    if (p.stock <= 0) {
      problems.push(`${p.name} is sold out.`);
      continue;
    }
    const quantity = Math.min(item.quantity, p.stock);
    if (quantity < item.quantity) {
      problems.push(`Only ${p.stock} of ${p.name} left — quantity adjusted.`);
    }
    lines.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images[0]?.url ?? null,
      unitPrice: p.price,
      quantity,
      lineTotal: p.price * quantity,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  let discount = 0;
  let coupon: PricedCart["coupon"] = null;
  if (couponCode) {
    const result = await evaluateCoupon(couponCode, subtotal);
    if (result.ok) {
      discount = result.discount;
      coupon = { id: result.id, code: result.code };
    } else {
      problems.push(result.reason);
    }
  }

  const shipping = shippingFor(subtotal - discount);
  return {
    lines,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    coupon,
    problems,
  };
}

export async function evaluateCoupon(
  code: string,
  subtotal: number
): Promise<{ ok: true; id: string; code: string; discount: number } | { ok: false; reason: string }> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!coupon) return { ok: false, reason: "That coupon code isn't valid." };
  const problem = couponProblem(coupon, subtotal);
  if (problem) return { ok: false, reason: problem };
  const discount = couponDiscount(coupon, subtotal);
  return { ok: true, id: coupon.id, code: coupon.code, discount };
}

function newOrderNumber() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${site.orderPrefix}-${out}`;
}

export async function createPendingOrder(
  userId: string,
  email: string,
  input: CheckoutInput,
  priced: PricedCart,
  codFee = 0
) {
  const { address } = input;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.order.create({
        data: {
          orderNumber: newOrderNumber(),
          locale: input.locale,
          userId,
          email,
          subtotal: priced.subtotal,
          discount: priced.discount,
          shippingCost: priced.shipping,
          codFee,
          total: priced.total + codFee,
          paymentMethod: codFee ? "COD" : "RAZORPAY",
          notes: input.notes || null,
          couponId: priced.coupon?.id,
          couponCode: priced.coupon?.code,
          shipName: address.fullName,
          shipPhone: address.phone,
          shipLine1: address.line1,
          shipLine2: address.line2 || null,
          shipCity: address.city,
          shipState: address.state,
          shipPincode: address.pincode,
          items: {
            create: priced.lines.map((l) => ({
              productId: l.productId,
              productName: l.name,
              productImage: l.image,
              quantity: l.quantity,
              priceAtPurchase: l.unitPrice,
            })),
          },
        },
      });
    } catch (e) {
      const isCollision =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        String(e.meta?.target).includes("orderNumber");
      if (!isCollision) throw e;
    }
  }
  throw new Error("Could not allocate an order number");
}

/**
 * Marks an order paid exactly once, decrementing stock and coupon usage in the
 * same transaction. Safe to call from both the client verify step and the
 * Razorpay webhook — whichever arrives second is a no-op.
 *
 * Stock is checked again here because it can run out between checkout and
 * payment (two shoppers paying for the last unit). The customer has already
 * paid, so the order stays PAID; stock is clamped at 0 and the store is told
 * to restock or refund.
 */
export async function markOrderPaid(orderId: string, payment: { razorpayPaymentId?: string; method: string }) {
  return confirmOrder(orderId, {
    status: "PAID",
    paidAt: new Date(),
    paymentMethod: payment.method,
    razorpayPaymentId: payment.razorpayPaymentId,
  });
}

/**
 * Places a cash-on-delivery order: it goes straight to PROCESSING, unpaid.
 * paidAt is set when the order is marked delivered (cash collected).
 */
export async function placeCodOrder(orderId: string) {
  return confirmOrder(orderId, { status: "PROCESSING", paymentMethod: "COD" });
}

/** Claims a PENDING order once, then holds stock, counts the coupon and sends emails. */
async function confirmOrder(orderId: string, claim: Prisma.OrderUpdateManyMutationInput) {
  const oversold: string[] = [];
  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: claim,
    });
    if (claimed.count === 0) return null;

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    for (const item of order.items) {
      if (!item.productId) continue;
      const taken = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (taken.count === 0) {
        await tx.product.updateMany({ where: { id: item.productId }, data: { stock: 0 } });
        oversold.push(`${item.productName} × ${item.quantity}`);
      }
    }
    if (order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }
    return order;
  });

  if (updated) {
    revalidateTag("products", "max");
    // COD orders reward the referrer on delivery instead (see updateOrderStatus).
    if (claim.status === "PAID") {
      await rewardReferrer(updated.userId).catch((err) => console.error("[referral]", err));
    }
    await sendOrderConfirmation(updated).catch((err) => console.error("[email] order confirmation failed", err));
    const cod = updated.paymentMethod === "COD";
    await notifyStore(
      `New ${cod ? "COD " : ""}order ${updated.orderNumber} — ${formatPrice(updated.total)}`,
      [
        ...(cod ? [`💵 Cash on delivery: call or WhatsApp ${updated.shipPhone} to confirm before printing.`, ""] : []),
        `${updated.shipName}, ${updated.shipCity}`,
        ...updated.items.map((i) => `• ${i.productName} × ${i.quantity}`),
      ].join("\n"),
      `/admin/orders/${updated.id}`
    );
    if (oversold.length > 0) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "order paid without enough stock",
          order: updated.orderNumber,
          oversold,
        })
      );
      await notifyStore(
        `⚠️ Not enough stock for paid order ${updated.orderNumber}`,
        [
          "This order was placed, but stock ran out before it completed:",
          ...oversold.map((line) => `• ${line}`),
          "",
          "Print the extra units, or contact the customer and refund from the Razorpay dashboard.",
        ].join("\n"),
        `/admin/orders/${updated.id}`
      );
    }
  }
  return updated;
}
