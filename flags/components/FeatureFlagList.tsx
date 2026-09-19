import React from "react";
import { useFeatureFlags } from "../client/react-context.js";
import type { FeatureFlag } from "../schemas/flag-schemas.js";

export interface FeatureFlagListProps {
  onSelectFlag?: (flag: FeatureFlag) => void;
  onEditFlag?: (flag: FeatureFlag) => void;
  className?: string;
}

export const FeatureFlagList: React.FC<FeatureFlagListProps> = ({
  onSelectFlag,
  onEditFlag,
  className = ""
}) => {
  const { flags, isLoading, error, toggleFlag } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className={`p-6 bg-white rounded-xl border border-gray-200 animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-100 rounded"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
        Error loading feature flags: {error}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Feature Flags</h3>
          <p className="text-xs text-gray-500">Manage runtime switches and percentage rollouts</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
          {flags.length} Total
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {flags.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No feature flags found.</div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.key}
              className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div
                className="cursor-pointer flex-1 mr-4"
                onClick={() => onSelectFlag?.(flag)}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-semibold text-gray-900">
                    {flag.key}
                  </span>
                  {flag.isKillSwitch && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                      KILL SWITCH
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      flag.lifecycleState === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {flag.lifecycleState}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{flag.description || flag.name}</p>
                <div className="flex items-center space-x-4 mt-2 text-[11px] text-gray-400 font-medium">
                  <span>Rollout: {flag.percentageRollout}%</span>
                  <span>Rules: {flag.targetingRules.length}</span>
                  {flag.dependencies.length > 0 && (
                    <span>Depends on: {flag.dependencies.join(", ")}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {onEditFlag && (
                  <button
                    type="button"
                    onClick={() => onEditFlag(flag)}
                    className="text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1 border rounded hover:bg-white"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleFlag(flag.key, !flag.enabled)}
                  role="switch"
                  aria-checked={flag.enabled}
                  aria-label={`Toggle flag ${flag.key}`}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    flag.enabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flag.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
