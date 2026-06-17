# CATalyst Max — The Interview: Master Plan

The Interview is the single most important screen in Max. It is the magic moment, the
trust transaction, and the data source for the entire Roadmap. This document plans it
as the **real, shipping** experience — built to handle any human, any story, any edge.

> Status: PLAN (pre-build). Decisions to lock with Sahil are in §13.

---

## 1. What this really is (not a form, not a quiz)

It is **the first time anyone has asked this aspirant about their CAT journey and actually
cared.** For a self-studier, that has literally never happened. Coaching processes them as
a batch number; the internet shouts generic advice; family adds pressure. Nobody has sat
down and asked *"what is this actually like for you?"*

So the interview is a **trust transaction**: they give us their real self, we give them
(a) the felt experience of being understood, and (b) a plan that fits their actual life.

The deepest principle: **value must be delivered DURING the interview, not just at the end.**
Being heard is itself the product. They should finish lighter, clearer, and feeling someone
is finally *in this with them* — before they ever see the roadmap. That feeling is what
converts.

---

## 2. The architecture decision: LLM-driven, not scripted

A fixed question list cannot:
- respond to *"my mom is sick and I'm her only support"* with the right human weight,
- draw out a one-word *"idk"* into something real,
- follow the emotional thread when someone suddenly opens up,
- mirror Hinglish, or match a joker's energy then gently return,
- skip what's already been answered, or probe what was dodged.

Therapy = reflection + following the client + holding space. **Only an LLM can do that live.**

**So the Interview is a guided LLM conversation:**
- A **master system prompt** makes the model *be* the mentor — persona, tone, psychology
  rules, the agenda it must cover, edge-case handling, and the structured profile it must
  quietly collect.
- It runs a real back-and-forth, adapting to every answer.
- It decides when each "act" is sufficiently covered and moves on naturally.
- At the end it emits two things: the **structured profile** (JSON, for the roadmap) and the
  **synthesis** (the paragraph, for the human).

A lightweight scripted fallback exists only for total API failure — never the main path.

**Cost:** one LLM conversation per onboarding. This is exactly the locked Max principle —
*AI thinks once at onboarding, logic repeats daily.* Free Gemini/Groq for testing; Claude
for the real synthesis once revenue funds it.

---

## 3. The psychology engine (what makes it feel like therapy)

These are encoded as hard rules in the system prompt:

1. **Unconditional positive regard.** Whatever they say is met with acceptance, never
   judgment. No "you should have started earlier."
2. **Reflect before you redirect.** Mini-reflections ("so Quant is the one place you feel
   solid — that's actually a real asset") so they feel *heard*, not processed.
3. **Escalating intimacy.** Start safe and factual (situation, hours). Earn trust. Only then
   go deep (the *why*, the fears). Never open with "what are you afraid of."
4. **Disclosure reciprocity.** The mentor is a little human first — the founder's story ("I
   self-studied to 91, I know the 11pm loneliness"). Vulnerability invites vulnerability.
5. **Normalize, don't expose.** "Most people I talk to disappear around week 3 too" — so
   their struggle feels common, not shameful.
6. **They lead; we follow the thread.** If they emphasize anxiety, we go there. The agenda is
   a checklist of *what to learn*, not an *order to march*.
7. **Pacing.** No rapid-fire. One thing at a time. Pauses. It should breathe.
8. **Catharsis + insight.** They get to say hard things out loud (relief), and by the end
   understand their own pattern better than before (the synthesis gives them insight).
9. **Always an exit.** Every question is skippable. Control removes the feeling of being
   interrogated.

---

## 4. The conversation agenda (what every interview must surface)

Not a fixed script — the LLM covers these *goals* in a natural order, adapting depth to the
person. Each act lists the GOAL and the SIGNAL we extract.

**Act 0 — The Opening (permission + reciprocity).** Set the contract: ~10 min, no right
answers, skip anything, nothing is shared, it's just us. One line of founder's voice.
→ Signal: consent, language style (English/Hinglish), opening mood.

**Act 1 — The Situation.** Where they are in life. Branches: final-year / working / dropper /
early-college / between things / other. Each branch unlocks tailored follow-ups.
→ Signal: life stage, placement clash, hostel/home, multi-exam, re-attempt.

**Act 2 — The Daily Reality.** Their *actual* day, not "I study 2 hrs." When are they free,
when is energy highest, what's the environment.
→ Signal: realistic study windows, energy pattern, environment friction.

**Act 3 — Time & Constraints (honest).** Real hours/day, days/week, exam date, and predictable
busy windows (placements, sem exams, work deadlines, festivals, family events).
→ Signal: capacity, rest-week triggers, late-starter flag.

**Act 4 — Resources & Coaching status.** Coached / recorded course / pure self-study? What are
they using right now (Rodha, PDFs, YouTube, a portal)?
→ Signal: complement-vs-replace strategy, content gaps.

**Act 5 — The Baseline (honest, not score-first).** Mocks taken? The *story* of the last mock
(not just the number). Section comfort (Quant/VARC/LRDI). The anchor and the freeze. Then
probe the freeze: don't-know-how-to-start / run-out-of-time / panic / silly mistakes.
→ Signal: baseline, anchor (for engineered Week-1 win), freeze subject + failure mode,
  anxiety markers, no-baseline flag.

**Act 6 — The Why (the real one).** Not the LinkedIn answer. What is actually driving this.
Toward something or away from something.
→ Signal: motivation type + the exact words to use when they want to quit.

**Act 7 — The Obstacles.** What actually breaks their consistency. The honest pattern.
→ Signal: the real failure mode (starting trouble / 3-days-then-vanish / phone / pressure /
  comparison) → drives accountability mechanics.

**Act 8 — The Fears.** What failure would feel like; what scares them most right now.
→ Signal: the intervention trigger; emotional stakes for the synthesis.

**Act 9 — Self-belief.** Do they actually believe they can crack it? (1–10 feel, drawn out
gently.)
→ Signal: confidence level → calibrates the ENTIRE tone of Max (a 3/10 needs hope
  engineering; an 8/10 needs strategy, not pep talks).

**Act 10 — The Synthesis + transition.** Reflect it all back, give honest hope, transition to
"here's what I'm going to build for you, and why."

---

## 5. Every aspirant, every edge case (the matrix)

The system prompt must explicitly carry these so it's "ready for anything":

| Aspirant / situation | How the interview adapts |
|---|---|
| Overwhelmed non-starter | Extra gentle, reduce overwhelm, smaller asks, "we'll start tiny." |
| Overconfident (claims strengths) | Capture warmly; never contradict in the interview (handle later via data). |
| Test-anxious / freezes in mocks | Detect from mock story; flag untimed-first; reassure "speed comes after accuracy." |
| Serial restarter (quits Wed) | Flag micro-commitment + "One Thing" approach; don't shame the pattern. |
| Comparison-sufferer | Flag "your race" framing; note who they compare to. |
| Time-starved (job/family) | Minimal-viable plan framing; honour their constraints out loud. |
| Late starter (Aug/Sep) | Crash-mode framing; honest about scope ("we cover the highest-yield, not everything"). |
| Dropper with a painful last attempt | Hold the emotional weight; ask what went wrong with care, not clinically. |
| Weak English / Tier 2-3 | Detect and mirror simple language / Hinglish from their first messages. |
| Skeptic ("just another app?") | Don't argue — the interview's quality IS the rebuttal. |
| Privacy-guarded | Lean on skip options; never push; thank them for what they do share. |
| Multi-exam (XAT/NMAT/IIFT) | Capture; note syllabus overlap for the roadmap. |
| "Just exploring," not serious yet | Still give value; flag low commitment; soft close. |
| Family pressure / personal crisis volunteered | Acknowledge as a human first; mark rest-week needs; never pry beyond what's offered. |

**And it adapts to HOW they answer:** one-word → draw out; over-sharing → warm + move on;
emotional → hold space; joking → match then return; off-topic → redirect kindly.

---

## 6. The privacy / trust design (Sahil's key concern)

How we ask deep things without it feeling like we're invading:

1. **Every sensitive question is justified by THEIR benefit.** "I'm asking so the plan fits
   *your* life, not a generic one." Never extract for extraction's sake.
2. **Control = no invasion.** A visible/easy "skip this" on anything personal. Optionality
   kills the interrogation feeling.
3. **Earned depth.** Escalating intimacy (§3.3) — by the time we ask the *why*, trust exists.
4. **Reciprocity.** Mentor opens first; we go second.
5. **We never ask guarded PII.** No income, no names, no specifics about family unless *they*
   bring it. We ask about *feelings and patterns*, not facts they'd protect.
6. **Explicit privacy promise, shown not buried.** "Nothing here is shared. It's only to build
   your plan." (And it must be true — store securely, no leaks.)
7. **Peer-mentor tone, never clinical.** It reads like a senior who cracked CAT talking to a
   junior, not a system harvesting data.

---

## 7. The two outputs (functional + emotional)

The interview ends by producing BOTH, from the same conversation:

- **A) Structured Profile (JSON)** → consumed by the Roadmap generator. The *functional*
  payload. Must be reliably filled even when the conversation wandered.
- **B) The Synthesis (paragraph)** → shown to the human. The *emotional* payload. The
  conversion moment.

If we get A but not B, the plan is generic. If we get B but not A, the magic fades when the
roadmap doesn't fit. We need both, every time.

---

## 8. The data model (profile schema → roadmap mapping)

Every field exists because the Roadmap *uses* it. This is the contract between Interview and
Roadmap.

```
profile = {
  context:    { life_stage, hours_per_day, days_per_week, exam_date,
                busy_windows[], language ('en'|'hinglish'), multi_exam[] },
  resources:  { coaching_status ('none'|'recorded'|'full'), current_materials[] },
  baseline:   { mocks_taken, last_mock_story, last_percentile?,
                comfort: {quant:1-5, varc:1-5, lrdi:1-5},
                anchor_subject, freeze_subject,
                failure_mode ('no_start'|'time'|'panic'|'silly'),
                weak_topics[] },
  psychology: { why_text, motivation_type ('toward'|'away'),
                consistency_pattern, confidence_1_10,
                anxiety_flag, comparison_flag, restarter_flag },
  flags:      { late_starter, placement_clash, time_starved, no_baseline,
                emotional_support_needed }
}
```

Mapping (why each is collected):
- hours/days/exam_date → daily load + total runway
- busy_windows, late_starter, placement_clash → rest/light weeks, crash-mode
- anchor_subject → **engineered Week-1 win** (fastest visible improvement)
- freeze_subject + failure_mode → what Week 1 targets and *how* (untimed if anxiety_flag)
- coaching_status, current_materials → complement vs replace; what content to assign
- why_text, motivation_type → the words Max uses when they're about to quit
- consistency_pattern, restarter_flag → accountability mechanics ("One Thing" on bad days)
- confidence_1_10 → the tone of the entire product
- comparison_flag → "your race" framing in reviews

---

## 9. The Synthesis spec (the bet)

The synthesis is one paragraph (~130–180 words) that must make them feel **seen, hopeful, and
that this was built for them.** It must:
- Reflect their *specifics* (situation, anchor, freeze, pattern, why, fear) — never generic.
- Reframe with **honest hope** — show the path is doable without lying ("you're 4 questions a
  section away from 85%ile, and here's the kind of path that gets those 4").
- Name the *real* obstacle and signal we'll design around it, not nag about it.
- Mirror their language (Hinglish if they used it).
- End by transitioning to the plan: "here's what I'm going to build for you, and why."
- NOT give the plan yet. Just the reflection + the doorway.

This is the line that gets iterated 15–20 times. It must be a/b-testable: we keep the profile,
swap the synthesis prompt, compare which version makes real aspirants go quiet.

The emotion we want them to feel, in order: *understood → relieved → hopeful → "I have to do
this with this thing."*

---

## 10. Experience / UX design (how it looks & feels)

- **Mobile-first chat.** Most aspirants are on phones. Big tap targets, thumb-reachable input.
- **Conversational pacing.** Typing indicator, human-length pauses, one message at a time. It
  must never feel like a fast quiz.
- **Warm, calm visual tone.** Dark, soft, focused — no progress-bar pressure ("Question 4/20"
  makes it a form). Maybe a subtle "we're getting there" cue, never a countdown.
- **Quick-reply chips** only for genuinely categorical things (life stage); everything
  emotional is free text (typing makes them reflect).
- **Skip affordance** always present on personal questions.
- **The synthesis reveal** is a designed moment — a beat of "putting this together…", then the
  paragraph appears with a little visual weight (the one screenshot people will remember).
- **Voice input (Phase 2).** Tired aspirants talk more than they type; speaking leaks emotion.
- Feels like Max throughout — same brand, same calm confidence. Not a "beta tool" skin.

---

## 11. Presentation & distribution (how people take it)

**Decision: value-first, signup-after, private solo link.**

- A clean standalone-feeling entry (a link) — **no signup required to start.** The interview is
  the hook; asking for an account first adds friction and the "another app" feeling.
- They do it **alone, privately** (link), not with Sahil watching over their shoulder (that IS
  invasive). At the end: synthesis → soft "this is CATalyst Max — want your full roadmap?"
- This mirrors the real Max funnel: **interview hooks → synthesis converts → then signup/₹99.**

**How to get people to take it (outreach framing):** not "fill my form / test my app." Instead:
> "I built something that figures out your CAT prep in ~10 minutes and tells you what's
> actually going on with you. Can I send it to you? I genuinely want to know if it helps."

Curiosity + low commitment + the founder genuinely caring. It's a gift, not a favour to Sahil.

**Two test modes:**
- **Solo link** (most natural, private, real funnel) — primary.
- **A few guided (live call)** where Sahil watches the face at the synthesis — highest-signal
  qualitative read. Use sparingly.

**Inside CATalyst as beta?** Not yet. Signup-first kills value-first. Build standalone now
(reusable engine), embed into the app later. The engine is identical either way.

---

## 12. Testing plan

- **Phase 0 — Self + personas.** Sahil runs his own profile, then role-plays 4 hard personas
  (working pro, anxious dropper, overconfident topper-wannabe, Tier-2 Hinglish starter).
  Check: does it adapt? does the synthesis land for each?
- **Phase 1 — 5–8 real aspirants, solo link.** They do it alone, then share their reaction +
  the session export. Watch: completion rate, did the synthesis make them feel seen, did
  anything feel invasive, where did they hesitate or drop.
- **Phase 2 — 2–3 guided live.** Sahil watches the face at the synthesis. The realest signal.
- **Signals that matter:** completion %, "this is exactly me" rate, invasiveness incidents,
  and Sahil's gut read of each reaction.
- **Iterate the synthesis prompt** every few sessions based on "this landed / this felt fake."
- **Bar to proceed to Roadmap build:** ≥ ~half of real testers visibly moved by the synthesis.
  If not, fix the interview before building anything downstream.

---

## 13. Open decisions to lock with Sahil

1. **LLM-driven (recommended) vs scripted** for v1 testing. (Driven is the real thing; needs a
   free Gemini key. Scripted is simpler but can't feel like therapy.)
2. **Which model for testing** — free Gemini (good, free) vs Claude (best, paid). Likely Gemini
   now, Claude for the real synthesis post-revenue.
3. **Solo link vs guided** as the primary first-test mode (recommend solo, with a few guided).
4. **How much we capture vs how light we keep it** — depth of profile vs interview length
   (longer = better data but more drop-off). Recommend ~10 min ceiling.
5. **The transition at the end** — for testing, do we show a soft "this is Max, roadmap coming"
   or keep it interview-only and gather reactions first?

---

## 14. Build order (once decisions locked)

1. Write the **master system prompt** (persona + psychology + agenda + edge-cases + profile
   schema + dual output). This is 80% of the work and the real craft.
2. Build the **LLM-driven chat UI** (mobile-first, paced, skippable, the synthesis reveal).
3. Wire the **dual output** (structured profile JSON + synthesis paragraph).
4. **Session capture/export** for testing notes (profile + synthesis + reaction).
5. Self-test → persona-test → iterate the prompt.
6. Ship the solo link → 5–8 real testers → iterate.
7. Only then: design the Roadmap generator that consumes the profile.

*The master system prompt is the product. Everything else is plumbing around it.*
