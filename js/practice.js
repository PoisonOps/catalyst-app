// ============================================================
// PRACTICE.JS — MCQ + TITA, passage inline, error popup,
//               real timer, report, session end summary
// ============================================================

// ── BASE URL for image assets ─────────────────────────────
// Images stored in Supabase Storage or a CDN; prefix every image_url with this.
const BASE_URL = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL)
  ? SUPABASE_URL + '/storage/v1/object/public/cat-assets/'
  : '';

/**
 * formatText(text)
 * ─────────────────────────────────────────────────────────
 * Converts the /n/ line-break marker (used in DB content)
 * and the literal \n escape sequence into HTML <br> tags.
 * Safely masks LaTeX blocks to prevent mangling \ne, \n etc.
 * Returns sanitised HTML string — safe to set as innerHTML.
 */
function formatText(text) {
  if (!text) return '';
  
  const mathBlocks = [];
  // 1. Temporarily mask LaTeX blocks so line-break replacements don't mangle them.
  // Matches $$...$$, \[...\], and \(...\) blocks. (Excludes single $ to protect currency)
  let maskedText = String(text).replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g, (match) => {
    // Escape < and > inside math blocks so the browser doesn't interpret them as HTML tags
    const escapedMatch = match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    mathBlocks.push(escapedMatch);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });

  // 2. Apply line breaks ONLY to normal text
  maskedText = maskedText
    .replaceAll('/n/', '<br>')          // DB-style marker: /n/
    .replace(/\\n/g, '<br>')           // escaped literal: \n
    .replace(/\n/g, '<br>');           // real newline character

  // 3. Restore LaTeX blocks intact
  mathBlocks.forEach((block, i) => {
    maskedText = maskedText.replace(`__MATH_BLOCK_${i}__`, () => block);
  });

  return maskedText;
}

/**
 * formatRC(text)
 * ─────────────────────────────────────────────────────────
 * Formats RC passages into clean paragraphs instead of using <br>.
 * Safely masks LaTeX blocks to prevent mangling them during split.
 */
function formatRC(text) {
  if (!text) return '';
  
  const mathBlocks = [];
  let maskedText = String(text).replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g, (match) => {
    const escapedMatch = match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    mathBlocks.push(escapedMatch);
    return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
  });

  maskedText = maskedText
    .split('/n/n/') // paragraph separation
    .map(p => `<p class="rc-para">${p.replaceAll('/n/', '<br>')}</p>`)
    .join('');

  mathBlocks.forEach((block, i) => {
    maskedText = maskedText.replace(`__MATH_BLOCK_${i}__`, () => block);
  });

  return maskedText;
}

/**
 * renderMath(el, rawText, isRC)
 * ─────────────────────────────────────────────────────────
 * 1. Applies formatText() safely separating math and text.
 * 2. Sets element innerHTML so <br> is rendered.
 * 3. Runs KaTeX auto-render over the element so LaTeX
 *    delimiters are typeset correctly.
 */
function renderMath(el, rawText, isRC = false) {
  if (!el) return;
  el.innerHTML = isRC ? formatRC(rawText) : formatText(rawText);
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true  },
        { left: '\\(',  right: '\\)', display: false },
        { left: '\\[',  right: '\\]', display: true  }
      ],
      throwOnError: false
    });
  }
}

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

    // ── Solution toggle ──────────────────────────────────────────────────
    document.getElementById('show-solution-btn').addEventListener('click', () => {
      const solText = document.getElementById('solution-text');
      const solBtn  = document.getElementById('show-solution-btn');
      const isHidden = solText.classList.toggle('hidden');
      solBtn.textContent = isHidden ? '💡 Show Solution' : '🔼 Hide Solution';
    });
    // ── Inline error tag: 1-click save ────────────────────────────────
    document.querySelectorAll('.etag-btn').forEach(btn => {
      btn.addEventListener('click', () => this._saveInlineErrorWithType(btn.dataset.type));
    });
    document.getElementById('etag-skip').addEventListener('click', () => this._saveInlineErrorWithType('unclassified'));

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
      questions = await DB.sortBySmartQueue(questions);
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

    // Mode Badge
    const badgeEl = document.getElementById('practice-mode-badge');
    if (this._isFixSession) {
      badgeEl.textContent = this._fixModeLabel || 'Fix Mode';
      badgeEl.classList.remove('hidden');
    } else {
      badgeEl.classList.add('hidden');
    }

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

    renderMath(document.getElementById('question-text'), q.question);

    // ── Passage block: instruction → passage text → passage image ──
    const passageWrap = document.getElementById('passage-context');
    if (q._passage || q._instruction || (q.has_image && q.image_url)) {
      passageWrap.classList.remove('hidden');

      // Make passage-context sticky for sets
      const isSticky = !!q.set_id;
      if (isSticky) {
        passageWrap.classList.add('is-sticky');
      } else {
        passageWrap.classList.remove('is-sticky');
      }

      // Rebuild inner content cleanly each render
      let passageHTML = '<div class="passage-context-label">📄 Passage / Data</div>';
      passageHTML += `<div class="passage-box${isSticky ? ' has-scroll' : ''}">`;

      // 1. Instruction
      if (q._instruction) {
        passageHTML += `<div class="passage-instruction">${formatText(q._instruction)}</div>`;
      }

      // 2. Passage text — empty div; filled by renderMath after DOM insert
      if (q._passage) {
        passageHTML += `<div class="passage-body" id="passage-context-text"></div>`;
      }

      // 3. Passage image
      if (q.has_image && q.image_url) {
        const imgSrc = q.image_url.startsWith('http') ? q.image_url : BASE_URL + q.image_url;
        passageHTML += `<div class="passage-image-wrap"><img class="passage-img" src="${imgSrc}" alt="Passage image" loading="lazy" /></div>`;
      }

      passageHTML += '</div>'; // close .passage-box
      passageWrap.innerHTML = passageHTML;

      // Run renderMath on passage after it's in the DOM
      if (q._passage) {
        renderMath(document.getElementById('passage-context-text'), q._passage, q.subject === 'VARC');
      }
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
        btn.className = 'option-btn option'; // .option for task-spec targeting
        btn.dataset.letter = letter;
        btn.innerHTML = `<span class="option-label">${letter}</span><span class="option-text"></span>`;
        renderMath(btn.querySelector('.option-text'), text);
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

    // Task 7 — safe KaTeX re-render after full DOM update
    setTimeout(() => {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.getElementById('question-card') || document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      }
    }, 0);
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

  async _selectMCQ(letter, btn) {
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

    await this._recordAttempt(q, { selected_option: letter }, isCorrect, timeTaken);
    await this._showSolution(q, isCorrect, q.correct_option);

    if (isCorrect) {
      this._sessionCorrect++;
      if (this._isFixSession) await DB.markErrorFixedByQuestionId(q.id);
    } else {
      this._sessionWrong++;
      this._showInlineErrorTag(q);
    }
  },

  async _submitTITA() {
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

    await this._recordAttempt(q, { selected_value: val }, isCorrect, timeTaken);
    await this._showSolution(q, isCorrect, q.correct_value);

    if (isCorrect) {
      this._sessionCorrect++;
      if (this._isFixSession) await DB.markErrorFixedByQuestionId(q.id);
    } else {
      this._sessionWrong++;
      this._showInlineErrorTag(q);
    }
  },

  async _showSolution(q, isCorrect, correctAnswer) {
    document.getElementById('hint-toggle-pre').classList.add('hidden');
    document.getElementById('answer-area').classList.remove('hidden');

    const badge = document.getElementById('answer-result-badge');
    badge.textContent = isCorrect ? '✓ Correct!' : '✗ Wrong';
    badge.className = 'correct-badge' + (isCorrect ? '' : ' wrong-badge');
    document.getElementById('correct-ans-display').textContent = correctAnswer;

    // Reset solution toggle state: hidden, button text reset
    const solText = document.getElementById('solution-text');
    const solBtn  = document.getElementById('show-solution-btn');
    solText.classList.add('hidden');
    if (solBtn) solBtn.textContent = '💡 Show Solution';

    // ── Solution box: rebuild cleanly on every answer ──
    const solEl = solText;
    solEl.innerHTML = ''; // clear previous

    // Solution text
    const solBody = document.createElement('div');
    solBody.className = 'sol-body';
    if (q.solution) {
      const label = document.createElement('strong');
      label.textContent = 'Solution: ';
      solEl.appendChild(label);
      solEl.appendChild(solBody);
      renderMath(solBody, q.solution); // uses formatText internally
    } else {
      solBody.innerHTML = `<span style="color:var(--text3)">Refer source material for solution.</span>`;
      solEl.appendChild(solBody);
    }

    // Solution image
    if (q.solution_image_url) {
      const imgSrc = q.solution_image_url.startsWith('http')
        ? q.solution_image_url
        : BASE_URL + q.solution_image_url;
      const imgWrap = document.createElement('div');
      imgWrap.className = 'solution-img-wrap';
      imgWrap.innerHTML = `<img class="solution-img" src="${imgSrc}" alt="Solution diagram" loading="lazy" />`;
      solEl.appendChild(imgWrap);
    }

    await Dashboard.incrementToday();
  },

  async _recordAttempt(q, answer, isCorrect, timeTaken) {
    await DB.saveAttempt({
      question_id: q.id,
      user_id: Auth.currentUser && Auth.currentUser.id,
      selected_option: answer.selected_option || null,
      selected_value: answer.selected_value || null,
      is_correct: isCorrect,
      time_taken: timeTaken,
      source: 'practice',
      subject: q.subject,
      topic: q.topic,
      question_type: q.question_type || 'single',
      set_id: q.set_id || null
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
    // Task 3 — scroll to top smoothly on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      this._showSessionSummary();
    } else {
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
    // Reset all buttons to active state
    document.querySelectorAll('.etag-btn').forEach(b => {
      b.classList.remove('selected', 'saved');
      b.disabled = false;
    });
    const noteEl = document.getElementById('etag-note-input');
    if (noteEl) noteEl.value = '';
    // Reveal panel
    const panel = document.getElementById('error-tag-inline');
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  _hideInlineErrorTag() {
    document.getElementById('error-tag-inline').classList.add('hidden');
    this._errorQuestion = null;
    this._selectedInlineType = null;
  },

  // ── 1-click save: called directly by each type button ───────────────
  async _saveInlineErrorWithType(type) {
    const q = this._errorQuestion;
    if (!q) return;

    // Visually mark selected + disable all buttons instantly
    document.querySelectorAll('.etag-btn').forEach(b => {
      b.disabled = true;
      b.classList.remove('selected');
      if (b.dataset.type === type) b.classList.add('selected');
    });

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

    // Hide panel after brief highlight so user sees what was saved
    setTimeout(() => this._hideInlineErrorTag(), 350);

    // Silent sync
    this._refreshErrorBadge();
    if (typeof ErrorLog !== 'undefined') ErrorLog.render(true);

    const label = type === 'unclassified' ? 'Skipped' : 'Logged ✓';
    showToast(label, 'success');
  },

  // Legacy kept for safety (not triggered from UI)
  async _saveInlineError() {
    const type = this._selectedInlineType || 'unclassified';
    await this._saveInlineErrorWithType(type);
  },

  async _refreshErrorBadge() {
    const pending = await DB.getPendingErrorCount();
    const badge = document.getElementById('nav-error-count');
    if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline' : 'none'; }
  },

  // ── FIX MY MISTAKES: load a targeted session ────────────────

  loadFixSession(questions, modeLabel = 'Fix Mode') {
    if (!questions || !questions.length) {
      showToast('No questions found for this topic', 'error');
      return;
    }
    this._isFixSession = true;
    this._fixModeLabel = modeLabel;
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
    const pending = await DB.getPendingErrorCount();
    const badge = document.getElementById('nav-error-count');
    if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? 'inline' : 'none'; }
    if (typeof ErrorLog !== 'undefined') await ErrorLog.render(true);
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
      renderMath(document.getElementById('hint-text'), `Topic: ${q.topic || 'General'}. Think step by step before selecting.`);
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
