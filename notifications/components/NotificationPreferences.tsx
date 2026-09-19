import React, { useState } from "react";
import type { NotificationPreferences as Prefs } from "../schemas/index.js";

export interface NotificationPreferencesProps {
  preferences: Prefs;
  onSave: (prefs: Partial<Prefs>) => Promise<void>;
  className?: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  preferences,
  onSave,
  className = ""
}) => {
  const [email, setEmail] = useState(preferences.emailNotifications);
  const [inApp, setInApp] = useState(preferences.inAppNotifications);
  const [push, setPush] = useState(preferences.pushNotifications);
  const [marketing, setMarketing] = useState(preferences.marketingEmails);
  const [digest, setDigest] = useState(preferences.digestMode);
  const [frequency, setFrequency] = useState(preferences.digestFrequency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        emailNotifications: email,
        inAppNotifications: inApp,
        pushNotifications: push,
        marketingEmails: marketing,
        digestMode: digest,
        digestFrequency: frequency
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
        <p className="text-xs text-gray-500">Choose how and where you want to receive alerts.</p>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md">
          Preferences updated successfully.
        </div>
      )}

      <div className="space-y-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Email Notifications</span>
          <input
            type="checkbox"
            checked={email}
            onChange={(e) => setEmail(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">In-App Notifications</span>
          <input
            type="checkbox"
            checked={inApp}
            onChange={(e) => setInApp(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Push Notifications</span>
          <input
            type="checkbox"
            checked={push}
            onChange={(e) => setPush(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </label>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Marketing & Newsletters</h4>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="text-xs text-gray-500 max-w-sm">
            Receive product updates, newsletters, and promotional announcements.
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </label>
        <p className="text-xs text-gray-400 italic">
          Note: Critical security alerts and legal disclosures will always be delivered regardless of preferences.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Digest Mode</h4>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Group notifications into a periodic digest</span>
          <input
            type="checkbox"
            checked={digest}
            onChange={(e) => setDigest(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </label>

        {digest && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Digest Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as "DAILY" | "WEEKLY")}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </form>
  );
};
