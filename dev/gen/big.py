#!/usr/bin/env python3
"""The performance capture big.pcap (~1.1 GB): GTP-U on S1-U (VLAN 302) and plain TCP on SGi (VLAN 205), alternating.
   Usage: big.py [packets]  (default 2 600 000). Written as a stream; documentation addresses only."""
import os, struct, sys
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'trgen.py')).read().split('# ===================== capture A')[0]
ns = {'__file__': os.path.join(HERE, 'trgen.py')}; exec(src, ns); globals().update({k: v for k, v in ns.items() if not k.startswith('__')})
OUT = os.path.join(HERE, '..', 'trcap'); os.makedirs(OUT, exist_ok=True)
N = int(sys.argv[1]) if len(sys.argv) > 1 else 2600000
with open(os.path.join(OUT, 'big.pcap'), 'wb') as f:
    f.write(struct.pack('<IHHiIII', 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1))
    for i in range(N):
        k = i // 2
        if i % 2 == 0:
            fr = eth(v4('198.51.100.%d' % (10 + k % 3), '192.0.2.70', 17, udp(2152, 2152, gtpu(k & 0xffffffff, inner4('203.0.113.%d' % (k % 100), '203.0.113.%d' % (200 + k % 50), 300)))), vlans=[302])
        else:
            fr = eth(v4('203.0.113.%d' % (k % 100), '203.0.113.%d' % (200 + k % 50), 6, tcp(40000, 443, k & 0xffffffff, 1, 0x18, b'p' * 380)), vlans=[205])
        f.write(struct.pack('<IIII', 1700000000 + i // 1000000, i % 1000000, len(fr), len(fr)) + fr)
print('big.pcap', os.path.getsize(os.path.join(OUT, 'big.pcap')))
