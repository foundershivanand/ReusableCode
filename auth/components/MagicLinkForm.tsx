import React, { useState } from "react";
import { MagicLinkSchema } from "../schemas/auth-schemas.js";

export interface MagicLinkFormProps {
  onSubmit: (data: { email: string; redirectUrl?: string }) => Promise<{ message: string }>;
  onBackToLogin?: () => void;
}

export const MagicLinkForm: React.FC<MagicLinkFormProps> = ({
  onSubmit,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    const validation = MagicLinkSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Invalid email address");
      return;
    }

    try {
      setIsLoading(true);
      const res = await onSubmit(validation.data);
      setStatusMessage(res.message);
    } catch (err: any) {
      setError(err.message || "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Magic Link Form"
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Passwordless Sign In</h2>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem" }}>
        Enter your email address and we will send you a secure login link.
      </p>

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

      {statusMessage && (
        <div
          role="status"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "6px",
            color: "#166534",
            fontSize: "0.875rem",
          }}
        >
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="magic-email"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
          >
            Email Address
          </label>
          <input
            id="magic-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || Boolean(statusMessage)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || Boolean(statusMessage)}
          style={{
            width: "100%",
            padding: "0.625rem",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontWeight: 500,
            borderRadius: "6px",
            border: "none",
            fontSize: "0.875rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Sending link..." : "Send Magic Link"}
        </button>
      </form>

      {onBackToLogin && (
        <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>
          <button
            type="button"
            onClick={onBackToLogin}
            style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", padding: 0 }}
          >
            Back to standard sign in
          </button>
        </div>
      )}
    </div>
  );
};
