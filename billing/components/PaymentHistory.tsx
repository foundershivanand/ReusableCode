import React from "react";
import { PaymentTransactionRecord } from "../server/repository.js";
import { Money } from "../server/money.js";

export interface PaymentHistoryProps {
  payments: PaymentTransactionRecord[];
  isLoading?: boolean;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  isLoading = false,
}) => {
  if (isLoading) {
    return <div style={{ padding: "1.5rem", color: "#6b7280" }}>Loading payments...</div>;
  }
  return (
    <div
      role="region"
      aria-label="Payment Transactions"
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Payment History</h3>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem" }}>
        Direct record of all charges, refunds, and financial events.
      </p>

      {payments.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No payment history recorded.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                <th style={{ padding: "0.5rem 0" }}>Date</th>
                <th style={{ padding: "0.5rem 0" }}>Payment ID</th>
                <th style={{ padding: "0.5rem 0" }}>Amount</th>
                <th style={{ padding: "0.5rem 0" }}>Provider</th>
                <th style={{ padding: "0.5rem 0" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const formatted = new Money(p.amountMinorUnits, p.currency).format();

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem 0" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "0.75rem 0", fontFamily: "monospace", fontSize: "0.75rem" }}>
                      {p.providerPaymentId.slice(0, 16)}...
                    </td>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600 }}>{formatted}</td>
                    <td style={{ padding: "0.75rem 0", textTransform: "capitalize" }}>{p.provider}</td>
                    <td style={{ padding: "0.75rem 0" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor:
                            p.status === "SUCCEEDED"
                              ? "#f0fdf4"
                              : p.status === "REFUNDED"
                              ? "#f3f4f6"
                              : "#fef2f2",
                          color:
                            p.status === "SUCCEEDED"
                              ? "#166534"
                              : p.status === "REFUNDED"
                              ? "#4b5563"
                              : "#b91c1c",
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
