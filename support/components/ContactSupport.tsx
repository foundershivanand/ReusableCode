import React, { useState } from "react";
import { useSupport } from "../client/react-context.js";

export const ContactSupport: React.FC = () => {
  const { submitTicket, isLoading } = useSupport();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTicket({
      type: "CONTACT_SUPPORT",
      subject,
      description,
      attachments: []
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-center">
        <h4 className="font-bold text-sm mb-1">Message Sent</h4>
        <p className="text-xs">A support specialist will review your inquiry shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-base font-bold text-gray-900">Contact Customer Support</h3>
      <p className="text-xs text-gray-500">Need help with billing, workspaces, or configuration? We're here.</p>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="How can we assist you?"
          required
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide as much context as possible..."
          rows={4}
          required
          className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50"
      >
        {isLoading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
};
