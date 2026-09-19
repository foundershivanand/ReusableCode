import React, { useState } from "react";
import { Plan } from "../schemas/billing-schemas.js";
import { Money } from "../server/money.js";

export interface PricingProps {
  plans: Plan[];
  currentPlanId?: string;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

export const Pricing: React.FC<PricingProps> = ({
  plans,
  currentPlanId,
  onSelectPlan,
  isLoading = false,
}) => {
  const [interval, setInterval] = useState<"month" | "year">("month");

  const filteredPlans = plans.filter((p) => p.interval === interval || p.interval === "one_time");

  return (
    <div
      role="region"
      aria-label="Pricing Plans"
      style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1rem", fontFamily: "sans-serif" }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>Simple, Transparent Pricing</h2>
        <p style={{ color: "#6b7280", fontSize: "1rem" }}>Choose the plan that fits your growth.</p>

        {/* Interval toggle */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.25rem",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            marginTop: "1.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setInterval("month")}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: interval === "month" ? "#ffffff" : "transparent",
              fontWeight: interval === "month" ? 600 : 500,
              boxShadow: interval === "month" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: interval === "year" ? "#ffffff" : "transparent",
              fontWeight: interval === "year" ? 600 : 500,
              boxShadow: interval === "year" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
            }}
          >
            Annual (Save 20%)
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          alignItems: "stretch",
        }}
      >
        {filteredPlans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const formattedPrice = new Money(plan.amountMinorUnits, plan.currency).format();

          return (
            <div
              key={plan.id}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "1.5rem",
                borderRadius: "12px",
                border: isCurrent ? "2px solid #2563eb" : "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                position: "relative",
              }}
            >
              {isCurrent && (
                <span
                  style={{
                    position: "absolute",
                    top: "-12px",
                    right: "1.5rem",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.5rem",
                    borderRadius: "9999px",
                  }}
                >
                  CURRENT PLAN
                </span>
              )}

              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem" }}>{plan.name}</h3>
                {plan.description && (
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>{plan.description}</p>
                )}

                <div style={{ margin: "1rem 0" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 700 }}>{formattedPrice}</span>
                  <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    /{plan.interval === "month" ? "mo" : plan.interval === "year" ? "yr" : "once"}
                  </span>
                </div>

                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563", textTransform: "uppercase" }}>
                    Included Features:
                  </span>
                  <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", fontSize: "0.875rem" }}>
                    {plan.features.map((feat, idx) => (
                      <li key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.35rem 0" }}>
                        <span style={{ color: "#16a34a" }}>✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading || isCurrent}
                onClick={() => onSelectPlan(plan.id)}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  borderRadius: "6px",
                  border: isCurrent ? "1px solid #d1d5db" : "none",
                  backgroundColor: isCurrent ? "#f9fafb" : "#2563eb",
                  color: isCurrent ? "#6b7280" : "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: isCurrent || isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isCurrent ? "Active Plan" : "Choose Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
