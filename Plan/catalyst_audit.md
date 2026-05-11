# CATalyst — Full Technical Audit
*Senior Engineer Review · May 2026*

---

## 1. System Overview

### Architecture

Single-page application. No bundler, no framework — raw HTML + vanilla JS loaded via `<script>` tags in dependency order (`config → db → auth → dashboard → practice → test → errorlog → app`). Supabase is the only backend — no server of your own.

```
Browser
 └── index.html (SPA, one page)
      ├── css/style.css
      └── js/
           ├── config.js     ← Supabase creds + DEMO_QUESTIONS/DEMO_SETS (hardcoded)
           ├── db.js         ← All data ops (dual-mode: localStorage + Supabase)
           ├── auth.js       ← Login / Signup / Demo flow
           ├── dashboard.js  ← Stats, goal widget, weak topics
           ├── practice.js   ← Practice engine (MCQ + TITA + error tag)
           ├── test.js       ← Test mode (Phase 2, hidden)
           ├── errorlog.js   ← Error log screen + Fix My Mistakes
           └── app.js        ← Boot, routing, theme, toast, upgrade modal
```

### Data Flow

```
User action
  → practice.js (UI event)
  → DB.saveAttempt() in db.js
      → localStorage (always, namespaced by user ID)
      → Supabase attempt_logs (async, fire-and-forget)
  → (if wrong) DB.saveErrorLog()
      → localStorage
      → Supabase error_logs (async, fire-and-forget)
  → dashboard.js reads from localStorage only (never re-fetches from Supabase)
```

**The system is localStorage-first. Supabase writes are a best-effort secondary sink. Reads always come from localStorage.** This is the single most important architectural truth to understand.

### Key Feature Implementation

| Feature | How it works |
|---|---|
| **Practice flow** | Filters → `DB.getQuestions()` → `DB.sortBySmartQueue()` → `Practice.renderQuestion()` |
| **Question fetching** | Supabase: `questions.*,sets(...)` join. Demo: in-memory `DEMO_QUESTIONS` |
| **Attempt logging** | Sync write to `localStorage` + async fire-and-forget to `attempt_logs` |
| **Error logging** | Inline panel (`error-tag-inline`) appears after wrong answer → `DB.saveErrorLog()` |
| **Smart queue** | Sorts by: unattempted → lowest accuracy → oldest. Reads from **local** attempts only |

---

## 2. Code & Logic Issues

### 🔴 Critical Bugs

**1. `saveReport()` calls a non-existent table**
```js
// db.js:255
await sbClient.from('question_reports').insert([...])
```
The schema defines `reports`, not `question_reports`. Every report submission silently fails with a 404. The `console.warn` swallows the error — users get a success toast for a failed operation.

**2. `markErrorFixed()` won't work for Supabase rows**
```js
// db.js:186
sbClient.from('error_logs').update({ reattempt_status: true }).eq('id', errorId)
```
`errorId` for local entries is `Date.now() + Math.random()` — a float. The Supabase `error_logs.id` is a UUID. This `.eq('id', errorId)` will never match any row in Supabase. The fix only persists locally; cross-device sync for "fixed" status is broken.

**3. `sortBySmartQueue()` reads from localStorage but questions come from Supabase**
```js
// db.js:59
const attempts = this._getLocal('cat_attempts', []);
```
When a real (non-demo) user logs in on a new device, localStorage is empty. Every question appears as "unattempted" and the smart queue is always random — the entire personalization feature is non-functional across devices.

**4. Inline error tag panel never clears note field**
`_showInlineErrorTag()` resets button state but there's no `note` field in the inline panel — unlike the legacy modal which has `error-note-input`. The inline flow saves `user_note: ''` always. Users can never add a note from the primary path.

**5. `Auth.init()` is conditionally called — double-binding risk**
```js
// app.js:197 and 205
Auth.init(); // called in two separate catch/else branches
```
If network is slow and the Supabase `getSession()` promise resolves after 5s but the catch fires early, `Auth.init()` could be called twice, binding event listeners twice on login/signup buttons.

---

### 🟡 Bad Practices / Logic Gaps

**6. Anon key exposed in frontend `config.js`**
The Supabase anon key is hardcoded in a plain JS file. This is technically the intended Supabase model (anon key + RLS), but with no `.env` or build step, rotating the key requires a manual code push. More critically — RLS **must** be airtight; if any policy has a gap, the key is the only barrier.

**7. `question_text` stored redundantly in localStorage error log**
```js
// db.js:147
question_text: log.question_text || '',
```
The Supabase `error_logs` schema has no `question_text` column. When reading from Supabase (future), you'd have to join `questions` to display the text. Currently there's no path to read error logs from Supabase — only localStorage. So this field is wasted on Supabase and necessary only locally. The inconsistency will bite you when you add cross-device sync.

**8. VARC RC vs VA progress is double-counted in dashboard**
```js
// dashboard.js:158-168
done: Math.floor(progress.varc / 4),   // VARC·RC
done: progress.varc,                     // VARC·VA
```
Both rows use `progress.varc` (total VARC attempts). A user who does 4 RC questions will show `1/1 sets ✅` for RC AND `4/5 Q 🔶` for VA — both counting the same 4 attempts. Goals appear inflated.

**9. `_hasAutoLoaded` flag never resets after `endPractice()` without answering**
```js
// practice.js:328
this._hasAutoLoaded = false; // only in the "answered === 0" branch of endPractice()
```
If a user ends a session mid-way (after answering at least 1 question), `_hasAutoLoaded` stays `true`. Re-navigating to Practice won't auto-load questions. Users see a blank practice page until they manually click "Load Questions." The guard was meant as a once-per-session thing but breaks re-entry UX.

**10. `DB.getErrorLogs({})` in HTML `onchange` attribute (inline JS)**
```html
<!-- index.html:540 -->
onchange="ErrorLog._activeTypeFilter=null; ErrorLog._renderLogList(DB.getErrorLogs({}))"
```
Inline `onchange` attributes exist on the filter dropdowns — contradicting the `addEventListener` calls for the same elements in `errorlog.js`. Both fire. The `addEventListener` in `init()` also calls `_renderLogList(DB.getErrorLogs({}))` — so subject/type filter changes trigger the render **twice**.

**11. `Dashboard.incrementToday()` doesn't update subject goal rows**
```js
// dashboard.js:251-254
incrementToday() {
  this.todayDone = (this.todayDone || 0) + 1;
  this.updateGoalUI();  // only updates sidebar bar, not subject goal widget
}
```
After answering a question, the sidebar "Today's Goal" bar updates live. The per-subject goal rows (Quant/LRDI/VARC) in the dashboard widget do **not** update until user navigates away and back. Real-time feedback for a daily goal is the main dashboard value prop — it's broken.

---

## 3. Database Issues

### Schema Adherence

| Check | Status |
|---|---|
| `attempt_logs` columns match | ✅ OK |
| `error_logs` columns match | ⚠️ `question_text` written locally but not in DB schema |
| `reports` table name | 🔴 Code calls `question_reports` — wrong |
| `feedback` columns | ✅ OK |
| `user_profiles` auto-created trigger | ✅ Correct |
| RLS policies | ⚠️ See below |

### RLS Gap: No SELECT policy on `feedback` and `reports`
```sql
-- schema.sql:173-180
-- Only INSERT policies exist for feedback and reports
create policy "Insert feedback" on public.feedback for insert ...
create policy "Insert reports"  on public.reports  for insert ...
```
There's no way to query your own feedback or reports from the frontend. Fine for MVP, but if you ever add an admin dashboard or a "my reports" view, you'll need to add SELECT policies. More critically — there's no way to verify that your feedback/reports are even getting saved without checking the Supabase dashboard directly.

### RLS Gap: No INSERT policy on `questions` or `sets`
This is intentional (admin-only via Supabase dashboard), but there's no documented or enforced admin path. If you need to bulk-insert questions, you rely on the Supabase SQL editor or the `Question_Bank` directory (structure unknown without reading it).

### Data Inconsistency Risks

**1. Dual-write split brain:** Attempts written to localStorage immediately but Supabase write is async and silently fails on network error. A user's local stats will show 50 questions done; Supabase will show 30. There is no reconciliation mechanism.

**2. Error log IDs are local floats, Supabase IDs are UUIDs.** When both exist for the same wrong answer event, there's no way to link them. `markErrorFixed()` updates the local entry by float ID but the Supabase row by... the same float, which will never match a UUID. They diverge permanently.

**3. No `is_active` filter in `getQuestions()` query:**
```js
// db.js:14
let query = sbClient.from('questions').select('...');
// No .eq('is_active', true)
```
Inactive/deprecated questions (where `is_active = false`) will be served to users. If you soft-delete bad questions by setting `is_active = false`, they'll still appear in practice.

**4. No `LIMIT` on `getQuestions()`:**
As the question bank grows (say, 5,000 questions), `getQuestions()` with no filters fetches the entire table. At 5k questions × ~1KB each, that's ~5MB per load. Supabase free tier has a 500ms response target; this will blow it.

---

## 4. Critical Risks (Priority Order)

| # | Issue | Impact |
|---|---|---|
| **1** | **No Supabase reads for stats/history** — all dashboard data comes from localStorage. Switch device → zero history | Data integrity / UX |
| **2** | **`question_reports` vs `reports` table mismatch** — silent failure on every report submission | UX / trust |
| **3** | **No `LIMIT` on `getQuestions()`** — will timeout/crash at scale | Scalability |
| **4** | **`markErrorFixed()` UUID mismatch** — "Mark as Fixed" never persists cross-device | Data integrity |
| **5** | **Dual-write split brain** — no reconciliation between localStorage and Supabase | Data integrity |
| **6** | **VARC RC/VA double-count** — goal widget shows wrong progress | UX |
| **7** | **`_hasAutoLoaded` not reset** — returning to Practice shows blank screen | UX |
| **8** | **Double event firing on error log filters** — `onchange` + `addEventListener` both fire | UX / reliability |
| **9** | **No `is_active` filter** — soft-deleted questions still served | Data integrity |
| **10** | **Inline error tag has no note field** — primary error logging path loses note feature | Product value |

---

## 5. MVP Gaps (vs APP_FLOW.md)

### Missing Entirely

| APP_FLOW.md requirement | Status |
|---|---|
| "Resume Session" CTA on dashboard | ❌ Not implemented. No concept of a paused session |
| "Retry wrong questions" from session end | ❌ `ss-view-errors` navigates to Error Log, but no direct reattempt flow from session summary |
| "Mark corrected" on retry in Review Flow | ❌ Review page (`page-review`) exists in HTML but `review.js` is not provided — unknown state |
| Weak area detection based on accuracy data from Supabase | ❌ Only from localStorage; cross-device is zero |
| Number of questions selector in practice config | ❌ No question count limit — always loads all matching questions |
| Per-session error notes (note field in inline error panel) | ❌ Inline panel has no textarea; legacy modal has one but is not triggered |

### Incorrectly Implemented

| Feature | Issue |
|---|---|
| **"Fix My Mistakes"** | Loads questions for weakest topic from Supabase correctly, but ignores whether the user has already correctly answered those questions. Could serve questions they've since mastered. |
| **Session summary stats** | `_sessionTimes` only includes questions where the user answered (clicked an option). Questions viewed but skipped (navigated away) are not in the denominator — avg time is misleading. |
| **Smart queue** | Reads from localStorage attempts, so personalization is device-local only. The "Supabase-backed" version of smart queue doesn't exist yet. |
| **Trial system** | `trial_started_at` exists in `user_profiles` (Supabase) AND `cat_trial` (localStorage). They are never synced. A user who clears localStorage loses their trial start date and gets a new 7-day trial. |
| **Streak** | `streak_last_date` in `user_profiles` (Supabase) exists but is never read or written by the app. Streak is purely localStorage. |

### Incomplete / Half-done

- **Bookmarks, Difficult marks, Notes** — localStorage only, no Supabase persistence. Cross-device sync impossible.
- **Test Mode** — full UI exists in HTML + `test.js` is loaded, but nav item is `display:none`. Unknown if `test.js` is functional.
- **Review page** — HTML exists, `review.js` is loaded, but the file wasn't in the provided codebase. Cannot audit.
- **Feedback FAB** — hidden by default, shown only after login. No way for demo users to give feedback before signing up.

---

## 6. Immediate Action Plan

### Task 1 — Fix the table name bug + add `is_active` filter (30 min)
```js
// db.js — fix report table
await sbClient.from('reports').insert([{       // was: 'question_reports'
  user_id:     report.user_id,
  question_id: report.question_id,
  issue_type:  report.report_type,             // column is 'issue_type' in schema
  details:     report.note || ''
}]);

// db.js — add is_active filter to getQuestions()
let query = sbClient.from('questions')
  .select('*, sets(passage, instruction, topic, subject)')
  .eq('is_active', true);                      // add this line
```
These two are silent data-loss bugs. Fix first.

---

### Task 2 — Add `LIMIT` + pagination to `getQuestions()` (1 hour)
```js
// db.js — cap results for scalability
const QUESTION_PAGE_SIZE = 30;
let query = sbClient.from('questions')
  .select('*, sets(passage, instruction, topic, subject)')
  .eq('is_active', true)
  .limit(QUESTION_PAGE_SIZE);
// Shuffle client-side after fetch (same as getQuestionsByTopic already does)
```
Also add a `count` select to show users "Showing X of Y questions" in the filter bar. This prevents the system from choking as the question bank grows.

---

### Task 3 — Fix the dual-ID problem for error logs (1-2 hours)
The root issue: local IDs are floats, Supabase IDs are UUIDs.

**Solution:** Generate a UUID client-side for all new error log entries:
```js
// db.js — use crypto.randomUUID() instead of Date.now() + Math.random()
const entry = {
  id: crypto.randomUUID(),   // consistent across local + Supabase
  ...
};
// Then the Supabase insert also uses this same ID:
await sbClient.from('error_logs').insert([{ id: entry.id, ...restOfFields }]);
// And markErrorFixed() now works correctly on both sides
```
Do the same for `attempt_logs`. This fixes the split-brain for all future entries. Old entries remain broken but that's acceptable pre-launch.

---

### Task 4 — Fix the double event + `_hasAutoLoaded` UX bugs (1 hour)

**a) Remove inline `onchange` from HTML** for all three error log filter dropdowns (lines 540, 546, 555 in `index.html`). The `addEventListener` in `errorlog.js` handles it.

**b) Reset `_hasAutoLoaded` on every page exit:**
```js
// app.js — in navigate()
if (page !== 'practice') Practice._hasAutoLoaded = false;
// Or better: reset it in endPractice() unconditionally
```

**c) Fix `Dashboard.incrementToday()`** to re-render subject goals:
```js
incrementToday() {
  this.todayDone = (this.todayDone || 0) + 1;
  this.updateGoalUI();
  this._renderSubjectGoals();   // ADD THIS
}
```

---

### Task 5 — Add note field to inline error panel + fix VARC double-count (1 hour)

**a) Add textarea to inline error tag panel** in `index.html` (inside `#error-tag-inline`) and wire it in `_saveInlineError()`:
```js
user_note: document.getElementById('etag-note-input').value.trim(),
```
This restores the core product feature (contextual note on mistake) for the primary user path.

**b) Fix VARC double-count in `_renderSubjectGoals()`:**
```js
// dashboard.js — separate RC and VA tracking
// Need subject + topic-level filtering, e.g.:
const varc_rc = todayA.filter(a => a.subject === 'VARC' && a.topic.includes('Reading')).length;
const varc_va = todayA.filter(a => a.subject === 'VARC' && !a.topic.includes('Reading')).length;
```
This requires storing topic in attempts (already done) and defining which VARC topics are RC vs VA.

---

> [!IMPORTANT]
> The system is more demo-ready than production-ready. The core loop (practice → error log → fix) works locally. The Supabase integration is write-only with silent failures and no read-back. For 10–20 real users: complete Tasks 1–3 before any user touches it, then 4–5 within the first week of usage.

> [!WARNING]
> Do NOT launch without Task 1 (table name bug). Every question report silently fails — you'll have zero visibility into bad questions from your users.
