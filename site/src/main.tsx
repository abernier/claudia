import { Analytics } from "@vercel/analytics/react";
import "asciinema-player/dist/bundle/asciinema-player.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { DEFAULT_LOCALE, LocaleProvider, messages, type Locale } from "./i18n/LocaleContext";
import "./index.css";
import { Page } from "./page";
import { Providers } from "./providers";

// ---------------------------------------------------------------------------
// Locale detection from URL path — `/` is English, `/{locale}/` otherwise
// ---------------------------------------------------------------------------

const localeFromPath = window.location.pathname.match(/^\/([^/]+)\/?/)?.[1];
const initialLocale: Locale =
  localeFromPath && localeFromPath in messages ? (localeFromPath as Locale) : DEFAULT_LOCALE;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LocaleProvider initialLocale={initialLocale}>
      <Providers>
        <Page />
      </Providers>
      <Analytics />
    </LocaleProvider>
  </React.StrictMode>,
);
