# REUSABLE CODE LIBRARY

> **Repository**: [https://github.com/sh15aa/Web-Reusable](https://github.com/sh15aa/Web-Reusable)  
> **Registry**: [`registry/modules.json`](./registry/modules.json) | [`registry/categories.json`](./registry/categories.json)  
> **Platform Standard**: [`core/PLATFORM_STANDARD.md`](./core/PLATFORM_STANDARD.md)

This repository contains production-ready, enterprise-grade reusable software modules for building SaaS applications, AI products, web platforms, and mobile backends.

---

## 1. CORE OPERATING PRINCIPLE

```
Existing Reusable Module  >  Existing Project Implementation  >  New Implementation
```

**Reuse first. Build second.**

Whenever an agent or developer is tasked with building or extending a feature:
1. **Search this repository & registry first** before writing any code.
2. **Inspect `registry/modules.json`** for a module that matches the capability.
3. **Read the module's documentation** (`docs/10_API_REFERENCE.md` or `docs/01_ARCHITECTURE.md`).
4. **Reuse the module directly** rather than recreating functionality from scratch.
5. If missing or incomplete, build the capability as an extension of an existing module or propose a new reusable module conforming to the Universal Platform Standard.

---

## 2. REPOSITORY ARCHITECTURE & MODULE MATRIX

The library consists of **33 standardized modules** organized into core domain categories:

| Category | Modules | Capabilities |
|---|---|---|
| **Foundation** | `core`, `tenancy`, `webhooks` | 40-dimension resilience, Crockford IDs, UnitOfWork, Idempotency, multi-tenant isolation, HMAC webhooks |
| **Security** | `auth`, `security`, `security-center`, `audit`, `compliance` | Unified OAuth/passwords/MFA, rate limiting, DDoS shield, SOC2/ISO dashboard, tamper-evident audit, GDPR/privacy |
| **Monetization** | `billing`, `metering` | Stripe/LemonSqueezy subscriptions, usage metering, credit ledger, invoices |
| **Data & Storage** | `database`, `storage`, `turso-storage`, `portability` | libSQL/Turso/Postgres migrations, S3/R2 asset storage, GDPR data takeout, automated backups |
| **AI Workflows** | `ai` | LLM streaming, prompt injection defense, token/cost accounting, agent worker queue |
| **Operations** | `admin`, `monitoring`, `maintenance`, `deployment`, `flags` | Super-admin console, uptime monitors, maintenance banners, canary deployments, feature flags |
| **UX & Frontend** | `search`, `settings`, `onboarding`, `i18n` | Command palette (Cmd+K), preference center, interactive tours, multi-language i18n |
| **Growth & SEO** | `seo`, `referral`, `experimentation`, `changelog`, `domains` | Dynamic OG images/sitemaps, affiliate links, A/B testing, in-app changelog, custom domain routing |
| **Comms & Support**| `notifications`, `support` | Multi-channel emails (Resend/Postmark), in-app notifications, support ticket widget |
| **Tools** | `dashboard` | Interactive testing studio and packager |

---

## 3. UNIVERSAL MODULE CONTRACT

Every module in this repository adheres to a strict, standardized anatomy:

```text
<module_name>/
├── schemas/        # Zod validation schemas (Single source of truth for inputs, outputs, models)
├── server/         # Pure domain logic, services, and repositories (zero framework lock-in)
├── client/         # Typed API client, hooks, and client-side utilities
├── components/     # Pre-built accessible React/Next.js UI components & modals
├── docs/           # 10 standard architectural docs (Architecture, Security, API, Env, etc.)
└── tests/          # Vitest unit, integration, and security test suites
```

### Universal Platform Invariants (Mandatory)
1. **Request Context**: Context propagation via `AsyncLocalStorage` (`core/observability`).
2. **Identity Strategy**: Time-ordered, enumeration-resistant Crockford Base32 IDs (`usr_`, `org_`, `tx_`, etc. via `core/ids`).
3. **Error Boundaries**: Sanitized user-safe responses. Never leak SQL traces, table names, or raw errors (`core/errors`).
4. **Idempotency**: All mutation endpoints support `Idempotency-Key` tracking (`core/idempotency`).
5. **Multi-Tenancy**: Every resource query is scoped by `tenantId` (`tenancy/`).

---

## 4. HOW EXTERNAL PROJECTS USE THIS LIBRARY

To use any module from this repository in another project or folder directly from GitHub:

### Option A: Using the Pull Script (Fastest)
```bash
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s <module-name> [destination-path]
```
*Example:*
```bash
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s auth src/modules/auth
```

### Option B: Using `npx degit`
```bash
npx degit sh15aa/Web-Reusable/<module-name> src/modules/<module-name>
```

### Option C: Using Git Sparse-Checkout
```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/sh15aa/Web-Reusable.git temp-reusable
cd temp-reusable
git sparse-checkout set <module-name>
cp -r <module-name> ../src/modules/
cd .. && rm -rf temp-reusable
```

---

## 5. AGENT RULES FOR MODIFYING OR ADDING MODULES

When an AI agent is working inside this library:
1. **Never break existing public APIs** without documenting migration steps in `docs/10_API_REFERENCE.md`.
2. **Always update `registry/modules.json`** whenever adding, renaming, or extending module capabilities.
3. **Maintain 100% test coverage** for new business logic using `pnpm test`.
4. **Never hardcode secrets**; reference environment variable schemas in `schemas/`.
5. **No unnecessary dependencies**: Rely on `@libsql/client`, `zod`, `react`, and native Web standard APIs wherever possible.
