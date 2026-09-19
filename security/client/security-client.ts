import type { RateLimitResult, SecurityHeaders } from "../schemas/index.js";

export interface SecurityClientOptions {
  baseUrl?: string;
}

export class SecurityClient {
  private baseUrl: string;

  constructor(options: SecurityClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/security";
  }

  async getSecurityHeaders(): Promise<SecurityHeaders> {
    const res = await fetch(`${this.baseUrl}/headers`);
    if (!res.ok) throw new Error("Failed to fetch security headers");
    return res.json();
  }

  async checkRateLimit(scope: string): Promise<RateLimitResult> {
    const res = await fetch(`${this.baseUrl}/rate-limit?scope=${scope}`);
    if (!res.ok) throw new Error("Failed to check rate limit");
    return res.json();
  }
}
