# CATalyst Max v2 — Full Plan
**The Pivot: From Mistake Tracker to Coaching Replacement**

Version: 2.0
Date: June 12, 2026
Status: Planned — build starts after first MVP Dev client
Author: Sahil Solankey

---

## 1. Why This Document Exists

CATalyst v1 and Max v1 (PDF upload) both failed the same test: they required users to change existing behavior. This document specifies the pivot that doesn't — a complete, personalized CAT prep system for aspirants who have **no system at all**.

This is the biggest product decision since CATalyst launched. Everything here was pressure-tested through real user conversations between May 20 and June 11, 2026.

---

## 2. The Problem — What We Learned the Hard Way

### 2.1 The field evidence (May 20 – June 11)

- 100+ DMs sent, 15-18 replies, 3 trials, **1 paying user (Oviya, ₹489)**
- Oviya converted only after a 45-minute personal VARC guidance conversation. She bought trust in Sahil, not the product. She has coaching and hasn't used CATalyst since — "when I get time, coaching material comes first."
- 95% of feedback was positive. ~0% of usage followed. Compliments ≠ conversions ≠ retention.
- Prakhar (warm lead): on Rodha portal. CATalyst doesn't fit his workflow.
- Siddhant (99.85%ile, runs CAT Unfiltered, 400 signups / 32 paying in 6 days): validated the concept strongly, but his community is early-stage aspirants — revisit August.

### 2.2 The diagnosis — why every segment failed

| Segment | Why CATalyst v1 didn't stick |
|---|---|
| **Coached aspirants (IMS/TIME/SimCAT/Rodha)** | Their portal already gives DPPs, weak-topic analysis, rankings. They solve THERE. No solving on CATalyst = no mistakes logged = Fix Mode never triggers = loop never starts. A second app loses to sunk cost ("I paid ₹30k for coaching") every time. |
| **Beginners** | Don't understand their own problem yet. Can't value mistake-correction before they've made mistakes. Don't even know which coaching to pick. |
| **Mock-takers** | Want BRANDED mocks for percentile comparison. Unbranded mock mode is worthless to them. |
| **Logging mistakes manually** | Nobody spends 30 minutes logging 10 mistakes from another platform. Dead on arrival. |
| **Max v1 (PDF upload)** | Coaching portals don't give PDFs — DPPs live inside the portal. The entire premise was wrong. **Scrapped.** |

### 2.3 The core insight

**CATalyst's loop only works if CATalyst is where the user practices. Coached users will never make it their practice home. So build for the people who have no practice home: self-study aspirants.**

For them, CATalyst isn't a second app. It's the only app.

---

## 3. The Solution — CATalyst Max v2

### 3.1 One-line definition

**A coaching-replacement system for self-study CAT aspirants: it interviews you, builds your personal roadmap, gives you adaptive daily practice from real CAT questions, fixes your mistakes, and adjusts every week — like a mentor who never forgets.**

### 3.2 What it is NOT

- NOT a question bank competing with Cracku/iQuanta on volume
- NOT a mock platform (no percentile claims, no branded test promises)
- NOT AI-generated questions — every question is real (PYQs + curated bank). AI selects and sequences; humans authored.
- NOT "for everyone." Built for the self-studier. Coached users who adopt it are bonus, never the plan.

### 3.3 The ICP (locked)

**Primary:** Self-study CAT aspirant. Serious about CAT 2026. No coaching (cost, distance, or choice). Currently cobbling together Rodha YouTube + free PDFs + random advice. Deepest pain: *"Am I doing this right? What should I do today?"* — anxiety, zero structure, zero feedback, isolation.

**Secondary (bonus only):** Under-coached aspirants — bought a cheap recorded course, got no guidance. Droppers re-attempting without re-paying for coaching.

**Market sizing (honest):** ~3 lakh CAT takers/year. Estimated 30-50% without full coaching ≈ 1–1.5 lakh self-studiers. Reachable + serious + willing to pay slice: small. Converting 0.3–0.5% of reachable segment in season one = **300–700 users**. This is a strong bootstrap business, not a unicorn. That's fine — it funds everything else.

---

## 4. The Product — A to Z User Journey

### Step 0 — Landing page
Headline: **"CAT prep without coaching. A system that knows you."**
One scroll: 3-step how-it-works → real roadmap screenshot → founder story (91%ile, built this because I lived this) → real PYQ proof → ₹99 CTA.

### Step 1 — Entry at ₹99 (Roadmap Week)
User pays ₹99 BEFORE any AI runs. Gets: counselling interview + personal roadmap + 7 days of personalized DPPs + full Fix Mode. ₹99 is credited toward Max upgrade.

### Step 2 — The Counselling Interview (~10 min, chat UI)
Conversational, mentor-tone — never a form. Collects:
- Academic background, college/job hours
- Coaching status (none / recorded / partial)
- Hours available per day, days per week
- Self-assessed weak subjects + topics
- Mock history and score range (if any)
- Honest blockers: procrastination, math fear, English weakness, consistency
- CAT 2026 date = known (countdown drives urgency)

Output: structured **User Profile** stored in `user_profiles` table. Ends with: "Building your plan…" (anticipation moment).

### Step 3 — The Roadmap Reveal (the magic moment)
**Weekly view, never a 190-day wall.**

> "Week 1: Arithmetic foundations — 3 DPPs, 2 RC sets, 1 mini-mock Sunday. Why: you told me Arithmetic costs you the most marks, and it's CAT's highest-frequency Quant area over the last 10 years."

Every block has a *because*. The "why" sentences create the "this was made for ME" feeling. This screen converts emotionally — if it lands, Max upgrade is already half-sold.

### Step 4 — The Daily Loop (the habit)
1. Open app → **"Today: 15 questions · ~40 min"** — one tap to start
2. Solve (timer, real questions, existing practice UI)
3. Wrong answers → Error Log automatically
4. Fix Mode prompt after session (existing loop — unchanged, it is the product)
5. Streak ticks. Roadmap progress % updates.

**Zero decisions required from the user. That is the entire product promise.**

### Step 5 — Weekly Review (the retention engine)
Every Sunday, AI reviews the week:
> "Arithmetic accuracy up 12%. Para-jumbles still bleeding marks — next week shifts one DPP from RC to PJ. Streak: 6/7 days. You're ahead of plan."

This creates the "someone is watching my prep" feeling — the thing self-studiers completely lack and coaching's real product.

### Step 6 — Day 7: The Upgrade Wall
Roadmap Week ends. Roadmap + adaptive DPPs continue **only on Max (₹999 till CAT, minus ₹99 credit = ₹900)**. They've felt 7 days of structure; losing it is now a real loss. Loss aversion sells; we just present it honestly.

### Step 7 — Ongoing (Max)
- Improvement graphs per topic
- Streaks + roadmap completion %
- Mock score logging → roadmap adjusts
- Days-to-CAT pressure on dashboard
- Fix Mode forever

### Accountability Layer (the 8→9 feature)
Self-study's disease is isolation. Lightweight cohort mechanics:
- "Your batch completed 71% of roadmaps this week"
- CATalyst users Telegram group (founder present daily)
- Streak leaderboard among active users
Mostly community ops, minimal code. Coaching's real moat is peer pressure — this is our cheap version.

---

## 5. Question Bank Strategy

### 5.1 Launch bank (enough — do not delay launch for 3000)

| Source | Count | Status |
|---|---|---|
| CAT PYQs 2015–2024 (official) | ~660 | To extract + tag |
| Existing CATalyst bank | ~794 | Live (Quant thin: 226) |
| **Launch total** | **~1,450 real questions** | Sufficient |

**PYQs are the trust killer-app.** Nobody questions actual CAT questions. "Practice on real CAT questions from the last 10 years" ends the question-quality objection permanently.

### 5.2 Tagging schema (every question)
`year · subject · topic · subtopic · difficulty · question_type (MCQ/TITA/Set) · CAT-frequency-weight (from PYQ trend analysis) · trap_type`

### 5.3 PYQ Trend Analysis (the DPP quality engine)
One-time AI analysis of 10 years of papers → topic frequency weights per year → stored as data. Daily DPP selection uses these weights. **This is pattern intelligence, not "AI predicted questions"** — we never claim prediction. Marketing line: *"Built around your weak areas and 10 years of CAT patterns."*

### 5.4 Growth path
1,450 → 3,000+ over year one via gradual curated additions. Quant expansion first (Geometry: 2 questions, Number System: 5 — embarrassing, fix early). Copyright note: shift away from Cracku-extracted content toward PYQs + original/licensed questions as revenue grows.

---

## 6. Development Plan

### 6.1 Architecture principle
**AI thinks once; logic repeats daily.** AI runs at: onboarding (interview + profile), roadmap generation, weekly adjustment. Daily DPP selection is a weighted database query (roadmap priority × mistake history × difficulty adaptation) — near-zero recurring cost.

### 6.2 Build breakdown

| Component | Difficulty | Est. time |
|---|---|---|
| Counselling chat UI + profile schema | Medium | 4-5 days |
| Roadmap generator (prompt engineering + logic + weekly UI) | **Hard — quality IS the product** | 7-10 days |
| Daily DPP engine (logic-based selection) | Medium | 4-5 days |
| PYQ extraction + tagging (660 Qs) | **The grind** | 7-10 days |
| Tracker, streaks, graphs | Easy-Medium | 3-4 days |
| Weekly review generation | Medium | 2-3 days |
| Razorpay (₹99 + ₹999 flows, credit logic) | Medium | 2-3 days |
| Upgrade wall + trial expiry logic | Easy | 1-2 days |
| **Total (solo, focused)** | | **5-7 weeks** |

### 6.3 New Supabase tables
`user_profiles` · `roadmaps` · `roadmap_weeks` · `daily_dpps` · `dpp_attempts` · `streaks` · `weekly_reviews` · `payments`

### 6.4 The two quality risks code can't solve
1. **Roadmap pedagogical soundness** — does the plan actually make CAT sense, or is it plausible-looking AI output? Mitigation: Sahil's own CAT knowledge + beta users pressure-test every generated roadmap. Iterate the prompt 15-20 times.
2. **Tagging accuracy** — bad tags = random-feeling DPPs = product death. Mitigation: spot-check 10% of tagged questions manually; beta feedback loop.

### 6.5 Build order
Week 1-2: PYQ extraction + tagging (start immediately — it gates everything)
Week 2-3: Counselling + profile + roadmap generator
Week 4: DPP engine + daily loop integration
Week 5: Tracker, streaks, weekly review, payments
Week 6: Beta onboarding + iteration
Week 7: Polish + public launch prep

---

## 7. Capital & Costs

### 7.1 Development phase (one-time)

| Item | Cost |
|---|---|
| Claude API — dev testing (~300-500 roadmap iterations) | ₹2,000–4,000 |
| Beta — 10 users × full AI cycle × 2 months | ₹1,000–1,500 |
| Domain (catalystedu.in) | ₹700/yr |
| Razorpay setup | Free (2%/txn) |
| Vercel + Supabase | Free tier (fine to ~500 users) |
| **Total cash to launched product** | **< ₹8,000** |

### 7.2 Per-user AI economics (recurring)

| Event | Frequency | Cost |
|---|---|---|
| Counselling interview (10-15 calls) | Once | ₹15-25 |
| Roadmap generation | Once | ₹10-15 |
| Daily DPP selection | Daily | ~₹0 (logic) |
| Weekly review + adjustment | Weekly | ₹5-10/month |
| **Total** | | **~₹40 one-time + ~₹10/month** |

### 7.3 Unit economics

| | ₹99 Roadmap Week | ₹999 Max (6 months avg) |
|---|---|---|
| Revenue | ₹99 | ₹999 (₹900 after credit) |
| AI cost | ~₹40 | ~₹40 + ₹60 recurring |
| Razorpay 2% | ₹2 | ₹18 |
| **Margin** | **~₹57 (58%)** | **~₹780+ (78%+)** |

Every ₹99 trial is PROFITABLE. We never spend on a user who hasn't paid. Funnel expectation: 2-4 of every 10 Roadmap Week users convert to Max. Below 2/10 = roadmap quality problem, not pricing problem.

---

## 8. Pricing & Tiers (locked)

| | Free | ₹99 Roadmap Week | Pro ₹489/CAT | Max ₹999/CAT |
|---|---|---|---|---|
| Question bank | Browse sample | Full (7 days) | Full | Full |
| Fix Mode + Error Log | Demo | ✅ | ✅ | ✅ |
| Counselling + AI Roadmap | ❌ | ✅ (1 week) | ❌ | ✅ till CAT |
| Adaptive daily DPPs | ❌ | ✅ (1 week) | ❌ | ✅ |
| Weekly AI reviews | ❌ | ❌ | ❌ | ✅ |
| Tracker/streaks/graphs | ❌ | Basic | Basic | Full |
| Cohort/accountability | ❌ | ❌ | ❌ | ✅ |

- ₹99 credits toward Max ("Upgrade for ₹900")
- Pro stays for question-bank-only users; Max is the flagship
- First-20 founder pricing (₹99/mo / ₹489) honored for existing users
- Anchor in all marketing: **"Coaching-level structure. ₹999 till CAT."** vs ₹15-30k coaching

---

## 9. Marketing Plan

### 9.1 The channel truth
**This product's channel is NOT DMs.** May's 100-DM experiment (1 conversion, wrong product, wrong audience, wrong channel) proves nothing about v2 — but it proves DMs don't scale trust. v2 sells through content + founder presence where self-studiers already gather.

### 9.2 Channels (priority order)

1. **Reddit r/CATprep** — "coaching or self-study?" asked daily. Genuine long-form answers + founder story. Highest-intent audience available. Pseudonymous-friendly.
2. **Quora** — same questions, evergreen; answers compound for months.
3. **Telegram self-study groups** — daily helpful presence, occasional proof drops.
4. **YouTube comments** (Rodha, Bodhee, free-content videos) — the literal gathering place of the ICP.
5. **Instagram @catalyst page** — NOT acquisition; it's the credibility check. 15-20 proof posts (roadmap screenshots, improvement graphs, PYQ insights, founder notes). 2 posts/week. People check before paying; an empty page kills conversions.

### 9.3 Founder-as-face (calibrated)
Text-first, not video-first. First-person posts, name + story on landing page, personal replies to everything. Reddit/Quora allow full reach under a username — choose surfaces deliberately given personal-life visibility considerations.

### 9.4 Paid ads — NOT until proven
Hard rule: no ads until 20+ paying users + testimonials + known funnel conversion. Indian edtech Meta CAC runs ₹300-800/paying user done WELL. Before proof, ads burn cash and teach nothing. After proof: ₹200-300/day tests.

### 9.5 The proof engine (7→8→9)
- **Beta:** 10 self-study aspirants, free Max, in exchange for tracked data + testimonials
- **Output after 6-8 weeks:** real graphs — "Riya, self-study, Arithmetic 54% → 78% in 5 weeks"
- These artifacts ARE the marketing. Worth more than any feature.

### 9.6 Timing
June–September = coaching-decision window. Beta running by August + Siddhant's CAT Unfiltered community opening in August = launch into peak demand. The calendar favors this plan.

---

## 10. Users — Targets & Projections (honest)

| Milestone | Target | When |
|---|---|---|
| Beta users (free Max) | 10 | Build weeks 6-7 |
| First paid ₹99 cohort | 30-50 | Launch month |
| ₹99 → Max conversion | 25-40% | Ongoing gauge |
| Season one Max users | 50-200 | By Nov 2026 |
| Season one revenue | ₹50k – ₹2L | Realistic band |

Execution-dependent: bottom of band = product shipped, marketing sporadic. Top of band = daily founder presence Jun-Sept + beta proof published. **Distribution is the entire risk. The product stopped being the bottleneck weeks ago.**

---

## 11. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Roadmap quality is mediocre → product feels generic | FATAL | 15-20 prompt iterations; beta pressure-testing; Sahil's domain knowledge; every block has a "because" |
| Tagging errors → DPPs feel random | High | Manual 10% spot-checks; beta feedback loop |
| Distribution doesn't happen (founder avoids daily content) | FATAL | Calendar-blocked daily posting Jun-Sept; accountability via Daily OS |
| Self-studiers won't pay even ₹99 | Medium | ₹99 ≈ one Zomato order; PYQ trust + founder story + proof posts lower the wall |
| Copyright (Cracku-sourced bank) | Medium | Shift to PYQs + original questions as revenue grows |
| Solo-founder burnout (build + market + CAT prep) | High | Build AFTER MVP money; CAT prep restarts post-₹25k as planned |
| Coaching portals copy the feature | Low | They serve coached users; our ICP isn't their market. Speed + founder intimacy is the moat. |

---

## 12. Decision Log (locked decisions)

1. **Max v1 (PDF upload) — SCRAPPED.** Coaching portals don't give PDFs; premise invalid.
2. **ICP = self-study aspirants.** Coached users are bonus, never the plan.
3. **No AI-generated questions, ever.** Real PYQs + curated bank. AI selects, never authors.
4. **AI thinks once, logic repeats daily.** Cost architecture principle.
5. **₹99 paid entry (credited), no free AI.** Every trial profitable; payment = seriousness filter.
6. **No ads until 20+ paying users + testimonials.**
7. **Launch bank = ~1,450 real questions.** 3,000 is a year-one asset, not a launch gate.
8. **Roadmap UI = weekly view.** Never the 190-day wall.
9. **Build starts only after first MVP Dev client.** Non-negotiable sequencing.
10. **Fix Mode loop unchanged.** It remains the core product mechanism.

---

## 13. Immediate Next Steps (pre-build, zero-cost)

1. Update CLAUDE.md with this spec (prompt ready)
2. Landing page: "CATalyst Max — Coming Soon" + waitlist email capture (1 hr)
3. Draft counselling interview script on paper (no code needed)
4. Identify PYQ source (clean 10-year papers + solutions)
5. Sketch roadmap weekly-view UI on paper
6. **Everything else waits for MVP Dev client #1.**

---

*The product is good. The plan is sound. The only variable is whether distribution happens daily. Ship the client first. Then ship this.*
