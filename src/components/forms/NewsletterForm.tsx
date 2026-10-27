"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import Honeypot from "./Honeypot";
import { subscribeNewsletter, type FormState } from "@/server/actions/public";

export default function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, {});

  if (state.ok) {
    return <p className="text-sm font-medium text-success">{state.message}</p>;
  }

  return (
    <form action={action} className="max-w-sm">
      <Honeypot />
      <label htmlFor="newsletter-email" className="mb-2 block text-sm font-medium">
        Get early access to new drops
      </label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        <Button type="submit" size="sm" className="h-10" isLoading={pending}>
          Subscribe
        </Button>
      </div>
      {state.message && <p className="mt-1.5 text-xs text-destructive">{state.message}</p>}
    </form>
  );
}
