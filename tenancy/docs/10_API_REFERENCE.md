# 10 — Multi-Tenancy API Reference

## 1. TenancyService Methods
- `createOrganization(userId: string, input: CreateOrganizationInput): Promise<{ org: Organization; member: Member }>`
- `createWorkspace(context: TenantContext, input: CreateWorkspaceInput): Promise<Workspace>`
- `inviteMember(context: TenantContext, input: InviteMemberInput): Promise<{ invitation: Invitation; rawToken: string }>`
- `acceptInvitation(rawToken: string, userId: string): Promise<Member>`
- `revokeInvitation(context: TenantContext, invitationId: string): Promise<void>`
- `updateMemberRole(context: TenantContext, memberId: string, role: TenantRole): Promise<Member>`
- `removeMember(context: TenantContext, memberId: string): Promise<void>`
- `suspendMember(context: TenantContext, memberId: string): Promise<Member>`
- `transferOwnership(context: TenantContext, targetUserId: string, confirmationPhrase: string): Promise<{ previousOwner: Member; newOwner: Member }>`
- `deleteOrganization(context: TenantContext, confirmationSlug: string): Promise<void>`

## 2. Permission APIs
- `can(context: TenantContext | Member, permission: TenantPermission): boolean`
- `canAccess(context: TenantContext | Member, resourceTenantId: string): boolean`
- `requirePermission(context: TenantContext | Member, permission: TenantPermission): void`
- `requireTenantAccess(context: TenantContext | Member, resourceTenantId: string): void`
- `tenantCacheKey(tenantId: string, resource: string, id: string): string`
- `createTenantJobContext(params): TenantJobContext`
