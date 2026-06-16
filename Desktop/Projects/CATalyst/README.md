<img src="https://raw.githubusercontent.com/PoisonOps/catalyst-app/main/assets/header.svg" width="100%" alt="CATalyst"/>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=16&duration=3000&pause=800&color=2E5BFF&center=true&vCenter=true&width=700&lines=Mistake-fixing+system+for+CAT+aspirants.;Not+a+practice+app+%E2%80%94+a+correction+engine.;Fix+Mode%3A+Phase+1+re-attempt+%2B+Phase+2+drill.;794+questions+%C2%B7+145+sets+%C2%B7+live+with+paying+users." alt="Typing"/>
</p>

<p align="center">
  <a href="https://catalyst-app-six.vercel.app"><img src="https://img.shields.io/badge/Live_App-catalyst--app--six.vercel.app-2E5BFF?style=flat-square&logoColor=white"/></a>
  <img src="https://img.shields.io/badge/Trial-7_days_free-4ADE80?style=flat-square"/>
  <img src="https://img.shields.io/badge/Price-%E2%82%B9489_one--time-E8820C?style=flat-square"/>
  <img src="https://img.shields.io/badge/Payments-Razorpay_Live-2B79C2?style=flat-square"/>
  <img src="https://img.shields.io/badge/Stack-Vanilla_JS_SPA-E9E5DC?style=flat-square"/>
  <img src="https://img.shields.io/badge/DB-Supabase_Postgres-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/>
</p>

---

## The Problem

CAT aspirants do hundreds of practice questions but keep scoring the same marks. Not because they lack knowledge — because they **repeat the same mistakes** and never stop to fix them.

Every other prep app optimises for the feeling of progress (questions done, topics covered). CATalyst optimises for the one thing that actually improves scores: **diagnosing and fixing your specific error patterns.**

---

## The Fix Mode Loop

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
          Solve a question                                    │
                    │                                         │
                    ▼                                         │
            Get it wrong                                      │
                    │                                         │
                    ▼                                         │
     Tag the error type (mandatory)                          │
     ├── calculation_error  (knew it, fumbled it)            │
     ├── concept_gap        (didn't understand it)           │
     └── guess              (had no idea)                    │
                    │                                         │
                    ▼                                         │
          Error Log — see the mark cost                       │
          per error type, per subject                         │
                    │                                         │
                    ▼                                         │
        "Fix My Mistakes" button                              │
                    │                                         │
          ┌─────────┴─────────┐                              │
          ▼                   ▼                              │
   Phase 1 (RED)        Phase 2 (BLUE)                       │
   Re-attempt your      Drill your                           │
   logged errors        weakest topic                        │
          │                   │                              │
          └─────────┬─────────┘                              │
                    ▼                                         │
          Session complete screen                             │
          (X mistakes fixed this session)                     │
                    │                                         │
                    └─────────────────────────────────────────┘
```

This loop is the product. Everything else is infrastructure.

---

## Architecture

**Single-file SPA** — no framework, no bundler, no build step. Open `index.html` in a browser.

**Script load order is critical** — each file depends on the previous:

```
config.js → db.js → auth.js → dashboard.js → practice.js
         → test.js → errorlog.js → onboarding.js → app.js
```

`app.js` is always last. It boots the app after all other modules are defined.

### Data flow

```
User action
    │
    ▼
DB.*  (all data ops go through here — never raw Supabase calls)
    │
    ├── Supabase Postgres  (source of truth)
    └── localStorage cache  (namespaced: cat_<key>_${userId})
              │
              └── Why namespaced? Multi-user devices.
                  cat_trial_abc123 ≠ cat_trial_xyz789
```

### Practice.js state machine

The most complex file. Key variables:

```javascript
_isFixSession   // true when launched from "Fix My Mistakes"
_fixPhase       // 1 = re-attempt errors (red UI), 2 = drill topic (blue UI)
_fixedInSession // locked copy of Phase 1 correct count
                // before Phase 2 resets _sessionCorrect
_sessionTimes   // NOT reset between phases — cumulative for session screen
```

Fix session flow:
```
loadFixSession()
    → Phase 1 questions (red UI)
    → _showFixTransition()  ← 2.5s auto-advance
    → _startPhase2() (blue UI)
    → _showFixSessionComplete()
```

### Push notification deep link

Notifications with pending mistakes set `url` to `/#fix`. On click:

```javascript
// app.js — _handleDeepLink()
if (window.location.hash === '#fix') {
  setTimeout(() => Practice.loadFixSession(), 400);
}
```

Sends the user straight into Fix Mode — no menu, no friction.

---

## Key Technical Decisions

**Why vanilla JS instead of React?**
Speed of iteration. No reconciliation, no virtual DOM, no build step. `App.navigate(page)` hides all `.page` divs and shows `#page-<name>`. That's the entire router. When a bug hits at 11pm, I'm reading one file, not tracing through 14 components.

**Why `sets!left` in the Supabase query?**
PostgREST defaults to INNER JOIN. Without `!left`, any question where `set_id IS NULL` is silently dropped. Spent 3 hours debugging missing questions before finding this. Now permanently documented.

**Why KaTeX instead of MathJax?**
KaTeX renders synchronously. MathJax is async and caused questions to flash unstyled before math rendered. Never set question content as raw `innerHTML` — always route through `renderMath(el, rawText, isRC)`.

**Why localStorage cache alongside Supabase?**
Perceived performance. The dashboard loads instantly from cache while Supabase fetches in the background. For a PWA on 3G, this matters.

**Why separate dev/prod Supabase instances?**
Analytics pollution. Every test session was showing up in real user analytics. Separate databases mean localhost never touches real data.

**Why iOS PWA needs Supabase for tour state?**
Safari and the installed PWA have separate `localStorage` on iOS. The onboarding tour completion flag is written to both localStorage AND Supabase `events` table — so it doesn't restart when a user switches from Safari to the PWA.

---

## Tech Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Vanilla JS SPA | No build step, fast iteration |
| Auth | Supabase Auth | Email + Google OAuth, session management |
| Database | Supabase Postgres | RLS policies, realtime capable |
| Cache | localStorage (namespaced) | Instant loads, multi-user safe |
| Math | KaTeX | Synchronous render, no flash |
| Push | Web Push + Vercel Function | Daily "fix your mistakes" nudge |
| PWA | Service Worker (cache-first JS) | Offline reading, installable |
| Cron | cron-job.org → Vercel Function | 4×/day push scheduling |
| Hosting | Vercel | Zero config, instant deploys |

---

## Supabase Tables

```sql
questions         — content, type (mcq/tita), subject, topic, set_id
sets              — passage/instruction for set questions
attempt_logs      — every attempt: user_id, question_id, is_correct, time_taken
error_logs        — wrong answers: user_id, question_id, error_type, is_fixed
events            — analytics: signup, fix_mode_started, tour_completed, etc.
push_subscriptions — endpoint, p256dh, auth per user
```

---

## Running Locally

```bash
git clone https://github.com/PoisonOps/catalyst-app.git
cd catalyst-app
npx serve .
# → localhost:3000 auto-uses dev Supabase (config.js detects hostname)
# No .env needed — dev credentials in js/config.js
```

---

## Payment Gateway

Live payments via **Razorpay** — UPI, cards, net banking.

Two plans:
| Plan | Price | Notes |
|---|---|---|
| One-time (Best Value) | ₹489 | Access till CAT 2026 — `₹81/month · ₹21/week` |
| Monthly | ₹99/month | Cancel anytime |

Both are founder's pricing for the first 20 users.

**Razorpay integration details:**
- `initiatePayment(source)` — single function handles both the upgrade modal and the paywall, deduplicates double-clicks with a `_paymentInFlight` guard
- `modal.ondismiss` callback resets the CTA button immediately when the user closes Razorpay without paying (prevents the "Opening payment…" stuck state)
- `prefill: { email }` pre-fills user's email from `Auth.currentUser.email`
- Brand logo: `icon-512-razorpay.png` (512×512 PNG, upscaled via `sips` from the original icon)

---

## Paywall & Upgrade Modal (v3)

The payment UI was rebuilt from scratch with conversion-focused design:

- **Hero**: Big red mistake count (`#ef4444`, 900-weight, `cdNumGlow` pulse) — user sees their own error count as the paywall hook
- **Slot machine**: 10 rotating comparisons (Netflix appears 4× most frequently) — shows ₹489 is less than everyday purchases, rotates every 2600ms using Web Animations API
- **Plan cards**: One-time (₹489) pre-selected; `:has()` selector dims the monthly card when one-time is selected
- **Progress bar**: `@keyframes upv3BarGrow` + CSS `--bar-pct` variable — animates fresh on every modal open
- **Urgency bar**: Live countdown to CAT 2026, slots remaining
- **Trust row**: Razorpay lock icon + 7-day refund link → `/refund-policy.html`

---

## Refund Policy

`/refund-policy.html` — standalone dark-themed page, linked from the payment modal.

Visible promise: **7-day refund guarantee** (prominent blue highlight at top).

Actual eligibility bar (all conditions required):
1. Request within 7 calendar days of purchase
2. Active usage on at least **5 separate calendar days** + **25 questions attempted** — multiple sessions on the same day don't qualify (session timestamps are logged per attempt)
3. Registered email to verify purchase
4. One refund per user
5. Monthly plan: only the most recent charge is refundable

---

## Question Bank

**794 questions + 145 sets** across Quant, LRDI, and VARC.

Migrated from dev to prod via `migrate-to-prod.js` (safe to re-run — UPSERT):
```bash
DEV_SERVICE_KEY=xxx PROD_SERVICE_KEY=yyy node migrate-to-prod.js
```

---

## Honest Retrospective

> I should have shipped with 50 questions, not 794. The Fix Mode loop was right from day one. I spent too long building content when I should have been validating the loop with real users. The push notification system was built before I had 10 users. Classic premature scaling. The lesson: ship the core loop first, everything else second.

---

<p align="center">
  Built by <a href="https://sahilsolankey.vercel.app">Sahil Solankey</a> · CAT 2026 aspirant · solo founder<br/>
  <a href="https://wa.me/917080442040">WhatsApp</a> · <a href="mailto:sahilsolankey1009@gmail.com">Email</a>
</p>
