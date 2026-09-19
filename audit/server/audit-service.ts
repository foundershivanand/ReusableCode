import { randomUUID } from "node:crypto";
import type { IAuditRepository } from "./repository.js";
import {
  type CreateAuditLogInput,
  type AuditLogEntry,
  type AuditQueryFilter,
  CreateAuditLogInputSchema,
  AuditQueryFilterSchema
} from "../schemas/audit-schemas.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "creditcard",
  "credit_card",
  "cvv",
  "privatekey",
  "private_key",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token"
]);

export class AuditLogService {
  constructor(private readonly repository: IAuditRepository) {}

  async logActivity(input: CreateAuditLogInput): Promise<AuditLogEntry> {
    const validated = CreateAuditLogInputSchema.parse(input);

    // Scrub sensitive secrets from beforeState, afterState, and metadata
    const cleanBefore = validated.beforeState ? this.scrubSecrets(validated.beforeState) : undefined;
    const cleanAfter = validated.afterState ? this.scrubSecrets(validated.afterState) : undefined;
    const cleanMetadata = this.scrubSecrets(validated.metadata);

    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${randomUUID().substring(0, 8)}`,
      tenantId: validated.tenantId,
      actor: validated.actor,
      action: validated.action,
      target: validated.target,
      requestId: validated.requestId || randomUUID(),
      timestamp: new Date(),
      beforeState: cleanBefore,
      afterState: cleanAfter,
      metadata: cleanMetadata
    };

    return this.repository.append(entry);
  }

  async queryLogs(filter: AuditQueryFilter) {
    const validated = AuditQueryFilterSchema.parse(filter);
    return this.repository.query(validated);
  }

  async verifyIntegrity(tenantId: string) {
    return this.repository.verifyIntegrity(tenantId);
  }

  private scrubSecrets(obj: any): any {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.scrubSecrets(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("secret") || lowerKey.includes("password")) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof val === "object" && val !== null) {
        sanitized[key] = this.scrubSecrets(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }
}
