# Module 10: Authorization System

Enforces Zero-Trust authorization principles:
- The mobile app verifies claims locally for UI visibility, but server is always source of truth.
- RBAC role check: `UserRole.free`, `UserRole.subscriber`, `UserRole.admin`.
- Granular permissions: `Permission.createProject`, `Permission.exportData`, `Permission.accessAi`.
