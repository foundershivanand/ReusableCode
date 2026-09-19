# Module 01: API Reference & Integration Guide

## 1. Quick Start & Installation

Install dependencies into your product repository:

```bash
# Core dependencies
pnpm add zod react react-dom
pnpm add -D typescript vitest @types/node @types/react @types/react-dom
```

Copy the `auth/` directory into your project `src/auth/` or `lib/auth/`.

---

## 2. Server-Side Usage

### Initializing the Auth Service

```typescript
import {
  AuthService,
  InMemoryAuthRepository,
  PasswordService,
  SessionService,
  OAuthService,
} from "./auth/server/index.js";

// Initialize repository (PostgreSQL, SQLite, or InMemory)
const repo = new InMemoryAuthRepository();
const passwordService = new PasswordService();
const sessionService = new SessionService(repo);
const authService = new AuthService(repo, { passwordService, sessionService });
```

### Executing the 10-Step Pipeline on Endpoints

```typescript
import { ServerPipeline } from "./auth/server/index.js";
import { UserProfileUpdateSchema } from "./auth/schemas/index.js";

const pipeline = new ServerPipeline(sessionService, authService.getAuditLogger());

export async function handleUpdateProfile(rawRequest: any) {
  return pipeline.execute(rawRequest, {
    maxBodySizeBytes: 1024 * 64, // 64 KB limit
    inputSchema: UserProfileUpdateSchema,
    requireAuth: true,
    auditAction: "UPDATE_PROFILE",
    handler: async ({ user, validatedInput }) => {
      // Identity is authoritatively loaded from session: user.id
      const updated = await repo.updateUser(user.id, {
        name: validatedInput.name,
      });
      return { user: authService.sanitizeUser(updated) };
    },
  });
}
```

---

## 3. Frontend Client & React Integration

### Wrap Application with `<AuthProvider />`

```tsx
import React from "react";
import { AuthProvider } from "./auth/client/index.js";

export function App() {
  return (
    <AuthProvider>
      <YourAppRoutes />
    </AuthProvider>
  );
}
```

### Using Hooks & Components

```tsx
import React from "react";
import { useAuth, useSession, useMFA } from "./auth/client/index.js";
import { LoginForm, MFASetup, SessionManager } from "./auth/components/index.js";

export function SignInPage() {
  const { login } = useAuth();

  return (
    <LoginForm
      onSubmit={async (data) => {
        return login(data);
      }}
      onOAuth={(provider) => {
        window.location.href = `/api/auth/oauth/${provider}`;
      }}
    />
  );
}

export function SecuritySettingsPage() {
  const { user } = useAuth();
  const { sessions, revokeSession, logoutAll } = useSession();
  const { startSetup, confirmEnable } = useMFA();

  return (
    <div>
      <h2>Security Settings</h2>
      {!user?.mfaEnabled && (
        <MFASetup onStartSetup={startSetup} onConfirmSetup={confirmEnable} />
      )}
      <SessionManager
        sessions={sessions}
        onRevokeSession={revokeSession}
        onLogoutAll={logoutAll}
      />
    </div>
  );
}
```

---

## 4. Edge Cases & Handling

1. **Simultaneous Logins Across Multiple Devices**:
   - Each login generates a unique session token and session record.
   - Users can view and selectively revoke any device from `<SessionManager />`.
2. **Password Reset While Logged In Elsewhere**:
   - Executing a password reset immediately increments `user.sessionVersion` and revokes all existing sessions across all devices.
3. **MFA Clock Drift**:
   - Handled with a ±1 step (±30s) verification window. Replay protection prevents reusing the same step.
4. **OAuth Email Collisions**:
   - If an account exists with the same email, linking is rejected if the provider email is unverified to prevent account takeover.
