# CATalyst ⚡

> A mistake-fixing system for CAT exam aspirants. Not a practice app — a system that makes errors visible and forces you to fix them.

**Live → [catalyst-app-six.vercel.app](https://catalyst-app-six.vercel.app)**  
**Trial → 3 days free · ₹489 one-time thereafter**

---

## The Problem

CAT aspirants do hundreds of practice questions but keep scoring the same marks. Not because they lack knowledge — because they keep making the *same mistakes* and never stop to fix them. They just do more practice.

CATalyst breaks that loop.

---

## The Fix Mode Loop

```
Solve → Get it wrong → Tag the error type
         (calculation error / concept gap / guess)
              ↓
         Error Log — see your pattern, see the mark cost
              ↓
         "Fix My Mistakes"
              ↓
    Phase 1 (red): Re-attempt your logged errors
              ↓
    Phase 2 (blue): Drill your weakest topic
              ↓
         Session complete — see exactly how many you fixed
```

This loop is the product. Everything else is infrastructure.

---

## Key Features

- **Fix Mode** — 2-phase session: re-attempt past errors → drill the weak topic
- **Error Tagging** — mark wrong answers as `calculation error`, `concept gap`, or `guess`
- **Error Log** — full filterable history of mistakes with mark cost shown per error
- **Mistake Pressure System** — makes errors visible and costly, psychologically
- **Daily Push Notifications** — "You have 12 unfixed mistakes. Fix them now." Deep-links to Fix Mode
- **PWA** — installable on home screen, works offline for reading
- **Onboarding Tour** — walks every new user through the full Fix Mode loop on first login
- **Trial + Payment** — 3-day free trial, ₹489 one-time, manual UPI activation

---

## Architecture

Single-file SPA — no framework, no bundler, no build step. Open `index.html` directly.

**Script load order** (critical — each file depends on the previous):
```
config.js → db.js → auth.js → dashboard.js → practice.js → test.js → errorlog.js → onboarding.js → app.js
```

**Data layer:** All reads/writes through `DB.*`. Supabase (Postgres + Auth) as source of truth, localStorage as namespaced cache (`cat_<key>_${userId}`).

**Supabase tables:** `questions`, `sets`, `attempt_logs`, `error_logs`, `reports`, `feedback`, `events`, `push_subscriptions`

**Practice.js** is the core. Key state:
| Variable | What it tracks |
|---|---|
| `_isFixSession` | true when launched from "Fix My Mistakes" |
| `_fixPhase` | `1` = re-attempt errors (red), `2` = drill topic (blue) |
| `_fixedInSession` | locked count of Phase 1 fixes before Phase 2 resets |
| `_sessionTimes` | cumulative — never reset between phases |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS SPA — no framework, no bundler |
| Auth | Supabase Auth — email/password + Google OAuth |
| Database | Supabase Postgres |
| Realtime cache | localStorage (per-user namespaced keys) |
| Push Notifications | Web Push API · Vercel Serverless sender · cron-job.org schedule |
| UI Animations | GSAP + ScrollTrigger |
| Math Rendering | KaTeX (auto-render) |
| PWA | Service Worker (`sw.js`) · network-first HTML/CSS, cache-first JS |
| Hosting | Vercel |

---

## Running Locally

No install. No build. Just serve the files:

```bash
npx serve .
# → localhost:3000, uses dev Supabase automatically (config.js detects hostname)
```

Dev and prod have separate Supabase databases. Local never touches real user data.

---

## Question Bank

794 questions + 145 sets across **Quant, LRDI, and VARC** — migrated to production Supabase via `migrate-to-prod.js`.

Questions follow the CAT taxonomy defined in `js/config.js → CAT_TAXONOMY`.

---

## Pricing

| Plan | Price |
|---|---|
| Monthly | ₹99/month |
| Lifetime | ₹489 one-time (till CAT 2026) |

Both are founder pricing, locked for the first 20 users. Payment via UPI, manual activation.

---

Built by [Sahil Solankey](https://sahilsolankey.vercel.app) · CAT 2026 aspirant, solo founder  
Questions or bugs → [WhatsApp](https://wa.me/917080442040)
