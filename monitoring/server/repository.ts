import {
  Incident,
  IncidentUpdate,
  AlertEvent,
  SloDefinition,
} from "../schemas/monitoring-schemas.js";

export interface MonitoringRepository {
  getIncidents(options?: { state?: string }): Promise<Incident[]>;
  getIncidentById(id: string): Promise<Incident | null>;
  saveIncident(incident: Incident): Promise<void>;
  addIncidentUpdate(update: IncidentUpdate): Promise<void>;
  getIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]>;
  recordAlert(alert: AlertEvent): Promise<void>;
  getRecentAlertsByFingerprint(fingerprint: string, since: Date): Promise<AlertEvent[]>;
  getSlos(): Promise<SloDefinition[]>;
  saveSlo(slo: SloDefinition): Promise<void>;
}

export class InMemoryMonitoringRepository implements MonitoringRepository {
  private incidents = new Map<string, Incident>();
  private updates: IncidentUpdate[] = [];
  private alerts: AlertEvent[] = [];
  private slos = new Map<string, SloDefinition>();

  async getIncidents(options?: { state?: string }): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .filter((inc) => (!options?.state ? true : inc.state === options.state))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .map((inc) => ({
        ...inc,
        updates: this.updates.filter((u) => u.incidentId === inc.id),
      }));
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    const inc = this.incidents.get(id);
    if (!inc) return null;
    return {
      ...inc,
      updates: this.updates.filter((u) => u.incidentId === inc.id),
    };
  }

  async saveIncident(incident: Incident): Promise<void> {
    this.incidents.set(incident.id, { ...incident });
  }

  async addIncidentUpdate(update: IncidentUpdate): Promise<void> {
    this.updates.push({ ...update });
  }

  async getIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]> {
    return this.updates
      .filter((u) => u.incidentId === incidentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async recordAlert(alert: AlertEvent): Promise<void> {
    this.alerts.push({ ...alert });
  }

  async getRecentAlertsByFingerprint(fingerprint: string, since: Date): Promise<AlertEvent[]> {
    return this.alerts.filter(
      (a) => a.fingerprint === fingerprint && new Date(a.createdAt) >= since
    );
  }

  async getSlos(): Promise<SloDefinition[]>;
  async getSlos(): Promise<SloDefinition[]> {
    return Array.from(this.slos.values());
  }

  async saveSlo(slo: SloDefinition): Promise<void> {
    this.slos.set(slo.id, { ...slo });
  }
}
