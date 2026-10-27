import type { Metadata } from "next";
import CartView from "@/components/checkout/CartView";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold sm:text-4xl">Your cart</h1>
      <CartView />
    </div>
  );
}
