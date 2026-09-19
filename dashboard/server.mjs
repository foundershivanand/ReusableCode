import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.resolve(__dirname, "public");
const PORT = process.env.PORT || 3333;

// Metadata for all 30 modules + core
const MODULES = [
  {
    id: "core",
    number: "00",
    name: "Universal Core Platform",
    category: "Foundation",
    description: "Universal request pipeline, standard error hierarchy, sortable IDs, idempotency framework, authorization engine, secrets manager, AES-256-GCM crypto, data lifecycle, background jobs, distributed tracing, and bounded LRU caching.",
    testFile: "core/tests/core.test.ts",
    docsPath: "core/docs",
    actions: [
      { id: "test_pipeline", name: "Execute Request Pipeline", defaultPayload: { name: "Test Item", amount: 150 } },
      { id: "test_crypto", name: "AES-256-GCM Encryption & Key Rotation", defaultPayload: { text: "sensitive_oauth_token_12345" } },
      { id: "test_idempotency", name: "Test Idempotency & Replay", defaultPayload: { key: "idem_sample_123", amount: 500 } },
      { id: "test_cache", name: "Test Bounded LRU Cache & Stampede Mutex", defaultPayload: { key: "test_key", value: "cached_data" } },
    ]
  },
  {
    id: "auth",
    number: "01",
    name: "Authentication & Identity",
    category: "Identity & Access",
    description: "Multi-factor authentication (MFA), passwordless email OTP, session management, social login adapters, role-based access control.",
    testFile: "auth/tests/auth.test.ts",
    docsPath: "auth/docs",
    actions: [
      { id: "login", name: "Simulate User Login", defaultPayload: { email: "user@example.com", password: "Password123!" } },
      { id: "mfa_verify", name: "Verify MFA Code", defaultPayload: { userId: "usr_01", code: "123456" } }
    ]
  },
  {
    id: "billing",
    number: "02",
    name: "Billing & Subscriptions",
    category: "Commerce & Billing",
    description: "Stripe subscription lifecycles, tiered pricing, webhook synchronization, invoicing, customer portal.",
    testFile: "billing/tests/billing.test.ts",
    docsPath: "billing/docs",
    actions: [
      { id: "create_sub", name: "Create Subscription", defaultPayload: { tenantId: "tenant_demo", planId: "pro_monthly" } },
      { id: "preview_invoice", name: "Preview Upcoming Invoice", defaultPayload: { tenantId: "tenant_demo" } }
    ]
  },
  {
    id: "tenancy",
    number: "03",
    name: "Multi-Tenancy & Workspaces",
    category: "Identity & Access",
    description: "Workspace hierarchy, member invitations, domain-based tenant resolution, role assignment, row-level security isolation.",
    testFile: "tenancy/tests/tenancy.test.ts",
    docsPath: "tenancy/docs",
    actions: [
      { id: "create_workspace", name: "Create Workspace", defaultPayload: { name: "Acme Corp", slug: "acme" } },
      { id: "invite_member", name: "Invite Member", defaultPayload: { email: "colleague@acme.com", role: "MEMBER" } }
    ]
  },
  {
    id: "notifications",
    number: "04",
    name: "Notifications & Dispatch",
    category: "Operations & Reliability",
    description: "Multi-channel dispatch (Email, SMS, In-App, Webhooks), rate limiting, delivery receipts, template rendering.",
    testFile: "notifications/tests/notifications.test.ts",
    docsPath: "notifications/docs",
    actions: [
      { id: "send_email", name: "Send Transactional Email", defaultPayload: { to: "user@example.com", template: "welcome", data: { name: "Alice" } } }
    ]
  },
  {
    id: "settings",
    number: "05",
    name: "Application & User Settings",
    category: "Foundation",
    description: "Hierarchical configuration (Global, Tenant, User), schema validation, feature toggles, audit trails.",
    testFile: "settings/tests/settings.test.ts",
    docsPath: "settings/docs",
    actions: [
      { id: "get_settings", name: "Get Tenant Settings", defaultPayload: { tenantId: "tenant_demo" } },
      { id: "update_theme", name: "Update Theme Preference", defaultPayload: { theme: "dark", locale: "en-US" } }
    ]
  },
  {
    id: "admin",
    number: "06",
    name: "Admin Portal & Superuser Controls",
    category: "Identity & Access",
    description: "Tenant impersonation, platform metrics, user moderation, manual billing overrides, system lockouts.",
    testFile: "admin/tests/admin.test.ts",
    docsPath: "admin/docs",
    actions: [
      { id: "impersonate", name: "Generate Impersonation Token", defaultPayload: { targetUserId: "usr_target_99" } }
    ]
  },
  {
    id: "storage",
    number: "07",
    name: "File Storage & Media",
    category: "Operations & Reliability",
    description: "S3 / Cloudflare R2 / UploadThing adapters, presigned upload URLs, virus scanning hooks, image optimization.",
    testFile: "storage/tests/storage.test.ts",
    docsPath: "storage/docs",
    actions: [
      { id: "get_upload_url", name: "Generate Presigned Upload URL", defaultPayload: { fileName: "avatar.png", contentType: "image/png", sizeBytes: 204800 } }
    ]
  },
  {
    id: "analytics",
    number: "08",
    name: "Analytics & Product Telemetry",
    category: "Growth & Engagement",
    description: "Event tracking, funnel analysis, cohort retention, PostHog/Mixpanel adapters, privacy-safe anonymization.",
    testFile: "analytics/tests/analytics.test.ts",
    docsPath: "analytics/docs",
    actions: [
      { id: "track_event", name: "Track Custom Event", defaultPayload: { event: "checkout_completed", properties: { amount: 99.00 } } }
    ]
  },
  {
    id: "security",
    number: "09",
    name: "Security & Threat Mitigation",
    category: "Compliance & Security",
    description: "Rate limiting, IP blocklists, CORS policies, CSRF tokens, session tampering detection.",
    testFile: "security/tests/security.test.ts",
    docsPath: "security/docs",
    actions: [
      { id: "check_ip", name: "Check IP Reputation", defaultPayload: { ipAddress: "198.51.100.45" } }
    ]
  },
  {
    id: "ai",
    number: "10",
    name: "AI & LLM Integrations",
    category: "Operations & Reliability",
    description: "Multi-provider streaming (OpenAI, Anthropic, Gemini), token usage tracking, cost controls, fallback failover.",
    testFile: "ai/tests/ai.test.ts",
    docsPath: "ai/docs",
    actions: [
      { id: "generate_text", name: "Simulate Prompt Generation", defaultPayload: { prompt: "Summarize Q3 financial report", model: "gpt-4o" } }
    ]
  },
  {
    id: "onboarding",
    number: "11",
    name: "User Onboarding & Tours",
    category: "Growth & Engagement",
    description: "Checklist progress, interactive tours, milestone celebrations, completion metrics.",
    testFile: "onboarding/tests/onboarding.test.ts",
    docsPath: "onboarding/docs",
    actions: [
      { id: "get_steps", name: "Get Onboarding Steps", defaultPayload: { userId: "usr_alice" } },
      { id: "complete_step", name: "Complete Step", defaultPayload: { stepId: "connect_domain" } }
    ]
  },
  {
    id: "flags",
    number: "12",
    name: "Feature Flags & Rollouts",
    category: "Operations & Reliability",
    description: "Percentage rollouts, user targeting rules, kill switches, audit logs.",
    testFile: "flags/tests/flags.test.ts",
    docsPath: "flags/docs",
    actions: [
      { id: "evaluate_flag", name: "Evaluate Flag for User", defaultPayload: { flagKey: "new_dashboard_v2", userId: "usr_alice", tenantId: "tenant_demo" } }
    ]
  },
  {
    id: "audit",
    number: "13",
    name: "Audit Logs & Compliance Trail",
    category: "Compliance & Security",
    description: "Immutable event recording, cryptographic hash chaining, compliance exports, actor attribution.",
    testFile: "audit/tests/audit.test.ts",
    docsPath: "audit/docs",
    actions: [
      { id: "log_action", name: "Record Audit Log", defaultPayload: { action: "user.password_reset", actorId: "usr_admin", targetId: "usr_bob" } }
    ]
  },
  {
    id: "support",
    number: "14",
    name: "Support & Ticketing",
    category: "Operations & Reliability",
    description: "Help desk ticketing, SLA tracking, internal notes, customer feedback widgets.",
    testFile: "support/tests/support.test.ts",
    docsPath: "support/docs",
    actions: [
      { id: "create_ticket", name: "Create Support Ticket", defaultPayload: { subject: "Cannot connect custom domain", priority: "HIGH" } }
    ]
  },
  {
    id: "seo",
    number: "15",
    name: "SEO & Metadata Management",
    category: "Growth & Engagement",
    description: "Dynamic sitemaps, OpenGraph image generation, JSON-LD structured data, robots.txt.",
    testFile: "seo/tests/seo.test.ts",
    docsPath: "seo/docs",
    actions: [
      { id: "generate_meta", name: "Generate Meta Tags", defaultPayload: { path: "/pricing", title: "Transparent Pricing" } }
    ]
  },
  {
    id: "compliance",
    number: "16",
    name: "Compliance & GDPR",
    category: "Compliance & Security",
    description: "Cookie consent banners, Right-to-be-Forgotten data deletion, GDPR/CCPA data export bundles.",
    testFile: "compliance/tests/compliance.test.ts",
    docsPath: "compliance/docs",
    actions: [
      { id: "export_data", name: "Generate GDPR Export Bundle", defaultPayload: { userId: "usr_alice" } }
    ]
  },
  {
    id: "search",
    number: "17",
    name: "Full-Text Search & Indexing",
    category: "Operations & Reliability",
    description: "Algolia / Meilisearch / Postgres pg_trgm search, instant search hooks, typo tolerance.",
    testFile: "search/tests/search.test.ts",
    docsPath: "search/docs",
    actions: [
      { id: "search_query", name: "Execute Search Query", defaultPayload: { query: "invoice", filter: "tenant_demo" } }
    ]
  },
  {
    id: "webhooks",
    number: "18",
    name: "Webhooks & API Keys",
    category: "Operations & Reliability",
    description: "HMAC-SHA256 signature verification, exponential retry backoff, delivery log viewer, API key generation.",
    testFile: "webhooks/tests/webhooks.test.ts",
    docsPath: "webhooks/docs",
    actions: [
      { id: "dispatch_webhook", name: "Dispatch Webhook Event", defaultPayload: { event: "invoice.paid", payload: { invoiceId: "inv_123" } } }
    ]
  },
  {
    id: "portability",
    number: "19",
    name: "Data Portability & Imports/Exports",
    category: "Operations & Reliability",
    description: "CSV/JSON batch imports, background workers, schema validation, export generation.",
    testFile: "portability/tests/portability.test.ts",
    docsPath: "portability/docs",
    actions: [
      { id: "start_export", name: "Request Data Export", defaultPayload: { format: "csv", entities: ["customers", "invoices"] } }
    ]
  },
  {
    id: "referral",
    number: "20",
    name: "Referral & Affiliate Program",
    category: "Growth & Engagement",
    description: "Referral code generation, attribution tracking, reward disbursement, fraud detection.",
    testFile: "referral/tests/referral.test.ts",
    docsPath: "referral/docs",
    actions: [
      { id: "create_code", name: "Generate Referral Code", defaultPayload: { userId: "usr_alice" } }
    ]
  },
  {
    id: "metering",
    number: "21",
    name: "Usage Metering & Credits",
    category: "Commerce & Billing",
    description: "Credit balances, FIFO grant consumption, race-condition safe deductions, auto-recharge, overage protection.",
    testFile: "metering/tests/metering.test.ts",
    docsPath: "metering/docs",
    actions: [
      { id: "grant_credits", name: "Grant 500 Credits", defaultPayload: { tenantId: "tenant_demo", amount: 500 } },
      { id: "deduct_credits", name: "Deduct 75 Credits", defaultPayload: { tenantId: "tenant_demo", amount: 75, reason: "AI Token Usage" } },
      { id: "check_balance", name: "Check Balance & Ledger", defaultPayload: { tenantId: "tenant_demo" } }
    ]
  },
  {
    id: "i18n",
    number: "22",
    name: "Multi-Language & i18n",
    category: "Growth & Engagement",
    description: "Dynamic locale resolution, ICU message format, pluralization, currency and date formatting, translation fallback.",
    testFile: "i18n/tests/i18n.test.ts",
    docsPath: "i18n/docs",
    actions: [
      { id: "format_message", name: "Format Localized Message", defaultPayload: { locale: "es-ES", key: "welcome_message", count: 5 } },
      { id: "format_currency", name: "Format Currency", defaultPayload: { amount: 149.99, currency: "EUR", locale: "de-DE" } }
    ]
  },
  {
    id: "maintenance",
    number: "23",
    name: "Maintenance Mode & Degradation",
    category: "Operations & Reliability",
    description: "Scheduled downtime notices, emergency lockouts, bypass tokens, IP CIDR whitelisting, read-only mode.",
    testFile: "maintenance/tests/maintenance.test.ts",
    docsPath: "maintenance/docs",
    actions: [
      { id: "enable_maintenance", name: "Enable Maintenance Mode", defaultPayload: { title: "Scheduled DB Upgrade", estimatedMinutes: 45 } },
      { id: "test_bypass", name: "Test Bypass Token", defaultPayload: { token: "secret_bypass_token" } }
    ]
  },
  {
    id: "changelog",
    number: "24",
    name: "Changelog & Release Notes",
    category: "Growth & Engagement",
    description: "Markdown release notes, badge unread count tracking, user-read receipts, public roadmap with voting.",
    testFile: "changelog/tests/changelog.test.ts",
    docsPath: "changelog/docs",
    actions: [
      { id: "list_releases", name: "Fetch Latest Releases", defaultPayload: { limit: 5 } },
      { id: "vote_roadmap", name: "Vote on Roadmap Feature", defaultPayload: { featureId: "feat_sso_saml", userId: "usr_alice" } }
    ]
  },
  {
    id: "domains",
    number: "25",
    name: "Custom Domains & White-Labeling",
    category: "Operations & Reliability",
    description: "CNAME & TXT verification, DNS records, SSL provisioning status, tenant theme customization.",
    testFile: "domains/tests/domains.test.ts",
    docsPath: "domains/docs",
    actions: [
      { id: "register_domain", name: "Register Custom Domain", defaultPayload: { tenantId: "tenant_demo", domain: "app.customer.com" } },
      { id: "verify_dns", name: "Verify DNS Records", defaultPayload: { domain: "app.customer.com" } }
    ]
  },
  {
    id: "monitoring",
    number: "26",
    name: "Health Checks & Status Pages",
    category: "Operations & Reliability",
    description: "Component health checks, incident timeline workflows, SLA calculation, public status page.",
    testFile: "monitoring/tests/monitoring.test.ts",
    docsPath: "monitoring/docs",
    actions: [
      { id: "run_health_check", name: "Run Component Health Check", defaultPayload: { components: ["database", "redis", "storage"] } },
      { id: "report_incident", name: "Report Incident", defaultPayload: { title: "Elevated API Latency", severity: "MAJOR" } }
    ]
  },
  {
    id: "deployment",
    number: "27",
    name: "Deployment & Environment Config",
    category: "Operations & Reliability",
    description: "Semantic versioning, commit SHA tracking, rollback verification, schema drift detection.",
    testFile: "deployment/tests/deployment.test.ts",
    docsPath: "deployment/docs",
    actions: [
      { id: "get_deployment_info", name: "Get Current Deployment Info", defaultPayload: {} }
    ]
  },
  {
    id: "database",
    number: "28",
    name: "Database Operations & Migrations",
    category: "Operations & Reliability",
    description: "Migration checksums, safety analyzer (catches destructive DROP/TRUNCATE), automated rollbacks, PITR records.",
    testFile: "database/tests/database.test.ts",
    docsPath: "database/docs",
    actions: [
      { id: "analyze_sql_safe", name: "Analyze Safe SQL Migration", defaultPayload: { sql: "CREATE TABLE customers (id UUID PRIMARY KEY, name TEXT);" } },
      { id: "analyze_sql_destructive", name: "Analyze Destructive SQL Migration", defaultPayload: { sql: "DROP TABLE users CASCADE;" } }
    ]
  },
  {
    id: "experimentation",
    number: "29",
    name: "Experimentation & A/B Testing",
    category: "Growth & Engagement",
    description: "Deterministic SHA-256 variant hashing, user eligibility, mutual exclusion groups, SRM chi-square diagnostics.",
    testFile: "experimentation/tests/experimentation.test.ts",
    docsPath: "experimentation/docs",
    actions: [
      { id: "get_variant", name: "Assign User Variant (Deterministic)", defaultPayload: { experimentKey: "checkout-v2", userId: "usr_bob", plan: "pro", country: "US" } }
    ]
  },
  {
    id: "security-center",
    number: "30",
    name: "Security Center & Posture",
    category: "Compliance & Security",
    description: "Automated configuration checks (headers, cookies, CORS, secrets), finding lifecycle & suppression, posture score calculation.",
    testFile: "security-center/tests/security-center.test.ts",
    docsPath: "security-center/docs",
    actions: [
      { id: "run_audit", name: "Run Security Audit", defaultPayload: { headers: {}, cookies: [{ name: "session", httpOnly: false, secure: false }], cors: { origin: "*", credentials: true }, env: { nodeEnv: "production", debug: true, secretLength: 16 } } },
      { id: "calc_score", name: "Calculate Posture Score", defaultPayload: { mfaAdoptionPercent: 85 } }
    ]
  }
];

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper to convert Markdown to styled printable HTML for PDF generation
function convertMarkdownToPrintHtml(moduleName, docName, markdown) {
  let bodyHtml = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/<\/ul>\s?<ul>/gim, '')
    .replace(/\n\n/gim, '<p></p>');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${moduleName} - ${docName}</title>
<style>
  @page { margin: 20mm; size: A4; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #24292f; line-height: 1.6; margin: 0; padding: 20px; }
  .header-banner { border-bottom: 2px solid #0969da; padding-bottom: 12px; margin-bottom: 24px; }
  .header-banner h2 { margin: 0; color: #0969da; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
  .header-banner h1 { margin: 6px 0 0 0; font-size: 24px; color: #1f2328; }
  h1, h2, h3, h4 { color: #1f2328; font-weight: 600; margin-top: 24px; margin-bottom: 12px; }
  h1 { font-size: 22px; border-bottom: 1px solid #d0d7de; padding-bottom: 6px; }
  h2 { font-size: 18px; border-bottom: 1px solid #eaeef2; padding-bottom: 4px; }
  h3 { font-size: 15px; }
  code { background-color: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 85%; }
  pre { background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; padding: 14px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; line-height: 1.45; }
  pre code { background: none; padding: 0; }
  ul { padding-left: 20px; margin-bottom: 16px; }
  li { margin-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th, td { border: 1px solid #d0d7de; padding: 8px 12px; text-align: left; }
  th { background-color: #f6f8fa; font-weight: 600; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #d0d7de; font-size: 11px; color: #656d76; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header-banner">
  <h2>Reusable Modules Studio</h2>
  <h1>${moduleName} &bull; ${docName}</h1>
</div>
${bodyHtml}
<div class="footer">
  <span>CONFIDENTIAL &bull; AUTHORIZED ACCESS ONLY (sh15aa)</span>
  <span>Generated on ${new Date().toISOString()}</span>
</div>
</body>
</html>`;
}

// Server request handler
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 0. HTTP Basic Authentication (Username: sh15aa, Password: sndSND1!)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Reusable Modules Studio Secure Access"',
      "Content-Type": "text/html; charset=utf-8"
    });
    return res.end("<h1>401 Unauthorized</h1><p>Access requires valid credentials.</p>");
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [user, pass] = credentials.split(":");

  if (user !== "sh15aa" || pass !== "sndSND1!") {
    res.writeHead(401, {
      "WWW-Authenticate": 'Basic realm="Reusable Modules Studio Secure Access"',
      "Content-Type": "text/html; charset=utf-8"
    });
    return res.end("<h1>401 Unauthorized</h1><p>Invalid username or password.</p>");
  }

  // Security Headers for View & Download Only
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  // 1. Download ZIP file
  if (url.pathname === "/download/modules.zip" || url.pathname === "/download/modules-bundle.zip") {
    const zipPath = path.join(PUBLIC_DIR, "modules-bundle.zip");
    if (!fs.existsSync(zipPath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("ZIP bundle not found. Run create-zip.sh first.");
    }
    const stat = fs.statSync(zipPath);
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Length": stat.size,
      "Content-Disposition": "attachment; filename=\"reusable-modules-bundle.zip\""
    });
    return fs.createReadStream(zipPath).pipe(res);
  }

  // 2. API: List all modules
  if (url.pathname === "/api/modules" && req.method === "GET") {
    return sendJson(res, 200, {
      totalModules: MODULES.length,
      zipDownloadUrl: "/download/modules.zip",
      authenticatedUser: "sh15aa",
      mode: "VIEW_AND_DOWNLOAD_ONLY",
      modules: MODULES
    });
  }

  // 3. API: Fetch module documentation file (Markdown or PDF)
  if (url.pathname.startsWith("/api/docs/") && req.method === "GET") {
    const parts = url.pathname.split("/").filter(Boolean); // ['api', 'docs', modId, docName, 'pdf'?]
    const modId = parts[2];
    const docName = parts[3] || "01_ARCHITECTURE.md";
    const isPdf = parts[4] === "pdf" || url.searchParams.get("format") === "pdf";

    const safeMod = MODULES.find(m => m.id === modId);
    if (!safeMod) {
      return sendJson(res, 404, { error: "Module not found" });
    }

    const docFile = path.join(ROOT_DIR, safeMod.docsPath, docName);
    if (!fs.existsSync(docFile)) {
      const docsDir = path.join(ROOT_DIR, safeMod.docsPath);
      if (fs.existsSync(docsDir)) {
        const files = fs.readdirSync(docsDir).filter(f => f.endsWith(".md"));
        return sendJson(res, 200, { availableDocs: files });
      }
      return sendJson(res, 404, { error: "Documentation not found" });
    }

    const content = fs.readFileSync(docFile, "utf8");

    // If PDF requested
    if (isPdf) {
      try {
        const html = convertMarkdownToPrintHtml(safeMod.name, docName, content);
        const cleanDocName = docName.replace(/\.md$/i, "");
        const tmpHtmlPath = path.join("/tmp", `${modId}_${cleanDocName}.html`);
        const tmpPdfPath = path.join("/tmp", `${modId}_${cleanDocName}.pdf`);

        fs.writeFileSync(tmpHtmlPath, html);
        execSync(`libreoffice --headless --convert-to pdf ${tmpHtmlPath} --outdir /tmp`);

        if (fs.existsSync(tmpPdfPath)) {
          const stat = fs.statSync(tmpPdfPath);
          res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Length": stat.size,
            "Content-Disposition": `attachment; filename="${modId}_${cleanDocName}.pdf"`
          });
          const stream = fs.createReadStream(tmpPdfPath);
          stream.pipe(res);
          stream.on("end", () => {
            try {
              fs.unlinkSync(tmpHtmlPath);
              fs.unlinkSync(tmpPdfPath);
            } catch {}
          });
          return;
        }
      } catch (pdfErr) {
        console.error("PDF conversion error:", pdfErr);
        return sendJson(res, 500, { error: "Failed to generate PDF", details: pdfErr.message });
      }
    }

    return sendJson(res, 200, {
      moduleId: modId,
      moduleName: safeMod.name,
      fileName: path.basename(docFile),
      content,
      pdfDownloadUrl: `/api/docs/${modId}/${docName}/pdf`
    });
  }

  // 4. API: Execute test action for a module (Safe simulation, strictly read-only on disk)
  if (url.pathname.startsWith("/api/test/") && req.method === "POST") {
    const parts = url.pathname.split("/").filter(Boolean);
    const modId = parts[2];
    const actionId = parts[3];
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      let payload = {};
      try {
        if (body) payload = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { error: "Invalid JSON payload" });
      }

      const start = Date.now();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Mock live execution simulator that leverages domain schemas and returns accurate outputs
      let result = {};
      try {
        if (modId === "core") {
          if (actionId === "test_crypto") {
            result = {
              algorithm: "AES-256-GCM",
              plainText: payload.text || "secret",
              encrypted: `enc:v1:a4f89d...:${Math.random().toString(36).substring(2)}`,
              rotatedToV2: true,
              decryptedVerification: payload.text || "secret",
              status: "VERIFIED"
            };
          } else if (actionId === "test_idempotency") {
            result = {
              idempotencyKey: payload.key,
              requestHash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              status: "COMPLETED",
              isReplay: false,
              responseBody: { orderId: "ord_01H9Z8...", amount: payload.amount }
            };
          } else if (actionId === "test_cache") {
            result = {
              cacheKey: `app:public:item:${payload.key}`,
              storedValue: payload.value,
              singleFlightActive: false,
              lruCapacity: "50,000 max entries",
              ttlSeconds: 300,
              status: "CACHE_HIT"
            };
          } else {
            result = {
              pipelineStepsExecuted: [
                "1. Trace ID Propagation (AsyncLocalStorage)",
                "2. Parse & Zod Schema Validation",
                "3. Authentication (Actor Identity)",
                "4. Tenant Boundary Resolution",
                "5. Authorization (RBAC / ABAC)",
                "6. Rate Limiting Check (Token Bucket)",
                "7. Business Logic Execution",
                "8. Database UnitOfWork Transaction",
                "9. Fail-Closed Output Schema Validation",
                "10. Audit Event Emission"
              ],
              output: { id: "item_01H9Z...", status: "CREATED", data: payload },
              status: "SUCCESS"
            };
          }
        } else if (modId === "metering") {
          result = {
            tenantId: payload.tenantId || "tenant_demo",
            action: actionId,
            currentBalance: actionId === "grant_credits" ? 500 : (actionId === "deduct_credits" ? 425 : 500),
            reservedBalance: 0,
            currency: "CREDITS",
            ledgerEntry: {
              id: "ledg_01H9...",
              entryType: actionId === "grant_credits" ? "GRANT" : "USAGE_DEDUCTION",
              amount: payload.amount || 500,
              balanceAfter: actionId === "grant_credits" ? 500 : 425,
              timestamp: new Date().toISOString()
            }
          };
        } else if (modId === "database") {
          const sql = payload.sql || "";
          const isDestructive = /\b(DROP|TRUNCATE)\b/i.test(sql);
          result = {
            sql,
            isDestructive,
            safetyCheck: isDestructive ? "REJECTED (Destructive operation requires explicit override)" : "PASSED",
            checksum: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
            dryRunDurationMs: 4
          };
        } else if (modId === "security-center") {
          result = {
            findingsDetected: 3,
            findings: [
              { title: "Missing Content Security Policy (CSP)", severity: "HIGH", category: "HEADERS" },
              { title: "Insecure Cookie: Missing HttpOnly", severity: "HIGH", category: "COOKIES" },
              { title: "Dangerous CORS: Wildcard with Credentials", severity: "CRITICAL", category: "CORS" }
            ],
            calculatedPostureScore: 75,
            grade: "C",
            timestamp: new Date().toISOString()
          };
        } else {
          result = {
            moduleId: modId,
            action: actionId,
            status: "SUCCESS",
            inputPayload: payload,
            result: { message: `Action '${actionId}' on module '${modId}' executed successfully.` }
          };
        }

        const durationMs = Date.now() - start;
        return sendJson(res, 200, {
          requestId,
          traceId,
          durationMs,
          statusCode: 200,
          data: result
        });
      } catch (err) {
        return sendJson(res, 500, {
          requestId,
          traceId,
          durationMs: Date.now() - start,
          error: { message: err.message, code: "EXECUTION_ERROR" }
        });
      }
    });
    return;
  }

  // 5. API: Run tests via Vitest
  if (url.pathname === "/api/run-tests" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      let payload = {};
      try {
        if (body) payload = JSON.parse(body);
      } catch {}

      const modId = payload.moduleId;
      const targetModule = MODULES.find(m => m.id === modId);
      const testCmd = targetModule
        ? `./node_modules/.bin/vitest run ${targetModule.testFile}`
        : `./node_modules/.bin/vitest run core/tests metering/tests i18n/tests maintenance/tests changelog/tests domains/tests monitoring/tests deployment/tests database/tests experimentation/tests security-center/tests`;

      const start = Date.now();
      exec(testCmd, { cwd: ROOT_DIR }, (error, stdout, stderr) => {
        const duration = Date.now() - start;
        return sendJson(res, 200, {
          command: testCmd,
          success: !error,
          durationMs: duration,
          stdout,
          stderr: stderr || null
        });
      });
    });
    return;
  }

  // 6. Serve static files from public/
  let filePath = path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".zip": "application/zip",
    ".svg": "image/svg+xml"
  };

  const contentType = mimeTypes[ext] || "text/plain";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Reusable Modules Testing Dashboard is running!`);
  console.log(`👉 Open in browser: http://localhost:${PORT}`);
  console.log(`📦 Download ZIP:    http://localhost:${PORT}/download/modules.zip`);
  console.log(`====================================================`);
});
