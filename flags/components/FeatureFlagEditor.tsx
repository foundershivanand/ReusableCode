import React, { useState } from "react";
import type { FeatureFlag } from "../schemas/flag-schemas.js";

export interface FeatureFlagEditorProps {
  initialFlag?: Partial<FeatureFlag>;
  onSave: (flagData: Partial<FeatureFlag>) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export const FeatureFlagEditor: React.FC<FeatureFlagEditorProps> = ({
  initialFlag,
  onSave,
  onCancel,
  className = ""
}) => {
  const [key, setKey] = useState(initialFlag?.key || "");
  const [name, setName] = useState(initialFlag?.name || "");
  const [description, setDescription] = useState(initialFlag?.description || "");
  const [enabled, setEnabled] = useState(initialFlag?.enabled ?? false);
  const [isKillSwitch, setIsKillSwitch] = useState(initialFlag?.isKillSwitch ?? false);
  const [percentageRollout, setPercentageRollout] = useState(initialFlag?.percentageRollout ?? 0);
  const [dependencies, setDependencies] = useState(initialFlag?.dependencies?.join(", ") || "");
  const [owner, setOwner] = useState(initialFlag?.owner || "core-team");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        key,
        name,
        description,
        enabled,
        isKillSwitch,
        percentageRollout: Number(percentageRollout),
        dependencies: dependencies
          ? dependencies
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean)
          : [],
        owner,
        failClosed: true
      });
    } catch (err: any) {
      setError(err.message || "Failed to save feature flag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4 ${className}`}
    >
      <h3 className="text-base font-bold text-gray-900">
        {initialFlag?.key ? `Edit Feature Flag: ${initialFlag.key}` : "Create New Feature Flag"}
      </h3>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Flag Key (slug)</label>
        <input
          type="text"
          value={key}
          disabled={!!initialFlag?.key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. beta-dashboard-v2"
          required
          className="w-full text-xs px-3 py-2 border rounded-md disabled:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beta Dashboard V2"
          required
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Purpose and context of this feature flag..."
          rows={2}
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Percentage Rollout: {percentageRollout}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={percentageRollout}
          onChange={(e) => setPercentageRollout(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Dependencies (comma-separated flag keys)
        </label>
        <input
          type="text"
          value={dependencies}
          onChange={(e) => setDependencies(e.target.value)}
          placeholder="e.g. flag_a, flag_b"
          className="w-full text-xs px-3 py-2 border rounded-md font-mono"
        />
      </div>

      <div className="flex items-center space-x-6 pt-2">
        <label className="flex items-center space-x-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>Enable Flag</span>
        </label>

        <label className="flex items-center space-x-2 text-xs text-red-700 font-semibold">
          <input
            type="checkbox"
            checked={isKillSwitch}
            onChange={(e) => setIsKillSwitch(e.target.checked)}
            className="rounded text-red-600 focus:ring-red-500"
          />
          <span>Emergency Kill Switch (fail closed)</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Feature Flag"}
        </button>
      </div>
    </form>
  );
};
