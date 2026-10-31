"use client";

import { useActionState } from "react";
import { requestReturn } from "@/server/actions/account";
import type { FormState } from "@/server/actions/public";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ReturnRequestForm({ orderId, reasons }: { orderId: string; reasons: readonly string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestReturn, {});
  if (state.ok) return <p className="text-sm font-medium text-success">{state.message}</p>;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <Label htmlFor="rr-reason">What went wrong?</Label>
        <Select id="rr-reason" name="reason" required defaultValue={reasons[0]}>
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="rr-details">Details</Label>
        <Textarea
          id="rr-details"
          name="details"
          required
          minLength={10}
          placeholder="Which item, and what's wrong with it?"
          className="min-h-24"
        />
      </div>
      <div>
        <Label htmlFor="rr-photo">Link to photos</Label>
        <Input id="rr-photo" name="photoUrl" type="url" placeholder="Google Drive / Photos share link" />
        <p className="mt-1 text-xs text-muted-foreground">Photos of the item and packaging help us resolve it fast.</p>
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" variant="outline" isLoading={pending}>
        Report a problem
      </Button>
    </form>
  );
}
