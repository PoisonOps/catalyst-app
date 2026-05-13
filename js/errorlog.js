// ============================================================
// ERRORLOG.JS — My Error Log screen
// CTA banner · Insight section · Clickable type cards
// Improved empty state · Fix My Mistakes flow · Status system
// ============================================================

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
      this._renderCTABanner(filteredLogs);
      await this._renderInsightSection(filteredLogs);
      this._renderSummaryCards(filteredLogs);
      this._renderLogList(allLogs);
    } catch (e) {
      if (!silent) showToast('Error loading error logs', 'error');
    } finally {
      if (!silent) hideLoading();
    }
  },

  _renderCTABanner(logs) {
    const pending = logs.filter(l => !l.reattempt_status).length;
    const sub = document.getElementById('el-cta-sub');
    if (sub) {
      sub.textContent = pending > 0
        ? `You have ${pending} unresolved mistake${pending > 1 ? 's' : ''} — fix your weakest topic now`
        : 'Start practicing — we\'ll track your weak areas';
    }
  },

  async _renderInsightSection(logs) {
    if (!logs.length) {
      document.getElementById('el-insight-section').style.display = 'none';
      return;
    }
    const pendingLogs = logs.filter(l => !l.reattempt_status);
    const insights = await DB.getErrorInsights(pendingLogs);
    const section = document.getElementById('el-insight-section');
    section.style.display = 'flex';

    const typeLabels = {
      concept_gap: '🧠 Concept Gap',
      calculation: '🔢 Calculation Error',
      misread: '👁️ Misread Question',
      guess: '🎲 Guess',
      unclassified: '❓ Unclassified',
      // legacy keys (backward compat)
      conceptual: '🧠 Conceptual',
      silly: '🤦 Silly Mistake',
      time: '⏱️ Time Pressure',
    };

    const topicEl = document.getElementById('el-insight-topic-val');
    const errorEl = document.getElementById('el-insight-error-val');

    if (topicEl) {
      topicEl.textContent = insights.weakestTopic
        ? `${insights.weakestTopic} (${insights.topicCounts[insights.weakestTopic]} mistakes)`
        : '—';
    }
    if (errorEl) {
      errorEl.textContent = insights.mostCommonError
        ? `${typeLabels[insights.mostCommonError] || insights.mostCommonError}`
        : '—';
    }
  },

  _renderSummaryCards(logs) {
    const types = {
      concept_gap: { icon: '🧠', label: 'Concept Gap', count: 0, color: 'concept_gap' },
      calculation: { icon: '🔢', label: 'Calculation Error', count: 0, color: 'calculation' },
      misread: { icon: '👁️', label: 'Misread', count: 0, color: 'misread' },
      guess: { icon: '🎲', label: 'Guess', count: 0, color: 'guess' },
      unclassified: { icon: '❓', label: 'Unclassified', count: 0, color: 'unclassified' },
      // Legacy keys
      conceptual: { icon: '🧠', label: 'Conceptual', count: 0, color: 'concept_gap' },
      silly: { icon: '🤦', label: 'Silly Mistake', count: 0, color: 'calculation' },
      time: { icon: '⏱️', label: 'Time Pressure', count: 0, color: 'guess' },
    };

    logs.forEach(l => { if (types[l.error_type]) types[l.error_type].count++; });

    const pending = logs.filter(l => !l.reattempt_status).length;
    const fixed = logs.filter(l => l.reattempt_status).length;

    // Dedupe (combine legacy + new keys for display)
    const displayTypes = [
      { key: 'concept_gap', ...types.concept_gap, extraCount: types.conceptual.count },
      { key: 'calculation', ...types.calculation, extraCount: types.silly.count },
      { key: 'misread', ...types.misread, extraCount: 0 },
      { key: 'guess', ...types.guess, extraCount: types.time.count },
      { key: 'unclassified', ...types.unclassified, extraCount: 0 },
    ];

    const grid = document.getElementById('error-summary-grid');
    grid.innerHTML = `
      ${displayTypes.map(t => `
        <div class="es-card ${t.color} es-card-clickable" data-type="${t.key}" title="Filter by ${t.label}">
          <div class="es-icon">${t.icon}</div>
          <div class="es-count">${t.count + t.extraCount}</div>
          <div class="es-label">${t.label}</div>
        </div>
      `).join('')}
      <div class="es-card" style="border-color:rgba(244,76,96,0.4)">
        <div class="es-icon">🔁</div>
        <div class="es-count" style="color:var(--red)">${pending}</div>
        <div class="es-label">Pending</div>
      </div>
      <div class="es-card" style="border-color:rgba(62,207,122,0.4)">
        <div class="es-icon">✅</div>
        <div class="es-count" style="color:var(--green)">${fixed}</div>
        <div class="es-label">Fixed</div>
      </div>
      <div class="es-card">
        <div class="es-icon">📋</div>
        <div class="es-count">${logs.length}</div>
        <div class="es-label">Total Logged</div>
      </div>
    `;

    // Make type cards clickable for filtering
    grid.querySelectorAll('.es-card-clickable').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        if (this._activeTypeFilter === type) {
          // Toggle off
          this._activeTypeFilter = null;
          card.classList.remove('es-card-active');
        } else {
          this._activeTypeFilter = type;
          grid.querySelectorAll('.es-card-clickable').forEach(c => c.classList.remove('es-card-active'));
          card.classList.add('es-card-active');
        }
        // Sync dropdown
        const dropdown = document.getElementById('el-type-filter');
        if (dropdown) dropdown.value = this._activeTypeFilter || 'all';
        this.saveState();
        this.render();
      });
    });
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
        : `<button class="el-fix-btn" onclick="ErrorLog.markFixed('${log.id}')">Mark as Fixed ✓</button>`
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
