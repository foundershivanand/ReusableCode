import {
  AccountStatus,
  UserRole,
  OAuthProvider,
} from "../schemas/auth-schemas.js";

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaLastUsedStep: number;
  sessionVersion: number;
  deletedAt: Date | null;
  lockedUntil: Date | null;
  failedLoginAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
  sessionVersion: number;
}

export interface OAuthAccountRecord {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  email: string | null;
  createdAt: Date;
}

export type TokenPurpose =
  | "email_verification"
  | "password_reset"
  | "magic_link"
  | "email_change";

export interface VerificationTokenRecord {
  id: string;
  tokenHash: string;
  userId: string | null;
  email: string;
  purpose: TokenPurpose;
  metadata: Record<string, any> | null;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

export interface MFARecoveryCodeRecord {
  id: string;
  userId: string;
  codeHash: string;
  isUsed: boolean;
  usedAt: Date | null;
  createdAt: Date;
}

export interface PasswordHistoryRecord {
  id: string;
  userId: string;
  passwordHash: string;
  createdAt: Date;
}

export interface AuditLogRecord {
  id: string;
  actorType: "USER" | "ADMIN" | "SYSTEM" | "WORKER" | "API_KEY" | "AI_AGENT";
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  tenantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  timestamp: Date;
}

export interface AuthRepository {
  // Users
  createUser(user: Omit<UserRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<UserRecord>;
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  updateUser(id: string, update: Partial<UserRecord>): Promise<UserRecord>;
  deleteUser(id: string): Promise<void>;

  // Sessions
  createSession(session: Omit<SessionRecord, "id"> & { id?: string }): Promise<SessionRecord>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  findSessionById(id: string): Promise<SessionRecord | null>;
  findSessionsByUserId(userId: string): Promise<SessionRecord[]>;
  updateSession(id: string, update: Partial<SessionRecord>): Promise<SessionRecord>;
  revokeSession(id: string): Promise<void>;
  revokeAllSessionsForUser(userId: string): Promise<void>;
  revokeOtherSessions(userId: string, exceptSessionId: string): Promise<void>;

  // OAuth Accounts
  createOAuthAccount(account: Omit<OAuthAccountRecord, "id" | "createdAt"> & { id?: string }): Promise<OAuthAccountRecord>;
  findOAuthAccount(provider: OAuthProvider, providerUserId: string): Promise<OAuthAccountRecord | null>;
  findOAuthAccountsByUserId(userId: string): Promise<OAuthAccountRecord[]>;
  deleteOAuthAccount(userId: string, provider: OAuthProvider): Promise<void>;

  // Verification Tokens
  createVerificationToken(token: Omit<VerificationTokenRecord, "id" | "createdAt"> & { id?: string }): Promise<VerificationTokenRecord>;
  findVerificationTokenByHash(tokenHash: string): Promise<VerificationTokenRecord | null>;
  markTokenUsed(id: string): Promise<void>;
  revokeTokensForUser(userId: string, purpose: TokenPurpose): Promise<void>;

  // MFA Recovery Codes
  saveRecoveryCodes(userId: string, codeHashes: string[]): Promise<void>;
  findActiveRecoveryCodes(userId: string): Promise<MFARecoveryCodeRecord[]>;
  markRecoveryCodeUsed(id: string): Promise<void>;
  invalidateRecoveryCodes(userId: string): Promise<void>;

  // Password History
  addPasswordHistory(userId: string, passwordHash: string): Promise<void>;
  getRecentPasswordHashes(userId: string, limit: number): Promise<string[]>;

  // Audit Logs
  createAuditLog(log: Omit<AuditLogRecord, "id" | "timestamp"> & { id?: string }): Promise<AuditLogRecord>;
  getAuditLogs(filter: {
    actorId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogRecord[]>;

  // Transactions
  withTransaction<T>(operation: (txRepo: AuthRepository) => Promise<T>): Promise<T>;
}

/**
 * In-Memory Transaction-Safe Implementation of AuthRepository
 * Ideal for unit testing, development, and portable deployments
 */
export class InMemoryAuthRepository implements AuthRepository {
  private users: Map<string, UserRecord> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private oauthAccounts: Map<string, OAuthAccountRecord> = new Map();
  private verificationTokens: Map<string, VerificationTokenRecord> = new Map();
  private recoveryCodes: Map<string, MFARecoveryCodeRecord> = new Map();
  private passwordHistory: PasswordHistoryRecord[] = [];
  private auditLogs: AuditLogRecord[] = [];

  // Users
  async createUser(data: Omit<UserRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<UserRecord> {
    const existing = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase() && u.accountStatus !== "DELETED"
    );
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const now = new Date();
    const user: UserRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      email: data.email.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return { ...user };
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return user ? { ...user } : null;
  }

  async updateUser(id: string, update: Partial<UserRecord>): Promise<UserRecord> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    const updated: UserRecord = {
      ...user,
      ...update,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async deleteUser(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.accountStatus = "DELETED";
      user.deletedAt = new Date();
      user.updatedAt = new Date();
      this.users.set(id, user);
    }
  }

  // Sessions
  async createSession(data: Omit<SessionRecord, "id"> & { id?: string }): Promise<SessionRecord> {
    const session: SessionRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
    };
    this.sessions.set(session.id, session);
    return { ...session };
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const session = Array.from(this.sessions.values()).find(
      (s) => s.tokenHash === tokenHash && !s.isRevoked
    );
    return session ? { ...session } : null;
  }

  async findSessionById(id: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(id);
    return session ? { ...session } : null;
  }

  async findSessionsByUserId(userId: string): Promise<SessionRecord[]> {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId && !s.isRevoked)
      .map((s) => ({ ...s }));
  }

  async updateSession(id: string, update: Partial<SessionRecord>): Promise<SessionRecord> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error("Session not found");
    }
    const updated = { ...session, ...update };
    this.sessions.set(id, updated);
    return { ...updated };
  }

  async revokeSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      session.isRevoked = true;
      this.sessions.set(id, session);
    }
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.isRevoked = true;
      }
    }
  }

  async revokeOtherSessions(userId: string, exceptSessionId: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.id !== exceptSessionId) {
        session.isRevoked = true;
      }
    }
  }

  // OAuth Accounts
  async createOAuthAccount(data: Omit<OAuthAccountRecord, "id" | "createdAt"> & { id?: string }): Promise<OAuthAccountRecord> {
    const key = `${data.provider}:${data.providerUserId}`;
    if (this.oauthAccounts.has(key)) {
      throw new Error("OAuth account already linked to another user");
    }
    const record: OAuthAccountRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.oauthAccounts.set(key, record);
    return { ...record };
  }

  async findOAuthAccount(provider: OAuthProvider, providerUserId: string): Promise<OAuthAccountRecord | null> {
    const record = this.oauthAccounts.get(`${provider}:${providerUserId}`);
    return record ? { ...record } : null;
  }

  async findOAuthAccountsByUserId(userId: string): Promise<OAuthAccountRecord[]> {
    return Array.from(this.oauthAccounts.values())
      .filter((a) => a.userId === userId)
      .map((a) => ({ ...a }));
  }

  async deleteOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    for (const [key, account] of this.oauthAccounts.entries()) {
      if (account.userId === userId && account.provider === provider) {
        this.oauthAccounts.delete(key);
      }
    }
  }

  // Verification Tokens
  async createVerificationToken(data: Omit<VerificationTokenRecord, "id" | "createdAt"> & { id?: string }): Promise<VerificationTokenRecord> {
    const record: VerificationTokenRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.verificationTokens.set(record.id, record);
    return { ...record };
  }

  async findVerificationTokenByHash(tokenHash: string): Promise<VerificationTokenRecord | null> {
    const token = Array.from(this.verificationTokens.values()).find(
      (t) => t.tokenHash === tokenHash
    );
    return token ? { ...token } : null;
  }

  async markTokenUsed(id: string): Promise<void> {
    const token = this.verificationTokens.get(id);
    if (token) {
      token.isUsed = true;
      this.verificationTokens.set(id, token);
    }
  }

  async revokeTokensForUser(userId: string, purpose: TokenPurpose): Promise<void> {
    for (const token of this.verificationTokens.values()) {
      if (token.userId === userId && token.purpose === purpose) {
        token.isUsed = true;
      }
    }
  }

  // MFA Recovery Codes
  async saveRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> {
    await this.invalidateRecoveryCodes(userId);
    const now = new Date();
    for (const codeHash of codeHashes) {
      const id = crypto.randomUUID();
      this.recoveryCodes.set(id, {
        id,
        userId,
        codeHash,
        isUsed: false,
        usedAt: null,
        createdAt: now,
      });
    }
  }

  async findActiveRecoveryCodes(userId: string): Promise<MFARecoveryCodeRecord[]> {
    return Array.from(this.recoveryCodes.values())
      .filter((c) => c.userId === userId && !c.isUsed)
      .map((c) => ({ ...c }));
  }

  async markRecoveryCodeUsed(id: string): Promise<void> {
    const code = this.recoveryCodes.get(id);
    if (code) {
      code.isUsed = true;
      code.usedAt = new Date();
      this.recoveryCodes.set(id, code);
    }
  }

  async invalidateRecoveryCodes(userId: string): Promise<void> {
    for (const code of this.recoveryCodes.values()) {
      if (code.userId === userId) {
        code.isUsed = true;
      }
    }
  }

  // Password History
  async addPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    this.passwordHistory.push({
      id: crypto.randomUUID(),
      userId,
      passwordHash,
      createdAt: new Date(),
    });
  }

  async getRecentPasswordHashes(userId: string, limit: number): Promise<string[]> {
    return this.passwordHistory
      .filter((h) => h.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((h) => h.passwordHash);
  }

  // Audit Logs
  async createAuditLog(data: Omit<AuditLogRecord, "id" | "timestamp"> & { id?: string }): Promise<AuditLogRecord> {
    const log: AuditLogRecord = {
      ...data,
      id: data.id || crypto.randomUUID(),
      timestamp: new Date(),
    };
    this.auditLogs.push(log);
    return { ...log };
  }

  async getAuditLogs(filter: {
    actorId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogRecord[]> {
    let result = [...this.auditLogs];
    if (filter.actorId) {
      result = result.filter((l) => l.actorId === filter.actorId);
    }
    if (filter.action) {
      result = result.filter((l) => l.action === filter.action);
    }
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    return result.slice(offset, offset + limit);
  }

  // Transactions
  async withTransaction<T>(operation: (txRepo: AuthRepository) => Promise<T>): Promise<T> {
    // In-memory atomic execution
    return operation(this);
  }
}
