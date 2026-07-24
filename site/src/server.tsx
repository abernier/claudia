import { builder } from "material-theme-builder";
import React from "react";
import { renderToString } from "react-dom/server";
import type { Locale } from "./i18n/LocaleContext";
import { LocaleProvider } from "./i18n/LocaleContext";
import { Page } from "./page";
import { MCU_SOURCE, Providers } from "./providers";

/**
 * CSS for the Material 3 colour tokens, generated at build time from
 * {@link MCU_SOURCE}. Inlined into the pre-rendered `<head>` by
 * `scripts/prerender.ts` so the `--md-sys-color-*` variables exist at
 * first paint — without this, `Mcu` only injects them client-side via
 * `useInsertionEffect`, causing a white flash before the theme applies.
 */
export const mcuCss = builder(MCU_SOURCE).toCss();

/**
 * Render the landing page to a static HTML string for a given locale.
 *
 * Called at build time by `scripts/prerender.ts` to produce SEO-friendly
 * markup that is injected into the emitted `index.html` files.
 *
 * @param locale - The locale to render the page in.
 */
export function render(locale: Locale) {
  return renderToString(
    <React.StrictMode>
      <LocaleProvider initialLocale={locale}>
        <Providers>
          <Page />
        </Providers>
      </LocaleProvider>
    </React.StrictMode>,
  );
}
