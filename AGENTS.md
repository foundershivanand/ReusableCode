# UNIFIED REUSABLE CODE LIBRARY

> **Repository**: [https://github.com/sh15aa/Web-Reusable](https://github.com/sh15aa/Web-Reusable)  
> **Master Registry**: [`registry/modules.json`](./registry/modules.json) | [`registry/categories.json`](./registry/categories.json)  
> **Domain Registries**: [`registry/web.json`](./registry/web.json) | [`registry/bots.json`](./registry/bots.json) | [`registry/agents.json`](./registry/agents.json) | [`registry/apps.json`](./registry/apps.json)  
> **Platform Standard**: [`core/PLATFORM_STANDARD.md`](./core/PLATFORM_STANDARD.md)

This unified repository contains **263 production-ready, enterprise-grade reusable software modules** spanning four core software domains:
1. **Web Applications (33 modules)**: Next.js/React/Node.js enterprise SaaS building blocks.
2. **Conversational Bots (27 modules)**: Python/FastAPI/Redis WhatsApp, Telegram, Chatwoot, and async event engines.
3. **Autonomous AI Agents (40 modules)**: Multi-agent orchestration, cognitive memory, tool sandboxes, and LLM gateways.
4. **Mobile Applications (163 modules)**: Flutter/Dart/FastAPI client-side and edge modules hardened for 1M scale.

---

## 1. CORE OPERATING PRINCIPLE

```
Existing Reusable Module  >  Existing Project Implementation  >  New Implementation
```

**Reuse first. Build second.**

Whenever an agent or developer is tasked with building or extending a feature:
1. **Search this repository & master registry first** before writing any code.
2. **Inspect `registry/modules.json`** for a module that matches the capability across all 4 domains.
3. **Read the module's documentation** (`docs/10_API_REFERENCE.md` or `README.md`).
4. **Reuse the module directly** rather than recreating functionality from scratch.
5. If missing or incomplete, build the capability as an extension of an existing module conforming to the Universal Platform Standard.

---

## 2. REPOSITORY ARCHITECTURE & DOMAIN MATRIX

```text
reusable/
├── web/            # 33 Web Modules (Next.js, Node.js, TypeScript, React)
├── bots/           # 27 Conversational Bot Modules (FastAPI, Python, Redis, Arq)
├── agents/         # 40 Autonomous AI Agent Modules (Multi-Agent Factory, Evaluation, Tools)
├── apps/           # 163 Mobile Modules (Flutter, Dart, Offline Sync, 1M Scale)
├── registry/       # Master unified registry and domain-specific index files
├── scripts/        # Universal pull scripts, CLI fetchers, and PDF generators
└── site/           # Cloudflare build for the unified interactive explorer
```

| Domain | Modules | Framework | Key Capabilities |
|---|---|---|---|
| **Web Apps** (`web/`) | 33 | TypeScript / Next.js / React | 40-dimension resilience, Crockford IDs, UnitOfWork, Idempotency, Multi-tenant isolation, unified Auth, Stripe Billing, Tamper-evident Audit, DDoS shield |
| **Conversational Bots** (`bots/`) | 27 | Python / FastAPI / Redis | WhatsApp Cloud API, Telegram Bot API, Chatwoot CRM, UNMP protocol, FSM router, Redis sliding rate limiter, bot loop detector, SSRF media guard |
| **AI Agents** (`agents/`) | 40 | Python / Typer / LLM Gateway | Master Agent Factory, cognitive memory hierarchies, tool execution sandbox, planner/workflow engine, automated judge & regression suite |
| **Mobile Apps** (`apps/`) | 163 | Flutter / Dart / FastAPI | Offline-first sync, SQLite/Hive storage, biometric security, zero-trust token lifecycle, load shedding, circuit breakers, 1M user scale |

---

## 3. UNIVERSAL MODULE CONTRACT

### Web Modules Contract
```text
<module_name>/
├── schemas/        # Zod validation schemas
├── server/         # Pure domain logic, services, repositories
├── client/         # Typed API client, hooks
├── components/     # Pre-built accessible React/Next.js UI components
├── docs/           # Standard architectural docs
└── tests/          # Vitest test suites
```

### Universal Platform Invariants (Mandatory)
1. **Request Context**: Context propagation via `AsyncLocalStorage` (`core/observability`).
2. **Identity Strategy**: Time-ordered, enumeration-resistant Crockford Base32 IDs (`usr_`, `org_`, `tx_`, etc. via `core/ids`).
3. **Error Boundaries**: Sanitized user-safe responses. Never leak SQL traces, table names, or raw errors (`core/errors`).
4. **Idempotency**: All mutation endpoints support `Idempotency-Key` tracking (`core/idempotency`).
5. **Multi-Tenancy**: Every resource query is scoped by `tenantId` (`tenancy/`).

---

## 4. HOW EXTERNAL PROJECTS USE THIS LIBRARY

To pull any module from this unified repository into another project or folder directly from GitHub:

### Option A: Using the Universal Pull Script (Fastest)
```bash
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s <target-path> [destination-path]
```
*Examples:*
```bash
# Pull Web module:
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s auth src/modules/auth

# Pull Bot adapter:
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s bots/app/adapters/telegram.py ./bots/telegram.py

# Pull Agent factory:
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s agents/agent_factory ./lib/agent_factory

# Pull Mobile module:
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s apps/modules/mod_01_product_idea_engine ./packages/idea_engine
```

### Option B: Using Git Sparse-Checkout
```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/sh15aa/Web-Reusable.git temp-reusable
cd temp-reusable
git sparse-checkout set <path-or-folder>
cp -r <path-or-folder> ../destination/
cd .. && rm -rf temp-reusable
```

---

## 5. AGENT RULES FOR MODIFYING OR ADDING MODULES

When an AI agent is working inside this library:
1. **Never break existing public APIs** without documenting migration steps.
2. **Always update `registry/modules.json`** via `python3 scripts/build_unified_registry.py` whenever adding or modifying modules.
3. **Maintain 100% test coverage** for new business logic using `pnpm exec vitest run` or `pytest`.
4. **Never hardcode secrets**; reference environment variable schemas.
5. **Keep dependencies minimal and zero-lock-in**.
