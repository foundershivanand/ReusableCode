import crypto from "node:crypto";
import {
  LoginInput,
  PasswordChangeInput,
  PasswordResetInput,
  PublicUser,
  PublicUserSchema,
  SignupInput,
  UserRole,
} from "../schemas/auth-schemas.js";
import { AuditLogger } from "./audit-logger.js";
import { MFAService } from "./mfa-service.js";
import { PasswordService } from "./password-service.js";
import { RateLimiter } from "./rate-limiter.js";
import {
  AuthRepository,
  SessionRecord,
  UserRecord,
} from "./repository.js";
import { SessionService } from "./session-service.js";
import { TokenService } from "./token-service.js";

export interface AuthServiceConfig {
  maxFailedLoginsBeforeLock: number;
  lockoutDurationMs: number;
  preventAccountEnumeration: boolean;
  passwordHistoryLimit: number;
  appUrl: string;
}

export const DEFAULT_AUTH_SERVICE_CONFIG: AuthServiceConfig = {
  maxFailedLoginsBeforeLock: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  preventAccountEnumeration: true,
  passwordHistoryLimit: 5,
  appUrl: "http://localhost:3000",
};

export class AuthService {
  private repo: AuthRepository;
  private passwordService: PasswordService;
  private sessionService: SessionService;
  private tokenService: TokenService;
  private mfaService: MFAService;
  private rateLimiter: RateLimiter;
  private auditLogger: AuditLogger;
  private config: AuthServiceConfig;

  // Short-lived MFA pending session store: token -> { userId, rememberMe }
  private mfaPendingSessions: Map<
    string,
    { userId: string; rememberMe: boolean; expiresAt: number; attempts: number }
  > = new Map();

  constructor(
    repo: AuthRepository,
    deps?: {
      passwordService?: PasswordService;
      sessionService?: SessionService;
      tokenService?: TokenService;
      mfaService?: MFAService;
      rateLimiter?: RateLimiter;
      auditLogger?: AuditLogger;
      config?: Partial<AuthServiceConfig>;
    }
  ) {
    this.repo = repo;
    this.passwordService = deps?.passwordService || new PasswordService();
    this.sessionService = deps?.sessionService || new SessionService(repo);
    this.tokenService = deps?.tokenService || new TokenService(repo);
    this.mfaService = deps?.mfaService || new MFAService();
    this.rateLimiter = deps?.rateLimiter || new RateLimiter();
    this.auditLogger = deps?.auditLogger || new AuditLogger(repo);
    this.config = { ...DEFAULT_AUTH_SERVICE_CONFIG, ...deps?.config };
  }

  /**
   * Sanitizes UserRecord into safe PublicUser representation.
   * Strips all password hashes, MFA secrets, tokens, and internal fields.
   */
  sanitizeUser(user: UserRecord): PublicUser {
    return PublicUserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * 1. SIGNUP
   */
  async signup(
    input: SignupInput,
    metadata: { ip?: string; userAgent?: string } = {}
  ): Promise<{ user: PublicUser; verificationToken?: string }> {
    // 1. Rate limiting
    if (metadata.ip) {
      const rateCheck = await this.rateLimiter.checkRateLimit("signup", metadata.ip);
      if (!rateCheck.allowed) {
        throw new Error(`Too many signup attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`);
      }
    }

    const email = input.email.toLowerCase().trim();

    // 2. Check password breach detection
    const isBreached = await this.passwordService.isPasswordBreached(input.password);
    if (isBreached) {
      throw new Error("This password has been exposed in a data breach. Please choose a different password.");
    }

    // 3. Check existing user
    const existingUser = await this.repo.findUserByEmail(email);
    if (existingUser) {
      if (this.config.preventAccountEnumeration) {
        // Uniform message to prevent account enumeration
        return {
          user: this.sanitizeUser(existingUser),
        };
      }
      throw new Error("An account with this email address already exists.");
    }

    // 4. Hash password
    const passwordHash = await this.passwordService.hashPassword(input.password);

    // 5. Create user in PENDING_VERIFICATION state
    const newUser = await this.repo.createUser({
      email,
      name: input.name || null,
      passwordHash,
      role: "USER",
      accountStatus: "PENDING_VERIFICATION",
      isEmailVerified: false,
      mfaEnabled: false,
      mfaSecret: null,
      mfaLastUsedStep: 0,
      sessionVersion: 1,
      deletedAt: null,
      lockedUntil: null,
      failedLoginAttempts: 0,
    });

    // 6. Record initial password in password history
    await this.repo.addPasswordHistory(newUser.id, passwordHash);

    // 7. Create verification token
    const { rawToken } = await this.tokenService.createToken(
      email,
      "email_verification",
      newUser.id
    );

    // 8. Audit log
    await this.auditLogger.log({
      actorType: "USER",
      actorId: newUser.id,
      action: "USER_SIGNUP",
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      metadata: { email },
    });

    return {
      user: this.sanitizeUser(newUser),
      verificationToken: rawToken,
    };
  }

  /**
   * 2. LOGIN
   */
  async login(
    input: LoginInput,
    metadata: { ip?: string; userAgent?: string } = {}
  ): Promise<
    | { requiresMFA: false; session: SessionRecord; rawToken: string; user: PublicUser }
    | { requiresMFA: true; mfaSessionToken: string }
  > {
    const email = input.email.toLowerCase().trim();
    const ip = metadata.ip || "127.0.0.1";

    // 1. Dual-layer rate limiting (IP + Account email)
    const rateCheck = await this.rateLimiter.checkDualRateLimit("login", ip, email);
    if (!rateCheck.allowed) {
      throw new Error(`Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`);
    }

    const user = await this.repo.findUserByEmail(email);

    // If user does not exist: run constant-time dummy verification
    if (!user) {
      await this.passwordService.dummyVerification();
      throw new Error("Invalid email or password.");
    }

    // 2. Account state checks
    const now = new Date();
    if (user.accountStatus === "DELETED") {
      await this.passwordService.dummyVerification();
      throw new Error("Invalid email or password.");
    }

    if (user.accountStatus === "SUSPENDED" || user.accountStatus === "DEACTIVATED") {
      throw new Error("This account is currently disabled. Please contact support.");
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      throw new Error(`Account temporarily locked due to excessive failed attempts. Try again in ${waitMinutes} minutes.`);
    }

    // If OAuth-only user with no password set
    if (!user.passwordHash) {
      await this.passwordService.dummyVerification();
      throw new Error("Invalid email or password. If you signed up using OAuth, please sign in with that provider.");
    }

    // 3. Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates: Partial<UserRecord> = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= this.config.maxFailedLoginsBeforeLock) {
        updates.lockedUntil = new Date(now.getTime() + this.config.lockoutDurationMs);
        updates.accountStatus = "LOCKED";
      }

      await this.repo.updateUser(user.id, updates);

      await this.auditLogger.log({
        actorType: "USER",
        actorId: user.id,
        action: "LOGIN_FAILED",
        ipAddress: metadata.ip,
        userAgent: metadata.userAgent,
        metadata: { reason: "invalid_password", failedAttempts },
      });

      throw new Error("Invalid email or password.");
    }

    // 4. Password was valid! Reset failed login attempts and unlock
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.repo.updateUser(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        accountStatus: user.accountStatus === "LOCKED" ? "ACTIVE" : user.accountStatus,
      });
    }

    // Reset rate limiter for this account
    await this.rateLimiter.resetRateLimit("login:account", email);

    // 5. Transparent Rehashing: check if hash parameters need upgrade
    if (this.passwordService.needsRehash(user.passwordHash)) {
      const upgradedHash = await this.passwordService.hashPassword(input.password);
      await this.repo.updateUser(user.id, { passwordHash: upgradedHash });
      await this.repo.addPasswordHistory(user.id, upgradedHash);
    }

    // 6. Handle MFA if enabled
    if (user.mfaEnabled) {
      // If code was provided inline in login request
      if (input.mfaCode) {
        await this.verifyMFACodeForUser(user, input.mfaCode);
      } else {
        // Generate temporary MFA session token (5 minutes TTL)
        const mfaSessionToken = crypto.randomBytes(32).toString("hex");
        this.mfaPendingSessions.set(mfaSessionToken, {
          userId: user.id,
          rememberMe: Boolean(input.rememberMe),
          expiresAt: Date.now() + 5 * 60 * 1000,
          attempts: 0,
        });

        return {
          requiresMFA: true,
          mfaSessionToken,
        };
      }
    }

    // 7. Create fresh session (prevents session fixation)
    const { session, rawToken } = await this.sessionService.createSession(user, {
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
    });

    await this.auditLogger.log({
      actorType: "USER",
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      metadata: { sessionId: session.id },
    });

    return {
      requiresMFA: false,
      session,
      rawToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Helper to verify TOTP or Recovery Code for MFA
   */
  private async verifyMFACodeForUser(user: UserRecord, code: string): Promise<void> {
    const trimmed = code.trim();

    // Check if 6-digit TOTP
    if (/^[0-9]{6}$/.test(trimmed)) {
      if (!user.mfaSecret) {
        throw new Error("MFA is not configured for this user");
      }
      const verifyResult = this.mfaService.verifyTOTP(
        user.mfaSecret,
        trimmed,
        user.mfaLastUsedStep
      );
      if (!verifyResult.valid || verifyResult.step === undefined) {
        throw new Error("Invalid or expired MFA code");
      }

      // Replay prevention: update last used step
      await this.repo.updateUser(user.id, { mfaLastUsedStep: verifyResult.step });
      return;
    }

    // Otherwise check recovery code
    const activeRecoveryCodes = await this.repo.findActiveRecoveryCodes(user.id);
    const hashes = activeRecoveryCodes.map((c) => c.codeHash);
    const recoveryResult = this.mfaService.verifyRecoveryCode(trimmed, hashes);

    if (!recoveryResult.valid || !recoveryResult.matchingHash) {
      throw new Error("Invalid MFA code or recovery code");
    }

    // Consume the recovery code (one-time use)
    const matchingRecord = activeRecoveryCodes.find((c) => c.codeHash === recoveryResult.matchingHash);
    if (matchingRecord) {
      await this.repo.markRecoveryCodeUsed(matchingRecord.id);
    }
  }

  /**
   * 2b. COMPLETE MFA CHALLENGE
   */
  async completeMFAChallenge(
    mfaSessionToken: string,
    code: string,
    metadata: { ip?: string; userAgent?: string } = {}
  ): Promise<{ session: SessionRecord; rawToken: string; user: PublicUser }> {
    const pending = this.mfaPendingSessions.get(mfaSessionToken);
    if (!pending || Date.now() > pending.expiresAt) {
      this.mfaPendingSessions.delete(mfaSessionToken);
      throw new Error("MFA session expired or invalid. Please log in again.");
    }

    // Rate limit MFA challenge attempts (max 5)
    pending.attempts += 1;
    if (pending.attempts > 5) {
      this.mfaPendingSessions.delete(mfaSessionToken);
      throw new Error("Too many failed MFA attempts. Please log in again.");
    }

    const user = await this.repo.findUserById(pending.userId);
    if (!user) {
      this.mfaPendingSessions.delete(mfaSessionToken);
      throw new Error("User not found");
    }

    await this.verifyMFACodeForUser(user, code);

    // MFA succeeded: consume pending token
    this.mfaPendingSessions.delete(mfaSessionToken);

    // Create session
    const { session, rawToken } = await this.sessionService.createSession(user, {
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
    });

    await this.auditLogger.log({
      actorType: "USER",
      actorId: user.id,
      action: "MFA_CHALLENGE_SUCCESS",
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      metadata: { sessionId: session.id },
    });

    return {
      session,
      rawToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * 3. LOGOUT
   */
  async logout(sessionId: string, userId: string): Promise<void> {
    await this.sessionService.revokeSession(sessionId);
    await this.auditLogger.log({
      actorType: "USER",
      actorId: userId,
      action: "LOGOUT",
      metadata: { sessionId },
    });
  }

  /**
   * 4. LOGOUT ALL DEVICES (Global Invalidation)
   */
  async logoutAllDevices(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);
    await this.auditLogger.log({
      actorType: "USER",
      actorId: userId,
      action: "LOGOUT_ALL_DEVICES",
    });
  }

  /**
   * 5. EMAIL VERIFICATION
   */
  async verifyEmail(token: string): Promise<{ user: PublicUser }> {
    const consumed = await this.tokenService.verifyAndConsumeToken(token, "email_verification");
    if (!consumed || !consumed.userId) {
      throw new Error("Invalid or expired email verification link.");
    }

    const user = await this.repo.findUserById(consumed.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await this.repo.updateUser(user.id, {
      isEmailVerified: true,
      accountStatus: user.accountStatus === "PENDING_VERIFICATION" ? "ACTIVE" : user.accountStatus,
    });

    await this.auditLogger.log({
      actorType: "USER",
      actorId: user.id,
      action: "EMAIL_VERIFIED",
    });

    return { user: this.sanitizeUser(updatedUser) };
  }

  /**
   * 6. MAGIC LINK REQUEST
   */
  async requestMagicLink(
    email: string,
    metadata: { ip?: string; userAgent?: string } = {}
  ): Promise<{ message: string; magicToken?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (metadata.ip) {
      const rateCheck = await this.rateLimiter.checkRateLimit("magic_link", metadata.ip);
      if (!rateCheck.allowed) {
        throw new Error(`Too many requests. Try again in ${rateCheck.retryAfterSeconds} seconds.`);
      }
    }

    const user = await this.repo.findUserByEmail(normalizedEmail);
    let rawToken: string | undefined;

    if (user && user.accountStatus !== "DELETED") {
      const created = await this.tokenService.createToken(
        normalizedEmail,
        "magic_link",
        user.id
      );
      rawToken = created.rawToken;

      await this.auditLogger.log({
        actorType: "USER",
        actorId: user.id,
        action: "MAGIC_LINK_REQUESTED",
        ipAddress: metadata.ip,
      });
    }

    return {
      message: "If an account with this email exists, a sign-in link has been sent.",
      magicToken: rawToken, // Provided in development / testing environments
    };
  }

  /**
   * 6b. VERIFY MAGIC LINK
   */
  async verifyMagicLink(
    rawToken: string,
    metadata: { ip?: string; userAgent?: string } = {}
  ): Promise<{ session: SessionRecord; rawToken: string; user: PublicUser }> {
    const consumed = await this.tokenService.verifyAndConsumeToken(rawToken, "magic_link");
    if (!consumed || !consumed.userId) {
      throw new Error("Invalid or expired magic link.");
    }

    const user = await this.repo.findUserById(consumed.userId);
    if (!user || user.accountStatus === "DELETED" || user.accountStatus === "SUSPENDED") {
      throw new Error("Unable to authenticate with this magic link.");
    }

    // Auto-verify email upon magic link login
    const updatedUser = await this.repo.updateUser(user.id, {
      isEmailVerified: true,
      accountStatus: user.accountStatus === "PENDING_VERIFICATION" ? "ACTIVE" : user.accountStatus,
    });

    const session = await this.sessionService.createSession(updatedUser, {
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
    });

    await this.auditLogger.log({
      actorType: "USER",
      actorId: user.id,
      action: "MAGIC_LINK_LOGIN",
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
    });

    return {
      session: session.session,
      rawToken: session.rawToken,
      user: this.sanitizeUser(updatedUser),
    };
  }

  /**
   * 7. PASSWORD RESET REQUEST
   */
  async requestPasswordReset(
    email: string,
    metadata: { ip?: string; userAgent?: string } = {}
  ): Promise<{ message: string; resetToken?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (metadata.ip) {
      const rateCheck = await this.rateLimiter.checkRateLimit("password_reset", metadata.ip);
      if (!rateCheck.allowed) {
        throw new Error(`Too many password reset requests. Try again in ${rateCheck.retryAfterSeconds} seconds.`);
      }
    }

    const user = await this.repo.findUserByEmail(normalizedEmail);
    let resetToken: string | undefined;

    if (user && user.accountStatus !== "DELETED") {
      const created = await this.tokenService.createToken(
        normalizedEmail,
        "password_reset",
        user.id
      );
      resetToken = created.rawToken;

      await this.auditLogger.log({
        actorType: "USER",
        actorId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        ipAddress: metadata.ip,
      });
    }

    // Account enumeration protection: always return the same generic message
    return {
      message: "If an account with this email exists, a password reset link has been sent.",
      resetToken,
    };
  }

  /**
   * 7b. EXECUTE PASSWORD RESET
   */
  async resetPassword(
    input: PasswordResetInput,
    metadata: { ip?: string; userAgent?: string } = {}
  ): Promise<void> {
    const consumed = await this.tokenService.verifyAndConsumeToken(input.token, "password_reset");
    if (!consumed || !consumed.userId) {
      throw new Error("Invalid or expired password reset token.");
    }

    const user = await this.repo.findUserById(consumed.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Check breach detection
    const isBreached = await this.passwordService.isPasswordBreached(input.newPassword);
    if (isBreached) {
      throw new Error("This password has been exposed in a data breach. Please choose a different password.");
    }

    // Check password reuse against history
    const recentHashes = await this.repo.getRecentPasswordHashes(user.id, this.config.passwordHistoryLimit);
    const isReused = await this.passwordService.isPasswordReused(input.newPassword, recentHashes);
    if (isReused) {
      throw new Error("You cannot reuse a recently used password.");
    }

    // Hash new password
    const newHash = await this.passwordService.hashPassword(input.newPassword);

    // Invalidate all existing sessions (Page 10: "Password reset invalidates appropriate existing sessions")
    await this.sessionService.revokeAllUserSessions(user.id);

    await this.repo.updateUser(user.id, {
      passwordHash: newHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      accountStatus: user.accountStatus === "LOCKED" ? "ACTIVE" : user.accountStatus,
      sessionVersion: user.sessionVersion + 1,
    });

    await this.repo.addPasswordHistory(user.id, newHash);

    await this.auditLogger.log({
      actorType: "USER",
      actorId: user.id,
      action: "PASSWORD_RESET_COMPLETED",
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
    });
  }

  /**
   * 8. PASSWORD CHANGE (Authenticated)
   */
  async changePassword(
    userId: string,
    currentSessionId: string,
    input: PasswordChangeInput
  ): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user || !user.passwordHash) {
      throw new Error("User not found or has no password set.");
    }

    // 1. Verify current password
    const isCurrentValid = await this.passwordService.verifyPassword(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new Error("Current password is incorrect.");
    }

    // 2. Check breach detection
    const isBreached = await this.passwordService.isPasswordBreached(input.newPassword);
    if (isBreached) {
      throw new Error("This password has been exposed in a data breach. Please choose a different password.");
    }

    // 3. Check password reuse
    const recentHashes = await this.repo.getRecentPasswordHashes(user.id, this.config.passwordHistoryLimit);
    const isReused = await this.passwordService.isPasswordReused(input.newPassword, recentHashes);
    if (isReused) {
      throw new Error("You cannot reuse a recently used password.");
    }

    const newHash = await this.passwordService.hashPassword(input.newPassword);

    // 4. Revoke other sessions (Page 11: "Rotate/revoke sessions after: password change")
    await this.sessionService.revokeAllOtherSessions(user.id, currentSessionId);

    await this.repo.updateUser(user.id, {
      passwordHash: newHash,
    });
    await this.repo.addPasswordHistory(user.id, newHash);

    await this.auditLogger.log({
      actorType: "USER",
      actorId: user.id,
      action: "PASSWORD_CHANGED",
    });
  }

  /**
   * 9. MFA SETUP & ENROLLMENT
   */
  setupMFA(user: UserRecord): {
    secret: string;
    otpauthUrl: string;
    recoveryCodes: string[];
  } {
    const setup = this.mfaService.generateSetup(user.email);
    // Return setup details to user for display (QR code / manual code entry)
    return {
      secret: setup.secret,
      otpauthUrl: setup.otpauthUrl,
      recoveryCodes: setup.recoveryCodes,
    };
  }

  /**
   * 9b. CONFIRM & ACTIVATE MFA (Enrollment confirmation before activation)
   */
  async confirmAndEnableMFA(
    userId: string,
    secret: string,
    code: string,
    currentSessionId: string,
    recoveryCodes?: string[]
  ): Promise<string[]> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify code against secret
    const verifyResult = this.mfaService.verifyTOTP(secret, code, 0);
    if (!verifyResult.valid || verifyResult.step === undefined) {
      throw new Error("Invalid verification code. MFA could not be activated.");
    }

    // Generate or use provided recovery codes
    const finalRecoveryCodes = recoveryCodes || this.mfaService.generateRecoveryCodes(10);
    const hashedCodes = finalRecoveryCodes.map((c) => this.mfaService.hashRecoveryCode(c));
    await this.repo.saveRecoveryCodes(userId, hashedCodes);

    // Activate MFA on user record
    await this.repo.updateUser(userId, {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaLastUsedStep: verifyResult.step,
    });

    // Invalidate other sessions after MFA changes (Page 12)
    await this.sessionService.revokeAllOtherSessions(userId, currentSessionId);

    await this.auditLogger.log({
      actorType: "USER",
      actorId: userId,
      action: "MFA_ENABLED",
    });

    return finalRecoveryCodes;
  }

  /**
   * 9c. DISABLE MFA (Requires stronger authentication with current password)
   */
  async disableMFA(
    userId: string,
    currentPassword: string,
    currentSessionId: string
  ): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user || !user.passwordHash) {
      throw new Error("User not found");
    }

    const isPasswordValid = await this.passwordService.verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Authentication failed. Current password is required to disable MFA.");
    }

    // Invalidate recovery codes and clear MFA secret
    await this.repo.invalidateRecoveryCodes(userId);
    await this.repo.updateUser(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaLastUsedStep: 0,
    });

    // Revoke other sessions after MFA removal
    await this.sessionService.revokeAllOtherSessions(userId, currentSessionId);

    await this.auditLogger.log({
      actorType: "USER",
      actorId: userId,
      action: "MFA_DISABLED",
    });
  }

  /**
   * 10. REGENERATE RECOVERY CODES
   */
  async regenerateRecoveryCodes(
    userId: string,
    currentPassword: string
  ): Promise<string[]> {
    const user = await this.repo.findUserById(userId);
    if (!user || !user.passwordHash || !user.mfaEnabled) {
      throw new Error("User not found or MFA is not enabled");
    }

    const isPasswordValid = await this.passwordService.verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Authentication failed. Current password is required to regenerate recovery codes.");
    }

    const newCodes = this.mfaService.generateRecoveryCodes(10);
    const hashes = newCodes.map((c) => this.mfaService.hashRecoveryCode(c));
    await this.repo.saveRecoveryCodes(userId, hashes);

    await this.auditLogger.log({
      actorType: "USER",
      actorId: userId,
      action: "MFA_RECOVERY_CODES_REGENERATED",
    });

    return newCodes;
  }

  /**
   * 11. EMAIL CHANGE
   */
  async requestEmailChange(
    userId: string,
    newEmail: string,
    currentPassword: string
  ): Promise<{ token: string }> {
    const user = await this.repo.findUserById(userId);
    if (!user || !user.passwordHash) {
      throw new Error("User not found");
    }

    // 1. Reauthenticate with current password
    const isPasswordValid = await this.passwordService.verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect.");
    }

    // 2. Check if new email is already taken
    const existing = await this.repo.findUserByEmail(newEmail);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    // 3. Create email change token
    const { rawToken } = await this.tokenService.createToken(
      newEmail,
      "email_change",
      user.id,
      { oldEmail: user.email, newEmail }
    );

    await this.auditLogger.log({
      actorType: "USER",
      actorId: userId,
      action: "EMAIL_CHANGE_REQUESTED",
      metadata: { newEmail },
    });

    return { token: rawToken };
  }

  /**
   * 11b. CONFIRM EMAIL CHANGE
   */
  async confirmEmailChange(
    token: string,
    currentSessionId: string
  ): Promise<{ user: PublicUser }> {
    const consumed = await this.tokenService.verifyAndConsumeToken(token, "email_change");
    if (!consumed || !consumed.userId || !consumed.metadata?.newEmail) {
      throw new Error("Invalid or expired email change token.");
    }

    const user = await this.repo.findUserById(consumed.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update identity atomically
    const updatedUser = await this.repo.updateUser(user.id, {
      email: consumed.metadata.newEmail,
      isEmailVerified: true,
    });

    // Revoke all other sessions after email change (Page 11)
    await this.sessionService.revokeAllOtherSessions(user.id, currentSessionId);

    await this.auditLogger.log({
      actorType: "USER",
      actorId: user.id,
      action: "EMAIL_CHANGED",
      metadata: { oldEmail: user.email, newEmail: consumed.metadata.newEmail },
    });

    return { user: this.sanitizeUser(updatedUser) };
  }

  /**
   * 12. ADMIN ROLE MANAGEMENT
   */
  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<PublicUser> {
    const adminUser = await this.repo.findUserById(adminUserId);
    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN")) {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    const targetUser = await this.repo.findUserById(targetUserId);
    if (!targetUser) {
      throw new Error("Target user not found.");
    }

    const updated = await this.repo.updateUser(targetUserId, {
      role: newRole,
      sessionVersion: targetUser.sessionVersion + 1, // Invalidate target user's existing sessions on privilege change
    });

    await this.auditLogger.log({
      actorType: "ADMIN",
      actorId: adminUserId,
      action: "USER_ROLE_UPDATED",
      targetType: "USER",
      targetId: targetUserId,
      metadata: { oldRole: targetUser.role, newRole },
    });

    return this.sanitizeUser(updated);
  }

  /**
   * Expose services for external usage / testing
   */
  getPasswordService(): PasswordService {
    return this.passwordService;
  }

  getSessionService(): SessionService {
    return this.sessionService;
  }

  getTokenService(): TokenService {
    return this.tokenService;
  }

  getMFAService(): MFAService {
    return this.mfaService;
  }

  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  getRepository(): AuthRepository {
    return this.repo;
  }
}
