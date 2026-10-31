"use client";

import { useEffect, useRef } from "react";

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Muted looping clip that only downloads once it's on screen and pauses when it
 * leaves. Falls back to the poster on Save-Data, slow connections or reduced motion.
 */
export default function LazyVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const net = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      net?.saveData ||
      /(^|-)2g$/.test(net?.effectiveType ?? "")
    ) {
      return;
    }
    // Autoplay policies require the muted *property*, which React doesn't always set.
    el.muted = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Set the source directly so play() sees it in the same tick.
          if (!el.getAttribute("src")) el.src = src;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.35, rootMargin: "120px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  // suppressHydrationWarning: media extensions stamp their own data-* attributes on <video> before hydration.
  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      suppressHydrationWarning
    />
  );
}
