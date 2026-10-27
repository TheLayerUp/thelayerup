"use client";

import { useActionState } from "react";
import { createCoupon } from "@/server/actions/admin";
import type { FormState } from "@/server/actions/public";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function CouponForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createCoupon, {});

  return (
    <form action={action} className="rounded-3xl border border-border bg-surface p-6">
      <h2 className="font-semibold">New coupon</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-7 lg:items-end">
        <div className="lg:col-span-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" required className="uppercase" placeholder="DIWALI20" />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue="PERCENTAGE">
            <option value="PERCENTAGE">% off</option>
            <option value="FLAT">₹ off</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="value">Value</Label>
          <Input id="value" name="value" type="number" min={1} required />
        </div>
        <div>
          <Label htmlFor="minOrderValue">Min order ₹</Label>
          <Input id="minOrderValue" name="minOrderValue" type="number" min={0} />
        </div>
        <div>
          <Label htmlFor="maxDiscount">Max off ₹</Label>
          <Input id="maxDiscount" name="maxDiscount" type="number" min={1} />
        </div>
        <div>
          <Label htmlFor="usageLimit">Uses</Label>
          <Input id="usageLimit" name="usageLimit" type="number" min={1} placeholder="∞" />
        </div>
        <div className="lg:col-span-2">
          <Label htmlFor="expiresAt">Expires</Label>
          <Input id="expiresAt" name="expiresAt" type="date" />
        </div>
        <Button type="submit" isLoading={pending}>
          Create
        </Button>
      </div>
      {state.message && (
        <p className={`mt-3 text-sm ${state.ok ? "text-success" : "text-destructive"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
