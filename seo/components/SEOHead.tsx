import React from "react";
import type { ResolvedMetadata } from "../schemas/seo-schemas.js";

export interface SEOHeadProps {
  metadata: ResolvedMetadata;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ metadata }) => {
  return (
    <>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <link rel="canonical" href={metadata.canonicalUrl} />
      <meta name="robots" content={metadata.robotsMeta} />

      {/* OpenGraph */}
      <meta property="og:title" content={metadata.openGraph.title} />
      <meta property="og:description" content={metadata.openGraph.description} />
      <meta property="og:url" content={metadata.openGraph.url} />
      <meta property="og:type" content={metadata.openGraph.type} />
      {metadata.openGraph.siteName && (
        <meta property="og:site_name" content={metadata.openGraph.siteName} />
      )}
      {metadata.openGraph.images.map((img, i) => (
        <meta key={i} property="og:image" content={img.url} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content={metadata.twitter.card} />
      <meta name="twitter:title" content={metadata.twitter.title} />
      <meta name="twitter:description" content={metadata.twitter.description} />
      {metadata.twitter.image && (
        <meta name="twitter:image" content={metadata.twitter.image} />
      )}

      {/* Hreflang alternates */}
      {metadata.alternates.map((alt, i) => (
        <link key={i} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}

      {/* Structured Data */}
      {metadata.structuredDataJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: metadata.structuredDataJsonLd }}
        />
      )}
    </>
  );
};
