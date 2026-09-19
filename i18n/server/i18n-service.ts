import {
  LocaleMetadata,
  TranslationDictionary,
  FormatNumberOptions,
  FormatDateTimeOptions,
  MissingKeyReport,
} from "../schemas/i18n-schemas.js";
import { I18nRepository } from "./repository.js";

export class I18nService {
  constructor(
    private repository: I18nRepository,
    private defaultLocale: string = "en"
  ) {}

  private sanitize(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  detectLocale(params: {
    queryParam?: string | null;
    cookie?: string | null;
    acceptLanguageHeader?: string | null;
    supportedLocales?: string[];
  }): string {
    const supported = params.supportedLocales || ["en", "fr", "fr-CA", "ar", "he", "de"];
    const isSupported = (loc: string) =>
      supported.some((s) => s.toLowerCase() === loc.toLowerCase());

    // 1. Query parameter
    if (params.queryParam && isSupported(params.queryParam)) {
      return params.queryParam;
    }

    // 2. Cookie
    if (params.cookie && isSupported(params.cookie)) {
      return params.cookie;
    }

    // 3. Accept-Language header
    if (params.acceptLanguageHeader) {
      const candidates = params.acceptLanguageHeader
        .split(",")
        .map((part) => {
          const [locale, qPart] = part.trim().split(";q=");
          const q = qPart ? parseFloat(qPart) : 1.0;
          return { locale: locale.trim(), q };
        })
        .sort((a, b) => b.q - a.q);

      for (const candidate of candidates) {
        if (isSupported(candidate.locale)) {
          return candidate.locale;
        }
        // Try base language (e.g. 'fr' from 'fr-FR')
        const base = candidate.locale.split("-")[0];
        if (isSupported(base)) {
          return base;
        }
      }
    }

    return this.defaultLocale;
  }

  async getLocaleMetadata(locale: string): Promise<LocaleMetadata> {
    const meta = await this.repository.getLocale(locale);
    if (meta) return meta;

    // Fallback: check base language
    const base = locale.split("-")[0];
    const baseMeta = await this.repository.getLocale(base);
    if (baseMeta) return baseMeta;

    return {
      code: locale,
      name: locale.toUpperCase(),
      nativeName: locale.toUpperCase(),
      direction: ["ar", "he", "fa", "ur"].includes(base.toLowerCase()) ? "rtl" : "ltr",
      defaultCurrency: "USD",
      defaultTimezone: "UTC",
      calendar: "gregory",
      isActive: true,
    };
  }

  async translate(params: {
    key: string;
    locale: string;
    namespace?: string;
    variables?: Record<string, string | number>;
    count?: number;
    sanitizeHtml?: boolean;
  }): Promise<string> {
    const ns = params.namespace || "common";
    const sanitizeHtml = params.sanitizeHtml ?? true;
    const requestedLocale = params.locale;

    // 1. Determine key with pluralization if count is provided
    let lookupKey = params.key;
    if (params.count !== undefined) {
      try {
        const pr = new Intl.PluralRules(requestedLocale);
        const category = pr.select(params.count);
        lookupKey = `${params.key}.${category}`;
      } catch {
        lookupKey = `${params.key}.other`;
      }
    }

    // 2. Fallback hierarchy: requestedLocale -> baseLocale -> defaultLocale
    const hierarchy: string[] = [requestedLocale];
    if (requestedLocale.includes("-")) {
      hierarchy.push(requestedLocale.split("-")[0]);
    }
    if (!hierarchy.includes(this.defaultLocale)) {
      hierarchy.push(this.defaultLocale);
    }

    let template: string | undefined;

    for (const loc of hierarchy) {
      const dict = await this.repository.getDictionary(loc, ns);
      if (dict && dict.translations[lookupKey] !== undefined) {
        template = dict.translations[lookupKey];
        break;
      }
      // If plural key not found in this locale, check fallback .other
      if (params.count !== undefined && dict && dict.translations[`${params.key}.other`] !== undefined) {
        template = dict.translations[`${params.key}.other`];
        break;
      }
    }

    if (template === undefined) {
      await this.repository.recordMissingKey(requestedLocale, ns, lookupKey);
      return lookupKey; // Return key as fallback
    }

    // 3. Interpolate variables safely
    let result = template;
    const allVars = { ...(params.variables || {}) };
    if (params.count !== undefined && allVars.count === undefined) {
      allVars.count = params.count;
    }

    for (const [vKey, vVal] of Object.entries(allVars)) {
      let stringVal = String(vVal);
      if (sanitizeHtml) {
        stringVal = this.sanitize(stringVal);
      }
      result = result.replace(new RegExp(`{{\\s*${vKey}\\s*}}`, "g"), stringVal);
      result = result.replace(new RegExp(`{\\s*${vKey}\\s*}`, "g"), stringVal);
    }

    return result;
  }

  formatNumber(value: number, locale: string, options?: FormatNumberOptions): string {
    return new Intl.NumberFormat(locale, {
      style: options?.style || "decimal",
      currency: options?.currency,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    }).format(value);
  }

  formatCurrency(value: number, locale: string, currency: string = "USD"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value);
  }

  formatDateTime(
    date: Date | string | number,
    locale: string,
    options?: FormatDateTimeOptions
  ): string {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
      dateStyle: options?.dateStyle || "medium",
      timeStyle: options?.timeStyle,
      timeZone: options?.timeZone || "UTC",
    }).format(d);
  }

  async checkMissingKeys(
    locale: string,
    namespace: string = "common"
  ): Promise<MissingKeyReport> {
    const canonicalDict = await this.repository.getDictionary(this.defaultLocale, ns(namespace));
    const targetDict = await this.repository.getDictionary(locale, ns(namespace));

    const canonicalKeys = Object.keys(canonicalDict?.translations || {});
    const targetKeys = new Set(Object.keys(targetDict?.translations || {}));

    const missingKeys = canonicalKeys.filter((k) => !targetKeys.has(k));
    const staleKeys = Array.from(targetKeys).filter((k) => !canonicalKeys.includes(k));

    return {
      locale,
      namespace: ns(namespace),
      missingKeys,
      staleKeys,
    };

    function ns(n: string) {
      return n || "common";
    }
  }

  isRtl(locale: string): boolean {
    const base = locale.split("-")[0].toLowerCase();
    return ["ar", "he", "fa", "ur"].includes(base);
  }
}
