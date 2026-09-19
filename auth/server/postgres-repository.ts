import {
  AccountStatus,
  OAuthProvider,
  UserRole,
} from "../schemas/auth-schemas.js";
import {
  AuditLogRecord,
  AuthRepository,
  MFARecoveryCodeRecord,
  OAuthAccountRecord,
  SessionRecord,
  TokenPurpose,
  UserRecord,
  VerificationTokenRecord,
} from "./repository.js";

/**
 * Interface representing a PostgreSQL connection or pool (e.g. pg.Pool, pg.Client)
 */
export interface PgDatabaseClient {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>;
}

export class PostgresAuthRepository implements AuthRepository {
  private client: PgDatabaseClient;

  constructor(client: PgDatabaseClient) {
    this.client = client;
  }

  // Users
  async createUser(data: Omit<UserRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<UserRecord> {
    const text = `
      INSERT INTO users (
        email, name, password_hash, role, account_status,
        is_email_verified, mfa_enabled, mfa_secret, mfa_last_used_step,
        session_version, failed_login_attempts, locked_until, deleted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const params = [
      data.email.toLowerCase(),
      data.name || null,
      data.passwordHash || null,
      data.role,
      data.accountStatus,
      data.isEmailVerified,
      data.mfaEnabled,
      data.mfaSecret || null,
      data.mfaLastUsedStep,
      data.sessionVersion,
      data.failedLoginAttempts,
      data.lockedUntil || null,
      data.deletedAt || null,
    ];

    const res = await this.client.query(text, params);
    return this.mapUser(res.rows[0]);
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const res = await this.client.query("SELECT * FROM users WHERE id = $1 LIMIT 1;", [id]);
    return res.rows[0] ? this.mapUser(res.rows[0]) : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const res = await this.client.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;", [email]);
    return res.rows[0] ? this.mapUser(res.rows[0]) : null;
  }

  async updateUser(id: string, update: Partial<UserRecord>): Promise<UserRecord> {
    const fields: string[] = [];
    const params: any[] = [id];
    let idx = 2;

    const columnMap: Record<string, string> = {
      email: "email",
      name: "name",
      passwordHash: "password_hash",
      role: "role",
      accountStatus: "account_status",
      isEmailVerified: "is_email_verified",
      mfaEnabled: "mfa_enabled",
      mfaSecret: "mfa_secret",
      mfaLastUsedStep: "mfa_last_used_step",
      sessionVersion: "session_version",
      failedLoginAttempts: "failed_login_attempts",
      lockedUntil: "locked_until",
      deletedAt: "deleted_at",
    };

    for (const [key, val] of Object.entries(update)) {
      const col = columnMap[key];
      if (col) {
        fields.push(`${col} = $${idx}`);
        params.push(val);
        idx++;
      }
    }

    fields.push("updated_at = NOW()");

    const text = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $1
      RETURNING *;
    `;

    const res = await this.client.query(text, params);
    if (!res.rows[0]) throw new Error("User not found for update");
    return this.mapUser(res.rows[0]);
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.query(
      "UPDATE users SET account_status = 'DELETED', deleted_at = NOW(), updated_at = NOW() WHERE id = $1;",
      [id]
    );
  }

  // Sessions
  async createSession(data: Omit<SessionRecord, "id"> & { id?: string }): Promise<SessionRecord> {
    const text = `
      INSERT INTO sessions (
        user_id, token_hash, user_agent, ip_address, created_at, last_active_at, expires_at, is_revoked, session_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const params = [
      data.userId,
      data.tokenHash,
      data.userAgent || null,
      data.ipAddress || null,
      data.createdAt,
      data.lastActiveAt,
      data.expiresAt,
      data.isRevoked,
      data.sessionVersion,
    ];
    const res = await this.client.query(text, params);
    return this.mapSession(res.rows[0]);
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const res = await this.client.query(
      "SELECT * FROM sessions WHERE token_hash = $1 AND is_revoked = FALSE LIMIT 1;",
      [tokenHash]
    );
    return res.rows[0] ? this.mapSession(res.rows[0]) : null;
  }

  async findSessionById(id: string): Promise<SessionRecord | null> {
    const res = await this.client.query("SELECT * FROM sessions WHERE id = $1 LIMIT 1;", [id]);
    return res.rows[0] ? this.mapSession(res.rows[0]) : null;
  }

  async findSessionsByUserId(userId: string): Promise<SessionRecord[]> {
    const res = await this.client.query(
      "SELECT * FROM sessions WHERE user_id = $1 AND is_revoked = FALSE ORDER BY created_at DESC;",
      [userId]
    );
    return res.rows.map((r) => this.mapSession(r));
  }

  async updateSession(id: string, update: Partial<SessionRecord>): Promise<SessionRecord> {
    const fields: string[] = [];
    const params: any[] = [id];
    let idx = 2;

    if (update.lastActiveAt) {
      fields.push(`last_active_at = $${idx++}`);
      params.push(update.lastActiveAt);
    }
    if (update.expiresAt) {
      fields.push(`expires_at = $${idx++}`);
      params.push(update.expiresAt);
    }
    if (update.isRevoked !== undefined) {
      fields.push(`is_revoked = $${idx++}`);
      params.push(update.isRevoked);
    }

    const res = await this.client.query(
      `UPDATE sessions SET ${fields.join(", ")} WHERE id = $1 RETURNING *;`,
      params
    );
    if (!res.rows[0]) throw new Error("Session not found for update");
    return this.mapSession(res.rows[0]);
  }

  async revokeSession(id: string): Promise<void> {
    await this.client.query("UPDATE sessions SET is_revoked = TRUE WHERE id = $1;", [id]);
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.client.query("UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1;", [userId]);
  }

  async revokeOtherSessions(userId: string, exceptSessionId: string): Promise<void> {
    await this.client.query(
      "UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1 AND id != $2;",
      [userId, exceptSessionId]
    );
  }

  // OAuth Accounts
  async createOAuthAccount(data: Omit<OAuthAccountRecord, "id" | "createdAt"> & { id?: string }): Promise<OAuthAccountRecord> {
    const text = `
      INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const res = await this.client.query(text, [
      data.userId,
      data.provider,
      data.providerUserId,
      data.email || null,
    ]);
    return this.mapOAuth(res.rows[0]);
  }

  async findOAuthAccount(provider: OAuthProvider, providerUserId: string): Promise<OAuthAccountRecord | null> {
    const res = await this.client.query(
      "SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2 LIMIT 1;",
      [provider, providerUserId]
    );
    return res.rows[0] ? this.mapOAuth(res.rows[0]) : null;
  }

  async findOAuthAccountsByUserId(userId: string): Promise<OAuthAccountRecord[]> {
    const res = await this.client.query(
      "SELECT * FROM oauth_accounts WHERE user_id = $1 ORDER BY created_at ASC;",
      [userId]
    );
    return res.rows.map((r) => this.mapOAuth(r));
  }

  async deleteOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    await this.client.query(
      "DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2;",
      [userId, provider]
    );
  }

  // Verification Tokens
  async createVerificationToken(data: Omit<VerificationTokenRecord, "id" | "createdAt"> & { id?: string }): Promise<VerificationTokenRecord> {
    const text = `
      INSERT INTO verification_tokens (token_hash, user_id, email, purpose, metadata, expires_at, is_used)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const res = await this.client.query(text, [
      data.tokenHash,
      data.userId || null,
      data.email.toLowerCase(),
      data.purpose,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.expiresAt,
      data.isUsed,
    ]);
    return this.mapToken(res.rows[0]);
  }

  async findVerificationTokenByHash(tokenHash: string): Promise<VerificationTokenRecord | null> {
    const res = await this.client.query(
      "SELECT * FROM verification_tokens WHERE token_hash = $1 LIMIT 1;",
      [tokenHash]
    );
    return res.rows[0] ? this.mapToken(res.rows[0]) : null;
  }

  async markTokenUsed(id: string): Promise<void> {
    await this.client.query("UPDATE verification_tokens SET is_used = TRUE WHERE id = $1;", [id]);
  }

  async revokeTokensForUser(userId: string, purpose: TokenPurpose): Promise<void> {
    await this.client.query(
      "UPDATE verification_tokens SET is_used = TRUE WHERE user_id = $1 AND purpose = $2;",
      [userId, purpose]
    );
  }

  // MFA Recovery Codes
  async saveRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> {
    await this.invalidateRecoveryCodes(userId);
    for (const hash of codeHashes) {
      await this.client.query(
        "INSERT INTO mfa_recovery_codes (user_id, code_hash, is_used) VALUES ($1, $2, FALSE);",
        [userId, hash]
      );
    }
  }

  async findActiveRecoveryCodes(userId: string): Promise<MFARecoveryCodeRecord[]> {
    const res = await this.client.query(
      "SELECT * FROM mfa_recovery_codes WHERE user_id = $1 AND is_used = FALSE;",
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      codeHash: r.code_hash,
      isUsed: r.is_used,
      usedAt: r.used_at ? new Date(r.used_at) : null,
      createdAt: new Date(r.created_at),
    }));
  }

  async markRecoveryCodeUsed(id: string): Promise<void> {
    await this.client.query(
      "UPDATE mfa_recovery_codes SET is_used = TRUE, used_at = NOW() WHERE id = $1;",
      [id]
    );
  }

  async invalidateRecoveryCodes(userId: string): Promise<void> {
    await this.client.query(
      "UPDATE mfa_recovery_codes SET is_used = TRUE WHERE user_id = $1;",
      [userId]
    );
  }

  // Password History
  async addPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    await this.client.query(
      "INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2);",
      [userId, passwordHash]
    );
  }

  async getRecentPasswordHashes(userId: string, limit: number): Promise<string[]> {
    const res = await this.client.query(
      "SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2;",
      [userId, limit]
    );
    return res.rows.map((r) => r.password_hash);
  }

  // Audit Logs
  async createAuditLog(data: Omit<AuditLogRecord, "id" | "timestamp"> & { id?: string }): Promise<AuditLogRecord> {
    const text = `
      INSERT INTO audit_logs (actor_type, actor_id, action, target_type, target_id, tenant_id, ip_address, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const res = await this.client.query(text, [
      data.actorType,
      data.actorId || null,
      data.action,
      data.targetType || null,
      data.targetId || null,
      data.tenantId || null,
      data.ipAddress || null,
      data.userAgent || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]);
    const r = res.rows[0];
    return {
      id: r.id,
      actorType: r.actor_type,
      actorId: r.actor_id,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      tenantId: r.tenant_id,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      metadata: r.metadata ? (typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata) : null,
      timestamp: new Date(r.timestamp),
    };
  }

  async getAuditLogs(filter: {
    actorId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogRecord[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filter.actorId) {
      conditions.push(`actor_id = $${idx++}`);
      params.push(filter.actorId);
    }
    if (filter.action) {
      conditions.push(`action = $${idx++}`);
      params.push(filter.action);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    params.push(limit, offset);
    const sql = `SELECT * FROM audit_logs ${where} ORDER BY timestamp DESC LIMIT $${idx++} OFFSET $${idx++};`;

    const res = await this.client.query(sql, params);
    return res.rows.map((r) => ({
      id: r.id,
      actorType: r.actor_type,
      actorId: r.actor_id,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      tenantId: r.tenant_id,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      metadata: r.metadata ? (typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata) : null,
      timestamp: new Date(r.timestamp),
    }));
  }

  // Transactions
  async withTransaction<T>(operation: (txRepo: AuthRepository) => Promise<T>): Promise<T> {
    try {
      await this.client.query("BEGIN;");
      const result = await operation(this);
      await this.client.query("COMMIT;");
      return result;
    } catch (err) {
      await this.client.query("ROLLBACK;");
      throw err;
    }
  }

  // Helpers
  private mapUser(row: any): UserRecord {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      accountStatus: row.account_status as AccountStatus,
      isEmailVerified: row.is_email_verified,
      mfaEnabled: row.mfa_enabled,
      mfaSecret: row.mfa_secret,
      mfaLastUsedStep: Number(row.mfa_last_used_step),
      sessionVersion: Number(row.session_version),
      failedLoginAttempts: Number(row.failed_login_attempts),
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapSession(row: any): SessionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      createdAt: new Date(row.created_at),
      lastActiveAt: new Date(row.last_active_at),
      expiresAt: new Date(row.expires_at),
      isRevoked: row.is_revoked,
      sessionVersion: Number(row.session_version),
    };
  }

  private mapOAuth(row: any): OAuthAccountRecord {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider as OAuthProvider,
      providerUserId: row.provider_user_id,
      email: row.email,
      createdAt: new Date(row.created_at),
    };
  }

  private mapToken(row: any): VerificationTokenRecord {
    return {
      id: row.id,
      tokenHash: row.token_hash,
      userId: row.user_id,
      email: row.email,
      purpose: row.purpose as TokenPurpose,
      metadata: row.metadata ? (typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata) : null,
      expiresAt: new Date(row.expires_at),
      isUsed: row.is_used,
      createdAt: new Date(row.created_at),
    };
  }
}
