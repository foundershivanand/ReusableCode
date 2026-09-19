import React, { useState } from "react";
import { useDomains } from "../client/hooks.js";
import { DnsInstructionsCard } from "./DnsInstructionsCard.js";

export const DomainManager: React.FC = () => {
  const { domains, loading, requestDomain, verifyDomain, deleteDomain } = useDomains();
  const [newDomain, setNewDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;

    try {
      setSubmitting(true);
      setError(null);
      await requestDomain(newDomain.trim());
      setNewDomain("");
    } catch (err: any) {
      setError(err.message || "Failed to request custom domain");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading domain settings...</p>;
  }

  return (
    <div
      role="region"
      aria-label="Custom Domain Manager"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
        Custom Domains
      </h2>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
        Connect your own domain or subdomain to your workspace.
      </p>

      {error && (
        <div role="alert" style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleAddDomain} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="app.yourcompany.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          required
          aria-label="Domain name"
          style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Adding..." : "Add Domain"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {domains.map((d) => (
          <div
            key={d.id}
            style={{
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <strong style={{ fontSize: "1rem" }}>{d.domain}</strong>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: d.status === "ACTIVE" ? "#dcfce7" : "#fef3c7",
                      color: d.status === "ACTIVE" ? "#166534" : "#92400e",
                      fontWeight: 600,
                    }}
                  >
                    {d.status}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: d.sslStatus === "ISSUED" ? "#dcfce7" : "#f1f5f9",
                      color: d.sslStatus === "ISSUED" ? "#166534" : "#475569",
                    }}
                  >
                    SSL: {d.sslStatus}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {d.status !== "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() => verifyDomain(d.id)}
                    style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: "6px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    Verify DNS
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteDomain(d.id)}
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "6px",
                    backgroundColor: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#b91c1c",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>

            {d.status !== "ACTIVE" && d.dnsChallenges.length > 0 && (
              <DnsInstructionsCard challenges={d.dnsChallenges} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
