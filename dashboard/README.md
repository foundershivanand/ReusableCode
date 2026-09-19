# Reusable Modules Studio & Testing Dashboard

An interactive, minimal testing dashboard and bundle packager for all **30 Enterprise Reusable Modules** and the **Universal Core Platform**.

---

## 🚀 Quick Start

To launch the dashboard:

```bash
# From workspace root:
node dashboard/server.mjs
```

Or specify a custom port:
```bash
PORT=4000 node dashboard/server.mjs
```

Then open your browser to:
👉 **`http://localhost:3333`**

---

## 📦 Download Complete Modules Bundle (.ZIP)

- You can click the **"Download All Modules (.ZIP)"** button in the dashboard UI.
- Or download directly via URL:
  **`http://localhost:3333/download/modules.zip`**
- Or locate the pre-generated zip archive at:
  [`dashboard/public/modules-bundle.zip`](file:///home/shiva/reusable/dashboard/public/modules-bundle.zip)

The zip bundle contains all 30 modules, the `core/` platform, schemas, servers, migrations, providers, clients, components, 10 standardized architecture docs per module, and test suites.

---

## ⚡ Features of the Dashboard

1. **Modules Directory (30 Modules + Core)**:
   - Search by name, ID, or description.
   - Filter by category: `Foundation`, `Identity & Access`, `Commerce & Billing`, `Operations & Reliability`, `Growth & Engagement`, `Compliance & Security`.

2. **Interactive Manual Tester**:
   - Select any module and test operations live.
   - Edit the JSON payload directly in the web editor.
   - View live response payload, HTTP status, duration (ms), and trace ID.

3. **Automated Vitest Test Runner**:
   - Run the Vitest test suite for any individual module or all modules simultaneously.
   - View real-time terminal output with pass/fail badges and duration.

4. **Architecture & Documentation Viewer**:
   - Read any of the 10 architecture & operational guides per module directly in the browser (`01_ARCHITECTURE.md` to `10_API_REFERENCE.md`).
