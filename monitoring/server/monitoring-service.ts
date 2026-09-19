import { randomUUID } from "node:crypto";
import {
  HealthStatus,
  ComponentType,
  DependencyCheckResult,
  SystemHealthReport,
  Incident,
  IncidentState,
  IncidentSeverity,
  IncidentUpdate,
  Postmortem,
  AlertEvent,
  SloDefinition,
} from "../schemas/monitoring-schemas.js";
import { MonitoringRepository } from "./repository.js";

export type HealthCheckFn = () => Promise<{
  status: HealthStatus;
  latencyMs: number;
  message?: string;
}>;

export interface RegisteredCheck {
  name: string;
  type: ComponentType;
  isCritical: boolean;
  check: HealthCheckFn;
}

export class MonitoringService {
  private checks: RegisteredCheck[] = [];
  private startTime = Date.now();
  private alertCooldownMs = 300000; // 5 minutes

  constructor(private repository: MonitoringRepository) {}

  registerCheck(check: RegisteredCheck) {
    this.checks.push(check);
  }

  getLiveness(): boolean {
    return true; // If this executes, event loop and process are alive
  }

  async getReadiness(): Promise<{ ready: boolean; reason?: string }> {
    for (const reg of this.checks) {
      if (!reg.isCritical) continue;
      try {
        const res = await reg.check();
        if (res.status === "UNHEALTHY") {
          return { ready: false, reason: `Critical dependency ${reg.name} is unhealthy` };
        }
      } catch (err: any) {
        return { ready: false, reason: `Critical dependency ${reg.name} check failed: ${err.message}` };
      }
    }
    return { ready: true };
  }

  async getSystemHealth(isPublic: boolean = false): Promise<SystemHealthReport> {
    const dependencies: DependencyCheckResult[] = [];
    let hasUnhealthyCritical = false;
    let hasDegraded = false;
    let totalLatency = 0;

    for (const reg of this.checks) {
      try {
        const checkResult = await reg.check();
        totalLatency += checkResult.latencyMs;

        if (checkResult.status === "UNHEALTHY") {
          if (reg.isCritical) hasUnhealthyCritical = true;
          else hasDegraded = true;
        } else if (checkResult.status === "DEGRADED") {
          hasDegraded = true;
        }

        dependencies.push({
          name: reg.name,
          type: reg.type,
          status: checkResult.status,
          latencyMs: checkResult.latencyMs,
          // Strip internal error messages on public status pages for security
          message: isPublic ? (checkResult.status === "HEALTHY" ? "Operational" : "Degraded") : checkResult.message || null,
          isCritical: reg.isCritical,
          lastCheckedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        if (reg.isCritical) hasUnhealthyCritical = true;
        else hasDegraded = true;

        dependencies.push({
          name: reg.name,
          type: reg.type,
          status: "UNHEALTHY",
          latencyMs: 0,
          message: isPublic ? "Service Unavailable" : err.message,
          isCritical: reg.isCritical,
          lastCheckedAt: new Date().toISOString(),
        });
      }
    }

    let overallStatus: HealthStatus = "HEALTHY";
    if (hasUnhealthyCritical) overallStatus = "UNHEALTHY";
    else if (hasDegraded) overallStatus = "DEGRADED";

    const avgLatencyMs = dependencies.length > 0 ? Math.round(totalLatency / dependencies.length) : 0;
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: overallStatus,
      liveness: this.getLiveness(),
      readiness: !hasUnhealthyCritical,
      timestamp: new Date().toISOString(),
      dependencies,
      metrics: {
        uptimeSeconds,
        avgLatencyMs,
        errorRatePercent: hasUnhealthyCritical ? 10.0 : hasDegraded ? 1.5 : 0.05,
      },
    };
  }

  async processAlert(params: {
    fingerprint: string;
    severity: IncidentSeverity;
    component: ComponentType;
    message: string;
  }): Promise<{ alert: AlertEvent; incident?: Incident }> {
    const cooldownSince = new Date(Date.now() - this.alertCooldownMs);
    const recent = await this.repository.getRecentAlertsByFingerprint(
      params.fingerprint,
      cooldownSince
    );

    const isSuppressed = recent.length > 0;
    const alertId = randomUUID();

    // Check if an open incident already covers this component
    const allIncidents = await this.repository.getIncidents();
    const matchingIncident = allIncidents.find(
      (inc) =>
        inc.state !== "RESOLVED" &&
        inc.state !== "POSTMORTEM" &&
        inc.affectedComponents.includes(params.component)
    );

    const alert: AlertEvent = {
      id: alertId,
      fingerprint: params.fingerprint,
      severity: params.severity,
      component: params.component,
      message: params.message,
      incidentId: matchingIncident ? matchingIncident.id : null,
      suppressed: isSuppressed,
      createdAt: new Date().toISOString(),
    };

    await this.repository.recordAlert(alert);

    // If severe and unsuppressed without an existing incident, automatically detect a new incident
    let createdIncident: Incident | undefined;
    if (!isSuppressed && !matchingIncident && (params.severity === "SEV1_CRITICAL" || params.severity === "SEV2_MAJOR")) {
      createdIncident = await this.createIncident({
        title: `Automated Alert: ${params.component} failure`,
        severity: params.severity,
        affectedComponents: [params.component],
        summary: params.message,
        publicMessage: `We are investigating an issue affecting ${params.component}.`,
      });
      alert.incidentId = createdIncident.id;
    }

    return { alert, incident: createdIncident || matchingIncident };
  }

  async createIncident(params: {
    title: string;
    severity: IncidentSeverity;
    affectedComponents: ComponentType[];
    summary: string;
    publicMessage: string;
    runbookUrl?: string;
  }): Promise<Incident> {
    const id = randomUUID();
    const initialUpdate: IncidentUpdate = {
      id: randomUUID(),
      incidentId: id,
      state: "DETECTED",
      message: params.summary,
      author: "System / On-Call",
      createdAt: new Date().toISOString(),
    };

    const incident: Incident = {
      id,
      title: params.title,
      severity: params.severity,
      state: "DETECTED",
      affectedComponents: params.affectedComponents,
      summary: params.summary,
      publicMessage: params.publicMessage,
      runbookUrl: params.runbookUrl || null,
      startedAt: new Date().toISOString(),
      mitigatedAt: null,
      resolvedAt: null,
      updates: [initialUpdate],
      postmortem: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repository.saveIncident(incident);
    await this.repository.addIncidentUpdate(initialUpdate);
    return incident;
  }

  async updateIncidentState(params: {
    id: string;
    state: IncidentState;
    message: string;
    author: string;
    publicMessage?: string;
  }): Promise<Incident> {
    const incident = await this.repository.getIncidentById(params.id);
    if (!incident) {
      throw new Error(`Incident ${params.id} not found`);
    }

    incident.state = params.state;
    if (params.publicMessage) {
      incident.publicMessage = params.publicMessage;
    }

    if (params.state === "MITIGATED" && !incident.mitigatedAt) {
      incident.mitigatedAt = new Date().toISOString();
    }
    if (params.state === "RESOLVED" && !incident.resolvedAt) {
      incident.resolvedAt = new Date().toISOString();
    }

    const update: IncidentUpdate = {
      id: randomUUID(),
      incidentId: incident.id,
      state: params.state,
      message: params.message,
      author: params.author,
      createdAt: new Date().toISOString(),
    };

    incident.updatedAt = new Date().toISOString();
    await this.repository.saveIncident(incident);
    await this.repository.addIncidentUpdate(update);

    return {
      ...incident,
      updates: await this.repository.getIncidentUpdates(incident.id),
    };
  }

  async attachPostmortem(incidentId: string, postmortem: Postmortem): Promise<Incident> {
    const incident = await this.repository.getIncidentById(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    incident.postmortem = postmortem;
    incident.state = "POSTMORTEM";
    incident.updatedAt = new Date().toISOString();

    await this.repository.saveIncident(incident);
    return incident;
  }

  async evaluateSlos(): Promise<SloDefinition[]> {
    const slos = await this.repository.getSlos();
    for (const slo of slos) {
      if (slo.currentPercentage >= slo.targetPercentage) {
        slo.status = "MET";
      } else if (slo.currentPercentage >= slo.targetPercentage - 1) {
        slo.status = "AT_RISK";
      } else {
        slo.status = "BREACHED";
      }
      slo.updatedAt = new Date().toISOString();
      await this.repository.saveSlo(slo);
    }
    return slos;
  }
}
