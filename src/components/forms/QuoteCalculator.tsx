"use client";

import { useState } from "react";
import { AlertTriangle, Box, FileUp, Loader2 } from "lucide-react";
import { parseStl, type MeshStats } from "@/lib/stl";
import { estimate, quoteMaterials, quoteRules } from "@/config/quote";
import { cn, formatPrice } from "@/lib/utils";

const MAX_MB = 60;

/** Instant estimate from an STL, computed in the browser — the file never leaves the device. */
export default function QuoteCalculator() {
  const [file, setFile] = useState<string | null>(null);
  const [stats, setStats] = useState<MeshStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState(1);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setError(null);
    setStats(null);
    setFile(f.name);
    if (!/\.stl$/i.test(f.name))
      return setError("Instant quotes work with .stl files. For other formats, use the form below.");
    if (f.size > MAX_MB * 1024 * 1024)
      return setError(`That file is over ${MAX_MB} MB. Send it via the form below instead.`);
    setBusy(true);
    try {
      setStats(parseStl(await f.arrayBuffer()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally {
      setBusy(false);
    }
  };

  const { buildVolume } = quoteRules;
  const tooBig =
    stats && (stats.size.x > buildVolume.x || stats.size.y > buildVolume.y || stats.size.z > buildVolume.z);
  // Probably modelled in inches or metres if it's microscopic or absurdly large.
  const oddScale = stats && (Math.max(stats.size.x, stats.size.y, stats.size.z) < 2 || stats.volumeCm3 > 20_000);

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary-strong">
          <Box className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Instant STL quote</h2>
          <p className="text-sm text-muted-foreground">Calculated on your device. Your file is not uploaded.</p>
        </div>
      </div>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
        className="bg-layers mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-8 text-center transition-colors hover:border-primary"
      >
        {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileUp className="h-8 w-8 text-primary" />}
        <span className="mt-3 font-semibold">{file ?? "Drop an .stl file or tap to choose"}</span>
        <span className="text-xs text-muted-foreground">Up to {MAX_MB} MB · units in millimetres</span>
        <input type="file" accept=".stl" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {stats && (
        <div className="mt-6 space-y-4" aria-live="polite">
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              {
                label: "Size (mm)",
                value: `${stats.size.x.toFixed(0)}×${stats.size.y.toFixed(0)}×${stats.size.z.toFixed(0)}`,
              },
              { label: "Volume", value: `${stats.volumeCm3.toFixed(1)} cm³` },
              { label: "Triangles", value: stats.triangles.toLocaleString("en-IN") },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface-2/70 p-3">
                <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{s.label}</dt>
                <dd className="mt-1 text-sm font-bold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>

          {(tooBig || oddScale) && (
            <p className="flex gap-2 rounded-2xl bg-warning/10 p-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {tooBig
                ? `This is bigger than our ${buildVolume.x} mm print bed, so we'd print it in parts. Ask us for a quote below.`
                : "The size looks unusual. Was the model exported in millimetres? Check the dimensions above."}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="q-qty" className="text-sm font-medium">
              Quantity
            </label>
            <input
              id="q-qty"
              type="number"
              min={1}
              max={500}
              value={qty}
              onChange={(e) => setQty(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
              className="h-10 w-24 rounded-xl border border-border bg-background px-3 text-right text-base tabular-nums"
            />
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {quoteMaterials.map((m, i) => {
              const e = estimate(stats.volumeCm3, m);
              return (
                <li key={m.id} className={cn("flex items-center justify-between gap-3 p-4", i === 0 && "bg-primary/5")}>
                  <div>
                    <p className="font-semibold">
                      {m.name}
                      {i === 0 && <span className="ml-2 text-xs font-medium text-primary-strong">Most popular</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.note} · ~{e.grams} g · ~{e.hours} h print
                    </p>
                  </div>
                  <p className="text-right">
                    <span className="block font-display text-lg font-bold tabular-nums">
                      {formatPrice(e.price * qty)}
                    </span>
                    {qty > 1 && <span className="text-xs text-muted-foreground">{formatPrice(e.price)} each</span>}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Estimate only, before shipping. Bulk orders get better rates. Send the request below and we&apos;ll confirm
            the final price within 24 hours.
          </p>
        </div>
      )}
    </div>
  );
}
