"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";

export type ReelTile = { key: string; href: string; label: string; image: string; video?: string };

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/** How long the centre clip stays in focus before the carousel moves on. */
const AUTO_MS = 4500;
/** Distance between card centres, as a fraction of the card width. */
const STEP = 0.96;
/** Cards this far from the centre (or more) are hidden, so the loop can wrap out of sight. */
const VISIBLE = 2.4;

const mod = (a: number, n: number) => ((a % n) + n) % n;

function canAutoplayVideo() {
  const net = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  return !(
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    net?.saveData ||
    /(^|-)2g$/.test(net?.effectiveType ?? "")
  );
}

/** A clip that only downloads and plays while its card is the one in focus. */
function CardVideo({ src, poster, play }: { src: string; poster: string; play: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!play) {
      el.pause();
      return;
    }
    if (!canAutoplayVideo()) return;
    // Autoplay policies require the muted *property*, which React doesn't always set.
    el.muted = true;
    if (!el.getAttribute("src")) el.src = src;
    el.play().catch(() => {});
  }, [play, src]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      // Media extensions stamp their own data-* attributes on <video> before hydration.
      suppressHydrationWarning
    />
  );
}

/** Hand-drawn arrow pointing from a sticky note towards its card. */
function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" fill="none" className={className} aria-hidden>
      <path d="M4 6c14 0 30 6 38 22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M34 26l8 3 2-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Desktop hero carousel: the centre clip is in focus and plays, neighbours sit
 * smaller on either side. Auto-advances, and can be dragged, swiped, clicked or
 * driven with the arrow keys. Pauses on hover, while dragging and off-screen.
 */
export default function ReelCarousel({ tiles }: { tiles: ReelTile[] }) {
  const t = useT();
  // Repeat the list so there are always hidden cards either side for the loop to wrap through.
  const cards = useMemo(() => {
    let out = tiles;
    while (out.length > 0 && out.length < 8) out = [...out, ...tiles];
    return out;
  }, [tiles]);
  const n = cards.length;
  const count = tiles.length;

  const [active, setActive] = useState(0);
  /** Live drag distance, in card steps. */
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; step: number; id: number } | null>(null);
  /** Set once a press turns into a drag, so the click that follows doesn't open a link. */
  const moved = useRef(false);

  const go = (delta: number) => setActive((a) => mod(a + delta, n));

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || hovered || dragging || n < 2) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setActive((a) => mod(a + 1, n)), AUTO_MS);
    return () => clearTimeout(id);
  }, [active, inView, hovered, dragging, n]);

  if (n === 0) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    gesture.current = { x: e.clientX, step: (cardRef.current?.offsetWidth ?? 240) * STEP, id: e.pointerId };
    moved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    if (!moved.current) {
      if (Math.abs(dx) < 6) return;
      // Only capture once it's clearly a drag, so plain clicks still reach the links.
      moved.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDrag(dx / g.step);
  };

  const endGesture = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (!moved.current) return;
    // Snap to the nearest card; a short flick still moves by one.
    let steps = Math.round(-drag);
    if (steps === 0 && Math.abs(drag) > 0.12) steps = drag < 0 ? 1 : -1;
    go(steps);
    setDrag(0);
    setDragging(false);
  };

  const goToTile = (tile: number) =>
    setActive((a) => {
      let k = mod(tile - mod(a, count), count);
      if (k > count / 2) k -= count;
      return mod(a + k, n);
    });

  const activeTile = mod(active, count);

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t("hero.carousel")}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        else if (e.key === "ArrowLeft") go(-1);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          }
        }}
        className={cn(
          "relative h-[calc(clamp(13rem,17vw,16.5rem)*1.25+9rem)] touch-pan-y overflow-hidden select-none",
          "[mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        {cards.map((tile, i) => {
          let offset = mod(i - active, n);
          if (offset > n / 2) offset -= n;
          const p = offset + drag;
          const dist = Math.abs(p);
          const focused = offset === 0;
          const hidden = dist >= VISIBLE;
          const scale = 1 - Math.min(dist, 2) * 0.1;
          const opacity = hidden ? 0 : dist <= 1.2 ? 1 : 1 - (dist - 1.2) * 0.45;
          const noteBelow = mod(i, count) % 2 === 1;

          return (
            <div
              key={`${tile.key}-${i}`}
              ref={focused ? cardRef : undefined}
              aria-hidden={!focused}
              className={cn(
                "absolute top-1/2 left-1/2 w-[clamp(13rem,17vw,16.5rem)]",
                !dragging && "transition-[transform,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
                hidden && "pointer-events-none"
              )}
              style={{
                transform: `translate(-50%, -50%) translateX(calc(${p * STEP} * 100%)) scale(${scale}) rotate(${p * 1.2}deg)`,
                opacity,
                zIndex: 20 - Math.round(dist * 4),
              }}
            >
              <Link
                href={tile.href}
                draggable={false}
                tabIndex={focused ? 0 : -1}
                onClick={(e) => {
                  // A side card comes into focus first; the focused one opens.
                  if (!focused) {
                    e.preventDefault();
                    go(offset);
                  }
                }}
                className="group block"
                aria-label={tile.label}
              >
                <div
                  className={cn(
                    "relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border-[5px] border-surface bg-surface-2 transition-shadow duration-500",
                    focused
                      ? "shadow-[0_30px_60px_-20px_rgb(var(--foreground)/0.45)]"
                      : "shadow-[0_16px_36px_-18px_rgb(var(--foreground)/0.35)]"
                  )}
                >
                  {tile.video ? (
                    <CardVideo src={tile.video} poster={tile.image} play={focused && inView} />
                  ) : (
                    <Image
                      src={tile.image}
                      alt=""
                      fill
                      sizes="270px"
                      draggable={false}
                      priority={i < 3}
                      className="object-cover"
                    />
                  )}
                </div>
              </Link>

              {/* Sticky note with the clip's caption */}
              <div
                className={cn(
                  "pointer-events-none absolute left-1/2 flex items-center gap-1 transition-all duration-500",
                  noteBelow ? "-bottom-16 flex-row-reverse" : "-top-16",
                  dist < 1.4 ? "opacity-100" : "opacity-0"
                )}
                style={{ transform: `translateX(${noteBelow ? "-15%" : "-85%"})` }}
                aria-hidden
              >
                <span
                  className={cn(
                    "max-w-40 rounded-sm bg-[#fbe9a6] px-3 py-1.5 font-hand text-xl leading-[1.05] font-bold text-[#3a2a12] shadow-[0_8px_18px_-8px_rgb(0_0_0/0.35)] dark:bg-[#e9d27c]",
                    noteBelow ? "rotate-[4deg]" : "-rotate-[5deg]"
                  )}
                >
                  {tile.label}
                </span>
                <Squiggle
                  className={cn(
                    "h-8 w-10 text-foreground/70",
                    noteBelow ? "-scale-x-100 -scale-y-100" : "translate-y-3"
                  )}
                />
              </div>
            </div>
          );
        })}

        <p className="sr-only" aria-live="polite">
          {cards[active]?.label}
        </p>
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous clip"
            className="absolute top-1/2 left-1 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface/90 shadow-lg backdrop-blur transition hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next clip"
            className="absolute top-1/2 right-1 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface/90 shadow-lg backdrop-blur transition hover:scale-105 active:scale-95"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-1 flex justify-center gap-1.5">
            {tiles.map((tile, i) => (
              <button
                key={tile.key}
                type="button"
                onClick={() => goToTile(i)}
                aria-label={`Show ${tile.label}`}
                aria-current={i === activeTile}
                className="flex h-6 cursor-pointer items-center px-0.5"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-500",
                    i === activeTile ? "w-6 bg-primary" : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
