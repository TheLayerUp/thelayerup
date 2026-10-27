import Link from "next/link";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Widths (in %) of each printed layer, bottom to top — a lamp silhouette.
const layers = [62, 70, 76, 80, 82, 82, 80, 76, 70, 62, 54, 46, 40, 36, 34, 34, 36, 40, 26, 14];

export default function HeroSection() {
  return (
    <section className="bg-layers relative overflow-hidden border-b border-border">
      <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div className="animate-rise">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-strong">
            <Sparkles className="h-3.5 w-3.5" />
            Crafted layer by layer
          </div>

          <h1 className="text-5xl leading-[1.02] font-bold sm:text-6xl lg:text-7xl">
            Objects that
            <br />
            <span className="text-gradient">level up</span> your space.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Aesthetic lamps, planters, desk gear and personalised gifts — 3D printed to order in Chennai. Or bring your
            own idea and we&apos;ll print it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className={buttonVariants({ variant: "glow", size: "xl", className: "group" })}>
              Shop the collection
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/custom-order" className={buttonVariants({ variant: "outline", size: "xl" })}>
              Request a custom print
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" />
              Pan-India shipping
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Secure UPI & card payments
            </li>
            <li className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-primary" />
              Quality-checked by hand
            </li>
          </ul>
        </div>

        {/* Print-in-progress illustration */}
        <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block" aria-hidden>
          <div className="absolute inset-0 rounded-[2.5rem] border border-border bg-surface/70 shadow-2xl shadow-primary/10 backdrop-blur" />
          <div className="absolute top-8 right-8 left-8 h-2 rounded-full bg-surface-2">
            <div className="absolute top-1/2 left-1/2 h-6 w-10 -translate-x-1/2 -translate-y-1/2 rounded-md bg-foreground" />
          </div>
          <div className="absolute inset-x-0 bottom-14 flex flex-col-reverse items-center gap-[3px]">
            {layers.map((w, i) => (
              <div
                key={i}
                className="h-[9px] origin-left rounded-full bg-primary"
                style={{
                  width: `${w * 0.8}%`,
                  opacity: 0.55 + (i / layers.length) * 0.45,
                  animation: `print-layer 0.5s ${0.15 + i * 0.09}s both cubic-bezier(.2,.7,.2,1)`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-x-12 bottom-10 h-2 rounded-full bg-foreground/80" />
        </div>
      </div>
    </section>
  );
}
