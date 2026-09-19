import React from "react";
import { useAudit } from "../client/react-context.js";

export interface ActivityStreamProps {
  limit?: number;
  className?: string;
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({
  limit = 10,
  className = ""
}) => {
  const { logs, isLoading } = useAudit();
  const recentLogs = logs.slice(0, limit);

  if (isLoading) {
    return <div className="p-4 text-xs text-gray-400">Loading activity feed...</div>;
  }

  if (recentLogs.length === 0) {
    return <div className="p-4 text-xs text-gray-400">No recent activity.</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {recentLogs.map((entry) => (
        <div key={entry.id} className="flex items-start space-x-3 text-xs">
          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-gray-800">
              <span className="font-semibold">
                {entry.actor.name || entry.actor.email || entry.actor.id}
              </span>{" "}
              performed <span className="font-mono text-blue-600 font-semibold">{entry.action}</span> on{" "}
              <span className="font-medium text-gray-700">
                {entry.target.type} ({entry.target.id})
              </span>
            </p>
            <span className="text-[10px] text-gray-400">
              {new Date(entry.timestamp).toLocaleTimeString()} · {new Date(entry.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
