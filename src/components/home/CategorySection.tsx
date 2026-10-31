import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCategories } from "@/server/queries/catalog";
import SectionHeading from "./SectionHeading";
import { L } from "@/i18n/LanguageProvider";

export default async function CategorySection() {
  const categories = await getCategories();
  if (categories.length === 0) return null;

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          index="01"
          eyebrow="Categories"
          title="Shop by category"
          action={
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary-strong"
            >
              Browse everything
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="reveal group relative flex min-h-44 flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-2xl hover:shadow-primary/25 sm:min-h-56 sm:rounded-[2rem] sm:p-6"
            >
              <div className="bg-layers absolute inset-0 opacity-60 transition-opacity group-hover:opacity-20" />
              <span
                className="absolute top-2 right-2 text-[3.25rem] leading-none opacity-90 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 sm:top-auto sm:-right-4 sm:-bottom-8 sm:text-[9rem]"
                aria-hidden
              >
                {cat.emoji ?? "✨"}
              </span>

              <div className="relative flex items-start justify-between">
                <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-primary-foreground/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60 transition-all group-hover:rotate-45 group-hover:border-transparent group-hover:bg-foreground group-hover:text-background sm:flex">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              <div className="relative mt-auto sm:max-w-[65%]">
                <h3 className="text-lg leading-tight font-bold sm:text-2xl">
                  <L en={cat.name} hi={cat.nameHi} />
                </h3>
                {cat.description && (
                  <p className="mt-1 hidden text-sm text-muted-foreground transition-colors group-hover:text-primary-foreground/85 sm:block">
                    {cat.description}
                  </p>
                )}
                <p className="mt-3 inline-flex rounded-full bg-background/70 px-2.5 py-0.5 text-xs font-semibold text-foreground sm:mt-4 sm:px-3 sm:py-1">
                  {cat._count.products} {cat._count.products === 1 ? "design" : "designs"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
