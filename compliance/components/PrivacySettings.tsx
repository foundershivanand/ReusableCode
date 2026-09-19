import React, { useState } from "react";
import { useCompliance } from "../client/react-context.js";

export const PrivacySettings: React.FC = () => {
  const { consent, updateConsent, isLoading } = useCompliance();
  const [marketing, setMarketing] = useState(consent?.marketingConsent ?? false);
  const [analytics, setAnalytics] = useState(consent?.cookieConsent?.analytics ?? false);
  const [functional, setFunctional] = useState(consent?.cookieConsent?.functional ?? false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSave = async () => {
    await updateConsent(
      consent?.acceptedTerms ?? true,
      consent?.acceptedPrivacy ?? true,
      marketing,
      {
        essential: true,
        analytics,
        marketing,
        functional
      }
    );
    setSavedMessage("Privacy preferences successfully updated.");
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-bold text-gray-900">Privacy & Consent Controls</h3>
        <p className="text-xs text-gray-500">
          Manage how your personal data and browsing cookies are processed.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-green-50 text-green-700 text-xs rounded border border-green-200">
          {savedMessage}
        </div>
      )}

      <div className="space-y-4 divide-y divide-gray-100">
        <div className="pt-3 flex items-start justify-between">
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Essential Data & Cookies</h4>
            <p className="text-[11px] text-gray-500">
              Required for security, authentication, and session persistence. Cannot be disabled.
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">
            Always Active
          </span>
        </div>

        <div className="pt-3 flex items-start justify-between">
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Marketing Communications & Emails</h4>
            <p className="text-[11px] text-gray-500">
              Receive updates on product features, tips, and promotional offers.
            </p>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div className="pt-3 flex items-start justify-between">
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Analytics & Usage Telemetry</h4>
            <p className="text-[11px] text-gray-500">
              Help us understand workflow drop-offs and improve application performance.
            </p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div className="pt-3 flex items-start justify-between">
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Functional & Personalization Cookies</h4>
            <p className="text-[11px] text-gray-500">
              Preserve UI layout preferences and customized dashboard widgets.
            </p>
          </div>
          <input
            type="checkbox"
            checked={functional}
            onChange={(e) => setFunctional(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          {isLoading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
};
