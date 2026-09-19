import React from "react";
import type { FileRecord } from "../schemas/index.js";

export interface FilePickerProps {
  files: FileRecord[];
  selectedFileId?: string;
  onSelectFile: (file: FileRecord) => void;
  className?: string;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  className = ""
}) => {
  if (files.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-400 text-xs bg-white rounded-lg border border-gray-200 ${className}`}>
        No files stored yet.
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1 ${className}`}>
      {files.map((file) => {
        const isSelected = file.id === selectedFileId;
        const sizeMb = (file.sizeBytes / (1024 * 1024)).toFixed(1);

        return (
          <div
            key={file.id}
            onClick={() => onSelectFile(file)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors text-left flex flex-col justify-between ${
              isSelected
                ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div>
              <span className="text-xl">
                {file.mimeType.startsWith("image/") ? "🖼️" : file.mimeType.includes("pdf") ? "📄" : "📁"}
              </span>
              <p className="text-xs font-semibold text-gray-800 truncate mt-2" title={file.originalName}>
                {file.originalName}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2">
              <span>{sizeMb} MB</span>
              <span className={`px-1 rounded text-[9px] font-bold ${
                file.scanStatus === "SAFE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>
                {file.scanStatus}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
