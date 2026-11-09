#!/usr/bin/env python3
"""Release: bump the version and add the release notes to the app (RELEASES, shown under the version button) and the README.
   python3 dev/tools/release.py <version> <notes.md>        e.g. 2026.11.10 or 2026.11.10.2 (a further release on the same day)
   python3 dev/tools/release.py <version> -i "item" -i "item" …
   notes.md: one item per line ('- ' optional); **bold** and `code` are rendered in the app. Lines starting with # are ignored.
   Updates <meta name="version">, const VERSION, const RELEASES (newest first), the README version line and its changelog.
   Run the tests afterwards (rel1 checks that README and app list the same versions)."""
import json, re, sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
H, RD = os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'README.md')
a = sys.argv[1:]
if not a or not re.fullmatch(r'\d{4}\.\d{2}\.\d{2}(\.\d+)?', a[0]): sys.exit(__doc__)
V, items = a[0], []
if len(a) > 1 and a[1] != '-i':
    items = [re.sub(r'^\s*[-*]\s+', '', l).strip() for l in open(a[1], encoding='utf-8') if l.strip() and not l.lstrip().startswith('#')]
else:
    items = [a[i + 1] for i in range(1, len(a) - 1) if a[i] == '-i']
if not items: sys.exit('no release notes given')
key = lambda v: [int(x) for x in v.split('.')] + ([0] if v.count('.') == 2 else [])
s = open(H, encoding='utf-8').read()
cur = re.search(r"const VERSION = '([^']+)';", s).group(1)
if key(V) <= key(cur): sys.exit(f'{V} is not newer than the current version {cur}')
s = re.sub(r'<meta name="version" content="[^"]*"', f'<meta name="version" content="{V}"', s, count=1)
s = re.sub(r"const VERSION = '[^']+';", f"const VERSION = '{V}';", s, count=1)
assert 'const RELEASES = [' in s
s = s.replace('const RELEASES = [', 'const RELEASES = [' + json.dumps({'v': V, 'items': items}, ensure_ascii=False) + ', ', 1)
open(H, 'w', encoding='utf-8').write(s)
r = open(RD, encoding='utf-8').read()
r = re.sub(r'\*\*Version [0-9.]+\*\*', f'**Version {V}**', r, count=1)
c = r.index('## Changelog'); i = r.index('\n### ', c) + 1
r = r[:i] + f'### {V}\n' + '\n'.join('- ' + x for x in items) + '\n\n' + r[i:]
open(RD, 'w', encoding='utf-8').write(r)
print(f'{cur} → {V}: {len(items)} item(s) in index.html (RELEASES) and README.md')
