# Module 01: Environment Variables Checklist & Schema

All environment variables must be validated at application startup using a strict schema.

```typescript
import { z } from "zod";

export const AuthEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  
  // Session & Security
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  
  // OAuth Providers (Optional depending on enabled providers)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  
  // Redis for Distributed Rate Limiting (Optional in single-node/dev)
  REDIS_URL: z.string().url().optional(),
});
```

## Environment Variables Matrix

| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `APP_URL` | Yes | Canonical origin of application | `https://app.product.com` |
| `SESSION_SECRET` | Yes | 32+ byte cryptographic secret | `a8f3b...` |
| `GOOGLE_CLIENT_ID` | If Google OAuth | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | If Google OAuth | Google OAuth Client Secret | `GOCSPX-xxx` |
| `GITHUB_CLIENT_ID` | If GitHub OAuth | GitHub OAuth Client ID | `Iv1.xxx` |
| `GITHUB_CLIENT_SECRET` | If GitHub OAuth | GitHub OAuth Client Secret | `ghs_xxx` |
| `REDIS_URL` | Optional | Redis connection for rate limits | `rediss://default:pwd@host:6379` |
