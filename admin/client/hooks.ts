import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "./react-context.js";
import type { AdminAuditLog } from "../schemas/index.js";

export function useAdminDashboard() {
  const { admin, stats, loading, error, refreshStats } = useAdmin();
  return { admin, stats, loading, error, refreshStats };
}

export function useImpersonation() {
  const { impersonatedUserId, startImpersonation, stopImpersonation } = useAdmin();
  return {
    isImpersonating: Boolean(impersonatedUserId),
    impersonatedUserId,
    startImpersonation,
    stopImpersonation
  };
}

export function useAdminAuditLogs(filter?: { targetId?: string; limit?: number; offset?: number }) {
  const { client } = useAdmin();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.listAuditLogs(filter);
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, JSON.stringify(filter)]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
