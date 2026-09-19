import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AdminUser, DashboardStats } from "../schemas/index.js";
import { AdminClient } from "./admin-client.js";

interface AdminContextValue {
  client: AdminClient;
  admin: AdminUser | null;
  stats: DashboardStats | null;
  impersonatedUserId: string | null;
  loading: boolean;
  error: Error | null;
  refreshStats: () => Promise<void>;
  startImpersonation: (userId: string, reason: string) => Promise<void>;
  stopImpersonation: () => void;
}

const AdminReactContext = createContext<AdminContextValue | null>(null);

export interface AdminProviderProps {
  client: AdminClient;
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ client, children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const [adminUser, dashboardStats] = await Promise.all([
        client.getMe(),
        client.getDashboardStats()
      ]);
      setAdmin(adminUser);
      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const startImpersonation = async (userId: string, reason: string) => {
    await client.startImpersonation(userId, reason);
    setImpersonatedUserId(userId);
  };

  const stopImpersonation = () => {
    setImpersonatedUserId(null);
  };

  return (
    <AdminReactContext.Provider
      value={{
        client,
        admin,
        stats,
        impersonatedUserId,
        loading,
        error,
        refreshStats,
        startImpersonation,
        stopImpersonation
      }}
    >
      {children}
    </AdminReactContext.Provider>
  );
};

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminReactContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}
