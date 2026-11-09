import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
import struct, socket, os
src = open(_os.path.join(HERE,'trgen.py')).read()
exec(src[:src.index('# ===================== capture A')])
OUT = _os.path.join(HERE, '..', 'trcap')
# capture E: S11-U (Control Plane CIoT EPS optimisation) – F-TEID types 38 / 39 in GTPv2-C, then GTP-U between those addresses
E = Pcap(lt=1); t = 1700000300.0
MMEc, SGWc, MMEu, SGWu = '192.0.2.21', '198.51.100.5', '192.0.2.22', '198.51.100.6'
csr = gtpv2(32, [fteid(10, 0x100, MMEc), ie2(93, ie2(73, b'\x05') + fteid(38, 0x200, MMEu))], seq=7)
csp = gtpv2(33, [ie2(2, b'\x10\x00'), fteid(11, 0x300, SGWc), ie2(93, ie2(73, b'\x05') + ie2(2, b'\x10\x00') + fteid(39, 0x400, SGWu))], teid=0x100, seq=7)
t += .01; E.pkt(t, eth(v4(MMEc, SGWc, 17, udp(2123, 2123, csr))))
t += .01; E.pkt(t, eth(v4(SGWc, MMEc, 17, udp(2123, 2123, csp))))
for i in range(6):
    t += .01; E.pkt(t, eth(v4(MMEu, SGWu, 17, udp(2152, 2152, gtpu(0x400, inner4('203.0.113.7', '203.0.113.250'))))))
    t += .01; E.pkt(t, eth(v4(SGWu, MMEu, 17, udp(2152, 2152, gtpu(0x200, inner4('203.0.113.250', '203.0.113.7'))))))
open(f'{OUT}/e-s11u.pcap', 'wb').write(E.b)
print('ok', len(E.b))
