#!/usr/bin/env python3
"""Privacy check: IP addresses outside the documentation ranges must never reach the repository.
   python3 dev/tools/check-ips.py          lines added in the working tree and the index (git diff HEAD), plus untracked files
   python3 dev/tools/check-ips.py --all    every tracked and untracked (not ignored) file
   Allowed: 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (RFC 5737), 2001:db8::/32 (RFC 3849), 0.0.0.0, 255.255.255.255, 127.0.0.1, ::1, ::.
   Dotted numbers that are not addresses (spec clauses such as 5.2.3.4) are reported too – check them by eye (ip-check: ok); lines containing
   'ip-check: ok' are skipped. Exit code 1 when something is found."""
import ipaddress, re, subprocess, sys, os
ROOT = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip() or '.'
DOC4 = [ipaddress.ip_network(n) for n in ('192.0.2.0/24', '198.51.100.0/24', '203.0.113.0/24')]
DOC6 = ipaddress.ip_network('2001:db8::/32')
OK4 = {'0.0.0.0', '255.255.255.255', '127.0.0.1'}
V4 = re.compile(r'(?<![\w.])((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})(?![\w.]*\d)')
V6 = re.compile(r'(?<![\w:.])((?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F:.]*|::(?:[0-9a-fA-F]{1,4}[:.]?)+)(?![\w:])')
def bad(line):
    out = []
    for m in V4.finditer(line):
        a = m.group(1)
        if re.search(r'(§|Fig\.|[Cc]lause|Table|Annex)\s*$', line[:m.start()]): continue   # a spec clause, not an address
        if a in OK4 or any(ipaddress.ip_address(a) in n for n in DOC4): continue
        out.append(a)
    for m in V6.finditer(line):
        s = m.group(1).rstrip(':.')
        try: a = ipaddress.ip_address(s.split('/')[0])
        except ValueError: continue
        if a.version != 6 or s in ('::1', '::') or a in DOC6: continue
        if a.ipv4_mapped and any(a.ipv4_mapped in n for n in DOC4): continue
        out.append(s)
    return out
def files_all():
    r = subprocess.run(['git', 'ls-files', '--cached', '--others', '--exclude-standard'], cwd=ROOT, capture_output=True, text=True)
    return [f for f in r.stdout.splitlines() if f]
found = 0
def report(f, n, line, hits):
    global found
    found += 1; print(f'{f}:{n}: {", ".join(hits)}   {line.strip()[:140]}')
def scan_file(f):
    p = os.path.join(ROOT, f)
    try: text = open(p, encoding='utf-8').read()
    except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError): return
    for n, line in enumerate(text.splitlines(), 1):
        if 'ip-check: ok' in line: continue
        h = bad(line)
        if h: report(f, n, line, h)
if '--all' in sys.argv:
    for f in files_all(): scan_file(f)
else:
    d = subprocess.run(['git', 'diff', 'HEAD', '-U0', '--no-color'], cwd=ROOT, capture_output=True, text=True).stdout
    f = None; n = 0
    for line in d.splitlines():
        if line.startswith('+++ '): f = line[6:]; continue
        m = re.match(r'@@ -\S+ \+(\d+)', line)
        if m: n = int(m.group(1)); continue
        if line.startswith('+') and f:
            if 'ip-check: ok' not in line:
                h = bad(line[1:])
                if h: report(f, n, line[1:], h)
            n += 1
    u = subprocess.run(['git', 'ls-files', '--others', '--exclude-standard'], cwd=ROOT, capture_output=True, text=True).stdout.splitlines()
    for f in u: scan_file(f)
print(f'{found} line(s) with addresses outside the documentation ranges' if found else 'ok – only documentation addresses')
sys.exit(1 if found else 0)
