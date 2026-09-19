import crypto from "node:crypto";
import { UserRole } from "../schemas/auth-schemas.js";

export interface JWTPayload {
  sub: string; // userId
  sessionId: string;
  role: UserRole;
  sessionVersion: number;
  iat: number;
  exp: number;
}

export interface JWTConfig {
  secret: string;
  accessTokenExpirySeconds: number; // e.g. 900 (15 minutes)
  refreshTokenExpirySeconds: number; // e.g. 1209600 (14 days)
  issuer: string;
  audience: string;
}

export const DEFAULT_JWT_CONFIG: JWTConfig = {
  secret: process.env.JWT_SECRET || "default-super-secret-key-at-least-32-chars!",
  accessTokenExpirySeconds: 15 * 60, // 15 minutes
  refreshTokenExpirySeconds: 14 * 24 * 60 * 60, // 14 days
  issuer: "reusable-auth-module",
  audience: "reusable-auth-app",
};

export class JWTService {
  private config: JWTConfig;

  constructor(config: Partial<JWTConfig> = {}) {
    this.config = { ...DEFAULT_JWT_CONFIG, ...config };
    if (this.config.secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters long for production security");
    }
  }

  private base64UrlEncode(str: string | Buffer): string {
    const buf = Buffer.isBuffer(str) ? str : Buffer.from(str, "utf8");
    return buf.toString("base64url");
  }

  private base64UrlDecode(str: string): string {
    return Buffer.from(str, "base64url").toString("utf8");
  }

  /**
   * Signs a JWT access token using HMAC-SHA256
   */
  signAccessToken(params: {
    userId: string;
    sessionId: string;
    role: UserRole;
    sessionVersion: number;
  }): string {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload: JWTPayload = {
      sub: params.userId,
      sessionId: params.sessionId,
      role: params.role,
      sessionVersion: params.sessionVersion,
      iat: now,
      exp: now + this.config.accessTokenExpirySeconds,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const message = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac("sha256", this.config.secret)
      .update(message)
      .digest();

    const encodedSignature = this.base64UrlEncode(signature);

    return `${message}.${encodedSignature}`;
  }

  /**
   * Verifies and decodes a JWT access token with constant-time signature comparison
   */
  verifyAccessToken(token: string): JWTPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const [encodedHeader, encodedPayload, encodedSignature] = parts;
      const message = `${encodedHeader}.${encodedPayload}`;

      // Recalculate signature
      const expectedSignature = crypto
        .createHmac("sha256", this.config.secret)
        .update(message)
        .digest();

      const providedSignature = Buffer.from(encodedSignature, "base64url");

      if (expectedSignature.length !== providedSignature.length) {
        return null;
      }

      // Timing-safe comparison to prevent timing attacks
      if (!crypto.timingSafeEqual(expectedSignature, providedSignature)) {
        return null;
      }

      const payload: JWTPayload = JSON.parse(this.base64UrlDecode(encodedPayload));
      const now = Math.floor(Date.now() / 1000);

      // Check expiration
      if (payload.exp <= now) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Generates a cryptographically random refresh token
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString("hex");
  }

  /**
   * Hashes a refresh token with SHA-256 for secure database storage
   */
  hashRefreshToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
