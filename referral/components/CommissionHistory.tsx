import React from "react";
import { useAffiliateAccount } from "../client/hooks.js";

export const CommissionHistory: React.FC = () => {
  const { commissions, isLoading } = useAffiliateAccount();

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-gray-400">Loading commission ledger...</div>;
  }

  if (commissions.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-gray-400 border rounded-xl bg-gray-50">
        No referral commissions earned yet. Share your referral link to get started!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-bold text-gray-900">Commission Ledger</h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Payment ID</th>
              <th className="p-3">Sale Amount</th>
              <th className="p-3">Commission</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commissions.map((comm) => (
              <tr key={comm.id} className="hover:bg-gray-50/60">
                <td className="p-3 text-gray-500 whitespace-nowrap">
                  {new Date(comm.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 font-mono text-gray-700">{comm.paymentId}</td>
                <td className="p-3 font-semibold">${(comm.amountCents / 100).toFixed(2)}</td>
                <td className="p-3 font-bold text-green-600">
                  +${(comm.commissionCents / 100).toFixed(2)}
                </td>
                <td className="p-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      comm.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : comm.status === "APPROVED"
                        ? "bg-blue-100 text-blue-700"
                        : comm.status === "REVERSED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {comm.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
