import { describe, it, expect, beforeEach } from "vitest";
import { createHash } from "node:crypto";
import {
  InMemoryMaintenanceRepository,
  MaintenanceService,
} from "../server/index.js";

describe("Module 23: Maintenance Mode, Status & System Banners", () => {
  let repo: InMemoryMaintenanceRepository;
  let service: MaintenanceService;

  beforeEach(() => {
    repo = new InMemoryMaintenanceRepository();
    service = new MaintenanceService(repo);
  });

  it("should permit normal operations when maintenance is OFF", async () => {
    const res = await service.checkMaintenance({
      path: "/dashboard",
      method: "GET",
    });

    expect(res.blocked).toBe(false);
    expect(res.readOnly).toBe(false);
    expect(res.statusCode).toBe(200);
  });

  it("should block requests in FULL_MAINTENANCE mode with 503 and public message", async () => {
    const endsAt = new Date(Date.now() + 1800000).toISOString(); // 30 minutes
    await service.setMaintenanceConfig({
      id: "maint-full-1",
      mode: "FULL_MAINTENANCE",
      scope: "GLOBAL",
      target: "*",
      title: "Major Infrastructure Migration",
      message: "We are performing a scheduled database upgrade.",
      adminBypassSecretHash: null,
      allowedRoles: ["admin"],
      allowedUserIds: [],
      allowedIps: [],
      startsAt: new Date(Date.now() - 60000).toISOString(),
      endsAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await service.checkMaintenance({
      path: "/api/items",
      method: "GET",
      userRoles: ["user"],
    });

    expect(res.blocked).toBe(true);
    expect(res.statusCode).toBe(503);
    expect(res.publicMessage).toBe("We are performing a scheduled database upgrade.");
    expect(res.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should enforce READ_ONLY mode: block mutations with 403, allow GET with readOnly flag", async () => {
    await service.setMaintenanceConfig({
      id: "maint-ro-1",
      mode: "READ_ONLY",
      scope: "GLOBAL",
      target: "*",
      title: "Read-Only Window",
      message: "Database is being backed up. Modifications are temporarily disabled.",
      adminBypassSecretHash: null,
      allowedRoles: ["admin"],
      allowedUserIds: [],
      allowedIps: [],
      startsAt: new Date(Date.now() - 10000).toISOString(),
      endsAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // GET should be allowed with readOnly: true
    const getRes = await service.checkMaintenance({
      path: "/api/orders",
      method: "GET",
      userRoles: ["user"],
    });
    expect(getRes.blocked).toBe(false);
    expect(getRes.readOnly).toBe(true);
    expect(getRes.statusCode).toBe(200);

    // POST should be blocked
    const postRes = await service.checkMaintenance({
      path: "/api/orders",
      method: "POST",
      userRoles: ["user"],
    });
    expect(postRes.blocked).toBe(true);
    expect(postRes.readOnly).toBe(true);
    expect(postRes.statusCode).toBe(403);
  });

  it("should support route-scoped and tenant-scoped maintenance", async () => {
    // Maintenance on /api/v2/* only
    await service.setMaintenanceConfig({
      id: "maint-route-1",
      mode: "FULL_MAINTENANCE",
      scope: "ROUTE",
      target: "/api/v2",
      title: "V2 Migration",
      message: "V2 is under maintenance.",
      adminBypassSecretHash: null,
      allowedRoles: ["admin"],
      allowedUserIds: [],
      allowedIps: [],
      startsAt: new Date(Date.now() - 10000).toISOString(),
      endsAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const v2Res = await service.checkMaintenance({
      path: "/api/v2/reports",
      method: "GET",
    });
    expect(v2Res.blocked).toBe(true);

    const v1Res = await service.checkMaintenance({
      path: "/api/v1/reports",
      method: "GET",
    });
    expect(v1Res.blocked).toBe(false);
  });

  it("should allow secure admin bypass via role or secret token", async () => {
    const rawSecret = "super-secret-emergency-key-999";
    const secretHash = createHash("sha256").update(rawSecret).digest("hex");

    await service.setMaintenanceConfig({
      id: "maint-bypass-1",
      mode: "FULL_MAINTENANCE",
      scope: "GLOBAL",
      target: "*",
      title: "System Lockdown",
      message: "Under maintenance.",
      adminBypassSecretHash: secretHash,
      allowedRoles: ["admin"],
      allowedUserIds: [],
      allowedIps: [],
      startsAt: new Date(Date.now() - 10000).toISOString(),
      endsAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 1. Bypass by admin role
    const adminRes = await service.checkMaintenance({
      path: "/admin",
      method: "GET",
      userRoles: ["admin"],
    });
    expect(adminRes.blocked).toBe(false);

    // 2. Bypass by secret token
    const tokenRes = await service.checkMaintenance({
      path: "/api/internal",
      method: "POST",
      bypassSecret: rawSecret,
    });
    expect(tokenRes.blocked).toBe(false);

    // 3. Invalid secret fails bypass
    const failRes = await service.checkMaintenance({
      path: "/api/internal",
      method: "POST",
      bypassSecret: "wrong-secret",
    });
    expect(failRes.blocked).toBe(true);
  });

  it("should respect scheduled maintenance start and end times", async () => {
    // Scheduled in the future (starts in 1 hour)
    await service.setMaintenanceConfig({
      id: "maint-future-1",
      mode: "FULL_MAINTENANCE",
      scope: "GLOBAL",
      target: "*",
      title: "Future Upgrade",
      message: "Coming soon.",
      adminBypassSecretHash: null,
      allowedRoles: ["admin"],
      allowedUserIds: [],
      allowedIps: [],
      startsAt: new Date(Date.now() + 3600000).toISOString(),
      endsAt: new Date(Date.now() + 7200000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await service.checkMaintenance({
      path: "/",
      method: "GET",
    });
    expect(res.blocked).toBe(false);
  });

  it("should manage system banners by scope and active status", async () => {
    await service.addBanner({
      id: "banner-1",
      type: "WARNING",
      title: "Scheduled Downtime",
      message: "Maintenance planned tonight at 02:00 UTC.",
      dismissible: true,
      targetScope: "ALL",
      startsAt: new Date(Date.now() - 10000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    const banners = await service.getActiveBanners("ALL");
    expect(banners).toHaveLength(1);
    expect(banners[0].title).toBe("Scheduled Downtime");
  });
});
