import React, { useState } from "react";
import { useAudit } from "../client/react-context.js";
import { AuditFilterBar } from "./AuditFilterBar.js";
import type { AuditLogEntry } from "../schemas/audit-schemas.js";

export const AuditLogViewer: React.FC = () => {
  const { logs, isLoading, error, verifyIntegrity } = useAudit();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<string | null>(null);

  const handleVerify = async () => {
    setIntegrityStatus("Verifying...");
    const res = await verifyIntegrity();
    if (res.valid) {
      setIntegrityStatus("✓ Cryptographic integrity verified (all hashes valid)");
    } else {
      setIntegrityStatus(`⚠️ Integrity compromised at record index ${res.compromisedIndex}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Audit Logs & Activity Trail</h3>
          <p className="text-xs text-gray-500">Immutable, append-only security log with hash verification</p>
        </div>
        <div className="flex items-center space-x-3">
          {integrityStatus && (
            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
              {integrityStatus}
            </span>
          )}
          <button
            type="button"
            onClick={handleVerify}
            className="text-xs font-semibold px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Verify Integrity
          </button>
        </div>
      </div>

      <div className="p-4">
        <AuditFilterBar />

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading audit trail...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-y">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Hash Digest</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3 text-gray-500 whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-gray-800">
                            {entry.actor.name || entry.actor.email || entry.actor.id}
                          </span>
                          <span className="ml-1.5 text-[10px] px-1 py-0.5 bg-gray-100 rounded text-gray-600">
                            {entry.actor.type}
                          </span>
                          {entry.actor.impersonator && (
                            <span className="block text-[10px] text-amber-600 font-semibold">
                              (Impersonated by: {entry.actor.impersonator.id})
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-semibold text-blue-600">
                          {entry.action}
                        </td>
                        <td className="p-3">
                          {entry.target.type}:{entry.target.id}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-gray-400">
                          {entry.hash ? entry.hash.substring(0, 12) + "..." : "none"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="p-4 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                              {entry.beforeState && (
                                <div className="bg-white p-3 rounded border">
                                  <span className="font-bold text-gray-700 block mb-1">
                                    Before State:
                                  </span>
                                  <pre className="overflow-x-auto text-gray-600">
                                    {JSON.stringify(entry.beforeState, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {entry.afterState && (
                                <div className="bg-white p-3 rounded border">
                                  <span className="font-bold text-gray-700 block mb-1">
                                    After State:
                                  </span>
                                  <pre className="overflow-x-auto text-gray-600">
                                    {JSON.stringify(entry.afterState, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-[10px] text-gray-400 font-mono">
                              Request ID: {entry.requestId} | Full Hash: {entry.hash}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
