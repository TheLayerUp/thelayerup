import Link from "next/link";
import { cn } from "@/lib/utils";

/** Vector version of /images/logo.png — three stacked layer arcs. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-8 w-8", className)} aria-hidden>
      <g fill="none" stroke="rgb(var(--primary))" strokeLinecap="round" strokeWidth="4.2">
        <path d="M13 25h5c7 0 11-4 11-10.5V12" />
        <path d="M9 32.5h10c10 0 16-6.5 16-16V9" />
        <path d="M5 40h15c13 0 21-8.5 21-21.5V6" />
      </g>
    </svg>
  );
}

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} aria-label="TheLayerUp home">
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        The<span className="text-primary">LayerUp</span>
      </span>
    </Link>
  );
}
