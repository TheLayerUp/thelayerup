"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useT } from "@/i18n/LanguageProvider";

export default function AddToCart({ product }: { product: Omit<CartItem, "quantity"> }) {
  const [qty, setQty] = useState(1);
  const { addItem, openCart } = useCartStore();
  const router = useRouter();
  const t = useT();
  const soldOut = product.maxStock <= 0;
  const max = Math.min(product.maxStock, 20);

  if (soldOut) {
    return (
      <Button size="xl" variant="secondary" disabled className="w-full">
        {t("pdp.soldOut")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex h-14 items-center justify-between rounded-xl border border-border bg-surface sm:w-36">
        <button
          className="flex h-full w-12 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="font-semibold tabular-nums" aria-live="polite">
          {qty}
        </span>
        <button
          className="flex h-full w-12 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          disabled={qty >= max}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button
        size="xl"
        variant="outline"
        className="w-full sm:flex-1"
        onClick={() => {
          addItem(product, qty);
          toast.success(t("pdp.added"));
          openCart();
        }}
      >
        <ShoppingBag className="h-5 w-5" />
        {t("pdp.addToCart")}
      </Button>
      <Button
        size="xl"
        variant="glow"
        className="w-full sm:flex-1"
        onClick={() => {
          addItem(product, qty);
          router.push("/checkout");
        }}
      >
        {t("pdp.buyNow")}
      </Button>
    </div>
  );
}
