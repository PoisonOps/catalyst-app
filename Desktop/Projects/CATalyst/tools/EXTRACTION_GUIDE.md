# CATalyst — Question Extraction Guide

The one source of truth for extracting questions/PYQs into the database **without errors**.
Replaces the three older prompts (which had the wrong math format baked in).

---

## The Workflow (never skip a step)

```
0. Pre-process the PDF (Cracku "Top N" format) — does the boring parts in code, free:
     pip3 install PyMuPDF
     python3 tools/cracku_preprocess.py "Top 396 ... .pdf" out_algebra
   → out_algebra/packages/q_0001.md  (clean text + KNOWN ANSWER + which page image)
   → out_algebra/pages/page_0001.png (rendered page — the AI READS this for correct math)
   → out_algebra/REPORT.txt          (flags missing answers, gaps, sets to eyeball)
1. Feed each q_XXXX.md + its page_XXXX.png to Gemini (free, vision) with the PROMPT below
2. Paste the AI's SQL into tools/extraction-checker.html → fix every ERROR, eyeball every WARNING
3. Only when the checker is green: paste into DEV Supabase (localhost) SQL editor
4. Open the app on localhost → verify a few questions render correctly live
5. Migrate DEV → PROD with:  DEV_SERVICE_KEY=… PROD_SERVICE_KEY=… node migrate-to-prod.js
```

**Why step 0 matters.** The preprocessor removes ~80% of the error surface in code (no AI, no cost): it strips page furniture, splits on the PDF's real "Question N", parses the separate answer key, groups counted sets, and — critically — renders each page to an image so the AI reads the REAL math instead of pdftotext's destroyed version (`n2` → n², stacked fractions, `log2` → log₂). The AI then only does the genuinely hard part on one clean question with the answer already attached, so it can't drift.

**Content-type reality (from analysing the actual PDFs):**
- **VARC (RC, PJ, VA)** — clean text. Preprocessor nails it; AI mostly writes solutions.
- **Quant** — math destroyed by text extraction → the AI MUST read the page image. Preprocessor provides it.
- **LRDI** — charts/tables are images. Counted sets ("following four questions") group correctly; image-based sets are flagged in REPORT.txt for a 2-second visual confirm (unavoidable — you must see the chart to crop it anyway).
- **29-yr PYQ paper** — front matter is scanned; question pages are text (VARC clean, Quant mangled). Same rules apply per section.

**Never paste AI SQL straight into PROD.** The checker catches errors offline; DEV catches the rest. PROD only ever receives already-verified rows.

**Why this fixes the old pain:** before, errors were only found in the SQL editor (syntax) or in the app (bad LaTeX) — after 100 questions, eternity to debug. Now every error is caught in step 3, in seconds, before any database is touched.

---

## The Three Bugs That Wrecked Past Extractions (now fixed)

1. **Math format.** The app's KaTeX renders ONLY `\(…\)` (inline) and `\[…\]` (display). It does **NOT** render plain `( … )` or single `$…$`. Old prompts told the AI to use `( x^2 )` and `$x^2$` — which showed as raw text in the app. **Rule: all inline math in `\(…\)`, all display math in `\[…\]`. Never `( )`, never `$ `, never `$$ ` for math** (`$$` is the SQL string delimiter).
2. **Subtopics.** Old prompts had slightly wrong lists. Use the EXACT taxonomy below.
3. **No validation.** Now: `tools/extraction-checker.html`.

---

## THE PROMPT (paste this + a PDF chunk into the AI)

> You are a precise SQL generator for the CATalyst CAT-prep database. Extract every question from the PDF content into SQL `INSERT` statements with **zero information loss** and **perfect, app-compatible LaTeX**.
>
> ### Output format
> - Use `INSERT INTO sets (col1, …) VALUES (…);` and `INSERT INTO questions (col1, …) VALUES (…);` — **always list columns explicitly.**
> - Wrap every text value in `$$ … $$` (dollar-quoting). Apostrophes are fine inside. Never produce empty `$$$$`.
> - Insert the set first (if any), then its questions.
>
> ### Math — CRITICAL (this is what broke before)
> - Inline math: `\( … \)`  e.g. `\( \frac{1}{2} \)`, `\( x^{10} \)`, `\( \sqrt{3} \)`, `\( a \ne b \)`
> - Display math (rare): `\[ … \]`
> - **NEVER** use plain parentheses `( … )` for math. **NEVER** use `$…$` or `$$…$$` for math (`$$` is the SQL delimiter — it will break the string).
> - Always brace multi-char exponents/subscripts: `\( x^{10} \)` not `\( x^10 \)`.
> - Every `\(` must have a matching `\)`. Never break a math expression across lines.
> - Use only KaTeX commands: `\frac \sqrt \times \div \le \ge \ne \pm \infty \sum \binom \log \lfloor \rfloor \pi \alpha` etc.
>
> ### Line breaks
> - Replace every newline inside a text value with the literal characters `/n/`. **Never** put a real newline inside `$$ … $$`.
> - In RC passages only, separate paragraphs with `/n/n/`.
>
> ### Verbatim rule (STRICT)
> - Do not rephrase, simplify, summarize, or shorten ANY question, option, passage, or solution. Keep exact wording and full length.
> - For long LRDI/DI caselets and their final tables/cases: extract **everything**, including the full worked table — do not skim.
> - Only allowed change: convert math to `\(…\)` LaTeX and fix line breaks. Silently fix OCR artifacts (broken ligatures, split hyphens).
>
> ### Options
> - Split into `option_a … option_d` (and `option_e` only if a 5th exists). Strip labels like `A)` / `1.` from the text.
> - TITA questions: `option_a..d = NULL`, `correct_option = NULL`, `correct_value = $$answer$$`.
> - MCQ: `correct_option = $$A$$/$$B$$/$$C$$/$$D$$/$$E$$`, `correct_value = NULL`.
>
> ### Single vs Set
> - Standalone (no shared passage/instruction): **omit the sets insert**, `question_type = $$single$$`, `set_id = NULL`.
> - Set question (shares passage/instruction): insert the set first, `question_type = $$set_question$$`, `set_id = $$<that set id>$$`. EVERY set question must carry its set_id, and that set must be defined in the same batch.
>
> ### Data types
> - `global_q_no` = bare integer (no `$$`). `has_image` = bare `true`/`false`. `NULL` = bare `NULL` (no quotes).
> - `id`, `set_id` = text, dollar-quoted: `$$23$$`.
> - **`subtopic` on a QUESTION = Postgres array**: `ARRAY['Progressions']` (NOT `$$Progressions$$` — that errors in Supabase). On a SET, `subtopic` = plain text `$$Tables$$`.
>
> ### Taxonomy (use EXACTLY one — these are the only valid values)
> **Quant** → topic ∈ {Algebra, Arithmetic, Geometry, Modern Math, Number System}
> - Algebra: Linear Equations, Quadratic Equations, Inequalities, Logarithms, Functions, Modulus, Progressions, Polynomials, Maxima-Minima, Surds & Indices
> - Arithmetic: Percentages, Profit & Loss, Simple Interest, Compound Interest, Ratio & Proportion, Mixtures & Alligations, Averages, Time & Work, Pipes & Cisterns, Time Speed Distance, Boats & Streams
> - Geometry: Lines & Angles, Triangles, Quadrilaterals, Circles, Polygons, Coordinate Geometry, Mensuration 2D, Mensuration 3D
> - Modern Math: Permutations & Combinations, Probability, Set Theory, Venn Diagrams, Sequences & Series, Binomial Theorem
> - Number System: Divisibility, LCM & HCF, Remainders, Factorials, Base System, Cyclic Pattern, Units Digit, Number Properties
>
> **VARC** → topic ∈ {RC, VA}
> - RC subtopic: Philosophy, Economics, Science, History, Sociology, Politics, Environment, Abstract
> - VA subtopic: Para Jumbles, Odd One Out, Summary, Sentence Completion, Sentence Correction
>
> **LRDI** → topic ∈ {LR, DI, LR Based DI}
> - LR: Arrangements, Selections, Games & Tournaments, Blood Relations, Directions, Venn Diagram Based, Ranking
> - DI / LR Based DI: Tables, Bar Graph, Line Graph, Pie Chart, Caselets, Mixed Graphs
>
> `micro_topic` = a precise concept label (e.g. "Discriminant based roots", "Remainder theorem", "Neighbor identification").
> `difficulty` = Easy / Medium / Hard.
>
> ### Solution — every solution ends with this exact block
> Full step-by-step working (with `\(…\)` LaTeX), verify the answer, then:
> ```
> /n/KEY INSIGHT:/n/Trap: <the trap this question sets>/n/Key insight: <the one idea that cracks it>/n/How to fix: <the technique to avoid the trap next time>
> ```
> For DI/LR sets: each question's solution must include the full worked table/case — do not reuse a half-finished grid.
>
> ### Images
> - If a question/set needs a figure/table/graph that can't be text: `has_image = true`, `image_url = $$set_<id>_img_1.png$$` (set) or `$$q_<global_q_no>_img_1.png$$` (standalone).
> - Solution figure: `solution_image_url = $$set_<id>_q_<global_q_no>_sol_1.png$$`. Set questions have no question image of their own (the set holds it) → `image_url = NULL`.
> - Otherwise all three image fields = `false` / `NULL`.
> - After the SQL, list every image to crop: `Set <id> → set_<id>_img_1.png (describe what to crop)`.
>
> ### Before the SQL
> Output a confirmation table: `Q No | Type | Topic | Subtopic | Micro | Answer Type | Has Image`. Then the SQL, one question at a time.

---

## Quick reference — correct vs wrong

| | ❌ Wrong (old) | ✅ Correct (app-compatible) |
|---|---|---|
| Inline math | `( x^2 )` or `$x^2$` | `\( x^2 \)` |
| Fraction | `1/2` | `\( \frac{1}{2} \)` |
| Exponent | `\( x^10 \)` | `\( x^{10} \)` |
| Line break | real newline | `/n/` |
| RC paragraph | real newline | `/n/n/` |
| question_type | `standalone` | `single` |
| MCQ answer | options + correct_value | options + `correct_option`, `correct_value = NULL` |

---

## Column lists (copy-paste)

**sets:** `id, subject, topic, subtopic, difficulty, instruction, passage, has_image, image_url, pdf_name, source`

**questions:** `global_q_no, subject, topic, subtopic, micro_topic, question_type, answer_type, difficulty, question, option_a, option_b, option_c, option_d, option_e, correct_option, correct_value, solution, set_id, pdf_name, source, has_image, image_url, solution_image_url`

> **IMPORTANT — subtopic column types differ:**
> - On **questions**, `subtopic` is a **Postgres ARRAY** → write `ARRAY['Progressions']` (NOT `$$Progressions$$`). For multiple: `ARRAY['Philosophy','History']`.
> - On **sets**, `subtopic` is **plain text** → write `$$Tables$$`.
> Writing a question's subtopic as plain `$$...$$` causes Supabase error `malformed array literal`.
