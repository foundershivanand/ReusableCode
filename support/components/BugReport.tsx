import React, { useState } from "react";
import { useSupport } from "../client/react-context.js";

export const BugReport: React.FC = () => {
  const { submitTicket, isLoading } = useSupport();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const browserMeta =
      typeof window !== "undefined"
        ? {
            browser: navigator.userAgent,
            os: navigator.platform,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            url: window.location.href,
            userAgent: navigator.userAgent,
            language: navigator.language
          }
        : { url: "https://unknown" };

    const attachments = screenshotUrl
      ? [
          {
            id: `att_${Date.now()}`,
            name: "screenshot.png",
            sizeBytes: 1024,
            mimeType: "image/png" as const,
            url: screenshotUrl
          }
        ]
      : [];

    await submitTicket({
      type: "BUG_REPORT",
      subject,
      description,
      browserMetadata: browserMeta,
      attachments
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 bg-green-50 text-green-800 rounded-xl border border-green-200 text-center">
        <h4 className="font-bold text-sm mb-1">Bug Report Submitted</h4>
        <p className="text-xs">
          Our engineering team has received your report and reproduction telemetry.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-gray-900">Report an Issue</h3>
      <p className="text-xs text-gray-500">Help us fix problems by providing clear steps to reproduce.</p>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Summary</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. 500 error when clicking save button on settings"
          required
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Steps to Reproduce & Expected Behavior</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="1. Go to page X&#10;2. Click on Y&#10;3. Observe error Z"
          rows={4}
          required
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Screenshot URL (optional)</label>
        <input
          type="url"
          value={screenshotUrl}
          onChange={(e) => setScreenshotUrl(e.target.value)}
          placeholder="https://..."
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50"
      >
        {isLoading ? "Submitting..." : "Submit Bug Report"}
      </button>
    </form>
  );
};
