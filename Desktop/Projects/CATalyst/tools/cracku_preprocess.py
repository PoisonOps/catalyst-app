#!/usr/bin/env python3
"""
CATalyst — Cracku "Top N" PDF preprocessor
==========================================
Turns a messy Cracku question PDF into clean, per-question "extraction packages"
so the AI's job becomes trivial and error-proof.

It does — IN CODE, with ZERO AI and ZERO cost — all the parts the AI used to get
wrong:
  • strips page furniture (timestamps, cracku URLs, page numbers, copyright, buttons)
  • splits on the PDF's real "Question N" markers (no numbering drift)
  • parses the separate Answer-key section → {q_no: answer}  (MCQ letter vs TITA number)
  • detects set groupings ("Directions for the following N questions")
  • renders each question's page to a PNG so the AI can SEE the real math/figures
    (this is the fix for the silent math-destruction that pdftotext causes)

The AI then only has to: LaTeX-ify the math (reading the image), classify
topic/subtopic, and write the solution — on ONE clean question with the answer
already attached, so it cannot drift.

USAGE
  pip3 install PyMuPDF
  python3 cracku_preprocess.py "Top 396 CAT Algebra questions ....pdf" out_algebra

OUTPUT (out_algebra/)
  pages/page_0001.png ...     rendered page images (feed these to a vision AI)
  manifest.json               everything structured: questions, sets, answers
  packages/q_0001.md          per-question AI-ready package (text + answer + which image)
  REPORT.txt                  summary + anomalies (missing answers, count mismatches)

Then: feed each package + its page PNG to Gemini (free, vision) with
tools/EXTRACTION_GUIDE.md, paste the SQL into tools/extraction-checker.html,
load into DEV, verify, migrate to prod.
"""

import sys, os, re, json

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("PyMuPDF not installed. Run:  pip3 install PyMuPDF")

# ── furniture patterns (observed in the real Cracku PDFs) ────────────────────
FURNITURE = [
    re.compile(r'^\s*\d{1,2}/\d{1,2}/\d{2,4},?\s*\d{1,2}:\d{2}\s*(AM|PM)?\s*$', re.I),  # timestamp
    re.compile(r'^\s*(https?://)?cracku\.in/utils/qus_pdf/\w+\s*$', re.I),               # source url
    re.compile(r'^\s*\d+\s*/\s*\d+\s*$'),                                                # page num 1/301
    re.compile(r'^\s*(VIEW|VIDEO)\s+SOLUTION\s*$', re.I),                                # buttons
    re.compile(r'^\s*All rights reserved.*', re.I),
    re.compile(r'^\s*permission of cracku\.in.*', re.I),
    re.compile(r'^\s*recording or otherwise.*', re.I),
    re.compile(r'^\s*transmitted in any form.*', re.I),
    re.compile(r'^\s*Questions\s*$'),
]
ZWSP = re.compile(r'[​‌‍﻿]')
PUA  = re.compile(r'[-]')                    # private-use glyphs (button icons)
INLINE_BTN = re.compile(r'\s*(VIEW|VIDEO)\s+SOLUTION\s*', re.I)

Q_MARKER   = re.compile(r'^\s*Question\s+(\d+)\s*$', re.I)
SET_MARKER = re.compile(r'Directions for the (?:following|next)\s+([a-z0-9]+)\s+questions?', re.I)
INSTR_HDR  = re.compile(r'^\s*Instructions\s*$', re.I)
ANSWERS_HDR= re.compile(r'^\s*Answers\s*$', re.I)
# answer key entry: "12.D" or "170.80707" or "168.8"
ANS_ENTRY  = re.compile(r'\b(\d{1,4})\.\s*([A-E])\b|\b(\d{1,4})\.\s*(-?\d+(?:\.\d+)?)\b')

WORDNUM = {'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10}

def clean_line(ln: str) -> str:
    # strip zero-width chars + private-use-area button glyphs (-)
    ln = re.sub('[​‌‍﻿-]', '', ln)
    ln = INLINE_BTN.sub(' ', ln)   # remove inline "VIEW/VIDEO SOLUTION"
    return ln.rstrip()

def is_furniture(ln: str) -> bool:
    return any(p.match(ln) for p in FURNITURE)

def make_slug(name, override):
    if override:
        return re.sub(r'[^a-z0-9]+', '-', override.lower()).strip('-')[:30] or 'pdf'
    s = name.lower().replace('.pdf', '')
    for w in ['top', 'cat', 'questions', 'question', 'with', 'video', 'solutions',
              'solution', 'pdf', 'the', 'and', 'basics', 'basic']:
        s = re.sub(r'\b' + w + r'\b', '', s)
    s = re.sub(r'[0-9]+', '', s)
    s = re.sub(r'[^a-z]+', '-', s).strip('-')
    s = re.sub(r'-+', '-', s)
    return s[:30] or 'pdf'

def main():
    if len(sys.argv) < 3:
        sys.exit("usage: python3 cracku_preprocess.py <pdf> <outdir> [slug]")
    pdf_path, outdir = sys.argv[1], sys.argv[2]
    if not os.path.exists(pdf_path):
        sys.exit(f"not found: {pdf_path}")

    os.makedirs(os.path.join(outdir, 'pages'), exist_ok=True)
    os.makedirs(os.path.join(outdir, 'packages'), exist_ok=True)

    doc = fitz.open(pdf_path)
    pdf_name = os.path.basename(pdf_path)
    # per-PDF unique prefix so image filenames never collide across PDFs (global_q_no repeats!)
    slug = make_slug(pdf_name, sys.argv[3] if len(sys.argv) > 3 else None)
    n_pages = len(doc)

    # ── pass 1: per-page text (cleaned) + render image ───────────────────────
    page_lines = []   # list[list[str]] cleaned lines per page
    for i, page in enumerate(doc):
        raw = page.get_text("text")
        lines = [clean_line(l) for l in raw.split('\n')]
        lines = [l for l in lines if l.strip() != '' and not is_furniture(l)]
        page_lines.append(lines)
        # render at 2x for crisp math/figures
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        pix.save(os.path.join(outdir, 'pages', f'page_{i+1:04d}.png'))

    # ── find where the Answers section starts (questions end there) ──────────
    answers_page = None
    for i, lines in enumerate(page_lines):
        if any(ANSWERS_HDR.match(l) for l in lines):
            answers_page = i
            break
    q_end_page = answers_page if answers_page is not None else n_pages

    # ── pass 2: walk question pages, build questions + sets ──────────────────
    questions = []   # {q_no, page, lines:[...], set_id or None}
    sets = []        # {set_id, page, instruction_lines, q_count, q_nos:[]}
    cur_set = None
    cur_set_remaining = 0
    set_counter = 0
    cur_q = None

    def flush_q():
        nonlocal cur_q
        if cur_q is not None:
            questions.append(cur_q)
            cur_q = None

    for pi in range(q_end_page):
        lines = page_lines[pi]
        j = 0
        while j < len(lines):
            ln = lines[j]
            # instruction block. Gather its text + any "following N questions" count.
            if INSTR_HDR.match(ln) or SET_MARKER.search(ln):
                instr = []
                k = j
                cnt = None
                has_directions = False
                is_individual = False
                while k < len(lines) and not Q_MARKER.match(lines[k]):
                    if not INSTR_HDR.match(lines[k]):
                        instr.append(lines[k])
                        m = SET_MARKER.search(lines[k])
                        if m:
                            has_directions = True
                            tok = m.group(1).lower()
                            cnt = WORDNUM.get(tok, None) or (int(tok) if tok.isdigit() else None)
                        if re.search(r'answer\s+(them|the questions?)\s+individually', lines[k], re.I):
                            is_individual = True
                    k += 1

                # Cracku REPEATS the same directions header above every question of a
                # COUNTED set. If we're still inside an open counted set (known count,
                # slots remaining), this is a repeat — ignore it. For no-count image
                # sets we can't know the boundary, so a new block ends the current set.
                if cur_set is not None and cur_set.get('q_count') and cur_set_remaining > 0:
                    j = k
                    continue

                if is_individual:
                    cur_set = None; cur_set_remaining = 0
                elif has_directions and cnt:
                    set_counter += 1
                    cur_set = {'set_id': str(set_counter), 'page': pi+1,
                               'instruction_lines': instr, 'q_count': cnt, 'q_nos': [], 'confident': True}
                    sets.append(cur_set); cur_set_remaining = cnt
                else:
                    # bare "Instructions" with NO stated count. If it carries a long
                    # text passage (RC passage / LR scenario), grouping-by-block is
                    # reliable → confident. If short/empty (a chart image set), flag it.
                    set_counter += 1
                    instr_text = ' '.join(instr)
                    is_text_passage = len(instr_text) >= 150
                    cur_set = {'set_id': str(set_counter), 'page': pi+1,
                               'instruction_lines': instr or ['(image-based set — no text directions)'],
                               'q_count': None, 'q_nos': [], 'confident': is_text_passage}
                    sets.append(cur_set); cur_set_remaining = 9999
                j = k
                continue
            mq = Q_MARKER.match(ln)
            if mq:
                flush_q()
                qno = int(mq.group(1))
                attach_set = None
                if cur_set and cur_set_remaining > 0:
                    attach_set = cur_set['set_id']
                    cur_set['q_nos'].append(qno)
                    cur_set_remaining -= 1
                    if cur_set_remaining <= 0:
                        cur_set = None
                cur_q = {'q_no': qno, 'page': pi+1, 'lines': [], 'set_id': attach_set}
                j += 1
                continue
            if cur_q is not None:
                cur_q['lines'].append(ln)
            j += 1
    flush_q()

    # ── parse answer key (compact block only — stop when solutions begin) ─────
    # An answer-key line is the WHOLE line being "N.X" (letter) or "N.num" (tita).
    # Solutions also start "N. ..." but are followed by prose working, so we stop
    # after several consecutive non-key lines.
    KEY_LINE = re.compile(r'^\s*(\d{1,4})\.\s*([A-E])\s*$|^\s*(\d{1,4})\.\s*(-?\d+(?:\.\d+)?)\s*$')
    answers = {}
    if answers_page is not None:
        miss_streak = 0
        for pi in range(answers_page, n_pages):
            for l in page_lines[pi]:
                if ANSWERS_HDR.match(l):
                    continue
                m = KEY_LINE.match(l)
                if m:
                    miss_streak = 0
                    if m.group(1):
                        answers[int(m.group(1))] = {'answer': m.group(2), 'type': 'mcq'}
                    else:
                        answers[int(m.group(3))] = {'answer': m.group(4), 'type': 'tita'}
                else:
                    miss_streak += 1
                    # once we've collected the key and hit a run of prose, solutions have begun
                    if answers and miss_streak > 6:
                        break
            else:
                continue
            break

    # ── detect MCQ vs TITA from option presence in question text ─────────────
    OPT = re.compile(r'^\s*[A-E]\s*$')
    for q in questions:
        has_opts = sum(1 for l in q['lines'] if OPT.match(l)) >= 2
        ans = answers.get(q['q_no'])
        q['answer'] = ans['answer'] if ans else None
        # prefer answer-key type, fall back to option detection
        if ans:
            q['answer_type'] = ans['type']
        else:
            q['answer_type'] = 'mcq' if has_opts else 'tita'

    # ── parse the worked-solutions section (so the AI rewrites a REAL solution) ─
    # Solutions sit after the answer key, each block = "N. <answer>" then working
    # lines until the next "N+1." marker. Math here is text-broken, but the METHOD
    # is intact — the AI fixes the math from the question image.
    solutions = {}
    SOL_MARK = re.compile(r'^\s*(\d{1,4})\.\s*([A-E]|-?\d+(?:\.\d+)?)\s*$')
    if answers_page is not None:
        flat = []
        for pi in range(answers_page, n_pages):
            flat.extend(page_lines[pi])
        # find solution #1: a "1." marker followed IMMEDIATELY by prose (not another
        # marker). The answer key's "1." is followed by "2." (a marker) → skipped;
        # the worked solution's "1." is followed by real working text → matched.
        sol_start = None
        for i, l in enumerate(flat):
            m = SOL_MARK.match(l)
            if m and int(m.group(1)) == 1:
                for la in flat[i+1:i+3]:
                    if SOL_MARK.match(la):
                        break  # next is a marker → this is the answer key, not a solution
                    if len(la) > 20:
                        sol_start = i; break
                if sol_start is not None:
                    break
        if sol_start is not None:
            cur_no, buf, last = None, [], 0
            def _save():
                if cur_no is not None and buf:
                    solutions[cur_no] = '\n'.join(buf).strip()
            for l in flat[sol_start:]:
                m = SOL_MARK.match(l)
                if m and int(m.group(1)) == last + 1:
                    _save(); cur_no = int(m.group(1)); last = cur_no; buf = []
                elif cur_no is not None:
                    buf.append(l)
            _save()
    for q in questions:
        q['solution_src'] = solutions.get(q['q_no'])

    # ── extract question FIGURES (Geometry/DI/LR diagrams) ───────────────────
    # Figures are embedded images. Each page also has the reused play-button
    # template + video-solution thumbnails (which sit UNDER the play button).
    # Real figure = embedded image that is NOT the reused template AND does NOT
    # overlap a play-button placement. Crop it, name it by its question.
    os.makedirs(os.path.join(outdir, 'figures'), exist_ok=True)
    from collections import Counter, defaultdict
    _xref_pages = Counter()
    for _p in doc:
        for _im in _p.get_images(full=True):
            _xref_pages[_im[0]] += 1
    template_xrefs = {x for x, c in _xref_pages.items() if c > 10}
    def _ov(a, b): return not (a.x1 < b.x0 or a.x0 > b.x1 or a.y1 < b.y0 or a.y0 > b.y1)
    page_qs = defaultdict(list)
    for q in questions:
        page_qs[q['page']].append(q)
    fig_count = 0
    for pi in range(n_pages):
        qs_here = page_qs.get(pi + 1, [])
        if not qs_here:
            continue
        page = doc[pi]
        tmpl_rects = []
        for im in page.get_images(full=True):
            if im[0] in template_xrefs:
                tmpl_rects += list(page.get_image_rects(im[0]))
        figs = []
        for im in page.get_images(full=True):
            if im[0] in template_xrefs:
                continue
            for r in page.get_image_rects(im[0]):
                if any(_ov(r, t) for t in tmpl_rects):
                    continue
                if r.width > 40 and r.height > 40:
                    figs.append(r)
        if not figs:
            continue
        figs.sort(key=lambda r: r.y0)
        # y-position of each question marker on this page
        qy = []
        for q in qs_here:
            rs = page.search_for('Question %d' % q['q_no'])
            qy.append((rs[0].y0 if rs else 0, q))
        qy.sort()
        for r in figs:
            chosen = None
            for y, q in qy:                      # the question whose marker sits just above the figure
                if y <= r.y0 + 6:
                    chosen = q
            if chosen is None and qy:
                chosen = qy[0][1]
            if chosen is None or chosen.get('has_image'):
                continue
            pad = 6
            clip = fitz.Rect(max(0, r.x0 - pad), max(0, r.y0 - pad), r.x1 + pad, r.y1 + pad)
            pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), clip=clip)
            name = '%s_q_%04d_img_1.png' % (slug, chosen['q_no'])   # slug prevents cross-PDF collisions
            pix.save(os.path.join(outdir, 'figures', name))
            chosen['has_image'] = True
            chosen['image_url'] = name
            fig_count += 1

    # ── write outputs ────────────────────────────────────────────────────────
    set_by_id = {s['set_id']: s for s in sets}
    for q in questions:
        qtext = '\n'.join(q['lines']).strip()
        setblock = ''
        if q['set_id'] and q['set_id'] in set_by_id:
            s = set_by_id[q['set_id']]
            setblock = ("\n## SET CONTEXT (shared)\n"
                        f"set_id: {s['set_id']}\n"
                        + '\n'.join(s['instruction_lines']) + "\n")
        imgblock = (
            f"\n## THIS QUESTION HAS A FIGURE (auto-detected & cropped → figures/{q['image_url']})\n"
            f"Set has_image = true and image_url = $$ {q['image_url']} $$ in the SQL. The figure is\n"
            f"already extracted — you don't crop anything. Describe the figure in the question text only\n"
            f"where the original does (e.g. 'in the following figure').\n"
        ) if q.get('has_image') else (
            "\n## FIGURE: none detected → has_image = false, image_url = NULL\n"
        )
        sol_src = q.get('solution_src')
        solblock = (
            "\n## OFFICIAL WORKED SOLUTION (rewrite THIS — do not invent your own method)\n"
            "The math below is text-broken; follow the METHOD here and render the math\n"
            "correctly from the question image. Reformat into Trap / Key insight / How to fix.\n\n"
            f"{sol_src}\n"
        ) if sol_src else (
            "\n## OFFICIAL WORKED SOLUTION\n(none found in PDF — solve carefully from the image; "
            "the final answer is still the KNOWN ANSWER above)\n"
        )
        pkg = f"""# Question {q['q_no']}  (from {pdf_name})

## KNOWN ANSWER (from answer key — do NOT guess)
answer: {q['answer'] if q['answer'] else 'NOT FOUND — verify manually'}
answer_type: {q['answer_type']}
{setblock}
## RAW TEXT (math may be broken — TRUST THE IMAGE for math/figures)
{qtext}

## LOOK AT THIS IMAGE for correct math, symbols, tables, figures:
pages/page_{q['page']:04d}.png
{imgblock}{solblock}
## YOUR JOB
Produce the SQL row(s) per tools/EXTRACTION_GUIDE.md:
- Read the IMAGE to get math right; wrap inline math in \\( ... \\), display in \\[ ... \\]
- Keep all text verbatim; use /n/ for line breaks
- Use the KNOWN ANSWER above (set correct_option for mcq / correct_value for tita)
- has_image / image_url: use exactly what the FIGURE section above says (don't decide yourself)
- Base your solution on the OFFICIAL WORKED SOLUTION above — reformat it, fixing the math
- question_type = {'set_question' if q['set_id'] else 'single'}; set_id = {q['set_id'] or 'NULL'}
- Classify topic/subtopic from the allowed taxonomy
- Solution ends with the KEY INSIGHT / Trap / How to fix block
"""
        with open(os.path.join(outdir, 'packages', f"q_{q['q_no']:04d}.md"), 'w') as f:
            f.write(pkg)

    manifest = {
        'pdf_name': pdf_name, 'pages': n_pages,
        'answers_section_page': (answers_page+1) if answers_page is not None else None,
        'question_count': len(questions),
        'set_count': len(sets),
        'answers_found': len(answers),
        'questions': [{'q_no': q['q_no'], 'page': q['page'], 'set_id': q['set_id'],
                       'answer': q['answer'], 'answer_type': q['answer_type']} for q in questions],
        'sets': [{'set_id': s['set_id'], 'page': s['page'], 'q_count': s['q_count'],
                  'q_nos': s['q_nos'], 'confident': s.get('confident', True),
                  'instruction': ' '.join(s['instruction_lines'])[:300]} for s in sets],
    }
    with open(os.path.join(outdir, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)

    # ── anomaly report ───────────────────────────────────────────────────────
    qnos = [q['q_no'] for q in questions]
    missing_ans = [q['q_no'] for q in questions if q['answer'] is None]
    dupes = sorted({n for n in qnos if qnos.count(n) > 1})
    gaps = []
    if qnos:
        full = set(range(min(qnos), max(qnos)+1))
        gaps = sorted(full - set(qnos))
    set_count_warn = [s['set_id'] for s in sets if s['q_count'] and len(s['q_nos']) != s['q_count']]
    review_sets = [s['set_id'] for s in sets if not s.get('confident', True)]

    report = [
        f"PDF: {pdf_name}",
        f"Pages: {n_pages}  |  Questions parsed: {len(questions)}  |  Sets: {len(sets)}  |  Answers found: {len(answers)}",
        f"Figures auto-extracted: {fig_count}  (named '{slug}_q_<N>_img_1.png' — unique across PDFs)",
        (f"  → UPLOAD: drag every file in figures/ into Supabase Storage → 'cat-assets' bucket (root)."
         f" The SQL's image_url matches the filename, so the app resolves it automatically."
         if fig_count else "  (no figures in this PDF)"),
        f"Question number range: {min(qnos) if qnos else '-'}–{max(qnos) if qnos else '-'}",
        "",
        f"[!] Questions with NO answer found ({len(missing_ans)}): {missing_ans[:40]}",
        f"[!] Duplicate question numbers: {dupes}",
        f"[!] Missing question numbers (gaps): {gaps[:40]}",
        f"[!] Sets where parsed q-count != stated count: {set_count_warn}",
        f"[!] Image-based sets (no text count) — CONFIRM grouping visually ({len(review_sets)}): {review_sets[:40]}",
        "",
        "Next: feed each packages/q_XXXX.md + its pages/page_XXXX.png to Gemini (vision),",
        "then validate the SQL in tools/extraction-checker.html before touching any database.",
    ]
    with open(os.path.join(outdir, 'REPORT.txt'), 'w') as f:
        f.write('\n'.join(report))

    print('\n'.join(report))
    print(f"\n✓ Wrote {len(questions)} packages + {n_pages} page images to {outdir}/")

if __name__ == '__main__':
    main()
