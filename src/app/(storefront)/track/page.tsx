import { Suspense } from "react";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { prisma } from "@/server/db";
import { trackSchema } from "@/lib/validators";
import { RATE_LIMITED, rateLimit } from "@/server/security/rate-limit";
import OrderView from "@/components/orders/OrderView";
import { trackingEvents } from "@/server/shipping/shiprocket";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your TheLayerUp order.",
};

export default function TrackPage({ searchParams }: PageProps<"/track">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <PackageSearch className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Track your order</h1>
        <p className="mt-2 text-muted-foreground">Enter your order number and the email you ordered with.</p>
      </div>
      <Suspense fallback={<Skeleton className="mx-auto mt-8 h-40 max-w-xl rounded-3xl" />}>
        <Tracker searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Tracker({ searchParams }: Pick<PageProps<"/track">, "searchParams">) {
  const sp = await searchParams;
  const orderParam = typeof sp.order === "string" ? sp.order : "";
  const emailParam = typeof sp.email === "string" ? sp.email : "";

  const parsed = trackSchema.safeParse({ orderNumber: orderParam, email: emailParam });
  // Lookups are rate limited so order numbers can't be brute-forced.
  const limited = parsed.success && !(await rateLimit("track"));
  const order =
    parsed.success && !limited
      ? await prisma.order.findFirst({
          where: {
            orderNumber: parsed.data.orderNumber,
            email: { equals: parsed.data.email, mode: "insensitive" },
            status: { not: "PENDING" },
          },
          include: { items: true, shipping: true },
        })
      : null;
  const searched = Boolean(orderParam && emailParam);
  // Live courier scans when Shiprocket is connected and the parcel has an AWB.
  const events =
    order?.shipping?.awbNumber && ["SHIPPED", "DELIVERED"].includes(order.status)
      ? await trackingEvents(order.shipping.awbNumber)
      : null;

  return (
    <>
      <form
        method="GET"
        className="mx-auto mt-8 grid max-w-xl gap-4 rounded-3xl border border-border bg-surface p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <Label htmlFor="order">Order number</Label>
          <Input
            id="order"
            name="order"
            placeholder="TLU-XXXXXX"
            defaultValue={orderParam}
            required
            className="uppercase"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={emailParam} required />
        </div>
        <Button type="submit">Track</Button>
      </form>

      {limited && (
        <p className="mt-6 text-center text-sm text-destructive" role="alert">
          {RATE_LIMITED}
        </p>
      )}
      {searched && !order && !limited && (
        <p className="mt-6 text-center text-sm text-destructive" role="alert">
          We couldn&apos;t find an order with those details. Check the order number in your confirmation email.
        </p>
      )}
      {order && (
        <div className="mt-10">
          <OrderView order={order} showAddress={false} />
          {events && events.length > 0 && (
            <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
              <h2 className="font-semibold">Courier updates</h2>
              <ol className="mt-4 space-y-4 border-l-2 border-border pl-5">
                {events.slice(0, 12).map((e, i) => (
                  <li key={`${e.at}-${i}`} className="relative text-sm">
                    <span
                      className={`absolute top-1.5 -left-[27px] h-3 w-3 rounded-full ${i === 0 ? "bg-primary" : "bg-border"}`}
                    />
                    <p className="font-medium">{e.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.location} · {e.at}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </>
  );
}
