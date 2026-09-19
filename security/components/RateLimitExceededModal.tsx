import React, { useState, useEffect } from "react";

export interface RateLimitExceededModalProps {
  isOpen: boolean;
  retryAfterSeconds: number;
  onClose: () => void;
}

export const RateLimitExceededModal: React.FC<RateLimitExceededModalProps> = ({
  isOpen,
  retryAfterSeconds,
  onClose
}) => {
  const [remaining, setRemaining] = useState(retryAfterSeconds);

  useEffect(() => {
    setRemaining(retryAfterSeconds);
    if (!isOpen || retryAfterSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, retryAfterSeconds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl border border-gray-200 text-center">
        <span className="text-4xl block mb-2">⏱️</span>
        <h3 className="text-base font-bold text-gray-900 mb-1">Too Many Requests</h3>
        <p className="text-xs text-gray-500 mb-4">
          You have temporarily exceeded our request rate limit. Please wait a moment before trying again.
        </p>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-6">
          <span className="text-xs text-amber-800 font-medium">Please wait:</span>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-0.5">
            {remaining}s
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={remaining > 0}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {remaining > 0 ? "Rate Limited" : "Dismiss and Retry"}
        </button>
      </div>
    </div>
  );
};
