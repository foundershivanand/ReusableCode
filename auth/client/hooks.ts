import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./react-context.js";
import { ActiveSessionInfo } from "../server/session-service.js";
import { Permission, can, canAccess } from "../middleware/permission-middleware.js";

/**
 * Hook for session management (list active sessions, revoke session)
 */
export function useSession() {
  const { client, logout, logoutAll } = useAuth();
  const [sessions, setSessions] = useState<ActiveSessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    const res = await client.getSessions();
    if (res.success && res.data?.sessions) {
      setSessions(res.data.sessions);
    }
    setIsLoading(false);
  }, [client]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = useCallback(
    async (sessionId: string) => {
      const res = await client.revokeSession(sessionId);
      if (!res.success) {
        throw new Error(res.error?.message || "Failed to revoke session");
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    },
    [client]
  );

  return {
    sessions,
    isLoading,
    refreshSessions: fetchSessions,
    revokeSession,
    logout,
    logoutAll,
  };
}

/**
 * Hook for MFA actions (setup, enable, disable, regenerate backup codes)
 */
export function useMFA() {
  const { client, refreshUser } = useAuth();
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauthUrl: string;
    recoveryCodes: string[];
  } | null>(null);

  const startSetup = useCallback(async () => {
    const res = await client.setupMFA();
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || "Failed to initiate MFA setup");
    }
    setSetupData(res.data);
    return res.data;
  }, [client]);

  const confirmEnable = useCallback(
    async (code: string) => {
      if (!setupData) {
        throw new Error("MFA setup has not been initiated");
      }
      const res = await client.enableMFA({ mfaSecret: setupData.secret, code });
      if (!res.success) {
        throw new Error(res.error?.message || "Invalid MFA code");
      }
      setSetupData(null);
      await refreshUser();
    },
    [client, setupData, refreshUser]
  );

  const disableMFA = useCallback(
    async (currentPassword: string) => {
      const res = await client.disableMFA(currentPassword);
      if (!res.success) {
        throw new Error(res.error?.message || "Failed to disable MFA");
      }
      await refreshUser();
    },
    [client, refreshUser]
  );

  return {
    setupData,
    startSetup,
    confirmEnable,
    disableMFA,
  };
}

/**
 * Hook for client-side permission checks
 */
export function usePermissions() {
  const { user } = useAuth();

  return {
    hasPermission: (permission: Permission) => can(user as any, permission),
    canAccessResource: (resource: { ownerUserId?: string; tenantId?: string }, tenantId?: string) =>
      canAccess(user as any, resource, tenantId),
    role: user?.role,
    isAdmin: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
  };
}
