import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, Heart, Leaf, ShieldCheck, Star, Truck } from "lucide-react";
import { site } from "@/config/site";
import { reels } from "@/config/showcase";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/server/queries/catalog";
import LazyVideo from "./LazyVideo";
import ReelCarousel, { type ReelTile } from "./ReelCarousel";
import { T } from "@/i18n/LanguageProvider";
import type { Key } from "@/i18n/dict";

type Tile = ReelTile;

function fileName(label: string, video: boolean) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 14)
    .replace(/-$/, "");
  return `${base}.${video ? "mov" : "stl"}`;
}

/** Phone-sized "app window" used in the drifting strip on phones and tablets. */
function Window({
  tile,
  className,
  priority,
  delay = 0,
}: {
  tile: Tile;
  className?: string;
  priority?: boolean;
  /** Offsets the print timelapse so the windows don't all print in sync. */
  delay?: number;
}) {
  return (
    <Link href={tile.href} className={cn("group block", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_18px_40px_-18px_rgb(var(--foreground)/0.35)] transition-transform duration-300 group-hover:-translate-y-1">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-2/60 px-2.5 py-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        </div>
        <div className="relative aspect-[4/5] bg-surface-2">
          {tile.video ? (
            <LazyVideo src={tile.video} poster={tile.image} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            // No clip yet: play a CSS "print timelapse" of the product photo instead.
            <>
              <div className="animate-timelapse absolute inset-0" style={{ animationDelay: `${delay}s` }}>
                <Image
                  src={tile.image}
                  alt={tile.label}
                  fill
                  priority={priority}
                  sizes="208px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <span
                className="animate-timelapse-nozzle absolute inset-x-0 h-[3px] -translate-y-1/2 bg-primary shadow-[0_0_12px_2px_rgb(var(--primary)/0.7)]"
                style={{ animationDelay: `${delay}s` }}
                aria-hidden
              />
            </>
          )}
        </div>
      </div>
      <p className="mt-2 truncate text-center font-mono text-[11px] text-muted-foreground">
        {fileName(tile.label, Boolean(tile.video))}
      </p>
    </Link>
  );
}

/** Warm, brand-adjacent fills for the avatar stack. */
const avatarTones = ["bg-[#c2410c]", "bg-[#0f766e]", "bg-[#7c3aed]", "bg-[#b45309]"];

const trust: { icon: typeof Truck; title: Key; sub: Key }[] = [
  { icon: Truck, title: "trust.ship", sub: "trust.shipSub" },
  { icon: Boxes, title: "trust.custom", sub: "trust.customSub" },
  { icon: ShieldCheck, title: "trust.quality", sub: "trust.qualitySub" },
  { icon: Leaf, title: "trust.eco", sub: "trust.ecoSub" },
  { icon: Heart, title: "trust.india", sub: "trust.indiaSub" },
];

/** Five quick reassurances under the hero: a swipeable row on phones, one strip on desktop. */
function TrustStrip() {
  return (
    <div className="relative mx-auto max-w-[1400px] lg:px-8">
      <ul className="flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-2.5 overflow-x-auto px-5 pb-1 lg:grid lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-border lg:overflow-visible lg:rounded-2xl lg:border lg:border-border lg:bg-surface/70 lg:px-0 lg:py-5 lg:backdrop-blur [&::-webkit-scrollbar]:hidden">
        {trust.map(({ icon: Icon, title, sub }) => (
          <li
            key={title}
            className="flex shrink-0 snap-start items-center gap-3 rounded-2xl border border-border bg-surface/70 px-4 py-3 lg:justify-center lg:rounded-none lg:border-0 lg:bg-transparent lg:px-4 lg:py-0"
          >
            <Icon className="h-6 w-6 shrink-0 text-foreground/80 lg:h-7 lg:w-7" strokeWidth={1.6} />
            <span className="leading-tight">
              <span className="block text-sm font-semibold whitespace-nowrap">
                <T k={title} />
              </span>
              <span className="block text-xs whitespace-nowrap text-muted-foreground">
                <T k={sub} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HeroSection({ products }: { products: ProductCardData[] }) {
  const productTiles: Tile[] = products.map((p) => ({
    key: p.id,
    href: `/products/${p.slug}`,
    label: p.name,
    image: p.image,
  }));
  // Real Instagram clips take over the carousel once they're added to showcase.ts.
  const deskTiles: Tile[] = reels.length
    ? reels.map((r, i) => ({
        key: `reel-${i}`,
        href: r.href ?? "/products",
        label: r.caption,
        image: r.poster,
        video: r.video,
      }))
    : productTiles;

  return (
    <section className="relative -mt-[4.375rem] overflow-hidden pt-[4.375rem] pb-8 sm:-mt-[4.875rem] sm:pt-[4.875rem] lg:pb-12">
      {/* Print-bed dot grid, fading out towards the edges */}
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]" />

      <div className="relative mx-auto max-w-[1400px] lg:grid lg:min-h-[620px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-6 lg:px-8 2xl:min-h-[680px]">
        {/* Headline */}
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pt-10 pb-10 text-center sm:pt-16 lg:mx-0 lg:items-start lg:px-0 lg:pt-12 lg:pb-6 lg:text-left">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur lg:hidden">
            <span className="animate-blink h-1.5 w-1.5 rounded-full bg-success" />
            <T k="hero.badge" />
          </span>
          {/* Handwritten aside (desktop) */}
          <p className="animate-rise hidden max-w-[15rem] origin-left -rotate-[5deg] font-hand text-[1.7rem] leading-none font-medium text-muted-foreground lg:block">
            <T k="hero.eyebrow" />
          </p>

          <h1 className="hero-title animate-rise mt-6 text-[clamp(2.6rem,10.5vw,4.25rem)] leading-[0.95] font-bold tracking-[-0.045em] [animation-delay:60ms] lg:mt-6 lg:text-[clamp(3.25rem,4.9vw,5rem)]">
            <T k="hero.h1a" /> <br className="hidden lg:block" />
            <span className="text-primary">
              <T k="hero.h1b" />
            </span>{" "}
            <T k="hero.h1c" />
          </h1>

          <p className="animate-rise mt-5 max-w-md text-base leading-relaxed text-balance text-muted-foreground [animation-delay:120ms] sm:text-lg">
            <T k="hero.sub" />
          </p>

          <div className="animate-rise mt-8 flex w-full flex-col gap-3 [animation-delay:180ms] sm:w-auto sm:flex-row">
            <Link
              href="/products"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-[15px] font-semibold text-background shadow-[0_10px_30px_-10px_rgb(var(--foreground)/0.6)] transition-transform active:scale-[0.98] sm:h-13 sm:hover:-translate-y-0.5 lg:bg-primary lg:text-primary-foreground lg:shadow-[0_12px_30px_-10px_rgb(var(--primary)/0.7)]"
            >
              <T k="hero.shop" />
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/custom-order"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface px-7 text-[15px] font-semibold transition-colors hover:border-foreground sm:h-13"
            >
              <Boxes className="h-4 w-4" strokeWidth={1.8} />
              <T k="hero.custom" />
            </Link>
          </div>

          {/* Social proof: figures come from site.socialProof, keep them accurate. */}
          <div className="animate-rise mt-6 flex flex-col items-center gap-2 [animation-delay:240ms] lg:items-start">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-start">
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2.5" aria-hidden>
                  {site.socialProof.avatars.map((initial, i) => (
                    <span
                      key={i}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-background",
                        avatarTones[i % avatarTones.length]
                      )}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium">
                  <T k="hero.customers" amount={site.socialProof.customers} />
                </span>
              </div>
              <span className="flex items-center gap-0.5" role="img" aria-label={`${site.socialProof.rating} / 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < Math.round(site.socialProof.rating)
                        ? "fill-[#fbbf24] text-[#fbbf24]"
                        : "text-muted-foreground/40"
                    )}
                  />
                ))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground lg:text-sm">
              <T k="hero.note" />
            </p>
          </div>
        </div>

        {/* Desktop: carousel with the centre clip in focus */}
        {deskTiles.length > 0 && (
          <div className="animate-rise relative hidden [animation-delay:120ms] lg:block">
            <ReelCarousel tiles={deskTiles} />
          </div>
        )}
      </div>

      {/* Phones & tablets: a gently drifting strip */}
      {deskTiles.length > 0 && (
        <div className="relative pb-8 lg:hidden">
          <div className="animate-marquee flex w-max gap-4 px-2 [animation-duration:45s]">
            {[...deskTiles, ...deskTiles].map((t, i) => (
              <Window
                key={`${t.key}-${i}`}
                tile={t}
                priority={i < 2}
                delay={-i * 1.3}
                className={cn("w-36 shrink-0 sm:w-44", i % 2 ? "rotate-2" : "-rotate-2")}
              />
            ))}
          </div>
        </div>
      )}

      <div className="lg:mt-6">
        <TrustStrip />
      </div>
    </section>
  );
}
