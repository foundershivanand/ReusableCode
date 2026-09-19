import React, { createContext, useContext, useState } from "react";
import { SecurityClient } from "./security-client.js";

interface SecurityContextValue {
  client: SecurityClient;
  rateLimitModal: { isOpen: boolean; retryAfterSeconds: number } | null;
  triggerRateLimitModal: (retryAfterSeconds: number) => void;
  closeRateLimitModal: () => void;
}

const SecurityReactContext = createContext<SecurityContextValue | null>(null);

export interface SecurityProviderProps {
  client?: SecurityClient;
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({
  client = new SecurityClient(),
  children
}) => {
  const [rateLimitModal, setRateLimitModal] = useState<{ isOpen: boolean; retryAfterSeconds: number } | null>(null);

  const triggerRateLimitModal = (retryAfterSeconds: number) => {
    setRateLimitModal({ isOpen: true, retryAfterSeconds });
  };

  const closeRateLimitModal = () => {
    setRateLimitModal(null);
  };

  return (
    <SecurityReactContext.Provider
      value={{
        client,
        rateLimitModal,
        triggerRateLimitModal,
        closeRateLimitModal
      }}
    >
      {children}
    </SecurityReactContext.Provider>
  );
};

export function useSecurity(): SecurityContextValue {
  const ctx = useContext(SecurityReactContext);
  if (!ctx) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return ctx;
}
