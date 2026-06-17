#!/usr/bin/env python3
"""
Interview simulator / validator.
Runs full auto-interviews (mentor = the live CONVO_SYSTEM, aspirant = an LLM
role-playing a persona) so we can stress-test the prompt across many profiles
and catalog drawbacks before rewriting. Also generates the roadmap per persona.

Usage: python3 interview_sim.py            # runs all personas
       python3 interview_sim.py dropper    # one persona by key
"""
import json, urllib.request, re, sys, time, os, ssl

API = 'https://catalyst-app-six.vercel.app/api/interview-chat'
HTML = os.path.join(os.path.dirname(__file__), '..', 'interview.html')
SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

def call(system, messages, jsonmode=False):
    body = json.dumps({'system': system, 'json': jsonmode, 'messages': messages}).encode()
    last = ''
    for attempt in range(5):
        try:
            req = urllib.request.Request(API, body, {'Content-Type': 'application/json'})
            r = urllib.request.urlopen(req, timeout=70, context=SSL_CTX)
            return json.loads(r.read().decode())['text']
        except Exception as e:
            last = type(e).__name__ + ': ' + str(e)
            time.sleep(2 * (attempt + 1))
    sys.stderr.write('CALL FAILED: ' + last + '\n')
    return '{"done":true}'

def grab(name):
    h = open(HTML).read()
    m = re.search(r'const ' + name + r'=`([\s\S]*?)`;', h)
    return m.group(1) if m else ''

CONVO = grab('CONVO_SYSTEM')
ROADMAP = grab('ROADMAP_PROMPT')

def parse(raw):
    try: return json.loads(raw)
    except: pass
    m = re.search(r'\{[\s\S]*\}', raw)
    if m:
        try: return json.loads(m.group(0))
        except: pass
    return {}

PERSONAS = {
    'working_1hr': "Working full-time software job (10 hrs/day). Only ~1 hour at night for CAT. 4 months left. Never taken a mock, no idea of your level. Feel weak everywhere. Target 95%ile. You answer briefly, a bit tired.",
    'dropper': "Dropper, re-attempt. Gave CAT 2025: 90%ile (Quant 93.8, LRDI 92.87, VARC 69.5). In Quant you're good only at Arithmetic, weak in Algebra/Geometry. VARC: RC comprehension is the problem (you misread author intent, pick wrong option), don't know VA much. LRDI: better at DI than LR. Self-study via YouTube + PDFs. 4-5 hrs/day. Target 99. Money/family pressure, do-or-die. Your weakness is consistency/overthinking. You vent a bit.",
    'fresher': "2nd-year college student, 9 months to CAT. Complete beginner, never studied for CAT, don't know the basics of any section. 3 hrs/day free. A bit scared of Quant. Target 95%ile. You give short, unsure answers.",
    'coached': "Final-year college, joined TIME coaching (offline classes 4 days/week). 2 hrs self-study after class. 5 months left. Mocks ~85%ile (Quant 88, VARC 80, LRDI 84). Weak in LRDI (especially LR puzzles). Want 99%ile. Placements also coming in Oct.",
    'high_scorer': "Working professional. Last CAT 96.5%ile (Quant 99, LRDI 98, VARC 88). Strong Quant & LRDI. Weak only in VARC — specifically para-jumbles and odd-one-out (VA), RC is fine. 2 hrs/day. 5 months. Target 99.5. Very little time, want efficiency not basics.",
    'anxious_hinglish': "Dropper from a small town. English is weak. You freeze and panic in VARC and in mocks even when you know the answer. You type in Hinglish. 6 hrs/day. Gave 1 mock got 72%ile. Target 90%ile. You are anxious and self-doubting.",
}

def run_interview(key, persona):
    asp_sys = ("You are role-playing a CAT aspirant being interviewed by a mentor. YOUR SITUATION: " + persona +
               " Answer each question the way a real person texts — short, sometimes vague or venting, not a polished essay. "
               "Stay 100% in character and consistent. Never break character. If a question doesn't apply, give a short honest answer.")
    mentor_hist = [{'role': 'user', 'text': 'Begin the interview now — warm opening (in q) and the first question.'}]
    asp_hist = []
    rows = []
    for turn in range(26):
        raw = call(CONVO, mentor_hist, True)
        o = parse(raw)
        if o.get('done'): break
        q = ((o.get('ack') or '') + ' ' + (o.get('q') or '')).strip()
        if not q: break
        rows.append({'ack': o.get('ack'), 'q': o.get('q'), 'options': o.get('options', []),
                     'learned': o.get('learned', []), 'chapter': o.get('chapter', '')})
        mentor_hist.append({'role': 'assistant', 'text': q})
        asp_hist.append({'role': 'user', 'text': q})
        ans = call(asp_sys, asp_hist, False)
        asp_hist.append({'role': 'assistant', 'text': ans})
        mentor_hist.append({'role': 'user', 'text': ans})
        rows[-1]['ans'] = ans
        time.sleep(4)  # throttle to stay under free-tier per-minute limits
    return rows, mentor_hist

def run_roadmap(mentor_hist):
    transcript = '\n'.join((('MENTOR: ' if m['role'] == 'assistant' else 'ASPIRANT: ') + m['text'])
                           for m in mentor_hist if 'Begin the interview' not in m['text'])
    raw = call(ROADMAP, [{'role': 'user', 'text': transcript}], True)
    return parse(raw), transcript

def main():
    keys = [sys.argv[1]] if len(sys.argv) > 1 else list(PERSONAS.keys())
    for key in keys:
        print('\n' + '=' * 70 + '\nPERSONA: ' + key + '\n' + '=' * 70)
        rows, hist = run_interview(key, PERSONAS[key])
        print('TURNS: %d' % len(rows))
        for i, r in enumerate(rows):
            print('\n[%d] CHAPTER=%s' % (i + 1, r.get('chapter')))
            if r.get('ack'): print('    ack: ' + str(r['ack']))
            print('    Q:   ' + str(r.get('q')))
            if r.get('options'): print('    opts: ' + str(r['options']))
            if r.get('learned'): print('    learned: ' + str(r['learned']))
            print('    >>> ' + str(r.get('ans', ''))[:240])
        rm, _ = run_roadmap(hist)
        print('\n--- ROADMAP ---')
        print('scope:', rm.get('scope', {}).get('current'), '->', rm.get('scope', {}).get('target'), '| gap:', rm.get('scope', {}).get('gap'))
        print('diagnosis:', rm.get('diagnosis'))
        print('phases:', len(rm.get('phases', [])))
        for d in rm.get('week', []):
            subs = [b.get('subject') for b in d.get('blocks', [])]
            print('  ', d.get('day'), d.get('theme'), d.get('total'), subs)

if __name__ == '__main__':
    main()
