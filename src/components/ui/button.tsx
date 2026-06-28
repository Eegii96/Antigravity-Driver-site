import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "default" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90",
  outline:
    "border border-[var(--border)] bg-transparent text-[var(--fg)] hover:bg-[var(--muted)]",
  ghost: "bg-transparent text-[var(--fg)] hover:bg-[var(--muted)]",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  default: "h-11 px-5 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
  icon: "h-10 w-10 rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
