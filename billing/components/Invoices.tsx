import React from "react";
import { InvoiceRecord } from "../server/repository.js";
import { Money } from "../server/money.js";

export interface InvoicesProps {
  invoices: InvoiceRecord[];
  isLoading?: boolean;
}

export const Invoices: React.FC<InvoicesProps> = ({ invoices, isLoading = false }) => {
  if (isLoading) {
    return <div style={{ padding: "1.5rem", color: "#6b7280" }}>Loading invoices...</div>;
  }
  return (
    <div
      role="region"
      aria-label="Invoice History"
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Invoice History</h3>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem" }}>
        Historical invoices preserve immutable tax, price, and discount snapshots.
      </p>

      {invoices.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No invoices found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                <th style={{ padding: "0.5rem 0" }}>Date</th>
                <th style={{ padding: "0.5rem 0" }}>Description</th>
                <th style={{ padding: "0.5rem 0" }}>Amount</th>
                <th style={{ padding: "0.5rem 0" }}>Status</th>
                <th style={{ padding: "0.5rem 0", textAlign: "right" }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const totalFormatted = new Money(inv.totalMinorUnits, inv.currency).format();
                const description = inv.lineItems.map((li) => li.description).join(", ") || "Subscription";

                return (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem 0" }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "0.75rem 0", maxWidth: "200px" }}>{description}</td>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600 }}>{totalFormatted}</td>
                    <td style={{ padding: "0.75rem 0" }}>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: inv.status === "PAID" ? "#f0fdf4" : "#fef2f2",
                          color: inv.status === "PAID" ? "#166534" : "#b91c1c",
                        }}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0", textAlign: "right" }}>
                      {inv.invoicePdfUrl ? (
                        <a
                          href={inv.invoicePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2563eb", textDecoration: "none" }}
                        >
                          PDF ↓
                        </a>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>—</span>
                      )}
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
