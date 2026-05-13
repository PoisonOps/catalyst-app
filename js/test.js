// ============================================================
// TEST.JS — Timed test, MCQ + TITA, score + breakdown
// ============================================================

const TestMode = {
  questions: [],
  currentIdx: 0,
  answers: {},      // question_id → { option, value }
  timer: null,
  timeLeft: 0,
  correctMarks: 3,
  wrongMarks: 1,

  async init() {
    await this._populateTopics();
    document.getElementById('test-subject').addEventListener('change', () => this._populateTopics());
    document.getElementById('start-test-btn').addEventListener('click', () => this.startTest());
    document.getElementById('submit-test-early').addEventListener('click', () => { if (confirm('Submit now?')) this.endTest(); });
    document.getElementById('test-prev-btn').addEventListener('click', () => this._navigate(-1));
    document.getElementById('test-next-btn').addEventListener('click', () => this._navigate(1));
    document.getElementById('new-test-btn').addEventListener('click', () => this.resetTest());
    document.getElementById('test-tita-submit').addEventListener('click', () => this._saveTITAAnswer());
    document.getElementById('test-tita-input').addEventListener('keydown', e => { if (e.key === 'Enter') this._saveTITAAnswer(); });
  },

  async _populateTopics() {
    const subject = document.getElementById('test-subject').value;
    const topics = await DB.getAllTopics(subject);
    const el = document.getElementById('test-topic');
    el.innerHTML = '<option value="all">All Topics</option>';
    topics.forEach(t => { el.innerHTML += `<option value="${t}">${t}</option>`; });
  },

  async startTest() {
    const subject = document.getElementById('test-subject').value;
    const topic = document.getElementById('test-topic').value;
    const numQ = parseInt(document.getElementById('test-num-q').value) || 10;
    const timeMins = parseInt(document.getElementById('test-time').value) || 20;
    this.correctMarks = parseFloat(document.getElementById('test-correct-marks').value) || 3;
    this.wrongMarks = parseFloat(document.getElementById('test-wrong-marks').value) || 1;

    showLoading('Preparing test...');
    try {
      let qs = await DB.getQuestions({ subject, topic });
      qs = qs.sort(() => Math.random() - 0.5).slice(0, numQ);
      if (!qs.length) { showToast('No questions for selected filters', 'error'); return; }

      this.questions = qs;
      this.answers = {};
      this.currentIdx = 0;
      this.timeLeft = timeMins * 60;

      document.getElementById('test-setup').classList.add('hidden');
      document.getElementById('test-active').classList.remove('hidden');
      document.getElementById('test-results').classList.add('hidden');

      this._renderQuestion();
      this._renderDots();
      this._startTimer();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally { hideLoading(); }
  },

  _renderQuestion() {
    const q = this.questions[this.currentIdx];
    if (!q) return;

    document.getElementById('test-q-counter').textContent = `${this.currentIdx + 1} / ${this.questions.length}`;
    document.getElementById('test-progress-fill').style.width = ((this.currentIdx + 1) / this.questions.length * 100) + '%';
    document.getElementById('test-q-subject').textContent = q.subject || 'General';
    document.getElementById('test-q-topic').textContent = q.topic || 'General';
    // Use renderMath so LaTeX and line-breaks render correctly
    if (typeof renderMath === 'function') {
      renderMath(document.getElementById('test-question-text'), q.question);
    } else {
      document.getElementById('test-question-text').textContent = q.question;
    }

    // Passage / instruction block
    const passageWrap = document.getElementById('test-passage-context');
    const passageTextEl = document.getElementById('test-passage-text');
    if (q._passage || q._instruction) {
      passageWrap.classList.remove('hidden');
      let passageHTML = '';
      if (q._instruction) {
        passageHTML += `<div class="passage-instruction">${typeof formatText === 'function' ? formatText(q._instruction) : q._instruction}</div>`;
      }
      if (q._passage) {
        passageHTML += `<div class="passage-body" id="test-passage-text"></div>`;
      }
      // Passage image
      if (q.has_image && q.image_url) {
        const imgSrc = q.image_url.startsWith('http') ? q.image_url
          : (typeof BASE_URL !== 'undefined' ? BASE_URL : '') + q.image_url;
        passageHTML += `<div class="passage-image-wrap"><img class="passage-img" src="${imgSrc}" alt="Passage image" loading="lazy" /></div>`;
      }
      document.getElementById('test-passage-context').innerHTML =
        '<div class="passage-context-label">📄 Passage / Data</div>' + passageHTML;
      if (q._passage) {
        const bodyEl = document.getElementById('test-passage-text');
        if (typeof renderMath === 'function') renderMath(bodyEl, q._passage);
        else bodyEl.textContent = q._passage;
      }
    } else {
      passageWrap.classList.add('hidden');
    }

    const optGrid = document.getElementById('test-options-grid');
    const titaArea = document.getElementById('test-tita-area');
    const saved = this.answers[q.id];
    optGrid.innerHTML = '';

    if (q.answer_type === 'tita') {
      optGrid.style.display = 'none';
      titaArea.classList.remove('hidden');
      document.getElementById('test-tita-input').value = saved ? saved.value : '';
    } else {
      optGrid.style.display = '';
      titaArea.classList.add('hidden');
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const text = q['option_' + letter.toLowerCase()];
        if (!text) return;
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.letter = letter;
        if (saved && saved.option === letter) btn.classList.add('selected');
        btn.innerHTML = `<span class="option-label">${letter}</span><span class="option-text"></span>`;
        if (typeof renderMath === 'function') {
          renderMath(btn.querySelector('.option-text'), text);
        } else {
          btn.querySelector('.option-text').textContent = text;
        }
        btn.addEventListener('click', () => {
          this.answers[q.id] = { option: letter };
          document.querySelectorAll('#test-options-grid .option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this._updateDots();
        });
        optGrid.appendChild(btn);
      });
    }
    this._updateDots();
  },

  _saveTITAAnswer() {
    const q = this.questions[this.currentIdx];
    const val = document.getElementById('test-tita-input').value.trim();
    if (val !== '') {
      this.answers[q.id] = { value: val };
      showToast('Answer saved', 'success');
      this._updateDots();
    }
  },

  _renderDots() {
    const container = document.getElementById('test-q-dots');
    container.innerHTML = '';
    this.questions.forEach((q, i) => {
      const dot = document.createElement('button');
      dot.className = 'q-dot';
      dot.textContent = i + 1;
      dot.addEventListener('click', () => { this.currentIdx = i; this._renderQuestion(); });
      container.appendChild(dot);
    });
    this._updateDots();
  },

  _updateDots() {
    document.querySelectorAll('.q-dot').forEach((dot, i) => {
      dot.classList.remove('current', 'answered');
      if (i === this.currentIdx) dot.classList.add('current');
      else if (this.answers[this.questions[i] && this.questions[i].id]) dot.classList.add('answered');
    });
  },

  _navigate(dir) {
    const newIdx = this.currentIdx + dir;
    if (newIdx < 0 || newIdx >= this.questions.length) return;
    this.currentIdx = newIdx;
    this._renderQuestion();
  },

  _startTimer() {
    const display = document.getElementById('timer-display');
    this.timer = setInterval(() => {
      this.timeLeft--;
      const m = Math.floor(this.timeLeft / 60);
      const s = this.timeLeft % 60;
      display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      if (this.timeLeft <= 60) display.classList.add('urgent');
      if (this.timeLeft <= 0) { clearInterval(this.timer); this.endTest(); }
    }, 1000);
  },

  async endTest() {
    clearInterval(this.timer);
    document.getElementById('test-active').classList.add('hidden');
    document.getElementById('test-results').classList.remove('hidden');

    let correct = 0, wrong = 0, skipped = 0;
    const breakdown = [];
    const savePromises = [];

    this.questions.forEach(q => {
      const ans = this.answers[q.id];
      let isCorrect = false;
      let displayAns = 'Skipped';

      if (!ans) { skipped++; }
      else if (q.answer_type === 'tita') {
        displayAns = ans.value;
        isCorrect = parseFloat(ans.value) === parseFloat(q.correct_value);
        if (isCorrect) correct++; else wrong++;
      } else {
        displayAns = ans.option;
        isCorrect = ans.option === q.correct_option;
        if (isCorrect) correct++; else wrong++;
      }

      breakdown.push({ q, displayAns, isCorrect, skipped: !ans });

      if (ans) {
        savePromises.push(DB.saveAttempt({
          question_id: q.id,
          user_id: Auth.currentUser && Auth.currentUser.id,
          selected_option: q.answer_type === 'mcq' ? ans.option : null,
          selected_value: q.answer_type === 'tita' ? ans.value : null,
          is_correct: isCorrect,
          time_taken: 0,
          source: 'test',
          subject: q.subject,
          topic: q.topic
        }));
      }
    });

    await Promise.all(savePromises);

    const score = (correct * this.correctMarks) - (wrong * this.wrongMarks);
    document.getElementById('results-score').textContent = score.toFixed(1);
    document.getElementById('results-sub').textContent = `${correct} correct · ${wrong} wrong · ${skipped} skipped`;

    document.getElementById('results-breakdown').innerHTML =
      '<h3 style="font-family:var(--font-display);margin-bottom:1rem">Question Breakdown</h3>' +
      breakdown.map((item, i) => {
        const marks = item.skipped ? '0' : item.isCorrect ? `+${this.correctMarks}` : `-${this.wrongMarks}`;
        const color = item.skipped ? 'var(--text3)' : item.isCorrect ? 'var(--green)' : 'var(--red)';
        const correct_display = item.q.answer_type === 'tita' ? item.q.correct_value : item.q.correct_option;
        return `<div class="result-q-item ${item.isCorrect ? 'correct' : item.skipped ? '' : 'wrong'}">
          <span style="font-family:var(--font-mono);color:var(--text3);font-size:0.8rem;flex-shrink:0">Q${i + 1}</span>
          <div style="flex:1">
            <div style="font-size:0.85rem;margin-bottom:0.3rem">${item.q.question.substring(0, 100)}...</div>
            <div style="font-size:0.75rem;color:var(--text2)">
              Your: <strong style="color:${color}">${item.displayAns}</strong>
              · Correct: <strong style="color:var(--green)">${correct_display}</strong>
              · <span style="color:${color}">${marks}</span>
            </div>
            ${item.q.solution ? `<div style="font-size:0.75rem;color:var(--text3);margin-top:0.3rem">${item.q.solution.substring(0, 120)}</div>` : ''}
          </div>
        </div>`;
      }).join('');

    await Dashboard.refresh();
  },

  resetTest() {
    document.getElementById('test-results').classList.add('hidden');
    document.getElementById('test-setup').classList.remove('hidden');
    document.getElementById('timer-display').classList.remove('urgent');
    document.getElementById('timer-display').textContent = '20:00';
  },

  clearMemory() {
    this.questions = [];
    this.currentIdx = 0;
    this.answers = {};
    if (this.timer) clearInterval(this.timer);
    this.timeLeft = 0;
    document.getElementById('test-setup').classList.remove('hidden');
    document.getElementById('test-active').classList.add('hidden');
    document.getElementById('test-results').classList.add('hidden');
  }
};
