import React from "react";
import { OAuthProvider } from "../schemas/auth-schemas.js";

export interface OAuthButtonsProps {
  onSelectProvider: (provider: OAuthProvider) => void;
  isLoading?: boolean;
  providers?: OAuthProvider[];
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onSelectProvider,
  isLoading = false,
  providers = ["google", "github", "apple"],
}) => {
  const providerDetails: Record<OAuthProvider, { label: string; icon: string }> = {
    google: { label: "Continue with Google", icon: "🔴" },
    github: { label: "Continue with GitHub", icon: "🐙" },
    apple: { label: "Continue with Apple", icon: "🍎" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          disabled={isLoading}
          onClick={() => onSelectProvider(p)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.625rem 1rem",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            color: "#1f2937",
            fontWeight: 500,
            fontSize: "0.875rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
            transition: "all 0.15s ease-in-out",
          }}
          aria-label={providerDetails[p].label}
        >
          <span>{providerDetails[p].icon}</span>
          <span>{providerDetails[p].label}</span>
        </button>
      ))}
    </div>
  );
};
