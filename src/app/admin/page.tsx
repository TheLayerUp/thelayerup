import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { StatusBadge } from "@/components/orders/OrderView";
import RevenueChart from "@/components/admin/RevenueChart";
import { formatDate, formatPrice } from "@/lib/utils";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const DAYS = 14;

// IST day key, so "today" matches the shop's calendar rather than UTC.
function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

async function loadDashboard() {
  const since = new Date(Date.now() - DAYS * 86_400_000);

  const [recentPaid, recentOrders, lowStock, customers, openRequests, toShip] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: [...PAID_STATUSES] }, paidAt: { gte: since } },
      select: { total: true, paidAt: true },
    }),
    prisma.order.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, name: true, stock: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.customOrder.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING"] } } }),
  ]);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = DAYS - 1; i >= 0; i--) {
    byDay.set(dayKey(new Date(Date.now() - i * 86_400_000)), { revenue: 0, orders: 0 });
  }
  for (const o of recentPaid) {
    const k = dayKey(o.paidAt!);
    const bucket = byDay.get(k);
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }
  const series = [...byDay.entries()].map(([day, v]) => ({ day, ...v }));
  return { series, recentOrders, lowStock, customers, openRequests, toShip };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const { series, recentOrders, lowStock, customers, openRequests, toShip } = await loadDashboard();
  const today = series.at(-1)!;
  const last7 = series.slice(-7);
  const rev7 = last7.reduce((s, d) => s + d.revenue, 0);
  const orders7 = last7.reduce((s, d) => s + d.orders, 0);

  const kpis = [
    {
      label: "Revenue today",
      value: formatPrice(today.revenue),
      sub: `${today.orders} order${today.orders === 1 ? "" : "s"}`,
    },
    { label: "Revenue · 7 days", value: formatPrice(rev7), sub: `${orders7} orders` },
    {
      label: "Avg order value · 7d",
      value: orders7 ? formatPrice(Math.round(rev7 / orders7)) : "—",
      sub: "paid orders",
    },
    { label: "To fulfil", value: String(toShip), sub: "paid or printing", href: "/admin/orders?status=PAID" },
    { label: "New custom requests", value: String(openRequests), sub: "awaiting a quote", href: "/admin/requests" },
    { label: "Customers", value: String(customers), sub: "registered" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const body = (
            <>
              <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums">{k.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
            </>
          );
          return k.href ? (
            <Link
              key={k.label}
              href={k.href}
              className="rounded-2xl border border-border bg-surface p-4 hover:border-primary/50"
            >
              {body}
            </Link>
          ) : (
            <div key={k.label} className="rounded-2xl border border-border bg-surface p-4">
              {body}
            </div>
          );
        })}
      </div>

      <section className="rounded-3xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Daily revenue · last {DAYS} days</h2>
        <p className="text-sm text-muted-foreground">Paid orders, by payment date (IST)</p>
        <RevenueChart data={series} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-3xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
              All orders →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-border">
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-primary-strong">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="hidden py-2.5 text-muted-foreground sm:table-cell">{o.shipName}</td>
                    <td className="hidden py-2.5 text-muted-foreground md:table-cell">{formatDate(o.createdAt)}</td>
                    <td className="py-2.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-2.5 text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" /> Low stock
          </h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Everything is well stocked.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="hover:text-primary-strong">
                    {p.name}
                  </Link>
                  <span className={p.stock <= 0 ? "font-semibold text-destructive" : "font-semibold text-warning"}>
                    {p.stock <= 0 ? "Out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
