import React from "react";
import type { AnalyticsEvent } from "../schemas/index.js";

export interface AnalyticsOverviewProps {
  events: AnalyticsEvent[];
  className?: string;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ events, className = "" }) => {
  if (events.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-400 text-xs bg-white rounded-lg border border-gray-200 ${className}`}>
        No analytics events captured yet.
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Live Event Stream</h3>
        <span className="text-[11px] text-gray-400 font-mono">{events.length} events</span>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto font-mono text-xs">
        {events.map((e) => (
          <div key={e.id} className="p-3 hover:bg-gray-50 flex items-start justify-between">
            <div>
              <span className="font-bold text-blue-600">{e.eventVersion}</span>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-md">
                {JSON.stringify(e.properties)}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
