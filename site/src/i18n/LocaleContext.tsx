import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { IntlProvider } from "react-intl";

import { getInitialLocale, getMessagesSnapshot, type Locale, LOCALE_STORAGE_KEY, subscribeMessages } from "./messages";

export { DEFAULT_LOCALE, LOCALE_LABELS, messages, type Locale } from "./messages";

interface LocaleContextValue {
  /** Current active locale. */
  locale: Locale;
  /** Switch to a different locale (persisted in localStorage). */
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

/** Read the current locale and its setter from context. */
export function useLocale() {
  return useContext(LocaleContext);
}

/**
 * Manages locale state and wraps children with `react-intl`'s `<IntlProvider>`.
 *
 * @param props
 * @param props.children - React subtree that needs access to i18n messages.
 * @param props.initialLocale - Force a specific locale instead of detecting from
 *   localStorage / browser / URL. Useful for SSR and locale-prefixed routes.
 */
export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** When provided, skip auto-detection and start with this locale. */
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? getInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  // Keep <html lang> in sync with the active locale.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Live messages: swaps in the new catalog when a `lang/*.json` file is
  // edited in dev. The third arg returns the same snapshot at SSR time, so
  // the prerendered HTML doesn't differ from the first client render.
  const messages = useSyncExternalStore(subscribeMessages, getMessagesSnapshot, getMessagesSnapshot);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
