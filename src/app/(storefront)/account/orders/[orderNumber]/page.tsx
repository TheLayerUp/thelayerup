import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";
import OrderView from "@/components/orders/OrderView";
import ReviewForm from "@/components/orders/ReviewForm";
import ReturnRequestForm from "@/components/orders/ReturnRequestForm";
import { Badge } from "@/components/ui/badge";
import { returnWindowOpen } from "@/lib/returns";
import { site } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/account/orders/[orderNumber]">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to account
      </Link>
      <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
        <Order params={params} />
      </Suspense>
    </div>
  );
}

async function Order({ params }: Pick<PageProps<"/account/orders/[orderNumber]">, "params">) {
  const { orderNumber } = await params;
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: true, shipping: true, returns: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const canReturn =
    order.status === "DELIVERED" &&
    returnWindowOpen(order.shipping?.deliveredAt ?? order.updatedAt) &&
    !order.returns.some((r) => ["REQUESTED", "APPROVED", "RECEIVED"].includes(r.status));

  const reviewable = order.status === "DELIVERED" ? order.items.filter((i) => i.productId) : [];
  const existing = reviewable.length
    ? await prisma.review.findMany({
        where: { userId: user.id, productId: { in: reviewable.map((i) => i.productId!) } },
        select: { productId: true, rating: true, comment: true },
      })
    : [];

  return (
    <>
      <OrderView order={order} />
      {order.returns.length > 0 && (
        <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Problem reports</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {order.returns.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {r.reason} · <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>
                </span>
                <Badge variant={r.status === "REJECTED" ? "secondary" : "default"}>{r.status.toLowerCase()}</Badge>
                {r.adminNotes ? (
                  <p className="w-full text-muted-foreground">{r.adminNotes}</p>
                ) : (
                  r.status === "REQUESTED" && (
                    <p className="w-full text-muted-foreground">
                      Received. We&apos;ll reply within one business day with a reprint or refund.
                    </p>
                  )
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {canReturn && (
        <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Something wrong with your order?</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Report damage or a defect within {site.returns.windowHours} hours of delivery and we&apos;ll reprint it or
            refund you.
          </p>
          <ReturnRequestForm orderId={order.id} reasons={site.returns.reasons} />
        </section>
      )}
      {reviewable.length > 0 && (
        <section className="mt-6 rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Review your items</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your review helps other shoppers — and helps us print better.
          </p>
          <ul className="mt-4 space-y-4">
            {reviewable.map((item) => (
              <li key={item.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                <p className="mb-2 text-sm font-medium">{item.productName}</p>
                <ReviewForm
                  productId={item.productId!}
                  productName={item.productName}
                  existing={existing.find((r) => r.productId === item.productId)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
