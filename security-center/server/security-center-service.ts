import { randomUUID } from "node:crypto";
import {
  SecurityFinding,
  SecurityEvent,
  SecurityPostureScore,
  SuppressionInput,
  FindingLifecycleState,
  FindingSeverity,
  SecurityEventType,
} from "../schemas/security-schemas.js";
import { SecurityCenterRepository } from "./repository.js";

export class SecurityCenterService {
  constructor(private repository: SecurityCenterRepository) {}

  async runConfigurationChecks(config: {
    headers: Record<string, string>;
    cookies: Array<{ name: string; httpOnly?: boolean; secure?: boolean; sameSite?: string }>;
    cors: { origin: string; credentials?: boolean };
    env: { nodeEnv: string; debug?: boolean; secretLength: number };
  }): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // 1. Header Checks
    const hsts = config.headers["strict-transport-security"] || config.headers["Strict-Transport-Security"];
    if (!hsts || !hsts.includes("max-age=")) {
      findings.push(
        await this.recordOrUpdateFinding({
          fingerprint: "HEADERS:missing_hsts",
          title: "Missing or Inadequate HSTS Header",
          description: "Strict-Transport-Security header is missing or lacks adequate max-age directive.",
          severity: "HIGH",
          category: "HEADERS",
          remediationGuidance: "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' to all HTTPS responses.",
        })
      );
    }

    const csp = config.headers["content-security-policy"] || config.headers["Content-Security-Policy"];
    if (!csp) {
      findings.push(
        await this.recordOrUpdateFinding({
          fingerprint: "HEADERS:missing_csp",
          title: "Missing Content Security Policy (CSP)",
          description: "Content-Security-Policy header is missing, exposing the application to XSS and clickjacking.",
          severity: "HIGH",
          category: "HEADERS",
          remediationGuidance: "Define a strict Content-Security-Policy header restricting script and resource sources.",
        })
      );
    }

    const xcto = config.headers["x-content-type-options"] || config.headers["X-Content-Type-Options"];
    if (!xcto || xcto.toLowerCase() !== "nosniff") {
      findings.push(
        await this.recordOrUpdateFinding({
          fingerprint: "HEADERS:missing_nosniff",
          title: "Missing X-Content-Type-Options Header",
          description: "MIME sniffing protection is disabled, risking script execution from untrusted uploads.",
          severity: "MEDIUM",
          category: "HEADERS",
          remediationGuidance: "Add 'X-Content-Type-Options: nosniff' header to all responses.",
        })
      );
    }

    // 2. Cookie Checks
    for (const cookie of config.cookies) {
      if (!cookie.httpOnly) {
        findings.push(
          await this.recordOrUpdateFinding({
            fingerprint: `COOKIES:missing_httponly_${cookie.name}`,
            title: `Insecure Cookie: ${cookie.name} Missing HttpOnly`,
            description: `Cookie '${cookie.name}' is accessible via client-side JavaScript, increasing XSS session theft risk.`,
            severity: "HIGH",
            category: "COOKIES",
            remediationGuidance: "Set the HttpOnly flag on all session and authentication cookies.",
          })
        );
      }
      if (!cookie.secure) {
        findings.push(
          await this.recordOrUpdateFinding({
            fingerprint: `COOKIES:missing_secure_${cookie.name}`,
            title: `Insecure Cookie: ${cookie.name} Missing Secure Flag`,
            description: `Cookie '${cookie.name}' can be transmitted over unencrypted HTTP connections.`,
            severity: "HIGH",
            category: "COOKIES",
            remediationGuidance: "Set the Secure flag on all cookies in production.",
          })
        );
      }
    }

    // 3. Dangerous CORS Check
    if (config.cors.origin === "*" && config.cors.credentials) {
      findings.push(
        await this.recordOrUpdateFinding({
          fingerprint: "CORS:wildcard_with_credentials",
          title: "Dangerous CORS Configuration: Wildcard with Credentials",
          description: "Access-Control-Allow-Origin: * combined with Access-Control-Allow-Credentials: true violates browser security standards and allows cross-origin data theft.",
          severity: "CRITICAL",
          category: "CORS",
          remediationGuidance: "Explicitly validate and allow only trusted origin domains rather than wildcard '*'.",
        })
      );
    }

    // 4. Environment & Debug Check
    if (config.env.nodeEnv === "production" && config.env.debug) {
      findings.push(
        await this.recordOrUpdateFinding({
          fingerprint: "ENV:debug_in_production",
          title: "Debug Mode Enabled in Production",
          description: "Debug mode is active in a production environment, risking stack trace and internal state leakage.",
          severity: "CRITICAL",
          category: "ENV",
          remediationGuidance: "Disable DEBUG flags and set NODE_ENV=production in production deployments.",
        })
      );
    }

    if (config.env.secretLength < 32) {
      findings.push(
        await this.recordOrUpdateFinding({
          fingerprint: "ENV:weak_app_secret",
          title: "Cryptographically Weak Application Secret",
          description: "Application signing key length is below 32 characters, vulnerable to brute-force attacks.",
          severity: "CRITICAL",
          category: "ENV",
          remediationGuidance: "Generate an application secret with at least 32 high-entropy characters (256 bits).",
        })
      );
    }

    return findings;
  }

  async recordOrUpdateFinding(params: {
    fingerprint: string;
    title: string;
    description: string;
    severity: FindingSeverity;
    category: "HEADERS" | "COOKIES" | "CORS" | "AUTH" | "ENV" | "DEPENDENCIES";
    remediationGuidance: string;
  }): Promise<SecurityFinding> {
    const existing = await this.repository.getFindingByFingerprint(params.fingerprint);
    if (existing) {
      existing.lastDetectedAt = new Date().toISOString();
      if (existing.state === "CLOSED") {
        existing.state = "OPEN"; // Reopen if detected again
        existing.resolvedAt = null;
      }
      await this.repository.saveFinding(existing);
      return existing;
    }

    const finding: SecurityFinding = {
      id: randomUUID(),
      fingerprint: params.fingerprint,
      title: params.title,
      description: params.description,
      severity: params.severity,
      category: params.category,
      remediationGuidance: params.remediationGuidance,
      state: "OPEN",
      suppressed: false,
      suppressionReason: null,
      suppressionOwner: null,
      suppressionExpiresAt: null,
      approvedBy: null,
      firstDetectedAt: new Date().toISOString(),
      lastDetectedAt: new Date().toISOString(),
      resolvedAt: null,
    };

    await this.repository.saveFinding(finding);
    return finding;
  }

  async updateFindingState(findingId: string, newState: FindingLifecycleState): Promise<SecurityFinding> {
    const finding = await this.repository.getFindingById(findingId);
    if (!finding) {
      throw new Error(`Security finding ${findingId} not found`);
    }

    finding.state = newState;
    if (newState === "CLOSED" || newState === "MITIGATED") {
      finding.resolvedAt = new Date().toISOString();
    }
    await this.repository.saveFinding(finding);
    return finding;
  }

  async suppressFinding(input: SuppressionInput): Promise<SecurityFinding> {
    const finding = await this.repository.getFindingById(input.findingId);
    if (!finding) {
      throw new Error(`Security finding ${input.findingId} not found`);
    }

    const expiresAt = new Date(Date.now() + input.expirationDays * 86400000).toISOString();
    finding.suppressed = true;
    finding.suppressionReason = input.reason;
    finding.suppressionOwner = input.owner;
    finding.suppressionExpiresAt = expiresAt;
    finding.approvedBy = input.approvedBy;

    await this.repository.saveFinding(finding);
    return finding;
  }

  async recordSecurityEvent(params: {
    eventType: SecurityEventType;
    severity: FindingSeverity;
    actorId: string;
    ipAddress: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: randomUUID(),
      eventType: params.eventType,
      severity: params.severity,
      actorId: params.actorId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent || "Unknown",
      details: params.details || {},
      createdAt: new Date().toISOString(),
    };

    await this.repository.recordEvent(event);
    return event;
  }

  async handleSecretLeak(params: {
    secretType: string;
    location: string;
    detectedBy: string;
    ipAddress: string;
  }): Promise<{ finding: SecurityFinding; event: SecurityEvent }> {
    // 1. Record Security Event
    const event = await this.recordSecurityEvent({
      eventType: "SECRET_LEAK_DETECTED",
      severity: "CRITICAL",
      actorId: params.detectedBy,
      ipAddress: params.ipAddress,
      details: {
        secretType: params.secretType,
        location: params.location,
        actionRequired: "REVOKE_AND_ROTATE",
      },
    });

    // 2. Create / Update Critical Finding
    const finding = await this.recordOrUpdateFinding({
      fingerprint: `SECRET_LEAK:${params.secretType}:${params.location}`,
      title: `Secret Leak Detected: ${params.secretType}`,
      description: `A ${params.secretType} was detected in ${params.location}. It must be immediately revoked and rotated.`,
      severity: "CRITICAL",
      category: "ENV",
      remediationGuidance: "1. Immediately revoke the compromised secret; 2. Generate and deploy a new secret; 3. Audit access logs for unauthorized usage.",
    });

    return { finding, event };
  }

  async correlateIncidents(params: {
    actorId: string;
    ipAddress: string;
    windowMinutes?: number;
  }): Promise<{ isCorrelatedIncident: boolean; summary?: string }> {
    const window = params.windowMinutes || 15;
    const since = new Date(Date.now() - window * 60000);
    const events = await this.repository.getRecentEvents({
      actorId: params.actorId,
      limit: 50,
    });

    const recentEvents = events.filter((e) => new Date(e.createdAt) >= since);
    const failedLogins = recentEvents.filter((e) => e.eventType === "FAILED_LOGIN_SPIKE");
    const privilegedActions = recentEvents.filter((e) =>
      ["PRIVILEGED_LOGIN", "API_KEY_CREATED", "OWNER_CHANGED"].includes(e.eventType)
    );

    if (failedLogins.length > 0 && privilegedActions.length > 0) {
      return {
        isCorrelatedIncident: true,
        summary: `Suspicious activity correlation: ${failedLogins.length} failed login attempts followed by privileged actions (${privilegedActions.map((p) => p.eventType).join(", ")}) from IP ${params.ipAddress}`,
      };
    }

    return { isCorrelatedIncident: false };
  }

  async calculateAndSavePostureScore(mfaAdoptionPercent: number = 75): Promise<SecurityPostureScore> {
    const openFindings = await this.repository.getFindings({ state: "OPEN", includeSuppressed: false });

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const f of openFindings) {
      if (f.severity === "CRITICAL") criticalCount++;
      else if (f.severity === "HIGH") highCount++;
      else if (f.severity === "MEDIUM") mediumCount++;
      else if (f.severity === "LOW") lowCount++;
    }

    // Deduction score model
    let score = 100;
    score -= criticalCount * 25;
    score -= highCount * 10;
    score -= mediumCount * 5;
    score -= lowCount * 1;

    // MFA adoption bonus/penalty
    if (mfaAdoptionPercent < 50) score -= 10;
    else if (mfaAdoptionPercent >= 90) score += 5;

    score = Math.max(0, Math.min(100, score));

    let grade: "A" | "B" | "C" | "D" | "F" = "F";
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";

    const posture: SecurityPostureScore = {
      overallScore: score,
      grade,
      totalFindings: openFindings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      mfaAdoptionPercent,
      timestamp: new Date().toISOString(),
    };

    await this.repository.savePostureScore(posture);
    return posture;
  }
}
