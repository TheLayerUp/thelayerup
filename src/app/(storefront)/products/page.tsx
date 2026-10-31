import { Suspense } from "react";
import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import Link from "next/link";
import ProductGrid, { ProductGridSkeleton } from "@/components/catalog/ProductGrid";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import { buttonVariants } from "@/components/ui/button";
import { T } from "@/i18n/LanguageProvider";
import { getCatalog, getCategories, getMaterials, type CatalogSort } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Browse 3D printed lamps, planters, desk accessories, keychains and gifts.",
};

const SORTS: CatalogSort[] = ["featured", "newest", "price-asc", "price-desc"];

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const [categories, materials] = await Promise.all([getCategories(), getMaterials()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold sm:text-5xl">
        <T k="nav.shop" />
      </h1>
      <p className="mt-2 text-muted-foreground">
        <T k="shop.intro" />
      </p>

      <Suspense fallback={<div className="my-8 h-24 animate-pulse rounded-2xl bg-surface-2" />}>
        <CatalogFilters
          categories={categories.map((c) => ({ slug: c.slug, name: c.name, nameHi: c.nameHi }))}
          materials={materials}
        />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const sp = await searchParams;
  const sort = one(sp.sort) as CatalogSort | undefined;
  const products = await getCatalog({
    category: one(sp.category),
    q: one(sp.q)?.slice(0, 80),
    material: one(sp.material),
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    inStock: one(sp.inStock) === "1",
  });

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-border py-20 text-center">
        <PackageSearch className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">
          <T k="shop.noMatch" />
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <T k="shop.noMatchSub" />
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/products" className={buttonVariants({ variant: "outline" })}>
            <T k="shop.clear" />
          </Link>
          <Link href="/custom-order" className={buttonVariants()}>
            <T k="nav.custom" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {products.length} <T k={products.length === 1 ? "shop.product" : "shop.products"} />
      </p>
      <ProductGrid products={products} />
    </>
  );
}
