"use client";

import { useActionState } from "react";
import { Truck } from "lucide-react";
import { createShiprocketShipment, shiprocketLabel, type ShipResult } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ShiprocketPanel({
  orderId,
  enabled,
  hasShipment,
  canShip,
}: {
  orderId: string;
  enabled: boolean;
  hasShipment: boolean;
  canShip: boolean;
}) {
  const [state, action, pending] = useActionState<ShipResult | null, FormData>(createShiprocketShipment, null);

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 text-sm">
      <h2 className="flex items-center gap-2 font-semibold">
        <Truck className="h-4 w-4 text-primary" /> Shiprocket
      </h2>
      {!enabled ? (
        <p className="mt-2 text-muted-foreground">
          Not connected. Add <code>SHIPROCKET_EMAIL</code>, <code>SHIPROCKET_PASSWORD</code> and{" "}
          <code>SHIPROCKET_PICKUP_PINCODE</code> to book couriers and print labels from here. Until then, enter the
          courier and AWB above by hand.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {!hasShipment && (
            <form action={action}>
              <input type="hidden" name="id" value={orderId} />
              <Button size="sm" className="w-full" isLoading={pending} disabled={!canShip}>
                Book courier &amp; get AWB
              </Button>
              {!canShip && (
                <p className="mt-1 text-xs text-muted-foreground">Available for paid / processing orders.</p>
              )}
            </form>
          )}
          {(hasShipment || state?.ok) && (
            <form action={shiprocketLabel} target="_blank">
              <input type="hidden" name="id" value={orderId} />
              <Button size="sm" variant="outline" className="w-full">
                Print shipping label
              </Button>
            </form>
          )}
          {state && (
            <p role="status" className={cn("text-xs", state.ok ? "text-success" : "text-destructive")}>
              {state.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
