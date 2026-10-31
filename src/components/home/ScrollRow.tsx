"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Horizontal scroll-snap row with prev/next buttons for mouse users. */
export default function ScrollRow({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-6 focus-visible:outline-none sm:-mx-6 sm:scroll-px-6 sm:gap-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        {([-1, 1] as const).map((dir) => {
          const Icon = dir === -1 ? ArrowLeft : ArrowRight;
          return (
            <button
              key={dir}
              type="button"
              onClick={() => scrollBy(dir)}
              aria-label={dir === -1 ? "Scroll left" : "Scroll right"}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
