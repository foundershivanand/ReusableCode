import {
  SecurityFinding,
  SecurityEvent,
  SecurityPostureScore,
} from "../schemas/security-schemas.js";

export interface SecurityCenterRepository {
  getFindings(options?: { state?: string; severity?: string; includeSuppressed?: boolean }): Promise<SecurityFinding[]>;
  getFindingById(id: string): Promise<SecurityFinding | null>;
  getFindingByFingerprint(fingerprint: string): Promise<SecurityFinding | null>;
  saveFinding(finding: SecurityFinding): Promise<void>;
  recordEvent(event: SecurityEvent): Promise<void>;
  getRecentEvents(options?: { actorId?: string; eventType?: string; limit?: number }): Promise<SecurityEvent[]>;
  savePostureScore(score: SecurityPostureScore): Promise<void>;
  getPostureHistory(limit?: number): Promise<SecurityPostureScore[]>;
}

export class InMemorySecurityCenterRepository implements SecurityCenterRepository {
  private findings = new Map<string, SecurityFinding>();
  private events: SecurityEvent[] = [];
  private postureHistory: SecurityPostureScore[] = [];

  async getFindings(options?: {
    state?: string;
    severity?: string;
    includeSuppressed?: boolean;
  }): Promise<SecurityFinding[]> {
    return Array.from(this.findings.values())
      .filter((f) => {
        if (!options?.includeSuppressed && f.suppressed) return false;
        if (options?.state && f.state !== options.state) return false;
        if (options?.severity && f.severity !== options.severity) return false;
        return true;
      })
      .sort((a, b) => new Date(b.lastDetectedAt).getTime() - new Date(a.lastDetectedAt).getTime());
  }

  async getFindingById(id: string): Promise<SecurityFinding | null> {
    const f = this.findings.get(id);
    return f ? { ...f } : null;
  }

  async getFindingByFingerprint(fingerprint: string): Promise<SecurityFinding | null> {
    for (const f of this.findings.values()) {
      if (f.fingerprint === fingerprint) return { ...f };
    }
    return null;
  }

  async saveFinding(finding: SecurityFinding): Promise<void> {
    this.findings.set(finding.id, { ...finding });
  }

  async recordEvent(event: SecurityEvent): Promise<void> {
    this.events.push({ ...event });
  }

  async getRecentEvents(options?: {
    actorId?: string;
    eventType?: string;
    limit?: number;
  }): Promise<SecurityEvent[]> {
    return this.events
      .filter((e) => {
        if (options?.actorId && e.actorId !== options.actorId) return false;
        if (options?.eventType && e.eventType !== options.eventType) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, options?.limit || 50)
      .map((e) => ({ ...e }));
  }

  async savePostureScore(score: SecurityPostureScore): Promise<void> {
    this.postureHistory.push({ ...score });
  }

  async getPostureHistory(limit: number = 30): Promise<SecurityPostureScore[]> {
    return this.postureHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }
}
