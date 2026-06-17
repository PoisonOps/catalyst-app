# CLAUDE.md — CATalyst Max (Interview + Synthesis + Roadmap)

Context for any Claude session working on **CATalyst Max** — the coaching-replacement
layer. This doc tracks the build, the founder's test feedback, the drawbacks found, and
the validation discipline so we **never regress** (the recurring failure mode: fixing one
thing while silently dropping another). Read this before touching the Max prompts.

> Strategy/spec lives in `../CATalyst_Max_v2_Plan.md`. Detailed plans: `INTERVIEW_PLAN.md`,
> `ROADMAP_PLAN.md`. This file is the **living build + test log**.

---

## 1. What's built (validation prototype, free, value-first)

A public, no-signup web app that runs the **counselling interview → synthesis → sample
roadmap** — the "magic moment" of Max. It's the cheap validation of the whole pivot:
if a real aspirant goes *"this is exactly me, and I can see myself doing this,"* the thesis
holds and we build the real engine (DPP selection, daily loop, payments).

- **Live:** https://catalyst-app-six.vercel.app/interview  (clean URL; also `/interview.html`)
- **Roadmap tester (dev):** https://catalyst-app-six.vercel.app/interview?test — skips the
  interview, generates just the roadmap from an editable transcript. Fast iteration.

---

## 2. Architecture

```
browser (interview.html)  ──POST /api/interview-chat──►  Vercel function
   (no keys in client)                                    (holds keys server-side)
                                                           Gemini 2.5 Flash (primary)
                                                            └─retry 3x on 503/429─► Groq (fallback)
```

- **`/interview.html`** (project root, served like landing.html) — the whole app: welcome →
  LLM-driven chat → synthesis reveal → roadmap. Calls the proxy; **no API keys in the client**.
- **`/api/interview-chat.js`** — serverless proxy. Holds keys in Vercel **env vars**
  (`GEMINI_API_KEY`, `GROQ_API_KEY`). Gemini 2.5 Flash primary (thinkingBudget:0 for speed),
  3× retry on 503/429, Groq (`llama-3.3-70b-versatile`) fallback. Accepts `{system, messages, json}`;
  `json:true` → Gemini responseMimeType / Groq json_object.
- **Models:** `gemini-2.5-flash` works on the **free AI Studio** tier (NOT `gemini-2.0-flash`
  — that returns free-tier limit:0 for this India account). Groq is the always-free fallback.
- **Keys:** set via `vercel env add GEMINI_API_KEY production` etc. **Rotate after testing**
  (they were pasted in chat during setup). Never hardcode/commit keys.

---

## 3. Files

| File | Role |
|---|---|
| `../interview.html` | **THE app** (root). Contains all 4 prompts inline + the UI + engine. |
| `../api/interview-chat.js` | Secure proxy (keys server-side, retry + Groq fallback). |
| `interview_sim.py` | **Test harness** — auto-runs full interviews (LLM role-plays personas) + roadmap, for stress-testing. `python3 interview_sim.py [persona]`. |
| `INTERVIEW_PLAN.md` | The detailed interview spec (psychology, agenda, edge-case matrix). |
| `ROADMAP_PLAN.md` | The detailed roadmap spec (diagnosis, DPP-engine ideas, scope). |
| `interview.html` (this folder) | OLD local-dev copy (client-side keys). Superseded by root version; keep for reference only. |

---

## 4. The 4 prompts (all inline in `../interview.html`)

1. **`CONVO_SYSTEM`** — conducts the interview. Outputs per-turn JSON: `{ack, q, options,
   invite, learned, chapter, done}`. Warm human acks, mandatory coverage checklist, edge-case
   attunement, normalize. (See §6 for what it must never drop.)
2. **`PROFILE_PROMPT`** — on `done`, extracts a **structured profile JSON** from the transcript.
   This grounds the roadmap (build from data, not raw chat). Schema below.
3. **`SYNTHESIS_PROMPT`** — the "what I see in you" reflection paragraph (the emotional reveal).
4. **`ROADMAP_PROMPT`** — builds the visual roadmap JSON from **profile + transcript**.

**Flow:** chat loop (CONVO) → done → extract PROFILE → SYNTHESIS reveal → "show me my plan" →
ROADMAP (profile prepended) → rendered visual report.

### Structured profile schema (PROFILE_PROMPT output)
```
{ life_stage, situation_detail, hours_per_day, days_per_week, months_left, busy_windows,
  resources:{mode, materials[]},
  mocks:{taken, overall, quant, varc, lrdi, story},
  quant:{strong[], weak[]}, varc:{weak_in, failure_mode}, lrdi:{stronger, weak_types},
  target, why, motivation, obstacle, consistency_pattern, confidence,
  flags[], language }
```

---

## 5. Roadmap render structure (`renderRoadmap` in interview.html)

JSON → visual: gauge (target), scope (current→gap→trajectory), diagnosis card, **strategy**
line, **expandable phase accordions** (goal/sections/outcome — syllabus path), **expandable day
accordions** (Mon open; each day = learn/practice/fix blocks with what+time+source+why), a
"how CATalyst runs this" card, a "bad day" consistency line, CTA. `asText()` coerces any
object/array field to text (guards the old `[object Object]` bug). All fields must be strings.

---

## 6. LOCKED REQUIREMENTS — never regress these (cumulative from ALL founder feedback)

**Interview MUST:**
- Cover EVERY checklist item — situation, **daily reality**, **hours/day + days/week**,
  **resources/coaching (always ask)**, **mock score + the STORY**, **Quant/VARC/LRDI each at
  TOPIC level**, why, obstacles, fears, self-belief. Never drop one when adding another.
- Warm HUMAN acks (real reflections, not clipped 3-word tags) — fixes "robotic".
- Probe deep enough to actually understand (follow up on vague answers); ~14–18 exchanges.
- Offer options AND always invite free typing ("say it however you want"); `invite:true` on
  deep questions.
- Adapt to edge cases (burnout, anxious, restarter, Hinglish, coached, late starter, painful
  re-attempt); normalize, never shame; self-belief as a feeling not yes/no.
- Mirror Hinglish; everything skippable.

**Roadmap MUST:**
- Be built from the **structured profile** → specific, not generic.
- Cover ALL three sections at topic level; target their SPECIFIC weak topics (not "Quant
  basics" for an Arithmetic-strong scorer).
- Fill their actual hours with a real mix of **learn (what to watch/read) + practice (DPP) +
  fix + reading** — never one tiny "do 15 Qs".
- Show the **syllabus-completion path** in phases (how the whole syllabus gets done).
- Weave CATalyst into the day (DPP / Fix Mode / real CAT RC) — not a generic banner.
- No `[object Object]`, no raw markdown leaks. Respect their real level. Be honest about hard
  targets. Give the "that's exactly what I was looking for" feeling.

---

## 7. Feedback & iteration log (chronological — preserve this)

- **Round 1 (UI):** "just a chat box, boring, long unreadable messages, no options." → premium
  redesign (Inter/Sora, highlighted question split from ack, tap-chips), short messages.
- **Round 2 (premium):** "make it more than a chatbot, take inspiration from high-end products."
  → progress rail + chapters, **living profile tags**, **analyzing orb** anticipation moment,
  synthesis as designed reveal, roadmap as visual report (gauge, staggered).
- **Round 3 (roadmap 2/10):** "hollow — do 10 Qs, dead phase labels, doesn't fill my hours,
  no learning, big ad doesn't explain how CATalyst helps, `[object Object]`." → full daily
  schedules (learn+practice+fix), expandable phases, real resources, CATalyst woven in, smaller
  CTA, asText() fix.
- **Round 4 (universal):** "don't tune to MY profile — must be 10/10 for everyone." → 13
  universal adaptive rules (time-scale, runway-scale, level-aware, failure-mode, coached-vs-
  self-study, etc.). Verified adapts: 1-hr working pro vs beginner.
- **Round 5 (depth):** "interview shallow — never asked Quant sub-topics, skipped LRDI entirely,
  never got mock score; roadmap all-VARC." → deepened agenda (topic-level all 3 sections + mock
  score); roadmap rule 14 (all sections, syllabus path).
- **Round 6 (regression + robotic):** "it DROPPED hours/coaching/resources this time — we keep
  rebuilding, lose what we fixed (a,b,c,d → b,c,e,f). Robotic and shallow. Give options but
  always let me type. Be a serious product person: test yourself, find 10-15 drawbacks per test,
  then write the final master prompt, validate, repeat." → built sim harness; comprehensive
  master prompt (mandatory checklist = anti-regression, warm acks, invite, edge cases, normalize,
  self-belief feeling, mock story); **structured profile extraction**.

---

## 8. Drawbacks cataloged (round 6) → all addressed in current prompt
Robotic clipped acks · inconsistent coverage (skipped coaching/resources/daily-reality) ·
didn't explicitly ask hours/day · no "walk me through your day" · mock number not story ·
shallow failure probing · options without invite-to-type · self-belief flat yes/no · no
emotional attunement · no structured profile · edge cases not explicit · no normalize.

---

## 9. Validation status (be honest)

- ✅ **Structured profile extraction** — validated, faithful & complete.
- ✅ Roadmap (earlier): all sections topic-level, no `[object Object]`, no markdown, phases show
  syllabus path, time-scaling works.
- ⏳ **Warm acks, full checklist coverage, roadmap-from-profile** — written but NOT yet
  live-validated (Gemini free **daily quota exhausted** from heavy testing). The proxy still
  serves single human-paced users via **Groq fallback**; only the rapid automated sim is blocked.

**Honesty note:** the round-6 master prompt was written from **1 full automated transcript +
1 partial + ~3 founder manual transcripts + all feedback** — NOT the "6 deep tests, 10-15
drawbacks each" originally framed. It is **under-validated**. Close it out properly:

### The validation discipline (do this when Gemini quota resets)
1. `python3 max-lab/interview_sim.py` — run all 6 personas (working_1hr, dropper, fresher,
   coached, high_scorer, anxious_hinglish), throttled (4s) to dodge rate limits.
2. Read transcripts; catalog 10-15 concrete drawbacks PER persona (coverage gaps, robotic
   moments, shallow probes, roadmap generic-ness, markdown issues).
3. Revise the master prompt **additively** (check §6 — never drop a locked requirement).
4. Re-run to confirm no regression. Repeat until it holds across all personas.

---

## 10. Reliability
- Gemini 2.5 Flash primary, 3× retry on 503/429, Groq fallback (verified: both plain + JSON
  mode work). Client also retries. A busy server never breaks a live interview.
- Free-tier limits: Gemini per-minute ~10-15 RPM + a daily cap; Groq higher. Single human-paced
  user is fine; rapid automated bursts hit caps. For real volume/scale → paid tier (revenue-funded).

---

## 11. Open / next (per CATalyst_Max_v2_Plan.md, after the magic moment validates)
Persist the profile to `user_profiles` (Supabase) · daily DPP engine (needs the question bank —
parallel extraction track) · weekly review · ₹99 wall + ₹999 upgrade (Razorpay) · beta cohort.
**Gate:** don't build downstream until a real aspirant is visibly moved by synthesis + roadmap.
