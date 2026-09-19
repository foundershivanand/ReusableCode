import { useDatabaseContext } from "./react-context.js";

export function useMigrations() {
  const { migrations, loading, refresh } = useDatabaseContext();
  return { migrations, loading, refresh };
}

export function useBackups() {
  const { backups, drConfig, loading, triggerBackup, verifyRestore, refresh } = useDatabaseContext();
  return { backups, drConfig, loading, triggerBackup, verifyRestore, refresh };
}
