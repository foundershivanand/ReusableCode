import React from "react";
import { CreditBalance } from "../schemas/metering-schemas.js";

export interface CreditBalanceCardProps {
  balance: CreditBalance | null;
  loading?: boolean;
  onRechargeClick?: () => void;
}

export const CreditBalanceCard: React.FC<CreditBalanceCardProps> = ({
  balance,
  loading = false,
  onRechargeClick,
}) => {
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb",
        }}
      >
        <p style={{ color: "#6b7280" }}>Loading credit balance...</p>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const isLowBalance = balance.availableBalance < 50;

  return (
    <div
      role="region"
      aria-labelledby="credit-balance-title"
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        border: `1px solid ${isLowBalance ? "#fca5a5" : "#e5e7eb"}`,
        backgroundColor: isLowBalance ? "#fef2f2" : "#ffffff",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3
            id="credit-balance-title"
            style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "#111827" }}
          >
            Credit Balance
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Available credits for API requests and compute
          </p>
        </div>
        {onRechargeClick && (
          <button
            type="button"
            onClick={onRechargeClick}
            aria-label="Add credits or configure auto-recharge"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Add Credits
          </button>
        )}
      </div>

      <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Available</span>
          <div
            aria-label={`Available balance: ${balance.availableBalance.toFixed(2)}`}
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: isLowBalance ? "#dc2626" : "#16a34a",
            }}
          >
            {balance.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Reserved</span>
          <div
            aria-label={`Reserved balance: ${balance.reservedBalance.toFixed(2)}`}
            style={{ fontSize: "1.75rem", fontWeight: 700, color: "#4b5563" }}
          >
            {balance.reservedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase" }}>Lifetime Consumed</span>
          <div
            aria-label={`Lifetime consumed: ${balance.lifetimeConsumed.toFixed(2)}`}
            style={{ fontSize: "1.75rem", fontWeight: 700, color: "#4b5563" }}
          >
            {balance.lifetimeConsumed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};
