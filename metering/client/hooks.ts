import { useState, useEffect, useCallback } from "react";
import { useMeteringContext } from "./react-context.js";
import {
  CreditBalance,
  LedgerEntry,
  AutoRechargeConfig,
  ReserveCreditsInput,
  SettleCreditsInput,
  ReleaseCreditsInput,
  MeterEventIngest,
} from "../schemas/metering-schemas.js";

export function useCreditBalance() {
  const { client, tenantId } = useMeteringContext();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.getBalance(tenantId);
      setBalance(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch credit balance");
    } finally {
      setLoading(false);
    }
  }, [client, tenantId]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return { balance, loading, error, refreshBalance };
}

export function useMeteringLedger(limit: number = 50) {
  const { client, tenantId } = useMeteringContext();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLedger = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.getLedger(tenantId, limit);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch ledger entries");
    } finally {
      setLoading(false);
    }
  }, [client, tenantId, limit]);

  useEffect(() => {
    refreshLedger();
  }, [refreshLedger]);

  return { entries, loading, error, refreshLedger };
}

export function useAutoRecharge() {
  const { client, tenantId } = useMeteringContext();
  const [config, setConfig] = useState<AutoRechargeConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await client.getAutoRecharge(tenantId);
      setConfig(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch auto recharge config");
    } finally {
      setLoading(false);
    }
  }, [client, tenantId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (newConfig: AutoRechargeConfig) => {
    const updated = await client.configureAutoRecharge(newConfig);
    setConfig(updated);
    return updated;
  };

  return { config, loading, error, updateConfig, refetch: fetchConfig };
}

export function useMetering() {
  const { client, tenantId } = useMeteringContext();

  const ingestUsage = useCallback(
    (event: Omit<MeterEventIngest, "tenantId">) => {
      return client.ingestUsage({ ...event, tenantId });
    },
    [client, tenantId]
  );

  const reserveCredits = useCallback(
    (input: Omit<ReserveCreditsInput, "tenantId">) => {
      return client.reserveCredits({ ...input, tenantId });
    },
    [client, tenantId]
  );

  const settleCredits = useCallback(
    (input: SettleCreditsInput) => {
      return client.settleCredits(input);
    },
    [client]
  );

  const releaseCredits = useCallback(
    (input: ReleaseCreditsInput) => {
      return client.releaseCredits(input);
    },
    [client]
  );

  return { ingestUsage, reserveCredits, settleCredits, releaseCredits };
}
