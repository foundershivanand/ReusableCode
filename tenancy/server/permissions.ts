import type { TenantRole, TenantPermission, Member, TenantContext } from "../schemas/index.js";

export class PermissionDeniedError extends Error {
  public readonly code = "PERMISSION_DENIED";
  constructor(permission: TenantPermission, role: TenantRole) {
    super(`Role "${role}" does not have permission "${permission}"`);
    this.name = "PermissionDeniedError";
  }
}

export class CrossTenantAccessError extends Error {
  public readonly code = "CROSS_TENANT_ACCESS_DENIED";
  constructor(expectedTenantId: string, requestedTenantId: string) {
    super(`Access denied: attempted to access resource of tenant "${requestedTenantId}" from context "${expectedTenantId}"`);
    this.name = "CrossTenantAccessError";
  }
}

const ROLE_PERMISSIONS: Record<TenantRole, Set<TenantPermission>> = {
  OWNER: new Set<TenantPermission>([
    "org:read",
    "org:update",
    "org:delete",
    "org:transfer_ownership",
    "workspace:create",
    "workspace:read",
    "workspace:update",
    "workspace:delete",
    "member:invite",
    "member:read",
    "member:remove",
    "member:update_role",
    "member:suspend",
    "billing:view",
    "billing:manage",
    "settings:read",
    "settings:update",
    "audit:read"
  ]),
  ADMIN: new Set<TenantPermission>([
    "org:read",
    "org:update",
    "workspace:create",
    "workspace:read",
    "workspace:update",
    "workspace:delete",
    "member:invite",
    "member:read",
    "member:remove",
    "member:update_role",
    "member:suspend",
    "billing:view",
    "settings:read",
    "settings:update",
    "audit:read"
  ]),
  MEMBER: new Set<TenantPermission>([
    "org:read",
    "workspace:read",
    "member:read",
    "settings:read"
  ]),
  VIEWER: new Set<TenantPermission>([
    "org:read",
    "workspace:read",
    "member:read"
  ])
};

export function getRolePermissions(role: TenantRole): TenantPermission[] {
  return Array.from(ROLE_PERMISSIONS[role] || []);
}

export function can(
  target: TenantContext | Member | { role: TenantRole; status?: string },
  permission: TenantPermission
): boolean {
  if ("status" in target && target.status !== "ACTIVE") {
    return false;
  }
  const permissions = ROLE_PERMISSIONS[target.role];
  return permissions ? permissions.has(permission) : false;
}

export function canAccess(
  context: TenantContext | Member | { organizationId: string; workspaceId?: string },
  resourceTenantId: string
): boolean {
  const orgId = "organizationId" in context ? context.organizationId : (context as TenantContext).tenantId;
  const wsId = "workspaceId" in context ? context.workspaceId : undefined;
  return orgId === resourceTenantId || (wsId !== undefined && wsId === resourceTenantId);
}

export function requirePermission(
  target: TenantContext | Member | { role: TenantRole; status?: string },
  permission: TenantPermission
): void {
  if (!can(target, permission)) {
    throw new PermissionDeniedError(permission, target.role);
  }
}

export function requireTenantAccess(
  context: TenantContext | Member | { organizationId: string; workspaceId?: string },
  resourceTenantId: string
): void {
  if (!canAccess(context, resourceTenantId)) {
    const orgId = "organizationId" in context ? context.organizationId : (context as TenantContext).tenantId;
    throw new CrossTenantAccessError(orgId, resourceTenantId);
  }
}

/**
 * Cache key isolation: ensures keys are strictly scoped to tenant
 */
export function tenantCacheKey(tenantId: string, resource: string, id: string): string {
  if (!tenantId || !resource || !id) {
    throw new Error("tenantId, resource, and id must be non-empty strings");
  }
  return `tenant:${tenantId}:${resource}:${id}`;
}

export interface TenantJobContext {
  readonly tenantId: string;
  readonly organizationId: string;
  readonly workspaceId?: string;
  readonly userId?: string;
  readonly correlationId: string;
}

/**
 * Ensures background jobs execute with immutable tenant context
 */
export function createTenantJobContext(params: {
  tenantId: string;
  organizationId: string;
  workspaceId?: string;
  userId?: string;
  correlationId?: string;
}): TenantJobContext {
  return Object.freeze({
    tenantId: params.tenantId,
    organizationId: params.organizationId,
    workspaceId: params.workspaceId,
    userId: params.userId,
    correlationId: params.correlationId || `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  });
}
