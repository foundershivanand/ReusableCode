let allModules = [];
let selectedModule = null;
let currentCategory = "ALL";
let currentDoc = "01_ARCHITECTURE.md";

// DOM Elements
const modulesListEl = document.getElementById("modules-list");
const searchInput = document.getElementById("search-input");
const categoryFilters = document.getElementById("category-filters");
const actionSelect = document.getElementById("action-select");
const payloadEditor = document.getElementById("payload-editor");
const executeBtn = document.getElementById("execute-action-btn");
const responseOutput = document.getElementById("response-output");
const resStatus = document.getElementById("res-status");
const resTime = document.getElementById("res-time");
const runModuleTestsBtn = document.getElementById("run-module-tests-btn");
const runAllTestsBtn = document.getElementById("run-all-tests-btn");
const testTerminal = document.getElementById("test-terminal");
const docsListEl = document.getElementById("docs-list");
const docContentEl = document.getElementById("doc-content");
const docTitleEl = document.getElementById("doc-title");

// 1. Initialize
async function init() {
  try {
    const res = await fetch("/api/modules");
    const data = await res.json();
    allModules = data.modules;
    renderModulesList();
    selectModule(allModules[0].id);
  } catch (err) {
    console.error("Failed to load modules:", err);
  }

  setupEventListeners();
}

// 2. Setup Event Listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener("input", () => {
    renderModulesList();
  });

  // Category Filters
  categoryFilters.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-pill")) {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      e.target.classList.add("active");
      currentCategory = e.target.dataset.category;
      renderModulesList();
    }
  });

  // Action Select Change
  actionSelect.addEventListener("change", (e) => {
    if (!selectedModule) return;
    const action = selectedModule.actions.find(a => a.id === e.target.value);
    if (action) {
      payloadEditor.value = JSON.stringify(action.defaultPayload, null, 2);
    }
  });

  // Execute Action Live
  executeBtn.addEventListener("click", async () => {
    if (!selectedModule) return;
    const actionId = actionSelect.value;
    let payload = {};
    try {
      if (payloadEditor.value.trim()) {
        payload = JSON.parse(payloadEditor.value);
      }
    } catch {
      alert("Invalid JSON in payload editor. Please fix syntax.");
      return;
    }

    resStatus.className = "status-badge idle";
    resStatus.textContent = "Executing...";
    executeBtn.disabled = true;

    try {
      const res = await fetch(`/api/test/${selectedModule.id}/${actionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      resStatus.className = res.ok ? "status-badge success" : "status-badge error";
      resStatus.textContent = `${res.status} ${res.ok ? "OK" : "ERROR"}`;
      resTime.textContent = `${data.durationMs || 0} ms`;

      responseOutput.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      resStatus.className = "status-badge error";
      resStatus.textContent = "FAILED";
      responseOutput.textContent = JSON.stringify({ error: err.message }, null, 2);
    } finally {
      executeBtn.disabled = false;
    }
  });

  // Run This Module's Tests
  runModuleTestsBtn.addEventListener("click", () => {
    if (!selectedModule) return;
    runTests(selectedModule.id);
  });

  // Run All Test Suites
  runAllTestsBtn.addEventListener("click", () => {
    runTests(null);
  });

  // Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const tabId = `tab-${btn.dataset.tab}`;
      document.getElementById(tabId).classList.add("active");

      if (btn.dataset.tab === "docs") {
        loadDoc(currentDoc);
      }
    });
  });

  // Docs Navigation
  docsListEl.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) {
      document.querySelectorAll("#docs-list li").forEach(l => l.classList.remove("active"));
      li.classList.add("active");
      currentDoc = li.dataset.doc;
      loadDoc(currentDoc);
    }
  });
}

// 3. Render Modules List
function renderModulesList() {
  const query = searchInput.value.toLowerCase();
  const filtered = allModules.filter(m => {
    const matchesCat = currentCategory === "ALL" || m.category === currentCategory;
    const matchesSearch = m.name.toLowerCase().includes(query) ||
                          m.description.toLowerCase().includes(query) ||
                          m.number.includes(query) ||
                          m.id.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  modulesListEl.innerHTML = "";
  filtered.forEach(m => {
    const item = document.createElement("div");
    item.className = `module-item ${selectedModule?.id === m.id ? "active" : ""}`;
    item.dataset.id = m.id;
    item.innerHTML = `
      <div>
        <div class="module-item-title">${m.name}</div>
        <div class="module-item-sub">${m.category}</div>
      </div>
      <span class="num-badge">M${m.number}</span>
    `;
    item.addEventListener("click", () => selectModule(m.id));
    modulesListEl.appendChild(item);
  });
}

// 4. Select a Module
function selectModule(id) {
  selectedModule = allModules.find(m => m.id === id);
  if (!selectedModule) return;

  // Update UI Elements
  document.getElementById("module-badge").textContent = `Module ${selectedModule.number}`;
  document.getElementById("module-category").textContent = selectedModule.category;
  document.getElementById("module-title").textContent = selectedModule.name;
  document.getElementById("module-description").textContent = selectedModule.description;

  // Update Actions Dropdown
  actionSelect.innerHTML = "";
  if (selectedModule.actions && selectedModule.actions.length > 0) {
    selectedModule.actions.forEach(act => {
      const opt = document.createElement("option");
      opt.value = act.id;
      opt.textContent = act.name;
      actionSelect.appendChild(opt);
    });
    payloadEditor.value = JSON.stringify(selectedModule.actions[0].defaultPayload, null, 2);
  } else {
    actionSelect.innerHTML = "<option value='default'>Default Inspection</option>";
    payloadEditor.value = "{}";
  }

  // Reset Response viewer
  resStatus.className = "status-badge idle";
  resStatus.textContent = "Ready";
  resTime.textContent = "0 ms";
  responseOutput.textContent = `Ready to test ${selectedModule.name}. Click "Execute Action Live".`;

  // Highlight in sidebar
  document.querySelectorAll(".module-item").forEach(item => {
    item.classList.toggle("active", item.dataset.id === id);
  });

  // Load documentation if tab active
  const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab;
  if (activeTab === "docs") {
    loadDoc(currentDoc);
  }
}

// 5. Run Vitest Tests
async function runTests(moduleId) {
  testTerminal.textContent = `Running Vitest test suite for ${moduleId ? "Module " + moduleId : "all modules"}...\n\nPlease wait...\n`;
  runModuleTestsBtn.disabled = true;
  runAllTestsBtn.disabled = true;

  try {
    const res = await fetch("/api/run-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId })
    });
    const data = await res.json();

    let output = `Command: ${data.command}\n`;
    output += `Duration: ${data.durationMs}ms\n`;
    output += `Status: ${data.success ? "✓ PASSED" : "✗ FAILED"}\n`;
    output += `\n--- STDOUT ---\n${data.stdout || ""}\n`;
    if (data.stderr) {
      output += `\n--- STDERR ---\n${data.stderr}\n`;
    }

    testTerminal.textContent = output;
  } catch (err) {
    testTerminal.textContent = `Failed to run tests: ${err.message}`;
  } finally {
    runModuleTestsBtn.disabled = false;
    runAllTestsBtn.disabled = false;
  }
}

// 6. Markdown Renderer for Clean Document Reading
function renderMarkdown(md) {
  return md
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
}

// 7. Load Documentation File (with PDF Download & Print support)
const downloadPdfBtn = document.getElementById("download-pdf-btn");
const printDocBtn = document.getElementById("print-doc-btn");

if (printDocBtn) {
  printDocBtn.addEventListener("click", () => window.print());
}

async function loadDoc(docName) {
  if (!selectedModule) return;
  docTitleEl.textContent = `${selectedModule.name} / ${docName}`;
  docContentEl.innerHTML = "<p>Loading guide...</p>";

  const pdfUrl = `/api/docs/${selectedModule.id}/${docName}/pdf`;
  if (downloadPdfBtn) {
    downloadPdfBtn.href = pdfUrl;
    downloadPdfBtn.setAttribute("download", `${selectedModule.id}_${docName.replace(/\.md$/i, '')}.pdf`);
  }

  try {
    const res = await fetch(`/api/docs/${selectedModule.id}/${docName}`);
    if (!res.ok) {
      docContentEl.innerHTML = `<p style="color:var(--danger)">Document '${docName}' not found for this module.</p>`;
      return;
    }
    const data = await res.json();
    if (data.content) {
      docContentEl.innerHTML = renderMarkdown(data.content);
    } else {
      docContentEl.innerHTML = "<p>No content found.</p>";
    }
  } catch (err) {
    docContentEl.innerHTML = `<p style="color:var(--danger)">Error loading document: ${err.message}</p>`;
  }
}

// Start
init();
