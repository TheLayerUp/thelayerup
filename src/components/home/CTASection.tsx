import Link from "next/link";
import { ArrowRight, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-foreground p-8 text-background sm:p-12 lg:p-16">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-5xl">
                Got an idea?
                <br />
                <span className="text-primary">We&apos;ll print it.</span>
              </h2>
              <p className="mt-4 max-w-lg text-lg leading-relaxed opacity-75">
                Send a 3D file or just describe what you need — nameplates, prototypes, replacement parts, corporate
                gifts. You&apos;ll get a quote within 24 hours.
              </p>
              <Link
                href="/custom-order"
                className={buttonVariants({ variant: "glow", size: "lg", className: "group mt-8" })}
              >
                <Upload className="h-4 w-4" />
                Request a custom print
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {[
                { label: "Materials", value: "PLA, PETG, ABS, Resin" },
                { label: "Turnaround", value: "3–7 business days" },
                { label: "Minimum order", value: "Just 1 piece" },
                { label: "Bulk orders", value: "Custom pricing" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-background/15 bg-background/5 p-4">
                  <dt className="text-xs font-medium tracking-wider uppercase opacity-60">{item.label}</dt>
                  <dd className="mt-1 font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
