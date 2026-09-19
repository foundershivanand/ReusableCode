import type { ISeoRepository } from "./repository.js";
import {
  type PageMetadataInput,
  type ResolvedMetadata,
  type SitemapUrlEntry,
  PageMetadataInputSchema
} from "../schemas/seo-schemas.js";

export interface SeoServiceConfig {
  defaultBaseUrl: string; // e.g. "https://myapp.com"
  trustedDomains: string[]; // e.g. ["myapp.com", "app.myapp.com"]
  defaultTitleTemplate?: string;
  defaultSiteName?: string;
}

export class SeoService {
  private defaultBaseUrl: string;
  private trustedDomains: Set<string>;
  private defaultTitleTemplate: string;
  private defaultSiteName: string;

  constructor(
    private readonly repository: ISeoRepository,
    config: SeoServiceConfig
  ) {
    this.defaultBaseUrl = config.defaultBaseUrl.replace(/\/+$/, "");
    this.trustedDomains = new Set(config.trustedDomains.map((d) => d.toLowerCase()));
    this.defaultTitleTemplate = config.defaultTitleTemplate || "%s";
    this.defaultSiteName = config.defaultSiteName || "My Application";
  }

  generateMetadata(input: PageMetadataInput): ResolvedMetadata {
    const validated = PageMetadataInputSchema.parse(input);

    // 1. Host-Header Poisoning Defense
    const baseUrl = this.resolveTrustedBaseUrl(validated.hostHeader);

    // 2. Canonical URL construction
    const cleanPath = "/" + validated.canonicalPath.replace(/^\/+|\/+$/g, "");
    const canonicalUrl = `${baseUrl}${cleanPath}`;

    // 3. Privacy & Environment checks (Prevent indexing private routes or staging environments)
    const isPrivatePath =
      validated.isPrivate ||
      cleanPath.startsWith("/dashboard") ||
      cleanPath.startsWith("/admin") ||
      cleanPath.startsWith("/settings") ||
      cleanPath.startsWith("/api") ||
      cleanPath.startsWith("/account");

    const isNonProd =
      validated.environment === "staging" ||
      validated.environment === "preview" ||
      validated.environment === "development";

    const mustNoIndex = isPrivatePath || isNonProd;

    let robotsMeta = "index, follow";
    if (mustNoIndex) {
      robotsMeta = "noindex, nofollow";
    } else if (validated.robots) {
      const parts: string[] = [];
      parts.push(validated.robots.index ? "index" : "noindex");
      parts.push(validated.robots.follow ? "follow" : "nofollow");
      if (validated.robots.noarchive) parts.push("noarchive");
      if (validated.robots.nosnippet) parts.push("nosnippet");
      if (validated.robots.noimageindex) parts.push("noimageindex");
      robotsMeta = parts.join(", ");
    }

    // 4. Title resolution
    const template = validated.titleTemplate || this.defaultTitleTemplate;
    const resolvedTitle = template.includes("%s")
      ? template.replace("%s", validated.title)
      : `${validated.title} | ${this.defaultSiteName}`;

    // 5. OpenGraph resolution
    const og = validated.openGraph || {
      title: resolvedTitle,
      description: validated.description,
      url: canonicalUrl,
      siteName: this.defaultSiteName,
      images: [],
      locale: "en_US",
      type: "website" as const
    };

    // 6. Twitter resolution
    const twitter = validated.twitter || {
      card: "summary_large_image" as const,
      title: resolvedTitle,
      description: validated.description
    };

    // 7. Structured Data JSON-LD
    let structuredDataJsonLd: string | undefined;
    if (validated.structuredData && !mustNoIndex) {
      structuredDataJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        ...validated.structuredData
      });
    }

    return {
      title: resolvedTitle,
      description: validated.description,
      canonicalUrl,
      robotsMeta,
      isNoIndex: mustNoIndex,
      openGraph: og,
      twitter,
      alternates: validated.alternates,
      structuredDataJsonLd
    };
  }

  generateStructuredData(type: string, data: Record<string, any>): string {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": type,
      ...data
    });
  }

  generateSitemapXml(entries: SitemapUrlEntry[], page: number = 1, pageSize: number = 50000): string {
    const startIndex = (page - 1) * pageSize;
    const paginated = entries.slice(startIndex, startIndex + pageSize);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const entry of paginated) {
      xml += "  <url>\n";
      xml += `    <loc>${this.escapeXml(entry.loc)}</loc>\n`;
      if (entry.lastmod) {
        xml += `    <lastmod>${entry.lastmod.toISOString().split("T")[0]}</lastmod>\n`;
      }
      if (entry.changefreq) {
        xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      }
      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }
      xml += "  </url>\n";
    }

    xml += "</urlset>";
    return xml;
  }

  private resolveTrustedBaseUrl(hostHeader?: string): string {
    if (!hostHeader) return this.defaultBaseUrl;

    const cleanHost = hostHeader.split(":")[0].toLowerCase();
    if (this.trustedDomains.has(cleanHost)) {
      return `https://${hostHeader}`;
    }

    // Untrusted host header -> fallback to default to prevent Host Header Poisoning
    return this.defaultBaseUrl;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  }
}
