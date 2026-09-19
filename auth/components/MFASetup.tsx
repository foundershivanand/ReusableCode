import React, { useState } from "react";

export interface MFASetupProps {
  onStartSetup: () => Promise<{ secret: string; otpauthUrl: string; recoveryCodes: string[] }>;
  onConfirmSetup: (code: string) => Promise<void>;
  onComplete?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({
  onStartSetup,
  onConfirmSetup,
  onComplete,
}) => {
  const [step, setStep] = useState<"initial" | "scanning" | "backup_codes" | "complete">("initial");
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string; recoveryCodes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await onStartSetup();
      setSetupData(data);
      setStep("scanning");
    } catch (err: any) {
      setError(err.message || "Failed to start MFA setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError("Please enter a 6-digit verification code");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onConfirmSetup(verificationCode.trim());
      setStep("backup_codes");
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Two-Factor Authentication Setup"
      style={{
        maxWidth: "450px",
        margin: "0 auto",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Two-Factor Authentication (MFA)
      </h2>

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

      {step === "initial" && (
        <div>
          <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1.25rem" }}>
            Protect your account with an extra layer of security using an authenticator app (e.g. Google Authenticator, 1Password, Authy).
          </p>
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.625rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 500,
              borderRadius: "6px",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Setting up..." : "Enable Two-Factor Authentication"}
          </button>
        </div>
      )}

      {step === "scanning" && setupData && (
        <div>
          <p style={{ fontSize: "0.875rem", color: "#4b5563", marginBottom: "1rem" }}>
            1. Open your authenticator app and enter the key below:
          </p>

          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#f3f4f6",
              borderRadius: "6px",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              textAlign: "center",
              letterSpacing: "0.1em",
              marginBottom: "1.25rem",
              wordBreak: "break-all",
              userSelect: "all",
            }}
          >
            {setupData.secret}
          </div>

          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: "1rem" }}>
              <label
                htmlFor="mfa-verify-code"
                style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}
              >
                2. Enter 6-digit code from your authenticator app:
              </label>
              <input
                id="mfa-verify-code"
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem",
                  letterSpacing: "0.2em",
                  textAlign: "center",
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
                fontWeight: 500,
                borderRadius: "6px",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Verifying..." : "Verify & Enable"}
            </button>
          </form>
        </div>
      )}

      {step === "backup_codes" && setupData && (
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#16a34a", marginBottom: "0.5rem" }}>
            MFA Successfully Enabled!
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#dc2626", fontWeight: 500, marginBottom: "0.5rem" }}>
            Save these recovery codes in a secure place. If you lose your authenticator device, they are the only way to recover your account:
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              padding: "0.75rem",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            {setupData.recoveryCodes.map((code, idx) => (
              <div key={idx} style={{ padding: "0.25rem 0.5rem", backgroundColor: "#ffffff", borderRadius: "4px" }}>
                {code}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setStep("complete");
              if (onComplete) onComplete();
            }}
            style={{
              width: "100%",
              padding: "0.625rem",
              backgroundColor: "#16a34a",
              color: "#ffffff",
              fontWeight: 500,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            I have safely saved these codes
          </button>
        </div>
      )}

      {step === "complete" && (
        <div style={{ textAlign: "center", color: "#16a34a" }}>
          <p style={{ fontWeight: 500 }}>Two-Factor Authentication is active.</p>
        </div>
      )}
    </div>
  );
};
