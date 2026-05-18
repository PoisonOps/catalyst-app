// ============================================================
// ERRORLOG.JS — My Error Log screen
// CTA banner · Insight section · Clickable type cards
// Improved empty state · Fix My Mistakes flow · Status system
// ============================================================

const EL_TYPE_LABELS = {
  calculation:  'Silly mistakes',
  silly:        'Silly mistakes',
  concept_gap:  'Concept gaps',
  conceptual:   'Concept gaps',
  misread:      'Misreads',
  guess:        'Guessing',
  time:         'Guessing',
  unclassified: 'Other mistakes',
};

const EL_COST_MAP = {
  calculation:  { cost: '~8–12 marks',  gain: '+6–10 marks' },
  concept_gap:  { cost: '~10–15 marks', gain: '+8–12 marks' },
  misread:      { cost: '~6–10 marks',  gain: '+5–8 marks'  },
  guess:        { cost: '~4–8 marks',   gain: '+3–6 marks'  },
  unclassified: { cost: '~4–8 marks',   gain: '+3–6 marks'  },
};

const ErrorLog = {

  _activeTypeFilter: null,  // set when clicking a summary card

  async init() {
    this.loadState();

    // Dropdowns → explicitly call render function to update summary and insight section
    document.getElementById('el-subject-filter').addEventListener('change', () => {
      this.saveState();
      this.render();
    });
    document.getElementById('el-type-filter').addEventListener('change', () => {
      this._activeTypeFilter = null; // clear card-click filter when dropdown takes over
      this.saveState();
      this.render();
    });
    document.getElementById('el-status-filter').addEventListener('change', () => {
      this.saveState();
      this.render();
    });

    // CTA button
    const fixBtn = document.getElementById('el-fix-btn');
    if (fixBtn) {
      fixBtn.addEventListener('click', async () => {
        setTimeout(() => ErrorLog.fixMyMistakes(), 100);
      });
    }
    await this.render();
  },

  _getFilteredLogs(allLogs) {
    const subjectFilter = document.getElementById('el-subject-filter').value;
    const typeFilter = this._activeTypeFilter || document.getElementById('el-type-filter').value;
    const statusFilter = document.getElementById('el-status-filter').value;

    let logs = [...allLogs];
    if (subjectFilter !== 'all') logs = logs.filter(l => l.subject === subjectFilter);
    if (typeFilter !== 'all') {
      const legacyMap = { concept_gap: ['concept_gap', 'conceptual'], calculation: ['calculation', 'silly'], misread: ['misread'], guess: ['guess', 'time'], unclassified: ['unclassified'] };
      const allowed = legacyMap[typeFilter] || [typeFilter];
      logs = logs.filter(l => allowed.includes(l.error_type));
    }
    if (statusFilter === 'pending') logs = logs.filter(l => !l.reattempt_status);
    if (statusFilter === 'fixed') logs = logs.filter(l => l.reattempt_status);
    return logs;
  },

  async render(silent = false) {
    if (!silent) showLoading('Loading error logs...');
    try {
      const allLogs = await DB.getErrorLogs({});
      const filteredLogs = this._getFilteredLogs(allLogs);
      await this._renderBiggestIssue(filteredLogs);
      this._renderSummaryCards(allLogs);
      this._renderFilterPills();
      this._renderLogList(allLogs);
      this._renderFooterBar(allLogs);
    } catch (e) {
      if (!silent) showToast('Error loading error logs', 'error');
    } finally {
      if (!silent) hideLoading();
    }
  },

  async _renderBiggestIssue(logs) {
    const block = document.getElementById('el-biggest-issue');
    if (!block) return;

    const pending = logs.filter(l => !l.reattempt_status);
    if (!pending.length) { block.classList.add('hidden'); return; }

    const insights = await DB.getErrorInsights(pending);
    const type = insights.mostCommonError;
    if (!type) { block.classList.add('hidden'); return; }

    // Normalise legacy keys to canonical keys for cost lookup
    const canonical = { silly: 'calculation', conceptual: 'concept_gap', time: 'guess' };
    const costKey = canonical[type] || type;

    const label = EL_TYPE_LABELS[type] || type;
    const { cost, gain } = EL_COST_MAP[costKey] || { cost: '~4–8 marks', gain: '+3–6 marks' };

    document.getElementById('el-bi-type').textContent = label;
    document.getElementById('el-bi-cost').textContent = `Cost: ${cost} — fix this = ${gain}`;

    block.classList.remove('hidden');
  },

  _renderSummaryCards(logs) {
    const pending = logs.filter(l => !l.reattempt_status).length;
    const fixed = logs.filter(l => l.reattempt_status).length;

    const grid = document.getElementById('error-summary-grid');
    grid.innerHTML = `
      <div class="el-stat-box el-stat-pending">
        <div class="el-stat-num">${pending}</div>
        <div class="el-stat-label">Pending</div>
      </div>
      <div class="el-stat-box el-stat-fixed">
        <div class="el-stat-num">${fixed}</div>
        <div class="el-stat-label">Fixed</div>
      </div>
      <div class="el-stat-box el-stat-total">
        <div class="el-stat-num">${logs.length}</div>
        <div class="el-stat-label">Total Logged</div>
      </div>
    `;
  },

  _renderFilterPills() {
    const container = document.getElementById('el-filter-pills');
    if (!container) return;

    const typeFilter = this._activeTypeFilter || document.getElementById('el-type-filter').value;
    const statusFilter = document.getElementById('el-status-filter').value;

    const pills = [
      { label: 'All',     type: 'all',         status: 'all' },
      { label: 'Silly',   type: 'calculation',  status: 'all' },
      { label: 'Concept', type: 'concept_gap',  status: 'all' },
      { label: 'Misread', type: 'misread',      status: 'all' },
      { label: 'Guess',   type: 'guess',        status: 'all' },
      { label: 'Pending', type: 'all',          status: 'pending' },
    ];

    container.innerHTML = pills.map(p => {
      const isActive = p.type === typeFilter && p.status === statusFilter
        || (p.label === 'All' && typeFilter === 'all' && statusFilter === 'all')
        || (p.label === 'Pending' && statusFilter === 'pending');
      return `<button class="el-pill${isActive ? ' active' : ''}" data-type="${p.type}" data-status="${p.status}">${p.label}</button>`;
    }).join('');

    // Deduplicate "All" active when Pending is also active
    const activePills = container.querySelectorAll('.el-pill.active');
    if (activePills.length > 1) activePills[0].classList.remove('active');

    container.querySelectorAll('.el-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.type;
        const s = btn.dataset.status;
        this._activeTypeFilter = t === 'all' ? null : t;
        document.getElementById('el-type-filter').value = t;
        document.getElementById('el-status-filter').value = s;
        this.saveState();
        this.render();
      });
    });
  },

  _renderFooterBar(logs) {
    const bar = document.getElementById('el-footer-bar');
    const msg = document.getElementById('el-footer-msg');
    const btn = document.getElementById('el-footer-fix-btn');
    if (!bar) return;

    const pending = logs.filter(l => !l.reattempt_status).length;
    if (pending > 0) {
      msg.textContent = `${pending} mistake${pending === 1 ? '' : 's'} still unresolved. Don't let them repeat.`;
      bar.classList.remove('hidden');
      if (btn) btn.onclick = () => ErrorLog.fixMyMistakes();
    } else {
      bar.classList.add('hidden');
    }
  },

  _renderLogList(allLogs) {
    const subjectFilter = document.getElementById('el-subject-filter').value;
    const typeFilter = this._activeTypeFilter || document.getElementById('el-type-filter').value;
    const statusFilter = document.getElementById('el-status-filter').value;

    let logs = [...allLogs];

    if (subjectFilter !== 'all') logs = logs.filter(l => l.subject === subjectFilter);
    if (typeFilter !== 'all') {
      // Map new types to also capture legacy equivalents
      const legacyMap = { concept_gap: ['concept_gap', 'conceptual'], calculation: ['calculation', 'silly'], misread: ['misread'], guess: ['guess', 'time'], unclassified: ['unclassified'] };
      const allowed = legacyMap[typeFilter] || [typeFilter];
      logs = logs.filter(l => allowed.includes(l.error_type));
    }
    if (statusFilter === 'pending') logs = logs.filter(l => !l.reattempt_status);
    if (statusFilter === 'fixed') logs = logs.filter(l => l.reattempt_status);

    // Sort: pending first, newest first
    logs.sort((a, b) => {
      if (a.reattempt_status !== b.reattempt_status) return a.reattempt_status ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const container = document.getElementById('error-log-list');

    if (!logs.length) {
      if (allLogs.length === 0) {
        // True empty state — never practiced
        container.innerHTML = `
          <div class="el-empty-state">
            <div class="el-empty-icon">🎯</div>
            <h3>Nothing here yet</h3>
            <p>Start practicing → we'll track your weak areas automatically</p>
            <button class="btn-fix-mistakes" onclick="App.navigate('practice')" style="margin-top:1rem;width:auto;padding:0.75rem 2rem">
              Start Practice →
            </button>
          </div>`;
      } else {
        container.innerHTML = `
          <div class="el-empty-state">
            <div class="el-empty-icon">✅</div>
            <p>No errors match the selected filters.</p>
          </div>`;
      }
      return;
    }

    const typeLabels = {
      concept_gap: '🧠 Concept Gap',
      calculation: '🔢 Calculation',
      misread: '👁️ Misread',
      guess: '🎲 Guess',
      unclassified: '❓ Unclassified',
      // legacy
      conceptual: '🧠 Conceptual',
      silly: '🤦 Silly Mistake',
      time: '⏱️ Time Pressure',
    };

    container.innerHTML = logs.map(log => `
      <div class="el-item ${log.reattempt_status ? 'fixed' : ''}" id="el-${log.id}">
        <span class="el-type-badge ${log.error_type}">${typeLabels[log.error_type] || log.error_type}</span>
        <div class="el-body">
          <div class="el-question" data-raw="${encodeURIComponent(log.question_text || 'Question text unavailable')}"></div>
          <div class="el-meta">
            ${log.subject ? `<span>${log.subject}</span>` : ''}
            ${log.topic ? `<span> · ${log.topic}</span>` : ''}
            <span> · ${this._formatDate(log.created_at)}</span>
          </div>
          ${log.user_note ? `<div class="el-note">"${log.user_note}"</div>` : ''}
        </div>
        ${log.reattempt_status
        ? `<span class="el-fixed-badge">✓ Fixed</span>`
        : `<button class="el-fix-pill" onclick="ErrorLog.markFixed('${log.id}')">Fix →</button>`
      }
      </div>
    `).join('');

    // Render math + line breaks in each question cell after innerHTML is set
    container.querySelectorAll('.el-question[data-raw]').forEach(el => {
      const raw = decodeURIComponent(el.dataset.raw);
      if (typeof renderMath === 'function') {
        renderMath(el, raw);
      } else {
        el.innerHTML = raw.replace(/\\n/g, '<br>');
      }
    });
  },

  async markFixed(id) {
    showLoading('Updating...');
    try {
      await DB.markErrorFixed(id);
      await this.render();
      const pending = await DB.getPendingErrorCount();
      const badge = document.getElementById('nav-error-count');
      if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline' : 'none'; }
      showToast('Marked as fixed ✓', 'success');
    } catch (e) {
      showToast('Error marking fixed', 'error');
    } finally {
      hideLoading();
    }
  },

  // ── FIX MY MISTAKES ──────────────────────────────────────────

  async fixMyMistakes() {
    showLoading('Finding your mistakes...');
    try {
      let questions = await DB.getMistakeQuestions();
      let modeLabel = 'Fix Mode';

      if (!questions || !questions.length) {
        // Fallback Logic
        questions = await DB.getFallbackFixQuestions();
        if (!questions || !questions.length) {
          hideLoading();
          showToast('No questions found! Start practicing broadly.', 'error');
          App.navigate('practice');
          return;
        }

        // Try to figure out what topic the fallback questions are from
        const sampleTopic = questions[0].topic || 'General';
        modeLabel = `Practicing your weak area: ${sampleTopic}`;
        showToast(`No pending mistakes. ${modeLabel}`, 'success');
      } else {
        showToast(`Fixing ${questions.length} mistake(s)`, 'success');
      }

      hideLoading();
      Practice.loadFixSession(questions, modeLabel);
    } catch (e) {
      hideLoading();
      showToast('Error loading fix session: ' + e.message, 'error');
    }
  },

  saveState() {
    const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
    const state = {
      subject: document.getElementById('el-subject-filter').value,
      type: document.getElementById('el-type-filter').value,
      status: document.getElementById('el-status-filter').value
    };
    localStorage.setItem(`error_filters_${uid}`, JSON.stringify(state));
  },

  loadState() {
    const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
    try {
      const state = JSON.parse(localStorage.getItem(`error_filters_${uid}`));
      if (state) {
        if (state.subject) document.getElementById('el-subject-filter').value = state.subject;
        if (state.type) document.getElementById('el-type-filter').value = state.type;
        if (state.status) document.getElementById('el-status-filter').value = state.status;
      }
    } catch (e) { }
  },

  clearMemory() {
    this._activeTypeFilter = null;
  },

  _formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
};
