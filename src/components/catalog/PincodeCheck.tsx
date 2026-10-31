"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { checkPincode, type PincodeResult } from "@/server/actions/public";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

export default function PincodeCheck() {
  const [result, setResult] = useState<PincodeResult | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  return (
    <form
      className="mt-6 rounded-2xl border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const pin = String(new FormData(e.currentTarget).get("pincode") ?? "").trim();
        startTransition(async () => setResult(await checkPincode(pin)));
      }}
    >
      <label htmlFor="pdp-pincode" className="flex items-center gap-2 text-sm font-semibold">
        <MapPin className="h-4 w-4 text-primary" /> {t("pdp.checkDelivery")}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="pdp-pincode"
          name="pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder={t("pdp.pincode")}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 cursor-pointer rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
        >
          {pending ? t("pdp.checking") : t("pdp.check")}
        </button>
      </div>
      {result && (
        <p role="status" className={cn("mt-2 text-sm", result.ok ? "text-success" : "text-destructive")}>
          {result.message}
        </p>
      )}
    </form>
  );
}
