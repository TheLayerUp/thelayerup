"use client";

import { useEffect } from "react";
import { X, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cartSubtotal, useCartStore, useHydrated } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import { site } from "@/config/site";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const hydrated = useHydrated();
  const pathname = usePathname();

  // Close on navigation and on Escape.
  useEffect(() => closeCart(), [pathname, closeCart]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  if (!isOpen || !hydrated) return null;

  const subtotal = cartSubtotal(items);
  const toFree = site.shipping.freeAbove - subtotal;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={closeCart} />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className="animate-rise fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Your cart</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart} aria-label="Close cart">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {items.length > 0 && (
          <div className="border-b border-border px-6 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" />
              {toFree > 0 ? (
                <span>
                  Add <strong className="text-foreground">{formatPrice(toFree)}</strong> more for free shipping
                </span>
              ) : (
                <span className="font-medium text-success">You&apos;ve unlocked free shipping!</span>
              )}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (subtotal / site.shipping.freeAbove) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBag className="mb-4 h-14 w-14 text-border" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">Add something you&apos;ll love having on your desk.</p>
              <Link href="/products" onClick={closeCart} className={buttonVariants({ className: "mt-6" })}>
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-2xl border border-border bg-surface p-3">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                  >
                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-medium">{item.name}</h3>
                      <p className="mt-0.5 text-sm font-semibold">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-border">
                        <button
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        className="p-1 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-4 border-t border-border px-6 py-4">
            <div className="flex justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping and discounts are calculated at checkout.</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className={buttonVariants({ variant: "glow", size: "lg", className: "w-full" })}
            >
              Checkout
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block text-center text-sm text-muted-foreground hover:text-foreground"
            >
              View full cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
