import { useAudit } from "./react-context.js";

export { useAudit };

export function useAuditLogs() {
  const { logs, isLoading, error, refresh, filter, setFilter } = useAudit();
  return { logs, isLoading, error, refresh, filter, setFilter };
}

export function useAuditIntegrity() {
  const { verifyIntegrity } = useAudit();
  return { verifyIntegrity };
}
