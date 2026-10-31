import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import RevenueChart from "@/components/admin/RevenueChart";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const RANGES = [7, 30, 90] as const;

function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

async function loadAnalytics(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const paidWhere = { status: { in: [...PAID_STATUSES] }, paidAt: { gte: since } };

  const [paid, started, items, priorBuyers] = await Promise.all([
    prisma.order.findMany({
      where: paidWhere,
      select: { total: true, paidAt: true, userId: true, shipState: true, discount: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.orderItem.findMany({
      where: { order: paidWhere },
      select: {
        productId: true,
        productName: true,
        quantity: true,
        priceAtPurchase: true,
        product: { select: { category: { select: { name: true } } } },
      },
    }),
    // Customers who had paid before this window, to tell new from returning buyers.
    prisma.order.findMany({
      where: { status: { in: [...PAID_STATUSES] }, paidAt: { lt: since } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--)
    byDay.set(dayKey(new Date(Date.now() - i * 86_400_000)), { revenue: 0, orders: 0 });
  for (const o of paid) {
    const b = byDay.get(dayKey(o.paidAt!));
    if (b) {
      b.revenue += o.total;
      b.orders += 1;
    }
  }

  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const discounts = paid.reduce((s, o) => s + o.discount, 0);

  const ordersPerBuyer = new Map<string, number>();
  for (const o of paid) ordersPerBuyer.set(o.userId, (ordersPerBuyer.get(o.userId) ?? 0) + 1);
  const earlier = new Set(priorBuyers.map((b) => b.userId));
  const returning = [...ordersPerBuyer].filter(([id, n]) => n > 1 || earlier.has(id)).length;

  const tally = <K extends string>(rows: { key: K; revenue: number; units: number }[]) => {
    const m = new Map<K, { revenue: number; units: number }>();
    for (const r of rows) {
      const cur = m.get(r.key) ?? { revenue: 0, units: 0 };
      m.set(r.key, { revenue: cur.revenue + r.revenue, units: cur.units + r.units });
    }
    return [...m].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.revenue - a.revenue);
  };

  const topProducts = tally(
    items.map((i) => ({ key: i.productName, revenue: i.priceAtPurchase * i.quantity, units: i.quantity }))
  ).slice(0, 8);
  const categories = tally(
    items.map((i) => ({
      key: i.product?.category.name ?? "Archived",
      revenue: i.priceAtPurchase * i.quantity,
      units: i.quantity,
    }))
  );
  const states = tally(paid.map((o) => ({ key: o.shipState, revenue: o.total, units: 1 }))).slice(0, 10);

  return {
    series: [...byDay].map(([day, v]) => ({ day, ...v })),
    revenue,
    discounts,
    orders: paid.length,
    started,
    buyers: ordersPerBuyer.size,
    returning,
    topProducts,
    categories,
    states,
  };
}

function BarList({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: { key: string; revenue: number; units: number }[];
  unit: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <section className="rounded-3xl border border-border bg-surface p-6">
      <h2 className="font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No paid orders in this period.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="flex justify-between gap-3">
                <span className="truncate">{r.key}</span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatPrice(r.revenue)}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {r.units} {unit}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-chart-1" style={{ width: `${(r.revenue / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireAdmin();
  const { range } = await searchParams;
  const days = RANGES.find((r) => String(r) === range) ?? 30;
  const a = await loadAnalytics(days);

  const kpis = [
    { label: "Revenue", value: formatPrice(a.revenue), sub: `${a.orders} paid orders` },
    {
      label: "Avg order value",
      value: a.orders ? formatPrice(Math.round(a.revenue / a.orders)) : "—",
      sub: "per paid order",
    },
    { label: "Checkout → paid", value: pct(a.orders, a.started), sub: `${a.started} checkouts started` },
    { label: "Buyers", value: String(a.buyers), sub: `${pct(a.returning, a.buyers)} returning` },
    { label: "Discounts given", value: formatPrice(a.discounts), sub: "via coupons" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="flex rounded-full border border-border bg-surface p-1 text-sm" role="tablist">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              role="tab"
              aria-selected={r === days}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium",
                r === days ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r} days
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Daily revenue · last {days} days</h2>
        <p className="text-sm text-muted-foreground">Paid orders, by payment date (IST)</p>
        <RevenueChart data={a.series} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarList title="Top products" rows={a.topProducts} unit="sold" />
        <BarList title="Sales by state" rows={a.states} unit="orders" />
        <BarList title="By category" rows={a.categories} unit="sold" />
      </div>
    </div>
  );
}
