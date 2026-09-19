import { AlertEvent } from "../schemas/monitoring-schemas.js";

export interface TelemetryExporter {
  exportAlert(alert: AlertEvent): Promise<void>;
}

export class MockTelemetryExporter implements TelemetryExporter {
  public exportedAlerts: AlertEvent[] = [];

  async exportAlert(alert: AlertEvent): Promise<void> {
    this.exportedAlerts.push(alert);
  }
}
