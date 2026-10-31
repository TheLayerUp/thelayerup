"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

type Point = { day: string; revenue: number; orders: number };

const H = 180;

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / mag) * mag;
}

const fmtDay = (day: string) =>
  new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Single-series bar chart: one hue, no legend, per-bar hover tooltip, table fallback. */
export default function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const ticks = [0, max / 2, max];
  const active = hover !== null ? data[hover] : null;
  const step = Math.max(2, Math.ceil(data.length / 8));

  return (
    <div className="mt-6">
      <div className="relative flex gap-3">
        {/* y-axis */}
        <div
          className="relative w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
          style={{ height: H }}
        >
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: H - (t / max) * H }}>
              {formatPrice(t)}
            </span>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: H }} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-border/70" style={{ top: H - (t / max) * H }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => (
              <div
                key={d.day}
                className="flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${fmtDay(d.day)}: ${formatPrice(d.revenue)}, ${d.orders} orders`}
              >
                <div
                  className="w-full rounded-t-[4px] bg-chart-1 transition-opacity"
                  style={{
                    height: d.revenue ? Math.max(2, (d.revenue / max) * H) : 0,
                    opacity: hover === null || hover === i ? 1 : 0.45,
                  }}
                />
              </div>
            ))}
          </div>

          {active && hover !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-lg"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%`, bottom: 8 + (active.revenue / max) * H }}
            >
              <p className="font-medium">{fmtDay(active.day)}</p>
              <p className="text-muted-foreground tabular-nums">
                {formatPrice(active.revenue)} · {active.orders} order{active.orders === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* x-axis: about 8 labels whatever the range, always including today */}
      <div className="mt-2 ml-[68px] flex gap-[2px] text-[11px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center whitespace-nowrap">
            {(data.length - 1 - i) % step === 0 ? fmtDay(d.day) : ""}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Daily revenue</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Revenue</th>
            <th>Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{fmtDay(d.day)}</td>
              <td>{formatPrice(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
