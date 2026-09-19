import React from "react";
import { useWebhookEndpoints } from "../client/hooks.js";

export const WebhookDeliveryLogs: React.FC = () => {
  const { deliveryLogs, isLoading } = useWebhookEndpoints();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900">Webhook Delivery Logs</h3>
        <p className="text-xs text-gray-500">
          Inspect delivery attempts, HTTP response codes, execution times, and errors.
        </p>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading delivery logs...</div>
        ) : deliveryLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No delivery logs recorded yet.</div>
        ) : (
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-y">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">HTTP Status</th>
                <th className="p-3">Result</th>
                <th className="p-3">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deliveryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/60">
                  <td className="p-3 text-gray-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-mono font-semibold text-gray-900">{log.eventType}</td>
                  <td className="p-3 font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        log.statusCode && log.statusCode >= 200 && log.statusCode < 300
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.statusCode || "ERR"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-semibold text-gray-600">{log.status}</span>
                  </td>
                  <td className="p-3 text-gray-400 font-mono">{log.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
