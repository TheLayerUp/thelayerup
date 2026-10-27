import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import OrderView from "@/components/orders/OrderView";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Order" };

export default async function AdminOrder({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      shipping: true,
      user: { select: { name: true, email: true, _count: { select: { orders: true } } } },
    },
  });
  if (!order) notFound();

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/orders"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OrderView order={order} />

        <aside className="space-y-6">
          <OrderStatusForm
            orderId={order.id}
            status={order.status}
            courierName={order.shipping?.courierName ?? ""}
            awbNumber={order.shipping?.awbNumber ?? ""}
            trackingUrl={order.shipping?.trackingUrl ?? ""}
          />
          <div className="rounded-3xl border border-border bg-surface p-5 text-sm">
            <h2 className="font-semibold">Customer</h2>
            <p className="mt-2">{order.user.name ?? order.shipName}</p>
            <p className="text-muted-foreground">
              {order.user._count.orders} order{order.user._count.orders === 1 ? "" : "s"} total
            </p>
            <a href={`mailto:${order.email}`} className="mt-3 flex items-center gap-2 text-primary-strong">
              <Mail className="h-4 w-4" />
              {order.email}
            </a>
            <a href={`tel:+91${order.shipPhone}`} className="mt-1 flex items-center gap-2 text-primary-strong">
              <Phone className="h-4 w-4" />
              {order.shipPhone}
            </a>
            <h2 className="mt-5 font-semibold">Payment</h2>
            <p className="mt-1 text-muted-foreground">
              {order.paymentMethod}
              {order.paidAt && ` · paid ${formatDate(order.paidAt)}`}
            </p>
            {order.razorpayPaymentId && (
              <p className="mt-1 font-mono text-xs break-all text-muted-foreground">{order.razorpayPaymentId}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
