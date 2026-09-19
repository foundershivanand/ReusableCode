import React from "react";
import type { AdminAuditLog } from "../schemas/index.js";

export interface AdminAuditLogTableProps {
  logs: AdminAuditLog[];
  className?: string;
}

export const AdminAuditLogTable: React.FC<AdminAuditLogTableProps> = ({ logs, className = "" }) => {
  if (logs.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 text-xs bg-white rounded-lg border border-gray-200 ${className}`}>
        No audit log entries recorded yet.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Admin</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">IP Address</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 font-medium">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-gray-900 whitespace-nowrap font-mono">
                {log.adminEmail}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  log.action.includes("DELETE") ? "bg-red-100 text-red-800" :
                  log.action.includes("SUSPEND") ? "bg-amber-100 text-amber-800" :
                  log.action.includes("IMPERSONATE") ? "bg-purple-100 text-purple-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-600">
                {log.targetType}: {log.targetId}
              </td>
              <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={log.reason}>
                {log.reason}
              </td>
              <td className="px-4 py-3 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                {log.ipAddress}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
