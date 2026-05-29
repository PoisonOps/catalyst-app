# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Product Is

CATalyst is a **mistake-fixing system** for CAT exam aspirants — not a practice app. The core loop is: Solve → Realize → Diagnose → Fix → Reinforce → Return. Every UI and data decision is driven by the "Mistake Pressure System": make mistakes visible, show the mark cost, force acknowledgment, push the user to fix immediately.

## Running the App

No build tools, no npm, no bundler. Open `index.html` directly in a browser or serve it with any static file server:

```bash
npx serve .          # or
python3 -m http.server 8080
```

There are no lint, test, or compile steps.

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

`Onboarding.maybeStart(userId)` is called from `App.init()` (first login) and the `else` branch of `onLogin()` (returning users). It runs once per user and walks through the full CATalyst loop: Practice → tag wrong answer → Error Log → Fix Mode P1 → P2.

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
- Payment is **manual**: user pays ₹489 via UPI, sends WhatsApp screenshot, Sahil activates
- To activate a paid user: run two SQL lines in Supabase — find UUID via `auth.users`, then insert a `payment_completed` event row (see `analytics-setup.sql`)

### Analytics System

- `DB.logEvent(eventName, userId, metadata)` — fire-and-forget, never blocks UI, no-ops if no Supabase client
- Events table schema: `id, event, user_id (nullable uuid), metadata (jsonb), created_at`
- Table + RLS policies created by running `analytics-setup.sql` in Supabase SQL Editor once
- Dashboard: `analytics.html` — standalone page, uses prod anon key, real-time via Supabase channel subscription. Keep URL private.
- Events fired automatically:

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

**Sender:** `api/send-push.js` — Vercel serverless function (CommonJS). Reads all subscriptions, fetches each user's pending mistake count, picks from 3 notification pools (static, dynamic with `{mistakes}/{days}/{day}` placeholders, zero-mistakes), enforces a minimum gap of `(24h / NOTIFICATIONS_PER_DAY) * 0.75` between sends, deletes expired subscriptions (410/404 responses).

**Scheduling:** Vercel Cron triggers once at 13:30 UTC (7pm IST) as a fallback. Primary schedule (4x/day) runs via cron-job.org hitting the same endpoint with `Authorization: Bearer $CRON_SECRET`. To change frequency: update `NOTIFICATIONS_PER_DAY` in `api/send-push.js` and add/remove cron-job.org jobs.

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

The landing page uses GSAP + ScrollTrigger for scroll-pinned animations, a CSS-only iPhone mockup with Dynamic Island, dark/light theme toggle (persisted via `localStorage`), and a marquee strip. It links to `https://catalyst-app-six.vercel.app/` for all CTAs. No cache-busting version strings needed — the service worker does not cache `landing.html`.

### Social / OG

- OG image: `og-image.png` in repo root, served at `/og-image.png` (1200×630px)
- OG + Twitter Card meta tags in `index.html` `<head>` — absolute URLs pointing to `https://catalyst-app-six.vercel.app`

## Deploy Discipline

**Always test locally before deploying to prod.** The app has a dev/prod Supabase split — localhost automatically uses the dev database, so local testing never touches real user data or analytics.

```bash
npx serve .   # serves on localhost:3000 → uses dev Supabase
```

Only run `vercel --prod` after confirming the feature works locally. Deploying untested changes to prod pollutes real analytics and affects real users.

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

## Current Business Context

- Builder: Sahil Solankey, CAT 2026 aspirant, solo founder
- Status: Live at `https://catalyst-app-six.vercel.app`, connected to prod Supabase
- Pricing: two plans — **₹99/month** or **₹489 one-time** (till CAT 2026). Both are founder's pricing, locked for first 20 users. UPI `7080442040@pthdfc` (tap-to-pay link + copy button in upgrade modal), activation via WhatsApp `+91 70804 42040`
- Question bank: 794 questions + 145 sets (Quant, LRDI, VARC) migrated from dev to prod Supabase
- Trial: 3 days free for all new signups
- Do NOT suggest new features until we have paying users
- Do NOT change the core Fix Mode loop — it is the product

## Current Priorities (in order)
1. Outreach to get first 10 users (CAT WhatsApp/Telegram groups, Reddit r/CATPrep)
2. Fix any production bugs reported by users
3. Set up proper UPI payment automation
4. Custom domain + Resend SMTP (so password reset emails don't go to spam)