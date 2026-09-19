import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ComplianceClient } from "./compliance-client.js";
import type { ConsentEvidence, DataSubjectRequestType } from "../schemas/compliance-schemas.js";

interface ComplianceContextValue {
  client: ComplianceClient;
  consent: ConsentEvidence | null;
  isLoading: boolean;
  error: string | null;
  updateConsent: (
    terms: boolean,
    privacy: boolean,
    marketing: boolean,
    cookies: { essential: boolean; analytics: boolean; marketing: boolean; functional: boolean }
  ) => Promise<void>;
  submitDsr: (type: DataSubjectRequestType, reason?: string) => Promise<void>;
}

const ComplianceContext = createContext<ComplianceContextValue | null>(null);

export interface ComplianceProviderProps {
  client?: ComplianceClient;
  userId: string;
  tenantId: string;
  termsVersion?: string;
  privacyVersion?: string;
  jurisdiction?: string;
  children: React.ReactNode;
}

export const ComplianceProvider: React.FC<ComplianceProviderProps> = ({
  client = new ComplianceClient(),
  userId,
  tenantId,
  termsVersion = "2026.1",
  privacyVersion = "2026.1",
  jurisdiction = "US",
  children
}) => {
  const [consent, setConsent] = useState<ConsentEvidence | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const latest = await client.getLatestConsent();
      setConsent(latest);
    } catch (err: any) {
      setError(err.message || "Failed to load consent records");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateConsent = async (
    terms: boolean,
    privacy: boolean,
    marketing: boolean,
    cookies: { essential: boolean; analytics: boolean; marketing: boolean; functional: boolean }
  ) => {
    try {
      const recorded = await client.recordConsent({
        userId,
        tenantId,
        termsVersion,
        privacyVersion,
        acceptedTerms: terms,
        acceptedPrivacy: privacy,
        marketingConsent: marketing,
        cookieConsent: cookies,
        jurisdiction
      });
      setConsent(recorded);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const submitDsr = async (type: DataSubjectRequestType, reason?: string) => {
    try {
      await client.submitDsr(type, reason);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <ComplianceContext.Provider
      value={{
        client,
        consent,
        isLoading,
        error,
        updateConsent,
        submitDsr
      }}
    >
      {children}
    </ComplianceContext.Provider>
  );
};

export const useCompliance = (): ComplianceContextValue => {
  const ctx = useContext(ComplianceContext);
  if (!ctx) {
    throw new Error("useCompliance must be used within a ComplianceProvider");
  }
  return ctx;
};
