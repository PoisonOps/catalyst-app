---
name: catalyst-design
description: Use this skill to generate well-branded interfaces and assets for CATalyst, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

# CATalyst Design Skill

CATalyst is a **mistake-correction system for CAT exam aspirants** — built around the loop **Solve → Get wrong → Tag mistake → Fix it → Strengthen → Track patterns**. The UI is intentionally dark, focused, and emotionally driven.

## How to use this skill

1. **Read `README.md` first** — it documents content fundamentals, visual foundations, iconography, and the full project index.
2. **Inspect `colors_and_type.css`** — it contains every color, type, radius, spacing, shadow, and motion token in CSS custom properties. Use these tokens; do not invent new colors.
3. **Browse `preview/`** — small per-token HTML cards. Each one demonstrates one foundation or component in isolation.
4. **Reference `ui_kits/catalyst-app/`** — interactive recreation of the product with reusable JSX components (Sidebar, Dashboard, PracticeScreen, FixModeIntro, MistakesFixedBridge). Copy/adapt these for new screens.
5. **Use `assets/`** — `logo-bolt.svg`, `logo-lockup.svg`, and original product screenshots in `assets/screens/`. Copy these into the user's project; never link cross-project.

## Core design principles to follow

- **Emotional color usage.** Red = mistakes. Blue = actions. Green = correct. Amber = warning. Never decorative.
- **Confrontational copy.** "You still have X mistakes to fix." Second person, direct, action-paired.
- **Display-italic headlines** (Bricolage Grotesque 800 italic) for emotional moments. Body in Plus Jakarta Sans. Mono (JetBrains Mono) for timers and counters.
- **Emoji as iconography.** Native OS emoji is the primary icon system — don't substitute SVG glyphs.
- **Dark default**, with a `[data-theme="light"]` flip. Surface stack: `bg-0` page → `bg-1` base → `bg-2` card → `bg-3` elevated.
- **Glow shadows** only on primary CTAs ("Fix Now", "Next →"). Elevation shadows on cards.
- **Fast motion.** Most transitions 120–180ms. Wrong answer = shake. Correct = pulse + auto-advance.
- **Arrows on buttons** — every CTA ends with →.
- **Em dashes (—) and middle dots (·)** carry the prose rhythm.

## When asked to build something

- For **mocks / static designs**: copy needed tokens, fonts, and assets into the user's project; write static HTML using the design system.
- For **interactive prototypes**: copy components from `ui_kits/catalyst-app/` and re-use the state-machine pattern in `app.jsx`.
- For **production code**: lift the tokens from `colors_and_type.css` into the codebase's existing token system.

If the user invokes this skill without further guidance, ask what they want to build, then act as an expert designer producing HTML artifacts or production code depending on the need.

## Known caveats

- Fonts are Google Fonts substitutions; original product font is unknown.
- UI is screenshot-recreated; no codebase or Figma was provided.
- Mobile-specific chrome (hamburger nav, full-bleed mobile layout) is not in the UI kit — the kit demonstrates the richer desktop view.
