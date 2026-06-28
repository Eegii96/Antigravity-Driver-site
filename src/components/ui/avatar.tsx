import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--muted)]",
        className
      )}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--muted-foreground)]",
        className
      )}
      {...props}
    />
  );
}
