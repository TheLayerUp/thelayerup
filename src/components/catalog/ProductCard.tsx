"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import type { ProductCardData } from "@/server/queries/catalog";
import { useLocalized, useT } from "@/i18n/LanguageProvider";

export default function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);
  const t = useT();
  const loc = useLocalized();
  const { id, slug, price, compareAtPrice, image, material, isNew, stock, nameHi } = product;
  const name = loc(product.name, nameHi);
  const category = loc(product.category, product.categoryHi);
  const soldOut = stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id, slug, name: product.name, nameHi, price, image, maxStock: stock });
    toast.success(`${name} added to cart`);
  };

  const discount = compareAtPrice ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface-2">
        <Image
          src={image}
          alt={name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {isNew && <Badge className="bg-foreground text-background">{t("card.new")}</Badge>}
          {discount > 0 && <Badge>-{discount}%</Badge>}
          {soldOut && <Badge variant="secondary">{t("card.soldOut")}</Badge>}
        </div>
        {!soldOut && (
          <button
            onClick={handleAdd}
            aria-label={`Add ${name} to cart`}
            className="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-1 pt-3">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {category}
          {material && <span className="tracking-normal normal-case"> · {material}</span>}
        </p>
        <h3 className="mt-1 line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary-strong sm:text-base">
          {name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold">{formatPrice(price)}</span>
          {compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(compareAtPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
