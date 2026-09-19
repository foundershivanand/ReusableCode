import React, { useState, useRef } from "react";
import type { FileRecord } from "../schemas/index.js";

export interface ImageUploadProps {
  onUpload: (file: File) => Promise<FileRecord>;
  currentImageUrl?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  currentImageUrl,
  className = ""
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP)");
      return;
    }

    setError(null);
    setLoading(true);

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setPreview(currentImageUrl || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-2xl">🖼️</span>
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
              Uploading...
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="py-1.5 px-3 bg-white border border-gray-300 text-xs font-medium text-gray-700 rounded-md hover:bg-gray-50 shadow-sm"
          >
            Change Image
          </button>
          <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WebP up to 10MB</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}
    </div>
  );
};
