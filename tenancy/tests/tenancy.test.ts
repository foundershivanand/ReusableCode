import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryTenancyRepository,
  TenancyService,
  TenantResolver,
  TenantConflictError,
  TenantAccessForbiddenError,
  LastOwnerError,
  can,
  tenantCacheKey,
  createTenantJobContext
} from "../server/index.js";
import type { TenantContext } from "../schemas/index.js";

describe("Module 03 — Multi-Tenancy & Workspace Management", () => {
  let repository: InMemoryTenancyRepository;
  let service: TenancyService;
  let resolver: TenantResolver;

  beforeEach(() => {
    repository = new InMemoryTenancyRepository();
    service = new TenancyService(repository);
    resolver = new TenantResolver(repository, "myapp.com");
  });

  describe("1. Organization & Workspace Lifecycle", () => {
    it("creates an organization and assigns creator as OWNER", async () => {
      const { org, member } = await service.createOrganization("user_123", {
        name: "Acme Corp",
        slug: "acme-corp"
      });

      expect(org.id).toBeDefined();
      expect(org.slug).toBe("acme-corp");
      expect(member.userId).toBe("user_123");
      expect(member.role).toBe("OWNER");
      expect(member.status).toBe("ACTIVE");
    });

    it("creates a workspace within an organization with workspace:create permission", async () => {
      const { org } = await service.createOrganization("user_123", {
        name: "Acme Corp",
        slug: "acme-corp"
      });

      const context: TenantContext = {
        tenantId: org.id,
        organizationId: org.id,
        userId: "user_123",
        role: "OWNER",
        permissions: ["workspace:create"],
        resolvedVia: "SESSION"
      };

      const ws = await service.createWorkspace(context, {
        organizationId: org.id,
        name: "Engineering",
        slug: "engineering"
      });

      expect(ws.id).toBeDefined();
      expect(ws.slug).toBe("engineering");
      expect(ws.organizationId).toBe(org.id);
    });
  });

  describe("2. Tenant Resolution & Conflict Defense", () => {
    it("resolves context via subdomain", async () => {
      const { org } = await service.createOrganization("user_123", {
        name: "Acme Corp",
        slug: "acme"
      });

      const ctx = await resolver.resolveTenantContext({
        subdomain: "acme",
        userId: "user_123"
      });

      expect(ctx.organizationId).toBe(org.id);
      expect(ctx.role).toBe("OWNER");
      expect(ctx.resolvedVia).toBe("SUBDOMAIN");
    });

    it("throws TenantConflictError when competing sources disagree", async () => {
      await service.createOrganization("user_1", { name: "Org A", slug: "org-a" });
      const { org: orgB } = await service.createOrganization("user_1", { name: "Org B", slug: "org-b" });

      await expect(
        resolver.resolveTenantContext({
          subdomain: "org-a",
          explicitOrgId: orgB.id,
          userId: "user_1"
        })
      ).rejects.toThrow(TenantConflictError);
    });

    it("prevents tenant context poisoning (user trying to access tenant B without membership)", async () => {
      await service.createOrganization("user_a", { name: "Org A", slug: "org-a" });
      await service.createOrganization("user_b", { name: "Org B", slug: "org-b" });

      await expect(
        resolver.resolveTenantContext({
          subdomain: "org-b",
          userId: "user_a" // user_a does not belong to Org B!
        })
      ).rejects.toThrow(TenantAccessForbiddenError);
    });
  });

  describe("3. RBAC & Last-Owner Protection", () => {
    it("evaluates role permissions correctly", () => {
      expect(can({ role: "OWNER" }, "org:delete")).toBe(true);
      expect(can({ role: "ADMIN" }, "org:delete")).toBe(false);
      expect(can({ role: "ADMIN" }, "member:invite")).toBe(true);
      expect(can({ role: "MEMBER" }, "member:invite")).toBe(false);
      expect(can({ role: "VIEWER" }, "workspace:read")).toBe(true);
    });

    it("prevents removing or demoting the sole owner of an organization", async () => {
      const { org, member } = await service.createOrganization("user_owner", {
        name: "Solo Corp",
        slug: "solo"
      });

      const ownerContext: TenantContext = {
        tenantId: org.id,
        organizationId: org.id,
        userId: "user_owner",
        role: "OWNER",
        permissions: ["member:remove", "member:update_role", "member:suspend"],
        resolvedVia: "SESSION"
      };

      // Try to demote sole owner
      await expect(
        service.updateMemberRole(ownerContext, member.id, "ADMIN")
      ).rejects.toThrow(LastOwnerError);

      // Try to remove sole owner
      await expect(
        service.removeMember(ownerContext, member.id)
      ).rejects.toThrow(LastOwnerError);

      // Try to suspend sole owner
      await expect(
        service.suspendMember(ownerContext, member.id)
      ).rejects.toThrow(LastOwnerError);
    });

    it("allows ownership transfer with confirmation phrase", async () => {
      const { org } = await service.createOrganization("owner_1", {
        name: "Transfer Corp",
        slug: "transfer-corp"
      });

      // Add a member first
      await repository.addMember({
        id: "mem_2",
        organizationId: org.id,
        userId: "user_2",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date()
      });

      const ownerContext: TenantContext = {
        tenantId: org.id,
        organizationId: org.id,
        userId: "owner_1",
        role: "OWNER",
        permissions: ["org:transfer_ownership"],
        resolvedVia: "SESSION"
      };

      const result = await service.transferOwnership(ownerContext, "user_2", "TRANSFER OWNERSHIP");

      expect(result.newOwner.role).toBe("OWNER");
      expect(result.newOwner.userId).toBe("user_2");
      expect(result.previousOwner.role).toBe("ADMIN");
      expect(result.previousOwner.userId).toBe("owner_1");
    });
  });

  describe("4. Invitation Lifecycle", () => {
    it("handles invitation issuance, acceptance, and single-use expiration", async () => {
      const { org } = await service.createOrganization("owner_1", {
        name: "Inviter Corp",
        slug: "inviter-corp"
      });

      const ownerContext: TenantContext = {
        tenantId: org.id,
        organizationId: org.id,
        userId: "owner_1",
        role: "OWNER",
        permissions: ["member:invite"],
        resolvedVia: "SESSION"
      };

      const { invitation, rawToken } = await service.inviteMember(ownerContext, {
        organizationId: org.id,
        email: "newmember@example.com",
        role: "MEMBER"
      });

      expect(invitation.status).toBe("PENDING");
      expect(rawToken).toBeDefined();

      // Accept invitation
      const member = await service.acceptInvitation(rawToken, "user_invited");
      expect(member.userId).toBe("user_invited");
      expect(member.role).toBe("MEMBER");

      // Attempt to reuse token must fail
      await expect(
        service.acceptInvitation(rawToken, "another_user")
      ).rejects.toThrow("already been accepted");
    });
  });

  describe("5. Cache Isolation & Background Job Context", () => {
    it("generates isolated cache keys with tenant prefix", () => {
      const key = tenantCacheKey("org_123", "users", "user_456");
      expect(key).toBe("tenant:org_123:users:user_456");

      expect(() => tenantCacheKey("", "users", "1")).toThrow();
    });

    it("creates immutable tenant job context for workers", () => {
      const jobCtx = createTenantJobContext({
        tenantId: "org_abc",
        organizationId: "org_abc",
        workspaceId: "ws_xyz",
        userId: "user_789"
      });

      expect(jobCtx.tenantId).toBe("org_abc");
      expect(jobCtx.correlationId).toBeDefined();
      expect(Object.isFrozen(jobCtx)).toBe(true);
    });
  });
});
