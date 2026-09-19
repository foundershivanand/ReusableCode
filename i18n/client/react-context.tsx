import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { LocaleMetadata, TranslationDictionary } from "../schemas/i18n-schemas.js";
import { I18nClient } from "./i18n-client.js";

export interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  direction: "ltr" | "rtl";
  locales: LocaleMetadata[];
  t: (key: string, variables?: Record<string, string | number>, count?: number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface TranslationProviderProps {
  client?: I18nClient;
  defaultLocale?: string;
  initialTranslations?: Record<string, string>;
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  client,
  defaultLocale = "en",
  initialTranslations = {},
  children,
}) => {
  const [locale, setLocaleState] = useState<string>(defaultLocale);
  const [translations, setTranslations] = useState<Record<string, string>>(initialTranslations);
  const [locales, setLocales] = useState<LocaleMetadata[]>([]);

  const i18nClient = useMemo(() => client || new I18nClient(), [client]);

  const direction: "ltr" | "rtl" = useMemo(() => {
    const base = locale.split("-")[0].toLowerCase();
    return ["ar", "he", "fa", "ur"].includes(base) ? "rtl" : "ltr";
  }, [locale]);

  useEffect(() => {
    // Set document dir attribute dynamically
    if (typeof document !== "undefined") {
      document.documentElement.dir = direction;
      document.documentElement.lang = locale;
    }
  }, [direction, locale]);

  useEffect(() => {
    i18nClient
      .getLocales()
      .then((data) => setLocales(data))
      .catch(() => {});
  }, [i18nClient]);

  const loadTranslations = useCallback(
    async (loc: string) => {
      try {
        const dict = await i18nClient.getDictionary(loc, "common");
        if (dict?.translations) {
          setTranslations(dict.translations);
        }
      } catch {
        // Fallback gracefully
      }
    },
    [i18nClient]
  );

  useEffect(() => {
    loadTranslations(locale);
  }, [locale, loadTranslations]);

  const setLocale = useCallback(
    (newLocale: string) => {
      setLocaleState(newLocale);
      loadTranslations(newLocale);
    },
    [loadTranslations]
  );

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>, count?: number): string => {
      let lookupKey = key;
      if (count !== undefined) {
        try {
          const pr = new Intl.PluralRules(locale);
          const cat = pr.select(count);
          lookupKey = `${key}.${cat}`;
        } catch {
          lookupKey = `${key}.other`;
        }
      }

      let template = translations[lookupKey] || translations[`${key}.other`] || key;
      const allVars = { ...(variables || {}) };
      if (count !== undefined && allVars.count === undefined) {
        allVars.count = count;
      }

      for (const [k, v] of Object.entries(allVars)) {
        template = template.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
        template = template.replace(new RegExp(`{\\s*${k}\\s*}`, "g"), String(v));
      }

      return template;
    },
    [locale, translations]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (value: number, currency: string = "USD") => {
      return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    },
    [locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        direction,
        locales,
        t,
        formatNumber,
        formatCurrency,
        formatDate,
      }}
    >
      <div dir={direction} style={{ width: "100%", height: "100%" }}>
        {children}
      </div>
    </I18nContext.Provider>
  );
};

export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18nContext must be used within a TranslationProvider");
  }
  return ctx;
}
