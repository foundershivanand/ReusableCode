import crypto from "node:crypto";

export interface CSRFConfig {
  cookieName: string;
  headerName: string;
  tokenLength: number;
}

export const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  cookieName: "__Host-csrf_token",
  headerName: "x-csrf-token",
  tokenLength: 32,
};

export class CSRFMiddleware {
  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
  }

  /**
   * Generates a cryptographically secure CSRF token
   */
  generateToken(): string {
    return crypto.randomBytes(this.config.tokenLength).toString("hex");
  }

  /**
   * Validates CSRF token using Double-Submit Cookie pattern with constant-time comparison
   */
  validateRequest(req: {
    method: string;
    headers: Record<string, string | string[] | undefined>;
    cookies?: Record<string, string>;
  }): boolean {
    const method = req.method.toUpperCase();

    // Safe methods bypass CSRF check
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      return true;
    }

    // Extract token from header
    const rawHeader = req.headers[this.config.headerName];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    // Extract token from cookies
    const cookieToken = req.cookies?.[this.config.cookieName];

    if (!headerToken || !cookieToken) {
      return false;
    }

    const headerBuf = Buffer.from(headerToken);
    const cookieBuf = Buffer.from(cookieToken);

    if (headerBuf.length !== cookieBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(headerBuf, cookieBuf);
  }
}
