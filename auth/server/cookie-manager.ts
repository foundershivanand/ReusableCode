export interface CookieOptions {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  domain?: string;
  maxAgeSeconds?: number;
  expires?: Date;
}

export interface CookieConfig {
  sessionCookieName: string;
  csrfCookieName: string;
  isProduction: boolean;
  domain?: string;
  path: string;
  sameSite: "lax" | "strict" | "none";
  maxAgeSeconds: number; // e.g. 14 days
}

export const DEFAULT_COOKIE_CONFIG: CookieConfig = {
  sessionCookieName: "__Host-auth_session",
  csrfCookieName: "__Host-csrf_token",
  isProduction: process.env.NODE_ENV === "production",
  path: "/",
  sameSite: "lax",
  maxAgeSeconds: 14 * 24 * 60 * 60, // 14 days
};

export class CookieManager {
  private config: CookieConfig;

  constructor(config: Partial<CookieConfig> = {}) {
    this.config = { ...DEFAULT_COOKIE_CONFIG, ...config };
    // __Host- prefix requires Secure and Path=/ with NO Domain attribute
    if (this.config.sessionCookieName.startsWith("__Host-")) {
      this.config.path = "/";
      this.config.domain = undefined;
    }
  }

  /**
   * Serializes a cookie to a Set-Cookie header value
   */
  serializeCookie(options: CookieOptions): string {
    const parts: string[] = [`${encodeURIComponent(options.name)}=${encodeURIComponent(options.value)}`];

    if (options.maxAgeSeconds !== undefined) {
      parts.push(`Max-Age=${Math.floor(options.maxAgeSeconds)}`);
    } else if (options.expires) {
      parts.push(`Expires=${options.expires.toUTCString()}`);
    }

    if (options.domain) {
      parts.push(`Domain=${options.domain}`);
    }

    if (options.path) {
      parts.push(`Path=${options.path}`);
    }

    if (options.httpOnly) {
      parts.push("HttpOnly");
    }

    if (options.secure) {
      parts.push("Secure");
    }

    if (options.sameSite) {
      parts.push(`SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`);
    }

    return parts.join("; ");
  }

  /**
   * Creates the Set-Cookie header for setting the session token
   */
  createSessionCookie(rawToken: string): string {
    return this.serializeCookie({
      name: this.config.sessionCookieName,
      value: rawToken,
      httpOnly: true,
      secure: this.config.isProduction || this.config.sessionCookieName.startsWith("__Host-"),
      sameSite: this.config.sameSite,
      path: this.config.path,
      domain: this.config.domain,
      maxAgeSeconds: this.config.maxAgeSeconds,
    });
  }

  /**
   * Creates the Set-Cookie header for clearing the session cookie on logout
   */
  createClearSessionCookie(): string {
    return this.serializeCookie({
      name: this.config.sessionCookieName,
      value: "",
      httpOnly: true,
      secure: this.config.isProduction || this.config.sessionCookieName.startsWith("__Host-"),
      sameSite: this.config.sameSite,
      path: this.config.path,
      domain: this.config.domain,
      maxAgeSeconds: 0,
      expires: new Date(0),
    });
  }

  /**
   * Parses cookies from the Cookie header string
   */
  parseCookies(cookieHeader?: string | null): Record<string, string> {
    if (!cookieHeader) return {};
    const cookies: Record<string, string> = {};

    const pairs = cookieHeader.split(";");
    for (const pair of pairs) {
      const idx = pair.indexOf("=");
      if (idx !== -1) {
        const key = decodeURIComponent(pair.substring(0, idx).trim());
        const val = decodeURIComponent(pair.substring(idx + 1).trim());
        cookies[key] = val;
      }
    }

    return cookies;
  }

  /**
   * Extracts the session token from the incoming Cookie header
   */
  getSessionToken(cookieHeader?: string | null): string | null {
    const cookies = this.parseCookies(cookieHeader);
    return cookies[this.config.sessionCookieName] || null;
  }
}
