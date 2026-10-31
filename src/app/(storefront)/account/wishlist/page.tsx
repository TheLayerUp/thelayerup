import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import ProductCard from "@/components/catalog/ProductCard";
import WishlistButton from "@/components/catalog/WishlistButton";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/server/session";
import { getWishlist } from "@/server/queries/catalog";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My account
      </Link>
      <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold sm:text-4xl">
        <Heart className="h-7 w-7 fill-primary text-primary" /> Wishlist
      </h1>
      <Suspense
        fallback={
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-3xl" />
            ))}
          </div>
        }
      >
        <Saved />
      </Suspense>
    </div>
  );
}

async function Saved() {
  const user = await requireUser("/account/wishlist");
  const products = await getWishlist(user.id);

  if (products.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground">Nothing saved yet. Tap the heart on any product to keep it here.</p>
        <Link href="/products" className={buttonVariants({ className: "mt-4" })}>
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-2 text-muted-foreground">
        {products.length} saved item{products.length === 1 ? "" : "s"}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
        {products.map((p) => (
          <div key={p.id} className="relative">
            <ProductCard product={p} />
            <div className="absolute top-3 right-3">
              <WishlistButton productId={p.id} initial variant="icon" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
