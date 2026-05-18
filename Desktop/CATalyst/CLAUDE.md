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

Every user-specific localStorage key is namespaced as `cat_<key>_${userId}` to allow multi-user devices without conflicts. Global keys (theme, demo state) are not namespaced.

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

`DB.getErrorInsights(logs)` returns `{ mostCommonError, errorTypeCounts, topicCounts, sortedTopics, weakestTopic }`. Legacy error type keys (`silly`, `conceptual`, `time`) must always be mapped to canonical keys (`calculation`, `concept_gap`, `guess`) before cost/label lookups.

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

## Key Files

- `Plan/Product.md` — Core product philosophy; read before making UX decisions
- `js/config.js` — Feature flags, demo question bank, Supabase credentials
- `js/db.js` — Single source of truth for all data shapes and storage keys
