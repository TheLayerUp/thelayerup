import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { deleteReview, toggleReviewPublished } from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "hidden", label: "Hidden" },
  { key: "low", label: "≤ 3 stars" },
] as const;

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin();
  const { filter: raw } = await searchParams;
  const filter = FILTERS.find((f) => f.key === raw)?.key ?? "all";

  const reviews = await prisma.review.findMany({
    where:
      filter === "published"
        ? { isPublished: true }
        : filter === "hidden"
          ? { isPublished: false }
          : filter === "low"
            ? { rating: { lte: 3 } }
            : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reviews go live as soon as a customer with a delivered order posts them. Hide anything off-topic or abusive.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/reviews" : `/admin/reviews?filter=${f.key}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium",
              f.key === filter
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No reviews here.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className={cn("rounded-2xl border border-border bg-surface p-5", !r.isPublished && "opacity-70")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn("h-4 w-4", i < r.rating ? "fill-primary text-primary" : "text-border")}
                        />
                      ))}
                    </span>
                    {r.isPublished ? <Badge variant="secondary">Published</Badge> : <Badge>Hidden</Badge>}
                    {r.isVerifiedPurchase && <span className="text-xs text-success">✓ Verified</span>}
                  </div>
                  <p className="mt-1 text-sm">
                    <Link href={`/products/${r.product.slug}`} className="font-semibold hover:text-primary-strong">
                      {r.product.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {" "}
                      · {r.user.name ?? r.user.email} · {formatDate(r.createdAt)}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <form action={toggleReviewPublished}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button variant="outline" size="sm">
                      {r.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {r.isPublished ? "Hide" : "Publish"}
                    </Button>
                  </form>
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button variant="ghost" size="sm" aria-label="Delete review" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              {r.comment && <p className="mt-3 text-sm leading-relaxed">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
