# CATalyst — Production Upgrade Plan
*Senior Engineer Design Document · May 2026*

---

## 1. Problem Summary

| Problem | Current State | Risk |
|---|---|---|
| No DEV/PROD separation | Single codebase → single Supabase project | Bug in test = bug in prod |
| localStorage is truth | Supabase is write-only sink | New device = zero history |
| Split-brain IDs | Local IDs are floats, Supabase IDs are UUIDs | `markFixed`, reconciliation impossible |
| Silent write failures | No retry, no queue, no error surfacing | Data loss without warning |
| No query limits | Full table fetched on every `getQuestions()` | Will crash at 1000+ questions |
| 4+ live bugs | Table name, double events, `_hasAutoLoaded`, VARC double-count | UX breaks for real users |

---

## 2. Architecture Fix — Supabase as Source of Truth

### New Data Flow

```
LOGIN
  → Fetch attempts + error_logs from Supabase (last 90 days)
  → Merge into localStorage (dedupe by UUID)
  → App runs from localStorage (fast reads)

USER ACTION (answer question / log error)
  → Write to localStorage immediately (optimistic, instant UI)
  → Write to Supabase (async, with retry on failure)
  → On failure: queue in localStorage under 'cat_sync_queue'

BACKGROUND SYNC (every 60s while active)
  → Flush 'cat_sync_queue' to Supabase
  → On next login: re-merge any server-side changes
```

### Key Principle
- localStorage = **read cache** (fast UI, offline fallback)
- Supabase = **write-ahead log + source of truth**
- UUIDs = shared primary key across both systems

---

## 3. Environment Setup — DEV / PROD

### Step 1: Create Two Supabase Projects
```
PROD: lvbqmaarriglqaegemgc.supabase.co  ← current (real users)
DEV:  [new project].supabase.co          ← testing only
```
Run the same `schema.sql` on DEV project via Supabase SQL Editor.

### Step 2: Replace `config.js` with Environment Detection

```js
// config.js — replace hardcoded creds with env detection

const ENV = (() => {
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'dev';
  if (host.includes('dev.') || host.includes('staging')) return 'dev';
  return 'prod';
})();

const CONFIGS = {
  dev: {
    SUPABASE_URL: 'https://YOUR_DEV_PROJECT.supabase.co',
    SUPABASE_KEY: 'YOUR_DEV_ANON_KEY',
    DEBUG: true,
  },
  prod: {
    SUPABASE_URL: 'https://lvbqmaarriglqaegemgc.supabase.co',
    SUPABASE_KEY: 'eyJhbGci...existing_key...',
    DEBUG: false,
  }
};

const CONFIG = CONFIGS[ENV];
const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_KEY = CONFIG.SUPABASE_KEY;

// Feature flags (see Section 7)
const FLAGS = {
  SUPABASE_SYNC:   ENV === 'prod',  // enable in prod when ready
  CROSS_DEV_SYNC:  ENV === 'prod',
  TEST_MODE:       ENV === 'dev',
  DEBUG_LOG:       CONFIG.DEBUG,
};
```

### Step 3: DEV → PROD Promotion Flow
```
1. Make change → test on localhost (hits DEV Supabase)
2. Test on dev.yourdomain.com (hits DEV Supabase)
3. Confirm working → update PROD config → deploy
4. Never touch PROD Supabase data manually
```

### Hosting (Simple, Free)
- Use **GitHub Pages** or **Netlify** (drag-and-drop deploy)
- Create two sites: `dev.catalyst.app` and `catalyst.app`
- Each site auto-detects ENV by hostname

---

## 4. Data Sync System

### 4a. ID Fix — Use UUIDs Everywhere

```js
// db.js — replace all Date.now() + Math.random() IDs

_newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
},
```

Apply in `saveAttempt()` and `saveErrorLog()`:
```js
const entry = { id: this._newId(), ... };
// Same ID used in localStorage AND Supabase insert
await sbClient.from('attempt_logs').insert([{ id: entry.id, ... }]);
```

### 4b. Login Sync — Fetch from Supabase on Login

Add `DB.syncFromSupabase()` called inside `Auth.onLogin()`:

```js
// db.js — new method
async syncFromSupabase(userId) {
  if (USE_DEMO || !sbClient) return;
  try {
    // Fetch last 90 days of attempts
    const since = new Date(Date.now() - 90 * 86400000).toISOString();

    const [attRes, errRes] = await Promise.all([
      sbClient.from('attempt_logs')
        .select('id,question_id,selected_option,selected_value,is_correct,time_taken,source,created_at')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500),

      sbClient.from('error_logs')
        .select('id,question_id,error_type,user_note,reattempt_status,reattempted_at,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(300)
    ]);

    if (attRes.data)  this._mergeAttempts(attRes.data);
    if (errRes.data)  this._mergeErrorLogs(errRes.data);

    if (FLAGS.DEBUG_LOG) console.log('[DB] Synced from Supabase:', attRes.data?.length, 'attempts,', errRes.data?.length, 'errors');
  } catch(e) {
    console.warn('[DB] Sync failed (offline?):', e.message);
    // Non-fatal — app continues with local data
  }
},

_mergeAttempts(serverRows) {
  const local = this._getLocal('cat_attempts', []);
  const localIds = new Set(local.map(a => a.id));
  let added = 0;
  serverRows.forEach(row => {
    if (!localIds.has(row.id)) {
      // Normalize server row to local shape
      local.push({
        id:              row.id,
        question_id:     row.question_id,
        user_id:         row.user_id || this._uid(),
        selected_option: row.selected_option,
        selected_value:  row.selected_value,
        is_correct:      row.is_correct,
        time_taken:      row.time_taken,
        source:          row.source,
        timestamp:       new Date(row.created_at).getTime()
        // subject/topic missing from Supabase — join needed (see Section 5)
      });
      added++;
    }
  });
  if (added > 0) this._setLocal('cat_attempts', local);
},

_mergeErrorLogs(serverRows) {
  const local = this._getLocal('cat_error_logs', []);
  const localIds = new Set(local.map(l => String(l.id)));
  serverRows.forEach(row => {
    const existing = local.find(l => String(l.id) === row.id);
    if (!existing) {
      local.push({
        id:               row.id,
        question_id:      row.question_id,
        user_id:          this._uid(),
        error_type:       row.error_type,
        user_note:        row.user_note || '',
        reattempt_status: row.reattempt_status,
        created_at:       row.created_at,
        // subject/topic/question_text require a join (see Section 5)
      });
    } else if (row.reattempt_status && !existing.reattempt_status) {
      // Server has it marked fixed — update local
      existing.reattempt_status = true;
      existing.reattempted_at   = row.reattempted_at;
    }
  });
  this._setLocal('cat_error_logs', local);
},
```

Call it in `auth.js` inside `onLogin()`:
```js
// auth.js — in onLogin(), before App.init()
if (!USE_DEMO) {
  await DB.syncFromSupabase(user.id);  // waits max ~2s, then continues
}
DB.startSession();
DB.updateStreak();
App.init();
```

### 4c. Offline / Failed Write Queue

```js
// db.js — add write queue for failed Supabase writes
async _supabaseInsert(table, row) {
  if (USE_DEMO || !sbClient) return;
  try {
    const { error } = await sbClient.from(table).insert([row]);
    if (error) throw error;
  } catch(e) {
    // Queue for retry
    const queue = this._getLocal('cat_sync_queue', []);
    queue.push({ table, row, failedAt: Date.now() });
    this._setLocal('cat_sync_queue', queue);
    console.warn('[DB] Queued for retry:', table);
  }
},

async flushSyncQueue() {
  if (USE_DEMO || !sbClient) return;
  const queue = this._getLocal('cat_sync_queue', []);
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    try {
      await sbClient.from(item.table).insert([item.row]);
    } catch(e) {
      if (Date.now() - item.failedAt < 7 * 86400000) {
        remaining.push(item); // keep for 7 days max
      }
    }
  }
  this._setLocal('cat_sync_queue', remaining);
},
```

Call `DB.flushSyncQueue()` on login and every 60 seconds:
```js
// app.js — in App.init()
setInterval(() => DB.flushSyncQueue(), 60000);
```

---

## 5. Database Schema Changes

### Add `subject` + `topic` to `attempt_logs` (CRITICAL for sync)

The missing `subject`/`topic` columns are why merge is incomplete — they exist only in localStorage, not in Supabase. Fix:

```sql
-- Run in Supabase SQL Editor (DEV first, then PROD)
alter table public.attempt_logs
  add column if not exists subject text,
  add column if not exists topic   text;

-- Index for dashboard queries
create index if not exists idx_attempt_logs_subject on public.attempt_logs(subject);
create index if not exists idx_attempt_logs_topic   on public.attempt_logs(topic);
```

Update `saveAttempt()` Supabase insert to include them:
```js
await this._supabaseInsert('attempt_logs', {
  id: entry.id,
  user_id:         attempt.user_id,
  question_id:     attempt.question_id,
  selected_option: attempt.selected_option,
  selected_value:  attempt.selected_value,
  is_correct:      attempt.is_correct,
  time_taken:      attempt.time_taken || 0,
  source:          attempt.source || 'practice',
  subject:         attempt.subject,   // ADD
  topic:           attempt.topic      // ADD
});
```

### Add `question_text` + `subject` + `topic` to `error_logs`

```sql
alter table public.error_logs
  add column if not exists question_text text,
  add column if not exists subject       text,
  add column if not exists topic         text;
```

Update `saveErrorLog()` Supabase insert:
```js
await this._supabaseInsert('error_logs', {
  id:               entry.id,
  user_id:          log.user_id,
  question_id:      log.question_id,
  error_type:       log.error_type,
  user_note:        log.user_note || '',
  reattempt_status: false,
  question_text:    log.question_text || '',
  subject:          log.subject,
  topic:            log.topic
});
```

### Fix `markErrorFixed()` — UUID match now works
```js
markErrorFixed(errorId) {
  // Local update (same as before)
  const key = 'cat_error_logs';
  const logs = this._getLocal(key, []);
  const idx = logs.findIndex(l => String(l.id) === String(errorId));
  if (idx !== -1) {
    logs[idx].reattempt_status = true;
    logs[idx].reattempted_at  = new Date().toISOString();
    this._setLocal(key, logs);
  }
  // Supabase update — now works because IDs are UUIDs
  if (!USE_DEMO && sbClient) {
    sbClient.from('error_logs')
      .update({ reattempt_status: true, reattempted_at: new Date().toISOString() })
      .eq('id', String(errorId))
      .then(() => {}).catch(() => {});
  }
},
```

---

## 6. Bug Fix Plan — All Critical Bugs

### Fix 1: Wrong table name in `saveReport()` (db.js:255)
```js
// BEFORE
await sbClient.from('question_reports').insert([{ report_type, note }]);

// AFTER — matches schema.sql column names
await this._supabaseInsert('reports', {
  user_id:    report.user_id,
  question_id: report.question_id,
  issue_type:  report.report_type,  // schema column is 'issue_type'
  details:     report.note || ''
});
```

### Fix 2: No `LIMIT` + no `is_active` filter (db.js:14)
```js
async getQuestions(filters = {}) {
  if (USE_DEMO) { /* unchanged */ }
  const LIMIT = filters.limit || 50;
  let query = sbClient
    .from('questions')
    .select('*, sets(passage, instruction, topic, subject)')
    .eq('is_active', true)   // ADD
    .limit(LIMIT);            // ADD
  if (filters.subject && filters.subject !== 'all') query = query.eq('subject', filters.subject);
  if (filters.topic   && filters.topic   !== 'all') query = query.eq('topic',   filters.topic);
  if (filters.difficulty && filters.difficulty !== 'all') query = query.eq('difficulty', filters.difficulty);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(q => this._attachPassageFromJoin(q));
},
```

### Fix 3: `_hasAutoLoaded` — reset on navigation away
```js
// app.js — in navigate()
navigate(page) {
  if (page !== 'practice' && this.currentPage === 'practice') {
    Practice._hasAutoLoaded = false;  // ADD — reset when leaving practice
  }
  // ... rest unchanged
}
```

### Fix 4: Double event listeners on error log filters
Remove the three `onchange="..."` inline attributes from `index.html`:
```html
<!-- REMOVE onchange attr from all three — lines 540, 546, 555 -->
<select id="el-subject-filter" class="filter-select">  <!-- no onchange -->
<select id="el-type-filter" class="filter-select">     <!-- no onchange -->
<select id="el-status-filter" class="filter-select">   <!-- no onchange -->
```
The `addEventListener` calls in `errorlog.js` handle everything already.

### Fix 5: Add note field to inline error panel (`index.html`)
```html
<!-- Inside #error-tag-inline, add before etag-footer div -->
<div class="etag-note-wrap" style="margin-top:0.75rem">
  <textarea id="etag-note-input" class="etag-note"
    placeholder="Optional: what went wrong? (helps you review later)"
    rows="2" style="width:100%;resize:none"></textarea>
</div>
```

Wire in `practice.js` `_saveInlineError()`:
```js
user_note: document.getElementById('etag-note-input').value.trim(),
```
Also clear it in `_showInlineErrorTag()`:
```js
const noteEl = document.getElementById('etag-note-input');
if (noteEl) noteEl.value = '';
```

### Fix 6: VARC double-count in dashboard (`db.js`)
```js
// db.js — in getTodaySubjectProgress(), split VARC by topic pattern
getTodaySubjectProgress() {
  const attempts = this._getLocal('cat_attempts', []);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayA = attempts.filter(a => a.timestamp >= today.getTime());

  const RC_TOPICS = ['Reading Comprehension'];  // expand as needed

  const quant  = todayA.filter(a => a.subject === 'Quant').length;
  const lrdi   = todayA.filter(a => a.subject === 'LRDI').length;
  const varc_rc = todayA.filter(a => a.subject === 'VARC' && RC_TOPICS.includes(a.topic)).length;
  const varc_va = todayA.filter(a => a.subject === 'VARC' && !RC_TOPICS.includes(a.topic)).length;

  return { quant, lrdi, varc_rc, varc_va, total: quant + lrdi + varc_rc + varc_va };
},
```

Update `dashboard.js` `_renderSubjectGoals()` to use `varc_rc` and `varc_va`:
```js
done: Math.floor(progress.varc_rc / 4),  // VARC·RC row
done: progress.varc_va,                   // VARC·VA row
```

### Fix 7: `Dashboard.incrementToday()` — update subject goals live
```js
incrementToday() {
  this.todayDone = (this.todayDone || 0) + 1;
  this.updateGoalUI();
  this._renderSubjectGoals();   // ADD — live update subject rows
},
```

---

## 7. Feature Flag System

Already defined in `config.js` (Section 3). Usage pattern:

```js
// Anywhere in codebase — gate features behind flags
if (FLAGS.SUPABASE_SYNC) {
  await DB.syncFromSupabase(user.id);
}

if (FLAGS.TEST_MODE) {
  // show test mode nav item
  document.querySelector('[data-page="test"]').style.display = '';
}
```

Flags to define:
```js
const FLAGS = {
  SUPABASE_SYNC:    true,   // login sync (enable after testing)
  CROSS_DEV_SYNC:   true,   // merge on login
  WRITE_QUEUE:      true,   // offline retry queue
  TEST_MODE:        false,  // show test mode nav (Phase 2)
  REVIEW_PAGE:      false,  // show review nav (Phase 2)
  FEEDBACK_FAB:     true,   // show feedback button
  DEBUG_LOG:        ENV === 'dev',
};
```

To release a feature: change one flag from `false` → `true`, deploy. To rollback: change back. No code revert needed.

---

## 8. Deployment Flow

### One-Time Setup
```
1. Create GitHub repo → push all code
2. Connect repo to Netlify (free)
3. Create two Netlify sites:
   - catalyst-dev.netlify.app  (auto-deploys from 'dev' branch)
   - catalyst-app.netlify.app  (auto-deploys from 'main' branch)
4. ENV auto-detected by hostname in config.js
```

### Per-Change Flow
```
1. Make change on local machine (hits DEV Supabase via localhost detection)
2. Test manually on localhost
3. git push origin dev  → catalyst-dev.netlify.app updates
4. Test on dev site with real DEV Supabase data
5. If good: git merge dev → main → push
6. catalyst-app.netlify.app updates (PROD, ~30s deploy)
7. Verify on prod with your own account
```

### No rollback? Git revert:
```bash
git revert HEAD  # creates new commit undoing last change
git push origin main  # deploys immediately
```

---

## 9. Launch Checklists

### ✅ Before First 10 Users
- [ ] Fix `question_reports` → `reports` table name bug
- [ ] Fix UUIDs in `saveAttempt` + `saveErrorLog`
- [ ] Add `LIMIT(50)` + `is_active` filter to `getQuestions()`
- [ ] Add `subject` + `topic` columns to `attempt_logs` (SQL migration)
- [ ] Add `question_text` + `subject` + `topic` to `error_logs` (SQL migration)
- [ ] Remove inline `onchange` attributes from `index.html`
- [ ] Add note field to inline error panel
- [ ] Fix `markErrorFixed()` UUID match
- [ ] Fix `_hasAutoLoaded` reset on navigation
- [ ] Fix VARC double-count in goal widget
- [ ] Fix `incrementToday()` to re-render subject goals
- [ ] Test full login → practice → error log → fix cycle on DEV
- [ ] Test demo mode still works
- [ ] Verify Supabase RLS blocks cross-user data access
- [ ] Set real UPI ID + WhatsApp number in upgrade modal
- [ ] Deploy to prod URL (not localhost)

### ✅ Before 50 Users
- [ ] Implement `syncFromSupabase()` on login
- [ ] Implement `flushSyncQueue()` offline retry
- [ ] Set up DEV/PROD Supabase separation
- [ ] Add DEV site + separate test environment
- [ ] Enable feature flags system
- [ ] Add pagination if question bank > 200 questions
- [ ] Monitor Supabase dashboard for failed RLS hits or errors
- [ ] Add `streak_last_date` sync with `user_profiles`
- [ ] Test with 2-3 beta users on new device (verify sync works)
- [ ] Set up Supabase email templates (welcome, password reset)

---

## 10. Chronological Task Roadmap

### Week 1 — Stability (Zero data loss, zero silent failures)

```
Day 1 (2h):
  ✦ Fix table name bug (reports)
  ✦ Fix UUID ID system (crypto.randomUUID)
  ✦ Fix markErrorFixed()
  ✦ Add is_active filter + LIMIT to getQuestions()

Day 2 (2h):
  ✦ Remove inline onchange attrs from HTML
  ✦ Fix _hasAutoLoaded reset
  ✦ Add note field to inline error panel
  ✦ Fix incrementToday() subject goals

Day 3 (2h):
  ✦ Run SQL migration: add subject/topic to attempt_logs
  ✦ Run SQL migration: add question_text/subject/topic to error_logs
  ✦ Update saveAttempt() + saveErrorLog() Supabase inserts
  ✦ Fix VARC double-count

Day 4 (1h):
  ✦ Full manual test: login → practice 10q → log 3 errors → fix 1 → dashboard
  ✦ Full manual test: demo mode
  ✦ Deploy to prod

Day 5:
  ✦ Give access to 2–3 trusted friends as beta users
  ✦ Watch for bugs in Supabase dashboard (Table Editor → attempt_logs)
```

### Week 2 — Environment + Sync

```
Day 1 (3h):
  ✦ Create DEV Supabase project
  ✦ Replace config.js with ENV-detection system
  ✦ Set up feature flags
  ✦ Set up GitHub + Netlify (dev branch + main branch)

Day 2-3 (4h):
  ✦ Implement DB.syncFromSupabase() (login fetch + merge)
  ✦ Implement _mergeAttempts() + _mergeErrorLogs()
  ✦ Implement _supabaseInsert() + flushSyncQueue()
  ✦ Test on DEV: login on device 1, answer 5q, login device 2 → verify sync

Day 4 (1h):
  ✦ Enable FLAGS.SUPABASE_SYNC = true in prod
  ✦ Test yourself with two browsers (Chrome + incognito)

Day 5:
  ✦ Push to prod
  ✦ Notify beta users to test on a second device
```

### Week 3 — Question Bank + Scale

```
  ✦ Populate real questions in Supabase (DEV first, then PROD)
  ✦ Test getQuestions() with 100+ questions
  ✦ Add pagination if needed (load more button)
  ✦ Verify smart queue works with real data
  ✦ Enable Fix My Mistakes with real weakest-topic detection
```

### Week 4 — Launch to 10 Real Users

```
  ✦ Run through full launch checklist (Section 9)
  ✦ Record a 2-min demo video
  ✦ Share with 10 CAT aspirants personally
  ✦ Set up a WhatsApp group for direct feedback
  ✦ Monitor Supabase for errors daily
  ✦ Fix reported bugs within 24h
```

> **When to start user testing:** End of Week 1 (beta) / End of Week 2 (real users).
> Don't wait for perfection. 10 users with Week 1 stability is better than 0 users with Week 4 perfection.
