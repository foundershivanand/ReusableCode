# PROJECT INSTRUCTIONS — AGENT REUSABILITY CONTRACT

## 1. REUSABLE CODE LIBRARY ACCESS

This project is connected to the centralized **Reusable Code Library**:
- **Repository**: [https://github.com/sh15aa/Web-Reusable](https://github.com/sh15aa/Web-Reusable)
- **Raw Registry**: `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json`
- **Categories Overview**: `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/categories.json`
- **Helper Pull Script**: `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh`

---

## 2. THE CORE DIRECTIVE

```
REUSE FIRST. BUILD SECOND.
```

**Before writing new implementation code for any standard feature:**
1. **Query the Registry**:
   Inspect `https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json` (or curl it with `curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json`) to find matching modules.
2. **Match the Capability**:
   Check if the capability is covered by one of the 33 production-ready modules:
   - Authentication, Sessions, OAuth (Google/GitHub/Apple) -> `auth`
   - Payments, Stripe, Subscriptions, Checkout -> `billing`
   - Database Migrations, Turso/libSQL, SQLite, Backups -> `database`, `turso-storage`
   - Multi-Tenancy & Workspace Boundaries -> `tenancy`
   - Rate Limiting, DDoS Protection, IP Shield -> `security`
   - Audit Logging & Tamper-Evident Trails -> `audit`
   - Transactional Email (Resend/Postmark) & Notifications -> `notifications`
   - AI Workflows, LLM Streaming, Prompt Defense, Cost Accounting -> `ai`
   - File Storage, S3, R2, Uploads -> `storage`
   - Feature Flags & Percentage Rollouts -> `flags`
   - A/B Testing & Experiments -> `experimentation`
   - Webhook Delivery & Verification -> `webhooks`
   - Universal Error, Crockford IDs, Idempotency, UnitOfWork -> `core`
   - Admin Controls & User Impersonation -> `admin`
   - SEO, Open Graph & Sitemaps -> `seo`
   - Command Palette (Cmd+K) & Search -> `search`
   - User Onboarding & Interactive Checklists -> `onboarding`
   - GDPR, Terms, Cookie Consent -> `compliance`
   - Preferences & Settings -> `settings`
   - Customer Support & Feedback -> `support`
   - Product Health & Uptime Monitoring -> `monitoring`
3. **Pull the Module into the Project**:
   Run one of these commands directly in the shell:
   ```bash
   # Method 1 (Direct one-liner via pull script):
   curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s <module-name> src/modules/<module-name>

   # Method 2 (Via degit):
   npx --yes degit sh15aa/Web-Reusable/<module-name> src/modules/<module-name>

   # Method 3 (Via git sparse-checkout):
   git clone --depth 1 --filter=blob:none --sparse https://github.com/sh15aa/Web-Reusable.git .reusable-temp && \
     (cd .reusable-temp && git sparse-checkout set <module-name>) && \
     mkdir -p src/modules && cp -r .reusable-temp/<module-name> src/modules/ && \
     rm -rf .reusable-temp
   ```
4. **Install Required Peer Dependencies**:
   Inspect `<module>/schemas/` or the module docs and ensure the project dependencies (`zod`, `react`, etc.) are installed.
5. **Configure Environment Variables**:
   Check `<module>/docs/06_ENVIRONMENT_VARIABLES.md` or `ENV_VARS.md` and add required variables to `.env.example` and `.env.local`.
6. **Integrate — Do NOT Recreate**:
   Import from `src/modules/<module-name>/server/index.js` or `client/index.js` and connect to the product router/pages.

---

## 3. PROHIBITED BEHAVIORS

- ❌ **DO NOT** implement custom authentication from scratch when `auth` is available.
- ❌ **DO NOT** write custom Stripe subscription logic when `billing` is available.
- ❌ **DO NOT** write custom multi-tenant isolation filters when `tenancy` is available.
- ❌ **DO NOT** create ad-hoc error classes when `core` errors are standardized.
- ❌ **DO NOT** create non-standard IDs when `core/ids` Crockford Base32 IDs exist.
