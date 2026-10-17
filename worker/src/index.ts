import { REGISTRY, CATEGORIES, PROMPTS, AGENTS_TEMPLATE, PULL_SCRIPT } from "./data.js";
import { PDF_BASE64 } from "./pdfData.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const ECOSYSTEM_LINKS = [
  {
    id: "project-manage",
    title: "Product Hub",
    description: "96 Projects & Master Launch OS — Central management and launch control.",
    url: "https://project-manage-z6u.pages.dev/",
    category: "Management",
    badge: "96 Projects",
    icon: "📊",
  },
  {
    id: "finder",
    title: "Project & Startup Finder",
    description: "Market discovery directory — Find live SaaS products, apps, and verified deals.",
    url: "https://finder-d17.pages.dev/",
    category: "Discovery",
    badge: "Live Directory",
    icon: "🔍",
  },
  {
    id: "bots-reusable",
    title: "Bots Reusable Factory",
    description: "Enterprise bot product factory — Production-grade reusable telegram, discord & automation bots.",
    url: "https://botserusable.pages.dev/",
    category: "Bots",
    badge: "Bot Factory",
    icon: "🤖",
  },
  {
    id: "agents-reusable",
    title: "AI Agents Reusable Factory",
    description: "Autonomous AI agent product factory — Multi-agent orchestrations and reusable agent harnesses.",
    url: "https://agentsreusable.pages.dev/",
    category: "AI",
    badge: "Agent Factory",
    icon: "🧠",
  },
  {
    id: "app-reusable",
    title: "Mobile Product Factory",
    description: "Mobile & app product factory — 163 production-grade reusable modules for mobile apps.",
    url: "https://appreusable.pages.dev/",
    category: "Mobile",
    badge: "163 Modules",
    icon: "📱",
  },
];

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function textResponse(text: string, contentType = "text/plain; charset=utf-8", status = 200): Response {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      ...CORS_HEADERS,
    },
  });
}

function renderHtml(): string {
  const modules = REGISTRY.modules;
  const categories = Object.keys(CATEGORIES.categories);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personal Product Factory — Reusable Code Library</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111726;
      --card-hover: #182032;
      --border: #232f48;
      --border-focus: #3b82f6;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent: #10b981;
      --purple: #8b5cf6;
      --font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      min-height: 100vh;
      line-height: 1.5;
      padding-bottom: 60px;
    }
    header {
      background: linear-gradient(180deg, #131b2e 0%, var(--bg) 100%);
      border-bottom: 1px solid var(--border);
      padding: 48px 24px 32px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      margin-bottom: 16px;
    }
    h1 {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 30%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
    }
    .subtitle {
      color: var(--text-muted);
      max-width: 680px;
      margin: 0 auto 24px;
      font-size: 1.05rem;
    }
    .actions-bar {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      font-family: inherit;
    }
    .btn-primary {
      background: var(--primary);
      color: white;
    }
    .btn-primary:hover {
      background: var(--primary-hover);
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
    }
    .btn-secondary {
      background: var(--card-bg);
      color: var(--text);
      border-color: var(--border);
    }
    .btn-secondary:hover {
      background: var(--card-hover);
      border-color: var(--primary);
    }
    .btn-links {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%);
      color: #c4b5fd;
      border-color: rgba(139, 92, 246, 0.4);
      position: relative;
    }
    .btn-links:hover {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%);
      color: #ffffff;
      border-color: #a78bfa;
      box-shadow: 0 4px 18px rgba(139, 92, 246, 0.35);
      transform: translateY(-1px);
    }
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .controls {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 32px;
    }
    .search-box {
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 20px;
      font-size: 1rem;
      color: var(--text);
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .search-box:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pill:hover, .pill.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    .card-top {
      margin-bottom: 16px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
    }
    .cat-tag {
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .card-id {
      font-family: var(--mono);
      font-size: 0.75rem;
      color: var(--primary);
      margin-bottom: 10px;
    }
    .card-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .tag {
      font-family: var(--mono);
      font-size: 0.7rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
      color: #cbd5e1;
    }
    .card-actions {
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 14px;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .code-cmd {
      flex: 1;
      font-family: var(--mono);
      font-size: 0.75rem;
      background: #090d16;
      border: 1px solid var(--border);
      padding: 6px 10px;
      border-radius: 6px;
      color: #38bdf8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
    }
    .code-cmd:hover {
      border-color: var(--primary);
    }
    .copy-btn {
      background: #1e293b;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .copy-btn:hover {
      background: var(--primary);
      color: white;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 999;
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* Modal / Popup Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.82);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      padding: 20px;
    }
    .modal-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-container {
      background: #0f172a;
      border: 1px solid #293856;
      border-radius: 18px;
      width: 100%;
      max-width: 640px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(139, 92, 246, 0.2);
      transform: scale(0.94);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    .modal-backdrop.open .modal-container {
      transform: scale(1);
    }
    .modal-header {
      padding: 22px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: sticky;
      top: 0;
      background: #0f172a;
      z-index: 2;
    }
    .modal-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .modal-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .modal-close {
      background: #1e293b;
      border: 1px solid #334155;
      color: var(--text-muted);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s ease;
      line-height: 1;
    }
    .modal-close:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }
    .modal-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .link-card {
      background: #151f33;
      border: 1px solid #23314d;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
    }
    .link-card:hover {
      background: #1c2944;
      border-color: #60a5fa;
      transform: translateX(4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    .link-icon {
      font-size: 1.8rem;
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .link-content {
      flex: 1;
      min-width: 0;
    }
    .link-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }
    .link-title {
      font-weight: 700;
      font-size: 1rem;
      color: #ffffff;
    }
    .link-badge {
      font-size: 0.68rem;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .link-desc {
      font-size: 0.82rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin-bottom: 6px;
    }
    .link-url {
      font-family: var(--mono);
      font-size: 0.72rem;
      color: #38bdf8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .link-arrow {
      color: var(--text-muted);
      font-size: 1.2rem;
      transition: transform 0.2s ease, color 0.2s ease;
      flex-shrink: 0;
    }
    .link-card:hover .link-arrow {
      color: #60a5fa;
      transform: translate(2px, -2px);
    }
    .modal-footer {
      padding: 14px 24px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0b1120;
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 18px;
    }
    .modal-footer-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header>
    <div class="badge">🚀 Personal Product Factory Standard</div>
    <h1>Reusable Code Library & Agent Hub</h1>
    <p class="subtitle">33 enterprise-grade, battle-tested software modules ready for autonomous AI coding agents to discover, pull, and integrate directly.</p>
    <div class="actions-bar">
      <button class="btn btn-links" onclick="openLinksModal()" id="allLinksBtn" title="Click to view all connected product hubs, bots & finder tools">
        🔗 All Links
      </button>
      <a href="/api/pdf" target="_blank" class="btn btn-primary">📄 View Audit PDF (${(PDF_BASE64.length * 0.75 / 1024).toFixed(0)} KB)</a>
      <a href="/api/registry" target="_blank" class="btn btn-secondary">🔍 Registry JSON</a>
      <a href="/AGENTS.md" target="_blank" class="btn btn-secondary">🤖 AGENTS.md Template</a>
      <a href="/pull-module.sh" target="_blank" class="btn btn-secondary">⚡ Pull Script</a>
      <a href="https://github.com/sh15aa/Web-Reusable" target="_blank" class="btn btn-secondary">🐙 GitHub Repo</a>
    </div>
  </header>

  <main class="container">
    <div class="controls">
      <input type="text" id="searchInput" class="search-box" placeholder="Search 33 modules by name, ID, capability, or tech (e.g. auth, stripe, turso, s3, ratelimit)..." oninput="filterModules()">
      <div class="pills">
        <button class="pill active" onclick="setCategory('all', this)">All (${modules.length})</button>
        ${categories.map(c => `<button class="pill" onclick="setCategory('${c}', this)">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`).join('')}
      </div>
    </div>

    <div class="grid" id="modulesGrid">
      ${modules.map(m => `
        <div class="card" data-category="${m.category}" data-search="${(m.name + ' ' + m.id + ' ' + m.description + ' ' + m.capabilities.join(' ') + ' ' + m.path).toLowerCase()}">
          <div class="card-top">
            <div class="card-header">
              <span class="card-title">${m.name}</span>
              <span class="cat-tag">${m.category}</span>
            </div>
            <div class="card-id">${m.id} &bull; /${m.path}</div>
            <p class="card-desc">${m.description}</p>
            <div class="tags">
              ${m.capabilities.map(cap => `<span class="tag">${cap}</span>`).join('')}
            </div>
          </div>
          <div class="card-actions">
            <div class="code-cmd" title="Click to copy pull command" onclick="copyPullCmd('${m.path}')">
              pull-module.sh ${m.path}
            </div>
            <button class="copy-btn" onclick="copyPullCmd('${m.path}')">Copy</button>
          </div>
        </div>
      `).join('')}
    </div>
  </main>

  <!-- All Links Popup Modal -->
  <div id="linksModal" class="modal-backdrop" onclick="handleBackdropClick(event)">
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-header">
        <div>
          <h2 id="modalTitle" class="modal-title">🔗 Ecosystem Hubs & Platforms</h2>
          <p class="modal-subtitle">Quick access to all connected product hubs, bot factories, and finder tools.</p>
        </div>
        <button class="modal-close" onclick="closeLinksModal()" aria-label="Close modal">&times;</button>
      </div>
      <div class="modal-body">
        ${ECOSYSTEM_LINKS.map(item => `
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="link-card">
            <div class="link-icon">${item.icon}</div>
            <div class="link-content">
              <div class="link-title-row">
                <span class="link-title">${item.title}</span>
                <span class="link-badge">${item.badge}</span>
              </div>
              <p class="link-desc">${item.description}</p>
              <div class="link-url">${item.url}</div>
            </div>
            <div class="link-arrow">↗</div>
          </a>
        `).join('')}
      </div>
      <div class="modal-footer">
        <span class="modal-footer-hint">Click any card to open in a new tab &bull; Press <code>Esc</code> to close</span>
        <button class="btn btn-secondary" onclick="closeLinksModal()" style="padding: 6px 14px; font-size: 0.8rem;">Close</button>
      </div>
    </div>
  </div>

  <div id="toast" class="toast">Command copied to clipboard!</div>

  <script>
    let activeCategory = 'all';

    function setCategory(cat, el) {
      activeCategory = cat;
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      filterModules();
    }

    function filterModules() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const matchesCategory = activeCategory === 'all' || card.getAttribute('data-category') === activeCategory;
        const matchesQuery = !q || card.getAttribute('data-search').includes(q);
        card.style.display = (matchesCategory && matchesQuery) ? 'flex' : 'none';
      });
    }

    function copyPullCmd(moduleName) {
      const cmd = 'curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s ' + moduleName + ' src/modules/' + moduleName;
      navigator.clipboard.writeText(cmd).then(() => {
        const toast = document.getElementById('toast');
        toast.innerText = 'Copied pull command for ' + moduleName + '!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      });
    }

    // Modal Control Functions
    function openLinksModal() {
      const modal = document.getElementById('linksModal');
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLinksModal() {
      const modal = document.getElementById('linksModal');
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    function handleBackdropClick(event) {
      if (event.target.id === 'linksModal') {
        closeLinksModal();
      }
    }

    // Keyboard support: Escape closes modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeLinksModal();
      }
    });
  </script>
</body>
</html>`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle OPTIONS for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check
    if (path === "/health" || path === "/api/health") {
      return jsonResponse({
        status: "healthy",
        service: "reusable-library-worker",
        account: "foundershivanand@gmail.com",
        modules_count: REGISTRY.total_modules,
        timestamp: new Date().toISOString(),
      });
    }

    // UI Landing Dashboard
    if (path === "/" || path === "/index.html") {
      return new Response(renderHtml(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Ecosystem Links API: /api/links or /links.json
    if (path === "/api/links" || path === "/links" || path === "/links.json") {
      return jsonResponse({
        total: ECOSYSTEM_LINKS.length,
        links: ECOSYSTEM_LINKS,
      });
    }

    // Full Registry JSON
    if (path === "/api/registry" || path === "/registry" || path === "/modules.json" || path === "/registry/modules.json") {
      return jsonResponse(REGISTRY);
    }

    // Categories JSON
    if (path === "/api/categories" || path === "/categories" || path === "/categories.json" || path === "/registry/categories.json") {
      return jsonResponse(CATEGORIES);
    }

    // Single Module lookup: /api/modules/:id
    if (path.startsWith("/api/modules/")) {
      const target = path.replace("/api/modules/", "").toLowerCase();
      const mod = REGISTRY.modules.find(
        (m) => m.id.toLowerCase() === target || m.path.toLowerCase() === target
      );
      if (mod) {
        return jsonResponse(mod);
      }
      return jsonResponse({ error: "Module not found", searched: target }, 404);
    }

    // PDF Download & Inline View
    if (path === "/api/pdf" || path === "/pdf" || path === "/download/pdf") {
      const binaryString = atob(PDF_BASE64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Response(bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="Personal_Product_Factory_Production_Readiness_Audit.pdf"',
          "Cache-Control": "public, max-age=86400",
          ...CORS_HEADERS,
        },
      });
    }

    // Prompts API: /api/prompts or /api/prompts/:name
    if (path === "/api/prompts" || path === "/prompts") {
      return jsonResponse(PROMPTS);
    }
    if (path.startsWith("/api/prompts/")) {
      const promptName = path.replace("/api/prompts/", "").toLowerCase() as keyof typeof PROMPTS;
      if (PROMPTS[promptName]) {
        return textResponse(PROMPTS[promptName], "text/markdown; charset=utf-8");
      }
      return jsonResponse({ error: "Prompt not found", available: Object.keys(PROMPTS) }, 404);
    }

    // AGENTS.md Template
    if (path === "/AGENTS.md" || path === "/agents.md") {
      return textResponse(AGENTS_TEMPLATE, "text/markdown; charset=utf-8");
    }

    // Pull Module Script
    if (path === "/pull-module.sh" || path === "/install.sh") {
      return textResponse(PULL_SCRIPT, "application/x-sh; charset=utf-8");
    }

    return jsonResponse({ error: "Not Found", path }, 404);
  },
};
