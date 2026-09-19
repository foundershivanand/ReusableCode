import React, { useState } from "react";
import { useSupport } from "../client/react-context.js";

export const FeedbackWidget: React.FC = () => {
  const { submitTicket, isLoading } = useSupport();
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    await submitTicket({
      type: "FEEDBACK",
      subject: subject || "General Feedback",
      description,
      attachments: []
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setSubject("");
      setDescription("");
    }, 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2.5 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 text-xs font-semibold flex items-center space-x-2 transition-transform hover:scale-105"
        >
          <span>💬 Feedback</span>
        </button>
      ) : (
        <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900">Send Feedback</h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>

          {submitted ? (
            <div className="p-4 text-center text-xs text-green-700 bg-green-50 rounded-lg">
              Thank you! Your feedback has been received.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Topic / Title (optional)"
                className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's on your mind? How can we improve?"
                rows={3}
                required
                className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  {isLoading ? "Sending..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
