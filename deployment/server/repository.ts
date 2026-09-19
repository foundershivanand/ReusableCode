import {
  DeploymentMetadata,
  ConfigDriftFinding,
} from "../schemas/deployment-schemas.js";

export interface DeploymentRepository {
  getCurrentDeployment(environment: string): Promise<DeploymentMetadata | null>;
  recordDeployment(meta: DeploymentMetadata): Promise<void>;
  listDeployments(environment: string, limit?: number): Promise<DeploymentMetadata[]>;
  saveDriftAudit(environment: string, findings: ConfigDriftFinding[]): Promise<void>;
  getLatestDriftAudit(environment: string): Promise<ConfigDriftFinding[] | null>;
}

export class InMemoryDeploymentRepository implements DeploymentRepository {
  private deployments: DeploymentMetadata[] = [];
  private driftAudits = new Map<string, ConfigDriftFinding[]>();

  async getCurrentDeployment(environment: string): Promise<DeploymentMetadata | null> {
    const list = this.deployments
      .filter((d) => d.environment === environment)
      .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());
    return list[0] ? { ...list[0] } : null;
  }

  async recordDeployment(meta: DeploymentMetadata): Promise<void> {
    this.deployments.push({ ...meta });
  }

  async listDeployments(environment: string, limit: number = 10): Promise<DeploymentMetadata[]> {
    return this.deployments
      .filter((d) => d.environment === environment)
      .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime())
      .slice(0, limit)
      .map((d) => ({ ...d }));
  }

  async saveDriftAudit(environment: string, findings: ConfigDriftFinding[]): Promise<void> {
    this.driftAudits.set(environment, findings.map((f) => ({ ...f })));
  }

  async getLatestDriftAudit(environment: string): Promise<ConfigDriftFinding[] | null> {
    const findings = this.driftAudits.get(environment);
    return findings ? findings.map((f) => ({ ...f })) : null;
  }
}
