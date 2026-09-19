import React from "react";
import type { ResolvedMetadata } from "../schemas/seo-schemas.js";

export interface OpenGraphPreviewProps {
  metadata: ResolvedMetadata;
  className?: string;
}

export const OpenGraphPreview: React.FC<OpenGraphPreviewProps> = ({
  metadata,
  className = ""
}) => {
  const imageUrl = metadata.openGraph.images[0]?.url || metadata.twitter.image;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden max-w-md shadow-sm ${className}`}>
      <div className="p-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
        Social Share Preview (OpenGraph / Twitter Card)
      </div>

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={metadata.title}
          className="w-full h-44 object-cover border-b border-gray-100"
        />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-xs text-indigo-400 font-medium">
          No Preview Image Provided
        </div>
      )}

      <div className="p-4">
        <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">
          {new URL(metadata.canonicalUrl).hostname}
        </span>
        <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1 line-clamp-2">
          {metadata.title}
        </h4>
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {metadata.description}
        </p>
      </div>
    </div>
  );
};
