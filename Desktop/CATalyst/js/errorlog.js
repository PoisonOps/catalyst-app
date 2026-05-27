// ============================================================
// ERRORLOG.JS — My Error Log screen
// CTA banner · Insight section · Rich filters · Manual entry
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

  _activeTypeFilter: null,
  _activeSubjectFilter: 'all',
  _activeTopicFilter: 'all',
  _searchQuery: '',
  _manualErrorType: null,
  _searchDebounce: null,
  _allLogs: [],
  _filtersExpanded: false,

  async init() {
    this.loadState();

    // Hidden selects — keep listeners so saveState/loadState remain in sync
    document.getElementById('el-subject-filter').addEventListener('change', () => {
      this._activeSubjectFilter = document.getElementById('el-subject-filter').value;
      this.saveState();
      this.render();
    });
    document.getElementById('el-type-filter').addEventListener('change', () => {
      this._activeTypeFilter = null;
      this.saveState();
      this.render();
    });
    document.getElementById('el-status-filter').addEventListener('change', () => {
      this.saveState();
      this.render();
    });

    // CTA button
    const fixBtn = document.getElementById('el-fix-btn');
    if (fixBtn) fixBtn.addEventListener('click', () => setTimeout(() => ErrorLog.fixMyMistakes(), 100));

    // "+ Add Mistake" button
    const addBtn = document.getElementById('el-add-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.showAddModal());

    // Modal buttons
    const cancelBtn = document.getElementById('el-add-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this._closeAddModal());

    const saveBtn = document.getElementById('el-add-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveManualError());

    // Manual entry form
    const manualQ = document.getElementById('el-manual-question');
    if (manualQ) manualQ.addEventListener('input', () => this._validateManualForm());

    const manualSubject = document.getElementById('el-manual-subject');
    if (manualSubject) manualSubject.addEventListener('change', () => this._populateManualTopics());

    document.querySelectorAll('#el-manual-type-grid .error-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#el-manual-type-grid .error-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._manualErrorType = btn.dataset.type;
        this._validateManualForm();
      });
    });

    // "Filters ▼" toggle
    const moreToggle = document.getElementById('el-more-filters-toggle');
    if (moreToggle) moreToggle.addEventListener('click', () => this._toggleExpandedFilters());

    // Close modal on overlay click
    const modal = document.getElementById('el-add-modal');
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this._closeAddModal(); });

    await this.render();
  },

  _getFilteredLogs(allLogs) {
    const subjectFilter = this._activeSubjectFilter !== 'all'
      ? this._activeSubjectFilter
      : document.getElementById('el-subject-filter').value;
    const typeFilter = this._activeTypeFilter || document.getElementById('el-type-filter').value;
    const statusFilter = document.getElementById('el-status-filter').value;
    const topicFilter = this._activeTopicFilter || 'all';
    const search = this._searchQuery;

    let logs = [...allLogs];

    if (subjectFilter !== 'all') logs = logs.filter(l => l.subject === subjectFilter);
    if (typeFilter !== 'all') {
      const legacyMap = {
        concept_gap:  ['concept_gap', 'conceptual'],
        calculation:  ['calculation', 'silly'],
        misread:      ['misread'],
        guess:        ['guess', 'time'],
        unclassified: ['unclassified'],
      };
      const allowed = legacyMap[typeFilter] || [typeFilter];
      logs = logs.filter(l => allowed.includes(l.error_type));
    }
    if (statusFilter === 'pending') logs = logs.filter(l => !l.reattempt_status);
    if (statusFilter === 'fixed')   logs = logs.filter(l => l.reattempt_status);
    if (topicFilter !== 'all')      logs = logs.filter(l => l.topic === topicFilter);
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l => (l.question_text || '').toLowerCase().includes(q));
    }
    return logs;
  },

  async render(silent = false) {
    if (!silent) showLoading('Loading error logs...');
    try {
      const allLogs = await DB.getErrorLogs({});
      this._allLogs = allLogs;
      const filteredLogs = this._getFilteredLogs(allLogs);

      await this._renderBiggestIssue(filteredLogs);
      this._renderSummaryCards(allLogs);
      this._renderStatusPills();
      this._renderTypePills();
      this._renderSubjectChips();
      this._renderTopicFilter(allLogs);
      this._renderLogList(allLogs);
      this._renderFooterBar(allLogs);

      // Restore expanded panel state across renders
      if (this._filtersExpanded) {
        const panel = document.getElementById('el-expanded-filters');
        if (panel) panel.classList.remove('hidden');
      }
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
    const fixed   = logs.filter(l => l.reattempt_status).length;
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

  // ── New 2-row filter bar ─────────────────────────────────────

  _renderStatusPills() {
    const container = document.getElementById('el-status-pills');
    if (!container) return;
    const current = document.getElementById('el-status-filter').value;
    const pills = [
      { label: 'All',     value: 'all'     },
      { label: 'Pending', value: 'pending' },
      { label: 'Fixed',   value: 'fixed'   },
    ];
    container.innerHTML = pills.map(p =>
      `<button class="el-pill${p.value === current ? ' active' : ''}" data-status="${p.value}">${p.label}</button>`
    ).join('');
    container.querySelectorAll('.el-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('el-status-filter').value = btn.dataset.status;
        this.saveState();
        this.render();
      });
    });
  },

  _renderTypePills() {
    const container = document.getElementById('el-type-pills');
    if (!container) return;
    const current = this._activeTypeFilter || document.getElementById('el-type-filter').value;
    const pills = [
      { label: 'All Types', value: 'all'         },
      { label: 'Silly',     value: 'calculation'  },
      { label: 'Concept',   value: 'concept_gap'  },
      { label: 'Misread',   value: 'misread'      },
      { label: 'Guess',     value: 'guess'        },
    ];
    container.innerHTML = pills.map(p => {
      const isActive = p.value === current || (p.value === 'all' && !this._activeTypeFilter && current === 'all');
      return `<button class="el-pill el-type-pill${isActive ? ' active' : ''}" data-type="${p.value}">${p.label}</button>`;
    }).join('');
    container.querySelectorAll('.el-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.type;
        this._activeTypeFilter = t === 'all' ? null : t;
        document.getElementById('el-type-filter').value = t;
        this.saveState();
        this.render();
      });
    });
  },

  _renderSubjectChips() {
    const container = document.getElementById('el-subject-chips');
    if (!container) return;
    const current = this._activeSubjectFilter;
    const chips = [
      { label: 'All Subjects', value: 'all'   },
      { label: 'Quant',        value: 'Quant' },
      { label: 'VARC',         value: 'VARC'  },
      { label: 'LRDI',         value: 'LRDI'  },
    ];
    container.innerHTML = chips.map(c =>
      `<button class="el-pill el-subject-chip${c.value === current ? ' active' : ''}" data-subject="${c.value}">${c.label}</button>`
    ).join('');
    container.querySelectorAll('.el-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activeSubjectFilter = btn.dataset.subject;
        document.getElementById('el-subject-filter').value = btn.dataset.subject;
        this._activeTopicFilter = 'all'; // reset topic when subject changes
        this.saveState();
        this.render();
      });
    });
  },

  _renderTopicFilter(allLogs) {
    const el = document.getElementById('el-topic-select');
    if (!el) return;

    // Only show topics belonging to the active subject
    const subjectLogs = this._activeSubjectFilter !== 'all'
      ? allLogs.filter(l => l.subject === this._activeSubjectFilter)
      : allLogs;
    const topics = [...new Set(subjectLogs.map(l => l.topic).filter(Boolean))].sort();

    el.innerHTML = '<option value="all">All Topics</option>' +
      topics.map(t => `<option value="${t}">${t}</option>`).join('');

    // If the previously selected topic doesn't exist in this subject, reset it
    if (this._activeTopicFilter !== 'all' && !topics.includes(this._activeTopicFilter)) {
      this._activeTopicFilter = 'all';
    }
    el.value = this._activeTopicFilter || 'all';

    // Attach listener only once (remove + re-add to avoid duplicates)
    el.replaceWith(el.cloneNode(true));
    const fresh = document.getElementById('el-topic-select');
    fresh.value = this._activeTopicFilter || 'all';
    fresh.addEventListener('change', (e) => {
      this._activeTopicFilter = e.target.value;
      this._renderLogList(this._allLogs);
    });

    // Wire search input listener too (only if not yet wired)
    const search = document.getElementById('el-search-input');
    if (search && !search.dataset.wired) {
      search.dataset.wired = '1';
      search.addEventListener('input', (e) => {
        clearTimeout(this._searchDebounce);
        this._searchDebounce = setTimeout(() => {
          this._searchQuery = e.target.value.trim();
          this._renderLogList(this._allLogs);
        }, 250);
      });
    }
  },

  _toggleExpandedFilters() {
    const panel = document.getElementById('el-expanded-filters');
    const chevron = document.getElementById('el-toggle-chevron');
    if (!panel) return;
    const isHidden = panel.classList.toggle('hidden');
    this._filtersExpanded = !isHidden;
    if (chevron) chevron.textContent = isHidden ? '▼' : '▲';
  },

  // ── Legacy pill render (hidden container, kept for safety) ───

  _renderFilterPills() {
    // Container is now hidden; this is a no-op kept for safety
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
    let logs = this._getFilteredLogs(allLogs);

    // Sort: pending first, then newest first
    logs.sort((a, b) => {
      if (a.reattempt_status !== b.reattempt_status) return a.reattempt_status ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const container = document.getElementById('error-log-list');

    if (!logs.length) {
      if (allLogs.length === 0) {
        container.innerHTML = `
          <div class="el-empty-state">
            <div class="el-empty-icon">🎯</div>
            <h3>Nothing here yet</h3>
            <p>Start practicing → we'll track your weak areas automatically</p>
            <p style="margin-top:0.5rem;font-size:0.85rem;color:var(--text2)">Or add a mistake manually with <strong>+ Add Mistake</strong></p>
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
      concept_gap:  '🧠 Concept Gap',
      calculation:  '🔢 Calculation',
      misread:      '👁️ Misread',
      guess:        '🎲 Guess',
      unclassified: '❓ Unclassified',
      conceptual:   '🧠 Concept Gap',
      silly:        '🔢 Calculation',
      time:         '🎲 Guess',
    };

    container.innerHTML = logs.map(log => `
      <div class="el-item el-item-v2 ${log.reattempt_status ? 'fixed' : ''}" id="el-${log.id}">
        <div class="el-stripe el-stripe-${log.error_type}"></div>
        <div class="el-body">
          <div class="el-header-row-card">
            <div class="el-badges">
              <span class="el-type-badge ${log.error_type}">${typeLabels[log.error_type] || log.error_type}</span>
              ${!log.question_id ? '<span class="el-manual-tag">External</span>' : ''}
            </div>
            <span class="el-date">${this._formatDate(log.created_at)}</span>
          </div>
          ${(log.subject || log.topic) ? `<div class="el-meta">${[log.subject, log.topic].filter(Boolean).join(' · ')}</div>` : ''}
          <div class="el-question" data-raw="${encodeURIComponent(log.question_text || 'No description')}"></div>
          ${log.user_note ? `<div class="el-note">"${log.user_note}"</div>` : ''}
        </div>
        <div class="el-action">
          ${log.reattempt_status
            ? `<span class="el-fixed-badge">✓ Fixed</span>`
            : `<button class="el-fix-pill" onclick="ErrorLog.markFixed('${log.id}')">Fix →</button>`}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.el-question[data-raw]').forEach(el => {
      try {
        const raw = decodeURIComponent(el.dataset.raw);
        if (typeof renderMath === 'function') {
          renderMath(el, raw);
        } else {
          el.textContent = raw;
        }
      } catch (e) {
        console.warn('[EL] renderMath failed for card:', el.dataset.raw?.slice(0, 80), e);
        try { el.textContent = decodeURIComponent(el.dataset.raw || ''); } catch (_) { el.textContent = '(unavailable)'; }
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

  // ── Manual entry modal ───────────────────────────────────────

  showAddModal() {
    const q = document.getElementById('el-manual-question');
    const n = document.getElementById('el-manual-note');
    const s = document.getElementById('el-manual-subject');
    const t = document.getElementById('el-manual-topic');
    if (q) q.value = '';
    if (n) n.value = '';
    if (s) s.value = '';
    if (t) t.innerHTML = '<option value="">— Select —</option>';
    document.querySelectorAll('#el-manual-type-grid .error-type-btn').forEach(b => b.classList.remove('selected'));
    this._manualErrorType = null;
    const saveBtn = document.getElementById('el-add-save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Save Mistake'; }
    document.getElementById('el-add-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  _closeAddModal() {
    document.getElementById('el-add-modal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  _validateManualForm() {
    const hasText = (document.getElementById('el-manual-question')?.value || '').trim().length > 0;
    const hasType = !!this._manualErrorType;
    const saveBtn = document.getElementById('el-add-save-btn');
    if (saveBtn) saveBtn.disabled = !(hasText && hasType);
  },

  _populateManualTopics() {
    const subject = document.getElementById('el-manual-subject')?.value;
    const el = document.getElementById('el-manual-topic');
    if (!el) return;
    const topicMap = (typeof CAT_TAXONOMY !== 'undefined' && subject && CAT_TAXONOMY[subject]) || {};
    const topics = Object.keys(topicMap);
    el.innerHTML = '<option value="">— Select —</option>' +
      topics.map(t => `<option value="${t}">${t}</option>`).join('');
  },

  async saveManualError() {
    const question_text = (document.getElementById('el-manual-question')?.value || '').trim();
    const error_type = this._manualErrorType;
    if (!question_text || !error_type) return;

    const subject   = document.getElementById('el-manual-subject')?.value || null;
    const topic     = document.getElementById('el-manual-topic')?.value || null;
    const user_note = (document.getElementById('el-manual-note')?.value || '').trim();

    const saveBtn = document.getElementById('el-add-save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    try {
      await DB.saveErrorLog({ question_id: null, error_type, subject, topic, question_text, user_note });
      this._closeAddModal();
      showToast('Mistake added ✓', 'success');
      await this.render();
      const pending = await DB.getPendingErrorCount();
      const badge = document.getElementById('nav-error-count');
      if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline' : 'none'; }
    } catch (e) {
      showToast('Error saving: ' + e.message, 'error');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Mistake'; }
    }
  },

  // ── FIX MY MISTAKES ──────────────────────────────────────────

  async fixMyMistakes() {
    showLoading('Finding your mistakes...');
    try {
      let questions = await DB.getMistakeQuestions();
      let modeLabel = 'Fix Mode';

      if (!questions || !questions.length) {
        questions = await DB.getFallbackFixQuestions();
        if (!questions || !questions.length) {
          hideLoading();
          showToast('No questions found! Start practicing broadly.', 'error');
          App.navigate('practice');
          return;
        }
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
      type:    document.getElementById('el-type-filter').value,
      status:  document.getElementById('el-status-filter').value,
      topic:   this._activeTopicFilter || 'all',
    };
    localStorage.setItem(`error_filters_${uid}`, JSON.stringify(state));
  },

  loadState() {
    const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
    try {
      const state = JSON.parse(localStorage.getItem(`error_filters_${uid}`));
      if (state) {
        if (state.subject) document.getElementById('el-subject-filter').value = state.subject;
        if (state.type)    document.getElementById('el-type-filter').value = state.type;
        if (state.status)  document.getElementById('el-status-filter').value = state.status;
        this._activeSubjectFilter = state.subject || 'all';
        this._activeTypeFilter    = (state.type && state.type !== 'all') ? state.type : null;
        this._activeTopicFilter   = state.topic || 'all';
      }
    } catch (e) { }
  },

  clearMemory() {
    this._activeTypeFilter    = null;
    this._activeSubjectFilter = 'all';
    this._activeTopicFilter   = 'all';
    this._searchQuery         = '';
    this._filtersExpanded     = false;
  },

  _formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
};
