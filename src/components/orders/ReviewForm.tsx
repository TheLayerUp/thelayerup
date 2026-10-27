"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/server/actions/account";
import type { FormState } from "@/server/actions/public";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  productId: string;
  productName: string;
  existing?: { rating: number; comment: string | null };
}

export default function ReviewForm({ productId, productName, existing }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, {});
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [open, setOpen] = useState(false);

  if (state.ok) return <p className="text-sm font-medium text-success">{state.message}</p>;
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {existing ? "Edit your review" : "Write a review"}
      </Button>
    );
  }

  return (
    <form action={action} className="mt-2 space-y-3 rounded-2xl border border-border p-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <p className="text-sm font-medium">How was the {productName}?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
          >
            <Star className={`h-6 w-6 ${n <= rating ? "fill-primary text-primary" : "text-border"}`} />
          </button>
        ))}
      </div>
      <Textarea
        name="comment"
        defaultValue={existing?.comment ?? ""}
        placeholder="What did you like? How's the print quality?"
        className="min-h-20"
        required
      />
      {state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" isLoading={pending} disabled={rating === 0}>
          Submit review
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
