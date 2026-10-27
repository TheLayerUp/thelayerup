import Link from "next/link";
import { Star } from "lucide-react";
import { getHighlightReviews } from "@/server/queries/catalog";

// Only real, published customer reviews are shown; the section hides itself until there are some.
export default async function TestimonialsSection() {
  const reviews = await getHighlightReviews(3);
  if (reviews.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold tracking-wider text-primary-strong uppercase">Reviews</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">What customers are saying</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((r) => {
            const name = r.user.name?.split(" ")[0] ?? "Customer";
            return (
              <figure key={r.id} className="rounded-3xl border border-border bg-surface p-6">
                <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-border"}`} />
                  ))}
                </div>
                <blockquote className="mt-4 leading-relaxed">&ldquo;{r.comment}&rdquo;</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary-strong">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {name}
                      {r.isVerifiedPurchase && (
                        <span className="ml-1.5 text-xs font-normal text-success">✓ Verified</span>
                      )}
                    </p>
                    <Link
                      href={`/products/${r.product.slug}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {r.product.name}
                    </Link>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
