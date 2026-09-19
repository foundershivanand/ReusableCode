import React, { useState } from "react";
import { useCookieConsent } from "../client/hooks.js";

export const CookieConsent: React.FC = () => {
  const { cookies, hasGivenConsent, updateCookies } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(cookies.analytics);
  const [marketing, setMarketing] = useState(cookies.marketing);
  const [functional, setFunctional] = useState(cookies.functional);

  if (hasGivenConsent && !showPreferences) {
    return null;
  }

  const handleAcceptAll = async () => {
    await updateCookies(true, true, true);
    setShowPreferences(false);
  };

  const handleRejectNonEssential = async () => {
    await updateCookies(false, false, false);
    setShowPreferences(false);
  };

  const handleSaveCustom = async () => {
    await updateCookies(analytics, marketing, functional);
    setShowPreferences(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie Consent Banner"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 backdrop-blur border-t border-gray-200 shadow-2xl"
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-900 mb-1">Privacy & Cookie Preferences</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            We use essential cookies to make our application work. With your consent, we also use optional
            cookies for analytics, performance, and personalized marketing. You can update your choices at
            any time.
          </p>

          {showPreferences && (
            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Analytics Cookies</span>
              </label>

              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Marketing Cookies</span>
              </label>

              <label className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Functional Cookies</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
          {!showPreferences ? (
            <>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 underline"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Reject Optional
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Accept All
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
            >
              Save Preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
