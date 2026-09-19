# 01 — Admin Dashboard & Operations Control Architecture

## 1. Overview
The Admin Dashboard provides a dedicated, completely independent operations control plane for this application. It does NOT assume or depend upon a multi-product portal; it manages this product's users, organizations, subscriptions, payments, jobs, and security settings.

## 2. Admin Authentication & Session Lifecycle
Admin sessions operate under significantly stricter constraints than standard customer sessions:
- **Inactivity Timeout**: 15 minutes of idle time automatically revokes or expires the session.
- **Absolute Session Lifetime**: 8 hours maximum, after which full reauthentication and MFA verification are mandatory.
- **MFA Enforcement**: All admin accounts require two-factor authentication before session tokens are issued.
- **Session Revocation**: Admins can immediately terminate all active sessions across devices.

## 3. RBAC Hierarchy
- `SUPER_ADMIN`: Full operational authority, including break-glass activation and destructive deletions.
- `SUPPORT_ADMIN`: User activation, suspension, user impersonation, and background job retries.
- `BILLING_ADMIN`: Payment refunds and organization billing suspensions.
- `READONLY_ADMIN`: Read-only telemetry, audit logs, and metrics viewing.
