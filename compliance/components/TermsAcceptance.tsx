import React, { useState } from "react";
import { useCompliance } from "../client/react-context.js";

export interface TermsAcceptanceProps {
  termsUrl?: string;
  privacyUrl?: string;
  onAccepted?: () => void;
  className?: string;
}

export const TermsAcceptance: React.FC<TermsAcceptanceProps> = ({
  termsUrl = "/legal/terms",
  privacyUrl = "/legal/privacy",
  onAccepted,
  className = ""
}) => {
  const { updateConsent, consent, isLoading } = useCompliance();
  const [acceptedTerms, setAcceptedTerms] = useState(consent?.acceptedTerms ?? false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(consent?.acceptedPrivacy ?? false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !acceptedPrivacy) {
      setError("You must accept both the Terms of Service and the Privacy Policy.");
      return;
    }

    try {
      setError(null);
      await updateConsent(acceptedTerms, acceptedPrivacy, marketingConsent, {
        essential: true,
        analytics: false,
        marketing: marketingConsent,
        functional: false
      });
      onAccepted?.();
    } catch (err: any) {
      setError(err.message || "Failed to record terms acceptance");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 ${className}`}>
      <h3 className="text-base font-bold text-gray-900">Terms of Service & Privacy Policy</h3>
      <p className="text-xs text-gray-500">
        Please review and acknowledge our updated terms before continuing.
      </p>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <label className="flex items-start space-x-2.5 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            required
            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span>
            I agree to the{" "}
            <a href={termsUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
              Terms of Service
            </a>{" "}
            (Version 2026.1).
          </span>
        </label>

        <label className="flex items-start space-x-2.5 text-xs text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            required
            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span>
            I have read and acknowledge the{" "}
            <a href={privacyUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
              Privacy Policy
            </a>{" "}
            (Version 2026.1).
          </span>
        </label>

        <label className="flex items-start space-x-2.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
          />
          <span>(Optional) I agree to receive product news and occasional marketing communications.</span>
        </label>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !acceptedTerms || !acceptedPrivacy}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Saving..." : "Accept and Continue"}
        </button>
      </div>
    </form>
  );
};
