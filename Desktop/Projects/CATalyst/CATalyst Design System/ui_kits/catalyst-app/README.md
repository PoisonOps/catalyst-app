# CATalyst UI Kit — App

Interactive recreation of the CATalyst app surface (desktop layout with persistent left sidebar). Built as a clickable prototype that walks through the full **mistake-correction loop**:

```
Dashboard → Practice → Wrong answer → Tag mistake → Fix Mode → Strengthening → Mistakes fixed → Dashboard
```

## What's in here

- `index.html` — entry point, mounts the React app
- `styles.css` — kit-local styles on top of `colors_and_type.css`
- `components.jsx` — shared primitives: Sidebar, AppShell, Button, Pill, IconBtn, ProgressBar
- `screens.jsx` — screen components: Dashboard, Practice, FixModeIntro, MistakesFixed
- `app.jsx` — top-level App + state machine that routes between screens

## Screens recreated

1. **Dashboard** — Hero mistakes-confront, stat tiles, Today's Goal sub-rows with progress bars, Top Weak Topics list.
2. **Practice** — Question with passage, multiple-choice options, toolbar (bookmark/flag/note/report + timer), filter chip, mode banner.
3. **Wrong-answer state** — Inline expansion under the practice question with display-italic "You got this wrong!" headline, your-answer + correct-answer rows, mistake-tagging chips.
4. **Fix Mode intro** — Centered card with bolt logo, promise list ("We'll show your wrong answers / You solve them again / We make sure you don't repeat"), Let's Fix CTA.
5. **Strengthening intro** — "But you're still weak in VA" bridge moment with green/red/blue emotional handoff.
6. **Mistakes fixed** — Success state confirming the loop closed.

All click-through. The "Next →" button advances the state machine. "End Practice" or completing the Strengthening loop returns to the dashboard with updated counters.

## What's intentionally simplified

- All questions are stubbed in `app.jsx` — no real CAT content engine.
- The trial-timer, light-mode toggle, and chat bubble are visible but don't function.
- Mobile responsive: works on narrow viewports but is optimised for desktop. The original product has a separate mobile layout (hamburger nav) — recreating both would double the kit; we recreate the desktop view since it has the richer chrome.

## Substitutions flagged

- Fonts via Google Fonts (Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono).
- Icons: native emoji (matches original) + Lucide for chrome icons.
