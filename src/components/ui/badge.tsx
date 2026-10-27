import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      soft: "bg-primary/12 text-primary-strong",
      secondary: "bg-surface-2 text-foreground",
      success: "bg-success/12 text-success",
      warning: "bg-warning/12 text-warning",
      destructive: "bg-destructive/12 text-destructive",
      outline: "border border-border text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
