// ============================================================
// DB.JS — All data operations. Dual mode: Supabase + Demo
// ============================================================

const DB = {

  // ── QUESTIONS ──────────────────────────────────────────────

  async getQuestions(filters = {}) {
    if (USE_DEMO) {
      let qs = DEMO_QUESTIONS.map(q => this._attachPassage(q));
      return this._applyFilters(qs, filters);
    }
    let query = sbClient.from('questions').select('*, sets(passage, instruction, topic, subject)').eq('is_active', true).limit(50);
    if (filters.subject && filters.subject !== 'all') query = query.eq('subject', filters.subject);
    if (filters.topic && filters.topic !== 'all') query = query.eq('topic', filters.topic);
    if (filters.difficulty && filters.difficulty !== 'all') query = query.eq('difficulty', filters.difficulty);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(q => this._attachPassageFromJoin(q));
  },

  _attachPassage(q) {
    if (!q.set_id) return q;
    const set = DEMO_SETS.find(s => s.id === q.set_id);
    return set ? { ...q, _passage: set.passage, _instruction: set.instruction } : q;
  },

  _attachPassageFromJoin(q) {
    if (!q.sets) return q;
    return { ...q, _passage: q.sets.passage, _instruction: q.sets.instruction };
  },

  _applyFilters(qs, filters) {
    return qs.filter(q => {
      if (filters.subject && filters.subject !== 'all' && q.subject !== filters.subject) return false;
      if (filters.topic && filters.topic !== 'all' && q.topic !== filters.topic) return false;
      if (filters.difficulty && filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;
      return true;
    });
  },

  async getAllTopics(subject = 'all') {
    if (USE_DEMO) {
      let qs = DEMO_QUESTIONS;
      if (subject !== 'all') qs = qs.filter(q => q.subject === subject);
      return [...new Set(qs.map(q => q.topic).filter(Boolean))].sort();
    }
    try {
      let query = sbClient.from('questions').select('topic');
      if (subject !== 'all') query = query.eq('subject', subject);
      const { data } = await query;
      return [...new Set((data || []).map(r => r.topic).filter(Boolean))].sort();
    } catch (e) { return []; }
  },

  // Smart queue: unattempted first → low accuracy → oldest
  sortBySmartQueue(questions) {
    const attempts = this._getLocal('cat_attempts', []);
    const statsMap = {};
    attempts.forEach(a => {
      if (!statsMap[a.question_id]) statsMap[a.question_id] = { attempts: 0, correct: 0, last: 0 };
      statsMap[a.question_id].attempts++;
      if (a.is_correct) statsMap[a.question_id].correct++;  // Bug A fix: was a.correct
      if (a.timestamp > statsMap[a.question_id].last) statsMap[a.question_id].last = a.timestamp;
    });
    return [...questions].sort((a, b) => {
      const sa = statsMap[a.id] || { attempts: 0, correct: 0, last: 0 };
      const sb = statsMap[b.id] || { attempts: 0, correct: 0, last: 0 };
      if (sa.attempts === 0 && sb.attempts > 0) return -1;
      if (sb.attempts === 0 && sa.attempts > 0) return 1;
      if (sa.attempts === 0 && sb.attempts === 0) return 0;
      const accA = sa.correct / sa.attempts;
      const accB = sb.correct / sb.attempts;
      if (accA !== accB) return accA - accB;
      return sa.last - sb.last;
    });
  },

  // ── ATTEMPTS ───────────────────────────────────────────────

  async saveAttempt(attempt) {
    const key = 'cat_attempts';
    const existing = this._getLocal(key, []);
    const entry = {
      id: crypto.randomUUID(),
      question_id: attempt.question_id,
      user_id: attempt.user_id || 'demo',
      selected_option: attempt.selected_option || null,
      selected_value: attempt.selected_value || null,
      is_correct: attempt.is_correct,
      time_taken: attempt.time_taken || 0,
      source: attempt.source || 'practice',
      subject: attempt.subject,
      topic: attempt.topic,
      question_type: attempt.question_type || 'single',
      timestamp: Date.now()
    };
    existing.push(entry);
    if (existing.length > 1000) existing.splice(0, existing.length - 1000);
    this._setLocal(key, existing);

    if (!USE_DEMO && sbClient) {
      try {
        await sbClient.from('attempt_logs').insert([{
          id: entry.id,                              // Bug C fix: use same UUID as local
          user_id: attempt.user_id,
          question_id: attempt.question_id,
          selected_option: attempt.selected_option,
          selected_value: attempt.selected_value,
          is_correct: attempt.is_correct,
          time_taken: attempt.time_taken || 0,
          source: attempt.source || 'practice',
          subject: attempt.subject,                 // Bug C fix: was missing
          topic: attempt.topic                      // Bug C fix: was missing
        }]);
      } catch (e) { console.warn('Attempt log error:', e.message); }
    }
    return entry;
  },

  getAttempts(filters = {}) {
    let attempts = this._getLocal('cat_attempts', []);
    if (filters.subject && filters.subject !== 'all') attempts = attempts.filter(a => a.subject === filters.subject);
    if (filters.correct !== undefined) attempts = attempts.filter(a => a.is_correct === filters.correct);
    return attempts;
  },

  getAttemptedQuestionIds() {
    return [...new Set(this._getLocal('cat_attempts', []).map(a => a.question_id))];
  },

  getLastAttemptForQuestion(qId) {
    const all = this._getLocal('cat_attempts', []).filter(a => a.question_id === qId);
    return all.length ? all[all.length - 1] : null;
  },

  // ── ERROR LOGS ─────────────────────────────────────────────

  async saveErrorLog(log) {
    const key = 'cat_error_logs';
    const existing = this._getLocal(key, []);

    // ── DEDUP: localStorage ─────────────────────────────────────
    // Skip if an unfixed entry for this question already exists locally
    const localDupe = existing.find(
      e => e.question_id === log.question_id && !e.reattempt_status
    );
    if (localDupe) {
      console.log('[DB] Skipped duplicate error log (local):', log.question_id);
      return localDupe;  // return existing entry so callers still get an object
    }

    const entry = {
      id: crypto.randomUUID(),
      question_id: log.question_id,
      user_id: log.user_id || 'demo',
      error_type: log.error_type,
      user_note: log.user_note || '',
      subject: log.subject,
      topic: log.topic,
      question_text: log.question_text || '',
      reattempt_status: false,
      created_at: new Date().toISOString()
    };
    existing.push(entry);
    this._setLocal(key, existing);

    if (!USE_DEMO && sbClient) {
      try {
        // ── DEDUP: Supabase ───────────────────────────────────────
        // maybeSingle() returns null (not an error) when no row found
        const { data: sbDupe } = await sbClient
          .from('error_logs')
          .select('id')
          .eq('user_id', log.user_id)
          .eq('question_id', log.question_id)
          .eq('reattempt_status', false)
          .maybeSingle();

        if (sbDupe) {
          console.log('[DB] Skipped duplicate error log (Supabase):', log.question_id);
          return entry;  // already exists in DB — local entry still saved above
        }

        await sbClient.from('error_logs').insert([{
          id: entry.id,
          user_id: log.user_id,
          question_id: log.question_id,
          error_type: log.error_type,
          user_note: log.user_note || '',
          reattempt_status: false,
          question_text: log.question_text || '',
          subject: log.subject,
          topic: log.topic
        }]);
      } catch (e) { console.warn('Error log error:', e.message); }
    }
    return entry;
  },

  getErrorLogs(filters = {}) {
    let logs = this._getLocal('cat_error_logs', []);
    if (filters.subject && filters.subject !== 'all') logs = logs.filter(l => l.subject === filters.subject);
    if (filters.error_type && filters.error_type !== 'all') logs = logs.filter(l => l.error_type === filters.error_type);
    if (filters.status === 'pending') logs = logs.filter(l => !l.reattempt_status);
    if (filters.status === 'fixed') logs = logs.filter(l => l.reattempt_status);
    return logs;
  },

  async markErrorFixed(errorId) {
    const key = 'cat_error_logs';
    const logs = this._getLocal(key, []);
    const id = String(errorId);
    console.log('markErrorFixed called with ID:', id);

    const idx = logs.findIndex(l => String(l.id) === id);
    if (idx !== -1) {
      logs[idx].reattempt_status = true;
      logs[idx].reattempted_at = new Date().toISOString();
      this._setLocal(key, logs);
    }
    if (!USE_DEMO && sbClient) {
      const { error } = await sbClient.from('error_logs').update({
        reattempt_status: true,
        reattempted_at: new Date().toISOString()
      }).eq('id', id);
      if (error) console.error('Error updating error_logs in Supabase:', error);
    }
  },

  getPendingErrorCount() {
    return this._getLocal('cat_error_logs', []).filter(l => !l.reattempt_status).length;
  },

  // ── INSIGHT HELPERS ─────────────────────────────────────────

  // Returns topic with most pending (unfixed) mistakes
  getWeakestTopic() {
    const logs = this._getLocal('cat_error_logs', []).filter(l => !l.reattempt_status && l.topic);
    const topicCounts = {};
    logs.forEach(l => { topicCounts[l.topic] = (topicCounts[l.topic] || 0) + 1; });
    if (!Object.keys(topicCounts).length) return null;
    return Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0][0];
  },

  // Fetches questions for a given topic (up to limit)
  async getQuestionsByTopic(topic, limit = 5) {
    if (!topic) return [];
    if (USE_DEMO) {
      let qs = DEMO_QUESTIONS.filter(q => q.topic === topic);
      // Shuffle and take first `limit`
      qs = qs.sort(() => Math.random() - 0.5).slice(0, limit);
      return qs.map(q => this._attachPassage(q));
    }
    try {
      const { data, error } = await sbClient
        .from('questions')
        .select('*, sets(passage, instruction, topic, subject)')
        .eq('topic', topic)
        .limit(limit * 3); // fetch more, shuffle client-side
      if (error) throw error;
      const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, limit);
      return shuffled.map(q => this._attachPassageFromJoin(q));
    } catch (e) { return []; }
  },

  // Returns insight object: weakest topic, most common error type, counts
  getErrorInsights(customLogs) {
    const logs = customLogs || this._getLocal('cat_error_logs', []).filter(l => !l.reattempt_status);

    // Topic mistake counts
    const topicCounts = {};
    logs.filter(l => l.topic).forEach(l => {
      topicCounts[l.topic] = (topicCounts[l.topic] || 0) + 1;
    });
    const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
    const weakestTopic = sortedTopics.length ? sortedTopics[0][0] : null;

    // Error type counts
    const errorTypeCounts = {};
    logs.forEach(l => {
      const t = l.error_type || 'unclassified';
      errorTypeCounts[t] = (errorTypeCounts[t] || 0) + 1;
    });
    const sortedErrors = Object.entries(errorTypeCounts).sort((a, b) => b[1] - a[1]);
    const mostCommonError = sortedErrors.length ? sortedErrors[0][0] : null;

    return { weakestTopic, mostCommonError, topicCounts, errorTypeCounts, sortedTopics };
  },

  // ── REPORTS ────────────────────────────────────────────────

  async saveReport(report) {
    if (!USE_DEMO && sbClient) {
      try {
        await sbClient.from('reports').insert([{
          user_id: report.user_id,
          question_id: report.question_id,
          issue_type: report.report_type,
          details: report.note || ''
        }]);
      } catch (e) { console.warn('Report error:', e.message); }
    }
    // Always store locally too
    const key = 'cat_reports';
    const existing = this._getLocal(key, []);
    existing.push({ ...report, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    this._setLocal(key, existing);
  },

  // ── FEEDBACK ───────────────────────────────────────────────

  async saveFeedback(fb) {
    if (!USE_DEMO && sbClient) {
      try {
        await sbClient.from('feedback').insert([{
          user_id: fb.user_id,
          type: fb.type || 'general',
          message: fb.message || ''
        }]);
      } catch (e) { console.warn('Feedback error:', e.message); }
    }
    const key = 'cat_feedback';
    const existing = this._getLocal(key, []);
    existing.push({ ...fb, id: Date.now(), created_at: new Date().toISOString() });
    this._setLocal(key, existing);
  },

  // ── BOOKMARKS / DIFFICULT / NOTES ─────────────────────────

  toggleBookmark(qId) {
    const key = 'cat_bookmarks';
    const list = this._getLocal(key, []);
    const idx = list.indexOf(qId);
    if (idx === -1) list.push(qId); else list.splice(idx, 1);
    this._setLocal(key, list);
    return idx === -1; // true = added
  },

  toggleDifficult(qId) {
    const key = 'cat_difficult';
    const list = this._getLocal(key, []);
    const idx = list.indexOf(qId);
    if (idx === -1) list.push(qId); else list.splice(idx, 1);
    this._setLocal(key, list);
    return idx === -1;
  },

  isBookmarked(qId) { return this._getLocal('cat_bookmarks', []).includes(qId); },
  isDifficult(qId) { return this._getLocal('cat_difficult', []).includes(qId); },

  saveNote(qId, note) {
    const notes = this._getLocal('cat_notes', {});
    notes[qId] = note;
    this._setLocal('cat_notes', notes);
  },
  getNote(qId) { return (this._getLocal('cat_notes', {}))[qId] || ''; },

  // ── STATS ──────────────────────────────────────────────────

  getStats() {
    const attempts = this._getLocal('cat_attempts', []);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttempts = attempts.filter(a => a.timestamp >= today.getTime());

    const correct = attempts.filter(a => a.is_correct).length;
    const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;

    const subjectStats = {};
    ['Quant', 'LRDI', 'VARC'].forEach(sub => {
      const sub_a = attempts.filter(a => a.subject === sub);
      const sub_c = sub_a.filter(a => a.is_correct).length;
      subjectStats[sub] = sub_a.length ? Math.round((sub_c / sub_a.length) * 100) : 0;
    });

    const topicMap = {};
    attempts.forEach(a => {
      if (!a.topic) return;
      if (!topicMap[a.topic]) topicMap[a.topic] = { attempts: 0, correct: 0 };
      topicMap[a.topic].attempts++;
      if (a.is_correct) topicMap[a.topic].correct++;
    });
    const weakTopics = Object.entries(topicMap)
      .filter(([, v]) => v.attempts >= 2)
      .map(([topic, v]) => ({ topic, accuracy: Math.round((v.correct / v.attempts) * 100) }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    const streak = this._getLocal('cat_streak', { count: 0, lastDate: null });
    const timeData = this._getLocal('cat_time_today', { date: null, minutes: 0 });
    const timeToday = (timeData.date === new Date().toDateString()) ? timeData.minutes : 0;

    const recent = attempts.slice(-6).reverse().map(a => ({
      text: (a.is_correct ? '✓' : '✗') + ' ' + (a.topic || a.subject || 'General') + ' question',
      time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return {
      total: attempts.length,
      accuracy,
      todayCount: todayAttempts.length,
      subjectStats,
      weakTopics,
      streak: streak.count,
      timeToday,
      recent
    };
  },

  // ── GOAL + STREAK ──────────────────────────────────────────

  getDailyGoal() { return this._getLocal('cat_daily_goal', 20); },
  setDailyGoal(n) { this._setLocal('cat_daily_goal', n); },

  updateStreak() {
    const today = new Date().toDateString();
    const streak = this._getLocal('cat_streak', { count: 0, lastDate: null });
    if (streak.lastDate === today) return;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    streak.count = (streak.lastDate === yesterday.toDateString()) ? streak.count + 1 : 1;
    streak.lastDate = today;
    this._setLocal('cat_streak', streak);
  },

  // ── SESSION TIMER ──────────────────────────────────────────

  _sessionStart: null,
  startSession() { this._sessionStart = Date.now(); },
  endSession() {
    if (!this._sessionStart) return;
    const mins = Math.round((Date.now() - this._sessionStart) / 60000);
    const today = new Date().toDateString();
    const timeData = this._getLocal('cat_time_today', { date: null, minutes: 0 });
    if (timeData.date === today) timeData.minutes += mins; else { timeData.date = today; timeData.minutes = mins; }
    this._setLocal('cat_time_today', timeData);
    this._sessionStart = null;
  },

  // ── PER-SUBJECT DAILY GOAL ─────────────────────────────────

  getDailyGoalPerSubject() {
    return this._getLocal('cat_daily_goal_v2', {
      quant_q: 10,
      lrdi_sets: 1,
      varc_rc: 1,
      varc_va: 5
    });
  },

  setDailyGoalPerSubject(goals) {
    this._setLocal('cat_daily_goal_v2', goals);
  },

  // Returns today's progress per subject from attempt log
  getTodaySubjectProgress() {
    const attempts = this._getLocal('cat_attempts', []);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayA = attempts.filter(a => a.timestamp >= today.getTime());

    const quant = todayA.filter(a => a.subject === 'Quant').length;
    const lrdi = todayA.filter(a => a.subject === 'LRDI').length;

    // Split VARC into RC (set_question) and VA (single) to avoid double-counting
    const varcAll = todayA.filter(a => a.subject === 'VARC');
    const varc_rc = varcAll.filter(a => a.question_type === 'set_question').length;
    const varc_va = varcAll.filter(a => a.question_type !== 'set_question').length;
    const varc = varcAll.length; // kept for backward-compat

    return { quant, lrdi, varc, varc_rc, varc_va, total: quant + lrdi + varc };
  },

  // ── TRIAL + PAID SYSTEM ────────────────────────────────────

  initTrial() {
    const existing = this._getLocal('cat_trial', null);
    if (!existing) {
      this._setLocal('cat_trial', {
        started_at: Date.now(),
        is_paid: false
      });
    }
  },

  getTrialStatus() {
    const trial = this._getLocal('cat_trial', null);
    if (!trial) return { active: false, started: false, daysLeft: 0 };
    const TRIAL_DAYS = 7;
    const elapsed = Date.now() - trial.started_at;
    const daysLeft = Math.max(0, TRIAL_DAYS - Math.floor(elapsed / 86400000));
    return {
      active: daysLeft > 0,
      started: true,
      daysLeft: daysLeft
    };
  },

  isPaid() {
    const trial = this._getLocal('cat_trial', null);
    return trial && trial.is_paid === true;
  },

  // Call this manually after confirming payment
  markAsPaid() {
    const trial = this._getLocal('cat_trial', { started_at: Date.now(), is_paid: false });
    trial.is_paid = true;
    this._setLocal('cat_trial', trial);
  },


  // ── USER DATA ISOLATION (Namespaced Storage) ─────────────

  // Keys that are device-level (not per-user) — never namespaced
  _globalKeys: new Set([
    'cat_theme', 'cat_demo_active', 'cat_demo_name', 'cat_current_user_id'
  ]),

  // Returns the current user's ID for key namespacing.
  // Each user gets fully isolated storage: cat_attempts_uid1 vs cat_attempts_uid2
  _uid() {
    return (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.id)
      ? Auth.currentUser.id
      : 'demo';
  },

  // Utility: manually clear a specific user's data (e.g., admin reset)
  clearUserData(uid) {
    const suffix = '_' + (uid || this._uid());
    Object.keys(localStorage)
      .filter(k => k.endsWith(suffix))
      .forEach(k => localStorage.removeItem(k));
    console.log('[DB] Cleared data for user:', uid || this._uid());
  },

  // ── LOCAL STORAGE (Namespaced per user) ────────────────────

  _getLocal(key, def) {
    // Global keys are shared across all users (device preferences)
    const storageKey = this._globalKeys.has(key) ? key : key + '_' + this._uid();
    try { const v = localStorage.getItem(storageKey); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  _setLocal(key, val) {
    const storageKey = this._globalKeys.has(key) ? key : key + '_' + this._uid();
    try { localStorage.setItem(storageKey, JSON.stringify(val)); } catch (e) { }
  }
};
