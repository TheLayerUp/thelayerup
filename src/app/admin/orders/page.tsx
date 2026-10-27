import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { STATUS_LABEL, StatusBadge } from "@/components/orders/OrderView";
import { cn, formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Orders" };

const FILTERS: (OrderStatus | "ALL")[] = ["ALL", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "PENDING"];

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = FILTERS.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : "ALL";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const orders = await prisma.order.findMany({
    where: {
      // Abandoned checkouts are hidden unless explicitly asked for.
      status: status === "ALL" ? { not: "PENDING" } : status,
      ...(q && {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { shipName: { contains: q, mode: "insensitive" } },
          { shipPhone: { contains: q } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">Orders</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "ALL" ? "/admin/orders" : `/admin/orders?status=${f}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap",
                status === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "ALL" ? "All" : f === "PENDING" ? "Abandoned" : STATUS_LABEL[f]}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Order #, email, name, phone"
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary sm:w-64"
          />
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-surface">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No orders match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2">
                  <td className="p-4">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary-strong">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-4">
                    <p>{o.shipName}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.shipCity}, {o.shipState}
                    </p>
                  </td>
                  <td className="p-4 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="p-4 text-muted-foreground">{o._count.items}</td>
                  <td className="p-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-4 text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
