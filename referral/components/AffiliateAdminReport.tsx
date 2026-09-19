import React from "react";
import type { AffiliateAccount, ReferralAttribution } from "../schemas/referral-schemas.js";

export interface AffiliateAdminReportProps {
  affiliates: AffiliateAccount[];
  flaggedAttributions: ReferralAttribution[];
  onApprovePayout?: (affiliateId: string) => void;
}

export const AffiliateAdminReport: React.FC<AffiliateAdminReportProps> = ({
  affiliates,
  flaggedAttributions,
  onApprovePayout
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Affiliate Program Operations</h3>
          <p className="text-xs text-gray-500">
            Monitor partner earnings, fraud detection signals, and pending payouts.
          </p>
        </div>
      </div>

      {/* Fraud Signals Alert */}
      {flaggedAttributions.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
          <span className="font-bold text-red-900 block">
            ⚠️ {flaggedAttributions.length} Suspicious / Fraudulent Attributions Detected:
          </span>
          <div className="space-y-1 text-red-700">
            {flaggedAttributions.map((fa) => (
              <p key={fa.id}>
                Attribution {fa.id} (Code: {fa.referralCode}) - Reason: {fa.fraudReason}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Affiliates Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-y">
            <tr>
              <th className="p-3">Partner Code</th>
              <th className="p-3">Payout Email</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Total Earned</th>
              <th className="p-3">Total Paid</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {affiliates.map((aff) => (
              <tr key={aff.id} className="hover:bg-gray-50/60">
                <td className="p-3 font-mono font-bold text-blue-600">{aff.referralCode}</td>
                <td className="p-3">{aff.payoutEmail}</td>
                <td className="p-3 font-semibold">{aff.commissionRatePercent}%</td>
                <td className="p-3 font-semibold">${(aff.totalEarnedCents / 100).toFixed(2)}</td>
                <td className="p-3 text-green-600 font-semibold">${(aff.totalPaidCents / 100).toFixed(2)}</td>
                <td className="p-3 text-right">
                  {onApprovePayout && (
                    <button
                      type="button"
                      onClick={() => onApprovePayout(aff.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
                    >
                      Review Payout
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
