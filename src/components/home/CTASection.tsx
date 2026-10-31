import Link from "next/link";
import { ArrowRight, Check, FileBox, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import SectionHeading from "./SectionHeading";

const perks = [
  "Share a link to your STL / 3MF file — or just images and a description",
  "Quote within 24 hours, no obligation",
  "Single pieces welcome, bulk pricing for teams & events",
];

const specs = [
  { label: "Materials", value: "PLA, PETG, ABS, Resin" },
  { label: "Turnaround", value: "3–7 business days" },
  { label: "Minimum order", value: "Just 1 piece" },
  { label: "Bulk orders", value: "Custom pricing" },
];

export default function CTASection() {
  return (
    <section className="overflow-x-clip py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <div>
          <SectionHeading
            index="04"
            eyebrow="Custom prints"
            title={
              <>
                Got an idea?
                <br />
                <span className="text-gradient">We&apos;ll print it.</span>
              </>
            }
            description="Nameplates, prototypes, replacement parts, cosplay, corporate gifts — if it fits on our print bed, we can make it."
          />
          <ul className="-mt-4 space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-muted-foreground">{perk}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/custom-order"
            className={buttonVariants({ variant: "glow", size: "xl", className: "group mt-10" })}
          >
            <Upload className="h-5 w-5" />
            Request a custom print
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Quote request mock-up */}
        <div className="reveal relative" aria-hidden>
          <div className="absolute -inset-6 rotate-3 rounded-[2.5rem] bg-primary/15" />
          <div className="relative rounded-[2rem] border border-border bg-surface p-6 shadow-2xl shadow-foreground/10 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold">New quote request</p>
              <span className="rounded-full bg-success/12 px-3 py-1 text-xs font-semibold text-success">
                Reply in &lt; 24h
              </span>
            </div>

            <div className="bg-layers mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-6 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <FileBox className="h-7 w-7" />
              </div>
              <p className="mt-4 font-semibold">desk-nameplate-v2.stl</p>
              <p className="text-sm text-muted-foreground">2.4 MB · 120 × 40 × 18 mm</p>
              <div className="mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2">
                <div className="animate-progress h-full w-full rounded-full bg-primary" />
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              {specs.map((item) => (
                <div key={item.label} className="rounded-2xl bg-surface-2/70 p-4">
                  <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
