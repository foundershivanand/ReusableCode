import crypto from "node:crypto";
import { AuthRepository, SessionRecord, UserRecord } from "./repository.js";

export interface SessionConfig {
  inactivityTimeoutMs: number; // e.g. 30 minutes
  absoluteLifetimeMs: number; // e.g. 14 days
  slidingExpiration: boolean;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  inactivityTimeoutMs: 30 * 60 * 1000, // 30 minutes
  absoluteLifetimeMs: 14 * 24 * 60 * 60 * 1000, // 14 days
  slidingExpiration: true,
};

export interface ActiveSessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export class SessionService {
  private repo: AuthRepository;
  private config: SessionConfig;

  constructor(repo: AuthRepository, config: Partial<SessionConfig> = {}) {
    this.repo = repo;
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  /**
   * Hashes raw session token with SHA-256
   */
  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generates a secure random 256-bit session token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Creates a new session for an authenticated user
   */
  async createSession(
    user: UserRecord,
    metadata: { userAgent?: string | null; ipAddress?: string | null } = {}
  ): Promise<{ session: SessionRecord; rawToken: string }> {
    const rawToken = this.generateToken();
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.absoluteLifetimeMs);

    const session = await this.repo.createSession({
      userId: user.id,
      tokenHash,
      userAgent: metadata.userAgent || null,
      ipAddress: metadata.ipAddress || null,
      createdAt: now,
      lastActiveAt: now,
      expiresAt,
      isRevoked: false,
      sessionVersion: user.sessionVersion,
    });

    return { session, rawToken };
  }

  /**
   * Validates a session token, enforcing:
   * - Revocation check
   * - Absolute expiration
   * - Inactivity timeout (sliding)
   * - User session version match (global invalidation)
   * - Account status check
   */
  async validateSession(
    rawToken: string
  ): Promise<{ session: SessionRecord; user: UserRecord } | null> {
    if (!rawToken || typeof rawToken !== "string") {
      return null;
    }

    const tokenHash = this.hashToken(rawToken);
    const session = await this.repo.findSessionByTokenHash(tokenHash);
    if (!session || session.isRevoked) {
      return null;
    }

    const now = new Date();

    // 1. Absolute lifetime check
    if (session.expiresAt.getTime() <= now.getTime()) {
      await this.repo.revokeSession(session.id);
      return null;
    }

    // 2. Inactivity timeout check
    const inactiveDuration = now.getTime() - session.lastActiveAt.getTime();
    if (inactiveDuration > this.config.inactivityTimeoutMs) {
      await this.repo.revokeSession(session.id);
      return null;
    }

    // 3. User verification
    const user = await this.repo.findUserById(session.userId);
    if (!user) {
      await this.repo.revokeSession(session.id);
      return null;
    }

    // 4. Global session version check
    if (session.sessionVersion < user.sessionVersion) {
      await this.repo.revokeSession(session.id);
      return null;
    }

    // 5. Account status check
    if (
      user.accountStatus === "DELETED" ||
      user.accountStatus === "SUSPENDED" ||
      user.accountStatus === "DEACTIVATED" ||
      (user.lockedUntil && user.lockedUntil.getTime() > now.getTime())
    ) {
      return null;
    }

    // 6. Update activity timestamp & sliding expiration
    const updates: Partial<SessionRecord> = { lastActiveAt: now };
    if (this.config.slidingExpiration) {
      const remainingLifetime = session.expiresAt.getTime() - now.getTime();
      // If within half of absolute lifetime, can extend slightly up to absolute max
      if (remainingLifetime > 0) {
        updates.lastActiveAt = now;
      }
    }
    const updatedSession = await this.repo.updateSession(session.id, updates);

    return { session: updatedSession, user };
  }

  /**
   * Session rotation to prevent session fixation attacks
   */
  async rotateSession(
    currentSessionId: string,
    metadata: { userAgent?: string | null; ipAddress?: string | null } = {}
  ): Promise<{ session: SessionRecord; rawToken: string }> {
    const currentSession = await this.repo.findSessionById(currentSessionId);
    if (!currentSession || currentSession.isRevoked) {
      throw new Error("Cannot rotate invalid session");
    }

    const user = await this.repo.findUserById(currentSession.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Revoke old session
    await this.repo.revokeSession(currentSessionId);

    // Create new rotated session
    return this.createSession(user, {
      userAgent: metadata.userAgent || currentSession.userAgent,
      ipAddress: metadata.ipAddress || currentSession.ipAddress,
    });
  }

  /**
   * Revoke specific session (logout)
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.repo.revokeSession(sessionId);
  }

  /**
   * Revoke all sessions for a user (logout all devices / security event)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.repo.revokeAllSessionsForUser(userId);
    // Increment session version on user record for complete global invalidation
    const user = await this.repo.findUserById(userId);
    if (user) {
      await this.repo.updateUser(userId, {
        sessionVersion: user.sessionVersion + 1,
      });
    }
  }

  /**
   * Revoke all other sessions (keep current active session)
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.repo.revokeOtherSessions(userId, currentSessionId);
  }

  /**
   * List active sessions for user
   */
  async getUserSessions(
    userId: string,
    currentSessionId?: string
  ): Promise<ActiveSessionInfo[]> {
    const sessions = await this.repo.findSessionsByUserId(userId);
    const now = new Date();

    return sessions
      .filter((s) => !s.isRevoked && s.expiresAt.getTime() > now.getTime())
      .map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === currentSessionId,
      }));
  }
}
