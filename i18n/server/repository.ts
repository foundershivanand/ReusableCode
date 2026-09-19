import {
  LocaleMetadata,
  TranslationDictionary,
} from "../schemas/i18n-schemas.js";

export interface I18nRepository {
  getLocales(): Promise<LocaleMetadata[]>;
  getLocale(code: string): Promise<LocaleMetadata | null>;
  saveLocale(locale: LocaleMetadata): Promise<void>;
  getDictionary(locale: string, namespace?: string): Promise<TranslationDictionary | null>;
  saveDictionary(dict: TranslationDictionary): Promise<void>;
  recordMissingKey(locale: string, namespace: string, key: string): Promise<void>;
  getMissingKeys(locale: string, namespace?: string): Promise<string[]>;
}

export class InMemoryI18nRepository implements I18nRepository {
  private locales = new Map<string, LocaleMetadata>();
  private dictionaries = new Map<string, TranslationDictionary>();
  private missingKeys = new Set<string>();

  constructor() {
    // Seed default common locales
    const defaults: LocaleMetadata[] = [
      {
        code: "en",
        name: "English",
        nativeName: "English",
        direction: "ltr",
        defaultCurrency: "USD",
        defaultTimezone: "UTC",
        calendar: "gregory",
        isActive: true,
      },
      {
        code: "fr",
        name: "French",
        nativeName: "Français",
        direction: "ltr",
        defaultCurrency: "EUR",
        defaultTimezone: "Europe/Paris",
        calendar: "gregory",
        isActive: true,
      },
      {
        code: "fr-CA",
        name: "French (Canada)",
        nativeName: "Français (Canada)",
        direction: "ltr",
        defaultCurrency: "CAD",
        defaultTimezone: "America/Montreal",
        calendar: "gregory",
        isActive: true,
      },
      {
        code: "ar",
        name: "Arabic",
        nativeName: "العربية",
        direction: "rtl",
        defaultCurrency: "AED",
        defaultTimezone: "Asia/Dubai",
        calendar: "islamic-umalqura",
        isActive: true,
      },
      {
        code: "he",
        name: "Hebrew",
        nativeName: "עברית",
        direction: "rtl",
        defaultCurrency: "ILS",
        defaultTimezone: "Asia/Jerusalem",
        calendar: "hebrew",
        isActive: true,
      },
      {
        code: "de",
        name: "German",
        nativeName: "Deutsch",
        direction: "ltr",
        defaultCurrency: "EUR",
        defaultTimezone: "Europe/Berlin",
        calendar: "gregory",
        isActive: true,
      },
    ];

    for (const l of defaults) {
      this.locales.set(l.code.toLowerCase(), l);
    }
  }

  async getLocales(): Promise<LocaleMetadata[]> {
    return Array.from(this.locales.values()).filter((l) => l.isActive);
  }

  async getLocale(code: string): Promise<LocaleMetadata | null> {
    const l = this.locales.get(code.toLowerCase());
    return l ? { ...l } : null;
  }

  async saveLocale(locale: LocaleMetadata): Promise<void> {
    this.locales.set(locale.code.toLowerCase(), { ...locale });
  }

  async getDictionary(
    locale: string,
    namespace: string = "common"
  ): Promise<TranslationDictionary | null> {
    const key = `${locale.toLowerCase()}:${namespace}`;
    const dict = this.dictionaries.get(key);
    return dict ? { ...dict } : null;
  }

  async saveDictionary(dict: TranslationDictionary): Promise<void> {
    const key = `${dict.locale.toLowerCase()}:${dict.namespace || "common"}`;
    this.dictionaries.set(key, { ...dict });
  }

  async recordMissingKey(locale: string, namespace: string, key: string): Promise<void> {
    this.missingKeys.add(`${locale.toLowerCase()}:${namespace}:${key}`);
  }

  async getMissingKeys(locale: string, namespace?: string): Promise<string[]> {
    const prefix = namespace
      ? `${locale.toLowerCase()}:${namespace}:`
      : `${locale.toLowerCase()}:`;
    return Array.from(this.missingKeys)
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.split(":").slice(2).join(":"));
  }
}
