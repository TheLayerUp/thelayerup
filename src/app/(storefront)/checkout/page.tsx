import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/session";
import { razorpayEnabled, testPaymentsEnabled } from "@/server/payments/razorpay";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold sm:text-4xl">Checkout</h1>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Secure checkout
        </span>
      </div>
      <Suspense
        fallback={
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-72 rounded-3xl" />
          </div>
        }
      >
        <CheckoutLoader />
      </Suspense>
    </div>
  );
}

async function CheckoutLoader() {
  const user = await requireUser("/checkout");
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <CheckoutForm
      addresses={addresses.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? "",
        city: a.city,
        state: a.state,
        pincode: a.pincode,
      }))}
      defaultName={user.name ?? ""}
      mode={razorpayEnabled ? "razorpay" : testPaymentsEnabled ? "test" : "disabled"}
    />
  );
}
