import React, { useState } from "react";
import { useSupport } from "../client/react-context.js";

export const FeatureRequest: React.FC = () => {
  const { submitTicket, isLoading } = useSupport();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTicket({
      type: "FEATURE_REQUEST",
      subject,
      description,
      attachments: []
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 bg-purple-50 text-purple-800 rounded-xl border border-purple-200 text-center">
        <h4 className="font-bold text-sm mb-1">Feature Request Logged</h4>
        <p className="text-xs">Thank you! Your idea has been sent to our product team for roadmap review.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-gray-900">Request a Feature</h3>
      <p className="text-xs text-gray-500">Tell us what tools or workflows would make your experience better.</p>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Feature Idea</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Export reports to PDF with custom branding"
          required
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Problem & Use Case</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why do you need this? What is your current workaround?"
          rows={4}
          required
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50"
      >
        {isLoading ? "Submitting..." : "Submit Feature Request"}
      </button>
    </form>
  );
};
