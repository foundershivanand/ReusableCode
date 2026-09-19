import React, { useState, useEffect } from "react";
import { AutoRechargeConfig } from "../schemas/metering-schemas.js";

export interface AutoRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoRechargeConfig | null;
  onSave: (config: AutoRechargeConfig) => Promise<void>;
}

export const AutoRechargeModal: React.FC<AutoRechargeModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [thresholdBalance, setThresholdBalance] = useState<number>(100);
  const [rechargeAmount, setRechargeAmount] = useState<number>(500);
  const [maxMonthlyRecharges, setMaxMonthlyRecharges] = useState<number>(5);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setThresholdBalance(config.thresholdBalance);
      setRechargeAmount(config.rechargeAmount);
      setMaxMonthlyRecharges(config.maxMonthlyRecharges);
    }
  }, [config]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      await onSave({
        ...config,
        enabled,
        thresholdBalance,
        rechargeAmount,
        maxMonthlyRecharges,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save auto-recharge settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auto-recharge-modal-title"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 id="auto-recharge-modal-title" style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 600 }}>
          Configure Auto-Recharge
        </h2>

        {error && (
          <div role="alert" style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                aria-describedby="auto-recharge-desc"
              />
              <span style={{ fontWeight: 500 }}>Enable Auto-Recharge</span>
            </label>
            <p id="auto-recharge-desc" style={{ margin: "0.25rem 0 0 1.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
              Automatically purchase credits when your available balance drops below the threshold.
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="threshold-balance" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Trigger Threshold (Credits)
            </label>
            <input
              id="threshold-balance"
              type="number"
              min={0}
              value={thresholdBalance}
              onChange={(e) => setThresholdBalance(Number(e.target.value))}
              disabled={!enabled}
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="recharge-amount" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Recharge Amount (Credits)
            </label>
            <input
              id="recharge-amount"
              type="number"
              min={1}
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(Number(e.target.value))}
              disabled={!enabled}
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="max-monthly" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Max Monthly Recharges
            </label>
            <input
              id="max-monthly"
              type="number"
              min={1}
              value={maxMonthlyRecharges}
              onChange={(e) => setMaxMonthlyRecharges(Number(e.target.value))}
              disabled={!enabled}
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "#ffffff",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
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
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
