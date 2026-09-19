import React, { useState } from "react";
import { Plan } from "../schemas/billing-schemas.js";
import { Money } from "../server/money.js";

export interface CheckoutProps {
  plan: Plan;
  onProceedToPay: (options: { couponCode?: string; taxId?: string }) => Promise<void>;
  onCancel?: () => void;
}

export const Checkout: React.FC<CheckoutProps> = ({
  plan,
  onProceedToPay,
  onCancel,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = new Money(plan.amountMinorUnits, plan.currency).format();

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await onProceedToPay({
        couponCode: couponCode.trim() || undefined,
        taxId: taxId.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Checkout Summary"
      style={{
        maxWidth: "450px",
        margin: "0 auto",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Checkout Summary</h2>

      {error && (
        <div
          role="alert"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #f87171",
            borderRadius: "6px",
            color: "#b91c1c",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontWeight: 500 }}>{plan.name}</span>
          <span style={{ fontWeight: 600 }}>{price}</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>
          Billed {plan.interval === "month" ? "monthly" : plan.interval === "year" ? "annually" : "once"}
        </p>
      </div>

      <form onSubmit={handlePay}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Coupon Code (Optional)
          </label>
          <input
            type="text"
            placeholder="PROMO20"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            VAT / Tax ID (Optional)
          </label>
          <input
            type="text"
            placeholder="EU123456789"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.625rem",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: 600,
            borderRadius: "6px",
            border: "none",
            fontSize: "0.875rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            marginBottom: "0.5rem",
          }}
        >
          {isLoading ? "Redirecting to Secure Gateway..." : `Proceed to Payment (${price})`}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "transparent",
              color: "#6b7280",
              border: "none",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
};
