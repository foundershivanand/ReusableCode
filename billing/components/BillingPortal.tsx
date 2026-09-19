import React, { useState } from "react";

export interface BillingPortalProps {
  onOpenPortal: () => Promise<void>;
}

export const BillingPortal: React.FC<BillingPortalProps> = ({ onOpenPortal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onOpenPortal();
    } catch (err: any) {
      setError(err.message || "Failed to launch billing portal");
      setIsLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Billing Portal Access"
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Customer Billing Portal</h3>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem" }}>
        Update your payment methods, change billing contact details, download invoices, or manage tax IDs directly through our secure billing portal.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            padding: "0.5rem",
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

      <button
        type="button"
        disabled={isLoading}
        onClick={handleClick}
        style={{
          padding: "0.625rem 1.25rem",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          borderRadius: "6px",
          border: "none",
          fontWeight: 600,
          fontSize: "0.875rem",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? "Opening Secure Portal..." : "Open Billing Portal →"}
      </button>
    </div>
  );
};
