# CATalyst Design System

A focused, dark-by-default visual system for **CATalyst** — a mistake-correction product for CAT (Common Admission Test) aspirants in India.

## What CATalyst is

CATalyst is **not** another practice platform. It is built around a single emotional loop:

> **Solve → Get wrong → Tag the mistake → Fix it → Strengthen → Track patterns**

Where every other prep app shows you what you got right, CATalyst confronts you with what you got wrong. The product forces users to:

1. **See** their mistakes (red, prominent, uncomfortable)
2. **Classify** them — Concept gap, Calculation error, Misread, or Guess
3. **Re-solve** them through a structured **Fix Mode**
4. **Strengthen** the underlying skill with fresh questions
5. **Track** repeated mistake patterns over time

The UI is intentionally dark, focused, and emotionally driven. Color does the talking: **red for pain, blue for action, green for correction, amber for warning**.

## Sources used to build this system

This system was built by examining a deployed instance of the product:

- **Live app:** `catalyst-app-six.vercel.app`
- **Screenshots:** 11 captures across desktop dashboard, desktop practice flow, mobile dashboard, and mobile practice flow — in both dark and light themes.
- **Original design brief** included with the assets.
- **No codebase or Figma file** was provided — the recreations in `ui_kits/` are based on screenshot analysis. **High-fidelity verification against the source code is recommended.**

The original screenshots are preserved in `assets/screens/` for reference.

## Products represented

There is **one product**, available as both:

- **Mobile web** (primary surface — iPhone 12 Pro captures)
- **Desktop web** (sidebar layout)

Both share the exact same design language; the desktop view adds a persistent left sidebar with navigation (Dashboard / Practice / My Error Log) and a footer block (mistakes counter, Upgrade to Pro, trial timer, today's-goal progress, user chip).

---

## Content Fundamentals

CATalyst's copy is the product's emotional engine. It is **direct, second-person, and slightly aggressive** — the app is supposed to make you uncomfortable so you fix your gaps.

### Voice
- **Second person, always.** "*You* still have 26 mistakes to fix." "*You* got this wrong." Never "I" or institutional "we" except in `Fix Mode` ("We make sure you don't repeat").
- **Confrontational, not punishing.** It calls out problems but always pairs them with an action: *"This is costing you marks."* / *"Cost: ~10–15 marks — fix this = +8–12 marks."*
- **Calm during correction.** Once a user is in Fix Mode or sees a correct answer, the copy softens: *"Fix session loaded! Let's go 💪"* / *"Mistakes fixed."*

### Casing
- **Sentence case** for body, buttons, and section labels in the prose ("Fix Now →", "Start Practicing →", "Today's Goal").
- **UPPERCASE** for badge-like meta labels ("VARC", "VA", "MEDIUM", "TOP WEAK TOPICS", "TODAY'S GOAL", "PENDING", "FIXED", "TOTAL LOGGED").
- **Title Case** for headings like "Dashboard", "Fix Mode ON".

### Tone moments — verbatim examples
| State | Copy |
|---|---|
| Dashboard greeting | "Good morning, Sahil Solankey! Keep pushing 💪" |
| Hero confront | "You still have **26 mistakes** to fix" |
| Hero detail | "12 are Concept Gap — the most damaging type" |
| Wrong-answer headline | "You got this wrong!" |
| Wrong-answer detail | "This is costing you marks." |
| Mistake-tag prompt | "Why did this happen?" with chips: 🧠 Concept · 🔢 Calculation · 👁 Misread · 🎲 Guess |
| Skip tag link | "Skip (save as Unclassified)" |
| Error-log title | "You are still making these mistakes." |
| Error-log subtitle | "Every mistake tracked. Fix them before the exam does." |
| Error-log footer | "26 mistakes still unresolved. Don't let them repeat." |
| Fix-mode intro headline | "Fix Mode ON" |
| Fix-mode intro promise | "We'll show your wrong answers · You solve them again · We make sure you don't repeat" |
| Fix-mode banner | "⚡ Fix Mode — fixing your past mistakes · 1/25" |
| Above-question note | "⚠ You got this wrong before" |
| Success bridge | "✓ Mistakes fixed. **But you're still weak in VA.** Let's strengthen it now — 2 more minutes." |
| Strengthening banner | "⚡ Strengthening: VA — new questions to build the skill · 1/5" |
| Toast on session load | "Fix session loaded! Let's go 💪" |

### Punctuation & marks
- The **em dash** (—) is the workhorse rhythm marker. Used between cause/effect, idea/elaboration, and short call-and-response phrases.
- The **arrow** (→) terminates almost every button label ("Fix Now →", "Next →", "Continue →", "Start Practicing →", "Let's Fix →", "Fix this now →"). Establishes forward motion.
- The **middle dot** (·) separates meta in chips and breadcrumbs ("VARC · VA · 24 May", "Fix Mode · 1/25").
- **Numbers are inlined**, not spelled out — "26 mistakes", "1/5", "+8–12 marks". Numerals carry the emotional weight; they want to be loud.

### Emoji usage
**Yes — emoji is core to this brand.** Native OS emoji is used as semantic iconography:

- **💪** — encouragement, "keep pushing", session loaded
- **🔥** — urgent hero ("You still have 26 mistakes to fix")
- **🎯** — questions attempted / accuracy targets
- **✅** — correct, overall-accuracy stat, sub-goal checked
- **⚠️ / ⚠** — warning, weak areas, "wrong before"
- **⚡** — Fix Mode banner, Upgrade to Pro CTA, trial badge
- **📖 📊 📐 ✍️** — section icons (VARC·RC, LRDI, Quant, VARC·VA)
- **🧠 🔢 👁 🎲** — mistake type tags (Concept, Calculation, Misread, Guess)
- **💡** — "Show Hint", "Show Solution"

Emoji are inline with text at the same size — they replace dedicated iconography. Do not substitute SVG glyphs for them when designing in this system.

### Vibe
Think **gym coach who knows your weak lifts and won't let you skip leg day.** Caring, but blunt. The product never apologizes for being uncomfortable.

---

## Visual Foundations

### Color
The full token list is in [`colors_and_type.css`](./colors_and_type.css). At a glance:

**Semantic / emotional palette** — used for *meaning*, never decoration:
- `--cat-red` `#F44C60` — mistakes, wrong answers, urgent CTAs ("Fix Now"), pending counters, mistake-type tags when active. (Sampled from the live app; the brief's `#FF4D4D` is a close approximation but the product uses this slightly pinker shade.)
- `--cat-blue` `#5B6CFF` — primary actions, "Next →" buttons, brand wordmark, progress bars, links, selected nav, action chips
- `--cat-green` `#22C55E` — correct answers, "Fixed" counter, success toasts, completed sub-goals
- `--cat-amber` `#F59E0B` — lightning bolt logo, weak topics, "MEDIUM" difficulty, hint button, trial-time-left badge

Each accent has three variants: solid (`--cat-red`), soft hover (`--cat-red-soft`), background wash (`--cat-red-bg` at ~10–12% opacity), and border tint (`--cat-red-border` at ~35–40%).

**Surface scale (dark, default):**
- `--bg-0` `#07070C` — page background
- `--bg-1` `#0E0E16` — base surface
- `--bg-2` `#15151F` — card
- `--bg-3` `#1C1C28` — elevated / hover

A `[data-theme="light"]` selector flips the surface stack to near-white while keeping accent colors identical. The accents are tuned to read well on both backgrounds.

### Typography
- **Display:** Bricolage Grotesque, 800, italic-leaning headlines. Used for the emotional hero text ("You still have 26 mistakes to fix", "You got this wrong!") at 40–56px. Slight negative tracking for impact.
- **Body / UI:** Plus Jakarta Sans 400/500/600/700 — a clean, slightly humanist grotesque that pairs well with the chunkier display family.
- **Mono:** JetBrains Mono 500 — used for question counters ("Q 1 / 25"), timers ("0:29"), and any tabular numerics.

> ⚠️ **Font substitution flag.** The original product appears to use a custom/unknown display face. Bricolage Grotesque is a close match in feel (heavy italic display, slightly geometric) but is **a substitution**. If you have the real font file, drop it into `fonts/` and update `colors_and_type.css`.

### Backgrounds
Flat. **No gradients on backgrounds, no imagery, no patterns.** The product earns its visual weight from typography scale, semantic color, and well-placed glow shadows — not decoration. The single exception is the subtle **glow halo** behind important CTAs ("Fix Now", "Start Practicing"), which reads as colored backlight rather than a gradient fill.

### Borders & cards
- All cards use **1px borders** in `--line-2` (10% white on dark) — never heavy borders.
- Active / state cards swap to a **1.5px colored border** + a matching `--cat-*-bg` wash. Example: selected nav item = blue border + 12% blue wash; wrong-answer option = red border + 10% red wash + red glow.
- **Corner radii** lean generous: `12–14px` for buttons, `14–16px` for cards, `20–24px` for hero blocks, `999px` (pill) for filter chips and tags.

### Shadows
Two systems, never mixed on the same element:

1. **Elevation shadows** (subtle, black) — `--shadow-sm/md/lg`. For card lift on hover, modal sheets.
2. **Glow shadows** (colored, larger) — `--glow-red/blue/green`. For primary CTAs that need emotional amplification. The "Fix Now" button has a red halo; "Start Practicing" has a blue halo.

### Animation & easing
- **Fast and minimal.** Most state transitions are `120ms` (fast) or `180ms` (base). The longest transition is `320ms` (slow, used for the shake animation).
- Three easings: `--ease-out` (most), `--ease-in-out` (hovers), `--ease-spring` (success pulses).
- **Wrong answer:** `cat-shake` keyframe — horizontal shake with red highlight. Distinct, brief, uncomfortable.
- **Correct answer:** `cat-correct-pulse` — green box-shadow ring expanding outward, then fading.
- **Auto-progression preferred.** After correct answers, the UI advances on its own with a short delay rather than waiting for a tap. Reduces friction.

### Hover & press states
- **Hover:** opacity-shift on links/text (`opacity: 0.85`); on buttons, swap to the soft variant (`--cat-blue` → `--cat-blue-soft`) + intensified glow.
- **Press:** `transform: scale(0.98)` for `120ms` — fast, no bounce. The press feel is direct, not playful.
- **Selected nav:** filled background + 1.5px blue border + blue text. No hover state once selected.

### Transparency & blur
Used sparingly. The mobile keyboard / floating chat bubble use a subtle backdrop-filter blur. Cards do **not** use frosted glass — they're opaque on opaque, separated by border + slight surface delta.

### Layout
- **Desktop:** Fixed 280px sidebar on the left, fluid main column with `max-width: 1200px` and `padding: 24–32px`. The sidebar's footer block (mistakes-left, Upgrade, trial timer, goal, user) is bottom-anchored and never scrolls.
- **Mobile:** Single column, full-width cards with `16–20px` horizontal padding. Hamburger top-left, theme toggle top-right. The persistent floating chat bubble sits bottom-right.
- **Two-column grids** appear on desktop dashboard (stats + weak topics) and collapse to single-column on mobile.
- **Rhythm:** vertical spacing is consistent — `24px` between major sections, `12–16px` between related elements.

### Imagery vibe
There is no photography in the product. The only "imagery" is the lightning-bolt logo mark (warm amber gradient). The product reads as code-editor-meets-coaching-app: monospace timers, generous dark space, semantic color punches.

---

## Iconography

See [`assets/`](./assets/) for the assets used by this system. Iconography is split into three sources:

### 1. Emoji (primary)
**Native OS emoji is the dominant icon system in CATalyst.** This is unusual and is on-brand — emoji is warm, universal, and reduces the need for a custom icon library. Use it inline with text, at the same font-size as surrounding text.

Documented usages are in the **Content Fundamentals → Emoji usage** section above.

### 2. Lucide (substitution, flagged)
For UI affordances that *aren't* covered by emoji — bookmark, flag, edit/notes, alert-triangle, send arrow, hamburger menu, sun/moon theme toggle, chevron-right (in filters) — the product appears to use a thin-stroke line icon set. **We substitute [Lucide](https://lucide.dev/) icons** because they match the stroke weight and rounded-cap style. Lucide is loaded from CDN in the UI kits:

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

If you have the actual icon set the product uses, drop the SVGs into `assets/icons/` and we'll wire them up.

### 3. The lightning bolt mark
The only custom illustration in the system is the **CATalyst bolt** ([`assets/logo-bolt.svg`](./assets/logo-bolt.svg) — symbol only, [`assets/logo-lockup.svg`](./assets/logo-lockup.svg) — with wordmark). It's amber-gradient with an amber stroke. The wordmark next to it is **CATalyst** in display italic 800, in `--cat-blue`.

The bolt is the only place gradients are used in the system.

### 4. Unicode characters as icons
- **→** (right arrow) — ubiquitous on buttons
- **·** (middle dot) — separator in breadcrumbs
- **✓** (check) — checkmarks in feature lists, "Wrong"/"Correct" answer pills
- **✕** / **x** (cross) — wrong-answer indicator, "x Wrong" badge

These are written as Unicode in source rather than swapped for SVG, to match the product's monospace/textual feel.

---

## Index — files in this system

- **[`README.md`](./README.md)** — this file
- **[`SKILL.md`](./SKILL.md)** — Agent Skill manifest for cross-compat with Claude Code
- **[`colors_and_type.css`](./colors_and_type.css)** — all design tokens (colors, type, radii, spacing, shadows, motion, animations)
- **[`assets/`](./assets/)**
  - `logo-bolt.svg` — symbol-only logo
  - `logo-lockup.svg` — bolt + wordmark lockup
  - `screens/` — original product screenshots used as reference
- **[`preview/`](./preview/)** — Design System tab cards (one HTML file per token cluster)
- **[`ui_kits/catalyst-app/`](./ui_kits/catalyst-app/)** — interactive recreation of the CATalyst mobile + desktop app
  - `README.md` — kit overview
  - `index.html` — runnable click-through demo
  - `*.jsx` — modular React components (sidebar, hero card, question card, mistake-tag chips, dashboard tiles, etc.)

## Caveats

- **Fonts are substitutions** (Bricolage Grotesque, Plus Jakarta Sans, JetBrains Mono). Originals not provided.
- **Icons are substitutions** (Lucide) where emoji doesn't cover. Originals not provided.
- **Recreation is screenshot-based.** No codebase or Figma access was given. Specific pixel measurements, exact spacing, and component variants beyond what's visible in screenshots are inferred.
