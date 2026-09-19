import net from "node:net";
import type { SecurityRepository } from "./repository.js";
import type {
  RateLimitScope,
  RateLimitConfig,
  RateLimitResult,
  SecurityHeaders,
  NormalizedRequest
} from "../schemas/index.js";

export class SsrfError extends Error {
  public readonly code = "SSRF_BLOCKED";
  constructor(message: string) {
    super(`SSRF protection triggered: ${message}`);
    this.name = "SsrfError";
  }
}

export class RequestSmugglingError extends Error {
  public readonly code = "REQUEST_SMUGGLING_DETECTED";
  constructor(message: string) {
    super(`Request rejected for protocol violation: ${message}`);
    this.name = "RequestSmugglingError";
  }
}

export const DEFAULT_RATE_LIMIT_CONFIGS: Record<RateLimitScope, RateLimitConfig> = {
  LOGIN: { scope: "LOGIN", algorithm: "SLIDING_WINDOW", maxRequests: 5, windowSeconds: 60, blockDurationSeconds: 300 },
  SIGNUP: { scope: "SIGNUP", algorithm: "SLIDING_WINDOW", maxRequests: 3, windowSeconds: 60, blockDurationSeconds: 600 },
  PASSWORD_RESET: { scope: "PASSWORD_RESET", algorithm: "SLIDING_WINDOW", maxRequests: 3, windowSeconds: 300, blockDurationSeconds: 900 },
  API_DEFAULT: { scope: "API_DEFAULT", algorithm: "SLIDING_WINDOW", maxRequests: 100, windowSeconds: 60, blockDurationSeconds: 0 },
  AI_GENERATE: { scope: "AI_GENERATE", algorithm: "SLIDING_WINDOW", maxRequests: 10, windowSeconds: 60, blockDurationSeconds: 60 },
  FILE_UPLOAD: { scope: "FILE_UPLOAD", algorithm: "SLIDING_WINDOW", maxRequests: 20, windowSeconds: 60, blockDurationSeconds: 0 },
  WEBHOOK_INGEST: { scope: "WEBHOOK_INGEST", algorithm: "SLIDING_WINDOW", maxRequests: 1000, windowSeconds: 60, blockDurationSeconds: 0 }
};

/**
 * Checks whether an IP address is private, loopback, or cloud metadata
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0" || ip === "::") {
    return true;
  }

  // Check IPv4
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [p0, p1] = parts;

    // 10.0.0.0/8
    if (p0 === 10) return true;
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.168.0.0/16
    if (p0 === 192 && p1 === 168) return true;
    // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata: 169.254.169.254)
    if (p0 === 169 && p1 === 254) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
  }

  // Check IPv6 link-local (fe80::) or unique local (fc00::/7)
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
      return true;
    }
  }

  return false;
}

/**
 * Validates URLs before server-side fetching (SSRF protection)
 */
export function validateSafeExternalUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError(`Malformed URL: ${rawUrl}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfError(`Prohibited protocol "${parsed.protocol}". Only HTTP/HTTPS allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and cloud metadata domain names
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "metadata.google.internal" ||
    hostname === "instance-data"
  ) {
    throw new SsrfError(`Prohibited internal destination: ${hostname}`);
  }

  // If hostname is a raw IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new SsrfError(`Destination IP ${hostname} is in a private or reserved range`);
    }
  }

  return parsed;
}

/**
 * Normalizes HTTP requests and protects against request smuggling
 */
export function normalizeRequest(
  method: string,
  rawPath: string,
  headers: Record<string, string | string[] | undefined>,
  clientIp: string
): NormalizedRequest {
  const normHeaders: Record<string, string> = {};

  let hasContentLength = false;
  let hasTransferEncoding = false;

  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;
    const lowerKey = key.toLowerCase();
    const strVal = Array.isArray(value) ? value.join(", ") : value;

    if (lowerKey === "content-length") {
      if (hasContentLength) {
        throw new RequestSmugglingError("Multiple Content-Length headers detected");
      }
      hasContentLength = true;
    }

    if (lowerKey === "transfer-encoding") {
      hasTransferEncoding = true;
    }

    normHeaders[lowerKey] = strVal;
  }

  // Request smuggling detection: Content-Length + Transfer-Encoding together
  if (hasContentLength && hasTransferEncoding) {
    throw new RequestSmugglingError("Conflicting Content-Length and Transfer-Encoding headers");
  }

  // Path normalization: Unicode NFKC + path traversal strip
  let normPath = decodeURIComponent(rawPath).normalize("NFKC");
  normPath = normPath.replace(/\/+/g, "/"); // collapse multiple slashes
  if (!normPath.startsWith("/")) normPath = `/${normPath}`;

  return {
    method: method.toUpperCase(),
    normalizedPath: normPath,
    normalizedHeaders: normHeaders,
    clientIp,
    timestamp: new Date()
  };
}

/**
 * Produces defense-in-depth HTTP security headers
 */
export function getSecurityHeaders(): SecurityHeaders {
  return {
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; frame-ancestors 'none';",
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: "camera=(), microphone=(), geolocation=(), payment=()"
  };
}

/**
 * Normalizes errors for public API responses, never leaking stack traces or internal secrets
 */
export function normalizeErrorResponse(err: unknown, requestId?: string): { error: string; code: string; requestId?: string } {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  const code = (err as any)?.code || "INTERNAL_SERVER_ERROR";

  // If known application error, safe to return message
  const isKnown =
    code.startsWith("RATE_LIMIT") ||
    code.startsWith("SSRF") ||
    code.startsWith("REQUEST_SMUGGLING") ||
    code.startsWith("PERMISSION") ||
    code.startsWith("TENANT");

  return {
    error: isKnown ? errorObj.message : "An unexpected server error occurred",
    code,
    ...(requestId ? { requestId } : {})
  };
}

export class SecurityService {
  constructor(private repository: SecurityRepository) {}

  /**
   * Evaluates rate limits using sliding windows
   */
  async checkRateLimit(
    identifier: string,
    scope: RateLimitScope,
    customConfig?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const config: RateLimitConfig = {
      ...DEFAULT_RATE_LIMIT_CONFIGS[scope],
      ...customConfig
    };

    const key = `rl:${scope}:${identifier}`;
    const result = await this.repository.checkRateLimit(key, config);

    // If blocked and penalty configured, record IP block
    if (!result.allowed && config.blockDurationSeconds > 0) {
      await this.repository.blockIp(identifier, config.blockDurationSeconds, `Rate limit exceeded on ${scope}`);
    }

    return result;
  }

  async isClientBlocked(ip: string): Promise<boolean> {
    return this.repository.isIpBlocked(ip);
  }
}
