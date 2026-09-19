import React from "react";

export interface ImpersonationBannerProps {
  impersonatedUserId: string;
  onExit: () => void;
  timeRemaining?: string;
  className?: string;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  impersonatedUserId,
  onExit,
  timeRemaining = "29m remaining",
  className = ""
}) => {
  return (
    <div className={`bg-amber-500 text-gray-900 px-4 py-2.5 shadow-md flex items-center justify-between font-medium text-xs z-50 sticky top-0 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-base">⚠️</span>
        <span>
          <strong>ADMIN IMPERSONATION ACTIVE:</strong> You are currently viewing the application as user{" "}
          <code className="bg-amber-600/30 px-1.5 py-0.5 rounded font-mono text-gray-950 font-bold">
            {impersonatedUserId}
          </code>
        </span>
        <span className="text-amber-950/70">({timeRemaining})</span>
      </div>
      <button
        type="button"
        onClick={onExit}
        className="bg-gray-900 hover:bg-black text-white px-3 py-1 rounded text-xs font-semibold shadow-sm transition-colors"
      >
        Exit Impersonation
      </button>
    </div>
  );
};
