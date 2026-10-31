import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  index?: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  /** Use on dark (inverted) sections. */
  inverted?: boolean;
}

export default function SectionHeading({ index, eyebrow, title, description, action, inverted }: SectionHeadingProps) {
  return (
    <div className="mb-12 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p
          className={cn(
            "flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase",
            inverted ? "text-primary" : "text-primary-strong"
          )}
        >
          {index && <span className="font-mono tracking-normal">{index}</span>}
          <span className={cn("h-px w-8", inverted ? "bg-background/30" : "bg-border")} />
          {eyebrow}
        </p>
        <h2 className="mt-4 text-4xl leading-[1.02] font-bold tracking-[-0.035em] sm:text-5xl lg:text-6xl">{title}</h2>
        {description && (
          <p className={cn("mt-4 text-lg leading-relaxed", inverted ? "opacity-70" : "text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
