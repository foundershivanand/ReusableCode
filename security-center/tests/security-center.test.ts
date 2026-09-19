import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemorySecurityCenterRepository,
  SecurityCenterService,
} from "../server/index.js";

describe("Module 30: Security Center & Posture Management", () => {
  let repo: InMemorySecurityCenterRepository;
  let service: SecurityCenterService;

  beforeEach(() => {
    repo = new InMemorySecurityCenterRepository();
    service = new SecurityCenterService(repo);
  });

  it("should run automated configuration checks and flag missing headers, insecure cookies, dangerous CORS, and weak secrets", async () => {
    const findings = await service.runConfigurationChecks({
      headers: {}, // missing HSTS, CSP, nosniff
      cookies: [
        { name: "session_id", httpOnly: false, secure: false },
      ],
      cors: {
        origin: "*",
        credentials: true,
      },
      env: {
        nodeEnv: "production",
        debug: true,
        secretLength: 16,
      },
    });

    expect(findings.length).toBeGreaterThanOrEqual(7);

    const categories = findings.map((f) => f.category);
    expect(categories).toContain("HEADERS");
    expect(categories).toContain("COOKIES");
    expect(categories).toContain("CORS");
    expect(categories).toContain("ENV");

    const criticals = findings.filter((f) => f.severity === "CRITICAL");
    expect(criticals.length).toBeGreaterThanOrEqual(3); // CORS wildcard+creds, debug in prod, weak secret
  });

  it("should deduplicate findings by fingerprint on re-scan and update lastDetectedAt", async () => {
    const run1 = await service.runConfigurationChecks({
      headers: { "content-security-policy": "default-src 'self'" },
      cookies: [],
      cors: { origin: "https://example.com", credentials: true },
      env: { nodeEnv: "production", debug: false, secretLength: 64 },
    });

    const initialCount = (await repo.getFindings()).length;

    // Run again with same config
    const run2 = await service.runConfigurationChecks({
      headers: { "content-security-policy": "default-src 'self'" },
      cookies: [],
      cors: { origin: "https://example.com", credentials: true },
      env: { nodeEnv: "production", debug: false, secretLength: 64 },
    });

    const finalCount = (await repo.getFindings()).length;
    expect(finalCount).toBe(initialCount);

    const finding = await repo.getFindingByFingerprint("HEADERS:missing_hsts");
    expect(finding).toBeDefined();
    expect(finding?.lastDetectedAt).toBeDefined();
  });

  it("should handle finding lifecycle transitions and re-open resolved findings if re-detected", async () => {
    const finding = await service.recordOrUpdateFinding({
      fingerprint: "TEST:sample_finding",
      title: "Sample Finding",
      description: "Test description",
      severity: "HIGH",
      category: "AUTH",
      remediationGuidance: "Fix it",
    });

    expect(finding.state).toBe("OPEN");

    // Transition to IN_PROGRESS
    const inProgress = await service.updateFindingState(finding.id, "IN_PROGRESS");
    expect(inProgress.state).toBe("IN_PROGRESS");

    // Transition to CLOSED
    const closed = await service.updateFindingState(finding.id, "CLOSED");
    expect(closed.state).toBe("CLOSED");
    expect(closed.resolvedAt).not.toBeNull();

    // Re-detect via recordOrUpdateFinding
    const reDetected = await service.recordOrUpdateFinding({
      fingerprint: "TEST:sample_finding",
      title: "Sample Finding",
      description: "Test description",
      severity: "HIGH",
      category: "AUTH",
      remediationGuidance: "Fix it",
    });

    expect(reDetected.state).toBe("OPEN");
    expect(reDetected.resolvedAt).toBeNull();
  });

  it("should support false-positive suppression with reason and expiration", async () => {
    const finding = await service.recordOrUpdateFinding({
      fingerprint: "TEST:suppress_me",
      title: "Suppress Test",
      description: "Testing suppression",
      severity: "MEDIUM",
      category: "ENV",
      remediationGuidance: "Remediation",
    });

    const suppressed = await service.suppressFinding({
      findingId: finding.id,
      reason: "Verified as an internal non-routable endpoint",
      owner: "security-lead@company.internal",
      expirationDays: 30,
      approvedBy: "ciso@company.internal",
    });

    expect(suppressed.suppressed).toBe(true);
    expect(suppressed.suppressionReason).toBe("Verified as an internal non-routable endpoint");
    expect(suppressed.suppressionExpiresAt).not.toBeNull();

    // Repository should exclude suppressed findings when includeSuppressed is false
    const activeFindings = await repo.getFindings({ includeSuppressed: false });
    expect(activeFindings.some((f) => f.id === finding.id)).toBe(false);

    const allFindings = await repo.getFindings({ includeSuppressed: true });
    expect(allFindings.some((f) => f.id === finding.id)).toBe(true);
  });

  it("should handle secret leak detection workflow and event generation", async () => {
    const { finding, event } = await service.handleSecretLeak({
      secretType: "STRIPE_SECRET_KEY",
      location: "server/payments.ts:14",
      detectedBy: "automated_git_guardian",
      ipAddress: "10.0.0.1",
    });

    expect(finding.severity).toBe("CRITICAL");
    expect(finding.title).toContain("Secret Leak Detected: STRIPE_SECRET_KEY");
    expect(event.eventType).toBe("SECRET_LEAK_DETECTED");
    expect(event.severity).toBe("CRITICAL");
    expect(event.details.actionRequired).toBe("REVOKE_AND_ROTATE");
  });

  it("should correlate suspicious security incidents across failed logins and privileged actions", async () => {
    // 1. Record failed login spike
    await service.recordSecurityEvent({
      eventType: "FAILED_LOGIN_SPIKE",
      severity: "HIGH",
      actorId: "attacker_user_1",
      ipAddress: "198.51.100.23",
      details: { attempts: 20 },
    });

    // 2. Record subsequent privileged login
    await service.recordSecurityEvent({
      eventType: "PRIVILEGED_LOGIN",
      severity: "CRITICAL",
      actorId: "attacker_user_1",
      ipAddress: "198.51.100.23",
      details: { role: "ADMIN" },
    });

    const correlation = await service.correlateIncidents({
      actorId: "attacker_user_1",
      ipAddress: "198.51.100.23",
      windowMinutes: 30,
    });

    expect(correlation.isCorrelatedIncident).toBe(true);
    expect(correlation.summary).toContain("Suspicious activity correlation");
    expect(correlation.summary).toContain("failed login attempts followed by privileged actions");

    // Non-correlated actor
    const normalCorrelation = await service.correlateIncidents({
      actorId: "benign_user",
      ipAddress: "198.51.100.23",
    });
    expect(normalCorrelation.isCorrelatedIncident).toBe(false);
  });

  it("should calculate security posture score with deduction model and mfa weighting", async () => {
    // Add 1 CRITICAL (-25), 1 HIGH (-10), 1 MEDIUM (-5)
    await service.recordOrUpdateFinding({
      fingerprint: "CRIT:1",
      title: "Critical Issue",
      description: "Critical",
      severity: "CRITICAL",
      category: "CORS",
      remediationGuidance: "Fix immediately",
    });

    await service.recordOrUpdateFinding({
      fingerprint: "HIGH:1",
      title: "High Issue",
      description: "High",
      severity: "HIGH",
      category: "HEADERS",
      remediationGuidance: "Fix soon",
    });

    await service.recordOrUpdateFinding({
      fingerprint: "MED:1",
      title: "Medium Issue",
      description: "Medium",
      severity: "MEDIUM",
      category: "COOKIES",
      remediationGuidance: "Fix later",
    });

    // Score: 100 - 25 - 10 - 5 = 60. MFA >= 90 adds +5 -> 65. Grade: D
    const posture = await service.calculateAndSavePostureScore(95);

    expect(posture.criticalCount).toBe(1);
    expect(posture.highCount).toBe(1);
    expect(posture.mediumCount).toBe(1);
    expect(posture.overallScore).toBe(65);
    expect(posture.grade).toBe("D");

    const history = await repo.getPostureHistory();
    expect(history.length).toBe(1);
    expect(history[0].overallScore).toBe(65);
  });
});
