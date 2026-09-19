import {
  LocaleMetadata,
  TranslationDictionary,
  MissingKeyReport,
} from "../schemas/i18n-schemas.js";

export class I18nClient {
  constructor(
    private baseUrl: string = "/api/i18n",
    private headers: Record<string, string> = {}
  ) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `I18n API error: ${res.status}`);
    }

    return res.json();
  }

  async getLocales(): Promise<LocaleMetadata[]> {
    return this.request<LocaleMetadata[]>("/locales");
  }

  async getDictionary(locale: string, namespace: string = "common"): Promise<TranslationDictionary> {
    return this.request<TranslationDictionary>(`/dictionary?locale=${encodeURIComponent(locale)}&namespace=${encodeURIComponent(namespace)}`);
  }

  async checkMissingKeys(locale: string, namespace: string = "common"): Promise<MissingKeyReport> {
    return this.request<MissingKeyReport>(`/missing-keys?locale=${encodeURIComponent(locale)}&namespace=${encodeURIComponent(namespace)}`);
  }
}
