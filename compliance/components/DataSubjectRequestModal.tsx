import React, { useState } from "react";
import { useCompliance } from "../client/react-context.js";
import type { DataSubjectRequestType } from "../schemas/compliance-schemas.js";

export interface DataSubjectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSubjectRequestModal: React.FC<DataSubjectRequestModalProps> = ({
  isOpen,
  onClose
}) => {
  const { submitDsr, isLoading } = useCompliance();
  const [type, setType] = useState<DataSubjectRequestType>("EXPORT");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await submitDsr(type, reason);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Data Subject Request (GDPR / CCPA)</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-4 bg-green-50 text-green-800 rounded-lg text-xs space-y-2">
            <p className="font-semibold">Request Submitted</p>
            <p>
              We have dispatched a verification email to verify your identity before processing this
              request.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-3 py-1.5 bg-green-600 text-white rounded text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Request Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DataSubjectRequestType)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="EXPORT">Data Portability / Export</option>
                <option value="ACCESS">Right to Access (Summary)</option>
                <option value="DELETION">Right to be Forgotten (Account Deletion)</option>
                <option value="CORRECTION">Data Rectification</option>
                <option value="RESTRICTION">Processing Restriction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason or Specific Notes (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Specify data categories or request context..."
                className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
                type="submit"
                disabled={isLoading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {isLoading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const LegalHoldBanner: React.FC<{ isUnderLegalHold: boolean }> = ({ isUnderLegalHold }) => {
  if (!isUnderLegalHold) return null;

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center space-x-2">
      <span className="text-base font-bold">⚠️</span>
      <div>
        <span className="font-semibold">Legal Hold Active:</span> Data associated with this workspace
        is currently subject to a mandatory legal preservation hold. Deletion and automated purges are
        temporarily suspended.
      </div>
    </div>
  );
};
