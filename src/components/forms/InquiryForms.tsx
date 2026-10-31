"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Honeypot from "./Honeypot";
import { submitContact, submitCustomOrder, type FormState } from "@/server/actions/public";

function Success({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <CheckCircle2 className="h-12 w-12 text-success" />
      <p className="mt-4 text-lg font-semibold">{message}</p>
    </div>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, {});
  if (state.ok) return <Success message={state.message} />;
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" name="name" autoComplete="name" required error={e.name} />
        </div>
        <div>
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" name="email" type="email" autoComplete="email" required error={e.email} />
        </div>
      </div>
      <div>
        <Label htmlFor="c-phone">Phone (optional)</Label>
        <Input id="c-phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div>
        <Label htmlFor="c-subject">Subject</Label>
        <Input id="c-subject" name="subject" required error={e.subject} />
      </div>
      <div>
        <Label htmlFor="c-message">Message</Label>
        <Textarea id="c-message" name="message" required className="min-h-32" error={e.message} />
      </div>
      <Button type="submit" size="lg" isLoading={pending}>
        <Send className="h-4 w-4" /> Send message
      </Button>
    </form>
  );
}

/** `bulk` switches the copy and fields for corporate / event orders (stored as kind BULK). */
export function CustomOrderForm({ bulk = false }: { bulk?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitCustomOrder, {});
  if (state.ok) return <Success message={state.message} />;
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5">
      <Honeypot />
      {bulk && <input type="hidden" name="kind" value="BULK" />}
      {bulk && (
        <div>
          <Label htmlFor="co-company">Company / organisation</Label>
          <Input id="co-company" name="company" autoComplete="organization" error={e.company} />
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="co-name">Name *</Label>
          <Input id="co-name" name="name" autoComplete="name" required error={e.name} />
        </div>
        <div>
          <Label htmlFor="co-email">Email *</Label>
          <Input id="co-email" name="email" type="email" autoComplete="email" required error={e.email} />
        </div>
      </div>
      <div>
        <Label htmlFor="co-phone">Phone / WhatsApp *</Label>
        <Input
          id="co-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="10-digit mobile"
          required
          error={e.phone}
        />
      </div>
      <div>
        <Label htmlFor="co-desc">What should we print? *</Label>
        <Textarea
          id="co-desc"
          name="description"
          required
          className="min-h-36"
          placeholder={
            bulk
              ? "What's the occasion, which product or design, logo/branding, packaging, delivery cities…"
              : "Size, purpose, colours, text to engrave, how many… the more detail the better."
          }
          error={e.description}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="co-material">Preferred material</Label>
          <Select id="co-material" name="material" defaultValue="">
            <option value="">Not sure — recommend one</option>
            <option value="PLA">PLA (standard, matte)</option>
            <option value="PLA+">PLA+ (tougher)</option>
            <option value="PETG">PETG (durable, outdoor)</option>
            <option value="ABS">ABS (heat resistant)</option>
            <option value="Resin">Resin (fine detail)</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="co-qty">Quantity</Label>
          <Input id="co-qty" name="quantity" type="number" min={1} defaultValue={bulk ? 25 : 1} error={e.quantity} />
        </div>
        <div>
          <Label htmlFor="co-budget">Budget (optional)</Label>
          <Select id="co-budget" name="budget" defaultValue="">
            <option value="">No fixed budget</option>
            <option value="Under ₹500">Under ₹500</option>
            <option value="₹500–1,000">₹500 – ₹1,000</option>
            <option value="₹1,000–2,500">₹1,000 – ₹2,500</option>
            <option value="₹2,500–5,000">₹2,500 – ₹5,000</option>
            <option value="₹5,000+">₹5,000+</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="co-deadline">Needed by (optional)</Label>
          <Input id="co-deadline" name="deadline" type="date" />
        </div>
      </div>
      <div>
        <Label htmlFor="co-file">Link to your 3D file or reference images (optional)</Label>
        <Input
          id="co-file"
          name="fileUrl"
          type="url"
          placeholder="Google Drive, Thingiverse, Printables, Dropbox…"
          error={e.fileUrl}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          STL, OBJ, STEP, 3MF or images. Make sure the link is shared publicly.
        </p>
      </div>
      <Button type="submit" size="lg" variant="glow" isLoading={pending}>
        {bulk ? "Get bulk pricing" : "Request a quote"} <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
