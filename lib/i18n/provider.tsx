"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Language } from "@/types";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  dictionaries,
  en,
  type TranslationKey,
} from "./dictionaries";

type Translator = (key: TranslationKey, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translator;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "desco-language";

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "bn";
}

/**
 * Persists the language in BOTH localStorage and a cookie:
 *   - localStorage: instant read on the client, survives with no server round-trip
 *   - cookie: readable by Server Components so `<html lang>` is correct on first
 *     paint and there is no flash of the wrong language
 */
function persist(lang: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode / storage disabled — the cookie below still carries it.
  }
  // 1 year, lax so it survives normal navigation but not cross-site POSTs.
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}: {
  children: React.ReactNode;
  /** Read server-side from the cookie so SSR and the client agree. */
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // Reconcile with localStorage after hydration. The cookie is authoritative on
  // the server, but localStorage wins if the two ever drift (e.g. cookie
  // cleared) — and we write the cookie back so they re-converge.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (isLanguage(stored) && stored !== language) {
      setLanguageState(stored);
      persist(stored);
    } else {
      persist(language);
    }
    // Intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    persist(lang);
  }, []);

  const t = useCallback<Translator>(
    (key, vars) => {
      const dict = dictionaries[language] ?? en;
      let value: string = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replaceAll(`{${name}}`, String(replacement));
        }
      }
      return value;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used inside <I18nProvider>");
  }
  return ctx;
}
