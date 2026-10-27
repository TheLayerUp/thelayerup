import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "flex w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        className={cn(
          fieldClass,
          "h-11",
          error && "border-destructive focus:border-destructive focus:ring-destructive/25",
          className
        )}
        aria-invalid={error ? true : undefined}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-muted-foreground", className)} {...props} />;
}

export { Input };
