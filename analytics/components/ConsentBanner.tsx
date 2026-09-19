import React, { useState } from "react";

export interface ConsentBannerProps {
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
  onCustomize?: () => void;
  className?: string;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  onAcceptAll,
  onRejectNonEssential,
  onCustomize,
  className = ""
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className={`fixed bottom-0 inset-x-0 z-50 bg-gray-900 text-white p-4 sm:p-6 shadow-2xl border-t border-gray-800 ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-xs text-gray-300 max-w-3xl">
          <p className="font-semibold text-sm text-white mb-1">Your Privacy Choices</p>
          We use strictly necessary cookies to operate our application. With your permission, we also collect anonymous usage telemetry to analyze performance and improve product features.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onCustomize && (
            <button
              type="button"
              onClick={() => { setDismissed(true); onCustomize(); }}
              className="px-3 py-1.5 text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded font-medium"
            >
              Preferences
            </button>
          )}
          <button
            type="button"
            onClick={() => { setDismissed(true); onRejectNonEssential(); }}
            className="px-3 py-1.5 text-xs text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded font-medium"
          >
            Reject Non-Essential
          </button>
          <button
            type="button"
            onClick={() => { setDismissed(true); onAcceptAll(); }}
            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};
