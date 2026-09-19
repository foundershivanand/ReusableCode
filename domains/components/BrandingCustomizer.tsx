import React, { useState, useEffect } from "react";
import { useBranding } from "../client/hooks.js";

export const BrandingCustomizer: React.FC = () => {
  const { branding, updateBranding } = useBranding();
  const [companyName, setCompanyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const [logoUrl, setLogoUrl] = useState("");
  const [senderEmailDomain, setSenderEmailDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (branding) {
      setCompanyName(branding.companyName);
      setPrimaryColor(branding.primaryColor);
      setAccentColor(branding.accentColor);
      setLogoUrl(branding.logoUrl || "");
      setSenderEmailDomain(branding.senderEmailDomain || "");
    }
  }, [branding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      await updateBranding({
        companyName,
        primaryColor,
        accentColor,
        logoUrl: logoUrl || null,
        senderEmailDomain: senderEmailDomain || null,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update branding settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="White-Label Branding Settings"
      style={{
        padding: "1.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        marginTop: "1.5rem",
      }}
    >
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700 }}>
        White-Label & Branding
      </h3>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
        Customize platform colors, logos, and email sender domains.
      </p>

      {error && (
        <div role="alert" style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      {success && (
        <div role="status" style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "6px" }}>
          Branding updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="branding-company" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Company Name
          </label>
          <input
            id="branding-company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label htmlFor="primary-color" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Primary Color
            </label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: "40px", height: "36px", padding: 0, border: "none", cursor: "pointer" }}
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="accent-color" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
              Accent Color
            </label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ width: "40px", height: "36px", padding: 0, border: "none", cursor: "pointer" }}
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="logo-url" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Logo URL
          </label>
          <input
            id="logo-url"
            type="url"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="sender-email-domain" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Custom Email Sender Domain
          </label>
          <input
            id="sender-email-domain"
            type="text"
            placeholder="mail.yourcompany.com"
            value={senderEmailDomain}
            onChange={(e) => setSenderEmailDomain(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
            Must match a verified, active custom domain in your workspace.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Branding"}
        </button>
      </form>
    </div>
  );
};
