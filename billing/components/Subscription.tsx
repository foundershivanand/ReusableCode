import React from "react";
import { SubscriptionRecord } from "../server/repository.js";
import { Plan } from "../schemas/billing-schemas.js";

export interface SubscriptionProps {
  subscription: SubscriptionRecord | null;
  plan?: Plan | null;
  onUpgrade?: () => void;
  onCancel?: (immediately: boolean) => Promise<void>;
  onResume?: () => Promise<void>;
  onOpenPortal?: () => Promise<void>;
  isLoading?: boolean;
}

export const Subscription: React.FC<SubscriptionProps> = ({
  subscription,
  plan,
  onUpgrade,
  onCancel,
  onResume,
  onOpenPortal,
  isLoading = false,
}) => {
  if (!subscription) {
    return (
      <div
        role="region"
        aria-label="Subscription Status"
        style={{
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Free Plan</h3>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
          You are currently on the free tier. Upgrade to unlock premium features and higher limits.
        </p>
        {onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              borderRadius: "6px",
              border: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Explore Plans
          </button>
        )}
      </div>
    );
  }

  const isPastDue = subscription.status === "PAST_DUE";
  const isCanceled = subscription.status === "CANCELED";
  const isScheduledCancel = subscription.cancelAtPeriodEnd;

  return (
    <div
      role="region"
      aria-label="Subscription Status"
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>
            Current Plan
          </span>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0.25rem 0" }}>
            {plan?.name || subscription.planId.toUpperCase()}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 700,
                backgroundColor: isPastDue ? "#fef2f2" : isCanceled ? "#f3f4f6" : "#f0fdf4",
                color: isPastDue ? "#b91c1c" : isCanceled ? "#4b5563" : "#166534",
              }}
            >
              {subscription.status}
            </span>
            {isScheduledCancel && (
              <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>
                (Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()})
              </span>
            )}
          </div>
        </div>

        {onOpenPortal && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onOpenPortal}
            style={{
              padding: "0.4rem 0.75rem",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Manage in Billing Portal
          </button>
        )}
      </div>

      <div style={{ fontSize: "0.875rem", color: "#4b5563", borderTop: "1px solid #f3f4f6", paddingTop: "1rem", marginBottom: "1.25rem" }}>
        <div>
          Current billing period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} —{" "}
          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        {isScheduledCancel && onResume && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onResume}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#16a34a",
              color: "#ffffff",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Resume Subscription
          </button>
        )}

        {!isScheduledCancel && !isCanceled && onCancel && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onCancel(false)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ffffff",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "6px",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Cancel Subscription
          </button>
        )}

        {onUpgrade && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onUpgrade}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Change Plan
          </button>
        )}
      </div>
    </div>
  );
};
