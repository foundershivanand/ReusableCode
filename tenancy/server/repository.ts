import type {
  Organization,
  Workspace,
  Member,
  Invitation,
  TenantRole,
  MemberStatus,
  InvitationStatus
} from "../schemas/index.js";

export interface TenancyRepository {
  // Organizations
  createOrganization(org: Organization): Promise<Organization>;
  getOrganizationById(id: string): Promise<Organization | null>;
  getOrganizationBySlug(slug: string): Promise<Organization | null>;
  getOrganizationByCustomDomain(customDomain: string): Promise<Organization | null>;
  updateOrganization(id: string, update: Partial<Organization>): Promise<Organization>;
  deleteOrganization(id: string, soft?: boolean): Promise<void>;

  // Workspaces
  createWorkspace(workspace: Workspace): Promise<Workspace>;
  getWorkspaceById(id: string): Promise<Workspace | null>;
  getWorkspaceBySlug(orgId: string, slug: string): Promise<Workspace | null>;
  listWorkspacesByOrg(orgId: string): Promise<Workspace[]>;
  updateWorkspace(id: string, update: Partial<Workspace>): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;

  // Members
  addMember(member: Member): Promise<Member>;
  getMemberById(id: string): Promise<Member | null>;
  getMemberByOrgAndUser(orgId: string, userId: string): Promise<Member | null>;
  getMemberByWorkspaceAndUser(workspaceId: string, userId: string): Promise<Member | null>;
  listMembersByOrg(orgId: string): Promise<Member[]>;
  listMembersByWorkspace(workspaceId: string): Promise<Member[]>;
  updateMemberRole(id: string, role: TenantRole): Promise<Member>;
  updateMemberStatus(id: string, status: MemberStatus): Promise<Member>;
  removeMember(id: string): Promise<void>;
  countOwnersByOrg(orgId: string): Promise<number>;

  // Invitations
  createInvitation(invitation: Invitation): Promise<Invitation>;
  getInvitationById(id: string): Promise<Invitation | null>;
  getInvitationByTokenHash(tokenHash: string): Promise<Invitation | null>;
  listPendingInvitationsByOrg(orgId: string): Promise<Invitation[]>;
  updateInvitationStatus(id: string, status: InvitationStatus, acceptedAt?: Date): Promise<Invitation>;
}

export class InMemoryTenancyRepository implements TenancyRepository {
  private organizations: Map<string, Organization> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private members: Map<string, Member> = new Map();
  private invitations: Map<string, Invitation> = new Map();

  // Organizations
  async createOrganization(org: Organization): Promise<Organization> {
    this.organizations.set(org.id, { ...org });
    return { ...org };
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    const org = this.organizations.get(id);
    if (!org || (org.deletedAt && org.status === "PENDING_DELETION" && Date.now() - org.deletedAt.getTime() > 30 * 24 * 60 * 60 * 1000)) {
      return null;
    }
    return { ...org };
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    for (const org of this.organizations.values()) {
      if (org.slug === slug && !org.deletedAt) {
        return { ...org };
      }
    }
    return null;
  }

  async getOrganizationByCustomDomain(customDomain: string): Promise<Organization | null> {
    for (const org of this.organizations.values()) {
      if (org.customDomain === customDomain && !org.deletedAt) {
        return { ...org };
      }
    }
    return null;
  }

  async updateOrganization(id: string, update: Partial<Organization>): Promise<Organization> {
    const org = this.organizations.get(id);
    if (!org) throw new Error(`Organization ${id} not found`);
    const updated: Organization = {
      ...org,
      ...update,
      updatedAt: new Date()
    };
    this.organizations.set(id, updated);
    return { ...updated };
  }

  async deleteOrganization(id: string, soft = true): Promise<void> {
    const org = this.organizations.get(id);
    if (!org) return;
    if (soft) {
      org.status = "PENDING_DELETION";
      org.deletedAt = new Date();
      org.updatedAt = new Date();
      this.organizations.set(id, org);
    } else {
      this.organizations.delete(id);
      // Cascade delete workspaces, members, invitations
      for (const [wsId, ws] of this.workspaces.entries()) {
        if (ws.organizationId === id) this.workspaces.delete(wsId);
      }
      for (const [mId, m] of this.members.entries()) {
        if (m.organizationId === id) this.members.delete(mId);
      }
      for (const [invId, inv] of this.invitations.entries()) {
        if (inv.organizationId === id) this.invitations.delete(invId);
      }
    }
  }

  // Workspaces
  async createWorkspace(workspace: Workspace): Promise<Workspace> {
    this.workspaces.set(workspace.id, { ...workspace });
    return { ...workspace };
  }

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    const ws = this.workspaces.get(id);
    return ws ? { ...ws } : null;
  }

  async getWorkspaceBySlug(orgId: string, slug: string): Promise<Workspace | null> {
    for (const ws of this.workspaces.values()) {
      if (ws.organizationId === orgId && ws.slug === slug) {
        return { ...ws };
      }
    }
    return null;
  }

  async listWorkspacesByOrg(orgId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values())
      .filter((ws) => ws.organizationId === orgId)
      .map((ws) => ({ ...ws }));
  }

  async updateWorkspace(id: string, update: Partial<Workspace>): Promise<Workspace> {
    const ws = this.workspaces.get(id);
    if (!ws) throw new Error(`Workspace ${id} not found`);
    const updated: Workspace = {
      ...ws,
      ...update,
      updatedAt: new Date()
    };
    this.workspaces.set(id, updated);
    return { ...updated };
  }

  async deleteWorkspace(id: string): Promise<void> {
    this.workspaces.delete(id);
    for (const [mId, m] of this.members.entries()) {
      if (m.workspaceId === id) this.members.delete(mId);
    }
  }

  // Members
  async addMember(member: Member): Promise<Member> {
    this.members.set(member.id, { ...member });
    return { ...member };
  }

  async getMemberById(id: string): Promise<Member | null> {
    const m = this.members.get(id);
    return m ? { ...m } : null;
  }

  async getMemberByOrgAndUser(orgId: string, userId: string): Promise<Member | null> {
    for (const m of this.members.values()) {
      if (m.organizationId === orgId && m.userId === userId) {
        return { ...m };
      }
    }
    return null;
  }

  async getMemberByWorkspaceAndUser(workspaceId: string, userId: string): Promise<Member | null> {
    for (const m of this.members.values()) {
      if (m.workspaceId === workspaceId && m.userId === userId) {
        return { ...m };
      }
    }
    return null;
  }

  async listMembersByOrg(orgId: string): Promise<Member[]> {
    return Array.from(this.members.values())
      .filter((m) => m.organizationId === orgId)
      .map((m) => ({ ...m }));
  }

  async listMembersByWorkspace(workspaceId: string): Promise<Member[]> {
    return Array.from(this.members.values())
      .filter((m) => m.workspaceId === workspaceId)
      .map((m) => ({ ...m }));
  }

  async updateMemberRole(id: string, role: TenantRole): Promise<Member> {
    const m = this.members.get(id);
    if (!m) throw new Error(`Member ${id} not found`);
    const updated: Member = { ...m, role };
    this.members.set(id, updated);
    return { ...updated };
  }

  async updateMemberStatus(id: string, status: MemberStatus): Promise<Member> {
    const m = this.members.get(id);
    if (!m) throw new Error(`Member ${id} not found`);
    const updated: Member = { ...m, status };
    this.members.set(id, updated);
    return { ...updated };
  }

  async removeMember(id: string): Promise<void> {
    this.members.delete(id);
  }

  async countOwnersByOrg(orgId: string): Promise<number> {
    let count = 0;
    for (const m of this.members.values()) {
      if (m.organizationId === orgId && m.role === "OWNER" && m.status === "ACTIVE") {
        count++;
      }
    }
    return count;
  }

  // Invitations
  async createInvitation(invitation: Invitation): Promise<Invitation> {
    this.invitations.set(invitation.id, { ...invitation });
    return { ...invitation };
  }

  async getInvitationById(id: string): Promise<Invitation | null> {
    const inv = this.invitations.get(id);
    return inv ? { ...inv } : null;
  }

  async getInvitationByTokenHash(tokenHash: string): Promise<Invitation | null> {
    for (const inv of this.invitations.values()) {
      if (inv.tokenHash === tokenHash) {
        return { ...inv };
      }
    }
    return null;
  }

  async listPendingInvitationsByOrg(orgId: string): Promise<Invitation[]> {
    return Array.from(this.invitations.values())
      .filter((inv) => inv.organizationId === orgId && inv.status === "PENDING")
      .map((inv) => ({ ...inv }));
  }

  async updateInvitationStatus(id: string, status: InvitationStatus, acceptedAt?: Date): Promise<Invitation> {
    const inv = this.invitations.get(id);
    if (!inv) throw new Error(`Invitation ${id} not found`);
    const updated: Invitation = {
      ...inv,
      status,
      ...(acceptedAt ? { acceptedAt } : {})
    };
    this.invitations.set(id, updated);
    return { ...updated };
  }
}
