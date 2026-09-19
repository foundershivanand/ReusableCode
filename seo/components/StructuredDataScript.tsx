import React from "react";

export interface StructuredDataScriptProps {
  type: string;
  data: Record<string, any>;
}

export const StructuredDataScript: React.FC<StructuredDataScriptProps> = ({ type, data }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type,
    ...data
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
