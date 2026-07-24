import { Mcu } from "material-theme-builder";
import type { ReactNode } from "react";
import { THEME_STORAGE_KEY, ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";

/**
 * Material 3 source colour for the site. Exported so the prerender script
 * can extract the matching CSS at build time and inline it in the `<head>`
 * to avoid a white flash before `<Mcu>` mounts client-side.
 */
export const MCU_SOURCE = "#0e1216";

/**
 * Shared provider tree for the landing page.
 *
 * Used by both `main.tsx` (client entry) and `server.tsx` (build-time SSR
 * entry) so the pre-rendered and hydrated trees match.
 *
 * `LocaleProvider` is wrapped externally because each entry resolves the
 * locale differently (URL pathname vs build-time argument).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Mcu source={MCU_SOURCE}>
      <ThemeProvider defaultTheme="system" storageKey={THEME_STORAGE_KEY}>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </Mcu>
  );
}
