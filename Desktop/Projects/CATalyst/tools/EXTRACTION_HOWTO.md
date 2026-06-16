# CATalyst — How to Extract Questions (complete walkthrough)

This is the only document you need to follow to turn a PDF into questions live in
the app. Written step by step. No prior knowledge assumed.

---

## 1. The big picture — three tools, three jobs

```
   PDF  ──▶  [1] PREPROCESSOR  ──▶  clean packages + page images
                  (Python, free)
                        │
                        ▼
            [2] AI (Gemini / ChatGPT)  ──▶  SQL INSERT statements
                  (reads the images, writes LaTeX, classifies, writes solutions)
                        │
                        ▼
            [3] CHECKER (extraction-checker.html)  ──▶  green SQL, errors caught offline
                        │
                        ▼
            DEV Supabase  ──▶  verify in app on localhost  ──▶  migrate to PROD
```

- **You DO need the AI.** The preprocessor prepares clean ingredients; the AI does the actual conversion to SQL. Neither replaces the other.
- Everything except the AI is **free and offline**.

---

## 2. What the preprocessor actually does (it is NOT just "pages to images")

You asked: *"will it just make the pdf pages into images?"* — **No.** Making images is only 1 of 6 things it does. For one PDF it:

1. **Renders every page to a PNG image** — so the AI can *read* the real math (text extraction destroys math: `n²` becomes `n2`, fractions collapse, `log₂` becomes `log2`).
2. **Pulls out the text and deletes all the junk** — timestamps, `cracku.in/...` URLs, page numbers, "VIEW SOLUTION" buttons, copyright lines.
3. **Finds every "Question N"** and keeps the PDF's real numbering (so nothing drifts).
4. **Reads the separate answer-key section** and attaches the correct answer to each question — and detects MCQ (letter) vs TITA (number).
5. **Groups sets** — questions that share a passage/chart. Counted sets ("following four questions") are grouped automatically; chart-image sets are flagged for you to glance at.
6. **Writes everything out** into a folder: one neat package per question + all page images + a REPORT telling you exactly what to double-check.

**In short:** it does the boring, error-prone 80% in code so the AI only does the smart 20% — on a clean question that already has its answer attached, so it can't go wrong.

---

## 3. Two ways to run the preprocessor — pick one

### Option A — The app (no terminal, recommended) ⭐
1. Double-click **`tools/extraction-app.html`** — it opens in your browser.
2. **Drag your PDF onto it** (or click to choose).
3. Click **Process PDF**, watch the progress bar.
4. Click **Download ZIP** — you get a folder with `pages/`, `packages/`, `manifest.json`, `REPORT.txt`.
5. Unzip it. That's the same output as the script. Now jump to **STEP 3** below (extract with the AI).

Nothing installs, nothing uploads — it all runs in your browser. Best for most PDFs.

### Option B — The script (terminal)
One-time setup, then run per PDF (shown in §4). Slightly faster for huge PDFs (e.g. the 915-page PYQ paper).

```bash
pip3 install PyMuPDF
```

That installs the one library the script needs. Done forever.

---

## 4. The full loop — for ONE PDF (copy-paste friendly)

We'll use Number Systems as the example. **"Where do I run it?" → In Terminal, from the CATalyst project folder.**

### STEP 1 — Preprocess (≈30 seconds, free)

```bash
cd /Users/poison/Desktop/Projects/CATalyst

python3 tools/cracku_preprocess.py \
  "/Users/poison/Desktop/CAT Prep/CAT Questions/LATER/Quant/Top 131 CAT Number Systems Questions With Video Solutions.pdf" \
  out_numsys
```

This creates a folder `out_numsys/` containing:

```
out_numsys/
  pages/         page_0001.png, page_0002.png, …   (the page images for the AI)
  packages/      q_0001.md, q_0002.md, …           (one clean package per question)
  manifest.json  every question + its answer, structured
  REPORT.txt     a summary + what to double-check
```

### STEP 2 — Read REPORT.txt (≈1 minute)

```bash
open out_numsys/REPORT.txt
```

Check:
- Does **"Questions parsed"** match the PDF's "Top N"? (e.g. 131 for Top 131 ✓)
- **"Questions with NO answer found"** — if any, open the PDF and note those answers manually.
- **"Image-based sets … CONFIRM visually"** — these are LRDI charts; you'll glance at the page image when extracting them.

If the numbers look right, you're good to extract.

### STEP 3 — Extract with the AI (Gemini recommended)

> Gemini 2.5 Pro is best here (great at reading math off images, huge context). ChatGPT Pro also works. Use whichever — just be consistent.

Each `packages/q_XXXX.md` file now contains **three things the AI needs**: the known answer, the **official worked solution from the PDF**, and which page image to read. So the AI never invents an answer OR a solution — it reformats the real ones and fixes the math from the image.

1. Open a new chat. **Paste the entire prompt from `tools/EXTRACTION_GUIDE.md`** as your first message.
2. For a batch (~8 questions): **attach the matching `packages/q_XXXX.md` files** AND the **page images** they point to (e.g. `q_0001.md`…`q_0008.md` + `page_0003.jpg`…`page_0010.jpg`).
3. Tell it: *"Extract each attached question into SQL. Use the KNOWN ANSWER and reformat the OFFICIAL WORKED SOLUTION from each package — don't invent. Read the page image to render the math correctly. Ignore video thumbnails and watermarks."*
4. Copy the SQL it produces.

> **Faster but lower quality:** upload page images only + paste answers, and let the AI write its own solutions. Use this only for easy questions — the package method above gives accurate, grounded solutions.

> **Tip:** A `packages/q_0001.md` file already bundles the clean text + the known answer + which image to look at. For tricky questions (LRDI sets, missing answers), feed ONE package + its page image at a time for maximum care.

### STEP 4 — Validate offline (free, instant)

1. Open `tools/extraction-checker.html` in your browser (double-click it).
2. Paste the AI's SQL into the box, hit **Check & Preview**.
3. **Fix every red ERROR** (it tells you exactly what's wrong — bad LaTeX, wrong subtopic, broken set link, etc.). Re-paste until green.
4. It also **renders each question exactly like the app** — eyeball the math and options to be sure.

### STEP 5 — Load into DEV and check in the app

1. Open your **DEV** Supabase project → SQL Editor → paste the green SQL → Run.
   (DEV is your safe sandbox — a mistake here never touches real users.)
2. Start the app locally:
   ```bash
   cd /Users/poison/Desktop/Projects/CATalyst
   npx serve .
   ```
3. Open **http://localhost:3000** — it auto-logs in as a dev tester (see §5), goes straight in.
4. Go to **Practice**, load questions, and check your new ones render correctly (math, options, images, sets).

### STEP 6 — Migrate to PROD

When it looks right in dev:

```bash
DEV_SERVICE_KEY=xxx PROD_SERVICE_KEY=yyy node migrate-to-prod.js
```

(This copies questions + sets from dev to prod safely. Service keys are in your Supabase project settings → API.)

**That's one PDF. Repeat for the next.**

---

## 5. Checking in DEV — the login problem (now fixed)

You were right: in dev you had no account to log in with, so you couldn't reach the app to check. **Fixed.** On `localhost` the app now **auto-logs-in a throwaway dev account** (`dev@catalyst.local`) and drops you straight into the app. It only happens on localhost (`ENV === 'dev'`) — production still requires a real login, untouched.

- First time on a fresh dev database, it creates that account automatically.
- If your dev Supabase has *email confirmation ON*, auto-login can't complete — turn confirmation OFF in dev Supabase (Authentication → Providers → Email), or just sign up once manually with any email.

> You don't even strictly need the app to check LaTeX/text — `extraction-checker.html` renders questions identically to the app, offline. Use the app mainly to confirm **images** (from Supabase storage) and **set joins** display correctly.

---

## 6. What order to do the PDFs in

1. **One small clean PDF end-to-end first** — e.g. *Top 33 Percentages* or *Top 48 Quadratic Equations*. Do all 6 steps once to learn the loop before scaling.
2. **Quant weak areas** (your bank is thin here — fix first): Geometry, Number Systems, Probability/Modern Math, Coordinate Geometry.
3. **Big Quant**: Algebra (396), Arithmetic (350+).
4. **VARC**: RC (858), Para Jumbles, VA — clean text, high volume, easy.
5. **LRDI** last — most manual (chart images to crop and upload to Supabase storage).
6. **29-yr PYQ paper** — highest trust value. Different layout (section-wise, scanned front matter); tell me when you reach it and we'll adapt the script or feed page images straight to Gemini section by section.

---

## 7. Quick FAQ

**Do I run the preprocessor in the browser or terminal?** Terminal, from the CATalyst project folder.

**Does it change my PDFs?** No — it only reads them and writes a new output folder. Originals are untouched.

**Does it need the internet?** No. (The AI step does; the preprocessor and checker don't.)

**Can it talk to my database?** No — it never touches Supabase. It just makes files. You stay in control of what gets loaded.

**Why not let the AI read the PDF directly?** It can, but then it has no clean answer key, mis-numbers questions, mis-groups sets, and reads furniture as content — exactly the errors you hit before. The preprocessor removes all of that first.

**For LRDI image sets, what about the chart images?** The page PNG shows the chart. Crop it, name it like `set_<id>_img_1.png`, and upload to your Supabase Storage `cat-assets` bucket. The checker validates the `image_url` naming.

**Is it safe?** The whole flow is checker (offline) → DEV (sandbox) → verify → PROD. Prod only ever receives already-verified rows.
