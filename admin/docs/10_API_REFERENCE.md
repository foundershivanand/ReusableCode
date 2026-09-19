# 10 — Admin API Reference

## 1. AdminService Methods
- `validateAdminSession(rawToken: string): Promise<{ admin: AdminUser; session: AdminSession }>`
- `assertAdminPermission(admin: AdminUser, action: AdminActionType): void`
- `executeAction(params): Promise<AdminAuditLog>`
- `startImpersonation(params): Promise<{ impersonationToken: string; expiresAt: Date; auditLog: AdminAuditLog }>`
- `activateBreakGlass(params): Promise<BreakGlassEvent>`
- `executeBulkAction(params): Promise<{ successful: string[]; failed: { id: string; error: string }[] }>`
- `getDashboardStats(admin: AdminUser): Promise<DashboardStats>`
- `listAuditLogs(admin: AdminUser, filter?): Promise<AdminAuditLog[]>`

## 2. Client SDK & Hooks
- `useAdminDashboard()`: `{ admin, stats, loading, error, refreshStats }`
- `useImpersonation()`: `{ isImpersonating, impersonatedUserId, startImpersonation, stopImpersonation }`
- `useAdminAuditLogs(filter)`: `{ logs, loading, error, refetch }`
