import { describe, expect, it } from "vitest";
import {
  can,
  canAccess,
  requirePermission,
  requireRole,
  assertCanModifyUser,
} from "../middleware/permission-middleware.js";
import { UserRecord } from "../server/repository.js";

describe("Authorization & Permission Boundary", () => {
  const normalUser: UserRecord = {
    id: "user-1",
    email: "user1@example.com",
    name: "User One",
    passwordHash: "hash",
    role: "USER",
    accountStatus: "ACTIVE",
    isEmailVerified: true,
    mfaEnabled: false,
    mfaSecret: null,
    mfaLastUsedStep: 0,
    sessionVersion: 1,
    deletedAt: null,
    lockedUntil: null,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const adminUser: UserRecord = {
    ...normalUser,
    id: "admin-1",
    email: "admin@example.com",
    role: "ADMIN",
  };

  it("distinguishes permissions between ordinary users and admins", () => {
    expect(can(normalUser, "users:read")).toBe(true);
    expect(can(normalUser, "roles:update")).toBe(false);
    expect(can(normalUser, "admin:access")).toBe(false);

    expect(can(adminUser, "users:read")).toBe(true);
    expect(can(adminUser, "roles:update")).toBe(true);
    expect(can(adminUser, "admin:access")).toBe(true);
  });

  it("throws forbidden errors when required permission or role is missing", () => {
    expect(() => requireRole(normalUser, "ADMIN")).toThrow("Forbidden: Insufficient role");
    expect(() => requirePermission(normalUser, "admin:access")).toThrow("Forbidden");

    // Admin passes
    expect(() => requireRole(adminUser, "ADMIN")).not.toThrow();
    expect(() => requirePermission(adminUser, "admin:access")).not.toThrow();
  });

  it("enforces IDOR protection: users can only access their own resources", () => {
    const userResource = { ownerUserId: "user-1" };
    const otherResource = { ownerUserId: "user-2" };

    expect(canAccess(normalUser, userResource)).toBe(true);
    expect(canAccess(normalUser, otherResource)).toBe(false);
  });

  it("prevents privilege escalation: ordinary users cannot change roles", () => {
    expect(() =>
      assertCanModifyUser(normalUser, normalUser.id, { role: "ADMIN" })
    ).toThrow("Ordinary users cannot modify roles or permissions");

    expect(() =>
      assertCanModifyUser(normalUser, "user-2", { name: "Hacked" })
    ).toThrow("Cannot modify another user's account");
  });
});
