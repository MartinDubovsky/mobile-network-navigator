import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
# capture F: protocols on non-standard ports (documentation addresses only)
src = open(_os.path.join(HERE,'trgen.py')).read()
exec(src[:src.index('# ===================== capture A')])
OUT = _os.path.join(HERE, '..', 'trcap')
F = Pcap(lt=1); T = [1700000400.0]
def put1(fr): T[0] += 0.001; F.pkt(T[0], fr)
def conv(cli, srv, sport, msgs, cport=40001):
    cs, ss = 1000, 5000
    put1(eth(v4(cli, srv, 6, tcp(cport, sport, cs, 0, 0x02)))); cs += 1
    put1(eth(v4(srv, cli, 6, tcp(sport, cport, ss, cs, 0x12)))); ss += 1
    for frm_cli, p in msgs:
        if frm_cli: put1(eth(v4(cli, srv, 6, tcp(cport, sport, cs, ss, 0x18, p)))); cs += len(p)
        else: put1(eth(v4(srv, cli, 6, tcp(sport, cport, ss, cs, 0x18, p)))); ss += len(p)
GX = 16777238
# 1 Gx over TCP 3870
PGW, PCRF = '192.0.2.31', '198.51.100.31'
ccri = dia(272, GX, True, [avp(264, 'pgw07.epc.example.net'), avp(416, 1), avp(1027, 5, vendor=10415), avp(8, ip4('203.0.113.77'))])
cca = dia(272, GX, False, [avp(264, 'pcrf07.epc.example.net'), avp(268, 2001)])
conv(PGW, PCRF, 3870, [(True, dia(257, 0, True, [avp(264, 'pgw07.epc.example.net'), avp(258, GX)])), (False, dia(257, 0, False, [avp(264, 'pcrf07.epc.example.net'), avp(268, 2001)])), (True, ccri), (False, cca)])
# 2 S6a over SCTP 3900, PPID 0
MME, HSS = '192.0.2.41', '198.51.100.41'
ulr = dia(316, 16777251, True, [avp(264, 'mme07.epc.example.net'), avp(1405, 2, vendor=10415)])
ula = dia(316, 16777251, False, [avp(264, 'hss07.epc.example.net'), avp(268, 2001)])
put1(eth(v4(MME, HSS, 132, sctp(40100, 3900, [sdata(0, ulr)]))))
put1(eth(v4(HSS, MME, 132, sctp(3900, 40100, [sdata(0, ula)]))))
put1(eth(v4(MME, HSS, 132, sctp(40100, 3900, [sack()]))))
# 3 RADIUS on UDP 31812
NAS, AAA = '192.0.2.51', '198.51.100.51'
put1(eth(v4(NAS, AAA, 17, udp(40200, 31812, rad(1, [(32, b'pgw08'), (8, ip4('203.0.113.88')), (26, vsa3gpp(21, b'\x06'))])))))
put1(eth(v4(AAA, NAS, 17, udp(31812, 40200, rad(2, [])))))
# 4 SGsAP on SCTP 29200, PPID 0 (SGsAP has no PPID)
VLR = '198.51.100.61'
for i in range(3):
    put1(eth(v4(MME, VLR, 132, sctp(29200, 29200, [sdata(0, b'\x01' + b'\0' * 15)]))))
# 5 PFCP on UDP 8806 with an N3 interface type
SMF, UPF = '192.0.2.71', '198.51.100.71'
put1(eth(v4(SMF, UPF, 17, udp(8806, 8806, pfcp(50, [pie(1, pie(2, pie(20, b'\x00') + pie(160, b'\x0b')))], seid=1, seq=9)))))
put1(eth(v4(UPF, SMF, 17, udp(8806, 8806, pfcp(51, [pie(19, b'\x01')], seid=1, seq=9)))))
open(f'{OUT}/f-ports.pcap', 'wb').write(F.b)
print('ok', len(F.b))
