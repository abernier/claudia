import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with `clsx`, then de-conflict overlapping Tailwind
 * utilities with `tailwind-merge` — the standard shadcn `cn` helper.
 *
 * @param inputs - class values (strings, arrays, conditionals) to combine.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
