import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "./input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <textarea
        className={cn(fieldClass, "min-h-[100px] resize-y py-3", error && "border-destructive", className)}
        aria-invalid={error ? true : undefined}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
