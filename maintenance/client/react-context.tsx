import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { SystemBanner, CheckMaintenanceResult } from "../schemas/maintenance-schemas.js";
import { MaintenanceClient } from "./maintenance-client.js";

export interface MaintenanceContextValue {
  status: CheckMaintenanceResult | null;
  banners: SystemBanner[];
  dismissBanner: (id: string) => void;
  checkStatus: () => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextValue | null>(null);

export interface MaintenanceProviderProps {
  client?: MaintenanceClient;
  scope?: "ALL" | "AUTHENTICATED" | "GUEST";
  currentPath?: string;
  userId?: string;
  userRoles?: string[];
  tenantId?: string;
  children: React.ReactNode;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({
  client,
  scope = "ALL",
  currentPath = "/",
  userId,
  userRoles = [],
  tenantId,
  children,
}) => {
  const [status, setStatus] = useState<CheckMaintenanceResult | null>(null);
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const maintenanceClient = useMemo(() => client || new MaintenanceClient(), [client]);

  const checkStatus = useCallback(async () => {
    try {
      const res = await maintenanceClient.checkStatus({
        path: currentPath,
        method: "GET",
        tenantId,
        userId,
        userRoles,
      });
      setStatus(res);

      const activeBanners = await maintenanceClient.getBanners(scope);
      setBanners(activeBanners);
    } catch {
      // Graceful fallback
    }
  }, [maintenanceClient, currentPath, tenantId, userId, userRoles, scope]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const dismissBanner = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  const visibleBanners = useMemo(() => {
    return banners.filter((b) => !dismissedIds.has(b.id));
  }, [banners, dismissedIds]);

  return (
    <MaintenanceContext.Provider
      value={{
        status,
        banners: visibleBanners,
        dismissBanner,
        checkStatus,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export function useMaintenanceContext(): MaintenanceContextValue {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    throw new Error("useMaintenanceContext must be used within a MaintenanceProvider");
  }
  return ctx;
}
