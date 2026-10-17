# Personal Product Factory — Reusable Code Library

> Production-grade, battle-tested software modules designed for autonomous AI agents and modern engineering teams to build products 10x faster.

[![Repository](https://img.shields.io/badge/GitHub-sh15aa%2FReusable-blue.svg)](https://github.com/sh15aa/Reusable)
[![Registry](https://img.shields.io/badge/Modules-33%20Standardized-green.svg)](./registry/modules.json)
[![Platform Standard](https://img.shields.io/badge/Standard-40--Dimension%20Resilience-purple.svg)](./core/PLATFORM_STANDARD.md)

---

## 🚀 Quick Navigation

- **[AGENTS.md](./AGENTS.md)** — Core operating instructions for AI coding agents.
- **[registry/modules.json](./registry/modules.json)** — Machine-readable catalog of all 33 modules.
- **[registry/categories.json](./registry/categories.json)** — Category and capability breakdown.
- **[core/PLATFORM_STANDARD.md](./core/PLATFORM_STANDARD.md)** — Universal resilience, error handling, and transaction contracts.
- **[templates/PROJECT_AGENTS_TEMPLATE.md](./templates/PROJECT_AGENTS_TEMPLATE.md)** — Drop-in `AGENTS.md` for new applications.

---

## 📦 Using in Another Project / Folder

When building a new application in a different directory or repository, instruct your AI agent to reuse modules directly from GitHub.

### 1. Drop `AGENTS.md` into your new project
Copy [`templates/PROJECT_AGENTS_TEMPLATE.md`](./templates/PROJECT_AGENTS_TEMPLATE.md) into your new project root as `AGENTS.md`.

### 2. Pull Any Module with One Command
Any developer or AI agent can pull any module directly into a project without cloning the full repository:

```bash
# One-liner script pull:
curl -sSL https://raw.githubusercontent.com/sh15aa/Reusable/main/scripts/pull-module.sh | bash -s <module-name> src/modules/<module-name>

# Or using npx degit:
npx degit sh15aa/Reusable/<module-name> src/modules/<module-name>
```

*Example for Authentication & Billing:*
```bash
curl -sSL https://raw.githubusercontent.com/sh15aa/Reusable/main/scripts/pull-module.sh | bash -s auth src/modules/auth
curl -sSL https://raw.githubusercontent.com/sh15aa/Reusable/main/scripts/pull-module.sh | bash -s billing src/modules/billing
```

---

## 🏛 Module Catalog (33 Modules)

| Category | Modules | Key Capabilities |
|---|---|---|
| **Foundation** | `core`, `tenancy`, `webhooks` | 40-dimension resilience, Crockford IDs, UnitOfWork, Idempotency, tenant isolation, signed webhooks |
| **Security** | `auth`, `security`, `security-center`, `audit`, `compliance` | OAuth (Google/GitHub/Apple), Passwords, MFA, rate limits, DDoS shield, SOC2 dashboard, GDPR |
| **Monetization** | `billing`, `metering` | Stripe & LemonSqueezy subscriptions, customer portal, usage credit ledger, invoice generation |
| **Data & Storage** | `database`, `storage`, `turso-storage`, `portability` | Turso/libSQL/Postgres migrations, S3/R2 storage, pre-signed upload URLs, async JSON/CSV takeout |
| **AI Workflows** | `ai` | LLM streaming, prompt injection firewall, token/cost accounting, background queue |
| **Operations** | `admin`, `monitoring`, `maintenance`, `deployment`, `flags` | Super-admin console, user impersonation, synthetic health pings, maintenance banners, feature flags |
| **UX & Frontend** | `search`, `settings`, `onboarding`, `i18n` | Command palette (Cmd+K), preference center, interactive tours, multi-language i18n |
| **Growth & SEO** | `seo`, `referral`, `experimentation`, `changelog`, `domains` | Dynamic OG social cards, viral affiliate links, A/B testing, in-app changelog, custom domain routing |
| **Comms & Support**| `notifications`, `support` | Multi-channel emails (Resend/Postmark), in-app notifications, support ticket widget |
| **Tools** | `dashboard` | Interactive testing studio and packager |

---

## 🛠 Anatomy of Each Module

Every module is completely self-contained and adheres to a uniform structure:

```text
<module_name>/
├── schemas/        # Zod input/output validation schemas & types
├── server/         # Framework-agnostic server services, domain models & repositories
├── client/         # Typed frontend client SDK, React query hooks & helpers
├── components/     # Accessible React UI components (Tailwind-ready)
├── docs/           # Architecture, API Reference, Security, & Env Variables
└── tests/          # Unit & integration test suites (Vitest)
```

---

## 🧪 Testing Modules
```bash
pnpm install
pnpm test
```
