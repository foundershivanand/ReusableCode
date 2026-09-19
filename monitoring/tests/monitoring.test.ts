import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryMonitoringRepository,
  MonitoringService,
} from "../server/index.js";

describe("Module 26: Product Health, Monitoring & Incident System", () => {
  let repo: InMemoryMonitoringRepository;
  let service: MonitoringService;

  beforeEach(() => {
    repo = new InMemoryMonitoringRepository();
    service = new MonitoringService(repo);
  });

  it("should differentiate liveness vs readiness when critical dependency is down", async () => {
    let dbHealthy = true;

    // Critical dependency: Database
    service.registerCheck({
      name: "PostgreSQL Database",
      type: "DATABASE",
      isCritical: true,
      check: async () => ({
        status: dbHealthy ? "HEALTHY" : "UNHEALTHY",
        latencyMs: dbHealthy ? 5 : 2000,
        message: dbHealthy ? "Connected" : "Connection pool exhausted to 10.0.0.5:5432",
      }),
    });

    // 1. When DB is healthy: liveness and readiness are both true
    expect(service.getLiveness()).toBe(true);
    const ready1 = await service.getReadiness();
    expect(ready1.ready).toBe(true);

    // 2. When DB goes down: liveness is still true, but readiness is false
    dbHealthy = false;
    expect(service.getLiveness()).toBe(true);
    const ready2 = await service.getReadiness();
    expect(ready2.ready).toBe(false);
    expect(ready2.reason).toContain("PostgreSQL Database is unhealthy");
  });

  it("should sanitize public health reports to prevent internal data disclosure", async () => {
    service.registerCheck({
      name: "Payment Gateway",
      type: "PAYMENTS",
      isCritical: false,
      check: async () => ({
        status: "DEGRADED",
        latencyMs: 1500,
        message: "Stripe API timeout on internal endpoint https://10.200.4.1/v1/charges",
      }),
    });

    // Public report should NOT reveal internal IP or detailed error
    const publicReport = await service.getSystemHealth(true);
    expect(publicReport.dependencies[0].message).toBe("Degraded");
    expect(publicReport.dependencies[0].message).not.toContain("10.200.4.1");

    // Internal report contains full details
    const internalReport = await service.getSystemHealth(false);
    expect(internalReport.dependencies[0].message).toContain("10.200.4.1");
  });

  it("should distinguish critical vs non-critical dependency degradation", async () => {
    // Non-critical dependency: AI Provider
    service.registerCheck({
      name: "OpenAI Model API",
      type: "AI_PROVIDER",
      isCritical: false,
      check: async () => ({
        status: "DEGRADED",
        latencyMs: 800,
      }),
    });

    const report = await service.getSystemHealth(false);
    // Overall status is DEGRADED, not UNHEALTHY, because it's non-critical
    expect(report.status).toBe("DEGRADED");
    expect(report.readiness).toBe(true);
  });

  it("should deduplicate alerts and suppress repetitive alerts within cooldown window", async () => {
    const fingerprint = "db_connection_pool_timeout";

    // 1. First alert creates event and triggers incident
    const res1 = await service.processAlert({
      fingerprint,
      severity: "SEV1_CRITICAL",
      component: "DATABASE",
      message: "Database connection pool timeout",
    });

    expect(res1.alert.suppressed).toBe(false);
    expect(res1.incident).toBeDefined();
    expect(res1.incident?.title).toContain("DATABASE failure");

    // 2. Second alert with same fingerprint within cooldown is suppressed
    const res2 = await service.processAlert({
      fingerprint,
      severity: "SEV1_CRITICAL",
      component: "DATABASE",
      message: "Database connection pool timeout",
    });

    expect(res2.alert.suppressed).toBe(true);
    expect(res2.alert.incidentId).toBe(res1.incident?.id);
  });

  it("should manage complete incident lifecycle and attach postmortem", async () => {
    const incident = await service.createIncident({
      title: "API Gateway 502 Bad Gateway Spike",
      severity: "SEV2_MAJOR",
      affectedComponents: ["API"],
      summary: "Ingress proxy memory limit reached.",
      publicMessage: "Users may experience intermittent errors.",
      runbookUrl: "https://wiki.internal/runbooks/ingress-oom",
    });

    expect(incident.state).toBe("DETECTED");

    // Acknowledge -> Investigating -> Mitigated -> Resolved
    await service.updateIncidentState({
      id: incident.id,
      state: "INVESTIGATING",
      message: "On-call engineer investigating memory leak in proxy.",
      author: "Alice (SRE)",
    });

    await service.updateIncidentState({
      id: incident.id,
      state: "MITIGATED",
      message: "Restarted proxy and increased memory quota.",
      author: "Alice (SRE)",
    });

    const resolved = await service.updateIncidentState({
      id: incident.id,
      state: "RESOLVED",
      message: "Error rate has returned to normal.",
      author: "Alice (SRE)",
      publicMessage: "All systems are operational.",
    });

    expect(resolved.state).toBe("RESOLVED");
    expect(resolved.resolvedAt).toBeDefined();

    // Attach Postmortem
    const withPostmortem = await service.attachPostmortem(incident.id, {
      impact: "1,200 requests returned 502 over 15 minutes",
      timeline: ["14:00 Alert fired", "14:05 On-call acknowledged", "14:15 Mitigated"],
      rootCauses: ["Buffer leak in HTTP parser"],
      remediation: ["Upgrade ingress controller to v1.9.2"],
    });

    expect(withPostmortem.state).toBe("POSTMORTEM");
    expect(withPostmortem.postmortem?.rootCauses).toContain("Buffer leak in HTTP parser");
  });

  it("should evaluate SLO compliance correctly", async () => {
    await repo.saveSlo({
      id: "slo-uptime",
      name: "API Uptime",
      targetPercentage: 99.9,
      currentPercentage: 99.95,
      periodDays: 30,
      status: "MET",
      updatedAt: new Date().toISOString(),
    });

    await repo.saveSlo({
      id: "slo-latency",
      name: "p95 Latency < 200ms",
      targetPercentage: 99.0,
      currentPercentage: 97.5,
      periodDays: 30,
      status: "MET",
      updatedAt: new Date().toISOString(),
    });

    const evaluated = await service.evaluateSlos();
    const uptimeSlo = evaluated.find((s) => s.id === "slo-uptime");
    const latencySlo = evaluated.find((s) => s.id === "slo-latency");

    expect(uptimeSlo?.status).toBe("MET");
    expect(latencySlo?.status).toBe("BREACHED");
  });
});
