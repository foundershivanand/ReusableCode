# Universal Reusable Code Library — Project Architecture & Overview

## 1. Executive Overview

The **Personal Product Factory (Unified Reusable Code Library)** is an enterprise-grade multi-platform engineering monorepo containing **263 standardized, production-tested software modules** spanning four computing domains:
1. **Web SaaS Applications (`web/` & root)**: 33 TypeScript/Next.js/React enterprise building blocks.
2. **Conversational Bots (`bots/`)**: 27 Python/FastAPI/Redis omni-channel messaging & async task modules.
3. **Autonomous AI Agents (`agents/`)**: 40 Python/Typer/Pydantic agent factories, cognitive memory hierarchies, and LLM orchestration tools.
4. **Mobile Applications (`apps/`)**: 163 Flutter/Dart/FastAPI client-side and edge modules hardened for 1M user scale.

Additionally, the repository incorporates:
- **Turso Distributed LibSQL Edge Storage (`turso-storage/`)**: Local/embedded SQLite and remote Turso database engine with binary BLOB ingestion and SHA-256 deduplication.
- **Universal Interactive Explorer & CDN Portal (`site/` & `worker/`)**: Cloudflare Pages & Cloudflare Workers serving live documentation, interactive search, code previews, and binary downloads.
- **Master Unified Module Registry (`registry/`)**: Synchronized catalog (`modules.json`, `categories.json`, and domain indices `web.json`, `bots.json`, `agents.json`, `apps.json`).
- **Universal Cross-Project Fetcher (`scripts/pull-module.sh`)**: Zero-dependency local copy and GitHub sparse-checkout pull utility.

---

## 2. Monorepo Domain Architecture

```text
reusable/
├── core/                   # Dimension-0: Universal platform primitives, Crockford IDs, pipeline, crypto
├── [32 web modules]/      # Web SaaS modules (auth, billing, tenancy, storage, metering, flags, etc.)
├── web/                    # Canonical symlinks mapping web modules for unified fetchers
├── bots/                   # Conversational bot platform (WhatsApp, Telegram, Chatwoot, UNMP, FSM)
├── agents/                 # Full-stack AI agent factory (Memory, Tools, Orchestrator, Evaluation)
├── apps/                   # 163 Mobile modules (Offline sync, Drift/Hive, Zero-trust, 1M scale)
├── turso-storage/          # Embedded LibSQL storage service, CLI, JWT authentication, and REST API
├── registry/               # Master JSON indices and domain-specific registries
├── scripts/                # Unified registry builders, categories generator, universal pull script
├── site/                   # Static Cloudflare Pages web portal for registry exploration
├── worker/                 # Cloudflare Worker API edge proxy and registry server
├── dashboard/              # Interactive admin control plane and test runner
└── docs/                   # Architectural specifications, audits, and compliance documentation
```

---

## 3. Technology Matrix by Domain

| Dimension | Web SaaS Modules | Conversational Bots | AI Agent Factory | Mobile App Factory |
| :--- | :--- | :--- | :--- | :--- |
| **Language** | TypeScript (ES2022) | Python 3.12+ | Python 3.12+ | Dart 3.x / Python 3.12 |
| **Framework** | React 19, Node.js | FastAPI, Uvicorn | Typer, Pydantic 2 | Flutter 3.x, FastAPI |
| **Data Layer** | LibSQL / SQLite / Postgres | PostgreSQL, Redis | ChromaDB, SQLite, Memory | SQLite, Drift, Hive |
| **Messaging** | In-Memory Mutex, Webhooks | Redis PubSub, ARQ | Async Event Bus | WebSockets, Push (FCM/APNS) |
| **Security** | AES-256-GCM, Timing-Safe | HMAC-SHA256, SSRF Guard | Sandboxed Code Exec, Canaries | BOLA/BOPLA, Zero-Trust |
| **Testing** | Vitest 5.x, TypeScript strict | Pytest 9.x, Pytest-Asyncio | Pytest 9.x, AnyIO | Unittest, Benchmarks |

---

## 4. Cross-Module Communication & Contracts

### 4.1 Universal Request Pipeline (`core/pipeline/`)
All mutations pass through a standardized 9-stage pipeline:
1. **Trace Propagation**: Context attached via Node `AsyncLocalStorage`.
2. **Schema Ingestion**: Zod safe-parsing with sanitized issue mapping.
3. **Authentication**: Actor extraction and verification.
4. **Tenant Isolation**: Resource isolation scoped by `tenantId`.
5. **Authorization**: ABAC / RBAC engine evaluation (`core/authz/`).
6. **Rate Limiting**: Sliding-window counter with headers (`Retry-After`).
7. **Idempotency**: Execution mutex preventing duplicate transaction executions.
8. **Unit of Work**: Atomic transaction boundary with rollback support.
9. **Audit Trail**: Tamper-evident hash-chained activity emission.

### 4.2 Cross-Domain Protocol: UNMP (`bots/app/schemas/unmp.py`)
Normalizes incoming events from Meta WhatsApp Cloud API, Telegram Bot API, and Chatwoot into a uniform envelope:
```json
{
  "id": "uuid-v4",
  "channel": "whatsapp",
  "channel_message_id": "wamid.xxx",
  "channel_user_id": "+14155552671",
  "timestamp": 1710000000,
  "type": "text",
  "content": { "text": "Customer input" },
  "metadata": {}
}
```

---

## 5. Deployment & Runtime Infrastructure

1. **Vercel Edge Functions / Node Server**:
   - `vercel.json` configures rewrites to `/api` (backed by `turso-storage/server.ts`) and dashboard routing.
2. **Cloudflare Pages & Cloudflare Workers**:
   - `worker/` routes API requests, serves the 263-module catalog, and delivers instant code extracts.
   - `site/` static frontend deployed to `reusable-dpy.pages.dev`.
3. **Docker Compose & Distributed Workers**:
   - `bots/docker-compose.yml` orchestrates FastAPI, Redis, Postgres, and ARQ background task workers.
