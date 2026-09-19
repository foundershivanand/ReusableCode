import React, { useState } from "react";
import { useApiKeys } from "../client/hooks.js";

export const ApiKeyManager: React.FC = () => {
  const { apiKeys, createApiKey, revokeApiKey, isLoading, error } = useApiKeys();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("read:all, write:all");
  const [expiresInDays, setExpiresInDays] = useState(90);
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createApiKey({
      name,
      scopes: scopes.split(",").map((s) => s.trim()).filter(Boolean),
      expiresInDays: Number(expiresInDays),
      rateLimitPerMinute: 60
    });
    setGeneratedRawKey(result.rawKey);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Public API Keys</h3>
          <p className="text-xs text-gray-500">
            Generate and manage secret keys for authenticating server-to-server API requests.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setGeneratedRawKey(null);
            setShowCreateModal(true);
          }}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          + Generate New Key
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded">{error}</div>}

      {/* Creation Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-gray-900">Create API Key</h4>

            {generatedRawKey ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
                  <span className="font-bold">Important:</span> Copy this secret key now. It will NEVER
                  be shown again!
                </div>
                <div className="p-3 bg-gray-900 text-green-400 font-mono text-xs rounded-lg break-all select-all">
                  {generatedRawKey}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  I have saved this key
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Key Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Zapier Integration Key"
                    required
                    className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Scopes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={scopes}
                    onChange={(e) => setScopes(e.target.value)}
                    placeholder="e.g. read:projects, write:projects"
                    required
                    className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expiration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm"
                  >
                    Generate
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No active API keys found.</div>
        ) : (
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-y">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Key Identifier</th>
                <th className="p-3">Scopes</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Used</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50/60">
                  <td className="p-3 font-semibold text-gray-900">{key.name}</td>
                  <td className="p-3 font-mono text-gray-600">{key.prefix}...</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.map((s, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        key.lifecycleState === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {key.lifecycleState}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-3 text-right">
                    {key.lifecycleState === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => revokeApiKey(key.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
