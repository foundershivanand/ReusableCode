import { createHash } from "node:crypto";
import type { AuditLogEntry, AuditQueryFilter } from "../schemas/audit-schemas.js";

export interface IAuditRepository {
  append(entry: AuditLogEntry): Promise<AuditLogEntry>;
  query(filter: AuditQueryFilter): Promise<{ entries: AuditLogEntry[]; nextCursor?: string }>;
  getLatestHash(tenantId: string): Promise<string | null>;
  verifyIntegrity(tenantId: string): Promise<{ valid: boolean; compromisedIndex?: number }>;
}

export class InMemoryAuditRepository implements IAuditRepository {
  // Append-only logs per tenant
  private tenantLogs: Map<string, AuditLogEntry[]> = new Map();

  async append(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const logs = this.tenantLogs.get(entry.tenantId) || [];
    const previousHash = logs.length > 0 ? logs[logs.length - 1].hash : "0000000000000000";

    const hashPayload = `${previousHash}:${entry.id}:${entry.tenantId}:${entry.actor.id}:${entry.action}:${entry.target.id}:${new Date(entry.timestamp).toISOString()}`;
    const hash = createHash("sha256").update(hashPayload).digest("hex");

    const sealedEntry: AuditLogEntry = {
      ...entry,
      hash,
      previousHash
    };

    logs.push(JSON.parse(JSON.stringify(sealedEntry)));
    this.tenantLogs.set(entry.tenantId, logs);

    return sealedEntry;
  }

  async getLatestHash(tenantId: string): Promise<string | null> {
    const logs = this.tenantLogs.get(tenantId) || [];
    return logs.length > 0 ? logs[logs.length - 1].hash || null : null;
  }

  async query(
    filter: AuditQueryFilter
  ): Promise<{ entries: AuditLogEntry[]; nextCursor?: string }> {
    let logs = this.tenantLogs.get(filter.tenantId) || [];

    if (filter.actorId) {
      logs = logs.filter((e) => e.actor.id === filter.actorId);
    }
    if (filter.actorType) {
      logs = logs.filter((e) => e.actor.type === filter.actorType);
    }
    if (filter.action) {
      logs = logs.filter((e) => e.action === filter.action);
    }
    if (filter.targetType) {
      logs = logs.filter((e) => e.target.type === filter.targetType);
    }
    if (filter.targetId) {
      logs = logs.filter((e) => e.target.id === filter.targetId);
    }
    if (filter.fromDate) {
      logs = logs.filter((e) => new Date(e.timestamp) >= new Date(filter.fromDate!));
    }
    if (filter.toDate) {
      logs = logs.filter((e) => new Date(e.timestamp) <= new Date(filter.toDate!));
    }

    // Newest first
    const sorted = [...logs].reverse();

    const startIndex = filter.cursor ? parseInt(filter.cursor, 10) : 0;
    const paginated = sorted.slice(startIndex, startIndex + filter.limit);
    const nextCursor =
      startIndex + filter.limit < sorted.length
        ? (startIndex + filter.limit).toString()
        : undefined;

    return {
      entries: paginated.map((e) => JSON.parse(JSON.stringify(e))),
      nextCursor
    };
  }

  async verifyIntegrity(
    tenantId: string
  ): Promise<{ valid: boolean; compromisedIndex?: number }> {
    const logs = this.tenantLogs.get(tenantId) || [];

    for (let i = 0; i < logs.length; i++) {
      const entry = logs[i];
      const expectedPrevHash =
        i === 0 ? "0000000000000000" : logs[i - 1].hash;

      if (entry.previousHash !== expectedPrevHash) {
        return { valid: false, compromisedIndex: i };
      }

      const hashPayload = `${entry.previousHash}:${entry.id}:${entry.tenantId}:${entry.actor.id}:${entry.action}:${entry.target.id}:${new Date(entry.timestamp).toISOString()}`;
      const computedHash = createHash("sha256").update(hashPayload).digest("hex");

      if (entry.hash !== computedHash) {
        return { valid: false, compromisedIndex: i };
      }
    }

    return { valid: true };
  }
}
