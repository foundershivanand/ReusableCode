import { DeploymentMetadata } from "../schemas/deployment-schemas.js";

export interface DeploymentMetaProvider {
  getBuildMetadata(): Promise<DeploymentMetadata>;
}

export class DefaultDeploymentMetaProvider implements DeploymentMetaProvider {
  async getBuildMetadata(): Promise<DeploymentMetadata> {
    return {
      version: process.env.npm_package_version || "1.0.0",
      commitSha: process.env.GIT_COMMIT_SHA || "c0ffee1234567890",
      buildTimestamp: new Date().toISOString(),
      environment: (process.env.NODE_ENV as any) || "development",
      runtime: `Node.js ${process.version} (${process.platform} ${process.arch})`,
      databaseVersion: "PostgreSQL 16.2",
      deployedAt: new Date().toISOString(),
      deployedBy: "CI/CD Pipeline",
    };
  }
}
