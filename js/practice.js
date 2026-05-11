// ============================================================
// PRACTICE.JS — MCQ + TITA, passage inline, error popup,
//               real timer, report, session end summary
// ============================================================

const Practice = {
  questions: [],
  currentIdx: 0,
  answered: false,
  _startTime: null,
  _timerInterval: null,
  _selectedErrorType: null,   // legacy modal (preserved)
  _selectedInlineType: null,  // inline tag panel
  _errorQuestion: null,
  _sessionCorrect: 0,
  _sessionWrong: 0,
  _sessionTimes: [],
  _isFixSession: false,       // true when launched by Fix My Mistakes
  _hasAutoLoaded: false,      // auto-load once per session

  async init() {
    this.loadState();
    await this._populateTopics();
    document.getElementById('filter-subject').addEventListener('change', () => {
      this._populateTopics().then(() => this.saveState());
    });
    document.getElementById('filter-topic').addEventListener('change', () => this.saveState());
    document.getElementById('filter-difficulty').addEventListener('change', () => this.saveState());
    document.getElementById('load-practice-btn').addEventListener('click', () => this.loadQuestions());
    document.getElementById('prev-btn').addEventListener('click', () => this.navigate(-1));
    document.getElementById('next-btn').addEventListener('click', () => this.navigate(1));
    document.getElementById('end-practice-btn').addEventListener('click', () => this.endPractice());
    document.getElementById('btn-bookmark').addEventListener('click', () => this._toggleBookmark());
    document.getElementById('btn-difficult').addEventListener('click', () => this._toggleDifficult());
    document.getElementById('btn-note').addEventListener('click', () => this._toggleNote());
    document.getElementById('btn-report').addEventListener('click', () => this._openReport());
    document.getElementById('save-note-btn').addEventListener('click', () => this._saveNote());
    document.getElementById('cancel-note-btn').addEventListener('click', () => document.getElementById('note-area').classList.add('hidden'));
    document.getElementById('btn-hint-toggle').addEventListener('click', () => this._toggleHint());
    document.getElementById('tita-submit').addEventListener('click', () => this._submitTITA());
    document.getElementById('tita-input').addEventListener('keydown', e => { if (e.key === 'Enter') this._submitTITA(); });

    // ── Inline error tag buttons ──────────────────────────────
    document.querySelectorAll('.etag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.etag-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._selectedInlineType = btn.dataset.type;
        document.getElementById('etag-save').disabled = false;
      });
    });
    document.getElementById('etag-save').addEventListener('click', () => this._saveInlineError());
    document.getElementById('etag-skip').addEventListener('click', () => this._skipInlineError());

    // ── Legacy error modal (preserved, not triggered in MVP) ──
    document.querySelectorAll('.error-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.error-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this._selectedErrorType = btn.dataset.type;
        document.getElementById('save-error-btn').disabled = false;
      });
    });
    document.getElementById('save-error-btn').addEventListener('click', () => this._saveErrorLog());
    document.getElementById('skip-error-btn').addEventListener('click', () => this._closeErrorModal());

    // Report modal
    document.getElementById('save-report-btn').addEventListener('click', () => this._saveReport());
    document.getElementById('cancel-report-btn').addEventListener('click', () => document.getElementById('report-modal').classList.add('hidden'));

    // Session summary
    document.getElementById('ss-view-errors').addEventListener('click', () => { App.navigate('errorlog'); });
    document.getElementById('ss-practice-more').addEventListener('click', () => {
      this._isFixSession = false;
      this._hasAutoLoaded = false;  // allow auto-load on next visit
      document.getElementById('session-summary').classList.add('hidden');
      document.getElementById('practice-area').classList.add('hidden');
      this.questions = [];
    });
  },

  // Called by App.navigate('practice') — auto-loads on first visit
  async onPageEnter() {
    if (this._hasAutoLoaded || this.questions.length > 0 || this._isFixSession) return;
    this._hasAutoLoaded = true;
    // Small delay so the page renders first
    setTimeout(() => this.loadQuestions(), 120);
  },

  async _populateTopics() {
    const subject = document.getElementById('filter-subject').value;
    const topics = await DB.getAllTopics(subject);
    const el = document.getElementById('filter-topic');
    el.innerHTML = '<option value="all">All Topics</option>';
    topics.forEach(t => { el.innerHTML += `<option value="${t}">${t}</option>`; });
    if (el.dataset.pendingValue) {
      el.value = el.dataset.pendingValue;
      delete el.dataset.pendingValue;
    }
  },

  async loadQuestions() {
    const filters = {
      subject: document.getElementById('filter-subject').value,
      topic: document.getElementById('filter-topic').value,
      difficulty: document.getElementById('filter-difficulty').value
    };
    showLoading('Loading questions...');
    try {
      let questions = await DB.getQuestions(filters);
      questions = DB.sortBySmartQueue(questions);
      this.questions = questions;
      this._sessionCorrect = 0;
      this._sessionWrong = 0;
      this._sessionTimes = [];

      if (!questions.length) {
        document.getElementById('practice-area').classList.add('hidden');
        document.getElementById('session-summary').classList.add('hidden');
        document.getElementById('practice-empty').classList.remove('hidden');
        return;
      }
      document.getElementById('practice-empty').classList.add('hidden');
      document.getElementById('session-summary').classList.add('hidden');
      document.getElementById('practice-area').classList.remove('hidden');
      this.currentIdx = 0;
      this.renderQuestion();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally { hideLoading(); }
  },

  renderQuestion() {
    const q = this.questions[this.currentIdx];
    if (!q) return;
    this.answered = false;
    this._startTimer();

    // Meta bar
    document.getElementById('q-counter').textContent = `Q ${this.currentIdx + 1} / ${this.questions.length}`;
    document.getElementById('q-subject-tag').textContent = q.subject || 'General';
    document.getElementById('q-topic-tag').textContent = q.topic || 'General';

    const diffTag = document.getElementById('q-diff-tag');
    diffTag.textContent = q.difficulty || 'Medium';
    diffTag.className = 'tag tag-diff ' + (q.difficulty || '').toLowerCase();

    const typeTag = document.getElementById('q-type-tag');
    if (q.answer_type === 'tita') {
      typeTag.classList.remove('hidden');
    } else {
      typeTag.classList.add('hidden');
    }

    document.getElementById('question-text').textContent = q.question;

    // Passage
    const passageWrap = document.getElementById('passage-context');
    if (q._passage) {
      passageWrap.classList.remove('hidden');
      document.getElementById('passage-context-text').textContent = q._passage;
    } else {
      passageWrap.classList.add('hidden');
    }

    // MCQ vs TITA
    const optGrid = document.getElementById('options-grid');
    const titaArea = document.getElementById('tita-area');
    optGrid.innerHTML = '';

    if (q.answer_type === 'tita') {
      optGrid.style.display = 'none';
      titaArea.classList.remove('hidden');
      document.getElementById('tita-input').value = '';
      document.getElementById('tita-input').disabled = false;
      document.getElementById('tita-submit').disabled = false;
    } else {
      optGrid.style.display = '';
      titaArea.classList.add('hidden');
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const text = q['option_' + letter.toLowerCase()];
        if (!text) return;
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.letter = letter;
        btn.innerHTML = `<span class="option-label">${letter}</span><span>${text}</span>`;
        btn.addEventListener('click', () => this._selectMCQ(letter, btn));
        optGrid.appendChild(btn);
      });
    }

    // Reset UI
    document.getElementById('answer-area').classList.add('hidden');
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('btn-hint-toggle').textContent = '💡 Show Hint';
    document.getElementById('hint-toggle-pre').classList.remove('hidden');
    document.getElementById('note-area').classList.add('hidden');
    document.getElementById('btn-bookmark').classList.toggle('active', DB.isBookmarked(q.id));
    document.getElementById('btn-difficult').classList.toggle('active', DB.isDifficult(q.id));
  },

  _startTimer() {
    clearInterval(this._timerInterval);
    this._startTime = Date.now();
    const el = document.getElementById('q-timer');
    el.textContent = '0:00';
    this._timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }, 1000);
  },

  _getTimeTaken() {
    clearInterval(this._timerInterval);
    return Math.round((Date.now() - this._startTime) / 1000);
  },

  _selectMCQ(letter, btn) {
    if (this.answered) return;
    this.answered = true;
    const q = this.questions[this.currentIdx];
    const isCorrect = letter === q.correct_option;
    const timeTaken = this._getTimeTaken();
    this._sessionTimes.push(timeTaken);

    document.querySelectorAll('.option-btn').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.letter === q.correct_option) b.classList.add('correct');
      else if (b.dataset.letter === letter && !isCorrect) b.classList.add('wrong');
    });

    this._showSolution(q, isCorrect, q.correct_option);
    this._recordAttempt(q, { selected_option: letter }, isCorrect, timeTaken);

    if (isCorrect) this._sessionCorrect++; else this._sessionWrong++;
    if (!isCorrect) this._showInlineErrorTag(q);
  },

  _submitTITA() {
    if (this.answered) return;
    const q = this.questions[this.currentIdx];
    const val = document.getElementById('tita-input').value.trim();
    if (val === '') { showToast('Enter a numeric answer', 'error'); return; }

    this.answered = true;
    const isCorrect = parseFloat(val) === parseFloat(q.correct_value);
    const timeTaken = this._getTimeTaken();
    this._sessionTimes.push(timeTaken);

    document.getElementById('tita-input').disabled = true;
    document.getElementById('tita-submit').disabled = true;

    this._showSolution(q, isCorrect, q.correct_value);
    this._recordAttempt(q, { selected_value: val }, isCorrect, timeTaken);

    if (isCorrect) this._sessionCorrect++; else this._sessionWrong++;
    if (!isCorrect) this._showInlineErrorTag(q);
  },

  _showSolution(q, isCorrect, correctAnswer) {
    document.getElementById('hint-toggle-pre').classList.add('hidden');
    document.getElementById('answer-area').classList.remove('hidden');

    const badge = document.getElementById('answer-result-badge');
    badge.textContent = isCorrect ? '✓ Correct!' : '✗ Wrong';
    badge.className = 'correct-badge' + (isCorrect ? '' : ' wrong-badge');
    document.getElementById('correct-ans-display').textContent = correctAnswer;

    const solEl = document.getElementById('solution-text');
    solEl.innerHTML = q.solution
      ? `<strong>Solution:</strong> ${q.solution}`
      : `<span style="color:var(--text3)">Refer source material for solution.</span>`;

    Dashboard.incrementToday();
  },

  _recordAttempt(q, answer, isCorrect, timeTaken) {
    DB.saveAttempt({
      question_id: q.id,
      user_id: Auth.currentUser && Auth.currentUser.id,
      selected_option: answer.selected_option || null,
      selected_value: answer.selected_value || null,
      is_correct: isCorrect,
      time_taken: timeTaken,
      source: 'practice',
      subject: q.subject,
      topic: q.topic,
      question_type: q.question_type || 'single'
    });
  },

  navigate(dir) {
    // Hide inline tag panel before navigating
    this._hideInlineErrorTag();
    const newIdx = this.currentIdx + dir;
    if (newIdx < 0) return;
    if (newIdx >= this.questions.length) {
      this._showSessionSummary();
      return;
    }
    this.currentIdx = newIdx;
    this.renderQuestion();
  },

  _showSessionSummary() {
    clearInterval(this._timerInterval);
    document.getElementById('practice-area').classList.add('hidden');
    const total = this._sessionCorrect + this._sessionWrong;
    const acc = total ? Math.round((this._sessionCorrect / total) * 100) : 0;
    const avgTime = this._sessionTimes.length
      ? Math.round(this._sessionTimes.reduce((a, b) => a + b, 0) / this._sessionTimes.length)
      : 0;

    document.getElementById('ss-score').textContent = `${this._sessionCorrect} / ${total}`;
    document.getElementById('ss-acc').textContent = `Accuracy: ${acc}%`;

    document.getElementById('ss-stats').innerHTML = `
      <div class="ss-stat"><div class="ss-stat-val" style="color:var(--green)">${this._sessionCorrect}</div><div class="ss-stat-label">Correct</div></div>
      <div class="ss-stat"><div class="ss-stat-val" style="color:var(--red)">${this._sessionWrong}</div><div class="ss-stat-label">Wrong</div></div>
      <div class="ss-stat"><div class="ss-stat-val" style="color:var(--text2)">${avgTime}s</div><div class="ss-stat-label">Avg Time</div></div>
    `;
    document.getElementById('session-summary').classList.remove('hidden');
    document.getElementById('session-summary').scrollIntoView({ behavior: 'smooth' });
  },

  // End practice mid-session
  endPractice() {
    const answered = this._sessionCorrect + this._sessionWrong;
    if (answered > 0) {
      // Show summary with what was completed so far
      this._showSessionSummary();
    } else {
      // Nothing answered yet — just reset to filter bar
      clearInterval(this._timerInterval);
      document.getElementById('practice-area').classList.add('hidden');
      document.getElementById('session-summary').classList.add('hidden');
      this.questions = [];
      this._hasAutoLoaded = false;
      showToast('Practice ended');
    }
  },


  // ── INLINE ERROR TAGGING ────────────────────────────────────

  _showInlineErrorTag(q) {
    this._errorQuestion = q;
    this._selectedInlineType = null;
    // Reset button states
    document.querySelectorAll('.etag-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('etag-save').disabled = true;
    // Reveal panel with animation
    const panel = document.getElementById('error-tag-inline');
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  _hideInlineErrorTag() {
    document.getElementById('error-tag-inline').classList.add('hidden');
    this._errorQuestion = null;
    this._selectedInlineType = null;
  },

  async _saveInlineError() {
    const q = this._errorQuestion;
    if (!q) return;
    const type = this._selectedInlineType || 'unclassified';
    const noteEl = document.getElementById('etag-note-input');
    const userNote = noteEl ? noteEl.value.trim() : '';
    await DB.saveErrorLog({
      question_id: q.id,
      user_id: Auth.currentUser && Auth.currentUser.id,
      error_type: type,
      user_note: userNote,
      subject: q.subject,
      topic: q.topic,
      question_text: q.question
    });
    if (noteEl) noteEl.value = '';
    this._hideInlineErrorTag();
    this._refreshErrorBadge();
    showToast('Mistake logged ✓', 'success');
  },

  async _skipInlineError() {
    const q = this._errorQuestion;
    if (!q) { this._hideInlineErrorTag(); return; }
    // Save as unclassified so we still track it
    await DB.saveErrorLog({
      question_id: q.id,
      user_id: Auth.currentUser && Auth.currentUser.id,
      error_type: 'unclassified',
      user_note: '',
      subject: q.subject,
      topic: q.topic,
      question_text: q.question
    });
    this._hideInlineErrorTag();
    this._refreshErrorBadge();
    showToast('Saved as unclassified', 'success');
  },

  _refreshErrorBadge() {
    const pending = DB.getPendingErrorCount();
    const badge = document.getElementById('nav-error-count');
    if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline' : 'none'; }
  },

  // ── FIX MY MISTAKES: load a targeted session ────────────────

  loadFixSession(questions) {
    if (!questions || !questions.length) {
      showToast('No questions found for this topic', 'error');
      return;
    }
    this._isFixSession = true;
    this.questions = questions;
    this._sessionCorrect = 0;
    this._sessionWrong = 0;
    this._sessionTimes = [];
    this.currentIdx = 0;
    document.getElementById('practice-empty').classList.add('hidden');
    document.getElementById('session-summary').classList.add('hidden');
    document.getElementById('practice-area').classList.remove('hidden');
    this.renderQuestion();
    App.navigate('practice');
    showToast('Fix session loaded! Let\'s go 💪', 'success');
  },

  // ── LEGACY ERROR MODAL (preserved, not triggered by default) ─

  _openErrorModal(q) {
    this._errorQuestion = q;
    this._selectedErrorType = null;
    document.querySelectorAll('.error-type-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('error-note-input').value = '';
    document.getElementById('save-error-btn').disabled = true;
    document.getElementById('error-modal').classList.remove('hidden');
  },

  _closeErrorModal() {
    document.getElementById('error-modal').classList.add('hidden');
    this._errorQuestion = null;
    this._selectedErrorType = null;
  },

  async _saveErrorLog() {
    if (!this._selectedErrorType || !this._errorQuestion) return;
    const q = this._errorQuestion;
    await DB.saveErrorLog({
      question_id: q.id,
      user_id: Auth.currentUser && Auth.currentUser.id,
      error_type: this._selectedErrorType,
      user_note: document.getElementById('error-note-input').value.trim(),
      subject: q.subject,
      topic: q.topic,
      question_text: q.question
    });
    this._closeErrorModal();
    showToast('Mistake logged ✓', 'success');

    // Refresh badge
    const pending = DB.getPendingErrorCount();
    const badge = document.getElementById('nav-error-count');
    if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline' : 'none'; }
  },

  // ── REPORT MODAL ───────────────────────────────────────────

  _currentReportQId: null,

  _openReport() {
    const q = this.questions[this.currentIdx];
    if (!q) return;
    this._currentReportQId = q.id;
    document.getElementById('report-note').value = '';
    document.getElementById('report-modal').classList.remove('hidden');
  },

  async _saveReport() {
    await DB.saveReport({
      question_id: this._currentReportQId,
      user_id: Auth.currentUser && Auth.currentUser.id,
      report_type: document.getElementById('report-type').value,
      note: document.getElementById('report-note').value.trim()
    });
    document.getElementById('report-modal').classList.add('hidden');
    showToast('Report submitted. Thank you! 🚩', 'success');
  },

  // ── BOOKMARK / DIFFICULT / NOTE / HINT ────────────────────

  _toggleBookmark() {
    const q = this.questions[this.currentIdx];
    const added = DB.toggleBookmark(q.id);
    document.getElementById('btn-bookmark').classList.toggle('active', added);
    showToast(added ? 'Bookmarked 🔖' : 'Bookmark removed', 'success');
  },

  _toggleDifficult() {
    const q = this.questions[this.currentIdx];
    const added = DB.toggleDifficult(q.id);
    document.getElementById('btn-difficult').classList.toggle('active', added);
    showToast(added ? 'Marked difficult 🔴' : 'Removed', 'success');
  },

  _toggleNote() {
    const q = this.questions[this.currentIdx];
    document.getElementById('note-input').value = DB.getNote(q.id);
    document.getElementById('note-area').classList.toggle('hidden');
  },

  _saveNote() {
    const q = this.questions[this.currentIdx];
    DB.saveNote(q.id, document.getElementById('note-input').value.trim());
    document.getElementById('note-area').classList.add('hidden');
    showToast('Note saved 📝', 'success');
  },

  _toggleHint() {
    const hintBox = document.getElementById('hint-box');
    const showing = !hintBox.classList.contains('hidden');
    hintBox.classList.toggle('hidden', showing);
    document.getElementById('btn-hint-toggle').textContent = showing ? '💡 Show Hint' : '💡 Hide Hint';
    if (!showing) {
      const q = this.questions[this.currentIdx];
      document.getElementById('hint-text').textContent = `Topic: ${q.topic || 'General'}. Think step by step before selecting.`;
    }
  },

  _closeReport() {
    document.getElementById('report-modal').classList.add('hidden');
    document.getElementById('report-note').value = '';
    document.getElementById('report-type').value = 'error';
  },

  saveState() {
    const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
    const state = {
      subject: document.getElementById('filter-subject').value,
      topic: document.getElementById('filter-topic').value,
      difficulty: document.getElementById('filter-difficulty').value
    };
    localStorage.setItem(`practice_state_${uid}`, JSON.stringify(state));
  },

  loadState() {
    const uid = Auth.currentUser ? Auth.currentUser.id : 'anon';
    try {
      const state = JSON.parse(localStorage.getItem(`practice_state_${uid}`));
      if (state) {
        if (state.subject) document.getElementById('filter-subject').value = state.subject;
        if (state.topic) document.getElementById('filter-topic').dataset.pendingValue = state.topic; // applied in _populateTopics
        if (state.difficulty) document.getElementById('filter-difficulty').value = state.difficulty;
      }
    } catch (e) { }
  },

  clearMemory() {
    this.questions = [];
    this.currentIdx = 0;
    this.answered = false;
    this._startTime = null;
    clearInterval(this._timerInterval);
    this._selectedInlineType = null;
    this._errorQuestion = null;
    this._sessionCorrect = 0;
    this._sessionWrong = 0;
    this._sessionTimes = [];
    this._isFixSession = false;
    this._hasAutoLoaded = false;

    // Reset visible UI — use correct IDs from index.html
    const practiceArea = document.getElementById('practice-area');
    const sessionSummary = document.getElementById('session-summary');
    const practiceEmpty = document.getElementById('practice-empty');
    if (practiceArea) practiceArea.classList.add('hidden');
    if (sessionSummary) sessionSummary.classList.add('hidden');
    if (practiceEmpty) practiceEmpty.classList.add('hidden');
  }
};
