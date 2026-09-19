import React, { useEffect, useState } from "react";

export interface VerifyEmailProps {
  token?: string;
  onVerify: (token: string) => Promise<void>;
  onSuccessRedirect?: () => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({
  token,
  onVerify,
  onSuccessRedirect,
}) => {
  const [inputToken, setInputToken] = useState(token || "");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      handleVerification(token);
    }
  }, [token]);

  const handleVerification = async (tok: string) => {
    if (!tok.trim()) {
      setErrorMessage("Please provide a valid verification token.");
      setStatus("error");
      return;
    }

    try {
      setStatus("verifying");
      setErrorMessage(null);
      await onVerify(tok.trim());
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to verify email.");
    }
  };

  return (
    <div
      role="region"
      aria-label="Verify Email"
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Email Verification
      </h2>

      {status === "verifying" && (
        <p style={{ color: "#2563eb", fontSize: "0.875rem" }}>Verifying your email address, please wait...</p>
      )}

      {status === "success" && (
        <div>
          <p style={{ color: "#16a34a", fontSize: "0.875rem", marginBottom: "1rem" }}>
            Your email has been verified successfully!
          </p>
          {onSuccessRedirect && (
            <button
              type="button"
              onClick={onSuccessRedirect}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      )}

      {status === "error" && (
        <div>
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
            {errorMessage}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerification(inputToken);
            }}
          >
            <input
              type="text"
              placeholder="Paste verification token"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "0.875rem",
                marginBottom: "0.75rem",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Retry Verification
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
