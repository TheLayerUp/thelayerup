"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cartSubtotal, useCartStore, useHydrated } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { shippingFor } from "@/config/site";

export default function CartView() {
  const hydrated = useHydrated();
  const { items, updateQuantity, removeItem } = useCartStore();

  if (!hydrated) return <div className="mt-8 h-64 animate-pulse rounded-3xl bg-surface-2" />;

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-border py-20 text-center">
        <p className="text-lg font-medium">Your cart is empty</p>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Browse products
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <ul className="divide-y divide-border rounded-3xl border border-border bg-surface">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 p-4 sm:p-5">
            <Link
              href={`/products/${item.slug}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface-2"
            >
              <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
            </Link>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between gap-4">
                <Link href={`/products/${item.slug}`} className="font-medium hover:text-primary-strong">
                  {item.name}
                </Link>
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    className="flex h-8 w-8 items-center justify-center"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                  <button
                    className="flex h-8 w-8 items-center justify-center disabled:opacity-30"
                    disabled={item.quantity >= item.maxStock}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl border border-border bg-surface p-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Estimated shipping</dt>
            <dd className="font-medium">{shipping ? formatPrice(shipping) : "Free"}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
            <dt>Estimated total</dt>
            <dd>{formatPrice(subtotal + shipping)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted-foreground">Have a coupon? Apply it at checkout.</p>
        <Link href="/checkout" className={buttonVariants({ variant: "glow", size: "lg", className: "mt-5 w-full" })}>
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
