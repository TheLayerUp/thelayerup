import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { getHighlightReviews } from "@/server/queries/catalog";
import { cn } from "@/lib/utils";
import SectionHeading from "./SectionHeading";

// Only real, published customer reviews are shown; the section hides itself until there are some.
export default async function TestimonialsSection() {
  const reviews = await getHighlightReviews(3);
  if (reviews.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading index="05" eyebrow="Reviews" title="What customers are saying" />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {reviews.map((r, i) => {
            const name = r.user.name?.split(" ")[0] ?? "Customer";
            const highlight = i === 0;
            return (
              <figure
                key={r.id}
                className={cn(
                  "reveal relative flex flex-col overflow-hidden rounded-[2rem] border p-7",
                  highlight ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/60"
                )}
              >
                <Quote
                  className={cn(
                    "absolute -top-2 -right-2 h-28 w-28 rotate-180",
                    highlight ? "text-primary-foreground/15" : "text-primary/10"
                  )}
                  aria-hidden
                />
                <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-4 w-4",
                        s < r.rating
                          ? highlight
                            ? "fill-primary-foreground text-primary-foreground"
                            : "fill-primary text-primary"
                          : "opacity-30"
                      )}
                    />
                  ))}
                </div>
                <blockquote className="relative mt-6 flex-1 font-display text-xl leading-snug font-medium tracking-tight">
                  &ldquo;{r.comment}&rdquo;
                </blockquote>
                <figcaption
                  className={cn(
                    "mt-8 flex items-center gap-3 border-t pt-5",
                    highlight ? "border-primary-foreground/25" : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                      highlight ? "bg-primary-foreground text-primary-strong" : "bg-foreground text-background"
                    )}
                  >
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {name}
                      {r.isVerifiedPurchase && (
                        <span className={cn("ml-1.5 text-xs font-medium", highlight ? "opacity-85" : "text-success")}>
                          ✓ Verified buyer
                        </span>
                      )}
                    </p>
                    <Link
                      href={`/products/${r.product.slug}`}
                      className={cn("text-xs hover:underline", highlight ? "opacity-80" : "text-muted-foreground")}
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
