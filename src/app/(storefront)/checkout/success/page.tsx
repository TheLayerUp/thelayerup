import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";
import OrderView from "@/components/orders/OrderView";
import PushToggle from "@/components/account/PushToggle";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 rounded-3xl" />}>
        <Success searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Success({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { order: orderNumber } = await searchParams;
  const user = await requireUser("/account/orders");
  if (typeof orderNumber !== "string") notFound();

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: true, shipping: true },
  });
  if (!order) notFound();

  return (
    <>
      <div className="mb-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          Thank you{user.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          {order.paymentMethod === "COD"
            ? "Your cash-on-delivery order is placed. We'll message you on WhatsApp to confirm before printing. Details sent to "
            : "Your order is confirmed. A confirmation has been sent to "}
          <strong className="text-foreground">{order.email}</strong>.
        </p>
        <div className="mt-4 flex justify-center">
          <PushToggle compact />
        </div>
      </div>
      <OrderView order={order} />
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account/orders" className={buttonVariants({ variant: "outline" })}>
          My orders
        </Link>
        <Link href="/products" className={buttonVariants()}>
          Continue shopping
        </Link>
      </div>
    </>
  );
}
