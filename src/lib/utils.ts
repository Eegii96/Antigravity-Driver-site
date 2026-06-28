/**
 * Minimal class-name combiner — shadcn/ui's standard `cn()` helper, written
 * without the cva/clsx/tailwind-merge dependencies so it can drop into this
 * project with zero new npm packages. Falsy values are filtered out.
 *
 * Usage: cn("base-class", isActive && "active-class", className)
 */
export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}
