#!/usr/bin/env python3
"""Subtitles from the timeline the director wrote.  srt.py <lang dir> <file name> <en|fr>   → <lang dir>/out/<file name>
   en: one cue per sentence, long ones (> 84 characters) on two lines of similar length.
   fr: typographic apostrophes, no-break space before : ? !, long sentences split into timed cues of ≤ 2 × 42 characters."""
import json, re, sys
BASE, NAME, LANG = sys.argv[1], sys.argv[2], sys.argv[3]
T = json.load(open(BASE + '/out/timeline.json'))
def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; ms = int(round((s - int(s)) * 1000))
    if ms == 1000: ms = 999
    return f"{h:02d}:{m:02d}:{int(s):02d},{ms:03d}"
def typo(t): return t.replace("'", "’").replace(' :', '\u00a0:').replace(' ?', '\u00a0?').replace(' !', '\u00a0!')
def wrap(t, w=42):
    if len(t) <= w: return t
    ws = t.split(' '); best = min(range(1, len(ws)), key=lambda k: max(len(' '.join(ws[:k])), len(' '.join(ws[k:]))))
    return ' '.join(ws[:best]) + '\n' + ' '.join(ws[best:])
def chunks(t, maxc=84):
    if len(t) <= maxc: return [t]
    n = -(-len(t) // maxc)
    cuts = [m.end() for m in re.finditer(r'[,.;:]\s', t)] or [m.start() for m in re.finditer(' ', t)]
    sp = [m.start() for m in re.finditer(' ', t)]
    res = []; start = 0
    for k in range(1, n):
        target = len(t) * k / n
        cand = [c for c in cuts if start + 20 < c < len(t) - 20]
        c = min(cand, key=lambda c: abs(c - target)) if cand and min(abs(c - target) for c in cand) < maxc * 0.35 else min([x for x in sp if x > start + 10], key=lambda c: abs(c - target))
        res.append(t[start:c].strip()); start = c
    res.append(t[start:].strip()); return [r for r in res if r]
out = []; n = 1
for c in T['cues']:
    if LANG == 'fr':
        parts = chunks(typo(c['text'])); tot = sum(len(p) for p in parts); t0 = c['t']
        for i, p in enumerate(parts):
            d = c['d'] * len(p) / tot; end = t0 + d + (0.15 if i == len(parts) - 1 else 0)
            out.append(f"{n}\n{ts(t0)} --> {ts(end)}\n{wrap(p)}\n"); n += 1; t0 += d
    else:
        txt = c['text'].replace('V-LAN', 'VLAN'); words = txt.split()
        if len(txt) > 84:
            best = min(range(1, len(words)), key=lambda k: abs(len(' '.join(words[:k])) - len(txt) / 2)); txt = ' '.join(words[:best]) + '\n' + ' '.join(words[best:])
        out.append(f"{n}\n{ts(c['t'])} --> {ts(c['t'] + c['d'] + 0.15)}\n{txt}\n"); n += 1
open(f"{BASE}/out/{NAME}", 'w', encoding='utf-8').write('\n'.join(out)); print(n - 1, 'captions')
