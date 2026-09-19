import React, { useState } from "react";

export interface DestructiveActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  requiredPhrase: string; // e.g. "DELETE USER" or user's email
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
  actionLabel?: string;
}

export const DestructiveActionModal: React.FC<DestructiveActionModalProps> = ({
  isOpen,
  title,
  description,
  requiredPhrase,
  onConfirm,
  onCancel,
  actionLabel = "Confirm Action"
}) => {
  const [typedPhrase, setTypedPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmed = typedPhrase.trim() === requiredPhrase.trim() && reason.trim().length >= 5;

  const handleExecute = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-red-200">
        <div className="flex items-center space-x-3 text-red-600 mb-3">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">{description}</p>

        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Audit Reason (Required, min 5 chars)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer requested account deletion via GDPR ticket #1029"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              To confirm, type <span className="font-mono font-bold text-red-600">{requiredPhrase}</span>:
            </label>
            <input
              type="text"
              value={typedPhrase}
              onChange={(e) => setTypedPhrase(e.target.value)}
              placeholder={requiredPhrase}
              className="w-full px-3 py-2 border border-red-300 rounded-md text-xs focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!isConfirmed || loading}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-50"
          >
            {loading ? "Executing..." : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
