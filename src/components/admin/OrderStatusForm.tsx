"use client";

import { useActionState, useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/server/actions/admin";
import type { FormState } from "@/server/actions/public";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PAID", label: "Confirmed (paid)" },
  { value: "PROCESSING", label: "Printing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "PENDING", label: "Awaiting payment" },
];

interface Props {
  orderId: string;
  status: OrderStatus;
  courierName: string;
  awbNumber: string;
  trackingUrl: string;
}

export default function OrderStatusForm(props: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrderStatus, {});
  const [status, setStatus] = useState<OrderStatus>(props.status);
  const showShipping = status === "SHIPPED" || status === "DELIVERED" || Boolean(props.awbNumber);

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-border bg-surface p-5">
      <h2 className="font-semibold">Update order</h2>
      <input type="hidden" name="orderId" value={props.orderId} />
      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      {showShipping && (
        <>
          <div>
            <Label htmlFor="courierName">Courier</Label>
            <Input
              id="courierName"
              name="courierName"
              defaultValue={props.courierName}
              placeholder="Delhivery, Blue Dart…"
            />
          </div>
          <div>
            <Label htmlFor="awbNumber">AWB / tracking number</Label>
            <Input id="awbNumber" name="awbNumber" defaultValue={props.awbNumber} />
          </div>
          <div>
            <Label htmlFor="trackingUrl">Tracking link</Label>
            <Input id="trackingUrl" name="trackingUrl" type="url" defaultValue={props.trackingUrl} />
          </div>
        </>
      )}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="notify" defaultChecked className="accent-primary" /> Email the customer
      </label>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-success" : "text-destructive"}`} role="status">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" isLoading={pending}>
        Save
      </Button>
    </form>
  );
}
