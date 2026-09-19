import React, { useState } from "react";
import { useAffiliateAccount } from "../client/hooks.js";
import { ReferralLinkCard } from "./ReferralLinkCard.js";
import { CommissionHistory } from "./CommissionHistory.js";

export const AffiliateDashboard: React.FC = () => {
  const { account, commissions, isLoading, registerAffiliate } = useAffiliateAccount();
  const [referralCode, setReferralCode] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading affiliate dashboard...</div>;
  }

  if (!account) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md mx-auto shadow-sm text-center space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Join the Affiliate Program</h3>
        <p className="text-xs text-gray-600">
          Earn a 20% recurring commission on every user who subscribes using your referral link.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerAffiliate(referralCode, payoutEmail);
          }}
          className="space-y-3 text-left pt-2"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Referral Code</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="e.g. SHIVA2026"
              required
              className="w-full text-xs font-mono uppercase px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Payout Email</label>
            <input
              type="email"
              value={payoutEmail}
              onChange={(e) => setPayoutEmail(e.target.value)}
              placeholder="payouts@mycompany.com"
              required
              className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
          >
            Activate Affiliate Account
          </button>
        </form>
      </div>
    );
  }

  const pendingCents = commissions
    .filter((c) => c.status === "PENDING" || c.status === "APPROVED")
    .reduce((acc, c) => acc + c.commissionCents, 0);

  return (
    <div className="space-y-6">
      {/* Referral Link Header */}
      <ReferralLinkCard />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold block mb-1">Total Earned</span>
          <span className="text-2xl font-extrabold text-gray-900">
            ${(account.totalEarnedCents / 100).toFixed(2)}
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold block mb-1">Pending Payout</span>
          <span className="text-2xl font-extrabold text-blue-600">
            ${(pendingCents / 100).toFixed(2)}
          </span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-400 font-semibold block mb-1">Total Paid Out</span>
          <span className="text-2xl font-extrabold text-green-600">
            ${(account.totalPaidCents / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Commission Ledger */}
      <CommissionHistory />
    </div>
  );
};
