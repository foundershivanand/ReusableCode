import React, { useState } from "react";
import { useAffiliateAccount } from "../client/hooks.js";

export interface ReferralLinkCardProps {
  domain?: string;
  className?: string;
}

export const ReferralLinkCard: React.FC<ReferralLinkCardProps> = ({
  domain = "https://acme.com",
  className = ""
}) => {
  const { account } = useAffiliateAccount();
  const [copied, setCopied] = useState(false);

  if (!account) return null;

  const referralLink = `${domain.replace(/\/+$/, "")}/?ref=${account.referralCode}`;

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-md ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
            Your Affiliate Referral Link
          </span>
          <h3 className="text-lg font-bold mt-1">
            Earn {account.commissionRatePercent}% recurring commission
          </h3>
          <p className="text-xs text-blue-100 mt-1">
            Share your link with colleagues and receive payouts on every qualifying subscription.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-xs p-2 rounded-lg border border-white/20">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="bg-transparent text-xs font-mono text-white outline-none px-2 w-52 sm:w-64 select-all"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded shadow-xs transition-colors"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
};
