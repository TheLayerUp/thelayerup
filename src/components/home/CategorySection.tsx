import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCategories } from "@/server/queries/catalog";
import { cn } from "@/lib/utils";

export default async function CategorySection() {
  const categories = await getCategories();
  if (categories.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wider text-primary-strong uppercase">Categories</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Shop by category</h2>
          </div>
          <Link
            href="/products"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            View all →
          </Link>
        </div>

        {/* Bento grid: first two categories get the big tiles */}
        <div className="grid auto-rows-[150px] grid-cols-2 gap-4 sm:auto-rows-[180px] lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10",
                i === 0 && "col-span-2 row-span-2 bg-primary text-primary-foreground",
                i === 1 && "row-span-2 bg-foreground text-background",
                i > 1 && "bg-surface",
                // Tiles after the first four fill whole half-rows so the grid has no holes.
                i > 3 && "lg:col-span-2"
              )}
            >
              <span className={cn("transition-transform group-hover:scale-110", i < 2 ? "text-6xl" : "text-4xl")}>
                {cat.emoji ?? "✨"}
              </span>
              <div>
                <h3 className={cn("font-semibold", i < 2 ? "text-2xl" : "text-base")}>{cat.name}</h3>
                <p className={cn("mt-0.5 text-sm", i < 2 ? "opacity-80" : "text-muted-foreground")}>
                  {i < 2 && cat.description ? `${cat.description} · ` : ""}
                  {cat._count.products} items
                </p>
              </div>
              <ArrowUpRight className="absolute top-5 right-5 h-5 w-5 opacity-60 transition-all group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
