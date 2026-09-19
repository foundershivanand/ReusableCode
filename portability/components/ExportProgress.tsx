import React from "react";
import { useDataExport } from "../client/hooks.js";

export const ExportProgress: React.FC = () => {
  const { activeExport } = useDataExport();

  if (!activeExport) return null;

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-800">
          Exporting {activeExport.resourceType} ({activeExport.format})
        </span>
        <span className="font-mono text-blue-600 font-bold">
          {activeExport.progressPercentage}%
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${activeExport.progressPercentage}%` }}
        />
      </div>

      {activeExport.status === "COMPLETED" && activeExport.downloadUrl && (
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] text-green-700 font-medium">
            ✓ Ready for download ({activeExport.totalRows} rows)
          </span>
          <a
            href={activeExport.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold shadow-xs"
          >
            Download File ⬇
          </a>
        </div>
      )}

      {activeExport.status === "FAILED" && (
        <p className="text-xs text-red-600">
          Export failed: {activeExport.errorMessage || "Unknown error"}
        </p>
      )}
    </div>
  );
};
