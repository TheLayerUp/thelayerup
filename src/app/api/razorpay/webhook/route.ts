import { prisma } from "@/server/db";
import { markOrderPaid } from "@/server/services/orders";
import { verifyWebhookSignature } from "@/server/payments/razorpay";
import { toPaise } from "@/lib/pricing";

/**
 * Razorpay webhook — backup path for when the customer closes the tab before
 * the client-side verify call completes. Configure in the Razorpay dashboard
 * with events: payment.captured, order.paid.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; status: string; amount: number } };
      order?: { entity: { id: string } };
    };
  };

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload.payment?.entity;
    const razorpayOrderId = payment?.order_id ?? event.payload.order?.entity.id;
    if (razorpayOrderId) {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
      if (order && payment && payment.amount !== toPaise(order.total)) {
        console.error(
          `[razorpay] amount mismatch for ${order.orderNumber}: paid ${payment.amount}, expected ${toPaise(order.total)}`
        );
      } else if (order) {
        // Idempotent: a no-op if the client verify step already marked it paid.
        await markOrderPaid(order.id, { razorpayPaymentId: payment?.id, method: "RAZORPAY" });
      }
    }
  }

  return Response.json({ received: true });
}
