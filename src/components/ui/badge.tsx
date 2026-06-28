import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "soft";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  outline: "border border-[var(--border)] text-[var(--fg)] bg-transparent",
  soft: "bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
