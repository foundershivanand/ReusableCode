import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryI18nRepository, I18nService } from "../server/index.js";

describe("Module 22: Multi-Language & i18n", () => {
  let repo: InMemoryI18nRepository;
  let service: I18nService;

  beforeEach(async () => {
    repo = new InMemoryI18nRepository();
    service = new I18nService(repo, "en");

    // Setup base translations
    await repo.saveDictionary({
      locale: "en",
      namespace: "common",
      version: "1.0.0",
      translations: {
        "welcome": "Welcome, {{name}}!",
        "item.one": "{{count}} item",
        "item.other": "{{count}} items",
        "only_in_en": "Only in English",
      },
      updatedAt: new Date().toISOString(),
    });

    await repo.saveDictionary({
      locale: "fr",
      namespace: "common",
      version: "1.0.0",
      translations: {
        "welcome": "Bienvenue, {{name}}!",
        "item.one": "{{count}} article",
        "item.other": "{{count}} articles",
      },
      updatedAt: new Date().toISOString(),
    });

    await repo.saveDictionary({
      locale: "fr-CA",
      namespace: "common",
      version: "1.0.0",
      translations: {
        "welcome": "Bienvenue au Québec, {{name}}!",
        // Note: item.one, item.other omitted to test fallback to 'fr'
      },
      updatedAt: new Date().toISOString(),
    });
  });

  it("should detect locale following the detection cascade", () => {
    // 1. Query parameter takes highest priority
    const loc1 = service.detectLocale({
      queryParam: "fr",
      cookie: "de",
      acceptLanguageHeader: "en-US,en;q=0.9",
    });
    expect(loc1).toBe("fr");

    // 2. Cookie takes second priority
    const loc2 = service.detectLocale({
      cookie: "de",
      acceptLanguageHeader: "en-US,en;q=0.9",
    });
    expect(loc2).toBe("de");

    // 3. Accept-Language header takes third priority
    const loc3 = service.detectLocale({
      acceptLanguageHeader: "fr-CA,fr;q=0.8,en;q=0.5",
    });
    expect(loc3).toBe("fr-CA");

    // 4. Default fallback
    const loc4 = service.detectLocale({
      acceptLanguageHeader: "ja;q=0.9", // Not in supported list
    });
    expect(loc4).toBe("en");
  });

  it("should resolve translations following fallback hierarchy (fr-CA -> fr -> en)", async () => {
    // 1. Direct key in fr-CA
    const text1 = await service.translate({
      key: "welcome",
      locale: "fr-CA",
      variables: { name: "Shiva" },
    });
    expect(text1).toBe("Bienvenue au Québec, Shiva!");

    // 2. Key missing in fr-CA, falls back to fr
    const text2 = await service.translate({
      key: "item",
      locale: "fr-CA",
      count: 2,
    });
    expect(text2).toBe("2 articles");

    // 3. Key missing in both fr-CA and fr, falls back to en
    const text3 = await service.translate({
      key: "only_in_en",
      locale: "fr-CA",
    });
    expect(text3).toBe("Only in English");
  });

  it("should handle pluralization using Intl.PluralRules", async () => {
    const single = await service.translate({
      key: "item",
      locale: "en",
      count: 1,
    });
    expect(single).toBe("1 item");

    const multiple = await service.translate({
      key: "item",
      locale: "en",
      count: 5,
    });
    expect(multiple).toBe("5 items");
  });

  it("should sanitize interpolated variables to prevent XSS", async () => {
    const malicious = await service.translate({
      key: "welcome",
      locale: "en",
      variables: { name: "<script>alert('xss')</script>" },
    });
    expect(malicious).not.toContain("<script>");
    expect(malicious).toContain("&lt;script&gt;");
  });

  it("should detect RTL locales and return correct direction metadata", async () => {
    expect(service.isRtl("ar")).toBe(true);
    expect(service.isRtl("he")).toBe(true);
    expect(service.isRtl("en")).toBe(false);
    expect(service.isRtl("fr-CA")).toBe(false);

    const arMeta = await service.getLocaleMetadata("ar");
    expect(arMeta.direction).toBe("rtl");
  });

  it("should format numbers, currencies, and dates accurately according to locale", () => {
    const num = 1234567.89;
    const formattedEn = service.formatNumber(num, "en-US");
    expect(formattedEn).toContain("1,234,567.89");

    const curr = service.formatCurrency(50, "en-US", "USD");
    expect(curr).toContain("$50.00");

    const dateStr = service.formatDateTime(new Date("2026-01-15T12:00:00Z"), "en-US");
    expect(dateStr).toContain("2026");
  });

  it("should detect missing and stale keys relative to canonical locale", async () => {
    const report = await service.checkMissingKeys("fr", "common");
    expect(report.missingKeys).toContain("only_in_en");
  });
});
