import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { MigrationRecord, BackupRecord, DisasterRecoveryConfig } from "../schemas/database-schemas.js";
import { DatabaseClient } from "./database-client.js";

export interface DatabaseContextValue {
  migrations: MigrationRecord[];
  backups: BackupRecord[];
  drConfig: DisasterRecoveryConfig | null;
  loading: boolean;
  triggerBackup: () => Promise<BackupRecord>;
  verifyRestore: (backupId: string) => Promise<{ success: boolean; durationMs: number }>;
  refresh: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export interface DatabaseProviderProps {
  client?: DatabaseClient;
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  client,
  children,
}) => {
  const [migrations, setMigrations] = useState<MigrationRecord[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [drConfig, setDrConfig] = useState<DisasterRecoveryConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const dbClient = useMemo(() => client || new DatabaseClient(), [client]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [migs, bkups, cfg] = await Promise.all([
        dbClient.getMigrations(),
        dbClient.getBackups(),
        dbClient.getDisasterRecoveryConfig(),
      ]);
      setMigrations(migs);
      setBackups(bkups);
      setDrConfig(cfg);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [dbClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const triggerBackup = useCallback(async () => {
    const record = await dbClient.triggerBackup();
    setBackups((prev) => [record, ...prev]);
    return record;
  }, [dbClient]);

  const verifyRestore = useCallback(
    async (backupId: string) => {
      const res = await dbClient.verifyRestore(backupId);
      await refresh();
      return res;
    },
    [dbClient, refresh]
  );

  return (
    <DatabaseContext.Provider
      value={{
        migrations,
        backups,
        drConfig,
        loading,
        triggerBackup,
        verifyRestore,
        refresh,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export function useDatabaseContext(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error("useDatabaseContext must be used within a DatabaseProvider");
  }
  return ctx;
}
