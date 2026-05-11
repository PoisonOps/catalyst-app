// ============================================================
// DASHBOARD.JS — Phase 2: per-subject daily goal widget
// ============================================================

const Dashboard = {
  goalTarget: 20,     // legacy single-number (kept for sidebar progress bar)
  todayDone: 0,

  async init() {
    // Legacy single goal (kept for sidebar widget)
    this.goalTarget = DB.getDailyGoal();
    document.getElementById('goal-target-val').textContent = this.goalTarget;
    document.getElementById('goal-target-display').textContent = this.goalTarget;

    document.getElementById('goal-inc').addEventListener('click', () => {
      this.goalTarget = Math.min(100, this.goalTarget + 5);
      document.getElementById('goal-target-val').textContent = this.goalTarget;
      document.getElementById('goal-target-display').textContent = this.goalTarget;
      DB.setDailyGoal(this.goalTarget);
      this.updateGoalUI();
    });
    document.getElementById('goal-dec').addEventListener('click', () => {
      this.goalTarget = Math.max(5, this.goalTarget - 5);
      document.getElementById('goal-target-val').textContent = this.goalTarget;
      document.getElementById('goal-target-display').textContent = this.goalTarget;
      DB.setDailyGoal(this.goalTarget);
      this.updateGoalUI();
    });
    document.getElementById('start-practice-btn').addEventListener('click', () => App.navigate('practice'));

    // Fix My Mistakes CTA on dashboard
    const fixBtn = document.getElementById('dash-fix-btn');
    if (fixBtn) {
      fixBtn.addEventListener('click', async () => {
        App.navigate('errorlog');
        setTimeout(() => ErrorLog.fixMyMistakes(), 100);
      });
    }

    // Per-subject goal adjusters
    this._initSubjectGoalAdj();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = document.getElementById('user-name-display').textContent;
    document.getElementById('greeting-text').textContent = `${greeting}, ${name}! Keep pushing 💪`;

    await this.refresh();
  },

  _initSubjectGoalAdj() {
    // Quant goal
    const qInc = document.getElementById('goal-quant-inc');
    const qDec = document.getElementById('goal-quant-dec');
    if (qInc) qInc.addEventListener('click', () => this._adjustSubjectGoal('quant_q', 5, 5, 50));
    if (qDec) qDec.addEventListener('click', () => this._adjustSubjectGoal('quant_q', -5, 5, 50));

    // LRDI goal
    const lInc = document.getElementById('goal-lrdi-inc');
    const lDec = document.getElementById('goal-lrdi-dec');
    if (lInc) lInc.addEventListener('click', () => this._adjustSubjectGoal('lrdi_sets', 1, 1, 10));
    if (lDec) lDec.addEventListener('click', () => this._adjustSubjectGoal('lrdi_sets', -1, 1, 10));

    // VARC RC goal
    const vrcInc = document.getElementById('goal-varc-rc-inc');
    const vrcDec = document.getElementById('goal-varc-rc-dec');
    if (vrcInc) vrcInc.addEventListener('click', () => this._adjustSubjectGoal('varc_rc', 1, 1, 10));
    if (vrcDec) vrcDec.addEventListener('click', () => this._adjustSubjectGoal('varc_rc', -1, 1, 10));

    // VARC VA goal
    const vvaInc = document.getElementById('goal-varc-va-inc');
    const vvaDec = document.getElementById('goal-varc-va-dec');
    if (vvaInc) vvaInc.addEventListener('click', () => this._adjustSubjectGoal('varc_va', 5, 5, 30));
    if (vvaDec) vvaDec.addEventListener('click', () => this._adjustSubjectGoal('varc_va', -5, 5, 30));
  },

  _adjustSubjectGoal(key, delta, min, max) {
    const goals = DB.getDailyGoalPerSubject();
    goals[key] = Math.min(max, Math.max(min, (goals[key] || min) + delta));
    DB.setDailyGoalPerSubject(goals);
    this._renderSubjectGoals();
  },

  async refresh() {
    const stats = DB.getStats();
    this.todayDone = stats.todayCount;

    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-accuracy').textContent = stats.accuracy + '%';
    document.getElementById('stat-streak').textContent = stats.streak;
    document.getElementById('stat-time').textContent = stats.timeToday + 'm';

    // Subject bars (hidden in DOM but keep updated)
    ['Quant', 'LRDI', 'VARC'].forEach(sub => {
      const pct = stats.subjectStats[sub] || 0;
      const key = sub.toLowerCase();
      const bar = document.getElementById('bar-' + key);
      const pctEl = document.getElementById('pct-' + key);
      if (bar) bar.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
    });

    this.updateGoalUI();
    this._renderSubjectGoals();
    this._renderWeakTopics(stats);

    const pending = DB.getPendingErrorCount();
    const fixSub = document.getElementById('dash-fix-sub');
    if (fixSub) {
      fixSub.textContent = pending > 0
        ? `${pending} mistake${pending > 1 ? 's' : ''} unresolved — tackle your weakest topic`
        : 'Track mistakes, understand them, fix them';
    }

    const badge = document.getElementById('nav-error-count');
    if (badge) {
      badge.textContent = pending;
      badge.style.display = pending > 0 ? 'inline' : 'none';
    }

    // Recent activity (hidden element, still updated)
    const actEl = document.getElementById('recent-activity');
    if (actEl) {
      actEl.innerHTML = stats.recent.length
        ? stats.recent.map(a => `<div class="activity-item"><div class="activity-dot"></div><span>${a.text}</span><span style="margin-left:auto;font-size:0.75rem;color:var(--text3)">${a.time}</span></div>`).join('')
        : '<p class="empty-state">No activity yet. Start practicing!</p>';
    }
  },

  _renderSubjectGoals() {
    const goals = DB.getDailyGoalPerSubject();
    const progress = DB.getTodaySubjectProgress();
    const container = document.getElementById('subject-goals-widget');
    if (!container) return;

    const rows = [
      {
        label: 'Quant',
        icon: '📐',
        done: progress.quant,
        target: goals.quant_q,
        unit: 'Q',
        color: 'var(--quant-color)',
        incId: 'goal-quant-inc', decId: 'goal-quant-dec', valId: 'goal-quant-val'
      },
      {
        label: 'LRDI',
        icon: '📊',
        done: Math.floor(progress.lrdi / 3),  // rough: 3 Q per set
        target: goals.lrdi_sets,
        unit: 'sets',
        color: 'var(--lrdi-color)',
        incId: 'goal-lrdi-inc', decId: 'goal-lrdi-dec', valId: 'goal-lrdi-val'
      },
      {
        label: 'VARC·RC',
        icon: '📖',
        done: Math.floor(progress.varc_rc / 4),  // RC set_questions, 4 Q per set
        target: goals.varc_rc,
        unit: 'sets',
        color: 'var(--varc-color)',
        incId: 'goal-varc-rc-inc', decId: 'goal-varc-rc-dec', valId: 'goal-varc-rc-val'
      },
      {
        label: 'VARC·VA',
        icon: '✍️',
        done: progress.varc_va,  // VA standalone questions
        target: goals.varc_va,
        unit: 'Q',
        color: 'var(--varc-color)',
        incId: 'goal-varc-va-inc', decId: 'goal-varc-va-dec', valId: 'goal-varc-va-val'
      }
    ];

    container.innerHTML = rows.map(r => {
      const pct = Math.min(100, r.target > 0 ? Math.round((r.done / r.target) * 100) : 0);
      const status = pct >= 100 ? 'full' : pct > 0 ? 'partial' : 'miss';
      const statusIcon = { full: '✅', partial: '🔶', miss: '⭕' }[status];
      return `
        <div class="sg-row">
          <div class="sg-left">
            <span class="sg-icon">${r.icon}</span>
            <span class="sg-label">${r.label}</span>
          </div>
          <div class="sg-bar-wrap">
            <div class="sg-bar-fill" style="width:${pct}%;background:${r.color}"></div>
          </div>
          <div class="sg-right">
            <span class="sg-status">${statusIcon}</span>
            <span class="sg-count">${r.done}/${r.target} ${r.unit}</span>
            <button class="sg-adj" id="${r.decId}">−</button>
            <button class="sg-adj" id="${r.incId}">+</button>
          </div>
        </div>
      `;
    }).join('');

    // Re-bind adjusters after innerHTML reset
    this._initSubjectGoalAdj();
  },

  _renderWeakTopics(stats) {
    const weakEl = document.getElementById('weak-topics-list');
    if (!weakEl) return;

    const insights = DB.getErrorInsights();
    const errorTopics = insights.sortedTopics.slice(0, 3);

    if (errorTopics.length) {
      weakEl.innerHTML = errorTopics.map(([topic, count], i) => `
        <div class="weak-topic-item weak-rank-${i + 1}">
          <div class="weak-topic-left">
            <span class="weak-topic-rank">#${i + 1}</span>
            <span class="weak-topic-name">${topic}</span>
          </div>
          <span class="weak-topic-badge">${count} mistake${count > 1 ? 's' : ''}</span>
        </div>
      `).join('');
      return;
    }

    if (stats.weakTopics.length) {
      weakEl.innerHTML = stats.weakTopics.slice(0, 3).map((t, i) => `
        <div class="weak-topic-item weak-rank-${i + 1}">
          <div class="weak-topic-left">
            <span class="weak-topic-rank">#${i + 1}</span>
            <span class="weak-topic-name">${t.topic}</span>
          </div>
          <span class="weak-topic-pct">${t.accuracy}%</span>
        </div>
      `).join('');
    } else {
      weakEl.innerHTML = '<p class="empty-state">Start practicing to reveal weak topics</p>';
    }
  },

  updateGoalUI() {
    const done = this.todayDone || 0;
    const pct = Math.min(1, done / this.goalTarget);
    const offset = 264 * (1 - pct);
    const circle = document.getElementById('goal-circle-progress');
    if (circle) circle.style.strokeDashoffset = offset;
    const gDone = document.getElementById('goal-done');
    if (gDone) gDone.textContent = done;
    const sidebarFill = document.getElementById('goal-fill-sidebar');
    const sidebarCount = document.getElementById('goal-count-sidebar');
    if (sidebarFill) sidebarFill.style.width = (pct * 100) + '%';
    if (sidebarCount) sidebarCount.textContent = `${done} / ${this.goalTarget}`;
  },

  incrementToday() {
    this.todayDone = (this.todayDone || 0) + 1;
    this.updateGoalUI();
    this._renderSubjectGoals();  // live update subject progress bars
  },

  clearMemory() {
    this.todayDone = 0;
  }
};
