"use client";

import { useState } from "react";
import { Box, Loader2, X } from "lucide-react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        alt: string;
        poster?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
        "touch-action"?: string;
        ar?: boolean;
      };
    }
  }
}

/**
 * "View in 3D": the ~200 kB viewer library and the model only download when
 * the shopper asks for them, so product pages stay fast.
 */
export default function ModelViewer({ src, name, poster }: { src: string; name: string; poster?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ready">("idle");

  const open = async () => {
    setState("loading");
    await import("@google/model-viewer");
    setState("ready");
  };

  if (state !== "ready") {
    return (
      <button
        type="button"
        onClick={open}
        disabled={state === "loading"}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary disabled:opacity-70"
      >
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4 text-primary" />}
        View in 3D
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-2">
      <model-viewer
        src={src}
        alt={`3D model of ${name}`}
        poster={poster}
        camera-controls
        auto-rotate
        ar
        shadow-intensity="1"
        touch-action="pan-y"
        style={{ width: "100%", height: "min(70vh, 480px)", background: "transparent" }}
      />
      <button
        type="button"
        onClick={() => setState("idle")}
        aria-label="Close 3D view"
        className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-background/90 shadow"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/85 px-3 py-1 text-xs text-muted-foreground">
        Drag to rotate · pinch to zoom
      </p>
    </div>
  );
}
