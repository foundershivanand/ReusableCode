import { TranslationDictionary } from "../schemas/i18n-schemas.js";

export interface DictionaryLoader {
  loadDictionary(locale: string, namespace: string): Promise<TranslationDictionary | null>;
}

export class InMemoryDictionaryLoader implements DictionaryLoader {
  private store = new Map<string, TranslationDictionary>();

  registerDictionary(dict: TranslationDictionary) {
    const key = `${dict.locale.toLowerCase()}:${dict.namespace || "common"}`;
    this.store.set(key, dict);
  }

  async loadDictionary(locale: string, namespace: string): Promise<TranslationDictionary | null> {
    const key = `${locale.toLowerCase()}:${namespace}`;
    return this.store.get(key) || null;
  }
}
