import React, { useState } from "react";
import { useWebhookEndpoints } from "../client/hooks.js";

export const WebhookManager: React.FC = () => {
  const { endpoints, registerEndpoint, isLoading, error } = useWebhookEndpoints();
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [eventTypes, setEventTypes] = useState("user.created, invoice.paid");
  const [description, setDescription] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerEndpoint(
      url,
      eventTypes.split(",").map((s) => s.trim()).filter(Boolean),
      description
    );
    setShowModal(false);
    setUrl("");
    setDescription("");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Webhook Endpoints</h3>
          <p className="text-xs text-gray-500">
            Subscribe your external servers to real-time events with HMAC signatures.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          + Add Endpoint
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded">{error}</div>}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-gray-900">Register Webhook Endpoint</h4>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Destination URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.mycompany.com/webhooks"
                  required
                  className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subscribed Events (comma-separated or *)
                </label>
                <input
                  type="text"
                  value={eventTypes}
                  onChange={(e) => setEventTypes(e.target.value)}
                  placeholder="e.g. project.created, invoice.paid"
                  required
                  className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Sync events to internal data warehouse"
                  className="w-full text-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm"
                >
                  Save Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Endpoints List */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading endpoints...</div>
        ) : endpoints.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No webhook endpoints configured.</div>
        ) : (
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div key={ep.id} className="p-4 border rounded-lg bg-gray-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-gray-900">{ep.url}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        ep.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ep.status}
                    </span>
                  </div>
                  {ep.description && <p className="text-xs text-gray-500 mt-1">{ep.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ep.eventTypes.map((ev, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white border font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-gray-400 block mb-1">
                    Secret: {ep.secret.substring(0, 10)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
