// Generated data file for Cloudflare Worker
export const REGISTRY = {
  "name": "Personal Product Factory \u2014 Reusable Code Library",
  "version": "1.0.0",
  "repository": "https://github.com/sh15aa/Web-Reusable",
  "default_branch": "main",
  "total_modules": 33,
  "modules": [
    {
      "id": "ops.admin",
      "name": "Admin Operations Console",
      "category": "operations",
      "path": "admin",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Super-admin control center, user impersonation, system flags, audit oversight, and emergency controls.",
      "capabilities": [
        "user-impersonation",
        "system-controls",
        "audit-inspection",
        "tenant-management"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [
        "ADMIN_SECRET_KEY",
        "ENABLE_IMPERSONATION"
      ],
      "docs": "admin/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ai.infra",
      "name": "AI Infrastructure & LLM Workflows",
      "category": "ai",
      "path": "ai",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Enterprise AI runtime with streaming, prompt injection defense, token/cost accounting, and worker queue.",
      "capabilities": [
        "llm-streaming",
        "prompt-defense",
        "token-accounting",
        "job-queue",
        "cost-tracking"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "AI_COST_BUDGET_USD"
      ],
      "docs": "ai/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "analytics.events",
      "name": "Analytics & Event Tracking",
      "category": "data",
      "path": "analytics",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Real-time event logging, funnel analysis, custom product events, and privacy-preserving metrics aggregation.",
      "capabilities": [
        "event-tracking",
        "funnel-analysis",
        "time-series-metrics",
        "privacy-filtering"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "ANALYTICS_RETENTION_DAYS"
      ],
      "docs": "analytics/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "audit.trail",
      "name": "Audit Logs & Tamper-Evident Trail",
      "category": "security",
      "path": "audit",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Cryptographically verified activity logging, actor attribution, structured audit trail, and compliance export.",
      "capabilities": [
        "activity-stream",
        "tamper-evident-logs",
        "actor-attribution",
        "compliance-ready"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "AUDIT_SIGNING_KEY"
      ],
      "docs": "audit/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "auth.unified",
      "name": "Unified Authentication & Sessions",
      "category": "security",
      "path": "auth",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Production session management, secure passwords, Google/GitHub OAuth, MFA, and RBAC middleware.",
      "capabilities": [
        "session-auth",
        "google-oauth",
        "github-oauth",
        "password-hashing",
        "rbac-middleware",
        "csrf-protection"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [
        "SESSION_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET"
      ],
      "docs": "auth/docs/API.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "billing.subscriptions",
      "name": "Payments & Subscription Engine",
      "category": "monetization",
      "path": "billing",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Multi-provider payment gateway (Stripe/LemonSqueezy), recurring subscriptions, usage invoices, and checkout flows.",
      "capabilities": [
        "stripe-billing",
        "lemon-squeezy",
        "subscription-lifecycle",
        "usage-metering",
        "webhook-reconciliation"
      ],
      "dependencies": [
        "zod",
        "stripe"
      ],
      "env_vars": [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "LEMONSQUEEZY_API_KEY"
      ],
      "docs": "billing/docs/API.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "growth.changelog",
      "name": "Product Changelog & Roadmap",
      "category": "growth",
      "path": "changelog",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "In-app release announcements, release notes feed, feature roadmap, and subscriber email notifications.",
      "capabilities": [
        "in-app-releases",
        "public-roadmap",
        "version-tags",
        "email-broadcasts"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [],
      "docs": "changelog/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "compliance.legal",
      "name": "Legal & Compliance Suite",
      "category": "security",
      "path": "compliance",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "GDPR/CCPA privacy management, cookie consent banner, terms acceptance tracking, and data erasure requests.",
      "capabilities": [
        "gdpr-compliance",
        "cookie-consent",
        "terms-tracking",
        "data-erasure-requests"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [
        "DPO_EMAIL"
      ],
      "docs": "compliance/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "core.platform",
      "name": "Core Platform & Resilience Standards",
      "category": "foundation",
      "path": "core",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Universal 40-dimension platform foundation: AsyncLocalStorage context, Crockford IDs, UnitOfWork, Idempotency, and resilient errors.",
      "capabilities": [
        "error-handling",
        "crockford-ids",
        "idempotency-engine",
        "unit-of-work",
        "secrets-manager",
        "crypto-utils"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "APP_SECRET",
        "NODE_ENV"
      ],
      "docs": "core/docs",
      "has_tests": true,
      "has_client": false,
      "has_server": false,
      "has_components": false,
      "has_schemas": false
    },
    {
      "id": "tools.dashboard",
      "name": "Reusable Studio Dashboard",
      "category": "tools",
      "path": "dashboard",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Interactive testing studio and packager for exploring and bundling reusable modules.",
      "capabilities": [
        "module-studio",
        "bundle-packager",
        "api-tester"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "PORT"
      ],
      "docs": "dashboard/README.md",
      "has_tests": false,
      "has_client": false,
      "has_server": false,
      "has_components": false,
      "has_schemas": false
    },
    {
      "id": "data.database",
      "name": "Database Migrations & Disaster Recovery",
      "category": "data",
      "path": "database",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Migration manager, automated backups, point-in-time recovery, and multi-dialect connection pooling (libSQL, Postgres, SQLite).",
      "capabilities": [
        "migration-runner",
        "backup-automation",
        "snapshot-restore",
        "connection-pooling"
      ],
      "dependencies": [
        "zod",
        "@libsql/client"
      ],
      "env_vars": [
        "DATABASE_URL",
        "DATABASE_AUTH_TOKEN"
      ],
      "docs": "database/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ops.deployment",
      "name": "Environment & Canary Deployment Management",
      "category": "operations",
      "path": "deployment",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Multi-environment configuration, traffic shifting, canary rollouts, zero-downtime health verification, and rollback engine.",
      "capabilities": [
        "canary-rollouts",
        "health-probes",
        "traffic-shifting",
        "environment-promotion"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "DEPLOYMENT_ENV",
        "CANARY_PERCENTAGE"
      ],
      "docs": "deployment/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "growth.domains",
      "name": "Custom Domains & White-Label Routing",
      "category": "growth",
      "path": "domains",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Multi-tenant custom domain provisioning, CNAME verification, automated SSL certificate lifecycle, and edge routing.",
      "capabilities": [
        "custom-domains",
        "cname-validation",
        "ssl-lifecycle",
        "subdomain-routing"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "CLOUDFLARE_API_TOKEN",
        "APEX_DOMAIN"
      ],
      "docs": "domains/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "growth.ab-testing",
      "name": "A/B Testing & Experimentation Engine",
      "category": "growth",
      "path": "experimentation",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Statistically sound A/B experimentation, deterministic hashing, variant assignment, and conversion tracking.",
      "capabilities": [
        "variant-bucketing",
        "conversion-tracking",
        "feature-experiments",
        "significance-calc"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [],
      "docs": "experimentation/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ops.feature-flags",
      "name": "Feature Flags & Dynamic Config",
      "category": "operations",
      "path": "flags",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Dynamic feature switches, percentage rollouts, user attribute targeting, kill-switches, and zero-redeploy config updates.",
      "capabilities": [
        "feature-flags",
        "percentage-rollouts",
        "kill-switches",
        "attribute-targeting"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [],
      "docs": "flags/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ux.i18n",
      "name": "Internationalization & Translation Suite",
      "category": "ux",
      "path": "i18n",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Type-safe multi-language translations, locale detection, pluralization, currency/date formatting, and missing key fallbacks.",
      "capabilities": [
        "locale-detection",
        "type-safe-translations",
        "pluralization",
        "currency-formatting"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [
        "DEFAULT_LOCALE"
      ],
      "docs": "i18n/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ops.maintenance",
      "name": "Maintenance Mode & Incident Banners",
      "category": "operations",
      "path": "maintenance",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Emergency maintenance switch, scheduled downtime banners, bypass tokens for staff, and read-only mode enforcement.",
      "capabilities": [
        "maintenance-mode",
        "status-banners",
        "bypass-tokens",
        "read-only-guard"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "MAINTENANCE_BYPASS_TOKEN"
      ],
      "docs": "maintenance/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "monetization.metering",
      "name": "Usage Metering & Credit Ledger",
      "category": "monetization",
      "path": "metering",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "High-throughput usage aggregation, prepaid credit wallet, quota limits, and burst protection for API and compute consumption.",
      "capabilities": [
        "usage-metering",
        "credit-wallet",
        "quota-enforcement",
        "overage-billing"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [],
      "docs": "metering/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ops.monitoring",
      "name": "Product Health & Incident Monitoring",
      "category": "operations",
      "path": "monitoring",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Synthetic uptime pings, real-time error budget tracking, alerting webhooks, and public status page generation.",
      "capabilities": [
        "uptime-monitors",
        "sla-tracking",
        "incident-management",
        "status-page"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "OPS_ALERT_WEBHOOK_URL"
      ],
      "docs": "monitoring/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "comms.notifications",
      "name": "Notification Center & Transactional Emails",
      "category": "communications",
      "path": "notifications",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Multi-channel notifications (Transactional Email via Resend/Postmark, Webhooks, In-App Bell), user preference controls.",
      "capabilities": [
        "transactional-email",
        "in-app-notifications",
        "webhook-dispatch",
        "email-templates"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [
        "RESEND_API_KEY",
        "EMAIL_FROM"
      ],
      "docs": "notifications/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ux.onboarding",
      "name": "User Onboarding & Interactive Tours",
      "category": "ux",
      "path": "onboarding",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Interactive step-by-step checklists, guided tours, progress state persistence, and gamified onboarding milestones.",
      "capabilities": [
        "checklist-progress",
        "guided-tours",
        "onboarding-milestones",
        "dismissible-guides"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [],
      "docs": "onboarding/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "data.portability",
      "name": "Data Export, Import & GDPR Takeout",
      "category": "data",
      "path": "portability",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Asynchronous JSON/CSV data export generation, streaming data imports, validation checks, and user GDPR data portability.",
      "capabilities": [
        "async-data-export",
        "csv-import",
        "gdpr-takeout",
        "zip-generation"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [],
      "docs": "portability/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "growth.referrals",
      "name": "Affiliate & Viral Referral System",
      "category": "growth",
      "path": "referral",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Unique invite links, referral code generation, click-to-signup attribution, reward payouts, and tier progression.",
      "capabilities": [
        "referral-codes",
        "attribution-tracking",
        "reward-credits",
        "tier-incentives"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "REFERRAL_REWARD_AMOUNT_CENTS"
      ],
      "docs": "referral/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ux.search",
      "name": "Global Search & Command Palette",
      "category": "ux",
      "path": "search",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Spotlight-style command palette (Cmd+K), fuzzy search over entities, keyboard navigation, and indexed action catalog.",
      "capabilities": [
        "command-palette",
        "fuzzy-search",
        "keyboard-shortcuts",
        "quick-actions"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [],
      "docs": "search/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "security.shield",
      "name": "Rate Limiting & Threat Protection",
      "category": "security",
      "path": "security",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Token-bucket & sliding window rate limiters, IP blacklisting, DDoS mitigations, SQLi/XSS sanitization, and request signing.",
      "capabilities": [
        "sliding-window-rate-limit",
        "ip-firewall",
        "payload-sanitization",
        "honeypot-guards"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "SECURITY_RATE_LIMIT_MAX"
      ],
      "docs": "security/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "security.center",
      "name": "Security Posture & Compliance Dashboard",
      "category": "security",
      "path": "security-center",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "SOC2/ISO27001 readiness monitor, security health scoring, open vulnerability tracking, and automated posture reports.",
      "capabilities": [
        "posture-scoring",
        "soc2-checklist",
        "vulnerability-tracker",
        "security-dashboard"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [],
      "docs": "security-center/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "growth.seo",
      "name": "SEO, OpenGraph & Metadata Engine",
      "category": "growth",
      "path": "seo",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Dynamic Open Graph social card generation, structured JSON-LD schema builder, automatic sitemap.xml, and canonical tags.",
      "capabilities": [
        "opengraph-generator",
        "json-ld-schemas",
        "dynamic-sitemaps",
        "meta-tag-builder"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "SITE_URL"
      ],
      "docs": "seo/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "ux.settings",
      "name": "Settings & Workspace Preferences",
      "category": "ux",
      "path": "settings",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Multi-level settings engine (user profile, workspace configuration, billing preferences, developer keys) with schema validation.",
      "capabilities": [
        "profile-settings",
        "workspace-settings",
        "notification-prefs",
        "schema-validation"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [],
      "docs": "settings/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "data.storage",
      "name": "File Storage & Asset Pipeline",
      "category": "data",
      "path": "storage",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Provider-agnostic file storage (S3, Cloudflare R2, Local), secure pre-signed upload URLs, MIME verification, and thumbnail resizing.",
      "capabilities": [
        "s3-storage",
        "r2-storage",
        "presigned-urls",
        "mime-validation",
        "image-resizing"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "S3_BUCKET",
        "S3_REGION",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY"
      ],
      "docs": "storage/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "comms.support",
      "name": "Customer Support & Feedback System",
      "category": "communications",
      "path": "support",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Embeddable feedback modal, ticket management lifecycle, triage priorities, CSAT surveys, and Discord/Slack integrations.",
      "capabilities": [
        "feedback-widget",
        "ticket-lifecycle",
        "csat-ratings",
        "webhook-alerts"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [
        "SUPPORT_SLACK_WEBHOOK"
      ],
      "docs": "support/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "foundation.tenancy",
      "name": "Multi-Tenancy & Workspace Isolation",
      "category": "foundation",
      "path": "tenancy",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Strict tenant boundary enforcement, workspace switching, team invitations, member roles, and multi-tenant scoping.",
      "capabilities": [
        "workspace-isolation",
        "tenant-switching",
        "team-invitations",
        "role-delegation"
      ],
      "dependencies": [
        "zod",
        "react",
        "react-dom"
      ],
      "env_vars": [],
      "docs": "tenancy/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    },
    {
      "id": "data.turso-storage",
      "name": "Turso Distributed SQLite Storage Engine",
      "category": "data",
      "path": "turso-storage",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Distributed edge storage engine on libSQL / Turso, with built-in HTTP API, ingestion CLI, and web explorer UI.",
      "capabilities": [
        "libsql-client",
        "embedded-sqlite",
        "http-storage-api",
        "cli-tools",
        "web-explorer"
      ],
      "dependencies": [
        "zod",
        "@libsql/client"
      ],
      "env_vars": [
        "TURSO_DATABASE_URL",
        "TURSO_AUTH_TOKEN",
        "ADMIN_PASSWORD"
      ],
      "docs": "turso-storage/README.md",
      "has_tests": true,
      "has_client": false,
      "has_server": false,
      "has_components": false,
      "has_schemas": false
    },
    {
      "id": "foundation.webhooks",
      "name": "Webhook Engine & Developer API Keys",
      "category": "foundation",
      "path": "webhooks",
      "status": "stable",
      "framework": "Node.js / TypeScript / React / Next.js",
      "description": "Outbound webhook dispatcher with exponential backoff retries, HMAC-SHA256 signature verification, and developer API key hashing.",
      "capabilities": [
        "hmac-verification",
        "webhook-retries",
        "dead-letter-queue",
        "api-key-management"
      ],
      "dependencies": [
        "zod"
      ],
      "env_vars": [
        "WEBHOOK_SIGNING_SECRET"
      ],
      "docs": "webhooks/docs/10_API_REFERENCE.md",
      "has_tests": true,
      "has_client": true,
      "has_server": true,
      "has_components": true,
      "has_schemas": true
    }
  ]
};

export const CATEGORIES = {
  "total_categories": 10,
  "categories": {
    "operations": [
      {
        "id": "ops.admin",
        "name": "Admin Operations Console",
        "path": "admin",
        "description": "Super-admin control center, user impersonation, system flags, audit oversight, and emergency controls.",
        "capabilities": [
          "user-impersonation",
          "system-controls",
          "audit-inspection",
          "tenant-management"
        ]
      },
      {
        "id": "ops.deployment",
        "name": "Environment & Canary Deployment Management",
        "path": "deployment",
        "description": "Multi-environment configuration, traffic shifting, canary rollouts, zero-downtime health verification, and rollback engine.",
        "capabilities": [
          "canary-rollouts",
          "health-probes",
          "traffic-shifting",
          "environment-promotion"
        ]
      },
      {
        "id": "ops.feature-flags",
        "name": "Feature Flags & Dynamic Config",
        "path": "flags",
        "description": "Dynamic feature switches, percentage rollouts, user attribute targeting, kill-switches, and zero-redeploy config updates.",
        "capabilities": [
          "feature-flags",
          "percentage-rollouts",
          "kill-switches",
          "attribute-targeting"
        ]
      },
      {
        "id": "ops.maintenance",
        "name": "Maintenance Mode & Incident Banners",
        "path": "maintenance",
        "description": "Emergency maintenance switch, scheduled downtime banners, bypass tokens for staff, and read-only mode enforcement.",
        "capabilities": [
          "maintenance-mode",
          "status-banners",
          "bypass-tokens",
          "read-only-guard"
        ]
      },
      {
        "id": "ops.monitoring",
        "name": "Product Health & Incident Monitoring",
        "path": "monitoring",
        "description": "Synthetic uptime pings, real-time error budget tracking, alerting webhooks, and public status page generation.",
        "capabilities": [
          "uptime-monitors",
          "sla-tracking",
          "incident-management",
          "status-page"
        ]
      }
    ],
    "ai": [
      {
        "id": "ai.infra",
        "name": "AI Infrastructure & LLM Workflows",
        "path": "ai",
        "description": "Enterprise AI runtime with streaming, prompt injection defense, token/cost accounting, and worker queue.",
        "capabilities": [
          "llm-streaming",
          "prompt-defense",
          "token-accounting",
          "job-queue",
          "cost-tracking"
        ]
      }
    ],
    "data": [
      {
        "id": "analytics.events",
        "name": "Analytics & Event Tracking",
        "path": "analytics",
        "description": "Real-time event logging, funnel analysis, custom product events, and privacy-preserving metrics aggregation.",
        "capabilities": [
          "event-tracking",
          "funnel-analysis",
          "time-series-metrics",
          "privacy-filtering"
        ]
      },
      {
        "id": "data.database",
        "name": "Database Migrations & Disaster Recovery",
        "path": "database",
        "description": "Migration manager, automated backups, point-in-time recovery, and multi-dialect connection pooling (libSQL, Postgres, SQLite).",
        "capabilities": [
          "migration-runner",
          "backup-automation",
          "snapshot-restore",
          "connection-pooling"
        ]
      },
      {
        "id": "data.portability",
        "name": "Data Export, Import & GDPR Takeout",
        "path": "portability",
        "description": "Asynchronous JSON/CSV data export generation, streaming data imports, validation checks, and user GDPR data portability.",
        "capabilities": [
          "async-data-export",
          "csv-import",
          "gdpr-takeout",
          "zip-generation"
        ]
      },
      {
        "id": "data.storage",
        "name": "File Storage & Asset Pipeline",
        "path": "storage",
        "description": "Provider-agnostic file storage (S3, Cloudflare R2, Local), secure pre-signed upload URLs, MIME verification, and thumbnail resizing.",
        "capabilities": [
          "s3-storage",
          "r2-storage",
          "presigned-urls",
          "mime-validation",
          "image-resizing"
        ]
      },
      {
        "id": "data.turso-storage",
        "name": "Turso Distributed SQLite Storage Engine",
        "path": "turso-storage",
        "description": "Distributed edge storage engine on libSQL / Turso, with built-in HTTP API, ingestion CLI, and web explorer UI.",
        "capabilities": [
          "libsql-client",
          "embedded-sqlite",
          "http-storage-api",
          "cli-tools",
          "web-explorer"
        ]
      }
    ],
    "security": [
      {
        "id": "audit.trail",
        "name": "Audit Logs & Tamper-Evident Trail",
        "path": "audit",
        "description": "Cryptographically verified activity logging, actor attribution, structured audit trail, and compliance export.",
        "capabilities": [
          "activity-stream",
          "tamper-evident-logs",
          "actor-attribution",
          "compliance-ready"
        ]
      },
      {
        "id": "auth.unified",
        "name": "Unified Authentication & Sessions",
        "path": "auth",
        "description": "Production session management, secure passwords, Google/GitHub OAuth, MFA, and RBAC middleware.",
        "capabilities": [
          "session-auth",
          "google-oauth",
          "github-oauth",
          "password-hashing",
          "rbac-middleware",
          "csrf-protection"
        ]
      },
      {
        "id": "compliance.legal",
        "name": "Legal & Compliance Suite",
        "path": "compliance",
        "description": "GDPR/CCPA privacy management, cookie consent banner, terms acceptance tracking, and data erasure requests.",
        "capabilities": [
          "gdpr-compliance",
          "cookie-consent",
          "terms-tracking",
          "data-erasure-requests"
        ]
      },
      {
        "id": "security.shield",
        "name": "Rate Limiting & Threat Protection",
        "path": "security",
        "description": "Token-bucket & sliding window rate limiters, IP blacklisting, DDoS mitigations, SQLi/XSS sanitization, and request signing.",
        "capabilities": [
          "sliding-window-rate-limit",
          "ip-firewall",
          "payload-sanitization",
          "honeypot-guards"
        ]
      },
      {
        "id": "security.center",
        "name": "Security Posture & Compliance Dashboard",
        "path": "security-center",
        "description": "SOC2/ISO27001 readiness monitor, security health scoring, open vulnerability tracking, and automated posture reports.",
        "capabilities": [
          "posture-scoring",
          "soc2-checklist",
          "vulnerability-tracker",
          "security-dashboard"
        ]
      }
    ],
    "monetization": [
      {
        "id": "billing.subscriptions",
        "name": "Payments & Subscription Engine",
        "path": "billing",
        "description": "Multi-provider payment gateway (Stripe/LemonSqueezy), recurring subscriptions, usage invoices, and checkout flows.",
        "capabilities": [
          "stripe-billing",
          "lemon-squeezy",
          "subscription-lifecycle",
          "usage-metering",
          "webhook-reconciliation"
        ]
      },
      {
        "id": "monetization.metering",
        "name": "Usage Metering & Credit Ledger",
        "path": "metering",
        "description": "High-throughput usage aggregation, prepaid credit wallet, quota limits, and burst protection for API and compute consumption.",
        "capabilities": [
          "usage-metering",
          "credit-wallet",
          "quota-enforcement",
          "overage-billing"
        ]
      }
    ],
    "growth": [
      {
        "id": "growth.changelog",
        "name": "Product Changelog & Roadmap",
        "path": "changelog",
        "description": "In-app release announcements, release notes feed, feature roadmap, and subscriber email notifications.",
        "capabilities": [
          "in-app-releases",
          "public-roadmap",
          "version-tags",
          "email-broadcasts"
        ]
      },
      {
        "id": "growth.domains",
        "name": "Custom Domains & White-Label Routing",
        "path": "domains",
        "description": "Multi-tenant custom domain provisioning, CNAME verification, automated SSL certificate lifecycle, and edge routing.",
        "capabilities": [
          "custom-domains",
          "cname-validation",
          "ssl-lifecycle",
          "subdomain-routing"
        ]
      },
      {
        "id": "growth.ab-testing",
        "name": "A/B Testing & Experimentation Engine",
        "path": "experimentation",
        "description": "Statistically sound A/B experimentation, deterministic hashing, variant assignment, and conversion tracking.",
        "capabilities": [
          "variant-bucketing",
          "conversion-tracking",
          "feature-experiments",
          "significance-calc"
        ]
      },
      {
        "id": "growth.referrals",
        "name": "Affiliate & Viral Referral System",
        "path": "referral",
        "description": "Unique invite links, referral code generation, click-to-signup attribution, reward payouts, and tier progression.",
        "capabilities": [
          "referral-codes",
          "attribution-tracking",
          "reward-credits",
          "tier-incentives"
        ]
      },
      {
        "id": "growth.seo",
        "name": "SEO, OpenGraph & Metadata Engine",
        "path": "seo",
        "description": "Dynamic Open Graph social card generation, structured JSON-LD schema builder, automatic sitemap.xml, and canonical tags.",
        "capabilities": [
          "opengraph-generator",
          "json-ld-schemas",
          "dynamic-sitemaps",
          "meta-tag-builder"
        ]
      }
    ],
    "foundation": [
      {
        "id": "core.platform",
        "name": "Core Platform & Resilience Standards",
        "path": "core",
        "description": "Universal 40-dimension platform foundation: AsyncLocalStorage context, Crockford IDs, UnitOfWork, Idempotency, and resilient errors.",
        "capabilities": [
          "error-handling",
          "crockford-ids",
          "idempotency-engine",
          "unit-of-work",
          "secrets-manager",
          "crypto-utils"
        ]
      },
      {
        "id": "foundation.tenancy",
        "name": "Multi-Tenancy & Workspace Isolation",
        "path": "tenancy",
        "description": "Strict tenant boundary enforcement, workspace switching, team invitations, member roles, and multi-tenant scoping.",
        "capabilities": [
          "workspace-isolation",
          "tenant-switching",
          "team-invitations",
          "role-delegation"
        ]
      },
      {
        "id": "foundation.webhooks",
        "name": "Webhook Engine & Developer API Keys",
        "path": "webhooks",
        "description": "Outbound webhook dispatcher with exponential backoff retries, HMAC-SHA256 signature verification, and developer API key hashing.",
        "capabilities": [
          "hmac-verification",
          "webhook-retries",
          "dead-letter-queue",
          "api-key-management"
        ]
      }
    ],
    "tools": [
      {
        "id": "tools.dashboard",
        "name": "Reusable Studio Dashboard",
        "path": "dashboard",
        "description": "Interactive testing studio and packager for exploring and bundling reusable modules.",
        "capabilities": [
          "module-studio",
          "bundle-packager",
          "api-tester"
        ]
      }
    ],
    "ux": [
      {
        "id": "ux.i18n",
        "name": "Internationalization & Translation Suite",
        "path": "i18n",
        "description": "Type-safe multi-language translations, locale detection, pluralization, currency/date formatting, and missing key fallbacks.",
        "capabilities": [
          "locale-detection",
          "type-safe-translations",
          "pluralization",
          "currency-formatting"
        ]
      },
      {
        "id": "ux.onboarding",
        "name": "User Onboarding & Interactive Tours",
        "path": "onboarding",
        "description": "Interactive step-by-step checklists, guided tours, progress state persistence, and gamified onboarding milestones.",
        "capabilities": [
          "checklist-progress",
          "guided-tours",
          "onboarding-milestones",
          "dismissible-guides"
        ]
      },
      {
        "id": "ux.search",
        "name": "Global Search & Command Palette",
        "path": "search",
        "description": "Spotlight-style command palette (Cmd+K), fuzzy search over entities, keyboard navigation, and indexed action catalog.",
        "capabilities": [
          "command-palette",
          "fuzzy-search",
          "keyboard-shortcuts",
          "quick-actions"
        ]
      },
      {
        "id": "ux.settings",
        "name": "Settings & Workspace Preferences",
        "path": "settings",
        "description": "Multi-level settings engine (user profile, workspace configuration, billing preferences, developer keys) with schema validation.",
        "capabilities": [
          "profile-settings",
          "workspace-settings",
          "notification-prefs",
          "schema-validation"
        ]
      }
    ],
    "communications": [
      {
        "id": "comms.notifications",
        "name": "Notification Center & Transactional Emails",
        "path": "notifications",
        "description": "Multi-channel notifications (Transactional Email via Resend/Postmark, Webhooks, In-App Bell), user preference controls.",
        "capabilities": [
          "transactional-email",
          "in-app-notifications",
          "webhook-dispatch",
          "email-templates"
        ]
      },
      {
        "id": "comms.support",
        "name": "Customer Support & Feedback System",
        "path": "support",
        "description": "Embeddable feedback modal, ticket management lifecycle, triage priorities, CSAT surveys, and Discord/Slack integrations.",
        "capabilities": [
          "feedback-widget",
          "ticket-lifecycle",
          "csat-ratings",
          "webhook-alerts"
        ]
      }
    ]
  }
};

export const PROMPTS = {
  audit: "# Principal Engineer Production-Readiness Audit Prompt\n\nYou are now the Principal Engineer performing a production-readiness\naudit of this reusable product module.\nDO NOT rewrite the entire project blindly.\nInspect every file.\nAudit:\n1. Architecture\n2. Type safety\n3. Authentication\n4. Authorization\n5. Tenant isolation\n6. Database design\n7. Transactions\n8. Race conditions\n9. Concurrency\n10. API security\n11. Input validation\n12. Output validation\n13. CSRF\n14. XSS\n15. SSRF\n16. SQL injection\n17. IDOR\n18. Privilege escalation\n19. Session security\n20. Token security\n21. Rate limiting\n22. File security\n23. Webhook security\n24. Payment idempotency\n25. AI security\n26. Prompt injection\n27. Secret leakage\n28. Logging\n29. Privacy\n30. Error handling\n31. Performance\n32. Caching\n33. Database indexes\n34. N+1 queries\n35. Background jobs\n36. Retry behavior\n37. Failure recovery\n38. Accessibility\n\n\f39. SEO\n40. Testing\n41. Deployment\n42. Environment variables\n43. Backup/recovery\n44. Dependency vulnerabilities\n45. Production configuration\nFor every problem found:\nSEVERITY:\nCRITICAL / HIGH / MEDIUM / LOW\nFILE:\nexact file\nPROBLEM:\nwhat is wrong\nRISK:\nwhat could happen\nFIX:\nspecific fix\nTEST:\nhow to verify the fix\nThen fix all CRITICAL and HIGH issues.\nFix MEDIUM issues where practical.\nDo not introduce unnecessary complexity.\nDo not replace working architecture merely for stylistic reasons.\nAfter fixing:\nrun tests\nrun type checking\nrun linting\nrun build\nrun security checks\nThen perform a second audit of the changed code.\nFinally produce:\n\n\f1. Architecture summary\n2. Security summary\n3. Performance summary\n4. Remaining risks\n5. Production deployment checklist\n6. Environment variable checklist\n7. Backup checklist\n8. Monitoring checklist\n9. Future improvements\nDo not claim \"100% secure\" or \"zero vulnerabilities\".\nThe goal is a defensible, production-grade implementation with clearly\nidentified remaining risks.\n",
  factory_spec: "# Personal Product Factory Module Specification Prompt\n\nYou are a Principal Software Architect, Staff+ Full-Stack Engineer,\nApplication Security Engineer, DevOps Engineer, Database Architect,\nSRE, QA Engineer and UI/UX Engineer.\nI am building a reusable production-grade module for my personal\nPRODUCT FACTORY.\nIMPORTANT ARCHITECTURAL RULE:\nThis module must be completely independent.\nIt must NOT assume that 50\u2013100 products live inside one centralized\napplication.\nEvery product I build will have:\n- its own repository\n- its own database\n- its own deployment\n- its own environment variables\n- its own users\n- its own authentication\n- its own billing\n- its own admin dashboard\n- its own analytics\n- its own product-specific data\nThis module is being designed as a reusable component that I can copy,\ninstall or adapt into each independent product.\n\n\fTherefore:\nDO NOT create a centralized multi-product SaaS platform.\nDO NOT create cross-product dependencies.\nDO NOT require another product to exist.\nDO NOT require a central database.\nDO NOT hard-code provider-specific business logic.\nMake the module self-contained, modular and portable.\nTECHNICAL QUALITY REQUIREMENTS:\n- TypeScript\n- strict type safety\n- production-ready architecture\n- secure by default\n- scalable\n- testable\n- maintainable\n- accessible\n- performant\n- observable\n- documented\n- graceful failure handling\n- idempotent where required\n- proper database constraints\n- proper indexes\n- transaction safety\n- input validation\n- authorization checks\n- rate limiting where appropriate\n- no secrets in source code\n- no sensitive information in logs\n- secure error handling\n- current stable dependencies\n- avoid abandoned packages\n- use official SDKs where possible\nBefore writing code:\n1. Inspect the existing repository.\n2. Understand the existing framework.\n3. Detect package manager.\n4. Detect database.\n\n\f5. Detect existing authentication.\n6. Detect existing UI system.\n7. Detect existing environment configuration.\n8. Reuse existing infrastructure where appropriate.\n9. Do not unnecessarily rewrite existing code.\n10. Do not introduce dependencies without justification.\nFirst produce an implementation architecture.\nThen implement it in small logical stages.\nAfter implementation:\n- run type checking\n- run linting\n- run unit tests\n- run integration tests where appropriate\n- run security checks\n- fix all errors\n- document installation\n- document configuration\n- document environment variables\n- document API usage\n- document edge cases\n- document deployment\nDo not claim something is production-ready unless the implementation\nand tests actually support that claim.\n\n01 \u2014 UNIFIED AUTHENTICATION & USER MANAGEMENT\nBuild a completely reusable authentication module.\nIt must support:\n- email/password\n- Google OAuth\n- GitHub OAuth\n- Apple OAuth\n- magic links\n- email verification\n- password reset\n- account recovery\n- MFA/2FA\n- session management\n- logout\n- logout all devices\n\n\f- session revocation\n- device/session listing\n- secure token handling\n- JWT/session abstraction where appropriate\nCreate reusable UI components:\n<LoginForm />\n<SignupForm />\n<MagicLinkForm />\n<OAuthButtons />\n<VerifyEmail />\n<ResetPassword />\n<MFASetup />\n<MFAChallenge />\n<UserProfile />\n<SessionManager />\nSecurity requirements:\n- secure password hashing\n- secure cookies\n- HttpOnly\n- Secure\n- appropriate SameSite\n- CSRF protection where applicable\n- brute-force protection\n- login rate limiting\n- account enumeration protection\n- secure token expiration\n- refresh-token rotation where applicable\n- session invalidation\n- secure OAuth state handling\n- PKCE where appropriate\n- prevent session fixation\n- prevent privilege escalation\nCreate clean interfaces so the underlying provider can later be changed.\nPossible providers:\n- Supabase Auth\n- Clerk\n- Auth.js\n- custom implementation\nDo not tightly couple application business logic to the provider.\n\n\fCreate:\nauth/\n\u251c\u2500\u2500 server/\n\u251c\u2500\u2500 client/\n\u251c\u2500\u2500 components/\n\u251c\u2500\u2500 middleware/\n\u251c\u2500\u2500 providers/\n\u251c\u2500\u2500 schemas/\n\u251c\u2500\u2500 tests/\n\u2514\u2500\u2500 docs/\nInclude complete tests for:\nsignup\nlogin\nlogout\nOAuth\nmagic link\npassword reset\nMFA\nsession expiration\nrevocation\nunauthorized access\nrate limiting\nCSRF\naccount enumeration.\n==================================================\nSERVER-SIDE VALIDATION \u2014 NON-NEGOTIABLE\n==================================================\nNEVER trust client-side validation.\nEvery authentication-related endpoint must independently validate\nall incoming data on the server.\nUse a strict schema-validation layer such as Zod or an equivalent\nwell-maintained validation library.\nValidate:\n- request body\n- query parameters\n- route parameters\n- headers where applicable\n- cookies\n- OAuth callback parameters\n\n\f- tokens\n- redirect URLs\n- MFA codes\n- password-reset tokens\n- invitation tokens\nCreate explicit schemas:\nSignupSchema\nLoginSchema\nMagicLinkSchema\nPasswordResetRequestSchema\nPasswordResetSchema\nMFASetupSchema\nMFAChallengeSchema\nOAuthCallbackSchema\nSessionSchema\nReject:\n- malformed input\n- unexpected fields where appropriate\n- oversized input\n- invalid types\n- invalid formats\n- expired tokens\n- revoked tokens\n- reused single-use tokens\n- invalid OAuth state\n- invalid redirect URLs\nNever rely on:\nHTML validation\nReact validation\nclient-side JavaScript validation\nTypeScript types alone\nhidden form fields\nfrontend authorization checks\nTypeScript types disappear at runtime and therefore DO NOT constitute\nserver-side validation.\n==================================================\nSERVER-SIDE AUTHORIZATION\n==================================================\nAuthentication and authorization are separate.\n\n\fAuthentication answers:\n\"Who is this user?\"\nAuthorization answers:\n\"Is this user allowed to perform this action?\"\nEvery protected server endpoint must perform both where applicable.\nExample:\nauthenticateRequest()\n\u2193\ngetAuthenticatedUser()\n\u2193\nrequirePermission()\n\u2193\nvalidateRequest()\n\u2193\nexecuteBusinessLogic()\nNever accept:\nuserId\norganizationId\nrole\npermissions\nsubscription status\nfrom the client as trusted values.\nDerive sensitive identity and authorization information from the\nauthenticated server-side session/database.\n==================================================\nSERVER-SIDE RESPONSE VALIDATION\n==================================================\nWhere appropriate, validate structured responses before returning\nthem to clients.\nNever accidentally return:\npassword hashes\nrefresh tokens\nprivate OAuth credentials\n\n\finternal secrets\nAPI keys\nsecurity-sensitive internal fields\nCreate explicit public response schemas.\nExample:\nPublicUserSchema\nrather than returning the complete database User object.\n==================================================\nAUTHENTICATION SECURITY TESTS\n==================================================\nCreate automated tests proving that:\n1. Invalid email is rejected server-side.\n2. Invalid password is rejected server-side.\n3. Missing fields are rejected.\n4. Unexpected/malicious input is rejected.\n5. Oversized requests are rejected.\n6. Expired sessions are rejected.\n7. Revoked sessions are rejected.\n8. Invalid JWTs are rejected.\n9. Modified JWT payloads are rejected.\n10. Invalid OAuth state is rejected.\n11. Invalid OAuth redirect is rejected.\n12. Expired password-reset tokens are rejected.\n13. Reused password-reset tokens are rejected.\n14. Invalid MFA codes are rejected.\n15. Excessive login attempts are rate limited.\n16. Unauthorized users cannot access protected routes.\n17. Users cannot modify another user's account.\n18. Users cannot modify their own role/permissions.\n19. Admin endpoints reject ordinary users.\n20. Sensitive authentication data never appears in API responses.\n21. Authentication failures do not leak whether an account exists\nwhere account enumeration protection is required.\n22. Session invalidation actually prevents further access.\n23. Logout invalidates the appropriate session.\n24. Logout-all-devices invalidates all applicable sessions.\n25. Password reset invalidates appropriate existing sessions.\nAdditional Requirements:\nIdentity lifecycle\nAccount state machine:\n\n\fPENDING_VERIFICATION\nACTIVE\nSUSPENDED\nLOCKED\nDEACTIVATED\nDELETED\nPrevent authentication when account state doesn't permit it.\nDistinguish:\ndisabled account\ndeleted account\nunverified account\ntemporarily locked account.\nAccount deletion should have a defined grace period if desired.\nRe-registration behavior for previously deleted emails must be explicitly defined.\nSession lifecycle\nRotate session identifier after authentication.\nRotate/revoke sessions after:\npassword change\nemail change\nMFA enrollment\nMFA removal\nsuspicious security event\nprivilege escalation.\nSession inactivity timeout.\nAbsolute session lifetime.\nSliding session expiration where appropriate.\nDetect impossible/stale sessions.\nSession version/revision mechanism for global invalidation.\nCookie security\nExplicitly enforce:\nHttpOnly\nSecure\nappropriate SameSite\nnarrowly scoped Domain\nnarrowly scoped Path\nexpiration/max-age.\nNever put authentication credentials in localStorage by default.\nPrevent session tokens from appearing in URLs.\nPassword security\nPassword strength policy based on configurable rules.\nPassword confirmation must be validated server-side.\nPassword change requires current-password verification where appropriate.\nPrevent reuse of recent passwords if desired.\nPassword breach detection integration should be provider-abstracted.\nNever log passwords.\nNever expose password hashes through serialization.\nPassword hashing configuration must be upgradeable.\nExisting hashes should be transparently rehashed when security parameters improve.\n\n\fEmail change security\nEmail change should be treated as a sensitive operation:\nauthenticate existing session\nreauthenticate if required\nverify new email\noptionally notify old email\ninvalidate/revoke pending old verification flows\nupdate identity atomically.\nPrevent email-change token reuse.\nAccount recovery\nRecovery needs its own threat model:\nrecovery-code generation\nrecovery-code hashing/storage\none-time recovery-code usage\nrecovery-code regeneration invalidates old codes\nrecovery-code rate limits\nrecovery attempts audit trail\nrecovery should not accidentally bypass MFA without an explicit recovery policy.\nMFA\nAdd:\nreplay prevention for MFA codes\nclock-drift handling\nrecovery codes\nrecovery-code hashing\nenrollment confirmation before activation\nMFA removal requiring stronger authentication\nnotification when MFA is changed\nsession invalidation after MFA changes\nprotection against repeatedly testing codes.\nOAuth\nExplicitly cover:\nstate\nnonce\nPKCE\nexact redirect URI validation\nprovider account linking attacks\nemail/account collision handling\nuntrusted profile fields\nprovider identity vs email identity distinction\nunlinking the final authentication provider must not lock the user out.\nOAuth account linking should require authenticated intent.\nEnumeration protection\nEnsure consistent behavior for:\nsignup\nlogin\npassword reset\nmagic link\nemail verification\n\n\faccount recovery.\nAvoid revealing whether an account exists where that matters.\nAuthentication abuse detection\nAdd:\nIP reputation signals\naccount-based throttling\ndevice/fingerprint signals where legally appropriate\nsuspicious login detection\nnew-device notification\nunusual-location notification\nsecurity-event escalation.\nDo not automatically lock accounts solely because of one noisy signal.\nAuthorization boundary\nCreate a formal server pipeline:\nParse request\n\u2192 Validate schema\n\u2192 Authenticate\n\u2192 Load authoritative identity\n\u2192 Resolve tenant/context\n\u2192 Authorize\n\u2192 Execute\n\u2192 Validate output\n\u2192 Audit\n\u2192 Respond\nThis should become a platform-wide standard, not just an Auth feature.\n\n02 \u2014 PAYMENT GATEWAY & SUBSCRIPTION ENGINE\nBuild a provider-independent billing system.\nSupport:\n- free plans\n- paid plans\n- subscriptions\n- one-time payments\n- trials\n- coupons\n- upgrades\n- downgrades\n- cancellation\n- scheduled cancellation\n- pause/resume\n- failed payments\n- refunds\n- invoices\n- taxes\n- billing portal\n\n\f- payment history\nCreate:\nBillingProvider\nand adapters for:\nStripe\nPaddle\nLemon Squeezy\nApplication code should use:\ngetSubscription()\nhasActivePlan()\nhasFeature()\ngetPlanLimit()\ncancelSubscription()\ncreateCheckout()\nNever expose provider-specific logic to application business logic.\nWebhook system must provide:\n- signature verification\n- idempotency\n- retries\n- replay protection\n- event persistence\n- event processing state\n- failure handling\n- audit logging\nPrevent:\ndouble subscription\ndouble crediting\ndouble refunds\nduplicate webhook processing\ntampered webhook requests\nCreate a minimal billing UI:\nPricing\nCheckout\nSubscription\nBilling Portal\n\n\fInvoices\nPayment History\nFinancial state machine\nDefine explicit states for:\npayment\ninvoice\nsubscription\nrefund\ndispute\nchargeback\npayment method.\nNever infer financial state merely from the frontend.\nMoney representation\nNever use floating-point arithmetic for money.\nStore integer minor units where appropriate.\nStore currency explicitly.\nHandle zero-decimal currencies.\nHandle currency conversion separately from transaction amount.\nPreserve original transaction currency.\nPrice immutability\nHistorical invoices must retain the price/tax/discount values that existed when purchased.\nNever dynamically recalculate an old invoice from the current plan configuration.\nSubscription race conditions\nHandle simultaneous:\nupgrade + cancellation\ncancellation + renewal\npayment + downgrade\nwebhook + user action\nduplicate webhook deliveries\ndelayed webhooks arriving out of order.\nWebhook ordering\nEvents may arrive:\nEvent B\nEvent A\nEvent B again\nDo not assume chronological delivery.\nMaintain:\nevent IDs\nevent timestamps\nprovider object versions where available\nprocessed-event records\nstate reconciliation.\nEntitlements\nSeparate:\nPayment status\n\u2193\nSubscription state\n\n\f\u2193\nProduct entitlement\nA product should not scatter:\nif paid === true\nthroughout the application.\nCreate an entitlement resolver.\nGrace periods\nDefine behavior for:\nfailed payment\nexpired card\ntemporary provider outage\ndisputed payment\ncanceled subscription\nexpired trial.\nTax\nAdd architecture for:\ntax-inclusive/exclusive pricing\nbilling address\ntax IDs\ntax calculation provider\ntax exemption\ninvoice tax snapshots.\nRefund consistency\nRefunding money must correctly update:\npayment state\nentitlement state if applicable\ninvoice state\nusage/credits if applicable\naffiliate commissions\naudit records.\nFinancial reconciliation\nAdd a reconciliation job comparing:\nInternal database\nvs\nPayment provider\nto detect drift.\nDouble fulfillment prevention\nNever grant:\ncredits\nsubscription access\ndownloads\nproduct entitlement\ntwice because two payment events race.\nBilling portal security\nPortal/session URLs must be:\ngenerated server-side\nshort-lived where appropriate\nassociated with the correct customer\n\n\fnever accepted directly from client input.\nInclude comprehensive tests.\n\n03 \u2014 MULTI-TENANCY & WORKSPACE MANAGEMENT\nBuild reusable workspace/team infrastructure.\nSupport:\n- organizations\n- workspaces\n- team members\n- invitations\n- roles\n- permissions\n- ownership transfer\n- member removal\n- role changes\nDefault roles:\nOWNER\nADMIN\nMEMBER\nVIEWER\nCreate permission APIs:\ncan()\ncanAccess()\nrequirePermission()\nEvery workspace-owned resource must support tenant isolation.\nNever trust workspace_id supplied directly by the client.\nAuthorization must happen server-side.\nPrevent:\nIDOR\ncross-tenant access\nprivilege escalation\nunauthorized role changes\nunauthorized workspace deletion\n\n\fCreate reusable UI:\nWorkspaceSwitcher\nInviteMember\nMemberList\nRoleSelector\nWorkspaceSettings\nUse database constraints and indexes.\nTenant resolution\nDefine exactly how tenant context is resolved:\nsubdomain\ncustom domain\nsession\nURL\nexplicit workspace selector\nAPI key\nand establish precedence.\nNever allow two competing tenant sources to silently disagree.\nTenant context poisoning\nPrevent:\nauthenticated user \u2192 tenant A\nrequest \u2192 tenant B\nfrom accidentally accessing tenant B.\nMembership lifecycle\nAdd:\ninvitation expiration\ninvitation revocation\ninvitation reuse policy\ninvitation ownership\npending membership state\nmember removal\nmember suspension\nownership transfer\nlast-owner protection.\nOwnership transfer\nRequire strong verification for:\nchanging owner\nremoving owner\ntransferring billing ownership.\nTenant deletion\nDefine:\nconfirmation\ngrace period\nasynchronous deletion\ndependent data deletion\nfile deletion\n\n\fwebhook/API-key revocation\njob cancellation\ndomain detachment\nbackup retention.\nCross-tenant cache isolation\nCache keys must include tenant identity.\nExample:\ntenant:{tenantId}:resource:{resourceId}\nNever:\nresource:{resourceId}\nwhen IDs aren't globally isolated.\nBackground jobs\nEvery tenant-aware job must carry immutable tenant context.\nNever rely on:\ncurrentUser\ninside asynchronous workers.\nDatabase enforcement\nWhere possible, add database-level tenant constraints in addition to application checks.\nInclude exhaustive authorization tests.\n\n04 \u2014 TRANSACTIONAL EMAIL & NOTIFICATION CENTER\nBuild a unified notification system.\nSupport:\nEMAIL\nIN_APP\nPUSH\nWEBHOOK\nCreate:\nsendNotification()\nwith:\nuserId\ntemplate\ndata\nchannel\npriority\nSupport:\nwelcome emails\n\n\fverification\npassword reset\nmagic links\ninvoices\npayment failures\nsubscription events\nsystem alerts\nFeatures:\n- templates\n- localization\n- retry queue\n- idempotency\n- unsubscribe preferences\n- notification preferences\n- digest mode\n- delivery tracking\n- failure tracking\nCreate provider abstraction for:\nResend\nSendGrid\nAWS SES\nCreate reusable components:\nNotificationCenter\nNotificationBell\nNotificationList\nNotificationPreferences\nEnsure provider failure does not crash core application workflows.\nNotification state machine\nTrack:\nQUEUED\nPROCESSING\nSENT\nDELIVERED\nBOUNCED\nFAILED\nCOMPLAINED\nCANCELED\nrather than only sent=true.\nProvider failover\nDefine what happens when the email provider is unavailable.\n\n\fPossible:\nprimary provider\n\u2192 retry\n\u2192 fallback provider\n\u2192 dead-letter\nEmail deduplication\nPrevent accidental duplicate emails caused by:\nretries\nHTTP timeouts\nworker crashes\nduplicate events.\nEmail rendering safety\nHTML escaping\ntemplate injection prevention\nURL validation\nuser-controlled content sanitization\nsafe link generation.\nEmail security\nSensitive links must have:\nexpiration\none-time use\npurpose binding\nuser/account binding\nno sensitive information in URLs beyond what is necessary.\nBounce management\nHandle:\nhard bounce\nsoft bounce\nspam complaint\nsuppression list.\nAvoid repeatedly sending to permanently invalid addresses.\nUnsubscribe semantics\nSeparate:\ntransactional messages\nmarketing messages\nsecurity messages\nlegally required communications.\nDo not accidentally unsubscribe users from security-critical messages.\nTimezone-aware delivery\nScheduled notifications should respect user timezone and DST.\nDigest correctness\nAvoid:\nduplicate items\nmissing items\nalready-read content\nrace conditions between digest generation and event creation.\n\n\f05 \u2014 SETTINGS, PREFERENCES & CUSTOMIZATION\nBuild a complete reusable settings system.\nSections:\nProfile\nAccount\nSecurity\nNotifications\nAppearance\nLanguage\nPrivacy\nBilling\nConnected Accounts\nSupport:\n- name\n- avatar\n- timezone\n- locale\n- theme\n- notification preferences\n- privacy preferences\nCreate typed settings schemas.\nDo not create uncontrolled arbitrary JSON where structured schemas\nare appropriate.\nCreate:\nSettingsLayout\nProfileSettings\nSecuritySettings\nNotificationSettings\nAppearanceSettings\nPrivacySettings\nEvery setting must have server-side validation and authorization.\nSensitive changes should require reauthentication where appropriate.\nInclude tests.\n5. Settings / Preferences / Customization\nMissing:\nSettings versioning\n\n\fPreferences may evolve.\nStore/version settings so migrations can safely transform:\nv1 \u2192 v2 \u2192 v3\nSensitive setting protection\nChanges to:\nemail\npassword\nMFA\nAPI credentials\nbilling\nownership\nmust not use the same trust level as changing a theme.\nPreference precedence\nDefine:\nsystem default\n\u2192 product default\n\u2192 organization setting\n\u2192 user setting\n\u2192 session-specific override\nwhere applicable.\nInvalid preference recovery\nIf a stored preference becomes invalid after a deployment:\nvalidate it\nfall back safely\nmigrate it\nnever crash the application.\nPrivacy preferences\nSeparate:\nfunctional preferences\nanalytics consent\nmarketing consent\npersonalization.\nImport/export compatibility\nSettings exports should have:\nschema version\nvalidation\nmigration support.\n\n06 \u2014 ADMIN DASHBOARD & OPERATIONS CONTROL\nBuild a completely independent admin dashboard that belongs to this\nproduct only.\nThis is NOT a central dashboard for multiple products.\nIt manages ONLY the current application's:\n\n\f- users\n- organizations\n- subscriptions\n- payments\n- usage\n- analytics\n- errors\n- jobs\n- webhooks\n- audit logs\n- support tickets\n- feature flags\n- system settings\nDesign it to be extremely minimal.\nSidebar:\nOverview\nUsers\nOrganizations\nBilling\nUsage\nJobs\nWebhooks\nAnalytics\nSecurity\nAudit Logs\nSupport\nFeature Flags\nSystem\nSettings\nDashboard cards:\nActive Users\nRevenue\nSubscriptions\nErrors\nUsage\nFailed Jobs\nWebhook Failures\nAdmin security:\n- separate admin authorization\n- RBAC\n\n\f- MFA\n- session timeout\n- audit every sensitive action\n- confirmation for destructive actions\n- prevent ordinary users accessing admin routes\nSupport safe user impersonation only when explicitly enabled,\nwith prominent impersonation indicators and complete audit logs.\nNever expose passwords, tokens, API keys or secrets.\n\n6. Admin Dashboard & Operations Control\nMissing:\nBreak-glass administration\nCreate a controlled emergency-admin mechanism with:\nstrong authentication\nexplicit reason\nlimited duration\nautomatic audit\nelevated visibility.\nAdmin action confirmation\nHigh-risk actions should require:\nexplicit confirmation\ntyped confirmation for destructive actions\nreauthentication for critical operations.\nDangerous-action separation\nSeparate normal operational actions from destructive actions.\nFor example:\nSuspend user\nDelete user\nDelete tenant\nRefund payment\nChange owner\nRotate API keys\nshould not be equivalent to ordinary CRUD.\nAdmin session security\nAdd:\nshort inactivity timeout\nabsolute lifetime\nstronger authentication\nsession revocation\nadmin-specific session visibility.\nAdmin UI data minimization\nDo not expose more personal/customer data than necessary.\nAdmin API separation\nThe admin frontend must not be trusted merely because it is an internal UI.\nEvery admin endpoint independently validates:\n\n\fauthentication\nauthorization\ninput\nresource ownership/context\nBulk actions\nBulk operations require:\nbounded batch size\npartial-failure handling\ntransaction strategy\nprogress\nresumability\naudit records.\nDangerous query protection\nAdmin search/filter endpoints need:\nquery limits\npagination\ntimeout protection\nexpensive-query controls.\n\n07 \u2014 FILE STORAGE & MEDIA PROCESSING\nBuild a reusable secure file-storage module.\nSupport:\nS3-compatible storage\nCloudflare R2\nUploadThing\nFeatures:\n- presigned uploads\n- presigned downloads\n- upload limits\n- MIME validation\n- extension validation\n- filename sanitization\n- image resizing\n- thumbnails\n- optimization\n- deletion\n- retention policies\nCreate:\n<FileUpload />\n<ImageUpload />\n\n\f<FilePicker />\n<MediaPreview />\nNever trust client MIME types.\nProtect against:\npath traversal\nmalicious files\noversized uploads\ncontent-type spoofing\nunauthorized downloads\nStorage provider must be replaceable.\nLarge media processing must run asynchronously.\n\nContent inspection\nDo not trust:\nfilename\nextension\nContent-Type\nalone.\nValidate actual file content where practical.\nMalware scanning\nArchitecture for asynchronous malware scanning.\nPotential state:\nUPLOADING\n\u2192 SCANNING\n\u2192 SAFE\n\u2192 REJECTED\nDo not make untrusted uploads immediately downloadable if your threat model requires\nscanning.\nImage security\nProtect against:\ndecompression bombs\nextremely large dimensions\nmalformed image files\nmetadata abuse\ndangerous SVG content.\nFilename handling\nNever use user filename directly as filesystem/storage path.\nGenerate internal object IDs.\nObject authorization\nEvery download should verify authorization server-side.\nNever assume possession of an object URL equals authorization unless intentionally\ndesigned as a signed temporary URL.\n\n\fUpload quotas\nSupport:\nper-file limit\nuser limit\ntenant limit\nplan limit\naggregate storage limit.\nOrphan cleanup\nHandle:\ndatabase record created\nupload fails\nand:\nupload succeeds\ndatabase transaction fails\nwith reconciliation cleanup.\nRange requests / streaming\nLarge files should not necessarily be loaded entirely into application memory.\nEXIF/privacy\nConsider stripping:\nGPS metadata\ncamera metadata\nhidden metadata\nwhere appropriate.\nInclude tests.\n\n08 \u2014 ANALYTICS, EVENT TRACKING & LOGGING\nBuild a privacy-conscious analytics infrastructure.\nCreate:\ntrackEvent()\nidentifyUser()\ntrackPageView()\ntrackConversion()\nSupport:\nPostHog\nMixpanel\nGoogle Analytics\nCreate structured event schemas.\nEvery event should optionally contain:\n\n\fuserId\norganizationId\neventName\ntimestamp\nmetadata\nNever send:\npasswords\ntokens\nAPI keys\nprivate content\nunnecessary sensitive information\nAnalytics failure must never break the application.\nAlso create structured application logging:\nlogger.info()\nlogger.warn()\nlogger.error()\nSupport:\nrequest ID\nenvironment\nservice\nerror code\ntimestamp\nEvent schema governance\nEvery event needs a version.\nExample:\nproject.created.v2\nrather than silently changing payload structure.\nEvent contract validation\nValidate analytics events before ingestion.\nEvent deduplication\nPrevent duplicate events from retries and page replays.\nEvent ordering\nDo not assume client-generated events arrive chronologically.\nConsent-aware tracking\nAnalytics collection must respect applicable privacy choices.\nData retention\nDefine retention per category:\nanalytics\napplication logs\nsecurity events\n\n\faudit events.\nLog correlation\nEvery request should ideally have:\nrequestId\ntraceId\nuserId if available\ntenantId if available\nwithout leaking sensitive values.\nLog integrity\nSecurity/audit logs should be protected against unauthorized modification/deletion.\nHigh-cardinality protection\nPrevent someone from accidentally generating millions of unique metric labels.\nPII classification\nExplicitly classify fields:\npublic\ninternal\npersonal\nsensitive\nsecret\nand define logging rules.\nSampling\nHigh-volume logs/traces should support controlled sampling without destroying important\nsecurity events.\nInclude log redaction.\n\n09 \u2014 RATE LIMITING, SECURITY & API PROTECTION\nBuild centralized security middleware for this independent product.\nImplement:\n- rate limiting\n- CORS\n- CSRF where appropriate\n- security headers\n- request validation\n- response validation\n- request-size limits\n- API authentication\n- authorization\n- abuse prevention\n- brute-force prevention\nSupport Redis/Upstash where appropriate.\n\n\fCreate configurable rate limits for:\nlogin\nsignup\npassword reset\nAPI endpoints\nAI endpoints\nfile uploads\nwebhooks\nImplement appropriate:\nCSP\nHSTS\nX-Content-Type-Options\nReferrer-Policy\nPermissions-Policy\nframe protection\nDo not use unsafe wildcard configurations in production.\n\nThis one needs a major expansion.\nRequest normalization\nNormalize:\nheaders\npaths\nencoded characters\nUnicode\ncontent types\nbefore security decisions where applicable.\nRequest smuggling protection\nInfrastructure/proxy configuration should protect against HTTP request\nsmuggling/desynchronization.\nSSRF protection\nFor any server-side URL fetching:\nblock private IP ranges\nblock localhost\nblock metadata endpoints\nvalidate DNS resolution\nprevent DNS rebinding\nrestrict protocols\nrestrict redirects.\nReDoS\nAvoid unsafe regular expressions on user input.\nPrototype pollution\nValidate untrusted JSON/object structures carefully.\nResource exhaustion\n\n\fProtect:\nrequest body\nJSON nesting\nmultipart fields\nquery complexity\npagination\nregex processing\nimage processing\nPDF processing.\nSecurity headers\nExplicitly test:\nCSP\nHSTS\nX-Content-Type-Options\nReferrer-Policy\nPermissions-Policy\nframe protections.\nDependency security\nAutomated:\ndependency audit\nlockfile validation\nvulnerability alerts\nabandoned-package detection.\nSecret scanning\nCI should scan for:\nAPI keys\nprivate keys\ntokens\ncredentials.\nAPI versioning\nDefine compatibility strategy:\n/api/v1\n/api/v2\nrather than breaking existing consumers silently.\nRequest replay protection\nFor sensitive APIs:\ntimestamp\nnonce\nidempotency key\nsignature where appropriate.\nError normalization\nNever expose:\nstack traces\nSQL\nfilesystem paths\nprovider credentials\ninternal service topology.\n\n\fDocument every security decision.\n\n10 \u2014 AI WRAPPER & BACKGROUND JOB QUEUE\nBuild a provider-independent AI infrastructure.\nSupport:\nOpenAI\nAnthropic\nGoogle\nCreate:\nAIProvider\nFunctions:\ngenerateText()\nstreamText()\ngenerateStructured()\nembed()\nmoderate()\nSupport:\n- streaming\n- retries\n- timeouts\n- cancellation\n- model fallback\n- token tracking\n- cost tracking\n- rate limiting\n- usage limits\n- structured output\n- schema validation\n- prompt versioning\nNever allow the frontend to directly access provider API keys.\nAdd background jobs using:\nTrigger.dev\nBullMQ\nor an equivalent durable system.\n\n\fSupport:\nretries\nbackoff\ndead-letter jobs\nconcurrency\ncancellation\nprogress\nidempotency\n\nPrompt injection defense\nTreat external/user-provided content as untrusted.\nExplicitly separate:\nsystem instructions\ndeveloper instructions\ntrusted application context\nuntrusted user content\nretrieved content\ntool output\nTool-call authorization\nAn AI must never be allowed to perform an action merely because it generated a\nvalid-looking tool call.\nEvery tool call needs normal server authorization.\nAI output validation\nStructured output must be:\ngenerated\n\u2192 parsed\n\u2192 schema validated\n\u2192 business-rule validated\n\u2192 sanitized\n\u2192 executed\nAI hallucination containment\nNever allow AI output to directly become:\nSQL\nshell commands\nauthorization decisions\npayment instructions\nprivileged actions.\nCost protection\nAdd:\nper-user budget\nper-tenant budget\nper-feature budget\ndaily/monthly limits\nemergency global kill switch.\nToken accounting\n\n\fRecord:\nmodel\ninput tokens\noutput tokens\ncached tokens where applicable\nestimated cost\nactual provider cost if available.\nProvider response normalization\nDifferent AI providers fail differently.\nNormalize:\ntimeout\nrate limit\ncontent policy refusal\ncontext overflow\ntemporary provider failure\ninvalid response\nContext limits\nBefore sending prompts:\ncalculate approximate token usage\ntruncate intelligently\nsummarize\nreject impossible requests.\nJob ownership\nA queued job must preserve:\nuserId\ntenantId\nauthorization context\nrequestId\njobId\nbut never blindly trust these values when executing.\nWorker isolation\nLong-running/expensive AI jobs should not block web requests.\nPoison jobs\nA job that repeatedly fails must eventually move to a DLQ instead of retrying forever.\nCancellation\nCancellation should actually stop downstream work where possible.\nProvider outages\nSupport degraded behavior rather than infinite retries.\nProtect against duplicate expensive AI jobs.\n\n11 \u2014 ONBOARDING, PRODUCT TOURS & CHECKLISTS\nBuild reusable onboarding infrastructure.\nCreate:\n\n\f<OnboardingChecklist />\n<ProductTour />\n<TooltipTour />\n<WelcomeModal />\nSupport:\n- ordered steps\n- progress\n- completion\n- skipping\n- resuming\n- product-specific steps\n- user-specific state\nExample:\nCreate account\nComplete profile\nCreate first project\nInvite teammate\nComplete first action\nPersist state appropriately.\nDo not rely solely on localStorage for important server-side progress.\nMake onboarding configurable without rewriting components.\nOnboarding state machine\nHandle:\nNOT_STARTED\nIN_PROGRESS\nCOMPLETED\nSKIPPED\nRESET\nVersion onboarding\nWhen onboarding changes:\nonboarding_v1\nonboarding_v2\nusers shouldn't unexpectedly lose progress.\nContext-aware onboarding\nDo not show onboarding for features the user cannot access.\nCompletion validation\nImportant onboarding completion must be confirmed server-side where it unlocks something\nmeaningful.\nRecovery\n\n\fIf onboarding gets interrupted halfway:\npreserve progress\nresume correctly\ndon't restart unnecessarily.\nAccessibility\nTours need:\nkeyboard navigation\nscreen reader support\nfocus management\nescape behavior.\nMobile behavior\nTour overlays need to handle:\nviewport changes\nscrolling\norientation\nresponsive layouts.\n\n12 \u2014 FEATURE FLAGS & REMOTE CONFIGURATION\nBuild a secure feature-flag system.\nAPI:\nhasFeature()\nSupport targeting by:\nuser\norganization\npercentage rollout\nenvironment\nplan\nrole\nSupport:\n- kill switches\n- beta features\n- gradual rollout\n- disabled-by-default features\nFeature flags must not become security authorization.\nAuthorization must always remain server-side.\nAudit every flag modification.\n\n\fCreate a minimal admin UI for:\ncreate\nedit\nenable\ndisable\nrollout\ndelete\nSupport a simple database implementation with optional PostHog/\nLaunchDarkly adapters.\nFlag dependency graph\nIf:\nfeature A requires feature B\nthe system must handle dependencies explicitly.\nFlag evaluation consistency\nA user shouldn't randomly switch variants during a single request/session unless\nintentionally designed.\nConfiguration validation\nRemote config should be schema validated before activation.\nSafe defaults\nIf flag service is unavailable:\nknown safe default\nmust be used.\nFlag expiration\nFlags need:\nowner\ncreation date\nexpiry/review date\nlifecycle state.\nOtherwise temporary flags become permanent technical debt.\nKill-switch safety\nKill switches should fail closed for dangerous functionality where appropriate.\nCache invalidation\nDefine propagation latency and stale-config behavior.\n\n13 \u2014 AUDIT LOGS & ACTIVITY STREAM\nBuild an immutable audit-log system.\nRecord:\nactor\naction\ntarget\n\n\forganization\ntimestamp\nrequest ID\nmetadata\nExamples:\nLOGIN\nLOGOUT\nPASSWORD_CHANGED\nPLAN_CHANGED\nPROJECT_CREATED\nPROJECT_DELETED\nMEMBER_INVITED\nAPI_KEY_CREATED\nADMIN_IMPERSONATION\nCreate:\nlogActivity()\nAudit logs must:\n- be append-only through normal application APIs\n- not expose sensitive secrets\n- support filtering\n- support pagination\n- support retention policies\nCreate an admin audit viewer.\nSensitive administrative actions must automatically generate audit events.\nTamper resistance\nApplication admins should not casually be able to rewrite historical audit events.\nAudit event integrity\nConsider:\nappend-only storage\nrestricted deletion\nintegrity mechanisms\nseparate retention controls.\nBefore/after values\nFor sensitive configuration changes, record safe before/after representations.\nNever store secrets themselves.\nActor types\nSupport:\nUSER\nADMIN\n\n\fSYSTEM\nWORKER\nAPI_KEY\nWEBHOOK\nAI_AGENT\nDelegation\nIf an admin performs an action on behalf of a user:\nactor = admin\nsubject = user\nreason = ...\nDo not misrepresent it as the user's action.\nAudit reliability\nCritical audit logging should not silently disappear because the primary application request\nfailed.\nClock consistency\nUse server-generated timestamps and consistent timezone handling.\n\n14 \u2014 CUSTOMER SUPPORT, LIVE CHAT & FEEDBACK\nBuild reusable customer-support infrastructure.\nComponents:\n<FeedbackWidget />\n<BugReport />\n<FeatureRequest />\n<ContactSupport />\nSupport providers through adapters:\nCrisp\nIntercom\nPlain\nfuture providers\nCapture:\nuser\norganization\npage\nbrowser metadata where appropriate\ndescription\nscreenshots optionally\nNever accidentally expose private application data.\n\n\fAllow administrators to view feedback from the product's own admin panel.\nInclude spam/rate limiting protection.\nAuthorization boundary\nSupport staff must only see information they're permitted to see.\nSupport impersonation\nIf implemented:\nexplicit user notification\ntime-limited session\nrestricted permissions\nfull audit\nobvious impersonation indicator\nno access to credentials/secrets.\nAttachment security\nSupport uploads need the same security model as normal storage.\nConversation retention\nDefine:\nretention\ndeletion\nexport\nlegal hold where applicable.\nSpam prevention\nAdd:\nper-user limits\nIP limits\nattachment limits\ncontent-size limits.\nSupport identity verification\nBefore exposing account-sensitive information, support tooling needs a verification workflow.\nSLA tracking\nFor serious support systems:\ncreated\n\u2192 assigned\n\u2192 first response\n\u2192 pending customer\n\u2192 resolved\n\u2192 reopened\nDuplicate ticket detection\nAvoid creating dozens of tickets for the same event.\n\n15 \u2014 SEO, OPEN GRAPH & META ENGINE\nBuild reusable SEO infrastructure for this independent product.\nSupport:\n\n\f- title\n- description\n- canonical\n- robots\n- sitemap\n- structured data\n- OpenGraph\n- social preview images\n- dynamic metadata\nCreate:\ngenerateMetadata()\ngenerateSitemap()\ngenerateStructuredData()\nEnsure private application routes are not indexed.\nSupport product-specific SEO defaults.\nPrevent duplicate canonical URLs.\nInclude validation and SEO tests.\nSEO security\nPrevent accidental indexing of:\ndashboards\nuser pages\nprivate workspaces\nadmin pages\ninternal APIs\ntemporary URLs.\nTenant SEO isolation\nCustom-domain tenants must not accidentally expose another tenant's metadata.\nHost-header poisoning\nNever build canonical URLs blindly from arbitrary Host headers.\nSitemap scalability\nLarge products need:\npagination/sharding\nincremental generation\ncaching\ninvalidation.\nStructured-data validation\nSchema.org output should be generated from validated data.\nLocale SEO\nSupport:\nhreflang\n\n\flocalized canonical URLs\nlanguage-region combinations.\nPreview security\nOG image generation should not become an SSRF/vector through arbitrary user-controlled\nURLs.\nSEO deployment safety\nPreview/staging environments should have explicit no-index behavior.\n\n16 \u2014 LEGAL & COMPLIANCE LAYER\nBuild reusable legal infrastructure.\nCreate configurable pages for:\nTerms of Service\nPrivacy Policy\nCookie Policy\nAcceptable Use Policy\nRefund Policy\nImplement:\n- consent tracking\n- terms acceptance\n- privacy preferences\n- data export request\n- account deletion\n- retention policy infrastructure\nCreate:\n<CookieConsent />\n<PrivacySettings />\n<TermsAcceptance />\nIMPORTANT:\nDo not pretend generic templates guarantee legal compliance.\nMake jurisdiction-specific configuration possible.\nClearly document areas requiring review by qualified legal counsel.\nEnsure user data deletion and export workflows are asynchronous where\nnecessary and properly audited.\nPolicy versioning\n\n\fRecord:\nterms_version\nprivacy_version\naccepted_at\naccepted_ip where legally appropriate\nrather than merely:\naccepted = true\nConsent separation\nDo not combine:\nTerms acceptance\nPrivacy acknowledgement\nMarketing consent\nCookie consent\ninto one boolean.\nConsent withdrawal\nUsers need a mechanism to withdraw optional consent.\nData subject workflow\nSupport state machines for requests such as:\nACCESS\nEXPORT\nCORRECTION\nDELETION\nRESTRICTION\nwhere applicable.\nLegal hold\nDeletion systems must be able to respect legitimate retention/legal-hold requirements.\nRetention engine\nData categories should have configurable retention policies.\nVendor/data-processing inventory\nMaintain an internal list of:\nprocessors\ndata categories\npurposes\nregions.\nPolicy localization\nLegal content may vary by jurisdiction.\nDo not assume one global policy text fits every market.\nConsent evidence integrity\nConsent records should be protected against ordinary user/admin modification.\n\n17 \u2014 GLOBAL SEARCH & COMMAND PALETTE\nBuild a reusable Cmd/Ctrl + K system.\nSupport:\n\n\fnavigation\ndatabase search\nworkspace switching\ncreating resources\nopening settings\nrunning quick actions\nCommands must be:\npermission-aware\ncontext-aware\nkeyboard accessible\nCreate:\n<CommandPalette />\nAllow each independent product to register its own commands.\nDo not make the command system dependent on another application.\nPrevent unauthorized actions from appearing or executing.\nSearch authorization\nSearch results must be permission-filtered before returning results, not merely hidden in UI.\nSearch index security\nRemoving access to a document should eventually remove/disable it in search.\nSearch leakage\nPrevent snippets from exposing:\nprivate content\ndeleted content\nhidden metadata.\nQuery abuse\nProtect against:\nenormous queries\nexpensive wildcard searches\npathological search expressions.\nSearch consistency\nDefine expected behavior when:\ndatabase updated\nbut search index hasn't updated yet.\nReindexing\nNeed:\nfull reindex\nincremental reindex\nfailed-document retry\nprogress\nindex versioning.\n\n\fPermission changes\nWhen permissions change, cached search results must not remain accessible indefinitely.\nCommand safety\nDestructive command-palette actions need confirmation.\n\n18 \u2014 WEBHOOK ENGINE & PUBLIC API KEY MANAGEMENT\nBuild reusable public API infrastructure.\nAPI keys must:\n- be generated securely\n- be hashed at rest\n- only be shown once\n- support scopes\n- support expiration\n- support revocation\n- track last usage\n- support rate limits\nWebhook system:\n- endpoint registration\n- event subscriptions\n- HMAC signatures\n- delivery retries\n- exponential backoff\n- delivery logs\n- replay\n- failure handling\n- dead-letter state\nPrevent:\nreplay attacks\nduplicate events\nsignature bypass\nunauthorized endpoint access\nNever store plaintext API keys.\nKey lifecycle\nSupport:\nCREATED\nACTIVE\nROTATED\nREVOKED\n\n\fEXPIRED\nKey prefix identification\nStore a non-secret prefix for identifying keys without exposing the secret.\nKey rotation\nAllow overlapping old/new keys for controlled migration.\nScope hierarchy\nPrevent a key from granting permissions greater than the creator is allowed to grant.\nWebhook secret rotation\nSupport old/new secrets during rotation.\nDestination validation\nProtect webhook configuration against SSRF.\nWebhook endpoint ownership\nUsers should prove ownership/control of destinations where appropriate.\nDelivery isolation\nOne failing webhook destination must not block other destinations.\nPayload versioning\nWebhook schemas need versions.\nConsumer acknowledgement\nClearly define what HTTP responses mean:\n2xx\n4xx\n5xx\ntimeout\nReplay controls\nReplay must preserve security semantics and avoid triggering irreversible actions twice.\nAPI pagination contracts\nDefine:\ncursor format\ncursor expiration\nstable ordering\nduplicate avoidance\ndeleted-record behavior.\nAPI compatibility\nDocument deprecation periods and compatibility guarantees.\n\n19 \u2014 EXPORT, IMPORT & DATA PORTABILITY\nBuild reusable data portability infrastructure.\nSupport:\nCSV\nJSON\nPDF where appropriate\nImport pipeline:\n\n\fupload\nparse\nvalidate\npreview\nduplicate detection\ntransaction\nrollback\nerror reporting\nLarge imports/exports must use background jobs.\nExport must respect authorization and tenant boundaries.\nNever allow a user to export another user's data.\nProvide progress tracking.\nCreate reusable:\n<ExportButton />\n<ImportWizard />\n<ExportProgress />\nExport consistency\nA large export should represent a coherent snapshot rather than randomly mixing data from\ndifferent moments.\nExport authorization\nThe authorization check must occur when the export is requested and when sensitive\ndownload access is granted.\nExport encryption\nHighly sensitive exports should have appropriate protection at rest and during transfer.\nExport expiration\nGenerated export files should automatically expire/delete.\nImport isolation\nImported files should be processed in isolated temporary storage.\nImport validation\nValidate:\nschema\nrelationships\nreferences\nenums\nIDs\nduplicate records\nmaximum rows.\nImport dry run\nProvide:\nvalidate only\n\n\fbefore committing large imports.\nPartial failure strategy\nClearly choose:\nall-or-nothing\nor controlled partial import.\nImport rollback\nLarge imports need rollback/recovery strategy.\nMalicious imported content\nImported data must be treated as untrusted even if it came from another product instance.\n\n20 \u2014 AFFILIATE & REFERRAL SYSTEM\nBuild a reusable referral system.\nSupport:\nreferral codes\nreferral links\ncookie attribution\nsignup attribution\nconversion tracking\ncommission ledger\nfraud detection\npayout status\nExample:\n?ref=ABC123\nReferral attribution must be securely validated.\nPrevent:\nself-referrals\nduplicate attribution\ntampering\nfake conversions\nIntegrate with billing only through clean interfaces.\nSupport future providers such as:\nRewardful\nFirstPromoter\nCreate admin reporting.\n\n\fAttribution model\nDefine exactly:\nfirst-touch\nlast-touch\nsignup-time\nconversion-time\ncoupon attribution.\nAttribution expiry\nReferral attribution should expire predictably.\nCookie security\nReferral cookies require:\nsecure configuration\nexpiration\ntamper resistance\ncorrect domain/path.\nCommission state machine\nPENDING\n\u2192 APPROVED\n\u2192 PAYABLE\n\u2192 PAID\nwith:\nREVERSED\nDISPUTED\nwhere necessary.\nRefund handling\nA refunded transaction should correctly reverse associated commission.\nAffiliate account security\nAffiliate payout details are sensitive.\nRequire stronger authentication for changing them.\nFraud review\nSupport manual review rather than blindly paying suspicious referrals.\nSelf-referral detection\nUse multiple signals rather than a single client-controlled field.\nAttribution tampering\nNever accept:\naffiliateId\nfrom the client as authoritative without server verification.\n\n21 \u2014 USAGE-BASED METERING & CREDIT SYSTEM\nBuild a transaction-safe usage and credit ledger.\nTrack:\nAI tokens\nAPI calls\n\n\fvideo exports\nstorage\nprocessing time\ncredits\nCreate:\nrecordUsage()\ngetUsage()\ndeductCredits()\nrefundCredits()\ncheckLimit()\nEvery transaction must be:\natomic\nidempotent\nauditable\nPrevent:\ndouble charging\nnegative balances\nrace conditions\nduplicate webhook credits\nSupport:\nfree limits\nsubscription limits\nhard limits\nsoft limits\ncredit purchases\nmonthly resets\nCreate usage dashboard.\nLedger architecture\nDo not only store:\ncredits = 400\nUse an immutable transaction ledger where practical:\n+100 grant\n-20 usage\n+50 refund\n-10 correction\nBalance reconciliation\nPeriodically calculate:\nledger total\n\n\fvs\nmaterialized balance\nNegative balance protection\nAtomic transactions must prevent concurrent requests from spending the same credits.\nReservation model\nFor expensive operations:\nreserve\n\u2192 execute\n\u2192 settle\ninstead of immediately consuming the entire amount.\nFailed operation refund\nIf the operation fails after reservation:\nreservation \u2192 released/refunded\nPartial usage\nSupport operations that consume an unknown amount until completion.\nCredit expiry\nIf credits expire:\nexpiration date\npriority consumption\nnotification\nledger event.\nPricing versioning\nUsage must retain the pricing version under which it was calculated.\nMeter correction\nAdmin corrections must be:\naudited\nreason-required\nnon-destructive to original records.\nConcurrent usage\nTwo simultaneous requests must not both pass:\nremaining >= cost\nusing stale balances.\n\n22 \u2014 MULTI-LANGUAGE & I18N\nBuild reusable internationalization infrastructure.\nSupport:\nmultiple languages\ndynamic language switching\ncurrency formatting\ndate formatting\ntimezone formatting\npluralization\nRTL layouts\n\n\fUse:\nnext-intl\nreact-i18next\nor an equivalent maintained library.\nCreate typed translation keys where practical.\nDo not hard-code user-facing strings throughout components.\nSupport product-specific translation files.\nEnsure missing translations fail gracefully.\nTranslation fallback hierarchy\nFor example:\nfr-CA\n\u2192 fr\n\u2192 default language\nTranslation versioning\nWhen keys change, detect stale translations.\nMissing translation detection\nCI should fail/warn on missing keys.\nRuntime translation safety\nNever execute translation strings as HTML/scripts without sanitization.\nUser-generated content\nSeparate translated UI strings from user content.\nNumber formatting\nSupport locale-specific:\ndecimal separators\ngrouping\npercentages\ncurrencies.\nCalendar systems\nIf relevant, don't assume every locale uses identical calendar conventions.\nTimezone/DST\nStore canonical timestamps and convert at presentation boundaries.\nRTL testing\nTest layout, not just translated strings.\nText expansion\nUI must survive languages where text is substantially longer.\n\n23 \u2014 MAINTENANCE MODE, STATUS & SYSTEM BANNERS\nBuild a system-status module for this independent product.\n\n\fSupport:\nmaintenance mode\nscheduled maintenance\nincident banners\nwarning banners\nservice degradation\nbreaking updates\nCreate:\n<SystemBanner />\nConfiguration should support:\nglobal\nauthenticated users\nspecific routes\nMaintenance mode must provide an admin bypass.\nDo not accidentally lock administrators out.\nInclude caching and graceful fallback.\n\nEmergency access\nMaintenance should have a secure emergency/admin bypass that cannot be activated by a\nclient-controlled flag.\nMaintenance scope\nSupport:\nwhole system\ntenant\nroute\nfeature\nAPI version.\nRead-only mode\nSometimes you don't want full downtime.\nSupport:\nREAD_ONLY\nwhere appropriate.\nMaintenance consistency\nBackground workers should also understand maintenance state.\nAPI behavior\nDon't return an HTML maintenance page to API clients expecting JSON.\nScheduled maintenance timezone\nStore schedules with explicit timezone/UTC semantics.\n\n\fStatus communication\nSeparate:\ninternal incident state\nfrom:\npublic status message.\nRecovery validation\nDon't immediately mark the system healthy after deployment; verify dependencies first.\n\n24 \u2014 CHANGELOG, ROADMAP & WHAT'S NEW\nBuild reusable product update infrastructure.\nSupport:\npublic changelog\nroadmap\nrelease notes\nWhat's New modal\nunread tracking\nCreate:\n<WhatsNew />\n<ChangelogBadge />\n<Roadmap />\nUse markdown/MDX or a database-backed system.\nAllow admin users to:\ncreate\nedit\npublish\nschedule\narchive\nTrack which users have viewed updates.\nKeep this module independent from external products.\n\nPublication workflow\nSupport:\nDRAFT\n\u2192 REVIEW\n\u2192 SCHEDULED\n\u2192 PUBLISHED\n\n\f\u2192 ARCHIVED\nContent security\nMarkdown/MDX content must be sanitized and restricted.\nAdmin content permissions\nNot every admin should automatically be able to publish public content.\nVersion targeting\nWhat's New can be targeted based on:\nproduct version\nfeature availability\nuser segment.\nRead-state synchronization\nUnread status must handle multiple devices.\nRelease correlation\nChangelog entries can optionally associate with:\nrelease/version\nfeature flag\ndeployment\nBroken-content prevention\nValidate links/assets before publication.\n\n25 \u2014 CUSTOM DOMAIN & WHITE-LABEL ENGINE\nBuild a reusable custom-domain infrastructure.\nSupport:\ncustom domains\ndomain verification\nDNS instructions\ncustom branding\nlogos\ncolors\nfavicon\nPotential infrastructure:\nCloudflare\nVercel\nreverse proxy\nArchitecture must prevent:\nhost-header attacks\ntenant confusion\ndomain spoofing\nunauthorized domain claiming\n\n\fRequire domain ownership verification.\nNever trust a hostname as proof of ownership.\nCreate domain management UI.\nSSL provisioning should be abstracted behind an infrastructure provider.\n\nDomain ownership verification\nVerification must prevent:\nDNS spoofing assumptions\nverification replay\nstale verification\ndomain takeover.\nDomain lifecycle\nREQUESTED\n\u2192 VERIFYING\n\u2192 VERIFIED\n\u2192 ACTIVE\n\u2192 FAILED\n\u2192 DISABLED\nDNS rebinding\nDo not assume a domain that was verified once remains controlled forever without\nconsidering revalidation/security implications.\nHost routing isolation\nRequest:\ncustomer-a.example.com\nmust never resolve to customer B due to cache/routing bugs.\nCache isolation\nCDN/application caches must include host/tenant context.\nCertificate lifecycle\nHandle:\nissuance\nrenewal\nexpiration\nfailed renewal\nrevoked certificate.\nDomain removal\nWhen a domain is removed:\ninvalidate routing\nrevoke/disable association\npurge relevant caches.\nWhite-label asset isolation\nCustomer A must never be able to request customer B's branding assets.\nEmail branding\nIf white-labeling emails, ensure the sending domain is properly configured rather than\nspoofing arbitrary From addresses.\n\n\fDNS instructions\nDon't blindly tell users to create dangerous DNS records without explaining exact expected\nvalues.\n\n26 \u2014 PRODUCT HEALTH, MONITORING & INCIDENT SYSTEM\nBuild a self-contained application health and incident monitoring system.\nMonitor:\napplication uptime\nAPI latency\nerror rate\ndatabase connectivity\nqueue health\nexternal provider health\nbackground jobs\nwebhooks\nCreate health endpoints:\n/health\n/ready\n/live\nDifferentiate:\nliveness\nreadiness\ndependency health\nCreate internal admin dashboard:\nSystem Health\nServices\nErrors\nLatency\nIncidents\nMaintenance\nSupport incident states:\ninvestigating\nidentified\nmonitoring\nresolved\n\n\fCreate optional public status page.\nDo not expose sensitive infrastructure details publicly.\nIntegrate with:\nSentry\nOpenTelemetry\nprovider health APIs\nProvide graceful degradation when monitoring itself fails.\nSLO/SLA model\nDefine measurable objectives such as:\navailability\nlatency\nerror rate\njob success rate\nrather than only showing dashboards.\nAlert deduplication\nPrevent one incident from generating 5,000 alerts.\nAlert grouping\nGroup related failures into one incident.\nDependency-aware health\nDistinguish:\napplication healthy\ndatabase unhealthy\npayment provider degraded\nAI provider unavailable\nrather than one generic red status.\nSynthetic monitoring\nPerform real user-flow checks:\nsignup\nlogin\npayment\ncritical product action\nwhere appropriate.\nIncident lifecycle\nDETECTED\n\u2192 ACKNOWLEDGED\n\u2192 INVESTIGATING\n\u2192 MITIGATED\n\u2192 RESOLVED\n\u2192 POSTMORTEM\nAlert fatigue controls\nSupport:\nseverity\ncooldown\n\n\fsuppression\nmaintenance windows.\nRunbooks\nEach critical alert should link to a remediation/runbook.\nPostmortems\nStore:\nimpact\ntimeline\nroot causes\ncontributing factors\nremediation.\nMonitoring privacy\nNever put credentials, tokens, or private customer data into monitoring payloads.\n\n27 \u2014 ENVIRONMENT & DEPLOYMENT MANAGEMENT\nBuild reusable environment and deployment infrastructure for ONE\nindependent product.\nSupport environments:\ndevelopment\npreview\nstaging\nproduction\nCreate:\ntyped environment validation\nstartup configuration validation\nenvironment-specific configuration\nfeature configuration\ndeployment metadata\nNever commit secrets.\nNever expose server secrets to client code.\nCreate deployment documentation for:\nVercel\nCloudflare\nDocker\ngeneric VPS\nSupport:\n\n\fdeployment version\ncommit SHA\nbuild timestamp\nenvironment\nCreate an admin/system page showing:\nVersion\nEnvironment\nDeployment time\nGit commit\nRuntime\nDatabase version\nNever expose secrets through this dashboard.\nInclude deployment rollback documentation.\nDeployment gates\nProduction deployment should optionally require:\ntests\n\u2192 typecheck\n\u2192 build\n\u2192 migration check\n\u2192 security checks\n\u2192 approval\nMigration/deployment ordering\nHandle:\nold application\n+ new database\ncompatibility before deploying breaking code.\nZero-downtime migrations\nAvoid:\ndeploy code\n\u2192 database column suddenly disappears\nUse expand/contract migration patterns.\nConfig drift detection\nDetect differences between expected and actual environment configuration.\nSecret rotation\nSupport rotation without requiring dangerous downtime.\nDeployment rollback\nRollback strategy must account for database migrations.\nArtifact integrity\nDeploy immutable build artifacts rather than rebuilding different code during rollback.\nCanary deployment\nFor higher-scale products, support gradual deployment.\nHealth-based rollback\nAutomatically halt/rollback when deployment health deteriorates where safe.\n\n\fBuild reproducibility\nLock dependencies and build configuration sufficiently to reproduce releases.\nSource-control protection\nProduction deployment should not depend solely on a developer's local machine.\n\n28 \u2014 DATABASE MIGRATION, BACKUP & DISASTER RECOVERY\nBuild reusable database reliability infrastructure.\nSupport:\nschema migrations\nversion tracking\nseed data\ndatabase backup procedures\nrestore procedures\nmigration verification\nrollback strategy\nDatabase must use:\nforeign keys\nindexes\nconstraints\ntransactions\nCreate migration safety checks.\nPrevent destructive migrations from running accidentally in production.\nCreate scripts for:\ndb:migrate\ndb:rollback where safely possible\ndb:seed\ndb:backup\ndb:verify\nDocument:\nRPO\nRTO\nbackup retention\nrestore testing\ndisaster recovery\n\n\fIMPORTANT:\nA backup must not be considered reliable merely because it was created.\nProvide a documented restore verification procedure.\nNever allow production database credentials into client code.\n\nPoint-in-time recovery\nBackups alone aren't enough.\nSupport, where infrastructure permits:\nrestore database\nto specific point in time\nBackup encryption\nBackups should be encrypted and access-controlled.\nBackup isolation\nA compromised production account should not automatically be able to destroy every\nbackup.\nImmutable backups\nUse retention/immutability mechanisms where appropriate.\nRestore drills\nAutomated or scheduled restore tests.\nBackup monitoring\nAlert when:\nbackup fails\nbackup becomes too old\nbackup size changes unexpectedly\nrestore verification fails.\nMigration compatibility\nMigrations should be tested against realistic production-like datasets.\nMigration locking\nPrevent two deployment processes from simultaneously executing migrations.\nDestructive migration protection\nRequire additional safeguards before:\ndropping tables\ndropping columns\ndestructive transformations.\nData integrity checks\nAfter migrations:\nrow counts\nforeign keys\ncritical invariants\napplication smoke tests.\nDisaster recovery documentation\nExplicitly document:\nRPO\nRTO\n\n\frestore procedure\ncredentials required\ndependencies\nowner\nverification\n\n29 \u2014 EXPERIMENTATION & A/B TESTING\nBuild reusable experimentation infrastructure.\nSupport:\nexperiments\nvariants\nuser allocation\npercentage allocation\norganization allocation\nconversion tracking\nexperiment lifecycle\nCreate:\ncreateExperiment()\ngetVariant()\ntrackConversion()\nAssignments must be deterministic where appropriate.\nA user should not randomly jump between variants.\nSupport:\ndraft\nrunning\npaused\ncompleted\nCreate minimal admin interface:\nExperiment\nVariants\nTraffic\nConversions\nResults\nDo not automatically declare a statistical winner.\n\n\fShow raw metrics and methodology.\nExperiments must never override security permissions.\nDo not use experimentation to determine authorization.\nExperiment eligibility\nUsers should only enter experiments if they satisfy defined eligibility criteria.\nAssignment persistence\nOnce assigned:\ncontrol\nshouldn't unexpectedly become:\nvariant\nunless intentionally designed.\nExposure tracking\nSeparate:\nassigned\nfrom:\nactually exposed\nbecause a user may be assigned but never see the feature.\nExperiment contamination\nPrevent users from simultaneously entering incompatible experiments.\nMutual exclusion\nSupport experiment groups.\nSample-ratio monitoring\nDetect unexpected assignment imbalance.\nMetric definitions\nEach experiment needs:\nprimary metric\nsecondary metrics\ndenominator\nattribution window\nexclusion criteria.\nData-quality checks\nDetect:\nmissing events\nduplicate events\nbots\ntracking failures.\nExperiment lifecycle\nDRAFT\n\u2192 RUNNING\n\u2192 PAUSED\n\u2192 COMPLETED\n\u2192 ARCHIVED\nExperiment cleanup\nWhen an experiment ends:\n\n\fremove dead code\nremove flags\npreserve historical data.\nPrivacy\nDon't expose experiment assignment unnecessarily to clients where it can affect sensitive\nbehavior.\n\n30 \u2014 SECURITY CENTER / VULNERABILITY & COMPLIANCE DASHBOARD\n\nBuild a reusable security center for this independent product.\nCreate a security dashboard showing:\nauthentication status\nMFA adoption\nactive sessions\nAPI keys\nrecent security events\nfailed login attempts\nrate-limit events\nwebhook failures\ndependency vulnerabilities\nconfiguration warnings\nCreate automated security checks for:\nmissing security headers\nunsafe environment variables\noutdated dependencies where detectable\nweak configuration\npublicly exposed routes\nmissing authorization checks\ndangerous CORS\ninsecure cookies\ndebug mode in production\nCreate:\nSecurityEvents\nSecurityAlerts\nSecurityChecks\nSupport severity levels:\nLOW\n\n\fMEDIUM\nHIGH\nCRITICAL\nDo not expose sensitive security findings to ordinary users.\nAdmin-only access.\nCreate remediation guidance for each finding.\nNever claim regulatory certification automatically.\nThe system should identify technical configuration issues, not falsely\ndeclare legal compliance.\nSecurity posture history\nDon't only show:\nCURRENT: 7 warnings\nStore historical security posture.\nFinding lifecycle\nOPEN\n\u2192 ACKNOWLEDGED\n\u2192 IN_PROGRESS\n\u2192 MITIGATED\n\u2192 VERIFIED\n\u2192 CLOSED\nFalse-positive handling\nAllow documented suppression with:\nreason\nowner\nexpiration\napproval.\nSecurity finding deduplication\nThe same vulnerability shouldn't generate thousands of findings.\nDependency vulnerability prioritization\nDistinguish:\nvulnerable dependency exists\nvulnerable code path is actually reachable\nexploitability\nseverity\nexposure.\nSecret exposure response\nIf a secret is discovered:\ndetect\n\u2192 alert\n\u2192 revoke\n\u2192 rotate\n\u2192 investigate\n\n\fnot merely \u201cshow warning.\u201d\nSecurity incident correlation\nCorrelate:\nfailed logins\n+ unusual API calls\n+ key usage\n+ admin action\nwhen appropriate.\nSecurity baseline\nDefine a machine-readable baseline:\nrequired headers\nrequired cookie settings\nrequired auth controls\nrequired encryption\nrequired logging\nSecurity regression testing\nRun security checks in CI/CD so a secure configuration doesn't silently regress.\nDependency SBOM\nGenerate software-bill-of-materials information for releases where appropriate.\nSupply-chain security\nConsider:\ndependency lockfile integrity\ntrusted registries\nsigned releases/artifacts\nCI permissions minimization\ncompromised-package detection.\nSecurity notifications\nNotify appropriate administrators when:\nnew privileged login\nAPI key created\nAPI key rotated\nMFA disabled\npassword changed\nemail changed\nowner changed\nsuspicious activity detected.\nAdd security regression tests.\n",
  reusability_plan: "# ChatGPT Reusable Code Library Plan & Architecture\n\nYes. Let's set it up **now, step by step**, with the minimum architecture needed.\n\nWe\u2019ll make your existing GitHub reusable-code repo usable by coding agents through:\n\n**GitHub repo \u2192 component registry \u2192 reusable modules \u2192 `AGENTS.md` \u2192 any new app**\n\n`AGENTS.md` is particularly useful because Codex automatically discovers it in the repository hierarchy, and GitHub also supports it for agent workflows. \ue200cite\ue202turn0search0\ue202turn0search1\ue201\n\n## Step 1 \u2014 Create a dedicated reusable-code repository\n\nKeep your existing repository if you already have one.\n\nIf not, create:\n\n```text\nyour-github/\n\u2514\u2500\u2500 reusable-code/\n```\n\nInside it create:\n\n```text\nreusable-code/\n\u251c\u2500\u2500 AGENTS.md\n\u251c\u2500\u2500 README.md\n\u251c\u2500\u2500 registry/\n\u2502   \u251c\u2500\u2500 components.json\n\u2502   \u2514\u2500\u2500 modules.json\n\u2502\n\u251c\u2500\u2500 web/\n\u251c\u2500\u2500 mobile/\n\u251c\u2500\u2500 backend/\n\u251c\u2500\u2500 ai/\n\u251c\u2500\u2500 integrations/\n\u2514\u2500\u2500 templates/\n```\n\n---\n\n# Step 2 \u2014 Organize your existing code\n\nDon't rewrite your code yet.\n\nMove your existing reusable code into categories.\n\n### Web\n\n```text\nweb/\n\u251c\u2500\u2500 ui/\n\u2502   \u251c\u2500\u2500 buttons/\n\u2502   \u251c\u2500\u2500 inputs/\n\u2502   \u251c\u2500\u2500 forms/\n\u2502   \u251c\u2500\u2500 modals/\n\u2502   \u251c\u2500\u2500 tables/\n\u2502   \u251c\u2500\u2500 cards/\n\u2502   \u251c\u2500\u2500 navigation/\n\u2502   \u251c\u2500\u2500 dashboards/\n\u2502   \u251c\u2500\u2500 pricing/\n\u2502   \u2514\u2500\u2500 notifications/\n\u2502\n\u251c\u2500\u2500 auth/\n\u2502   \u251c\u2500\u2500 email-password/\n\u2502   \u251c\u2500\u2500 google/\n\u2502   \u251c\u2500\u2500 github/\n\u2502   \u251c\u2500\u2500 magic-link/\n\u2502   \u2514\u2500\u2500 2fa/\n\u2502\n\u2514\u2500\u2500 layouts/\n    \u251c\u2500\u2500 dashboard/\n    \u251c\u2500\u2500 landing-page/\n    \u2514\u2500\u2500 admin/\n```\n\n### Backend\n\n```text\nbackend/\n\u251c\u2500\u2500 database/\n\u251c\u2500\u2500 api/\n\u251c\u2500\u2500 validation/\n\u251c\u2500\u2500 storage/\n\u251c\u2500\u2500 email/\n\u251c\u2500\u2500 logging/\n\u2514\u2500\u2500 security/\n```\n\n### Payments\n\n```text\nintegrations/\n\u251c\u2500\u2500 stripe/\n\u251c\u2500\u2500 lemonsqueezy/\n\u2514\u2500\u2500 paddle/\n```\n\n### AI\n\n```text\nai/\n\u251c\u2500\u2500 chat/\n\u251c\u2500\u2500 agents/\n\u251c\u2500\u2500 rag/\n\u251c\u2500\u2500 embeddings/\n\u251c\u2500\u2500 tool-calling/\n\u2514\u2500\u2500 streaming/\n```\n\nDon't worry about making everything perfect yet.\n\n---\n\n# Step 3 \u2014 Give every reusable module a standard structure\n\nFor example:\n\n```text\nweb/auth/google/\n\u251c\u2500\u2500 README.md\n\u251c\u2500\u2500 package.json\n\u251c\u2500\u2500 src/\n\u2502   \u251c\u2500\u2500 provider.ts\n\u2502   \u251c\u2500\u2500 config.ts\n\u2502   \u2514\u2500\u2500 callbacks.ts\n\u251c\u2500\u2500 example/\n\u2514\u2500\u2500 tests/\n```\n\nDo this for each **major reusable module**, not every tiny function.\n\n---\n\n# Step 4 \u2014 Create the module README\n\nFor example:\n\n```text\nweb/auth/google/README.md\n```\n\nPut:\n\n```md\n# Google OAuth\n\n## ID\nauth.google\n\n## Category\nauthentication\n\n## Platform\nweb\n\n## Framework\nNext.js\n\n## Purpose\nProvides Google OAuth authentication.\n\n## Use when\nThe application requires users to sign in with Google.\n\n## Requirements\n- Next.js\n- Auth.js\n- Database\n\n## Environment variables\n\nGOOGLE_CLIENT_ID\nGOOGLE_CLIENT_SECRET\n\n## Integration\nFollow the implementation in src/.\n\n## Dependencies\n- database\n- session-management\n\n## Do not\n- Rewrite Google OAuth from scratch\n- Create another Google OAuth implementation\n- Hardcode credentials\n\n## Status\nstable\n\n## Version\n1.0.0\n```\n\nDo this for your important modules.\n\n---\n\n# Step 5 \u2014 Create your registry\n\nCreate:\n\n```text\nregistry/modules.json\n```\n\nStart with:\n\n```json\n{\n  \"modules\": [\n    {\n      \"id\": \"auth.google\",\n      \"name\": \"Google OAuth\",\n      \"category\": \"authentication\",\n      \"platform\": \"web\",\n      \"framework\": \"nextjs\",\n      \"path\": \"web/auth/google\",\n      \"status\": \"stable\",\n      \"description\": \"Google OAuth authentication for Next.js applications\"\n    },\n    {\n      \"id\": \"auth.email-password\",\n      \"name\": \"Email Password Authentication\",\n      \"category\": \"authentication\",\n      \"platform\": \"web\",\n      \"framework\": \"nextjs\",\n      \"path\": \"web/auth/email-password\",\n      \"status\": \"stable\",\n      \"description\": \"Email and password authentication\"\n    },\n    {\n      \"id\": \"payments.stripe\",\n      \"name\": \"Stripe Payments\",\n      \"category\": \"payments\",\n      \"platform\": \"web\",\n      \"framework\": \"nextjs\",\n      \"path\": \"integrations/stripe\",\n      \"status\": \"stable\",\n      \"description\": \"Stripe checkout and subscription payments\"\n    }\n  ]\n}\n```\n\nThen keep adding your existing modules.\n\n---\n\n# Step 6 \u2014 Create the most important file: `AGENTS.md`\n\nAt the root:\n\n```text\nreusable-code/AGENTS.md\n```\n\nPut this:\n\n```md\n# REUSABLE CODE LIBRARY\n\nThis repository contains production-ready reusable code for building\nweb applications, mobile applications, AI products, backend systems,\nand integrations.\n\n## CORE RULE\n\nBefore creating new code for common functionality:\n\n1. Search this repository.\n2. Check registry/modules.json.\n3. Find an existing reusable module.\n4. Read that module's README.md.\n5. Reuse the module whenever compatible.\n6. Do not recreate functionality that already exists.\n\n## PRIORITY\n\nExisting reusable module\n>\nExisting project implementation\n>\nNew implementation\n\n## WHEN BUILDING A NEW PRODUCT\n\nFirst identify required capabilities.\n\nExamples:\n\nAuthentication:\n- Google OAuth\n- GitHub OAuth\n- Email/password\n- Magic link\n- 2FA\n\nPayments:\n- Stripe\n- Lemon Squeezy\n- Paddle\n\nAI:\n- Chat\n- Agents\n- RAG\n- Embeddings\n- Tool calling\n\nUI:\n- Forms\n- Tables\n- Modals\n- Dashboards\n- Navigation\n- Pricing\n\nThen search this repository for matching modules.\n\n## IMPORTANT\n\nDo not blindly copy code.\n\nCheck:\n\n- framework compatibility\n- dependencies\n- version compatibility\n- environment variables\n- database requirements\n- authentication requirements\n- security requirements\n- README instructions\n- tests\n\n## NEW REUSABLE CODE\n\nIf no existing module solves the requirement:\n\n1. Build the feature.\n2. Make it reusable.\n3. Document it.\n4. Add tests.\n5. Add it to registry/modules.json.\n6. Ask whether it should be promoted into the reusable library.\n\n## NEVER\n\n- Duplicate an existing reusable module.\n- Replace a stable reusable module without a reason.\n- Hardcode secrets.\n- Modify the reusable library unnecessarily.\n- Assume a module is compatible without checking it.\n\n## SEARCH RULE\n\nWhen the user asks to build something, interpret the request\nas both:\n\n1. Build the requested product.\n2. Reuse the reusable-code library wherever possible.\n```\n\nThis is the key instruction layer. Codex will automatically load `AGENTS.md` when working in a repository. \ue200cite\ue202turn0search0\ue201\n\n---\n\n# Step 7 \u2014 Now create an `AGENTS.md` in every NEW app\n\nWhen you create:\n\n```text\nmy-new-saas/\n```\n\nput:\n\n```text\nmy-new-saas/\n\u251c\u2500\u2500 AGENTS.md\n\u251c\u2500\u2500 src/\n\u2514\u2500\u2500 ...\n```\n\nUse:\n\n```md\n# PROJECT INSTRUCTIONS\n\n## Reusable Code\n\nThe project has access to my reusable code library.\n\nBefore implementing any common functionality:\n\n1. Search the reusable library.\n2. Check registry/modules.json.\n3. Find a compatible module.\n4. Read its README.md.\n5. Reuse it.\n6. Do not recreate existing functionality.\n\nReusable library:\nhttps://github.com/YOUR_USERNAME/reusable-code\n\n## Rule\n\nReuse first. Build second.\n\nIf functionality doesn't exist in the library,\nimplement it normally and determine whether it should\nbe added to the reusable library afterward.\n```\n\nReplace the GitHub URL with your actual repository.\n\n---\n\n# Step 8 \u2014 Test it with ONE product\n\nDon't migrate your entire library first.\n\nPick one simple app.\n\nFor example:\n\n> SaaS dashboard with Google login + Stripe subscription + dashboard.\n\nOpen your coding agent.\n\nGive it:\n\n```text\nBuild this application.\n\nIMPORTANT:\nBefore writing implementation code, inspect the reusable-code\nlibrary and its registry.\n\nIdentify every reusable module that can satisfy this application.\n\nCreate a short list:\n\n1. Requirement\n2. Reusable module\n3. Library path\n4. Why it is compatible\n\nThen implement the application using those modules.\n\nDo not recreate functionality that already exists.\n```\n\n---\n\n# Step 9 \u2014 Watch what the agent does\n\nYou want to see something like:\n\n```text\nRequirement              Reusable module\n\nGoogle login             auth.google\nStripe subscription      payments.stripe\nDashboard layout         ui.dashboard\nNotification system      ui.notifications\nDatabase                 database.core\nEmail                    email.transactional\n```\n\nThen it should actually use those modules.\n\nIf it doesn't, **don't immediately add more complexity**.\n\nFix your `AGENTS.md` instruction.\n\n---\n\n# Step 10 \u2014 Make the library progressively smarter\n\nEvery time you build something new:\n\n```text\nNew problem\n     \u2193\nDoes library contain it?\n     \u2193\n YES \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2192 Reuse\n     \u2502\n     NO\n     \u2193\nBuild it\n     \u2193\nIs it reusable?\n     \u2193\n YES\n     \u2193\nAdd to library\n     \u2193\nAdd README\n     \u2193\nAdd registry entry\n     \u2193\nFuture apps reuse it\n```\n\nThis is the important loop.\n\n---\n\n## Step 11 \u2014 Add a \"component factory\" later\n\nOnce the basic system works, create:\n\n```text\ntools/\n\u2514\u2500\u2500 search-library/\n```\n\nThe goal will eventually be:\n\n```bash\nlibrary search \"authentication\"\n```\n\nand return:\n\n```text\nAUTHENTICATION\n\nauth.google\nauth.github\nauth.email-password\nauth.magic-link\nauth.2fa\nauth.passkeys\n```\n\nThen your coding agents can use this as a much cleaner discovery mechanism.\n\n**Don't build this yet.** First get Steps 1\u201310 working.\n\n---\n\n# Your immediate checklist\n\nDo these **in this exact order**:\n\n```text\n\u2610 1. Open your existing reusable GitHub repo\n\u2610 2. Create the category folders\n\u2610 3. Move/organize existing reusable code\n\u2610 4. Add README.md to major modules\n\u2610 5. Create registry/modules.json\n\u2610 6. Create root AGENTS.md\n\u2610 7. Create AGENTS.md template for new products\n\u2610 8. Pick ONE test application\n\u2610 9. Give the coding agent the test prompt\n\u2610 10. Verify that it actually reuses your modules\n\u2610 11. Fix instructions based on failures\n\u2610 12. Repeat with the next application\n```\n\n**Don't build an MCP server, API, vector database, or complicated AI retrieval system yet.** Your first version can work directly from GitHub + `AGENTS.md` + the registry. Once you have hundreds of modules, then we can add automated search/retrieval. OpenAI's current guidance also emphasizes keeping durable agent instructions focused rather than bloated. \ue200cite\ue202turn0search4\ue202turn0search14\ue201\n\nIf you use **Codex + Claude Code + Cursor + Copilot**, this approach can be made cross-agent rather than tied to one coding tool. GitHub specifically describes `AGENTS.md` as the shared layer for rules across AI agents. \ue200cite\ue202turn0search1\ue201\n\n---\n\nIf you want, I can:\n\n- Explain how to maintain and update the reusable code library over time\n- Describe how to set up the AGENTS.md file in a new project to enforce reuse\n- Outline a workflow for integrating new reusable modules into existing projects\n",
  new_project_prompt: "# New Project AI Agent Prompt\n\nWhen building any new product, provide this exact prompt to your coding agent (Codex, Cursor, Claude Code, Copilot, Antigravity):\n\n---\n\n```text\nBuild this application: [Describe your requirements here, e.g., SaaS dashboard with Google OAuth login, Stripe subscription checkout, and multi-tenant workspace isolation].\n\nCRITICAL INSTRUCTION:\nBefore writing ANY implementation code, inspect the reusable-code library and its registry at:\nhttps://github.com/sh15aa/Web-Reusable\n\n1. Check registry/modules.json (or fetch https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json).\n2. Identify every reusable module that satisfies these requirements.\n3. Create a short plan listing:\n   - Requirement\n   - Reusable module name\n   - Destination path (e.g. src/modules/<module-name>)\n   - Key capabilities & exported services to use\n4. Pull each module directly using:\n   git clone --depth 1 --filter=blob:none --sparse https://github.com/sh15aa/Web-Reusable.git .reusable-temp && \\\n     (cd .reusable-temp && git sparse-checkout set <module-name>) && \\\n     mkdir -p src/modules && cp -r .reusable-temp/<module-name> src/modules/ && \\\n     rm -rf .reusable-temp\n5. Read the module documentation in <module>/docs/10_API_REFERENCE.md and <module>/docs/06_ENVIRONMENT_VARIABLES.md.\n6. Install any required peer dependencies and configure .env.\n7. Wire up the modules into the application.\n\nDo not recreate functionality that already exists in the reusable library.\n```\n"
};

export const AGENTS_TEMPLATE = "# PROJECT INSTRUCTIONS \u2014 AGENT REUSABILITY CONTRACT\n\n## 1. REUSABLE CODE LIBRARY ACCESS\n\nThis project is connected to the centralized **Reusable Code Library**:\n- **Repository**: [https://github.com/sh15aa/Web-Reusable](https://github.com/sh15aa/Web-Reusable)\n- **Raw Registry**: `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json`\n- **Categories Overview**: `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/categories.json`\n- **Helper Pull Script**: `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh`\n\n---\n\n## 2. THE CORE DIRECTIVE\n\n```\nREUSE FIRST. BUILD SECOND.\n```\n\n**Before writing new implementation code for any standard feature:**\n1. **Query the Registry**:\n   Inspect `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json` (or curl it with `curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json`) to find matching modules.\n2. **Match the Capability**:\n   Check if the capability is covered by one of the 33 production-ready modules:\n   - Authentication, Sessions, OAuth (Google/GitHub/Apple) -> `auth`\n   - Payments, Stripe, Subscriptions, Checkout -> `billing`\n   - Database Migrations, Turso/libSQL, SQLite, Backups -> `database`, `turso-storage`\n   - Multi-Tenancy & Workspace Boundaries -> `tenancy`\n   - Rate Limiting, DDoS Protection, IP Shield -> `security`\n   - Audit Logging & Tamper-Evident Trails -> `audit`\n   - Transactional Email (Resend/Postmark) & Notifications -> `notifications`\n   - AI Workflows, LLM Streaming, Prompt Defense, Cost Accounting -> `ai`\n   - File Storage, S3, R2, Uploads -> `storage`\n   - Feature Flags & Percentage Rollouts -> `flags`\n   - A/B Testing & Experiments -> `experimentation`\n   - Webhook Delivery & Verification -> `webhooks`\n   - Universal Error, Crockford IDs, Idempotency, UnitOfWork -> `core`\n   - Admin Controls & User Impersonation -> `admin`\n   - SEO, Open Graph & Sitemaps -> `seo`\n   - Command Palette (Cmd+K) & Search -> `search`\n   - User Onboarding & Interactive Checklists -> `onboarding`\n   - GDPR, Terms, Cookie Consent -> `compliance`\n   - Preferences & Settings -> `settings`\n   - Customer Support & Feedback -> `support`\n   - Product Health & Uptime Monitoring -> `monitoring`\n3. **Pull the Module into the Project**:\n   Run one of these commands directly in the shell:\n   ```bash\n   # Method 1 (Direct one-liner via pull script):\n   curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s <module-name> src/modules/<module-name>\n\n   # Method 2 (Via degit):\n   npx --yes degit sh15aa/Web-Reusable/<module-name> src/modules/<module-name>\n\n   # Method 3 (Via git sparse-checkout):\n   git clone --depth 1 --filter=blob:none --sparse https://github.com/sh15aa/Web-Reusable.git .reusable-temp && \\\n     (cd .reusable-temp && git sparse-checkout set <module-name>) && \\\n     mkdir -p src/modules && cp -r .reusable-temp/<module-name> src/modules/ && \\\n     rm -rf .reusable-temp\n   ```\n4. **Install Required Peer Dependencies**:\n   Inspect `<module>/schemas/` or the module docs and ensure the project dependencies (`zod`, `react`, etc.) are installed.\n5. **Configure Environment Variables**:\n   Check `<module>/docs/06_ENVIRONMENT_VARIABLES.md` or `ENV_VARS.md` and add required variables to `.env.example` and `.env.local`.\n6. **Integrate \u2014 Do NOT Recreate**:\n   Import from `src/modules/<module-name>/server/index.js` or `client/index.js` and connect to the product router/pages.\n\n---\n\n## 3. PROHIBITED BEHAVIORS\n\n- \u274c **DO NOT** implement custom authentication from scratch when `auth` is available.\n- \u274c **DO NOT** write custom Stripe subscription logic when `billing` is available.\n- \u274c **DO NOT** write custom multi-tenant isolation filters when `tenancy` is available.\n- \u274c **DO NOT** create ad-hoc error classes when `core` errors are standardized.\n- \u274c **DO NOT** create non-standard IDs when `core/ids` Crockford Base32 IDs exist.\n";

export const PULL_SCRIPT = "#!/usr/bin/env bash\n# ==============================================================================\n# Pull Module Helper Script for Reusable Code Library\n# Repository: https://github.com/sh15aa/Web-Reusable\n#\n# Usage:\n#   bash scripts/pull-module.sh <module_name> [destination_path]\n# ==============================================================================\n\nset -euo pipefail\n\nMODULE=\"${1:-}\"\nDEST=\"${2:-}\"\nREPO_URL=\"https://github.com/sh15aa/Web-Reusable.git\"\nBRANCH=\"main\"\n\nif [ -z \"$MODULE\" ]; then\n  echo \"\u274c Error: Missing module name.\"\n  echo \"Usage: pull-module.sh <module_name> [destination_path]\"\n  echo \"Example: pull-module.sh auth src/modules/auth\"\n  echo \"\"\n  echo \"Available modules (33 total):\"\n  echo \"  admin, ai, analytics, audit, auth, billing, changelog, compliance,\"\n  echo \"  core, dashboard, database, deployment, domains, experimentation,\"\n  echo \"  flags, i18n, maintenance, metering, monitoring, notifications,\"\n  echo \"  onboarding, portability, referral, search, security, security-center,\"\n  echo \"  seo, settings, storage, support, tenancy, turso-storage, webhooks\"\n  exit 1\nfi\n\nif [ -z \"$DEST\" ]; then\n  DEST=\"./src/modules/$MODULE\"\nfi\n\necho \"\ud83d\udce6 Fetching module '$MODULE' from $REPO_URL ($BRANCH) into '$DEST'...\"\nmkdir -p \"$DEST\"\n\n# Method 1: Git sparse-checkout (Supports both Public and Private repos via local git credentials/SSH)\nif command -v git >/dev/null 2>&1; then\n  echo \"\ud83d\ude80 Using git sparse-checkout...\"\n  TEMP_DIR=$(mktemp -d)\n  if git clone --depth 1 --filter=blob:none --sparse \"$REPO_URL\" \"$TEMP_DIR\" 2>/dev/null; then\n    (\n      cd \"$TEMP_DIR\"\n      git sparse-checkout set \"$MODULE\" >/dev/null 2>&1\n    )\n    if [ -d \"$TEMP_DIR/$MODULE\" ]; then\n      cp -r \"$TEMP_DIR/$MODULE/.\" \"$DEST/\"\n      rm -rf \"$TEMP_DIR\"\n      echo \"\u2705 Successfully pulled '$MODULE' into '$DEST'!\"\n      exit 0\n    else\n      echo \"\u274c Module '$MODULE' not found in repository.\"\n      rm -rf \"$TEMP_DIR\"\n      exit 1\n    fi\n  fi\n  rm -rf \"$TEMP_DIR\"\nfi\n\n# Method 2: npx degit fallback (if public repo)\nif command -v npx >/dev/null 2>&1; then\n  echo \"\ud83d\ude80 Trying npx degit fallback...\"\n  if npx --yes degit \"sh15aa/Web-Reusable/$MODULE#$BRANCH\" \"$DEST\" --force 2>/dev/null; then\n    echo \"\u2705 Successfully installed '$MODULE' into '$DEST'!\"\n    exit 0\n  fi\nfi\n\n# Method 3: GitHub Tarball fallback via curl\necho \"\ud83d\ude80 Trying archive download fallback...\"\nTEMP_TAR=$(mktemp)\nif curl -sSL \"https://github.com/sh15aa/Web-Reusable/archive/refs/heads/$BRANCH.tar.gz\" -o \"$TEMP_TAR\" 2>/dev/null; then\n  tar -xzf \"$TEMP_TAR\" --strip-components=2 -C \"$DEST\" \"Web-Reusable-$BRANCH/$MODULE\" 2>/dev/null || true\n  rm -f \"$TEMP_TAR\"\n  if [ -n \"$(ls -A \"$DEST\" 2>/dev/null)\" ]; then\n    echo \"\u2705 Successfully extracted '$MODULE' into '$DEST'!\"\n    exit 0\n  fi\nfi\n\necho \"\u274c Failed to pull module '$MODULE'. Please verify git credentials or network access.\"\nexit 1\n";
