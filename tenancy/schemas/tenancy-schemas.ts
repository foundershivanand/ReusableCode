import { z } from "zod";

export const TenantRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);
export type TenantRole = z.infer<typeof TenantRoleSchema>;

export const MemberStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "PENDING"]);
export type MemberStatus = z.infer<typeof MemberStatusSchema>;

export const OrganizationStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "PENDING_DELETION"]);
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;

export const InvitationStatusSchema = z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const TenantPermissionSchema = z.enum([
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
]);
export type TenantPermission = z.infer<typeof TenantPermissionSchema>;

export const OrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
  customDomain: z.string().optional(),
  logoUrl: z.string().url().optional(),
  status: OrganizationStatusSchema.default("ACTIVE"),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional()
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const WorkspaceSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const MemberSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  userId: z.string().min(1),
  role: TenantRoleSchema,
  status: MemberStatusSchema.default("ACTIVE"),
  joinedAt: z.date(),
  invitedBy: z.string().optional()
});
export type Member = z.infer<typeof MemberSchema>;

export const InvitationSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  email: z.string().email(),
  role: TenantRoleSchema,
  tokenHash: z.string().min(1),
  status: InvitationStatusSchema.default("PENDING"),
  expiresAt: z.date(),
  invitedBy: z.string().min(1),
  createdAt: z.date(),
  acceptedAt: z.date().optional()
});
export type Invitation = z.infer<typeof InvitationSchema>;

export const TenantContextSchema = z.object({
  tenantId: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  userId: z.string().min(1),
  role: TenantRoleSchema,
  permissions: z.array(TenantPermissionSchema),
  resolvedVia: z.enum(["API_KEY", "SESSION", "SUBDOMAIN", "CUSTOM_DOMAIN", "URL", "EXPLICIT_HEADER"])
});
export type TenantContext = z.infer<typeof TenantContextSchema>;

export const CreateOrganizationInputSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  domain: z.string().optional(),
  customDomain: z.string().optional()
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;

export const CreateWorkspaceInputSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/)
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;

export const InviteMemberInputSchema = z.object({
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  email: z.string().email(),
  role: TenantRoleSchema
});
export type InviteMemberInput = z.infer<typeof InviteMemberInputSchema>;
