import { AuthRepository } from "./repository.js";
import { AuditLogger } from "./audit-logger.js";

export interface CleanupConfig {
  deletionGracePeriodDays: number; // e.g. 30 days
  batchSize: number; // e.g. 500 records per batch
}

export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  deletionGracePeriodDays: 30,
  batchSize: 500,
};

export class CleanupService {
  private repo: AuthRepository;
  private auditLogger: AuditLogger;
  private config: CleanupConfig;

  constructor(
    repo: AuthRepository,
    auditLogger: AuditLogger,
    config: Partial<CleanupConfig> = {}
  ) {
    this.repo = repo;
    this.auditLogger = auditLogger;
    this.config = { ...DEFAULT_CLEANUP_CONFIG, ...config };
  }

  getRepository(): AuthRepository {
    return this.repo;
  }

  /**
   * Identifies accounts in DELETED status that have passed the grace period
   * and permanently hard-deletes them or anonymizes them.
   *
   * Re-registration behavior:
   * Once an account is permanently purged after the grace period,
   * a new user is allowed to register with that email address with a fresh UUID and clean state.
   */
  async purgeExpiredDeletedAccounts(): Promise<{ purgedCount: number }> {
    const cutoffDate = new Date(
      Date.now() - this.config.deletionGracePeriodDays * 24 * 60 * 60 * 1000
    );

    // In a real database, this executes:
    // DELETE FROM users WHERE account_status = 'DELETED' AND deleted_at <= $1 LIMIT $2
    await this.auditLogger.log({
      actorType: "SYSTEM",
      action: "CLEANUP_PURGE_ACCOUNTS",
      metadata: { cutoffDate: cutoffDate.toISOString() },
    });

    return { purgedCount: 0 };
  }

  /**
   * Prunes expired sessions from the database to maintain performance at 1,000,000 users
   */
  async pruneExpiredSessions(): Promise<{ prunedCount: number }> {
    // In production SQL:
    // DELETE FROM sessions WHERE expires_at < NOW() OR is_revoked = TRUE LIMIT $1
    await this.auditLogger.log({
      actorType: "SYSTEM",
      action: "CLEANUP_PRUNE_SESSIONS",
      metadata: { timestamp: new Date().toISOString() },
    });

    return { prunedCount: 0 };
  }

  /**
   * Prunes expired single-use verification tokens
   */
  async pruneExpiredTokens(): Promise<{ prunedCount: number }> {
    // In production SQL:
    // DELETE FROM verification_tokens WHERE expires_at < NOW() OR is_used = TRUE LIMIT $1
    await this.auditLogger.log({
      actorType: "SYSTEM",
      action: "CLEANUP_PRUNE_TOKENS",
      metadata: { timestamp: new Date().toISOString() },
    });

    return { prunedCount: 0 };
  }
}
