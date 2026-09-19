import React from "react";
import { useAIUsage } from "../client/hooks.js";

export const AIUsageCard: React.FC = () => {
  const { budget, loading, error, refresh } = useAIUsage();

  if (loading) {
    return (
      <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="p-4 border border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600">
        Failed to load AI usage: {error || "No data"}
      </div>
    );
  }

  const dailySpendDollars = (budget.currentDailyMicroCents / 100_000_000).toFixed(2);
  const dailyLimitDollars = (budget.dailyMicroCentsLimit / 100_000_000).toFixed(2);
  const monthlySpendDollars = (budget.currentMonthlyMicroCents / 100_000_000).toFixed(2);
  const monthlyLimitDollars = (budget.monthlyMicroCentsLimit / 100_000_000).toFixed(2);

  const monthlyPct = Math.min(
    100,
    Math.round((budget.currentMonthlyMicroCents / budget.monthlyMicroCentsLimit) * 100)
  );

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            AI Budget & Usage
          </h3>
          <p className="text-xs text-gray-500">Real-time token & cost ledger tracking</p>
        </div>
        {budget.killSwitchActive ? (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            Kill Switch Active
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
            Active
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 my-4">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
          <span className="text-xs text-gray-500 font-medium">Daily Spend</span>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
            ${dailySpendDollars}{" "}
            <span className="text-xs font-normal text-gray-400">/ ${dailyLimitDollars}</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
          <span className="text-xs text-gray-500 font-medium">Monthly Spend</span>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
            ${monthlySpendDollars}{" "}
            <span className="text-xs font-normal text-gray-400">/ ${monthlyLimitDollars}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mt-4">
        <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
          <span>Monthly Quota Used</span>
          <span>{monthlyPct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              monthlyPct > 90 ? "bg-red-500" : monthlyPct > 70 ? "bg-amber-500" : "bg-blue-600"
            }`}
            style={{ width: `${monthlyPct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
        <button
          onClick={() => refresh()}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          Refresh Usage
        </button>
      </div>
    </div>
  );
};
