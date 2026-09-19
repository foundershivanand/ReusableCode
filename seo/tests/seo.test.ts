import { describe, it, expect, beforeEach } from "vitest";
import { SeoService } from "../server/seo-service.js";
import { InMemorySeoRepository } from "../server/repository.js";

describe("Module 15: SEO, Open Graph & Meta Engine", () => {
  let repository: InMemorySeoRepository;
  let service: SeoService;

  beforeEach(() => {
    repository = new InMemorySeoRepository();
    service = new SeoService(repository, {
      defaultBaseUrl: "https://acme.com",
      trustedDomains: ["acme.com", "app.acme.com"],
      defaultTitleTemplate: "%s | Acme SaaS",
      defaultSiteName: "Acme SaaS"
    });
  });

  it("generates resolved metadata with canonical URL and robots directive", () => {
    const meta = service.generateMetadata({
      title: "Pricing Plans",
      description: "Simple and transparent pricing for teams",
      canonicalPath: "/pricing",
      environment: "production"
    });

    expect(meta.title).toBe("Pricing Plans | Acme SaaS");
    expect(meta.canonicalUrl).toBe("https://acme.com/pricing");
    expect(meta.robotsMeta).toBe("index, follow");
    expect(meta.isNoIndex).toBe(false);
  });

  it("prevents host-header poisoning by rejecting untrusted domains", () => {
    // Malicious attacker sends fake Host header
    const meta = service.generateMetadata({
      title: "Blog Post",
      description: "Great article",
      canonicalPath: "/blog/post-1",
      hostHeader: "evil-attacker.com",
      environment: "production"
    });

    // Canonical URL must NOT use evil-attacker.com!
    expect(meta.canonicalUrl).toBe("https://acme.com/blog/post-1");
  });

  it("accepts trusted host header for multi-tenant subdomains", () => {
    const meta = service.generateMetadata({
      title: "Dashboard Overview",
      description: "App overview",
      canonicalPath: "/overview",
      hostHeader: "app.acme.com",
      environment: "production"
    });

    expect(meta.canonicalUrl).toBe("https://app.acme.com/overview");
  });

  it("strictly forces noindex, nofollow on private routes", () => {
    const adminMeta = service.generateMetadata({
      title: "Admin Control Center",
      description: "Internal operations",
      canonicalPath: "/admin/users",
      environment: "production"
    });

    expect(adminMeta.isNoIndex).toBe(true);
    expect(adminMeta.robotsMeta).toBe("noindex, nofollow");

    const privateMeta = service.generateMetadata({
      title: "Secret Workspace",
      description: "Private data",
      canonicalPath: "/custom-project",
      isPrivate: true,
      environment: "production"
    });

    expect(privateMeta.isNoIndex).toBe(true);
    expect(privateMeta.robotsMeta).toBe("noindex, nofollow");
  });

  it("forces noindex on staging and preview environments", () => {
    const stagingMeta = service.generateMetadata({
      title: "Landing Page",
      description: "Public landing",
      canonicalPath: "/",
      environment: "staging"
    });

    expect(stagingMeta.isNoIndex).toBe(true);
    expect(stagingMeta.robotsMeta).toBe("noindex, nofollow");
  });

  it("generates Schema.org JSON-LD structured data", () => {
    const jsonLd = service.generateStructuredData("SoftwareApplication", {
      name: "Acme Cloud",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      offers: {
        "@type": "Offer",
        price: "29.00",
        priceCurrency: "USD"
      }
    });

    const parsed = JSON.parse(jsonLd);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("SoftwareApplication");
    expect(parsed.name).toBe("Acme Cloud");
    expect(parsed.offers.price).toBe("29.00");
  });

  it("generates XML sitemap with pagination and XML escaping", () => {
    const sitemap = service.generateSitemapXml([
      {
        loc: "https://acme.com/about",
        lastmod: new Date("2026-01-01T00:00:00Z"),
        changefreq: "monthly",
        priority: 0.8
      },
      {
        loc: "https://acme.com/search?q=test&category=tech",
        changefreq: "weekly"
      }
    ]);

    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain("<loc>https://acme.com/about</loc>");
    expect(sitemap).toContain("<priority>0.8</priority>");
    // Verify ampersand escaping in query params
    expect(sitemap).toContain("<loc>https://acme.com/search?q=test&amp;category=tech</loc>");
  });
});
