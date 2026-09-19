# Security: Environment & Deployment Management

## Secret Isolation
- Server secrets (`APP_SECRET`, `DATABASE_URL`, `API_KEY`) must never be prefixed with public client exposure tags (e.g. `NEXT_PUBLIC_`, `VITE_`).
- In-memory configuration dumps mask all sensitive fields to avoid accidental exposure in debug logs or UI tables.

## Secret Rotation Procedure
1. Set `PREVIOUS_APP_SECRET` to the current `APP_SECRET` value.
2. Generate a new 64-character random key for `APP_SECRET`.
3. Deploy new environment configuration.
4. Existing sessions or tokens signed with the previous key continue to authenticate successfully.
5. After session TTL expires (e.g. 7 days), unset `PREVIOUS_APP_SECRET`.
