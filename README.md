# Personal Product Factory — Unified Master Reusable Code Library

> Production-grade, battle-tested software modules designed for autonomous AI agents and engineering teams to build Web Apps, Conversational Bots, AI Agents, and Mobile Apps 10x faster.

[![Repository](https://img.shields.io/badge/GitHub-sh15aa%2FReusable-blue.svg)](https://github.com/sh15aa/Web-Reusable)
[![Modules](https://img.shields.io/badge/Modules-263%20Standardized-green.svg)](./registry/modules.json)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Live%20Build-orange.svg)](https://reusable-dpy.pages.dev/)
[![Domains](https://img.shields.io/badge/Domains-Web%20|%20Bots%20|%20Agents%20|%20Apps-purple.svg)](./registry/categories.json)

---

## 🚀 Quick Navigation

- **[AGENTS.md](./AGENTS.md)** — Core operating directives for autonomous AI coding agents.
- **[registry/modules.json](./registry/modules.json)** — Master catalog of all 263 modules across 4 domains.
- **[registry/categories.json](./registry/categories.json)** — Cross-domain category and capability index.
- **[Cloudflare Live Portal](https://reusable-dpy.pages.dev/)** — Live interactive explorer and documentation viewer.
- **Domain Registries**:
  - `web` (33): [`registry/web.json`](./registry/web.json)
  - `bots` (27): [`registry/bots.json`](./registry/bots.json)
  - `agents` (40): [`registry/agents.json`](./registry/agents.json)
  - `apps` (163): [`registry/apps.json`](./registry/apps.json)

---

## 🏛 Four Core Reusable Domains (263 Modules)

```text
reusable/
├── web/            # 33 Web Modules (Next.js, React, Node.js, TypeScript)
├── bots/           # 27 Conversational Bot Modules (FastAPI, Python, Redis, ARQ)
├── agents/         # 40 Autonomous AI Agent Modules (Multi-Agent Factory, Typer, Tools)
├── apps/           # 163 Mobile Modules (Flutter, Dart, Offline-First, 1M Scale)
├── registry/       # Unified & domain-specific registries
├── scripts/        # Universal pull scripts, fetchers, and PDF generators
└── site/           # Cloudflare Pages build artifacts and interactive explorer
```

### 1. Web Applications (`web/` — 33 Modules)
Enterprise SaaS building blocks with 40-dimension resilience, Crockford Base32 IDs, UnitOfWork, Idempotency, and Tenant Isolation.
- **Foundation**: `core`, `tenancy`, `webhooks`
- **Security**: `auth`, `security`, `security-center`, `audit`, `compliance`
- **Monetization**: `billing`, `metering`
- **Data & Storage**: `database`, `storage`, `turso-storage`, `portability`
- **AI Workflows**: `ai`
- **Operations**: `admin`, `monitoring`, `maintenance`, `deployment`, `flags`
- **UX & Frontend**: `search`, `settings`, `onboarding`, `i18n`
- **Growth & SEO**: `seo`, `referral`, `experimentation`, `changelog`, `domains`
- **Communications**: `notifications`, `support`

### 2. Conversational Bots (`bots/` — 27 Modules)
Production-grade multi-channel bot infrastructure and async task pipeline.
- **Adapters**: WhatsApp Cloud API, Telegram Bot API, Chatwoot Live Desk, Base Adapter
- **Protocols & Schemas**: UNMP (Unified Normalised Messaging Protocol), Chatwoot Webhooks
- **Engines & Routing**: FSM State Machine, Dynamic Flow Router, Human-Agent Handoff
- **Security Guardrails**: Atomic Redis Sliding Rate Limiter, Anti-Loop Hash Detector, SSRF Media Guard
- **Async Execution**: ARQ Redis distributed background worker

### 3. Autonomous AI Agents (`agents/` — 40 Modules)
Full-stack agent factory with 10 architectural layers.
- **Factory & Identity**: Master Agent Factory, Identity & Persona configuration
- **Memory Hierarchies**: Working Memory, Conversation Context, Episodic Memory, Semantic RAG
- **Tool Sandbox**: Secure Python execution, Browser automation, File tools, Web search
- **Orchestration**: Multi-agent collaboration, Event bus, Sequential/Parallel Workflow planners
- **Evaluation**: Golden datasets, Automated LLM Judge, Regression test harness

### 4. Mobile Applications (`apps/` — 163 Modules)
Production-hardened Flutter and edge modules engineered for 1M scale.
- **Architecture & Auth**: Product Idea Engine, PKCE OAuth, Biometric tokens, Zero-trust tokens
- **Data & Design**: Offline-first Sync, Drift/SQLite, Hive, Responsive Design Tokens, Dark Mode
- **Operations & Scale**: Circuit breakers, Load shedding, Rate limiting matrix, Replay guards

---

## 📦 Universal Module Fetcher

Pull any module from any domain into your external project directly from GitHub with one command:

```bash
# Web module
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s auth src/modules/auth

# Conversational bot adapter
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s bots/app/adapters/telegram.py ./bots/telegram.py

# AI Agent factory
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s agents/agent_factory ./lib/agent_factory

# Mobile application module
curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s apps/modules/mod_01_product_idea_engine ./packages/idea_engine
```

---

## 🧪 Testing
```bash
# Run web unit & security tests:
pnpm exec vitest run

# Run agent tests:
cd agents && pytest

# Run mobile scale tests:
cd apps && python3 -m unittest tests/test_1m_scale_and_security.py
```
