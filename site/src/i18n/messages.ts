/**
 * Flat message catalogs for each supported locale.
 *
 * Each locale is maintained as a separate JSON file in `lang/`.
 */

import en from "../../lang/en.json" with { type: "json" };
import fr from "../../lang/fr.json" with { type: "json" };

const initial = { en, fr } as const;

/** Aggregated message catalogs keyed by locale. */
export const messages = initial;

/** Supported locale codes. */
export type Locale = keyof typeof initial;

/** Fallback locale when the browser language is not supported. */
export const DEFAULT_LOCALE: Locale = "en";

/** localStorage key used to persist the chosen locale. */
export const LOCALE_STORAGE_KEY = "claudia-locale";

/** Human-readable labels for each supported locale (always in their own language). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

/**
 * Resolves the initial locale from querystring → localStorage → browser language → fallback.
 */
export function getInitialLocale(): Locale {
  const param = new URLSearchParams(window.location.search).get("locale");
  if (param && param in messages) return param as Locale;

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && stored in messages) return stored as Locale;

  const base = navigator.language.split("-")[0];
  if (base in messages) return base as Locale;

  return DEFAULT_LOCALE;
}

// ---------------------------------------------------------------------------
// HMR-aware live messages store
// ---------------------------------------------------------------------------
//
// `IntlProvider` memoizes its `messages` prop reference, so editing a
// `lang/*.json` file alone wouldn't propagate to rendered `<FormattedMessage>`
// nodes. Expose `messages` as a tiny external store: `LocaleProvider`
// subscribes via `useSyncExternalStore`, and the dev-only HMR handler swaps
// the snapshot + notifies listeners so the UI updates without a full reload.

let current: typeof initial = initial;
const listeners = new Set<() => void>();

/**
 * Subscribe to live message updates. Returns an unsubscribe function.
 * Used internally by `LocaleProvider` via `useSyncExternalStore`.
 *
 * @param listener Callback invoked whenever the messages snapshot changes.
 */
export function subscribeMessages(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current messages snapshot. Stable across renders unless HMR fires. */
export function getMessagesSnapshot(): typeof initial {
  return current;
}

if (import.meta.hot) {
  // Coalesce burst HMR fires (format-on-save touching both locale files):
  // update `current` immediately but defer the notification until the burst
  // settles, so React re-renders exactly once with the final state.
  let pending: ReturnType<typeof setTimeout> | null = null;
  import.meta.hot.accept((newModule) => {
    if (!newModule) return;
    current = newModule.messages;
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
      pending = null;
      listeners.forEach((l) => l());
    }, 50);
  });
}
