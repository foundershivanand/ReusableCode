import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ReferralClient } from "./referral-client.js";
import type { AffiliateAccount, CommissionLedgerEntry } from "../schemas/referral-schemas.js";

interface ReferralContextValue {
  client: ReferralClient;
  account: AffiliateAccount | null;
  commissions: CommissionLedgerEntry[];
  isLoading: boolean;
  error: string | null;
  registerAffiliate: (referralCode: string, payoutEmail: string) => Promise<AffiliateAccount>;
  refresh: () => Promise<void>;
}

const ReferralContext = createContext<ReferralContextValue | null>(null);

export interface ReferralProviderProps {
  client?: ReferralClient;
  tenantId: string;
  userId: string;
  children: React.ReactNode;
}

export const ReferralProvider: React.FC<ReferralProviderProps> = ({
  client = new ReferralClient(),
  tenantId,
  userId,
  children
}) => {
  const [account, setAccount] = useState<AffiliateAccount | null>(null);
  const [commissions, setCommissions] = useState<CommissionLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [acc, comms] = await Promise.all([
        client.getAccount().catch(() => null),
        client.listCommissions().catch(() => [])
      ]);
      setAccount(acc);
      setCommissions(comms);
    } catch (err: any) {
      setError(err.message || "Failed to load referral data");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const registerAffiliate = async (referralCode: string, payoutEmail: string) => {
    const created = await client.createAccount({
      tenantId,
      userId,
      referralCode,
      payoutEmail,
      commissionRatePercent: 20
    });
    setAccount(created);
    return created;
  };

  return (
    <ReferralContext.Provider
      value={{
        client,
        account,
        commissions,
        isLoading,
        error,
        registerAffiliate,
        refresh
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferral = (): ReferralContextValue => {
  const ctx = useContext(ReferralContext);
  if (!ctx) {
    throw new Error("useReferral must be used within a ReferralProvider");
  }
  return ctx;
};
