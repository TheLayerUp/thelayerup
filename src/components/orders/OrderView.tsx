import Image from "next/image";
import { Check, ExternalLink } from "lucide-react";
import type { Order, OrderItem, OrderStatus, Shipping } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { PLACEHOLDER_IMAGE } from "@/server/queries/catalog";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "Order placed" },
  { status: "PROCESSING", label: "Printing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Confirmed",
  PROCESSING: "Printing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "DELIVERED"
      ? "success"
      : status === "CANCELLED" || status === "REFUNDED"
        ? "destructive"
        : status === "PENDING"
          ? "warning"
          : "soft";
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

export function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "PENDING" || status === "CANCELLED" || status === "REFUNDED") {
    return <StatusBadge status={status} />;
  }
  const current = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="grid grid-cols-4">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.status} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span
                className={cn(
                  "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn("mt-2 text-xs font-medium sm:text-sm", done ? "text-foreground" : "text-muted-foreground")}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type FullOrder = Order & { items: OrderItem[]; shipping: Shipping | null };

export default function OrderView({ order, showAddress = true }: { order: FullOrder; showAddress?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Order</p>
            <p className="font-display text-xl font-bold">{order.orderNumber}</p>
          </div>
          <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusTimeline status={order.status} />
        {order.shipping?.awbNumber && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-2 p-4 text-sm">
            <span>
              {order.shipping.courierName ?? "Courier"} · AWB <strong>{order.shipping.awbNumber}</strong>
            </span>
            {order.shipping.trackingUrl && (
              <a
                href={order.shipping.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-primary-strong"
              >
                Track with courier <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <Image
                    src={item.productImage ?? PLACEHOLDER_IMAGE}
                    alt={item.productName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-muted-foreground">
                    Qty {item.quantity} × {formatPrice(item.priceAtPurchase)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.quantity * item.priceAtPurchase)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                <dd>−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{order.shippingCost ? formatPrice(order.shippingCost) : "Free"}</dd>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        {showAddress && (
          <div className="h-fit rounded-3xl border border-border bg-surface p-6 text-sm">
            <h2 className="font-semibold">Shipping to</h2>
            <address className="mt-3 leading-relaxed text-muted-foreground not-italic">
              <span className="font-medium text-foreground">{order.shipName}</span>
              <br />
              {order.shipLine1}
              {order.shipLine2 && (
                <>
                  <br />
                  {order.shipLine2}
                </>
              )}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPincode}
              <br />
              {order.shipPhone}
            </address>
            {order.notes && (
              <>
                <h3 className="mt-4 font-semibold">Notes</h3>
                <p className="mt-1 text-muted-foreground">{order.notes}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
