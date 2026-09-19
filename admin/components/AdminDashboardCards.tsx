import React from "react";
import type { DashboardStats } from "../schemas/index.js";

export interface AdminDashboardCardsProps {
  stats: DashboardStats;
  className?: string;
}

export const AdminDashboardCards: React.FC<AdminDashboardCardsProps> = ({ stats, className = "" }) => {
  const formattedRevenue = (stats.revenueMinorUnits / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });

  const cards = [
    { title: "Active Users", value: stats.activeUsers.toLocaleString(), color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Revenue (MRR)", value: formattedRevenue, color: "text-green-600", bg: "bg-green-50" },
    { title: "Subscriptions", value: stats.activeSubscriptions.toLocaleString(), color: "text-purple-600", bg: "bg-purple-50" },
    {
      title: "Errors (24h)",
      value: stats.errorCountLast24h.toLocaleString(),
      color: stats.errorCountLast24h > 0 ? "text-amber-600" : "text-gray-600",
      bg: stats.errorCountLast24h > 0 ? "bg-amber-50" : "bg-gray-50"
    },
    {
      title: "Failed Jobs",
      value: stats.failedJobsCount.toLocaleString(),
      color: stats.failedJobsCount > 0 ? "text-red-600" : "text-gray-600",
      bg: stats.failedJobsCount > 0 ? "bg-red-50" : "bg-gray-50"
    },
    {
      title: "Webhook Failures",
      value: stats.webhookFailuresLast24h.toLocaleString(),
      color: stats.webhookFailuresLast24h > 0 ? "text-red-600" : "text-gray-600",
      bg: stats.webhookFailuresLast24h > 0 ? "bg-red-50" : "bg-gray-50"
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {cards.map((card) => (
        <div key={card.title} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bg}`}>
            <span className={`text-base font-bold ${card.color}`}>●</span>
          </div>
        </div>
      ))}
    </div>
  );
};
