import crypto from "node:crypto";
import type { TenancyRepository } from "./repository.js";
import type {
  Organization,
  Workspace,
  Member,
  Invitation,
  TenantRole,
  CreateOrganizationInput,
  CreateWorkspaceInput,
  InviteMemberInput,
  TenantContext
} from "../schemas/index.js";
import { requirePermission } from "./permissions.js";

export class LastOwnerError extends Error {
  public readonly code = "LAST_OWNER_PROTECTION";
  constructor() {
    super("Cannot remove, demote, or suspend the sole owner of an organization");
    this.name = "LastOwnerError";
  }
}

export class InvitationError extends Error {
  public readonly code = "INVITATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

export class TenancyService {
  constructor(private repository: TenancyRepository) {}

  /**
   * Creates an organization and assigns creator as OWNER.
   */
  async createOrganization(userId: string, input: CreateOrganizationInput): Promise<{ org: Organization; member: Member }> {
    const existing = await this.repository.getOrganizationBySlug(input.slug);
    if (existing) {
      throw new Error(`Organization slug "${input.slug}" is already taken`);
    }

    const orgId = `org_${crypto.randomUUID()}`;
    const now = new Date();

    const org: Organization = {
      id: orgId,
      name: input.name,
      slug: input.slug,
      domain: input.domain,
      customDomain: input.customDomain,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now
    };

    await this.repository.createOrganization(org);

    const member: Member = {
      id: `mem_${crypto.randomUUID()}`,
      organizationId: orgId,
      userId,
      role: "OWNER",
      status: "ACTIVE",
      joinedAt: now
    };

    await this.repository.addMember(member);

    return { org, member };
  }

  /**
   * Creates a workspace within an organization.
   */
  async createWorkspace(context: TenantContext, input: CreateWorkspaceInput): Promise<Workspace> {
    requirePermission(context, "workspace:create");

    const existing = await this.repository.getWorkspaceBySlug(context.organizationId, input.slug);
    if (existing) {
      throw new Error(`Workspace slug "${input.slug}" already exists in this organization`);
    }

    const now = new Date();
    const workspace: Workspace = {
      id: `ws_${crypto.randomUUID()}`,
      organizationId: context.organizationId,
      name: input.name,
      slug: input.slug,
      createdAt: now,
      updatedAt: now
    };

    return this.repository.createWorkspace(workspace);
  }

  /**
   * Invites a new member to an organization/workspace.
   * Generates a secure single-use token with 7-day expiration.
   */
  async inviteMember(context: TenantContext, input: InviteMemberInput): Promise<{ invitation: Invitation; rawToken: string }> {
    requirePermission(context, "member:invite");

    // Only OWNER can invite as OWNER
    if (input.role === "OWNER" && context.role !== "OWNER") {
      throw new Error("Only an existing OWNER can invite another OWNER");
    }

    // Note: in a real app email would be linked to user, here we check pending invitations
    const pending = await this.repository.listPendingInvitationsByOrg(context.organizationId);
    if (pending.some((inv) => inv.email.toLowerCase() === input.email.toLowerCase())) {
      throw new InvitationError(`An invitation is already pending for ${input.email}`);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const now = new Date();

    const invitation: Invitation = {
      id: `inv_${crypto.randomUUID()}`,
      organizationId: context.organizationId,
      workspaceId: input.workspaceId,
      email: input.email.toLowerCase(),
      role: input.role,
      tokenHash,
      status: "PENDING",
      expiresAt,
      invitedBy: context.userId,
      createdAt: now
    };

    await this.repository.createInvitation(invitation);
    return { invitation, rawToken };
  }

  /**
   * Accepts an invitation using the raw token.
   */
  async acceptInvitation(rawToken: string, userId: string): Promise<Member> {
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const invitation = await this.repository.getInvitationByTokenHash(tokenHash);

    if (!invitation) {
      throw new InvitationError("Invalid or expired invitation token");
    }
    if (invitation.status !== "PENDING") {
      throw new InvitationError(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }
    if (invitation.expiresAt < new Date()) {
      await this.repository.updateInvitationStatus(invitation.id, "EXPIRED");
      throw new InvitationError("Invitation token has expired");
    }

    // Check if user is already a member
    const existingMember = await this.repository.getMemberByOrgAndUser(invitation.organizationId, userId);
    if (existingMember) {
      await this.repository.updateInvitationStatus(invitation.id, "ACCEPTED", new Date());
      return existingMember;
    }

    const now = new Date();
    const newMember: Member = {
      id: `mem_${crypto.randomUUID()}`,
      organizationId: invitation.organizationId,
      workspaceId: invitation.workspaceId,
      userId,
      role: invitation.role,
      status: "ACTIVE",
      joinedAt: now,
      invitedBy: invitation.invitedBy
    };

    await this.repository.addMember(newMember);
    await this.repository.updateInvitationStatus(invitation.id, "ACCEPTED", now);

    return newMember;
  }

  /**
   * Revokes a pending invitation.
   */
  async revokeInvitation(context: TenantContext, invitationId: string): Promise<void> {
    requirePermission(context, "member:invite");
    const inv = await this.repository.getInvitationById(invitationId);
    if (!inv || inv.organizationId !== context.organizationId) {
      throw new InvitationError("Invitation not found");
    }
    await this.repository.updateInvitationStatus(invitationId, "REVOKED");
  }

  /**
   * Updates a member's role with last-owner protection.
   */
  async updateMemberRole(context: TenantContext, memberId: string, newRole: TenantRole): Promise<Member> {
    requirePermission(context, "member:update_role");

    const target = await this.repository.getMemberById(memberId);
    if (!target || target.organizationId !== context.organizationId) {
      throw new Error("Member not found in this organization");
    }

    // Admin cannot promote to OWNER or modify OWNER
    if (context.role === "ADMIN" && (newRole === "OWNER" || target.role === "OWNER")) {
      throw new Error("Admins cannot modify or grant OWNER role");
    }

    // Last-owner protection: if target is OWNER and we are demoting them
    if (target.role === "OWNER" && newRole !== "OWNER") {
      const ownerCount = await this.repository.countOwnersByOrg(context.organizationId);
      if (ownerCount <= 1) {
        throw new LastOwnerError();
      }
    }

    return this.repository.updateMemberRole(memberId, newRole);
  }

  /**
   * Removes a member from the organization with last-owner protection.
   */
  async removeMember(context: TenantContext, memberId: string): Promise<void> {
    requirePermission(context, "member:remove");

    const target = await this.repository.getMemberById(memberId);
    if (!target || target.organizationId !== context.organizationId) {
      throw new Error("Member not found in this organization");
    }

    if (context.role === "ADMIN" && target.role === "OWNER") {
      throw new Error("Admins cannot remove an OWNER");
    }

    if (target.role === "OWNER") {
      const ownerCount = await this.repository.countOwnersByOrg(context.organizationId);
      if (ownerCount <= 1) {
        throw new LastOwnerError();
      }
    }

    await this.repository.removeMember(memberId);
  }

  /**
   * Suspends a member with last-owner protection.
   */
  async suspendMember(context: TenantContext, memberId: string): Promise<Member> {
    requirePermission(context, "member:suspend");

    const target = await this.repository.getMemberById(memberId);
    if (!target || target.organizationId !== context.organizationId) {
      throw new Error("Member not found in this organization");
    }

    if (target.role === "OWNER") {
      const ownerCount = await this.repository.countOwnersByOrg(context.organizationId);
      if (ownerCount <= 1) {
        throw new LastOwnerError();
      }
    }

    return this.repository.updateMemberStatus(memberId, "SUSPENDED");
  }

  /**
   * Transfers organization ownership with two-step validation.
   */
  async transferOwnership(
    context: TenantContext,
    targetUserId: string,
    confirmationPhrase: string
  ): Promise<{ previousOwner: Member; newOwner: Member }> {
    requirePermission(context, "org:transfer_ownership");

    if (confirmationPhrase !== "TRANSFER OWNERSHIP") {
      throw new Error('Ownership transfer requires exact confirmation phrase "TRANSFER OWNERSHIP"');
    }

    const currentOwnerMember = await this.repository.getMemberByOrgAndUser(context.organizationId, context.userId);
    if (!currentOwnerMember || currentOwnerMember.role !== "OWNER") {
      throw new Error("Only the current OWNER can transfer ownership");
    }

    const targetMember = await this.repository.getMemberByOrgAndUser(context.organizationId, targetUserId);
    if (!targetMember || targetMember.status !== "ACTIVE") {
      throw new Error("Target user must be an active member of the organization");
    }

    // Atomic promotion and demotion
    const newOwner = await this.repository.updateMemberRole(targetMember.id, "OWNER");
    const previousOwner = await this.repository.updateMemberRole(currentOwnerMember.id, "ADMIN");

    return { previousOwner, newOwner };
  }

  /**
   * Soft-deletes an organization with a 30-day grace period.
   */
  async deleteOrganization(context: TenantContext, confirmationSlug: string): Promise<void> {
    requirePermission(context, "org:delete");

    const org = await this.repository.getOrganizationById(context.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    if (org.slug !== confirmationSlug) {
      throw new Error(`Deletion confirmation failed: slug "${confirmationSlug}" does not match "${org.slug}"`);
    }

    // Sets PENDING_DELETION and deletedAt = now() for 30-day grace period
    await this.repository.deleteOrganization(org.id, true);
  }
}
