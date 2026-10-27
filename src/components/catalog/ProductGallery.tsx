"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3 lg:sticky lg:top-28 lg:self-start">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface-2">
        <Image
          src={images[active]}
          alt={`${name} — image ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-surface-2",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
