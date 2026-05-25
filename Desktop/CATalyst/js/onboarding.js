// ============================================================
// ONBOARDING.JS — Single continuous tour
//
// Guides the user through the complete CATalyst loop:
// Practice → tag a wrong answer → read a correct solution →
// End Session → Error Log → Fix Mode P1 → P2 → complete.
//
// Stored: cat_tour_done_${userId}  ('true' = permanent skip)
// Snooze: sessionStorage tour_snoozed  ('true' = skip this session)
// Reset:  localStorage.removeItem(`cat_tour_done_${Auth.currentUser.id}`)
// ============================================================

const Onboarding = {
  _active: false,
  _step: 0,
  _userId: null,
  _pendingWait: null,
  _lastAnswerCorrect: true,

  // Answer-watch phase: go silent after timer step, wait for
  // one wrong AND one right before nudging end-session
  _hasSeenWrong: false,
  _hasSeenRight: false,
  _watchingForAnswers: false,     // tooltip hidden, silently tracking answers
  _answerWatchPhaseActive: false, // true from after timer step until end-nudge

  // Minimize / dock state
  _minimized: false,
  _dockedEdge: null,   // null | 'top' | 'bottom' | 'left' | 'right'

  // DOM
  _overlay: null,
  _spotlight: null,
  _tooltip: null,
  _dismissBar: null,
  _cleanupFns: [],

  // ── Steps ───────────────────────────────────────────────────
  _STEPS: [
    // ── PRACTICE ─────────────────────────────────────────────
    {
      id: 'welcome',
      target: null,
      title: 'Welcome to CATalyst',
      body: 'Most apps give you practice questions. CATalyst makes you <strong>fix your mistakes</strong>.<br><br>This tour walks you through the full loop — takes about 5 minutes.',
      btn: "Let's go →",
      btnAction: () => App.navigate('practice'),
      action: 'btn',
    },
    {
      id: 'start-practice',
      target: null,
      nonBlocking: true,
      title: 'Step 1 — Practice',
      body: 'Questions are loading… You\'ll filter by subject, topic, or difficulty before each session.',
      waitFor: 'questions-loaded',
    },
    {
      id: 'filters',
      target: '#filter-toggle-btn',
      title: 'Customise your practice',
      body: 'Filter by subject, topic, or difficulty. Default loads 25 mixed questions — good for most sessions.',
      btn: 'Got it →',
      action: 'btn',
      position: 'bottom',
    },
    {
      id: 'timer',
      target: '#q-timer',
      title: 'Time per question',
      body: 'CAT is a speed game. This tracks how long you spend on each question — slow topics get flagged in your diagnosis.',
      btn: 'Got it →',
      action: 'btn',
      position: 'bottom',
      // After this btn → _enterWatchMode() in _advance()
    },

    // ── ANSWER WATCH — steps 4 & 5 are jumped to, not reached linearly ──
    {
      id: 'wrong-explanation',
      target: '#error-tag-inline',
      title: '✗ Wrong — tag it now',
      body: 'Tap the reason below. One tap saves the mistake to your <strong>Error Log</strong> and builds your personal fix plan.',
      // No btn — user must tap a mistake type to advance
      position: 'top',
    },
    {
      id: 'right-explanation',
      target: '#solution-box',
      title: '✓ Correct!',
      body: 'Every question has a full step-by-step solution — read it even when you\'re right. That\'s how you find shortcuts and close hidden gaps.',
      btn: 'Got it → Keep going',
      action: 'btn',
      position: 'top',
      // After btn → _hasSeenRight=true, jump to end-nudge or re-enter watch
    },

    // ── SESSION END ───────────────────────────────────────────
    {
      id: 'end-nudge',
      target: '#end-practice-btn',
      title: 'End your session',
      body: "You've seen both sides — a mistake tagged and a correct answer read. End the session to see your full results.",
      action: 'click-target',
      position: 'top',
      // No waitFor — practice.js fires session-summary-shown before our click
      // handler runs, so we advance immediately on click instead
    },
    {
      id: 'session-summary',
      target: '#session-summary',
      title: 'Your session results',
      body: 'Score, accuracy, time per question — all logged.<ul class="tt-list"><li>Wrong answers saved to your <strong>Error Log</strong></li><li>Mark cost calculated per mistake</li></ul>Next: visit your Error Log.',
      btn: 'Go to Error Log →',
      btnAction: () => App.navigate('errorlog'),
      action: 'btn',
    },

    // ── ERROR LOG ─────────────────────────────────────────────
    {
      id: 'errorlog-overview',
      target: '#error-summary-grid',
      title: 'Step 3 — Your Error Log',
      body: 'Your personal diagnostic — grows every session.<ul class="tt-list"><li>Every wrong answer with <strong>mark cost</strong></li><li>Filter by type, subject, or topic</li><li>Patterns surface across all sessions</li></ul>',
      btn: 'Got it →',
      action: 'btn',
    },
    {
      id: 'fix-cta',
      target: '#el-footer-fix-btn',
      nonBlocking: true,
      title: 'Now fix your mistakes',
      body: "Tap <strong>'Fix this now →'</strong> in the bar at the bottom — or the <strong>Fix →</strong> button in the sidebar. The tour will continue automatically.",
      action: 'fix-mode-started',
    },

    // ── FIX MODE ─────────────────────────────────────────────
    {
      id: 'fix-entry',
      target: '#fix-mode-entry',
      title: 'Step 4 — Fix Mode',
      body: '<span class="tt-chip p1">PHASE 1</span> Re-attempt your exact wrong answers — same questions, fresh try.<br><br><span class="tt-chip p2">PHASE 2</span> 5 fresh questions on your weakest topic — targeted skill builders.<br><br>Tap <strong>Let\'s Fix →</strong> to start.',
      // No btn, no action — passive-wait: advances when user clicks "Let's Fix →"
      waitFor: 'fix-questions-loaded',
    },
    {
      id: 'fix-p1',
      target: '#question-card',
      title: 'Phase 1 — Your mistakes',
      body: '<span class="tt-chip p1">PHASE 1 · RED</span><br>Your exact wrong answers — same questions, clean attempt. No solution peek.',
      action: 'answer-selected',
      position: 'top',
      waitFor: 'fix-phase2-started',
    },
    {
      id: 'fix-p2-intro',
      target: '#question-card',
      title: 'Phase 2 — Build the skill',
      body: '<span class="tt-chip p2">PHASE 2 · BLUE</span><br>5 fresh questions on your weakest topic — not past errors, targeted skill builders. Work through them seriously.',
      // No btn — advances automatically when user answers first Phase 2 question
      action: 'answer-selected',
    },
    {
      id: 'fix-p2-q',
      target: '#question-card',
      title: 'New questions, weak topic',
      body: 'Brand new questions to close your skill gap. Work through them the same way — seriously.',
      btn: 'Got it → Keep going',
      action: 'btn',
      position: 'top',
    },
    {
      id: 'complete',
      target: null,
      title: "You're ready. 🎯",
      body: "CATalyst is built on <strong>794+ questions</strong> from premium coaching material, all PYQs, and standard test prep books — hand-picked for quality.<br><br>One focused Fix session beats 100 random questions. This is exactly how CAT scores move.",
      btn: 'Start my first session →',
      action: 'btn',
    },
  ],

  // ── Public API ───────────────────────────────────────────────

  async maybeStart(userId) {
    this._userId = userId;

    // Fast path: localStorage says done
    if (localStorage.getItem(`cat_tour_done_${userId}`) === 'true') return;

    // Session snooze
    if (sessionStorage.getItem('tour_snoozed') === 'true') return;

    // Check Supabase — handles PWA/Safari localStorage split on iOS
    // (home screen PWA and Safari have separate storage contexts)
    if (await this._isCompletedInDB(userId)) {
      localStorage.setItem(`cat_tour_done_${userId}`, 'true');
      return;
    }

    // One-time reset for users who dismissed early before completing fix mode
    await this._checkOneTimeReset(userId);

    // Re-check after potential reset
    if (localStorage.getItem(`cat_tour_done_${userId}`) === 'true') return;

    App.navigate('dashboard');
    setTimeout(() => this._start(), 500);
  },

  async _isCompletedInDB(userId) {
    try {
      if (typeof sbClient === 'undefined' || !sbClient) return false;
      const { count } = await sbClient
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event', 'tour_completed')
        .eq('user_id', userId);
      return count > 0;
    } catch { return false; }
  },

  notify(event) {
    if (!this._active) return;

    // ── Answer-watch phase ──────────────────────────────────
    if (this._watchingForAnswers) {
      if (event === 'wrong-answer' && !this._hasSeenWrong) {
        this._watchingForAnswers = false;
        // 100ms delay: lets _showInlineErrorTag() unhide #error-tag-inline first
        setTimeout(() => this._jumpTo('wrong-explanation'), 100);
      } else if (event === 'answer-selected' && this._lastAnswerCorrect && !this._hasSeenRight) {
        this._watchingForAnswers = false;
        this._jumpTo('right-explanation');
      }
      return;
    }

    // ── Mistake tagged (only during answer-watch phase) ─────
    if (event === 'mistake-tagged' && this._answerWatchPhaseActive) {
      this._hasSeenWrong = true;
      if (this._hasSeenRight) {
        this._answerWatchPhaseActive = false;
        this._jumpTo('end-nudge');
      } else {
        this._enterWatchMode();
      }
      return;
    }

    // ── Pending wait ────────────────────────────────────────
    if (this._pendingWait && this._pendingWait === event) {
      this._pendingWait = null;
      const cur = this._STEPS[this._step];
      // Passive-wait step: no btn, no action — _advance() was never called,
      // so _step hasn't been incremented yet. Do it now.
      if (cur && !cur.btn && !cur.action && cur.waitFor === event) {
        this._step++;
        if (this._step >= this._STEPS.length) { this.complete(); return; }
      }
      this._showStep(this._step);
      return;
    }

    // Block step-action matching while waiting for a specific event
    if (this._pendingWait) return;

    // ── Match current step's action ─────────────────────────
    const step = this._STEPS[this._step];
    if (!step) return;
    const action = typeof step.action === 'function' ? step.action(this) : step.action;
    if (action !== event) return;

    if (event === 'answer-selected') {
      setTimeout(() => this._advance(), 1200);
    } else {
      this._advance();
    }
  },

  // ── Private ─────────────────────────────────────────────────

  async _checkOneTimeReset(userId) {
    const checkedKey = `cat_tour_reset_checked_${userId}`;
    if (localStorage.getItem(checkedKey)) return;
    localStorage.setItem(checkedKey, '1');

    const doneVal = localStorage.getItem(`cat_tour_done_${userId}`);
    if (!doneVal) return;

    try {
      if (typeof sbClient === 'undefined' || !sbClient) return;
      const { count } = await sbClient
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event', 'fix_mode_completed')
        .eq('user_id', userId);

      if (count === 0) {
        localStorage.removeItem(`cat_tour_done_${userId}`);
      }
    } catch (e) {
      // Non-blocking — leave the key alone if Supabase fails
    }
  },

  _start() {
    this._active = true;
    this._step = 0;
    this._pendingWait = null;
    this._lastAnswerCorrect = true;
    this._hasSeenWrong = false;
    this._hasSeenRight = false;
    this._watchingForAnswers = false;
    this._answerWatchPhaseActive = false;
    this._minimized = false;
    this._dockedEdge = null;
    this._createElements();
    this._showStep(0);
  },

  _createElements() {
    if (this._overlay) return;

    this._overlay = document.createElement('div');
    this._overlay.className = 'tour-overlay';
    document.body.appendChild(this._overlay);

    this._spotlight = document.createElement('div');
    this._spotlight.className = 'tour-spotlight';
    document.body.appendChild(this._spotlight);

    this._tooltip = document.createElement('div');
    this._tooltip.className = 'tour-tooltip';
    document.body.appendChild(this._tooltip);

    this._dismissBar = document.createElement('div');
    this._dismissBar.className = 'tour-dismiss-bar';
    this._dismissBar.innerHTML = `
      <button class="tour-dismiss-btn js-snooze">Not now</button>
      <button class="tour-dismiss-btn js-done">I've got it</button>
    `;
    this._dismissBar.querySelector('.js-snooze').onclick = () => this._snooze();
    this._dismissBar.querySelector('.js-done').onclick  = () => this.complete();
    document.body.appendChild(this._dismissBar);
  },

  _showStep(index) {
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];

    // Reset minimize/dock state on every new step
    this._minimized = false;
    this._dockedEdge = null;
    ['is-minimized','is-docked-top','is-docked-bottom','is-docked-left','is-docked-right']
      .forEach(c => this._tooltip.classList.remove(c));
    this._tooltip.style.width = '';

    const step = this._STEPS[index];
    if (!step) { this.complete(); return; }

    const target = typeof step.target === 'function' ? step.target(this) : step.target;
    const title  = typeof step.title  === 'function' ? step.title(this)  : step.title;
    const body   = typeof step.body   === 'function' ? step.body(this)   : step.body;
    const action = typeof step.action === 'function' ? step.action(this) : step.action;

    const isWelcome = step.id === 'welcome';

    // Dismiss bar visible on all steps except welcome
    if (this._dismissBar) {
      this._dismissBar.classList.toggle('is-visible', !isWelcome);
    }

    const buttonsHTML = step.btn
      ? `<div class="tt-actions"><button class="tt-btn">${step.btn}</button></div>`
      : '';

    // Minimize button hidden on welcome (blocking modal, no need)
    const minBtnHTML = isWelcome ? '' : `<button class="tt-minimize-btn" aria-label="Minimize">−</button>`;

    this._tooltip.innerHTML = `
      ${minBtnHTML}
      <div class="tt-progress">${index + 1} / ${this._STEPS.length}</div>
      <div class="tt-title">${title}</div>
      <div class="tt-body">${body}</div>
      ${buttonsHTML}
    `;

    // Click minimized pill anywhere to re-expand
    this._tooltip.onclick = (e) => {
      if (this._minimized) this._toggleMinimize();
    };

    const mainBtn = this._tooltip.querySelector('.tt-btn');
    if (mainBtn) {
      mainBtn.onclick = (e) => {
        e.stopPropagation();
        if (step.btnAction) step.btnAction();
        this._advance();
      };
    }

    const minBtn = this._tooltip.querySelector('.tt-minimize-btn');
    if (minBtn) minBtn.onclick = (e) => { e.stopPropagation(); this._toggleMinimize(); };

    if (window.innerWidth <= 768) this._initDrag();
    else this._initDesktopDrag();


    const el   = target ? document.querySelector(target) : null;
    const rect = el ? el.getBoundingClientRect() : null;
    const useCenter = !target || !rect || !rect.width;

    if (useCenter) {
      if (step.nonBlocking) {
        this._overlay.classList.remove('is-blocking');
      } else {
        this._overlay.classList.add('is-blocking');
      }
      this._spotlight.style.opacity = '0';
    } else {
      this._overlay.classList.remove('is-blocking');
      this._moveSpotlight(rect);
      requestAnimationFrame(() => { this._spotlight.style.opacity = '1'; });

      // Re-position spotlight as user scrolls (spotlight is position:fixed so
      // it needs to track the element's changing viewport coordinates)
      const updateSpotlight = () => {
        if (!this._spotlight) return;
        const r = el.getBoundingClientRect();
        if (r.width) this._moveSpotlight(r);
      };
      window.addEventListener('scroll', updateSpotlight, { passive: true });
      this._cleanupFns.push(() => window.removeEventListener('scroll', updateSpotlight));

      if (action === 'click-target') {
        const handler = () => this._advance();
        el.addEventListener('click', handler, { once: true });
        this._cleanupFns.push(() => el.removeEventListener('click', handler));
      }
    }

    // Passive-wait: no btn, no action — show tooltip, remove blocking, wait for real-UI event
    if (step.waitFor && !step.btn && !step.action) {
      this._pendingWait = step.waitFor;
      if (this._overlay) this._overlay.classList.remove('is-blocking');
    }

    // Position: mobile → bottom pin; desktop + spotlight → adjacent; no target → centered
    if (window.innerWidth <= 768) {
      this._positionMobile();
    } else if (!useCenter) {
      this._positionTooltip(rect, step.position);
    } else {
      this._positionCenter();
    }

    this._tooltip.style.opacity      = '0';
    this._tooltip.style.pointerEvents = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._tooltip.style.opacity      = '1';
        this._tooltip.style.pointerEvents = '';
      });
    });
  },

  _advance() {
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];

    const cur = this._STEPS[this._step];
    this._step++;

    if (this._step >= this._STEPS.length) { this.complete(); return; }

    // After timer → silently watch for answers
    if (cur && cur.id === 'timer') {
      this._enterWatchMode();
      return;
    }

    // After right-explanation btn → check if both conditions met
    if (cur && cur.id === 'right-explanation') {
      this._hasSeenRight = true;
      if (this._hasSeenWrong) {
        this._answerWatchPhaseActive = false;
        this._jumpTo('end-nudge');
      } else {
        this._enterWatchMode();
      }
      return;
    }

    // waitFor is always respected
    if (cur && cur.waitFor) {
      this._pendingWait = cur.waitFor;
      this._tooltip.style.opacity      = '0';
      this._tooltip.style.pointerEvents = 'none';
      this._spotlight.style.opacity    = '0';
      // Remove blocking so user can interact with the app while waiting
      if (this._overlay) this._overlay.classList.remove('is-blocking');
      return;
    }

    this._showStep(this._step);
  },

  _enterWatchMode() {
    this._watchingForAnswers = true;
    this._answerWatchPhaseActive = true;
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];
    if (this._tooltip) {
      this._tooltip.style.opacity      = '0';
      this._tooltip.style.pointerEvents = 'none';
    }
    if (this._spotlight)  this._spotlight.style.opacity  = '0';
    if (this._dismissBar) this._dismissBar.classList.remove('is-visible');
  },

  _jumpTo(stepId) {
    const idx = this._STEPS.findIndex(s => s.id === stepId);
    if (idx === -1) return;
    this._step = idx;
    this._showStep(idx);
  },

  _snooze() {
    // Permanently dismiss — session-only snooze caused the tour to reappear
    // on every new login/browser, making the app feel broken.
    if (this._userId) {
      localStorage.setItem(`cat_tour_done_${this._userId}`, 'true');
      if (typeof DB !== 'undefined') DB.logEvent('tour_completed', this._userId);
    }
    this._teardown();
  },

  complete() {
    if (!this._active) return;
    if (this._userId) {
      localStorage.setItem(`cat_tour_done_${this._userId}`, 'true');
      // Log to Supabase so PWA home screen (separate localStorage on iOS) also knows
      if (typeof DB !== 'undefined') DB.logEvent('tour_completed', this._userId);
    }
    this._teardown();
    if (typeof PWAPrompt !== 'undefined') PWAPrompt.showAfterTour();
  },

  _teardown() {
    this._active = false;
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];

    [this._overlay, this._spotlight, this._tooltip, this._dismissBar].forEach(el => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      setTimeout(() => { if (el && el.parentNode) el.parentNode.removeChild(el); }, 400);
    });
    this._overlay = null; this._spotlight = null; this._tooltip = null; this._dismissBar = null;
  },

  // ── Minimize / dock ─────────────────────────────────────────

  _toggleMinimize() {
    this._minimized = !this._minimized;
    this._tooltip.classList.toggle('is-minimized', this._minimized);
    const btn = this._tooltip.querySelector('.tt-minimize-btn');
    if (btn) btn.textContent = this._minimized ? '+' : '−';
  },

  _initDesktopDrag() {
    let startX, startY, startLeft, startTop, dragging = false;

    const onDown = (e) => {
      if (e.target.closest('button')) return;  // let buttons handle their own clicks
      dragging  = true;
      startX    = e.clientX;
      startY    = e.clientY;
      const r   = this._tooltip.getBoundingClientRect();
      startLeft = r.left;
      startTop  = r.top;
      this._tooltip.classList.add('is-dragging');
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!dragging) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const w  = this._tooltip.offsetWidth, h = this._tooltip.offsetHeight;
      const x  = Math.max(0, Math.min(vw - w, startLeft + e.clientX - startX));
      const y  = Math.max(0, Math.min(vh - h, startTop  + e.clientY - startY));
      this._tooltip.style.left = `${x}px`;
      this._tooltip.style.top  = `${y}px`;
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      this._tooltip.classList.remove('is-dragging');
    };

    this._tooltip.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);

    this._cleanupFns.push(() => {
      this._tooltip.removeEventListener('mousedown', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    });
  },

  _initDrag() {
    let sx, sy, dragging = false;

    const onStart = (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      dragging = false;
    };

    const onMove = (e) => {
      const dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (!dragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) dragging = true;
      if (dragging) {
        this._tooltip.style.left = `${e.touches[0].clientX - this._tooltip.offsetWidth / 2}px`;
        this._tooltip.style.top  = `${e.touches[0].clientY - 20}px`;
        e.preventDefault();
      }
    };

    const onEnd = (e) => {
      if (!dragging) return;
      const x  = e.changedTouches[0].clientX;
      const y  = e.changedTouches[0].clientY;
      const vw = window.innerWidth, vh = window.innerHeight;
      const dists = { top: y, bottom: vh - y, left: x, right: vw - x };
      const edge = Object.keys(dists).reduce((a, b) => dists[a] < dists[b] ? a : b);
      this._dock(edge);
    };

    this._tooltip.addEventListener('touchstart', onStart, { passive: true });
    this._tooltip.addEventListener('touchmove',  onMove,  { passive: false });
    this._tooltip.addEventListener('touchend',   onEnd,   { passive: true });
    this._cleanupFns.push(() => {
      this._tooltip.removeEventListener('touchstart', onStart);
      this._tooltip.removeEventListener('touchmove',  onMove);
      this._tooltip.removeEventListener('touchend',   onEnd);
    });
  },

  _dock(edge) {
    this._dockedEdge = edge;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = 100;
    ['is-docked-top','is-docked-bottom','is-docked-left','is-docked-right']
      .forEach(c => this._tooltip.classList.remove(c));
    this._tooltip.classList.add(`is-docked-${edge}`);
    this._tooltip.style.width = `${w}px`;
    if (edge === 'top')    { this._tooltip.style.top = '0';            this._tooltip.style.left = `${(vw - w) / 2}px`; }
    if (edge === 'bottom') { this._tooltip.style.top = `${vh - 36}px`; this._tooltip.style.left = `${(vw - w) / 2}px`; }
    if (edge === 'left')   { this._tooltip.style.top = `${(vh - 80) / 2}px`; this._tooltip.style.left = '-8px'; }
    if (edge === 'right')  { this._tooltip.style.top = `${(vh - 80) / 2}px`; this._tooltip.style.left = `${vw - w + 8}px`; }
    // Tap docked tab to undock + re-expand
    this._tooltip.onclick = () => {
      this._dockedEdge = null;
      ['is-docked-top','is-docked-bottom','is-docked-left','is-docked-right']
        .forEach(c => this._tooltip.classList.remove(c));
      this._tooltip.style.width = '';
      this._positionMobile();
      this._tooltip.onclick = () => { if (this._minimized) this._toggleMinimize(); };
    };
  },

  // ── Layout helpers ───────────────────────────────────────────

  _moveSpotlight(rect) {
    const p = 8;
    this._spotlight.style.top    = `${rect.top  - p}px`;
    this._spotlight.style.left   = `${rect.left - p}px`;
    this._spotlight.style.width  = `${rect.width  + p * 2}px`;
    this._spotlight.style.height = `${rect.height + p * 2}px`;
  },

  _positionCenter() {
    this._tooltip.style.width = '';
    this._tooltip.style.top   = '';
    this._tooltip.style.left  = '';
    const ttW = this._tooltip.offsetWidth  || 300;
    const ttH = this._tooltip.offsetHeight || 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this._tooltip.style.top  = `${Math.max(16, (vh - ttH) / 2)}px`;
    this._tooltip.style.left = `${Math.max(16, Math.min(vw - ttW - 16, (vw - ttW) / 2))}px`;
  },

  _positionContent() {
    // Park tooltip at top-left of content area — spotlight shows WHICH element,
    // tooltip explains WHY/WHAT without overlapping interactive elements.
    const sidebarW = window.innerWidth > 768 ? 240 : 0;
    this._tooltip.style.top  = '80px';
    this._tooltip.style.left = `${sidebarW + 16}px`;
  },

  _positionTooltip(rect, preferred) {
    this._tooltip.style.top  = '';
    this._tooltip.style.left = '';
    const ttW = this._tooltip.offsetWidth  || 280;
    const ttH = this._tooltip.offsetHeight || 200;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;
    const pad = 16;
    const gap = 12;
    const sidebarW = 240; // matches --sidebar-w on desktop

    // Prefer above when: caller says 'top', OR element is in bottom half, OR not enough room below
    const placeAbove = preferred === 'top'
      || rect.top > vh / 2
      || (vh - rect.bottom < ttH + gap + pad);
    const top = placeAbove
      ? Math.max(pad, rect.top - ttH - gap)
      : Math.min(vh - ttH - pad, rect.bottom + gap);

    // Center tooltip horizontally on the element, clamped inside content area
    const left = Math.max(sidebarW + pad, Math.min(vw - ttW - pad,
      rect.left + rect.width / 2 - ttW / 2));

    this._tooltip.style.top  = `${top}px`;
    this._tooltip.style.left = `${left}px`;
  },

  _positionMobile() {
    this._tooltip.style.top   = '';
    this._tooltip.style.left  = '1rem';
    this._tooltip.style.width = `${window.innerWidth - 32}px`;
    const ttH = this._tooltip.offsetHeight || 200;
    const vh  = window.innerHeight;
    // Pin near bottom, clearing the mobile footer bar (~60px) + breathing room
    this._tooltip.style.top = `${Math.max(80, vh - ttH - 80)}px`;
  },
};
