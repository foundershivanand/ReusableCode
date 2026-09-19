import { createHmac } from "node:crypto";
import {
  ServerEnvConfig,
  ServerEnvConfigSchema,
  SanitizedConfigItem,
  ConfigDriftFinding,
  DeploymentGateReport,
  DeploymentGateStatus,
  AppEnvironment,
} from "../schemas/deployment-schemas.js";
import { DeploymentRepository } from "./repository.js";

const SECRET_KEYWORDS = ["SECRET", "PASSWORD", "KEY", "TOKEN", "DATABASE_URL", "REDIS_URL"];

export class DeploymentService {
  constructor(private repository: DeploymentRepository) {}

  validateStartupConfig(env: Record<string, string | undefined>): ServerEnvConfig {
    const result = ServerEnvConfigSchema.safeParse(env);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`Startup configuration validation failed: ${issues}`);
    }
    return result.data;
  }

  getSanitizedConfig(env: Record<string, string | undefined>): SanitizedConfigItem[] {
    const items: SanitizedConfigItem[] = [];

    for (const [key, value] of Object.entries(env)) {
      const isSecret = SECRET_KEYWORDS.some((kw) => key.toUpperCase().includes(kw));
      let maskedValue = "";

      if (!value) {
        maskedValue = "[NOT_SET]";
      } else if (isSecret) {
        maskedValue = value.length > 8 ? `${value.substring(0, 3)}***${value.substring(value.length - 3)}` : "********";
      } else {
        maskedValue = value;
      }

      items.push({
        key,
        isSecret,
        maskedValue,
        source: "ENV",
      });
    }

    return items.sort((a, b) => a.key.localeCompare(b.key));
  }

  detectConfigDrift(env: Record<string, string | undefined>): ConfigDriftFinding[] {
    const findings: ConfigDriftFinding[] = [];
    const expectedKeys: Array<{ key: string; required: boolean; type: string }> = [
      { key: "NODE_ENV", required: true, type: "enum(development|test|production)" },
      { key: "PORT", required: true, type: "number" },
      { key: "DATABASE_URL", required: true, type: "url" },
      { key: "APP_SECRET", required: true, type: "string(>=32)" },
      { key: "PREVIOUS_APP_SECRET", required: false, type: "string(>=32)" },
      { key: "REDIS_URL", required: false, type: "url" },
      { key: "LOG_LEVEL", required: false, type: "enum(debug|info|warn|error)" },
    ];

    for (const exp of expectedKeys) {
      const val = env[exp.key];
      if (!val) {
        if (exp.required) {
          findings.push({
            key: exp.key,
            expectedType: exp.type,
            actualStatus: "MISSING",
            severity: "CRITICAL",
            message: `Required environment variable ${exp.key} is missing`,
          });
        }
      } else {
        // Simple type check
        if (exp.type === "number" && isNaN(Number(val))) {
          findings.push({
            key: exp.key,
            expectedType: exp.type,
            actualStatus: "INVALID_FORMAT",
            severity: "CRITICAL",
            message: `${exp.key} must be a number, received: ${val}`,
          });
        } else if (exp.type === "url" && !val.includes("://")) {
          findings.push({
            key: exp.key,
            expectedType: exp.type,
            actualStatus: "INVALID_FORMAT",
            severity: "CRITICAL",
            message: `${exp.key} must be a valid URL`,
          });
        } else if (exp.key === "APP_SECRET" && val.length < 32) {
          findings.push({
            key: exp.key,
            expectedType: exp.type,
            actualStatus: "INVALID_FORMAT",
            severity: "CRITICAL",
            message: `${exp.key} length must be >= 32 characters for cryptographic security`,
          });
        }
      }
    }

    return findings;
  }

  verifySecretRotation(params: {
    tokenSignature: string;
    payload: string;
    currentSecret: string;
    previousSecret?: string;
  }): { valid: boolean; usedSecret: "CURRENT" | "PREVIOUS" | "NONE" } {
    const sign = (secret: string) =>
      createHmac("sha256", secret).update(params.payload).digest("hex");

    // 1. Try current secret
    const currentSig = sign(params.currentSecret);
    if (currentSig === params.tokenSignature) {
      return { valid: true, usedSecret: "CURRENT" };
    }

    // 2. Try previous secret if present (graceful rotation window)
    if (params.previousSecret) {
      const prevSig = sign(params.previousSecret);
      if (prevSig === params.tokenSignature) {
        return { valid: true, usedSecret: "PREVIOUS" };
      }
    }

    return { valid: false, usedSecret: "NONE" };
  }

  evaluateDeploymentGates(report: {
    deploymentId: string;
    version: string;
    commitSha: string;
    environment: AppEnvironment;
    gates: {
      tests: DeploymentGateStatus;
      typecheck: DeploymentGateStatus;
      build: DeploymentGateStatus;
      migrationCheck: DeploymentGateStatus;
      securityCheck: DeploymentGateStatus;
      approval: DeploymentGateStatus;
    };
  }): DeploymentGateReport {
    const requiredStatuses: DeploymentGateStatus[] = ["PASSED", "BYPASSED"];
    const allPassed =
      requiredStatuses.includes(report.gates.tests) &&
      requiredStatuses.includes(report.gates.typecheck) &&
      requiredStatuses.includes(report.gates.build) &&
      requiredStatuses.includes(report.gates.migrationCheck) &&
      requiredStatuses.includes(report.gates.securityCheck) &&
      requiredStatuses.includes(report.gates.approval);

    return {
      ...report,
      canDeploy: allPassed,
    };
  }

  verifyExpandContractMigration(params: {
    oldAppActiveFields: string[];
    droppedColumns: string[];
  }): { safe: boolean; dangerousColumns: string[] } {
    const dangerous = params.droppedColumns.filter((col) =>
      params.oldAppActiveFields.includes(col)
    );

    return {
      safe: dangerous.length === 0,
      dangerousColumns: dangerous,
    };
  }
}
