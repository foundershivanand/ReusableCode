import React, { useState, useRef } from "react";
import type { FileRecord } from "../schemas/index.js";

export interface FileUploadProps {
  onUpload: (file: File, visibility?: FileRecord["visibility"], onProgress?: (p: number) => void) => Promise<FileRecord>;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  maxSizeBytes = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ["image/*", "application/pdf", ".csv", ".json", ".txt"],
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > maxSizeBytes) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`);
      return;
    }

    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      const uploaded = await onUpload(file, "PRIVATE", (p) => setProgress(p));
      setSuccess(`Uploaded ${uploaded.originalName} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-gray-400 bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="space-y-1">
          <span className="text-3xl">📁</span>
          <p className="text-sm font-medium text-gray-700">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-400">
            PDF, PNG, JPG, CSV up to {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
      </div>

      {progress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-md">
          {success}
        </div>
      )}
    </div>
  );
};
