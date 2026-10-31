const words = [
  "Lamps",
  "Planters",
  "Desk gear",
  "Keychains",
  "Wall art",
  "Gifts",
  "Custom prints",
  "Prototypes",
  "PLA · PETG · Resin",
];

export default function Marquee() {
  // Rendered twice so the -50% translate loops seamlessly.
  const row = [...words, ...words];
  return (
    <div className="relative left-1/2 w-[110vw] -translate-x-1/2 -rotate-1 overflow-hidden border-y border-foreground/10 bg-primary py-4 text-primary-foreground sm:py-5">
      <div className="animate-marquee flex w-max items-center" aria-hidden>
        {row.map((word, i) => (
          <span key={i} className="flex items-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="px-6">{word}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-70" fill="currentColor">
              <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
            </svg>
          </span>
        ))}
      </div>
      <p className="sr-only">{words.join(", ")}</p>
    </div>
  );
}
