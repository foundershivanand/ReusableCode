import { UserRole } from "../schemas/auth-schemas.js";
import { UserRecord } from "../server/repository.js";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "roles:update"
  | "admin:access"
  | "sessions:revoke"
  | "billing:manage"
  | "workspace:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: ["users:read", "sessions:revoke"],
  ADMIN: [
    "users:read",
    "users:write",
    "roles:update",
    "admin:access",
    "sessions:revoke",
    "billing:manage",
    "workspace:manage",
  ],
  SUPER_ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "roles:update",
    "admin:access",
    "sessions:revoke",
    "billing:manage",
    "workspace:manage",
  ],
};

/**
 * Checks if a user has a specific permission
 */
export function can(user: UserRecord | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a user can access a specific resource (Ownership & Tenant / IDOR protection)
 */
export function canAccess(
  user: UserRecord | null | undefined,
  resource: { ownerUserId?: string; tenantId?: string },
  contextTenantId?: string
): boolean {
  if (!user) return false;

  // Super admins have cross-resource access
  if (user.role === "SUPER_ADMIN") return true;

  // Direct ownership check (IDOR protection)
  if (resource.ownerUserId && resource.ownerUserId === user.id) {
    return true;
  }

  // Tenant matching check (Tenant isolation)
  if (
    contextTenantId &&
    resource.tenantId &&
    resource.tenantId === contextTenantId &&
    user.role === "ADMIN"
  ) {
    return true;
  }

  return false;
}

/**
 * Enforces permission check or throws authorization error
 */
export function requirePermission(
  user: UserRecord | null | undefined,
  permission: Permission
): void {
  if (!user) {
    throw new Error("Unauthorized: Authentication required.");
  }
  if (!can(user, permission)) {
    throw new Error(`Forbidden: Missing required permission '${permission}'.`);
  }
}

/**
 * Enforces role check or throws authorization error
 */
export function requireRole(
  user: UserRecord | null | undefined,
  allowedRoles: UserRole | UserRole[]
): void {
  if (!user) {
    throw new Error("Unauthorized: Authentication required.");
  }
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient role.");
  }
}

/**
 * Validates that a user cannot modify another user's account unless they are an admin,
 * and cannot modify their own role/permissions (prevents privilege escalation)
 */
export function assertCanModifyUser(
  actor: UserRecord,
  targetUserId: string,
  proposedUpdates: Record<string, any>
): void {
  // 1. Privilege escalation check: cannot modify role/permissions unless admin
  if (proposedUpdates.role !== undefined || proposedUpdates.permissions !== undefined) {
    if (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") {
      throw new Error("Forbidden: Ordinary users cannot modify roles or permissions.");
    }
    // Users cannot promote themselves
    if (actor.id === targetUserId && proposedUpdates.role !== actor.role) {
      throw new Error("Forbidden: Users cannot escalate their own role.");
    }
  }

  // 2. IDOR check: Users can only modify their own profile unless they are an Admin
  if (actor.id !== targetUserId && actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Cannot modify another user's account.");
  }
}
