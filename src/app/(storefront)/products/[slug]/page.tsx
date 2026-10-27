import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Truck, ShieldCheck, Hammer, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductGrid from "@/components/catalog/ProductGrid";
import ProductGallery from "@/components/catalog/ProductGallery";
import AddToCart from "@/components/catalog/AddToCart";
import { getProductBySlug, getRelatedProducts } from "@/server/queries/catalog";
import { formatDate, formatPrice } from "@/lib/utils";
import { site } from "@/config/site";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.imageUrls.slice(0, 1) },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const related = await getRelatedProducts(product.id, product.categoryId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imageUrls.map((u) => new URL(u, site.url).toString()),
    sku: product.id,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${site.url}/products/${product.slug}`,
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.toFixed(1),
        reviewCount: product.reviewCount,
      },
    }),
  };

  const specs = [
    { label: "Material", value: product.material },
    { label: "Colour", value: product.color },
    { label: "Dimensions", value: product.dimensions },
    { label: "Weight", value: product.weightGrams ? `${product.weightGrams} g` : null },
  ].filter((s) => s.value);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.imageUrls} name={product.name} />

        <div>
          <div className="flex flex-wrap gap-2">
            {discount > 0 && <Badge>-{discount}% off</Badge>}
            {product.stock === 0 && <Badge variant="secondary">Sold out</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{product.name}</h1>

          {product.reviewCount > 0 && (
            <a href="#reviews" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Stars rating={product.rating} />
              {product.rating.toFixed(1)} · {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
            </a>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
            <span className="text-xs text-muted-foreground">incl. of all taxes</span>
          </div>

          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

          {product.features.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.imageUrls[0],
                maxStock: product.stock,
              }}
            />
            {product.stock > 0 && product.stock <= product.lowStockAt && (
              <p className="mt-3 text-sm font-medium text-warning">
                Only {product.stock} left — each batch is printed in small runs.
              </p>
            )}
          </div>

          {specs.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface p-5">
              {specs.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{s.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            {[
              { icon: Truck, label: `Free shipping over ${formatPrice(site.shipping.freeAbove)}` },
              { icon: ShieldCheck, label: "Secure Razorpay checkout" },
              { icon: Hammer, label: "Printed to order in 2–4 days" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-2 rounded-2xl border border-border p-3">
                <b.icon className="h-5 w-5 text-primary" />
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section id="reviews" className="mt-16 border-t border-border pt-12">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {product.reviews.length === 0 ? (
          <p className="mt-3 text-muted-foreground">
            No reviews yet. Bought this? You&apos;ll be able to review it from your orders.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {product.reviews.map((r) => (
              <article key={r.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-3 text-sm leading-relaxed">{r.comment}</p>}
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {r.user.name ?? "Customer"}
                  {r.isVerifiedPurchase && <span className="ml-2 text-success">✓ Verified purchase</span>}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <div className="mt-16 border-t border-border pt-12">
          <ProductGrid products={related} title="You may also like" />
        </div>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-border"}`} />
      ))}
    </span>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
      <Skeleton className="aspect-square rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}
