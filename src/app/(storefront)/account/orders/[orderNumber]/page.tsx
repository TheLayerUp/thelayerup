import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";
import OrderView from "@/components/orders/OrderView";
import ReviewForm from "@/components/orders/ReviewForm";
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
    include: { items: true, shipping: true },
  });
  if (!order) notFound();

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
