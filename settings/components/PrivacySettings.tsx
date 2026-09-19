import React, { useState } from "react";
import type { PrivacyPreferences as Privacy } from "../schemas/index.js";

export interface PrivacySettingsProps {
  initialPrivacy: Privacy;
  onSave: (privacy: Partial<Privacy>) => Promise<void>;
  className?: string;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  initialPrivacy,
  onSave,
  className = ""
}) => {
  const [analytics, setAnalytics] = useState(initialPrivacy.analyticsConsent);
  const [marketing, setMarketing] = useState(initialPrivacy.marketingConsent);
  const [personalization, setPersonalization] = useState(initialPrivacy.personalizationConsent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave({
        functionalConsent: true, // Functional is always essential
        analyticsConsent: analytics,
        marketingConsent: marketing,
        personalizationConsent: personalization
      });
      setMessage({ type: "success", text: "Privacy preferences saved." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update privacy" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Privacy & Consent</h3>
        <p className="text-xs text-gray-500">Manage how your personal data and telemetry are processed.</p>
      </div>

      {message && (
        <div className={`p-3 rounded text-sm ${
          message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Strictly Essential */}
        <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-semibold text-gray-900">Essential / Functional (Required)</span>
            <p className="text-xs text-gray-500 mt-0.5">Required for authentication, security, and core platform functions.</p>
          </div>
          <input
            type="checkbox"
            checked={true}
            disabled
            className="h-4 w-4 text-gray-400 rounded border-gray-300 cursor-not-allowed mt-1"
          />
        </div>

        {/* Analytics Consent */}
        <label className="flex items-start justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="pr-4">
            <span className="text-sm font-medium text-gray-900">Performance & Analytics Telemetry</span>
            <p className="text-xs text-gray-500 mt-0.5">Helps us understand platform usage patterns to fix bugs and improve performance.</p>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
          />
        </label>

        {/* Personalization Consent */}
        <label className="flex items-start justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="pr-4">
            <span className="text-sm font-medium text-gray-900">Personalization & Feature Customization</span>
            <p className="text-xs text-gray-500 mt-0.5">Allows us to remember your workflow preferences and recommend relevant templates.</p>
          </div>
          <input
            type="checkbox"
            checked={personalization}
            onChange={(e) => setPersonalization(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
          />
        </label>

        {/* Marketing Consent */}
        <label className="flex items-start justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="pr-4">
            <span className="text-sm font-medium text-gray-900">Marketing & Promotional Insights</span>
            <p className="text-xs text-gray-500 mt-0.5">Enables tailored product updates and promotional communications.</p>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Privacy Choices"}
      </button>
    </form>
  );
};
