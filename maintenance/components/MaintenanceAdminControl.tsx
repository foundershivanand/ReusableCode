import React, { useState } from "react";
import { MaintenanceConfig, MaintenanceMode, MaintenanceScope } from "../schemas/maintenance-schemas.js";

export interface MaintenanceAdminControlProps {
  activeConfig: MaintenanceConfig | null;
  onSaveConfig: (config: Partial<MaintenanceConfig>) => Promise<void>;
  onClearConfig: (id: string) => Promise<void>;
}

export const MaintenanceAdminControl: React.FC<MaintenanceAdminControlProps> = ({
  activeConfig,
  onSaveConfig,
  onClearConfig,
}) => {
  const [mode, setMode] = useState<MaintenanceMode>(activeConfig?.mode || "OFF");
  const [scope, setScope] = useState<MaintenanceScope>(activeConfig?.scope || "GLOBAL");
  const [target, setTarget] = useState<string>(activeConfig?.target || "*");
  const [title, setTitle] = useState<string>(activeConfig?.title || "Routine Maintenance");
  const [message, setMessage] = useState<string>(
    activeConfig?.message || "We are upgrading system components. Service will resume shortly."
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveConfig({
        mode,
        scope,
        target,
        title,
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Maintenance Admin Controls"
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 600 }}>
        Maintenance Mode Controls
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label htmlFor="maint-mode" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Mode
            </label>
            <select
              id="maint-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as MaintenanceMode)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
            >
              <option value="OFF">OFF (Normal Operation)</option>
              <option value="READ_ONLY">READ_ONLY (Block Mutations)</option>
              <option value="FULL_MAINTENANCE">FULL_MAINTENANCE (Block All)</option>
              <option value="DEGRADED">DEGRADED (Show Warning)</option>
            </select>
          </div>

          <div>
            <label htmlFor="maint-scope" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Scope
            </label>
            <select
              id="maint-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as MaintenanceScope)}
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
            >
              <option value="GLOBAL">Global (Entire System)</option>
              <option value="TENANT">Tenant-Specific</option>
              <option value="ROUTE">Route Pattern</option>
              <option value="API_VERSION">API Version</option>
            </select>
          </div>
        </div>

        {scope !== "GLOBAL" && (
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="maint-target" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Scope Target (Tenant ID, Route Prefix, or API Version)
            </label>
            <input
              id="maint-target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="/api/v1 or tenant_123"
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="maint-title" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Title
          </label>
          <input
            id="maint-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="maint-message" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Public Message
          </label>
          <textarea
            id="maint-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          {activeConfig && (
            <button
              type="button"
              onClick={() => onClearConfig(activeConfig.id)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid #fca5a5",
                backgroundColor: "#fef2f2",
                color: "#b91c1c",
                cursor: "pointer",
              }}
            >
              Clear Maintenance
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Updating..." : "Update Maintenance State"}
          </button>
        </div>
      </form>
    </div>
  );
};
