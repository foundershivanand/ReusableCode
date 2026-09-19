import React, { useState } from "react";
import { useDataImport } from "../client/hooks.js";
import type { ImportStrategy } from "../schemas/portability-schemas.js";

export interface ImportWizardProps {
  resourceType: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ resourceType, isOpen, onClose }) => {
  const { triggerImport, activeImport, isLoading } = useDataImport();
  const [content, setContent] = useState("");
  const [strategy, setStrategy] = useState<ImportStrategy>("ALL_OR_NOTHING");
  const [step, setStep] = useState<"INPUT" | "PREVIEW" | "COMPLETED">("INPUT");

  if (!isOpen) return null;

  const handleDryRun = async () => {
    await triggerImport(resourceType, content, true, strategy);
    setStep("PREVIEW");
  };

  const handleCommit = async () => {
    await triggerImport(resourceType, content, false, strategy);
    setStep("COMPLETED");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Import {resourceType} Data
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>

        {step === "INPUT" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Paste CSV or JSON Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="id,name,email&#10;1,Alice,alice@example.com"
                rows={6}
                required
                className="w-full text-xs font-mono px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Failure Strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as ImportStrategy)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-white"
              >
                <option value="ALL_OR_NOTHING">All-or-Nothing (Rollback on any row error)</option>
                <option value="PARTIAL_WITH_ERRORS">Partial Import (Commit valid, report errors)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDryRun}
                disabled={isLoading || !content.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold disabled:opacity-50"
              >
                {isLoading ? "Validating..." : "Validate & Preview →"}
              </button>
            </div>
          </div>
        )}

        {step === "PREVIEW" && activeImport && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span>Total Rows:</span>
                <span className="font-semibold">{activeImport.totalRows}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Valid Rows:</span>
                <span className="font-semibold">{activeImport.successRows}</span>
              </div>
              <div className="flex justify-between text-red-700">
                <span>Invalid / Duplicate Rows:</span>
                <span className="font-semibold">{activeImport.failedRows}</span>
              </div>
            </div>

            {activeImport.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto p-2 bg-red-50 border border-red-200 rounded text-xs space-y-1 text-red-800">
                <span className="font-bold block">Validation Errors:</span>
                {activeImport.errors.map((err, i) => (
                  <p key={i} className="text-[11px]">
                    Row {err.row}: {err.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2 border-t">
              <button
                type="button"
                onClick={() => setStep("INPUT")}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={isLoading || (strategy === "ALL_OR_NOTHING" && activeImport.failedRows > 0)}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold disabled:opacity-50"
              >
                {isLoading ? "Importing..." : "Confirm & Commit Import"}
              </button>
            </div>
          </div>
        )}

        {step === "COMPLETED" && activeImport && (
          <div className="p-4 bg-green-50 text-green-800 rounded-lg text-center space-y-2 text-xs">
            <h4 className="font-bold text-sm">Import Complete!</h4>
            <p>
              Successfully imported {activeImport.successRows} rows into {resourceType}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-1.5 bg-green-600 text-white rounded font-semibold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
