import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
# capture I: SCTP protocols told apart by PPID and port – SBc-AP (29168), Iuh RUA / HNBAP (29169),
# Diameter over DTLS (5868) – and OpenFlow on TCP (documentation addresses only)
src = open(_os.path.join(HERE,'trgen.py')).read()
exec(src[:src.index('# ===================== capture A')])
OUT = _os.path.join(HERE, '..', 'trcap')
F = Pcap(lt=1); T = [1700000700.0]
def put1(fr): T[0] += 0.001; F.pkt(T[0], fr)
def assoc(cli, srv, port, ppid, n=3, cport=40100):
    for i in range(n):
        if ppid is not None: put1(eth(v4(cli, srv, 132, sctp(cport, port, [sdata(ppid, b'\x00\x01\x00\x04' + bytes(12), tsn=i + 1)]))))
        put1(eth(v4(srv, cli, 132, sctp(port, cport, [sack()]))))
# 1 SBc-AP: MME -> CBC, PPID 24 on port 29168
assoc('192.0.2.61', '198.51.100.61', 29168, 24)
# 2 SBc-AP association seen without DATA chunks (SACKs only): the port decides
assoc('192.0.2.62', '198.51.100.61', 29168, None)
# 3 Iuh: RUA (PPID 19) and HNBAP (PPID 20), both on port 29169
assoc('192.0.2.71', '198.51.100.71', 29169, 19)
assoc('192.0.2.72', '198.51.100.71', 29169, 20)
# 4 Iuh association without DATA chunks: listed as RUA
assoc('192.0.2.73', '198.51.100.71', 29169, None)
# 5 Diameter over DTLS on SCTP port 5868, no readable PPID
assoc('192.0.2.81', '198.51.100.81', 5868, None)
# 6 OpenFlow on TCP 6633 and 6653 (infrastructure), and UDP 6633 (plain IP – OpenFlow does not run over UDP)
put1(eth(v4('192.0.2.91', '198.51.100.91', 6, tcp(41000, 6633, 1, 1, 0x18, b'\x04\x00\x00\x08\x00\x00\x00\x01'))))
put1(eth(v4('192.0.2.91', '198.51.100.91', 6, tcp(41001, 6653, 1, 1, 0x18, b'\x04\x00\x00\x08\x00\x00\x00\x01'))))
put1(eth(v4('192.0.2.91', '198.51.100.91', 17, udp(41002, 6633, b'x' * 20))))
open(f'{OUT}/i-sctp.pcap', 'wb').write(F.b)
print('ok', len(F.b))
