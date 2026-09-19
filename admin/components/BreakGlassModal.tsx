import React, { useState } from "react";

export interface BreakGlassModalProps {
  isOpen: boolean;
  onActivate: (reason: string, durationMinutes: number) => Promise<void>;
  onCancel: () => void;
}

export const BreakGlassModal: React.FC<BreakGlassModalProps> = ({ isOpen, onActivate, onCancel }) => {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Please provide a detailed reason (minimum 10 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onActivate(reason, duration);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate emergency access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border-2 border-red-500">
        <div className="flex items-center space-x-3 text-red-600 mb-2">
          <span className="text-3xl">🚨</span>
          <h3 className="text-lg font-bold text-gray-900">Emergency Break-Glass Access</h3>
        </div>

        <p className="text-xs text-gray-600 mb-4">
          Break-glass grants temporary elevated operational privileges. This event is irreversibly recorded in security audit logs and broadcasts an alert to engineering leadership.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Incident or Outage Justification (min 10 characters)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="e.g. Production database connection outage requiring manual failover per incident INC-4091"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Access Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs bg-white"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={60}>60 Minutes</option>
              <option value={120}>120 Minutes (Max)</option>
            </select>
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
            type="submit"
            disabled={loading || reason.trim().length < 10}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm disabled:opacity-50"
          >
            {loading ? "Activating..." : "Activate Emergency Access"}
          </button>
        </div>
      </form>
    </div>
  );
};
