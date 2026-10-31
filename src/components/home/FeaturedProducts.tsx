import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ProductCard from "@/components/catalog/ProductCard";
import type { ProductCardData } from "@/server/queries/catalog";
import SectionHeading from "./SectionHeading";
import ScrollRow from "./ScrollRow";

const slide = "w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-4.5rem)/4)]";

export default function FeaturedProducts({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="overflow-hidden pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          index="02"
          eyebrow="Trending"
          title="Bestsellers right now"
          description="The pieces people keep coming back for — each one printed fresh when you order."
        />

        <ScrollRow label="Bestsellers">
          {products.map((product) => (
            <div key={product.id} className={slide}>
              <ProductCard product={product} />
            </div>
          ))}
          <Link
            href="/products"
            className={`${slide} group flex aspect-square flex-col justify-between rounded-3xl bg-foreground p-6 text-background transition-colors hover:bg-primary hover:text-primary-foreground`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/10 transition-transform group-hover:rotate-45">
              <ArrowUpRight className="h-6 w-6" />
            </span>
            <span>
              <span className="block font-display text-3xl leading-tight font-bold">
                See the full
                <br />
                collection
              </span>
              <span className="mt-2 block text-sm opacity-70">Lamps, planters, desk gear &amp; more</span>
            </span>
          </Link>
        </ScrollRow>
      </div>
    </section>
  );
}
