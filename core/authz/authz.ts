import { AuthorizationError } from "../errors/errors.js";

export interface Actor {
  id: string;
  tenantId?: string;
  roles: string[];
  permissions?: string[];
  isSystem?: boolean;
}

export interface Resource {
  type: string;
  id?: string;
  tenantId?: string;
  ownerId?: string;
  attributes?: Record<string, unknown>;
}

export interface AuthorizationRequest {
  actor: Actor;
  action: string;
  resource: Resource;
  tenant?: string;
}

export interface AuthorizationPolicy {
  name: string;
  evaluate: (req: AuthorizationRequest) => boolean | Promise<boolean>;
}

export class AuthorizationEngine {
  private customPolicies: AuthorizationPolicy[] = [];

  registerPolicy(policy: AuthorizationPolicy) {
    this.customPolicies.push(policy);
  }

  /**
   * Evaluates permissions for an actor against a resource and tenant.
   */
  async authorize(req: AuthorizationRequest): Promise<{ allowed: boolean; reason?: string }> {
    const { actor, action, resource, tenant } = req;

    // 1. System / SuperAdmin Bypass
    if (actor.isSystem || actor.roles.includes("SUPER_ADMIN")) {
      return { allowed: true };
    }

    // 2. Tenant Boundary Isolation
    const targetTenant = tenant || resource.tenantId;
    if (targetTenant) {
      if (!actor.tenantId || actor.tenantId !== targetTenant) {
        return {
          allowed: false,
          reason: `Cross-tenant access forbidden. Actor tenant '${actor.tenantId}' does not match target tenant '${targetTenant}'`,
        };
      }
    }

    // 3. Action / Permission Matching (RBAC)
    const effectivePermissions = new Set<string>(actor.permissions || []);

    // Standard role defaults
    if (actor.roles.includes("TENANT_ADMIN")) {
      effectivePermissions.add("*");
    } else if (actor.roles.includes("MEMBER")) {
      effectivePermissions.add(`${resource.type}:read`);
      effectivePermissions.add(`${resource.type}:write`);
    } else if (actor.roles.includes("GUEST")) {
      effectivePermissions.add(`${resource.type}:read`);
    }

    const hasPermission = this.checkPermission(effectivePermissions, action);
    if (!hasPermission) {
      // 4. Resource Ownership Fallback (ABAC)
      if (resource.ownerId && resource.ownerId === actor.id) {
        // Owner typically has read & write on own resources
        if (action.endsWith(":read") || action.endsWith(":write") || action.endsWith(":delete")) {
          return { allowed: true };
        }
      }

      return {
        allowed: false,
        reason: `Actor '${actor.id}' lacks permission '${action}' on resource '${resource.type}'`,
      };
    }

    // 5. Custom Policy Evaluation
    for (const policy of this.customPolicies) {
      const passed = await policy.evaluate(req);
      if (!passed) {
        return {
          allowed: false,
          reason: `Policy '${policy.name}' rejected the request`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Enforces authorization, throwing AuthorizationError if denied.
   */
  async enforce(req: AuthorizationRequest): Promise<void> {
    const result = await this.authorize(req);
    if (!result.allowed) {
      throw new AuthorizationError(result.reason || "Permission denied");
    }
  }

  private checkPermission(permissions: Set<string>, requiredAction: string): boolean {
    if (permissions.has("*")) return true;
    if (permissions.has(requiredAction)) return true;

    const [domain] = requiredAction.split(":");
    if (permissions.has(`${domain}:*`)) return true;

    return false;
  }
}

export const defaultAuthorizationEngine = new AuthorizationEngine();

export async function authorize(req: AuthorizationRequest): Promise<{ allowed: boolean; reason?: string }> {
  return defaultAuthorizationEngine.authorize(req);
}

export async function enforce(req: AuthorizationRequest): Promise<void> {
  return defaultAuthorizationEngine.enforce(req);
}
