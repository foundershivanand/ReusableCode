// Agent Factory Interactive Web App
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

let currentCategory = 'all';
let searchQuery = '';
let allModules = [];

function initApp() {
  if (window.REGISTRY_DATA && window.REGISTRY_DATA.modules) {
    allModules = window.REGISTRY_DATA.modules;
    renderCategories();
    renderModules();
  } else {
    // Fallback fetch if data.js didn't load
    fetch('modules.json')
      .then(res => res.json())
      .then(data => {
        allModules = data.modules || [];
        renderCategories();
        renderModules();
      })
      .catch(err => {
        console.error('Failed to load modules:', err);
      });
  }
}

function renderCategories() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  // Calculate counts per category
  const counts = { all: allModules.length };
  allModules.forEach(m => {
    counts[m.category] = (counts[m.category] || 0) + 1;
  });

  const categories = ['all', 'factory', 'core', 'memory', 'tools', 'orchestration', 'validation', 'observability', 'evaluation', 'api', 'templates'];

  container.innerHTML = categories.map(cat => {
    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
    const count = counts[cat] || 0;
    const active = cat === currentCategory ? 'active' : '';
    return `<button class="cat-pill ${active}" onclick="selectCategory('${cat}')">${label} (${count})</button>`;
  }).join('');
}

function selectCategory(cat) {
  currentCategory = cat;
  renderCategories();
  renderModules();
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  searchQuery = (input ? input.value : '').toLowerCase().trim();
  renderModules();
}

function renderModules() {
  const grid = document.getElementById('modulesGrid');
  const countBadge = document.getElementById('searchCountBadge');
  if (!grid) return;

  const filtered = allModules.filter(m => {
    const matchCat = currentCategory === 'all' || m.category.toLowerCase() === currentCategory.toLowerCase();
    if (!matchCat) return false;

    if (!searchQuery) return true;

    const searchable = [
      m.name,
      m.id,
      m.category,
      m.description,
      m.path,
      ...(m.exports || [])
    ].join(' ').toLowerCase();

    return searchable.includes(searchQuery);
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} of ${allModules.length} modules`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No modules found matching "<strong>${escapeHtml(searchQuery)}</strong>"</p>
        <button class="btn btn-sm btn-secondary" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(m => {
    const catClass = `cat-${m.category.toLowerCase()}`;
    const exportsTags = (m.exports || []).slice(0, 5).map(e => `<span class="export-tag">${escapeHtml(e)}</span>`).join('');
    const codeExample = m.usage_example ? escapeHtml(m.usage_example) : `# Import: from ${m.path.replace('.py','').replace('/','.')} import ...`;

    return `
      <div class="module-card">
        <div class="module-header">
          <span class="mod-category ${catClass}">${m.category}</span>
          <span class="mod-status">${m.status.toUpperCase()}</span>
        </div>
        <h3 class="module-title">${escapeHtml(m.name)}</h3>
        <div class="module-id">${escapeHtml(m.id)}</div>
        <p class="module-desc">${escapeHtml(m.description)}</p>
        
        <div class="module-meta-path" title="Repository file path">
          📁 ${escapeHtml(m.path)}
        </div>

        <div class="module-exports">
          ${exportsTags}
        </div>

        <div class="code-snippet-box">
          <button class="code-snippet-copy" onclick="copySnippet(this)" data-code="${escapeHtml(m.usage_example || '')}">Copy</button>
          <pre><code>${codeExample}</code></pre>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  currentCategory = 'all';
  searchQuery = '';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  renderCategories();
  renderModules();
}

function switchInstall(tool) {
  const codeEl = document.getElementById('installCommand');
  const tabs = document.querySelectorAll('.install-tab');
  tabs.forEach(t => t.classList.remove('active'));

  if (tool === 'uv') {
    if (codeEl) codeEl.textContent = 'uv add git+https://github.com/sh15aa/agentreusable.git';
    event.target.classList.add('active');
  } else {
    if (codeEl) codeEl.textContent = 'pip install git+https://github.com/sh15aa/agentreusable.git';
    event.target.classList.add('active');
  }
}

function copyInstallCommand() {
  const codeEl = document.getElementById('installCommand');
  const btnText = document.getElementById('copyInstallText');
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.textContent.trim()).then(() => {
    if (btnText) {
      btnText.textContent = 'Copied!';
      setTimeout(() => {
        btnText.textContent = 'Copy';
      }, 2000);
    }
  });
}

function copySnippet(btn) {
  const code = btn.getAttribute('data-code') || '';
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 2000);
  });
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = orig;
    }, 2000);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* Modal Popup Logic */
function openLinksModal() {
  const modal = document.getElementById('linksModalBackdrop');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeLinksModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close-btn') && !e.target.closest('.btn-secondary')) {
    return;
  }
  const modal = document.getElementById('linksModalBackdrop');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close on Escape key press
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLinksModal();
  }
});

