# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Product Is

CATalyst is a **mistake-fixing system** for CAT exam aspirants — not a practice app. The core loop is: Solve → Realize → Diagnose → Fix → Reinforce → Return. Every UI and data decision is driven by the "Mistake Pressure System": make mistakes visible, show the mark cost, force acknowledgment, push the user to fix immediately.

**Positioning (v2 pivot, June 2026):** CATalyst is becoming a **coaching-replacement system for self-study CAT aspirants** — it interviews you, builds your personal roadmap, gives you adaptive daily practice from real CAT questions, fixes your mistakes, and adjusts every week. The core insight from field testing: the Fix Mode loop only works if CATalyst is where the user practices, and coached users will never make it their practice home. So we build for the people who have no practice home. The Fix Mode loop is unchanged — it remains the core product mechanism.

The full pivot spec lives in `CATalyst_Max_v2_Plan.md` — read it before any product or roadmap decision. **Build starts only after the first MVP Dev client (locked decision).** The earlier "infrastructure on top of coaching / keep using iQuanta" positioning is retired — coached aspirants never stuck (their portal is their practice home; a second app loses to sunk cost every time).

## Running the App

No build tools, no npm, no bundler. Open `index.html` directly in a browser or serve it with any static file server:

```bash
npx serve .          # or
python3 -m http.server 8080
```

There are no lint, test, or compile steps.

## Current Product State

- **Production:** https://catalyst-app-six.vercel.app
- **Landing page:** https://catalyst-app-six.vercel.app/landing.html (live)
- **Deployments:** 20+ Vercel deployments, 60+ commits
- **Users:** 3 trial signups, 1 paying user (Oviya — ₹489 till CAT)
- **Fix Mode completions:** confirmed by at least 3 users (Hitarth, Krishna, one other)
- **Key contacts:** Hitarth (most engaged, suggested ₹449 bundle), Shirin (converting ~June 13), Siddhant (99.85%ile, founder of CAT Unfiltered, 400 signups / 32 paying in 6 days — validated the concept strongly, but his community is early-stage aspirants; revisit August), Prakhar (warm lead, on Rodha portal — v1 didn't fit his workflow)
- **Revenue:** ₹489 (1 paying user). Target: ₹1L MRR by month 5–6.
- **Question bank:** ~794 questions (see Question Bank Status below)

**Field-test learnings (May 20 – June 11, 2026) — the evidence behind the v2 pivot:**
- 100+ DMs → 15–18 replies → 3 trials → 1 paid. 95% of feedback was positive; ~0% of usage followed. Compliments ≠ conversions ≠ retention.
- Oviya converted after a 45-minute personal VARC guidance conversation — she bought trust in Sahil, not the product, and hasn't used CATalyst since ("coaching material comes first").
- Coached aspirants don't solve on CATalyst → no mistakes logged → Fix Mode never triggers → loop never starts.
- Nobody manually logs mistakes from another platform. Max v1 (PDF upload) premise was wrong — coaching DPPs live inside portals, not PDFs. **Scrapped.**

## Pricing

**Current (live):**
- First 20 users locked price: ₹99/month OR ₹489 till CAT. 19 slots remaining. Honored for existing users after the v2 launch.
- Payment: manual UPI `7080442040@pthdfc` via WhatsApp `+91 70804 42040`. Razorpay integration is part of the Max v2 build (manual UPI doesn't scale past 20 users).
- **Trial duration: 3 days** (`TRIAL_DAYS = 3` in `db.js`).

### Tier Structure (Max v2 — locked)

| | Free | ₹99 Roadmap Week | Pro ₹489/CAT | Max ₹999/CAT |
|---|---|---|---|---|
| Question bank | Browse sample | Full (7 days) | Full | Full |
| Fix Mode + Error Log | Demo | ✅ | ✅ | ✅ |
| Counselling + AI Roadmap | ❌ | ✅ (1 week) | ❌ | ✅ till CAT |
| Adaptive daily DPPs | ❌ | ✅ (1 week) | ❌ | ✅ |
| Weekly AI reviews | ❌ | ❌ | ❌ | ✅ |
| Tracker/streaks/graphs | ❌ | Basic | Basic | Full |
| Cohort/accountability | ❌ | ❌ | ❌ | ✅ |

- **₹99 paid entry, no free AI** — user pays before any AI runs; payment is the seriousness filter, and every ₹99 trial is profitable (~58% margin; Max ~78%+).
- ₹99 is credited toward Max ("Upgrade for ₹900"). Day 7 = upgrade wall: roadmap + adaptive DPPs continue only on Max.
- Pro stays for question-bank-only users; Max is the flagship.
- Marketing anchor: **"Coaching-level structure. ₹999 till CAT."** vs ₹15–30k coaching.

## Active Bugs

Fix these before any outreach push — in priority order:

1. **[HIGH] Analytics events not logging** — `events` table exists, `DB.logEvent()` exists, but inserts are not firing. Debug the call chain from `DB.logEvent()` → Supabase insert. Without this we are blind on conversion data.

2. **[HIGH] DI set images missing** — ~50 Data Interpretation sets have no images uploaded to Supabase Storage. `image_url` fields are empty/null. Affects the entire DI section on mobile. Need to crop, name, and upload image assets for all 50 sets.

3. **[LOW] `package.json` uncommitted** — run `git diff package.json`, commit if intentional.

4. **[LOW] `.DS_Store` not in `.gitignore`** — one-line fix.

> **RC scroll on mobile — FIXED.** RC passages now scroll correctly on mobile Chrome. This was a previous high-priority bug; it is resolved.

## Architecture

### Single-File SPA

Everything lives in `index.html` + `css/style.css` + `js/*.js`. Navigation is purely class-based: `App.navigate(page)` hides all `.page` divs and shows `#page-<name>`. There is no router library.

Script load order in `index.html` is critical — files depend on each other in this sequence:
`config.js` → `db.js` → `auth.js` → `dashboard.js` → `practice.js` → `test.js` → `errorlog.js` → `onboarding.js` → `app.js`

`app.js` is always last — it boots the app after all other modules are defined.

### Data Layer (`js/db.js`)

All data operations go through `DB.*`. Demo mode has been removed — `USE_DEMO` is permanently `false`. All reads/writes go to Supabase, with localStorage as a fallback cache.

Every user-specific localStorage key is namespaced as `cat_<key>_${userId}` to allow multi-user devices without conflicts. Global keys (theme) are not namespaced — the full list is in `DB._globalKeys`. `DB.clearUserData(uid)` wipes all namespaced keys for a specific user (useful for admin resets or testing).

Supabase tables: `questions`, `sets`, `attempt_logs`, `error_logs`, `reports`, `feedback`, `events`. The `questions` query always uses `sets!left` (LEFT JOIN) — without `!left`, PostgREST defaults to INNER JOIN and silently drops all standalone questions where `set_id IS NULL`.

### Environment Detection (`js/config.js`)

`config.js` detects `dev` vs `prod` from `window.location.hostname`. Dev and prod each have separate Supabase credentials and databases. Feature flags (`FLAGS.*`) enable/disable features without code changes — `DEBUG_LOG` is auto-enabled in dev.

### Practice & Fix Mode (`js/practice.js`)

`practice.js` is the most complex file. Key state:
- `_isFixSession` — true when launched from "Fix My Mistakes"
- `_fixPhase: 1|2` — Phase 1 re-attempts past errors (red UI), Phase 2 drills the weak topic (blue UI)
- `_fixedInSession` — locked copy of Phase 1 correct count before Phase 2 resets `_sessionCorrect`
- `_sessionTimes` — NOT reset between phases so the session-complete screen shows cumulative time

Fix session flow: `loadFixSession()` → Phase 1 questions → `_showFixTransition()` (2.5s auto-advance) → `_startPhase2()` → `_showFixSessionComplete()`.

`onPageEnter()` auto-loads questions 120ms after navigating to Practice. Filter panel behaviour: **open when no questions are loaded** (so the user sees the Load Questions button), **collapsed after questions load** (`_collapseFilters()` / `_openFilters()` helpers manage this). The filter-count select (`#filter-count`) controls 10/25/50 questions. The set-size filter (`#filter-set-size`) is applied client-side after DB fetch — it counts siblings by `set_id` using a Map and filters out questions whose set falls outside the chosen range (standalone questions with no `set_id` are excluded when any set-size filter is active).

First-session flow: on signup, `cat_first_session_${userId}` is set in localStorage. `loadQuestions()` detects this and caps to 10 questions, shows a nudge card at session end, then clears the flag so subsequent sessions use the selected count.

### Onboarding Tour (`js/onboarding.js`)

`Onboarding.maybeStart(userId)` is called from `App.init()` (first login) and the `else` branch of `onLogin()` (returning users). It runs once per user and walks through the full CATalyst loop in 15 steps:

- **Phase 1 (steps 1–6):** Welcome → Practice → Filters → Timer → Answer → Result
- **Phase 2 (steps 7–8):** End session nudge → Summary
- **Phase 3 (steps 9–10):** Error log → Fix My Mistakes
- **Phase 4 (steps 11–15):** Fix Mode P1 + P2 complete loop

Single "Let's Go" on welcome screen, "Not now" + "I've got it" available during tour.

- Snooze for a session: `sessionStorage.tour_snoozed = 'true'`
- Reset tour: `localStorage.removeItem('cat_tour_done_${userId}')`
- Spotlight + tooltip UI managed entirely within `onboarding.js` — no HTML markup needed
- Steps fire via `waitFor` events dispatched with `document.dispatchEvent(new CustomEvent('onboarding:signal', { detail: 'event-name' }))` from `practice.js` and `errorlog.js`

**iOS PWA storage split:** Safari and the home screen PWA have separate `localStorage` on iOS. Tour completion is therefore written to both localStorage (`cat_tour_done_${userId}`) AND Supabase (`events` table, `tour_completed` event). `maybeStart()` checks Supabase first if localStorage is empty — this prevents the tour from restarting when a user switches from Safari to the installed PWA.

### Error Log (`js/errorlog.js`)

State lives entirely on the `ErrorLog` object:
- `_activeSubjectFilter`, `_activeTypeFilter`, `_activeTopicFilter`, `_searchQuery` — active filter values
- `_allLogs` — cached full log array from the last `render()` call; used by `_renderLogList` and `_renderTopicFilter` so they don't re-fetch
- `_filtersExpanded` — tracks whether the collapsible advanced-filter panel is open
- `_manualErrorType` — holds the selected type in the "+ Add Mistake" modal before save

Hidden `<select>` elements (`#el-subject-filter`, `#el-type-filter`, `#el-status-filter`) are `display:none` but **must not be removed** — `saveState()`/`loadState()` read and write them directly, and they stay in sync with the visible pill/chip UI.

`_getFilteredLogs(allLogs)` is the single filter gate — all render methods call it. It reads `_activeSubjectFilter` (falling back to `#el-subject-filter` value), `_activeTypeFilter`, `#el-status-filter`, `_activeTopicFilter`, and `_searchQuery`. When subject changes (`_renderSubjectChips` click), `_activeTopicFilter` is reset to `'all'` to avoid stale cross-subject topic selections.

`_renderTopicFilter(allLogs)` builds the topic dropdown from only the logs matching the active subject — never from all logs. It also `replaceWith(cloneNode)` the select on every render to avoid duplicate change listeners.

Manual entry modal: `showAddModal()` resets form state, `_validateManualForm()` gates the Save button (requires both question text AND error type), `saveManualError()` calls `DB.saveErrorLog({ question_id: null, ... })`. Null `question_id` is exempt from the dedup check in `db.js`.

Card rendering uses `class="el-item el-item-v2"`. Cards are flex items inside `.error-log-list` which has a fixed `height`; `.el-item` must have `flex-shrink: 0` to prevent cards from collapsing to invisible bars when the list has many items.

`DB.getErrorInsights(logs)` returns `{ mostCommonError, errorTypeCounts, topicCounts, sortedTopics, weakestTopic }`. Legacy error type keys (`silly`, `conceptual`, `time`) must always be mapped to canonical keys (`calculation`, `concept_gap`, `guess`) before cost/label lookups. The canonical label and cost maps live at the top of `errorlog.js` (`EL_TYPE_LABELS`, `EL_COST_MAP`).

### Math Rendering & Text Formatting

KaTeX is loaded via CDN (`index.html`). Never set question content as raw `innerHTML` — always use `renderMath(el, rawText, isRC)` from `practice.js`. This function:
1. Masks LaTeX delimiters (`$$...$$`, `\[...\]`, `\(...\)`) into placeholders
2. Escapes `&`, `<`, `>` in non-math text so stray comparison symbols don't break HTML parsing
3. Replaces `/n/` and `\n` with `<br>`
4. Restores LaTeX placeholders, then calls KaTeX auto-render

RC passages use `formatRC()` which splits on `/n/n/` for paragraph breaks and wraps each in `<p class="rc-para">`. `formatRC` does **not** HTML-escape (the `<p>` and `<br>` tags it adds are intentional).

Card question text in the error log is stored on the element as `data-raw="${encodeURIComponent(question_text)}"` (URI-encoded, not base64). Decoded with `decodeURIComponent(el.dataset.raw)` before passing to `renderMath`.

### Question Data Shape

- MCQ: `answer_type: 'mcq'`, `correct_option` is `'A'|'B'|'C'|'D'`
- TITA: `answer_type: 'tita'`, `correct_value` is a string; `correct_option` is `null`
- Set questions: `question_type: 'set_question'`, linked via `set_id` → data joins to `sets` table via `_passage` and `_instruction` fields attached by `_attachPassage()`/`_attachPassageFromJoin()`
- Images: `has_image: true`, `image_url` must be prefixed with `BASE_URL` (defined at the top of `practice.js`)

### CSS Conventions

- CSS variables are defined in `:root` (dark theme) and overridden in `[data-theme="light"]`
- Primary accent color: `#5b7af5` (blue) — never use the old purple `#7c6af7`
- Fix Mode Phase 1 = red (`--fix-p1-color`), Phase 2 = blue (`--fix-p2-color`)
- Context-aware hiding uses CSS `:has()` selectors rather than JS class toggling where possible
- The `.hidden` class is the standard show/hide toggle throughout
- `position: fixed` elements (footer bar, FAB) use `left: var(--sidebar-w)` on desktop and `left: 0` at ≤768px breakpoint

**Mobile CSS gotcha:** `@media (max-width: N)` queries may silently fail on some Android Chrome installs (device/browser display-zoom quirk). For auth screen and other critical mobile styles, prefer base CSS rules with `clamp()` for fluid sizing, and use `@media (min-width: N)` for desktop-only overrides.

**Auth screen scroll:** `#auth-screen.active` uses `position: fixed; inset: 0; overflow-y: auto; -webkit-overflow-scrolling: touch`. Do not add `align-items: center` or `display: flex` to this rule — it breaks touch scrolling on Chrome mobile.

**Auth container centering:** `#auth-screen .auth-container` must have `margin: 0 auto` to center the 420px form on desktop. Without it the form left-aligns because the parent is `display: block`, not flex.

**Error log card truncation:** `.el-question` uses `-webkit-line-clamp: 3` to cap card height on mobile. The full question text is always available in `el.dataset.raw` (URI-encoded via `encodeURIComponent`) — never truncate the data-raw attribute.

**Flex scroll containers:** Any `display:flex; flex-direction:column` container with a fixed `height` will shrink its flex children to fit before scrolling. Always add `flex-shrink: 0` to cards/items that should maintain their natural height. `.el-item` has this set — preserve it.

### Service Worker (`sw.js`)

- Cache name is `catalyst-v4` — bump `CACHE_VERSION` when making breaking changes that need all clients to re-fetch
- **Network-first** for CSS and HTML (always fetches fresh, falls back to cache offline)
- **Cache-first** for JS and other static assets
- CSS does not need `?v=N` cache-busting since it's always network-first; JS files do need it
- Push handler: `push` event parses JSON payload `{ title, body, icon, url }` and calls `showNotification()`
- Click handler: `notificationclick` focuses an existing open window or opens a new one at `notification.data.url`

### Pages & Their Entry Points

| Page | JS entry | Notes |
|------|----------|-------|
| Dashboard | `Dashboard.refresh()` | Called on login and nav |
| Practice | `Practice.onPageEnter()` | Auto-loads questions after 120ms |
| Error Log | `ErrorLog.init()` / `ErrorLog.render()` | `init()` once, `render()` on filter change |
| Test | `Test.*` | Hidden in current MVP |
| Onboarding | `Onboarding.maybeStart(userId)` | Called in `onLogin()`, runs once per user |

### Modal & Toast Patterns

- `showLoading(msg)` / `hideLoading()` — full-screen spinner
- `showToast(msg, type)` — `type` is `'success'` or `'error'`
- Modals toggled via `.hidden` on `#modal-id`

### Trial & Payment System

- Trial duration: **3 days** (`TRIAL_DAYS = 3` in `db.js → getTrialStatus()`)
- Trial state stored in localStorage as `cat_trial` → `{ started_at, is_paid }`
- `DB.initTrial()` — called on signup; creates the trial record and fires `trial_started` event
- `DB.isPaid()` / `DB.markAsPaid()` — reads/writes `is_paid` flag locally only
- Payment is **manual**: user pays via UPI `7080442040@pthdfc`, sends WhatsApp screenshot to `+91 70804 42040`, Sahil activates
- To activate a paid user: run two SQL lines in Supabase — find UUID via `auth.users`, then insert a `payment_completed` event row (see `analytics-setup.sql`)

### Analytics System

- `DB.logEvent(eventName, userId, metadata)` — fire-and-forget, never blocks UI, no-ops if no Supabase client
- Events table schema: `id, event, user_id (nullable uuid), metadata (jsonb), created_at`
- Table + RLS policies created by running `analytics-setup.sql` in Supabase SQL Editor once
- Dashboard: `analytics.html` — standalone page, uses prod anon key, real-time via Supabase channel subscription. Keep URL private.
- **BUG: events are not logging** — inserts not firing despite `DB.logEvent()` being called. Fix before next outreach push.
- Events that should fire:

| Event | Where |
|---|---|
| `signup` | `auth.js → signup()` after successful auth |
| `trial_started` | `db.js → initTrial()` on first call |
| `fix_mode_started` | `practice.js → loadFixSession()` |
| `fix_mode_completed` | `practice.js → _showFixSessionComplete()` |
| `day7_return` | `auth.js → onLogin()` — fires once per user when elapsed ≥ 7 days; tracked by `cat_day7_fired_${userId}` in localStorage |
| `tour_completed` | `onboarding.js → complete()` — used to detect tour completion across Safari/PWA storage contexts on iOS |

### Auth System (`js/auth.js`)

The auth card (`#auth-card-collapsible`) is **always visible** on the landing page. The card has three panels, only one visible at a time via `.auth-form.active`:
- `#tab-login` — email/password login + Google OAuth button
- `#tab-signup` — email/password signup + Google OAuth button
- `#tab-forgot` — forgot password email input (no `.auth-tab` highlights this one)

**Forgot password flow:** `Auth.showForgotPassword()` → user enters email → `Auth.forgotPassword()` calls `sbClient.auth.resetPasswordForEmail()` with `redirectTo: 'https://catalyst-app-six.vercel.app/reset-password.html'` → inline success message shown. The `redirectTo` URL must be in Supabase's allowed redirect URLs list.

**Reset password page:** `reset-password.html` is a standalone page (not part of `index.html`). It initialises its own Supabase client using hardcoded prod credentials, detects the recovery token via `detectSessionInUrl: true`, and calls `sbClient.auth.updateUser({ password })` on submit.

**PASSWORD_RECOVERY intercept:** `app.js → onAuthStateChange` catches the `PASSWORD_RECOVERY` event and immediately redirects to `/reset-password.html` before the main app can auto-login the user with the recovery token.

**Google OAuth:** `Auth.loginWithGoogle()` calls `sbClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://catalyst-app-six.vercel.app' } })`. After redirect, the existing boot `getSession()` call picks up the session automatically. `DB.initTrial()` is called in `onLogin()` for all users (idempotent — safe to call on every login).

**Supabase dashboard settings that affect auth behaviour:**
- Site URL must be `https://catalyst-app-six.vercel.app` (not localhost) — controls OAuth redirect target
- Redirect URLs allowlist must include `https://catalyst-app-six.vercel.app/reset-password.html`
- Custom SMTP (Resend) requires a verified domain to send to arbitrary emails — currently disabled; falls back to Supabase's default (3 emails/hour limit)
- Email confirmation is currently OFF — users get instant access after signup

### Push Notification System

Supabase table: `push_subscriptions` — created by running `push-notifications-setup.sql` once in prod SQL Editor. Columns: `user_id, endpoint, p256dh, auth, last_notification_sent, last_notification_type, last_notification_index`.

**Frontend flow:** `Push.setup()` in `auth.js` runs 5s after login. Shows a soft banner (`#push-banner`) before the native browser prompt. On permission grant, calls `reg.pushManager.subscribe()` with the VAPID public key from `config.js` (`VAPID_PUBLIC_KEY`), then saves the subscription via `DB.savePushSubscription()`.

**Sender:** `api/send-push.js` — Vercel serverless function (CommonJS). Reads all subscriptions, fetches each user's pending mistake count, picks from 3 notification pools (static, dynamic with `{mistakes}/{days}/{day}` placeholders, zero-mistakes), enforces a minimum gap of `(24h / NOTIFICATIONS_PER_DAY) * 0.75` between sends, deletes expired subscriptions (410/404 responses). Notification copy tones: Guilt / Funny / Urgency.

**Scheduling:** Sends 4×/day at 8am, 1pm, 6pm, 9pm IST via cron-job.org. Vercel Cron triggers at 13:30 UTC (7pm IST) as fallback. To change frequency: update `NOTIFICATIONS_PER_DAY` in `api/send-push.js` and add/remove cron-job.org jobs.

**Deep link:** Notifications with pending mistakes set `url` to `https://catalyst-app-six.vercel.app/#fix`. `App._handleDeepLink()` in `app.js` detects this hash on boot and calls `Practice.loadFixSession()` after a 400ms delay.

**Env vars required (Vercel Production):** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. Values stored in `.env` locally (gitignored). Run `bash push-env-to-vercel.sh` to push all vars to Vercel at once.

### PWA Install Prompt

`PWAPrompt` object in `app.js`. Captures `beforeinstallprompt` (Android) on page load via `PWAPrompt.init()`. Never shows if already installed (`window.navigator.standalone` / `display-mode: standalone`) or on desktop.

- **After tour:** `Onboarding.complete()` calls `PWAPrompt.showAfterTour()` — fires 1s after tour ends
- **3-day fallback:** `Auth.onLogin()` calls `PWAPrompt.maybeShow()` 12s after login — checks `cat_pwa_prompt_last` in localStorage, skips if tour is active or last shown < 3 days ago
- **iOS:** Shows numbered steps (tap Share → Add to Home Screen). No native install API on iOS
- **Android:** Calls `deferredPrompt.prompt()` to trigger Chrome's native install sheet

### Landing Page (`landing.html`)

`landing.html` is a **standalone marketing page** — separate from the SPA (`index.html`). It has no Supabase connection, no auth, and no shared JS with the app. It is served at `/landing.html` as a static file (Vercel serves existing files before applying rewrites, so the SPA catch-all rewrite does not intercept it).

The landing page uses GSAP + ScrollTrigger for scroll-pinned animations, a CSS-only iPhone mockup with Dynamic Island, dark/light theme toggle (persisted via `localStorage`), testimonials section, and a marquee strip. It links to `https://catalyst-app-six.vercel.app/` for all CTAs. No cache-busting version strings needed — the service worker does not cache `landing.html`.

**Note on conversion:** High-touch 1:1 onboarding (WhatsApp DM → walk through app → answer questions) converted Oviya to ₹489. Product tour walkthrough in the landing page is less effective than a single concrete demo — one question → one insight → one fix. Future landing page iteration should lead with this demo flow.

### Social / OG

- OG image: `og-image.png` in repo root, served at `/og-image.png` (1200×630px)
- OG + Twitter Card meta tags in `index.html` `<head>` — absolute URLs pointing to `https://catalyst-app-six.vercel.app`

## Question Bank Status

Total: ~794 questions

| Section | Count | Notes |
|---|---|---|
| VARC — RC | 218 | 56 Easy, 94 Medium, 68 Hard |
| VARC — VA | 207 | 45 Easy, 113 Medium, 49 Hard |
| Quant — Arithmetic | 166 | 31 Easy, 72 Medium, 63 Hard |
| Quant — Algebra | 49 | 5 Easy, 34 Medium, 10 Hard |
| Quant — Geometry | 2 | Critically thin — needs expansion |
| Quant — Modern Math | 5 | Critically thin |
| Quant — Number System | 5 | Critically thin |
| LRDI — DI | 69 | 13 Easy, 53 Medium, 3 Hard — **images missing** |
| LRDI — LR | 53 | 13 Easy, 12 Medium, 28 Hard — some images missing |
| LRDI — LR Based DI | 21 | 0 Easy, 3 Medium, 18 Hard |

**Weakest area: Quant** — Geometry (2 questions), Modern Math (5), Number System (5) are nearly empty. This will hurt users filtering by these topics.

**Source:** Cracku free PDF resources. Copyright consideration at scale — shift toward PYQs + original/licensed questions as revenue grows.

### Max v2 Launch Bank Strategy

| Source | Count | Status |
|---|---|---|
| CAT PYQs 2015–2024 (official) | ~660 | To extract + tag |
| Existing CATalyst bank | ~794 | Live (Quant thin: 226) |
| **Launch total** | **~1,450 real questions** | Sufficient — do not delay launch for 3,000 |

- **PYQs are the trust killer-app** — "Practice on real CAT questions from the last 10 years" ends the question-quality objection permanently.
- **No AI-generated questions, ever** (locked decision). AI selects and sequences; humans authored.
- Tagging schema (every question): `year · subject · topic · subtopic · difficulty · question_type (MCQ/TITA/Set) · CAT-frequency-weight · trap_type`
- One-time PYQ trend analysis of 10 years of papers → topic frequency weights stored as data, used by daily DPP selection. This is pattern intelligence — **never claim prediction**.
- Growth path: 1,450 → 3,000+ over year one. Quant expansion first (Geometry/Number System are embarrassing — fix early).
- Tagging accuracy is a product-death risk: bad tags = random-feeling DPPs. Spot-check 10% manually; beta feedback loop.

## Product Roadmap

The roadmap is now defined by **CATalyst Max v2** (`CATalyst_Max_v2_Plan.md`). Max v1 (DPP PDF upload → Claude vision extraction) is **SCRAPPED** — coaching portals don't give PDFs; the premise was invalid.

### Pre-build (zero-cost, can start now)
1. Landing page: "CATalyst Max — Coming Soon" + waitlist email capture
2. Draft counselling interview script on paper
3. Identify PYQ source (clean 10-year papers + solutions)
4. Sketch roadmap weekly-view UI on paper
5. Fix analytics bug (events not logging) — still HIGH; we're blind on conversion data
6. Upload DI set images for ~50 affected sets — still HIGH

### Max v2 build (5–7 weeks solo — **starts only after first MVP Dev client**)

The product: counselling interview (chat UI, ~10 min, mentor tone) → User Profile → AI-generated weekly roadmap (every block has a *because*) → adaptive daily DPPs ("Today: 15 questions · ~40 min", zero decisions required) → Fix Mode after every session (unchanged) → weekly AI review every Sunday → day-7 upgrade wall to Max.

**Architecture principle: AI thinks once; logic repeats daily.** AI runs at onboarding (interview + profile), roadmap generation, and weekly adjustment only. Daily DPP selection is a weighted database query (roadmap priority × mistake history × difficulty adaptation) — near-zero recurring cost (~₹40 one-time + ~₹10/month per user).

Build order:
1. **Week 1–2:** PYQ extraction + tagging (660 Qs — the grind; gates everything, start first)
2. **Week 2–3:** Counselling chat UI + profile schema + roadmap generator (roadmap quality IS the product — budget 15–20 prompt iterations)
3. **Week 4:** Daily DPP engine (logic-based selection) + daily loop integration
4. **Week 5:** Tracker/streaks/graphs, weekly review generation, Razorpay (₹99 + ₹999 flows, credit logic), upgrade wall
5. **Week 6:** Beta onboarding (10 self-study aspirants, free Max, in exchange for tracked data + testimonials)
6. **Week 7:** Polish + public launch prep

New Supabase tables: `user_profiles` · `roadmaps` · `roadmap_weeks` · `daily_dpps` · `dpp_attempts` · `streaks` · `weekly_reviews` · `payments`

Total cash to launched product: < ₹8,000 (Claude API dev testing ₹2–4k, beta ₹1–1.5k, domain catalystedu.in ₹700/yr, Razorpay free/2%, Vercel + Supabase free tier).

Also planned: custom domain, accountability layer (batch completion %, Telegram group, streak leaderboard — mostly community ops, minimal code).

### The two quality risks code can't solve
1. **Roadmap pedagogical soundness** (FATAL if mediocre) — mitigate with Sahil's CAT knowledge + beta pressure-testing every generated roadmap
2. **Tagging accuracy** — bad tags = random-feeling DPPs = product death; 10% manual spot-checks

### Locked decisions (do not relitigate)
1. Max v1 (PDF upload) scrapped. 2. ICP = self-study aspirants; coached users are bonus. 3. No AI-generated questions, ever. 4. AI thinks once, logic repeats daily. 5. ₹99 paid entry (credited), no free AI. 6. No ads until 20+ paying users + testimonials. 7. Launch bank = ~1,450 real questions. 8. Roadmap UI = weekly view, never a 190-day wall. 9. Build starts only after first MVP Dev client. 10. Fix Mode loop unchanged.

## Distribution Context

**ICP (locked, v2):** Self-study CAT aspirant. Serious about CAT 2026. No coaching (cost, distance, or choice). Currently cobbling together Rodha YouTube + free PDFs + random advice. Deepest pain: *"Am I doing this right? What should I do today?"* — anxiety, zero structure, zero feedback, isolation. **Secondary (bonus only):** under-coached aspirants (cheap recorded course, no guidance) and droppers re-attempting without re-paying. The old ICP (coached, mock-taking aspirants) is retired — they never stuck.

**Market sizing (honest):** ~3 lakh CAT takers/year, ~1–1.5 lakh self-studiers. Season-one realistic: 300–700 users. Strong bootstrap business, not a unicorn.

**Channel truth: this product's channel is NOT DMs.** The 100-DM experiment (→ 15–18 replies → 3 trials → 1 paid) proved DMs don't scale trust. v2 sells through content + founder presence where self-studiers gather, in priority order:
1. **Reddit r/CATprep** — "coaching or self-study?" asked daily; genuine long-form answers + founder story
2. **Quora** — same questions, evergreen, compounds for months
3. **Telegram self-study groups** — daily helpful presence, occasional proof drops
4. **YouTube comments** (Rodha, Bodhee, free-content videos) — the literal gathering place of the ICP
5. **Instagram @catalyst page** — NOT acquisition; the credibility check. 15–20 proof posts, 2/week. An empty page kills conversions.

**Hard rules:** No paid ads until 20+ paying users + testimonials + known funnel conversion. Founder-as-face is text-first, not video-first. The proof engine is the beta: 10 self-study aspirants on free Max → real improvement graphs after 6–8 weeks — those artifacts ARE the marketing.

**Timing:** June–September is the coaching-decision window. Beta by August + Siddhant's CAT Unfiltered opening in August = launch into peak demand.

**Distribution is the entire risk. The product stopped being the bottleneck weeks ago.**

## Deploy Discipline

**Always test locally before deploying to prod.** The app has a dev/prod Supabase split — localhost automatically uses the dev database, so local testing never touches real user data or analytics.

```bash
npx serve .   # serves on localhost:3000 → uses dev Supabase
```

Only run `vercel --prod` after confirming the feature works locally.

**Cache busting:** JS files are loaded with `?v=N` query strings (e.g. `js/practice.js?v=2`). Increment `N` across all script tags in `index.html` whenever deploying a breaking JS change — this forces browsers to fetch fresh files instead of serving a stale cached version.

## Key Files

- `Plan/Product.md` — Core product philosophy; read before making UX decisions
- `Plan/Growth_Plan.md` — Screen-by-screen copy targets and psychology goals per screen
- `js/config.js` — Feature flags, Supabase credentials (dev + prod), `CAT_TAXONOMY`
- `js/db.js` — Single source of truth for all data shapes, storage keys, and `logEvent()`
- `analytics.html` — Internal analytics dashboard (not linked from the app)
- `analytics-setup.sql` — Run once in Supabase to create `events` table + RLS policies
- `reset-password.html` — Standalone password reset page; has its own Supabase client init with hardcoded prod credentials
- `vercel.json` — Cron for push notifications + catch-all rewrite (`"/((?!api/).*)" → "/index.html"`) so Vercel serves the SPA for all non-API routes. Static files like `landing.html` and `reset-password.html` are served directly by Vercel before the rewrite is checked.
- `api/send-push.js` — Vercel serverless function (CommonJS) that sends push notifications. Called by Vercel Cron and by cron-job.org (4×/day). Requires env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
- `push-notifications-setup.sql` — Run once in prod Supabase SQL Editor to create `push_subscriptions` table + RLS policies
- `migrate-to-prod.js` — Copies questions + sets from dev Supabase → prod via UPSERT (safe to re-run). Requires service-role keys passed as env vars: `DEV_SERVICE_KEY=xxx PROD_SERVICE_KEY=yyy node migrate-to-prod.js`
- `CATalyst_Max_v2_Plan.md` — **The current product plan.** Full spec for the Max v2 pivot (coaching replacement for self-studiers): problem evidence, product journey, question bank strategy, build plan, costs, pricing, marketing, locked decisions. Read before any product or roadmap decision.
- `CATalyst_Max_Update.md` — SUPERSEDED. Max v1 (DPP PDF upload) plan — scrapped; kept for historical context only
- `CATalyst Design System/` — Design tokens, component previews, and UI kit reference (standalone HTML previews, no build required)
