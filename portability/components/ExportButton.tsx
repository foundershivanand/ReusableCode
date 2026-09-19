import React, { useState } from "react";
import { useDataExport } from "../client/hooks.js";
import type { ExportFormat } from "../schemas/portability-schemas.js";

export interface ExportButtonProps {
  resourceType: string;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ resourceType, className = "" }) => {
  const { triggerExport, isLoading } = useDataExport();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setShowDropdown(false);
    await triggerExport(resourceType, format);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        disabled={isLoading}
        className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
      >
        <span>📥 Export Data</span>
        <span className="text-[10px]">▼</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => handleExport("CSV")}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 font-medium"
          >
            Export as CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("JSON")}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 font-medium"
          >
            Export as JSON
          </button>
          <button
            type="button"
            onClick={() => handleExport("PDF")}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 font-medium"
          >
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
};
