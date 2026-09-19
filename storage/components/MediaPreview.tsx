import React from "react";
import type { FileRecord } from "../schemas/index.js";

export interface MediaPreviewProps {
  file: FileRecord;
  downloadUrl?: string;
  onClose?: () => void;
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  file,
  downloadUrl,
  onClose,
  className = ""
}) => {
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 truncate max-w-sm">{file.originalName}</h4>
          <p className="text-xs text-gray-400">
            {(file.sizeBytes / 1024).toFixed(1)} KB • {file.mimeType}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={file.sanitizedName}
              className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm"
            >
              Download
            </a>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[250px] max-h-[500px] overflow-auto">
        {isImage && downloadUrl && (
          <img src={downloadUrl} alt={file.originalName} className="max-h-96 max-w-full rounded object-contain" />
        )}
        {isPdf && downloadUrl && (
          <iframe src={downloadUrl} title={file.originalName} className="w-full h-96 border-0 rounded" />
        )}
        {!isImage && !isPdf && (
          <div className="text-center text-gray-400 text-xs">
            <span className="text-4xl block mb-2">📄</span>
            Preview not available for this file type.
          </div>
        )}
      </div>
    </div>
  );
};
