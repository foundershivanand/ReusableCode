import { useMaintenanceContext } from "./react-context.js";

export function useMaintenance() {
  const { status, checkStatus } = useMaintenanceContext();
  return {
    isBlocked: status?.blocked ?? false,
    isReadOnly: status?.readOnly ?? false,
    reason: status?.reason ?? null,
    publicMessage: status?.publicMessage ?? null,
    retryAfterSeconds: status?.retryAfterSeconds,
    checkStatus,
  };
}

export function useSystemBanners() {
  const { banners, dismissBanner } = useMaintenanceContext();
  return { banners, dismissBanner };
}
