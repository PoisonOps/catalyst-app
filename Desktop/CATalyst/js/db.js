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

    // Normalise filter values — lowercase + trim so 'all'/'All'/'ALL' all match
    const subject    = (filters.subject || '').trim();
    const topic      = (filters.topic || '').trim();
    const difficulty = (filters.difficulty || '').trim();
    // subtopics: always an array; strip 'all' sentinel values
    const subtopics  = (filters.subtopics || []).filter(s => s && s.toLowerCase() !== 'all');
    const matchAll   = !!filters.matchAll; // true → row must contain ALL selected subtopics

    if (FLAGS.DEBUG_LOG) console.log('[DB] getQuestions filters:', { subject, topic, subtopics, matchAll, difficulty });

    // sets!left → LEFT JOIN: questions where set_id IS NULL (standalone) are kept.
    // Without !left PostgREST defaults to INNER JOIN → drops all standalone questions → 0 rows.
    let query = sbClient
      .from('questions')
      .select('*, sets!left(passage, instruction, topic, subject, has_image, image_url)')
      .eq('is_active', true)
      .limit(50);

    // Apply filters ONLY when a real value is selected (not 'all' / empty)
    if (subject && subject.toLowerCase() !== 'all') query = query.eq('subject', subject);
    if (topic && topic.toLowerCase() !== 'all') query = query.eq('topic', topic);
    if (difficulty && difficulty.toLowerCase() !== 'all') query = query.eq('difficulty', difficulty);

    // subtopic is text[] in Supabase.
    // matchAll=false → overlaps (&&): row has ANY of the selected subtopics
    // matchAll=true  → contains (@>): row has ALL of the selected subtopics
    if (subtopics.length > 0) {
      query = matchAll
        ? query.contains('subtopic', subtopics)
        : query.overlaps('subtopic', subtopics);
    }

    const { data, error } = await query;

    if (FLAGS.DEBUG_LOG) {
      console.log('[DB] getQuestions result:', data?.length ?? 0, 'rows');
      if (error) console.error('[DB] getQuestions error detail:', JSON.stringify(error, null, 2));
      else if (!data || data.length === 0) console.log('[DB] getQuestions empty result. Check RLS policies in Supabase dashboard.');
    }
    if (error) throw error;
    return (data || []).map(q => this._attachPassageFromJoin(q));
  },


  _attachPassage(q) {
    if (!q.set_id) return q;
    const set = DEMO_SETS.find(s => s.id === q.set_id);
    if (!set) return q;
    const res = { ...q, _passage: set.passage, _instruction: set.instruction };
    if (set.has_image) {
      res.has_image = set.has_image;
      res.image_url = set.image_url;
    }
    return res;
  },

  _attachPassageFromJoin(q) {
    if (!q.sets) return q;
    const res = { ...q, _passage: q.sets.passage, _instruction: q.sets.instruction };
    if (q.sets.has_image) {
      res.has_image = q.sets.has_image;
      res.image_url = q.sets.image_url;
    }
    return res;
  },

  _applyFilters(qs, filters) {
    const subtopics = (filters.subtopics || []).filter(s => s && s.toLowerCase() !== 'all');
    const matchAll  = !!filters.matchAll;
    return qs.filter(q => {
      if (filters.subject && filters.subject !== 'all' && q.subject !== filters.subject) return false;
      if (filters.topic && filters.topic !== 'all' && q.topic !== filters.topic) return false;
      if (filters.difficulty && filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;
      if (subtopics.length > 0) {
        const qSubs = Array.isArray(q.subtopic) ? q.subtopic : [];
        if (matchAll) {
          // every selected subtopic must be present in the question's array
          if (!subtopics.every(s => qSubs.includes(s))) return false;
        } else {
          // at least one selected subtopic must appear
          if (!subtopics.some(s => qSubs.includes(s))) return false;
        }
      }
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
      let query = sbClient.from('questions').select('topic').eq('is_active', true);
      if (subject && subject.toLowerCase() !== 'all') query = query.eq('subject', subject);
      const { data } = await query;
      return [...new Set((data || []).map(r => r.topic).filter(Boolean))].sort();
    } catch (e) { return []; }
  },

  async getSubtopics(subject = 'all', topic = 'all') {
    if (USE_DEMO) {
      let qs = DEMO_QUESTIONS;
      if (subject !== 'all') qs = qs.filter(q => q.subject === subject);
      if (topic !== 'all') qs = qs.filter(q => q.topic === topic);
      const all = qs.flatMap(q => Array.isArray(q.subtopic) ? q.subtopic : []).filter(Boolean);
      return [...new Set(all)].sort();
    }
    try {
      let query = sbClient.from('questions').select('subtopic').eq('is_active', true);
      if (subject && subject.toLowerCase() !== 'all') query = query.eq('subject', subject);
      if (topic && topic.toLowerCase() !== 'all') query = query.eq('topic', topic);
      const { data } = await query;
      const all = (data || []).flatMap(r => Array.isArray(r.subtopic) ? r.subtopic : []).filter(Boolean);
      return [...new Set(all)].sort();
    } catch (e) { return []; }
  },

  // Smart queue: unattempted first → low accuracy → oldest
  async sortBySmartQueue(questions) {
    const attempts = await this.getAttempts();
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

    let userId = attempt.user_id || 'demo';
    if (!USE_DEMO && sbClient && typeof FLAGS !== 'undefined' && FLAGS.SUPABASE_SYNC) {
      try {
        const { data } = await sbClient.auth.getUser();
        if (data && data.user) userId = data.user.id;
      } catch (e) {
        console.warn('Failed to get user', e);
      }
    }

    const entry = {
      id: crypto.randomUUID(),
      question_id: attempt.question_id,
      user_id: userId,
      selected_option: attempt.selected_option || null,
      selected_value: attempt.selected_value || null,
      is_correct: attempt.is_correct,
      time_taken: attempt.time_taken || 0,
      source: attempt.source || 'practice',
      subject: attempt.subject,
      topic: attempt.topic,
      question_type: attempt.question_type || 'single',
      set_id: attempt.set_id || null,
      timestamp: Date.now()
    };
    existing.push(entry);
    if (existing.length > 1000) existing.splice(0, existing.length - 1000);
    this._setLocal(key, existing);

    if (!USE_DEMO && sbClient && typeof FLAGS !== 'undefined' && FLAGS.SUPABASE_SYNC) {
      try {
        const payload = {
          id: entry.id,
          user_id: userId,
          question_id: attempt.question_id,
          selected_option: attempt.selected_option,
          selected_value: attempt.selected_value,
          is_correct: attempt.is_correct,
          time_taken: attempt.time_taken || 0,
          source: attempt.source || 'practice',
          subject: attempt.subject,
          topic: attempt.topic
        };
        console.log('[DB] saving attempt', payload);
        const { data, error } = await sbClient.from('attempt_logs').insert([payload]);
        console.log('[DB] saveAttempt result', data, error);
        if (error) {
          console.error('[DB ERROR]', JSON.stringify(error, null, 2));
        }
      } catch (e) {
        console.error('[DB ERROR]', JSON.stringify(e, null, 2));
      }
    }
    return entry;
  },

  async getAttempts(filters = {}) {
    if (!USE_DEMO && sbClient && FLAGS.SUPABASE_SYNC) {
      try {
        let query = sbClient.from('attempt_logs').select('*, questions(set_id, question_type)').eq('user_id', Auth.currentUser.id);
        if (filters.subject && filters.subject !== 'all') query = query.eq('subject', filters.subject);
        if (filters.correct !== undefined) query = query.eq('is_correct', filters.correct);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(a => ({
          ...a,
          set_id: a.questions?.set_id || null,
          question_type: a.questions?.question_type || null,
          timestamp: new Date(a.created_at).getTime()
        }));
      } catch (e) {
        console.warn('DB getAttempts failed:', e);
      }
    }
    let attempts = this._getLocal('cat_attempts', []);
    if (filters.subject && filters.subject !== 'all') attempts = attempts.filter(a => a.subject === filters.subject);
    if (filters.correct !== undefined) attempts = attempts.filter(a => a.is_correct === filters.correct);
    return attempts;
  },

  async getAttemptedQuestionIds() {
    const attempts = await this.getAttempts();
    return [...new Set(attempts.map(a => a.question_id))];
  },

  async getLastAttemptForQuestion(qId) {
    const all = await this.getAttempts();
    const filtered = all.filter(a => a.question_id === qId);
    return filtered.length ? filtered[filtered.length - 1] : null;
  },

  // ── ERROR LOGS ─────────────────────────────────────────────

  async saveErrorLog(log) {
    const key = 'cat_error_logs';
    const existing = this._getLocal(key, []);

    let userId = log.user_id || 'demo';
    if (!USE_DEMO && sbClient && typeof FLAGS !== 'undefined' && FLAGS.SUPABASE_SYNC) {
      try {
        const { data } = await sbClient.auth.getUser();
        if (data && data.user) userId = data.user.id;
      } catch (e) {
        console.warn('Failed to get user', e);
      }
    }

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
      user_id: userId,
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

    if (!USE_DEMO && sbClient && typeof FLAGS !== 'undefined' && FLAGS.SUPABASE_SYNC) {
      try {
        // ── DEDUP: Supabase ───────────────────────────────────────
        // maybeSingle() returns null (not an error) when no row found
        const { data: sbDupe } = await sbClient
          .from('error_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('question_id', log.question_id)
          .eq('reattempt_status', false)
          .maybeSingle();

        if (sbDupe) {
          if (typeof FLAGS !== 'undefined' && FLAGS.DEBUG_LOG) console.log('[DB] Skipped duplicate error log (Supabase):', log.question_id);
          return entry;
        }

        const payload = {
          id: entry.id,
          user_id: userId,
          question_id: log.question_id,
          error_type: log.error_type,
          user_note: log.user_note || '',
          reattempt_status: false,
          question_text: log.question_text || '',
          subject: log.subject,
          topic: log.topic
        };
        console.log('[DB] saving error_log', payload);
        const { data, error } = await sbClient.from('error_logs').insert([payload]);
        console.log('[DB] saveErrorLog result', data, error);
        if (error) {
          console.error('[DB ERROR]', JSON.stringify(error, null, 2));
        }
      } catch (e) {
        console.error('[DB ERROR]', JSON.stringify(e, null, 2));
      }
    }
    return entry;
  },

  async getErrorLogs(filters = {}) {
    if (!USE_DEMO && sbClient && FLAGS.SUPABASE_SYNC) {
      try {
        let query = sbClient.from('error_logs').select('*').eq('user_id', Auth.currentUser.id);
        if (filters.subject && filters.subject !== 'all') query = query.eq('subject', filters.subject);
        if (filters.error_type && filters.error_type !== 'all') query = query.eq('error_type', filters.error_type);
        if (filters.status === 'pending') query = query.eq('reattempt_status', false);
        if (filters.status === 'fixed') query = query.eq('reattempt_status', true);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn('DB getErrorLogs failed:', e);
      }
    }
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
    if (!USE_DEMO && sbClient && FLAGS.SUPABASE_SYNC) {
      const { error } = await sbClient.from('error_logs').update({
        reattempt_status: true,
        reattempted_at: new Date().toISOString()
      }).eq('id', id);
      if (error) console.error('Error updating error_logs in Supabase:', error);
    }
  },

  async markErrorFixedByQuestionId(qId) {
    const logs = await this.getErrorLogs({ status: 'pending' });
    const pendingLog = logs.find(l => l.question_id === qId);
    if (pendingLog) {
      await this.markErrorFixed(pendingLog.id);
    }
  },

  async getQuestionsByIds(ids) {
    if (!ids || !ids.length) return [];
    if (USE_DEMO) {
      return DEMO_QUESTIONS.filter(q => ids.includes(q.id)).map(q => this._attachPassage(q));
    }
    try {
      const { data, error } = await sbClient
        .from('questions')
        .select('*, sets!left(passage, instruction, topic, subject, has_image, image_url)')
        .in('id', ids)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []).map(q => this._attachPassageFromJoin(q));
    } catch (e) { return []; }
  },

  async getMistakeQuestions() {
    const logs = await this.getErrorLogs({ status: 'pending' });
    const pendingIds = [...new Set(logs.map(l => l.question_id))];
    if (pendingIds.length === 0) return [];
    return await this.getQuestionsByIds(pendingIds);
  },

  async getFallbackFixQuestions() {
    const attempts = await this.getAttempts();
    if (!attempts || attempts.length === 0) {
      // Fallback to random normal questions
      return await this.getQuestions({ limit: 20 });
    }

    // Group by topic, count wrong
    const topicStats = {};
    attempts.forEach(a => {
      if (!a.topic) return;
      if (!topicStats[a.topic]) topicStats[a.topic] = 0;
      if (!a.is_correct) topicStats[a.topic]++;
    });

    let maxTopic = null;
    let maxWrong = -1;
    for (const [topic, wrongCount] of Object.entries(topicStats)) {
      if (wrongCount > maxWrong) {
        maxWrong = wrongCount;
        maxTopic = topic;
      }
    }

    if (!maxTopic || maxWrong === 0) {
      return await this.getQuestions({ limit: 20 });
    }

    return await this.getQuestionsByTopic(maxTopic, 20);
  },

  async getPendingErrorCount() {
    const logs = await this.getErrorLogs({ status: 'pending' });
    return logs.length;
  },

  // ── INSIGHT HELPERS ─────────────────────────────────────────

  // Returns topic with most pending (unfixed) mistakes
  async getWeakestTopic() {
    const logs = await this.getErrorLogs({ status: 'pending' });
    const pendingLogs = logs.filter(l => l.topic);
    const topicCounts = {};
    pendingLogs.forEach(l => { topicCounts[l.topic] = (topicCounts[l.topic] || 0) + 1; });
    if (!Object.keys(topicCounts).length) return null;
    return Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0][0];
  },

  // Fetches questions for a given topic (up to limit)
  async getQuestionsByTopic(topic, limit = 5) {
    if (!topic) return [];
    if (USE_DEMO) {
      let qs = DEMO_QUESTIONS.filter(q => q.topic === topic);
      qs = qs.sort(() => Math.random() - 0.5).slice(0, limit);
      return qs.map(q => this._attachPassage(q));
    }
    try {
      const { data, error } = await sbClient
        .from('questions')
        .select('*, sets!left(passage, instruction, topic, subject, has_image, image_url)')  // !left = LEFT JOIN
        .eq('is_active', true)
        .eq('topic', topic)
        .limit(limit * 3);
      if (error) throw error;
      const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, limit);
      return shuffled.map(q => this._attachPassageFromJoin(q));
    } catch (e) { return []; }
  },

  // Returns insight object: weakest topic, most common error type, counts
  async getErrorInsights(customLogs) {
    const logs = customLogs || await this.getErrorLogs({ status: 'pending' });

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
    if (!USE_DEMO && sbClient && FLAGS.SUPABASE_SYNC) {
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
    if (!USE_DEMO && sbClient && FLAGS.SUPABASE_SYNC) {
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

  async getStats() {
    const attempts = await this.getAttempts();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttempts = attempts.filter(a => a.timestamp >= today.getTime());

    const allProgress = await this.calculateProgressStats(attempts, attempts);
    const todayProgress = await this.calculateProgressStats(todayAttempts, attempts);

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
      total: allProgress.total,
      accuracy,
      todayCount: todayProgress.total,
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

  async calculateProgressStats(targetAttempts, allAttempts) {
    const quant = targetAttempts.filter(a => a.subject === 'Quant').length;

    const setIdsInTarget = [...new Set(targetAttempts.filter(a => a.set_id || a.question_type === 'set' || a.question_type === 'set_question').map(a => a.set_id).filter(Boolean))];

    let lrdi_sets = 0;
    let varc_rc = 0;

    if (setIdsInTarget.length > 0) {
      let setTotalQuestions = {};
      if (USE_DEMO) {
        DEMO_QUESTIONS.forEach(q => {
          if (setIdsInTarget.includes(q.set_id)) {
            setTotalQuestions[q.set_id] = (setTotalQuestions[q.set_id] || 0) + 1;
          }
        });
      } else if (sbClient) {
        try {
          const { data } = await sbClient.from('questions').select('id, set_id').eq('is_active', true).in('set_id', setIdsInTarget);
          (data || []).forEach(q => {
            setTotalQuestions[q.set_id] = (setTotalQuestions[q.set_id] || 0) + 1;
          });
        } catch (e) {
          console.warn('[DB] Failed to fetch set counts for progress calculation');
        }
      }

      const attemptsBySet = {};
      allAttempts.forEach(a => {
        if (a.set_id && setIdsInTarget.includes(a.set_id)) {
          if (!attemptsBySet[a.set_id]) attemptsBySet[a.set_id] = new Set();
          attemptsBySet[a.set_id].add(a.question_id);
        }
      });

      setIdsInTarget.forEach(sid => {
        const attemptedCount = attemptsBySet[sid] ? attemptsBySet[sid].size : 0;
        const totalCount = setTotalQuestions[sid] || 999;
        if (attemptedCount >= totalCount && totalCount > 0) {
          const sample = targetAttempts.find(a => a.set_id === sid);
          if (sample) {
            if (sample.subject === 'LRDI') lrdi_sets++;
            else if (sample.subject === 'VARC') varc_rc++;
          }
        }
      });
    }

    const varcAll = targetAttempts.filter(a => a.subject === 'VARC');
    const varc_va = varcAll.filter(a => !a.set_id && a.question_type !== 'set' && a.question_type !== 'set_question').length;
    const varc = varcAll.length;

    return {
      quant,
      lrdi: lrdi_sets,
      varc,
      varc_rc,
      varc_va,
      total: quant + lrdi_sets + varc_rc + varc_va
    };
  },

  // Returns today's progress per subject from attempt log
  async getTodaySubjectProgress() {
    const attempts = await this.getAttempts();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayA = attempts.filter(a => a.timestamp >= today.getTime());
    return await this.calculateProgressStats(todayA, attempts);
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
    const TRIAL_DAYS = 3;
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
