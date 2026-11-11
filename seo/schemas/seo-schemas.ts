import { z } from "zod";

export const RobotsDirectiveSchema = z.object({
  index: z.boolean().default(true),
  follow: z.boolean().default(true),
  noarchive: z.boolean().optional(),
  nosnippet: z.boolean().optional(),
  noimageindex: z.boolean().optional(),
  maxSnippet: z.number().int().optional(),
  maxImagePreview: z.enum(["none", "standard", "large"]).optional()
});
export type RobotsDirective = z.infer<typeof RobotsDirectiveSchema>;

export const OpenGraphMetadataSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.string().url(),
  siteName: z.string().optional(),
  images: z.array(
    z.object({
      url: z.string().url(),
      width: z.number().int().optional(),
      height: z.number().int().optional(),
      alt: z.string().optional()
    })
  ).default([]),
  locale: z.string().default("en_US"),
  type: z.enum(["website", "article", "product", "profile"]).default("website")
});
export type OpenGraphMetadata = z.infer<typeof OpenGraphMetadataSchema>;

export const TwitterCardMetadataSchema = z.object({
  card: z.enum(["summary", "summary_large_image", "app", "player"]).default("summary_large_image"),
  site: z.string().optional(),
  creator: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string().url().optional()
});
export type TwitterCardMetadata = z.infer<typeof TwitterCardMetadataSchema>;

export const HreflangAlternateSchema = z.object({
  href: z.string().url(),
  hreflang: z.string() // e.g. "en", "es", "fr-CA", "x-default"
});
export type HreflangAlternate = z.infer<typeof HreflangAlternateSchema>;

export const PageMetadataInputSchema = z.object({
  title: z.string().min(1),
  titleTemplate: z.string().optional(), // e.g. "%s | Acme SaaS"
  description: z.string().min(1),
  canonicalPath: z.string().min(1), // path only, e.g. "/features/billing"
  hostHeader: z.string().optional(),
  tenantId: z.string().optional(),
  isPrivate: z.boolean().default(false), // admin, dashboard, private route
  environment: z.enum(["production", "staging", "preview", "development"]).default("production"),
  robots: RobotsDirectiveSchema.optional(),
  openGraph: OpenGraphMetadataSchema.optional(),
  twitter: TwitterCardMetadataSchema.optional(),
  alternates: z.array(HreflangAlternateSchema).default([]),
  structuredData: z.record(z.string(), z.any()).optional()
});
export type PageMetadataInput = z.input<typeof PageMetadataInputSchema>;

export const ResolvedMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  canonicalUrl: z.string().url(),
  robotsMeta: z.string(),
  isNoIndex: z.boolean(),
  openGraph: OpenGraphMetadataSchema,
  twitter: TwitterCardMetadataSchema,
  alternates: z.array(HreflangAlternateSchema),
  structuredDataJsonLd: z.string().optional()
});
export type ResolvedMetadata = z.infer<typeof ResolvedMetadataSchema>;

export const SitemapUrlEntrySchema = z.object({
  loc: z.string().url(),
  lastmod: z.date().optional(),
  changefreq: z.enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).optional(),
  priority: z.number().min(0).max(1).optional()
});
export type SitemapUrlEntry = z.infer<typeof SitemapUrlEntrySchema>;
