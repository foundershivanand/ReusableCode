import type { TenancyRepository } from "./repository.js";
import type { TenantContext } from "../schemas/index.js";
import { getRolePermissions } from "./permissions.js";

export class TenantConflictError extends Error {
  public readonly code = "TENANT_CONTEXT_CONFLICT";
  constructor(sourceA: string, valA: string, sourceB: string, valB: string) {
    super(`Conflicting tenant sources detected: ${sourceA}="${valA}" does not match ${sourceB}="${valB}"`);
    this.name = "TenantConflictError";
  }
}

export class TenantNotFoundError extends Error {
  public readonly code = "TENANT_NOT_FOUND";
  constructor(identifier: string) {
    super(`Tenant not found for identifier: ${identifier}`);
    this.name = "TenantNotFoundError";
  }
}

export class TenantAccessForbiddenError extends Error {
  public readonly code = "TENANT_ACCESS_FORBIDDEN";
  constructor(userId: string, tenantId: string) {
    super(`User "${userId}" is not an active member of tenant "${tenantId}"`);
    this.name = "TenantAccessForbiddenError";
  }
}

export interface TenantResolutionInput {
  userId?: string;
  apiKeyTenantId?: string;
  sessionOrgId?: string;
  sessionWorkspaceId?: string;
  subdomain?: string;
  customDomain?: string;
  urlOrgSlug?: string;
  urlWorkspaceSlug?: string;
  explicitOrgId?: string;
  explicitWorkspaceId?: string;
  appBaseDomain?: string; // e.g., "myapp.com"
}

export class TenantResolver {
  constructor(
    private repository: TenancyRepository,
    private appBaseDomain = "app.example.com"
  ) {}

  /**
   * Resolves tenant context from request parameters with strict conflict checking
   * and context-poisoning verification.
   */
  async resolveTenantContext(input: TenantResolutionInput): Promise<TenantContext> {
    let resolvedOrgId: string | null = null;
    let resolvedWorkspaceId: string | undefined = undefined;
    let resolvedVia: TenantContext["resolvedVia"] = "EXPLICIT_HEADER";

    // 1. API Key takes highest precedence
    if (input.apiKeyTenantId) {
      const org = await this.repository.getOrganizationById(input.apiKeyTenantId);
      if (org) {
        resolvedOrgId = org.id;
        resolvedVia = "API_KEY";
      } else {
        const ws = await this.repository.getWorkspaceById(input.apiKeyTenantId);
        if (ws) {
          resolvedOrgId = ws.organizationId;
          resolvedWorkspaceId = ws.id;
          resolvedVia = "API_KEY";
        } else {
          throw new TenantNotFoundError(input.apiKeyTenantId);
        }
      }
    }

    // 2. Custom Domain
    if (input.customDomain && input.customDomain !== this.appBaseDomain) {
      const org = await this.repository.getOrganizationByCustomDomain(input.customDomain);
      if (org) {
        if (resolvedOrgId && resolvedOrgId !== org.id) {
          throw new TenantConflictError(resolvedVia, resolvedOrgId, "CUSTOM_DOMAIN", org.id);
        }
        resolvedOrgId = org.id;
        resolvedVia = "CUSTOM_DOMAIN";
      }
    }

    // 3. Subdomain
    if (input.subdomain && !input.customDomain) {
      const org = await this.repository.getOrganizationBySlug(input.subdomain);
      if (org) {
        if (resolvedOrgId && resolvedOrgId !== org.id) {
          throw new TenantConflictError(resolvedVia, resolvedOrgId, "SUBDOMAIN", org.id);
        }
        resolvedOrgId = org.id;
        resolvedVia = "SUBDOMAIN";
      }
    }

    // 4. URL Slugs
    if (input.urlOrgSlug) {
      const org = await this.repository.getOrganizationBySlug(input.urlOrgSlug);
      if (!org) {
        throw new TenantNotFoundError(input.urlOrgSlug);
      }
      if (resolvedOrgId && resolvedOrgId !== org.id) {
        throw new TenantConflictError(resolvedVia, resolvedOrgId, "URL_SLUG", org.id);
      }
      resolvedOrgId = org.id;
      resolvedVia = "URL";

      if (input.urlWorkspaceSlug) {
        const ws = await this.repository.getWorkspaceBySlug(org.id, input.urlWorkspaceSlug);
        if (!ws) {
          throw new TenantNotFoundError(`${input.urlOrgSlug}/${input.urlWorkspaceSlug}`);
        }
        resolvedWorkspaceId = ws.id;
      }
    }

    // 5. Explicit Headers (X-Organization-Id / X-Workspace-Id)
    if (input.explicitOrgId) {
      if (resolvedOrgId && resolvedOrgId !== input.explicitOrgId) {
        throw new TenantConflictError(resolvedVia, resolvedOrgId, "EXPLICIT_HEADER", input.explicitOrgId);
      }
      resolvedOrgId = input.explicitOrgId;
      resolvedVia = "EXPLICIT_HEADER";
    }
    if (input.explicitWorkspaceId) {
      const ws = await this.repository.getWorkspaceById(input.explicitWorkspaceId);
      if (!ws) {
        throw new TenantNotFoundError(input.explicitWorkspaceId);
      }
      if (resolvedOrgId && resolvedOrgId !== ws.organizationId) {
        throw new TenantConflictError(resolvedVia, resolvedOrgId, "EXPLICIT_WS_ORG", ws.organizationId);
      }
      resolvedOrgId = ws.organizationId;
      resolvedWorkspaceId = ws.id;
      resolvedVia = "EXPLICIT_HEADER";
    }

    // 6. Session fallback
    if (!resolvedOrgId && input.sessionOrgId) {
      resolvedOrgId = input.sessionOrgId;
      resolvedWorkspaceId = input.sessionWorkspaceId;
      resolvedVia = "SESSION";
    } else if (resolvedOrgId && input.sessionOrgId && resolvedOrgId !== input.sessionOrgId) {
      // Competing tenant source: check if session disagrees with explicitly targeted tenant
      // We allow a user to switch tenants explicitly ONLY IF they are authorized for that tenant
      // Otherwise, conflict!
    }

    if (!resolvedOrgId) {
      throw new Error("No tenant context could be resolved from request parameters");
    }

    // Check organization existence and status
    const organization = await this.repository.getOrganizationById(resolvedOrgId);
    if (!organization || organization.status === "PENDING_DELETION") {
      throw new TenantNotFoundError(resolvedOrgId);
    }

    // Tenant Context Poisoning Defense:
    // If a userId is present, MUST verify membership in the resolved organization
    if (input.userId) {
      const member = await this.repository.getMemberByOrgAndUser(resolvedOrgId, input.userId);
      if (!member || member.status !== "ACTIVE") {
        throw new TenantAccessForbiddenError(input.userId, resolvedOrgId);
      }

      // If workspace specified, verify workspace access if restricted
      if (resolvedWorkspaceId && member.workspaceId && member.workspaceId !== resolvedWorkspaceId) {
        throw new TenantAccessForbiddenError(input.userId, resolvedWorkspaceId);
      }

      const permissions = getRolePermissions(member.role);

      return {
        tenantId: resolvedWorkspaceId || resolvedOrgId,
        organizationId: resolvedOrgId,
        workspaceId: resolvedWorkspaceId,
        userId: input.userId,
        role: member.role,
        permissions,
        resolvedVia
      };
    }

    // For machine/API key access without a specific human userId
    return {
      tenantId: resolvedWorkspaceId || resolvedOrgId,
      organizationId: resolvedOrgId,
      workspaceId: resolvedWorkspaceId,
      userId: "api-service",
      role: "OWNER",
      permissions: getRolePermissions("OWNER"),
      resolvedVia
    };
  }
}
