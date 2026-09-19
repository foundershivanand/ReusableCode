import { AuthRepository, AuditLogRecord } from "./repository.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordconfirm",
  "newpassword",
  "confirmpassword",
  "currentpassword",
  "token",
  "rawtoken",
  "tokenhash",
  "passwordhash",
  "secret",
  "mfasecret",
  "clientsecret",
  "code",
  "authorization",
  "cookie",
]);

export class AuditLogger {
  private repo: AuthRepository;

  constructor(repo: AuthRepository) {
    this.repo = repo;
  }

  /**
   * Deeply redacts sensitive keys from any metadata object
   */
  redact(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redact(item));
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        cleaned[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        cleaned[key] = this.redact(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Logs a security or audit event
   */
  async log(params: {
    actorType: "USER" | "ADMIN" | "SYSTEM" | "WORKER" | "API_KEY" | "AI_AGENT";
    actorId?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    tenantId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<AuditLogRecord> {
    const redactedMetadata = params.metadata ? this.redact(params.metadata) : null;

    return this.repo.createAuditLog({
      actorType: params.actorType,
      actorId: params.actorId || null,
      action: params.action,
      targetType: params.targetType || null,
      targetId: params.targetId || null,
      tenantId: params.tenantId || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      metadata: redactedMetadata,
    });
  }
}
