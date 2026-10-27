import Link from "next/link";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCardData } from "@/server/queries/catalog";

interface ProductGridProps {
  products: ProductCardData[];
  eyebrow?: string;
  title?: string;
  viewAllHref?: string;
}

export default function ProductGrid({ products, eyebrow, title, viewAllHref }: ProductGridProps) {
  return (
    <section>
      {title && (
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            {eyebrow && <p className="text-sm font-semibold tracking-wider text-primary-strong uppercase">{eyebrow}</p>}
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-square rounded-3xl" />
          <Skeleton className="mt-3 h-3 w-1/3" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
