import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  InMemoryDeploymentRepository,
  DeploymentService,
} from "../server/index.js";

describe("Module 27: Environment & Deployment Management", () => {
  let repo: InMemoryDeploymentRepository;
  let service: DeploymentService;

  beforeEach(() => {
    repo = new InMemoryDeploymentRepository();
    service = new DeploymentService(repo);
  });

  it("should validate startup configuration strictly and fail fast on invalid env", () => {
    // 1. Valid config
    const valid = service.validateStartupConfig({
      NODE_ENV: "production",
      PORT: "3000",
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      APP_SECRET: "this-is-a-very-long-secure-random-app-secret-32-chars",
      LOG_LEVEL: "info",
    });
    expect(valid.PORT).toBe(3000);
    expect(valid.NODE_ENV).toBe("production");

    // 2. Secret too short (< 32 chars)
    expect(() =>
      service.validateStartupConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgres://localhost:5432/db",
        APP_SECRET: "short-secret",
      })
    ).toThrow("at least 32 characters");

    // 3. Invalid URL
    expect(() =>
      service.validateStartupConfig({
        NODE_ENV: "production",
        DATABASE_URL: "not-a-url",
        APP_SECRET: "this-is-a-very-long-secure-random-app-secret-32-chars",
      })
    ).toThrow(/invalid url/i);
  });

  it("should mask secrets and never expose raw sensitive credentials", () => {
    const rawEnv = {
      NODE_ENV: "production",
      PORT: "3000",
      DATABASE_URL: "postgres://admin:super_secret_pw@db.internal:5432/prod",
      APP_SECRET: "super_secret_jwt_signing_key_32_characters_long",
      PUBLIC_APP_NAME: "My Great SaaS",
    };

    const sanitized = service.getSanitizedConfig(rawEnv);

    const secretItem = sanitized.find((i) => i.key === "APP_SECRET");
    expect(secretItem?.isSecret).toBe(true);
    expect(secretItem?.maskedValue).not.toBe(rawEnv.APP_SECRET);
    expect(secretItem?.maskedValue).toContain("***");

    const dbItem = sanitized.find((i) => i.key === "DATABASE_URL");
    expect(dbItem?.isSecret).toBe(true);
    expect(dbItem?.maskedValue).not.toContain("super_secret_pw");

    const publicItem = sanitized.find((i) => i.key === "PUBLIC_APP_NAME");
    expect(publicItem?.isSecret).toBe(false);
    expect(publicItem?.maskedValue).toBe("My Great SaaS");
  });

  it("should detect configuration drift and missing critical variables", () => {
    const driftEnv = {
      NODE_ENV: "production",
      // PORT missing
      // DATABASE_URL missing
      APP_SECRET: "short", // Invalid format (< 32)
    };

    const findings = service.detectConfigDrift(driftEnv);
    expect(findings.some((f) => f.key === "DATABASE_URL" && f.actualStatus === "MISSING")).toBe(true);
    expect(findings.some((f) => f.key === "APP_SECRET" && f.actualStatus === "INVALID_FORMAT")).toBe(true);
  });

  it("should support zero-downtime dual-secret rotation", () => {
    const previousSecret = "old-secret-key-1234567890123456789012";
    const currentSecret = "new-secret-key-abcdefghijklmnopqrstuv";
    const payload = JSON.stringify({ userId: "usr_123", role: "admin" });

    // Token signed with previous secret
    const prevTokenSig = createHmac("sha256", previousSecret).update(payload).digest("hex");

    // 1. Verify token signed with previous secret during rotation grace period
    const res1 = service.verifySecretRotation({
      tokenSignature: prevTokenSig,
      payload,
      currentSecret,
      previousSecret,
    });
    expect(res1.valid).toBe(true);
    expect(res1.usedSecret).toBe("PREVIOUS");

    // 2. Verify token signed with current secret
    const currentTokenSig = createHmac("sha256", currentSecret).update(payload).digest("hex");
    const res2 = service.verifySecretRotation({
      tokenSignature: currentTokenSig,
      payload,
      currentSecret,
      previousSecret,
    });
    expect(res2.valid).toBe(true);
    expect(res2.usedSecret).toBe("CURRENT");

    // 3. Verify token signed with unknown secret
    const badTokenSig = createHmac("sha256", "bad-secret-999999999999999999999999").update(payload).digest("hex");
    const res3 = service.verifySecretRotation({
      tokenSignature: badTokenSig,
      payload,
      currentSecret,
      previousSecret,
    });
    expect(res3.valid).toBe(false);
    expect(res3.usedSecret).toBe("NONE");
  });

  it("should evaluate ordered deployment gates", () => {
    const passedReport = service.evaluateDeploymentGates({
      deploymentId: "dep-1",
      version: "2.1.0",
      commitSha: "a1b2c3d4e5f6",
      environment: "production",
      gates: {
        tests: "PASSED",
        typecheck: "PASSED",
        build: "PASSED",
        migrationCheck: "PASSED",
        securityCheck: "PASSED",
        approval: "PASSED",
      },
    });
    expect(passedReport.canDeploy).toBe(true);

    const failedReport = service.evaluateDeploymentGates({
      deploymentId: "dep-2",
      version: "2.1.1",
      commitSha: "b2c3d4e5f6a1",
      environment: "production",
      gates: {
        tests: "PASSED",
        typecheck: "PASSED",
        build: "PASSED",
        migrationCheck: "FAILED", // Migration check failed
        securityCheck: "PASSED",
        approval: "PENDING",
      },
    });
    expect(failedReport.canDeploy).toBe(false);
  });

  it("should verify expand/contract migration safety against running application code", () => {
    // Old running application still references 'legacy_username'
    const oldAppActiveFields = ["id", "legacy_username", "email", "created_at"];

    // Migration attempts to drop 'legacy_username'
    const result1 = service.verifyExpandContractMigration({
      oldAppActiveFields,
      droppedColumns: ["legacy_username"],
    });
    expect(result1.safe).toBe(false);
    expect(result1.dangerousColumns).toContain("legacy_username");

    // Safe migration: dropping an already-abandoned column 'unused_temp_col'
    const result2 = service.verifyExpandContractMigration({
      oldAppActiveFields,
      droppedColumns: ["unused_temp_col"],
    });
    expect(result2.safe).toBe(true);
    expect(result2.dangerousColumns).toHaveLength(0);
  });
});
