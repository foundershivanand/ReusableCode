export interface SecurityHeadersConfig {
  csp?: string;
  hstsMaxAge?: number;
  includeSubDomains?: boolean;
  preload?: boolean;
  frameGuard?: "DENY" | "SAMEORIGIN";
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  csp: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  hstsMaxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true,
  frameGuard: "DENY",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: "camera=(), microphone=(), geolocation=(), payment=()",
};

export class SecurityHeadersMiddleware {
  private headers: Record<string, string>;

  constructor(config: Partial<SecurityHeadersConfig> = {}) {
    const finalConfig = { ...DEFAULT_SECURITY_HEADERS, ...config };

    let hstsValue = `max-age=${finalConfig.hstsMaxAge}`;
    if (finalConfig.includeSubDomains) hstsValue += "; includeSubDomains";
    if (finalConfig.preload) hstsValue += "; preload";

    this.headers = {
      "Content-Security-Policy": finalConfig.csp || "",
      "Strict-Transport-Security": hstsValue,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": finalConfig.frameGuard || "DENY",
      "Referrer-Policy": finalConfig.referrerPolicy || "strict-origin-when-cross-origin",
      "Permissions-Policy": finalConfig.permissionsPolicy || "",
      "X-XSS-Protection": "0", // Modern browsers disable this in favor of CSP
    };
  }

  /**
   * Applies production security headers to a headers dictionary
   */
  applyHeaders(existingHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...existingHeaders,
      ...this.headers,
    };
  }

  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }
}
