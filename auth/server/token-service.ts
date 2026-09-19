import crypto from "node:crypto";
import {
  AuthRepository,
  TokenPurpose,
  VerificationTokenRecord,
} from "./repository.js";

export interface TokenConfig {
  passwordResetExpiryMs: number; // e.g. 15 minutes
  magicLinkExpiryMs: number; // e.g. 10 minutes
  emailVerificationExpiryMs: number; // e.g. 24 hours
  emailChangeExpiryMs: number; // e.g. 1 hour
}

export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  passwordResetExpiryMs: 15 * 60 * 1000,
  magicLinkExpiryMs: 10 * 60 * 1000,
  emailVerificationExpiryMs: 24 * 60 * 60 * 1000,
  emailChangeExpiryMs: 60 * 60 * 1000,
};

export class TokenService {
  private repo: AuthRepository;
  private config: TokenConfig;

  constructor(repo: AuthRepository, config: Partial<TokenConfig> = {}) {
    this.repo = repo;
    this.config = { ...DEFAULT_TOKEN_CONFIG, ...config };
  }

  hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  private generateRawToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private getExpiryMs(purpose: TokenPurpose): number {
    switch (purpose) {
      case "password_reset":
        return this.config.passwordResetExpiryMs;
      case "magic_link":
        return this.config.magicLinkExpiryMs;
      case "email_verification":
        return this.config.emailVerificationExpiryMs;
      case "email_change":
        return this.config.emailChangeExpiryMs;
    }
  }

  /**
   * Creates a single-use hashed verification token.
   * If userId is provided, revokes any previous unused tokens for the same purpose.
   */
  async createToken(
    email: string,
    purpose: TokenPurpose,
    userId?: string | null,
    metadata?: Record<string, any>
  ): Promise<{ rawToken: string; record: VerificationTokenRecord }> {
    if (userId) {
      // Invalidate existing pending tokens for this purpose
      await this.repo.revokeTokensForUser(userId, purpose);
    }

    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.getExpiryMs(purpose));

    const record = await this.repo.createVerificationToken({
      email: email.toLowerCase(),
      purpose,
      tokenHash,
      userId: userId || null,
      metadata: metadata || null,
      expiresAt,
      isUsed: false,
    });

    return { rawToken, record };
  }

  /**
   * Verifies and atomically consumes a single-use token.
   * Rejects: expired, already-used, wrong purpose, or non-existent tokens.
   */
  async verifyAndConsumeToken(
    rawToken: string,
    expectedPurpose: TokenPurpose
  ): Promise<VerificationTokenRecord | null> {
    if (!rawToken || typeof rawToken !== "string") {
      return null;
    }

    const tokenHash = this.hashToken(rawToken);
    const record = await this.repo.findVerificationTokenByHash(tokenHash);

    if (!record) {
      return null;
    }

    // 1. Single-use check (reject reuse)
    if (record.isUsed) {
      return null;
    }

    // 2. Purpose binding check
    if (record.purpose !== expectedPurpose) {
      return null;
    }

    // 3. Expiration check
    if (record.expiresAt.getTime() <= Date.now()) {
      await this.repo.markTokenUsed(record.id);
      return null;
    }

    // Atomically mark as consumed
    await this.repo.markTokenUsed(record.id);

    return { ...record, isUsed: true };
  }
}
