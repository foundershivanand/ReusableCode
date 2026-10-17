# New Project AI Agent Prompt

When building any new product, provide this exact prompt to your coding agent (Codex, Cursor, Claude Code, Copilot, Antigravity):

---

```text
Build this application: [Describe your requirements here, e.g., SaaS dashboard with Google OAuth login, Stripe subscription checkout, and multi-tenant workspace isolation].

CRITICAL INSTRUCTION:
Before writing ANY implementation code, inspect the reusable-code library and its registry at:
https://github.com/sh15aa/Web-Reusable

1. Check registry/modules.json (or fetch https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/registry/modules.json).
2. Identify every reusable module that satisfies these requirements.
3. Create a short plan listing:
   - Requirement
   - Reusable module name
   - Destination path (e.g. src/modules/<module-name>)
   - Key capabilities & exported services to use
4. Pull each module directly using:
   git clone --depth 1 --filter=blob:none --sparse https://github.com/sh15aa/Web-Reusable.git .reusable-temp && \
     (cd .reusable-temp && git sparse-checkout set <module-name>) && \
     mkdir -p src/modules && cp -r .reusable-temp/<module-name> src/modules/ && \
     rm -rf .reusable-temp
5. Read the module documentation in <module>/docs/10_API_REFERENCE.md and <module>/docs/06_ENVIRONMENT_VARIABLES.md.
6. Install any required peer dependencies and configure .env.
7. Wire up the modules into the application.

Do not recreate functionality that already exists in the reusable library.
```
