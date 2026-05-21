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
`config.js` → `auth.js` → `db.js` → `app.js` → `dashboard.js` → `practice.js` → `errorlog.js` → `test.js`

### Dual-Mode Data Layer (`js/db.js`)

All data operations go through `DB.*`. The same methods work in two modes, switched by `FLAGS.SUPABASE_SYNC` in `config.js`:
- **Demo / offline:** reads and writes to localStorage only
- **Supabase:** syncs to the backend, with localStorage as a fallback cache

Every user-specific localStorage key is namespaced as `cat_<key>_${userId}` to allow multi-user devices without conflicts. Global keys (theme, demo state) are not namespaced — the full list is in `DB._globalKeys`.

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

`onPageEnter()` auto-loads questions 120ms after navigating to Practice. This means `#practice-area` becomes visible almost immediately — any CSS rule hiding things based on `#practice-area:not(.hidden)` will fire before the user interacts.

### Error Log (`js/errorlog.js`)

State: `_activeTypeFilter` tracks card-click filtering separately from the dropdown value. Both must stay in sync. `saveState()`/`loadState()` depend on the hidden `<select>` element IDs (`el-subject-filter`, `el-type-filter`, `el-status-filter`) — do not remove those elements even though they're `display:none`.

`DB.getErrorInsights(logs)` returns `{ mostCommonError, errorTypeCounts, topicCounts, sortedTopics, weakestTopic }`. Legacy error type keys (`silly`, `conceptual`, `time`) must always be mapped to canonical keys (`calculation`, `concept_gap`, `guess`) before cost/label lookups. The canonical label and cost maps live at the top of `errorlog.js` (`EL_TYPE_LABELS`, `EL_COST_MAP`).

### Math Rendering & Text Formatting

KaTeX is loaded via CDN (`index.html`). Never set question content as raw `innerHTML` — always use `renderMath(el, rawText, isRC)` from `practice.js`. This function safely masks LaTeX delimiters (`$$...$$`, `\[...\]`, `\(...\)`) before applying line-break replacements, then restores them before calling KaTeX's auto-render. RC passages use `formatRC()` which splits on `/n/n/` for paragraph breaks and `/n/` for line breaks within paragraphs.

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

### Pages & Their Entry Points

| Page | JS entry | Notes |
|------|----------|-------|
| Dashboard | `Dashboard.refresh()` | Called on login and nav |
| Practice | `Practice.onPageEnter()` | Auto-loads questions after 120ms |
| Error Log | `ErrorLog.init()` / `ErrorLog.render()` | `init()` once, `render()` on filter change |
| Test | `Test.*` | Hidden in current MVP |

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
| `demo_started` | `auth.js → demoMode()` |
| `signup` | `auth.js → signup()` after successful auth |
| `trial_started` | `db.js → initTrial()` on first call |
| `fix_mode_started` | `practice.js → loadFixSession()` |
| `fix_mode_completed` | `practice.js → _showFixSessionComplete()` |
| `day7_return` | `auth.js → onLogin()` — fires once per user when elapsed ≥ 7 days; tracked by `cat_day7_fired_${userId}` in localStorage |

### Auth System (`js/auth.js`)

The auth card is **collapsed by default** on the landing page (`#auth-card-collapsible`) and toggled open by the "Login / Sign up" link. The card has three panels, only one visible at a time via `.auth-form.active`:
- `#tab-login` — email/password login + Google OAuth button
- `#tab-signup` — email/password signup + Google OAuth button
- `#tab-forgot` — forgot password email input (no `.auth-tab` highlights this one)

**Forgot password flow:** `Auth.showForgotPassword()` → user enters email → `Auth.forgotPassword()` calls `sbClient.auth.resetPasswordForEmail()` with `redirectTo: 'https://catalyst-app-six.vercel.app/reset-password.html'` → inline success message shown. The `redirectTo` URL must be in Supabase's allowed redirect URLs list.

**Reset password page:** `reset-password.html` is a standalone page (not part of `index.html`). It initialises its own Supabase client using hardcoded prod credentials, detects the recovery token via `detectSessionInUrl: true`, and calls `sbClient.auth.updateUser({ password })` on submit.

**PASSWORD_RECOVERY intercept:** `app.js → onAuthStateChange` catches the `PASSWORD_RECOVERY` event and immediately redirects to `/reset-password.html` before the main app can auto-login the user with the recovery token.

**Google OAuth:** `Auth.loginWithGoogle()` calls `sbClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://catalyst-app-six.vercel.app' } })`. After redirect, the existing boot `getSession()` call picks up the session automatically. `DB.initTrial()` is called in `onLogin()` for all non-demo users (idempotent — safe to call on every login).

**Supabase dashboard settings that affect auth behaviour:**
- Site URL must be `https://catalyst-app-six.vercel.app` (not localhost) — controls OAuth redirect target
- Redirect URLs allowlist must include `https://catalyst-app-six.vercel.app/reset-password.html`
- Custom SMTP (Resend) requires a verified domain to send to arbitrary emails — currently disabled; falls back to Supabase's default (3 emails/hour limit)
- Email confirmation is currently OFF — users get instant access after signup

### Social / OG

- OG image: `og-image.png` in repo root, served at `/og-image.png` (1200×630px)
- OG + Twitter Card meta tags in `index.html` `<head>` — absolute URLs pointing to `https://catalyst-app-six.vercel.app`

## Deploy Discipline

**Always test locally before deploying to prod.** The app has a dev/prod Supabase split — localhost automatically uses the dev database, so local testing never touches real user data or analytics.

```bash
npx serve .   # serves on localhost:3000 → uses dev Supabase
```

Only run `vercel --prod` after confirming the feature works locally. Deploying untested changes to prod pollutes real analytics and affects real users.

## Key Files

- `Plan/Product.md` — Core product philosophy; read before making UX decisions
- `Plan/Growth_Plan.md` — Screen-by-screen copy targets and psychology goals per screen
- `js/config.js` — Feature flags, demo question bank (`DEMO_QUESTIONS`, `DEMO_SETS`), Supabase credentials, `CAT_TAXONOMY`
- `js/db.js` — Single source of truth for all data shapes, storage keys, and `logEvent()`
- `analytics.html` — Internal analytics dashboard (not linked from the app)
- `analytics-setup.sql` — Run once in Supabase to create `events` table + RLS policies
- `reset-password.html` — Standalone password reset page; has its own Supabase client init with hardcoded prod credentials

## Current Business Context

- Builder: Sahil Solankey, CAT 2026 aspirant, solo founder
- Status: Live at `https://catalyst-app-six.vercel.app`, connected to prod Supabase
- Pricing: ₹489 one-time (till CAT 2026), UPI `7080442040@pthdfc`, activation via WhatsApp `+91 70804 42040`
- Question bank: 794 questions + 145 sets (Quant, LRDI, VARC) migrated from dev to prod Supabase
- Trial: 3 days free for all new signups
- Do NOT suggest new features until we have paying users
- Do NOT change the core Fix Mode loop — it is the product

## Current Priorities (in order)
1. Outreach to get first 10 users (CAT WhatsApp/Telegram groups, Reddit r/CATPrep)
2. Fix any production bugs reported by users
3. Set up proper UPI payment automation
4. Custom domain + Resend SMTP (so password reset emails don't go to spam)