#!/usr/bin/env python3
import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
"""Synthetic captures for the trace-analysis tests. Documentation addresses only (RFC 5737 / RFC 3849)."""
import struct, socket, gzip, os
OUT = _os.path.join(HERE, '..', 'trcap'); os.makedirs(OUT, exist_ok=True)

def ip4(a): return socket.inet_aton(a)
def ip6(a): return socket.inet_pton(socket.AF_INET6, a)
def csum(b):
    if len(b) % 2: b += b'\0'
    s = sum(struct.unpack('!%dH' % (len(b)//2), b)); s = (s >> 16) + (s & 0xffff); s += s >> 16
    return (~s) & 0xffff
def eth(payload, et=0x0800, vlans=(), mpls=None):
    h = b'\x02\x00\x00\x00\x00\x01\x02\x00\x00\x00\x00\x02'
    tags = b''
    for i, v in enumerate(vlans):
        tpid = 0x88a8 if (len(vlans) > 1 and i == 0) else 0x8100
        tags += struct.pack('!H', tpid) + struct.pack('!H', v)
    if mpls:
        lab = b''.join(struct.pack('!I', (l << 12) | (0x100 if i == len(mpls)-1 else 0) | 64) for i, l in enumerate(mpls))
        return h + tags + struct.pack('!H', 0x8847) + lab + payload
    return h + tags + struct.pack('!H', et) + payload
def v4(src, dst, proto, payload, ident=1, frag=0, tot=None):
    L = tot if tot is not None else 20 + len(payload)
    h = struct.pack('!BBHHHBBH4s4s', 0x45, 0, L, ident, frag, 64, proto, 0, ip4(src), ip4(dst))
    h = h[:10] + struct.pack('!H', csum(h)) + h[12:]
    return h + payload
def v6(src, dst, nh, payload):
    return struct.pack('!IHBB', 0x60000000, len(payload), nh, 64) + ip6(src) + ip6(dst) + payload
def udp(sp, dp, p): return struct.pack('!HHHH', sp, dp, 8 + len(p), 0) + p
def tcp(sp, dp, seq, ack, fl, p=b''): return struct.pack('!HHIIBBHHH', sp, dp, seq, ack, 0x50, fl, 65535, 0, 0) + p
def sctp(sp, dp, chunks): return struct.pack('!HHII', sp, dp, 0x1234, 0) + b''.join(chunks)
def sdata(ppid, data, tsn=1, flags=3):
    c = struct.pack('!BBHIHHI', 0, flags, 16 + len(data), tsn, 0, 0, ppid) + data
    return c + b'\0' * ((-len(c)) % 4)
def sack(): return struct.pack('!BBHIIHH', 3, 0, 16, 1, 65535, 0, 0)
# ---- Diameter ----
def avp(code, data, vendor=None, flags=0x40):
    if isinstance(data, str): data = data.encode()
    if isinstance(data, int): data = struct.pack('!I', data)
    if vendor: flags |= 0x80
    hl = 12 if vendor else 8
    h = struct.pack('!I', code) + bytes([flags]) + (hl + len(data)).to_bytes(3, 'big') + (struct.pack('!I', vendor) if vendor else b'')
    return h + data + b'\0' * ((-len(data)) % 4)
def dia(cmd, app, req, avps, hbh=1):
    body = b''.join(avps); L = 20 + len(body)
    return bytes([1]) + L.to_bytes(3, 'big') + bytes([0x80 if req else 0]) + cmd.to_bytes(3, 'big') + struct.pack('!III', app, hbh, hbh) + body
# ---- GTP ----
def gtpu(teid, inner, ext85=False, ty=255):
    if ext85:
        ext = bytes([1, 0x10, 9, 0])
        body = struct.pack('!HBB', 0, 0, 0x85) + ext + inner
        return struct.pack('!BBHI', 0x34, ty, len(body), teid) + body
    return struct.pack('!BBHI', 0x30, ty, len(inner), teid) + inner
def ie2(t, val, inst=0): return struct.pack('!BHB', t, len(val), inst) + val
def fteid(it, teid, a4=None, a6=None, inst=0):
    fl = it | (0x80 if a4 else 0) | (0x40 if a6 else 0)
    return ie2(87, bytes([fl]) + struct.pack('!I', teid) + (ip4(a4) if a4 else b'') + (ip6(a6) if a6 else b''), inst)
def gtpv2(ty, ies, teid=0, seq=1, t=True):
    body = b''.join(ies)
    if t: return struct.pack('!BBHI', 0x48, ty, 8 + len(body), teid) + seq.to_bytes(3, 'big') + b'\0' + body
    return struct.pack('!BBH', 0x40, ty, 4 + len(body)) + seq.to_bytes(3, 'big') + b'\0' + body
def gtpv1(ty, ies, teid=0, seq=1):
    body = struct.pack('!HBB', seq, 0, 0) + ies
    return struct.pack('!BBHI', 0x32, ty, len(body), teid) + body
def gsn(a): return struct.pack('!BH', 133, 4) + ip4(a)
# ---- PFCP ----
def pie(t, val): return struct.pack('!HH', t, len(val)) + val
def labels(s): return b''.join(bytes([len(x)]) + x.encode() for x in s.split('.'))
def pfcp(ty, ies, seid=None, seq=1):
    body = b''.join(ies)
    if seid is not None:
        return struct.pack('!BBH', 0x21, ty, 12 + len(body)) + struct.pack('!Q', seid) + seq.to_bytes(3, 'big') + b'\0' + body
    return struct.pack('!BBH', 0x20, ty, 4 + len(body)) + seq.to_bytes(3, 'big') + b'\0' + body
# ---- RADIUS ----
def rad(code, attrs, rid=1):
    body = b''.join(bytes([t, 2 + len(v)]) + v for t, v in attrs)
    return struct.pack('!BBH', code, rid, 20 + len(body)) + b'\x11' * 16 + body
def vsa3gpp(sub, val): return struct.pack('!I', 10415) + bytes([sub, 2 + len(val)]) + val
def inner4(src, dst, n=40): return v4(src, dst, 6, tcp(40000, 443, 1, 1, 0x18, b'x' * n))

# ---- writers ----
class PcapNG:
    def __init__(s): s.b = bytearray(); s.blk(0x0A0D0D0A, struct.pack('<IHHq', 0x1A2B3C4D, 1, 0, -1))
    def blk(s, t, body):
        body += b'\0' * ((-len(body)) % 4); L = 12 + len(body)
        s.b += struct.pack('<II', t, L) + body + struct.pack('<I', L)
    def idb(s, name, lt=1):
        nm = name.encode(); opt = struct.pack('<HH', 2, len(nm)) + nm + b'\0' * ((-len(nm)) % 4) + struct.pack('<HHB3x', 9, 1, 6) + b'\0\0\0\0'
        s.blk(1, struct.pack('<HHI', lt, 0, 65535) + opt)
    def pkt(s, ifid, ts, data):
        t = int(ts * 1e6); s.blk(6, struct.pack('<IIIII', ifid, t >> 32, t & 0xffffffff, len(data), len(data)) + data)
class Pcap:
    def __init__(s, lt=1, be=False, ns=False):
        s.e = '>' if be else '<'; s.ns = ns
        s.b = bytearray(struct.pack(s.e + 'IHHiIII', 0xa1b23c4d if ns else 0xa1b2c3d4, 2, 4, 0, 0, 65535, lt))
    def pkt(s, ts, data):
        sec = int(ts); frac = int((ts - sec) * (1e9 if s.ns else 1e6))
        s.b += struct.pack(s.e + 'IIII', sec, frac, len(data), len(data)) + data

# ===================== capture A: pcapng, two capture interfaces =====================
A = PcapNG(); A.idb('port0'); A.idb('port1')
T = [1700000000.0]
def put(ifid, frame):
    T[0] += 0.001; A.pkt(ifid, T[0], frame)

# 1 Gx P-GW ↔ PCRF over TCP, VLAN 101: handshake, CER/CEA, CCR-I split over two segments, CCA + DWR in one segment
PGW, PCRF, OCS, IMS, AAA, GGSN = '192.0.2.10', '192.0.2.20', '192.0.2.30', '192.0.2.40', '192.0.2.50', '192.0.2.11'
def tcpconv(cli, srv, msgs, vlan, ifid=0, cport=40001, split_first=False):
    cs, ss = 1000, 5000
    put(ifid, eth(v4(cli, srv, 6, tcp(cport, 3868, cs, 0, 0x02)), vlans=[vlan])); cs += 1
    put(ifid, eth(v4(srv, cli, 6, tcp(3868, cport, ss, cs, 0x12)), vlans=[vlan])); ss += 1
    put(ifid, eth(v4(cli, srv, 6, tcp(cport, 3868, cs, ss, 0x10)), vlans=[vlan]))
    for i, (frm_cli, payload) in enumerate(msgs):
        if frm_cli:
            if split_first and i == 2:
                a, b = payload[:30], payload[30:]
                put(ifid, eth(v4(cli, srv, 6, tcp(cport, 3868, cs, ss, 0x18, a)), vlans=[vlan])); cs += len(a)
                put(ifid, eth(v4(cli, srv, 6, tcp(cport, 3868, cs, ss, 0x18, b)), vlans=[vlan])); cs += len(b)
                # a retransmission of the second half must not be decoded twice
                put(ifid, eth(v4(cli, srv, 6, tcp(cport, 3868, cs - len(b), ss, 0x18, b)), vlans=[vlan]))
            else:
                put(ifid, eth(v4(cli, srv, 6, tcp(cport, 3868, cs, ss, 0x18, payload)), vlans=[vlan])); cs += len(payload)
        else:
            put(ifid, eth(v4(srv, cli, 6, tcp(3868, cport, ss, cs, 0x18, payload)), vlans=[vlan])); ss += len(payload)
cer = lambda host, apps: dia(257, 0, True, [avp(264, host), avp(296, 'epc.example.net')] + [avp(258, a) for a in apps])
cea = lambda host: dia(257, 0, False, [avp(268, 2001), avp(264, host), avp(296, 'epc.example.net')])
GX = 16777238
ccri = dia(272, GX, True, [avp(263, 'pgw01;1;1'), avp(264, 'pgw01.epc.example.net'), avp(258, GX), avp(416, 1), avp(1027, 5, 10415), avp(1032, 1004, 10415), avp(8, ip4('203.0.113.5'))])
cca = dia(272, GX, False, [avp(263, 'pgw01;1;1'), avp(268, 2001), avp(264, 'pcrf01.epc.example.net')])
dwr = dia(280, 0, True, [avp(264, 'pgw01.epc.example.net')])
tcpconv(PGW, PCRF, [(True, cer('pgw01.epc.example.net', [GX])), (False, cea('pcrf01.epc.example.net')), (True, ccri), (False, cca + dia(280, 0, True, [avp(264, 'pcrf01.epc.example.net')])), (True, dwr)], 101, split_first=True)
# 2 Gx from a GGSN (IP-CAN-Type 3GPP-GPRS)
ccr_g = dia(272, GX, True, [avp(264, 'ggsn01.example.net'), avp(416, 1), avp(1027, 0, 10415), avp(1032, 1000, 10415)])
tcpconv(GGSN, PCRF, [(True, ccr_g), (False, cca)], 101, cport=40002)
# 3 Gy P-GW ↔ OCS (PS charging) and 4 Ro IMS ↔ OCS
gy = dia(272, 4, True, [avp(264, 'pgw01.epc.example.net'), avp(461, '10.32251@3gpp.org'), avp(416, 1)])
ro = dia(272, 4, True, [avp(264, 'scscf01.ims.example.net'), avp(461, '32260@3gpp.org'), avp(416, 1)])
tcpconv(PGW, OCS, [(True, gy), (False, dia(272, 4, False, [avp(268, 4012), avp(264, 'ocs01.example.net')]))], 102, cport=40003)
tcpconv(IMS, OCS, [(True, ro), (False, dia(272, 4, False, [avp(268, 2001), avp(264, 'ocs01.example.net')]))], 103, cport=40004)
# 5 RADIUS accounting P-GW → AAA on SGi
put(0, eth(v4(PGW, AAA, 17, udp(40100, 1813, rad(4, [(40, struct.pack('!I', 1)), (8, ip4('203.0.113.6')), (32, b'pgw01'), (26, vsa3gpp(21, b'\x06'))]))), vlans=[104]))
put(0, eth(v4(AAA, PGW, 17, udp(1813, 40100, rad(5, []))), vlans=[104]))
# 6 PFCP N4 SMF ↔ UPF with 3GPP Interface Types; the UPF chooses its N3 F-TEID (CH)
SMF, UPFC, UPFU, GNB = '192.0.2.60', '192.0.2.61', '192.0.2.62', '198.51.100.21'
put(0, eth(v4(SMF, UPFC, 17, udp(8805, 8805, pfcp(5, [pie(60, b'\x02' + labels('smf01.5gc.example.net'))], seq=1))), vlans=[201]))
put(0, eth(v4(UPFC, SMF, 17, udp(8805, 8805, pfcp(6, [pie(60, b'\x02' + labels('upf01.5gc.example.net')), pie(19, b'\x01')], seq=1))), vlans=[201]))
pdr = pie(1, pie(56, b'\x00\x01') + pie(2, pie(20, b'\x00') + pie(21, b'\x05') + pie(160, b'\x0b')))
far = pie(3, pie(108, b'\x00\x00\x00\x01') + pie(44, b'\x02\x00') + pie(4, pie(42, b'\x01') + pie(160, b'\x11')))
put(0, eth(v4(SMF, UPFC, 17, udp(8805, 8805, pfcp(50, [pie(60, b'\x02' + labels('smf01.5gc.example.net')), pdr, far], seid=0, seq=7))), vlans=[201]))
put(0, eth(v4(UPFC, SMF, 17, udp(8805, 8805, pfcp(51, [pie(19, b'\x01'), pie(8, pie(56, b'\x00\x01') + pie(21, b'\x01' + struct.pack('!I', 0x1001) + ip4(UPFU)))], seid=1, seq=7))), vlans=[201]))
ufar = pie(10, pie(108, b'\x00\x00\x00\x02') + pie(11, pie(42, b'\x00') + pie(84, b'\x01\x00' + struct.pack('!I', 0x2002) + ip4(GNB)) + pie(160, b'\x0b')))
put(0, eth(v4(SMF, UPFC, 17, udp(8805, 8805, pfcp(52, [ufar], seid=2, seq=8))), vlans=[201]))
put(0, eth(v4(UPFC, SMF, 17, udp(8805, 8805, pfcp(53, [pie(19, b'\x01')], seid=1, seq=8))), vlans=[201]))
# 7 N3 GTP-U with PDU Session Container (port1, VLAN 202); 8 N6 plain IP with the same UE (VLAN 306)
for i in range(6):
    put(1, eth(v4(GNB, UPFU, 17, udp(2152, 2152, gtpu(0x1001, inner4('203.0.113.7', '203.0.113.250'), ext85=True))), vlans=[202]))
    put(1, eth(v4(UPFU, GNB, 17, udp(2152, 2152, gtpu(0x2002, inner4('203.0.113.250', '203.0.113.7'), ext85=True))), vlans=[202]))
    put(1, eth(v4('203.0.113.7', '203.0.113.250', 6, tcp(40000, 443, 1, 1, 0x18, b'y' * 40)), vlans=[306]))
# 9 S11 GTPv2-C MME ↔ SGW-C; S1-U eNB ↔ SGW learned from the bearer contexts
MME, SGWC, SGWU, ENB, PGWC = '192.0.2.80', '192.0.2.81', '192.0.2.70', '198.51.100.10', '192.0.2.90'
csr = gtpv2(32, [fteid(10, 0x10, MME), fteid(7, 0, PGWC, inst=1), ie2(93, ie2(73, b'\x05'))], teid=0, seq=10)
csrsp = gtpv2(33, [ie2(2, b'\x10\x00'), fteid(11, 0x20, SGWC), ie2(93, ie2(73, b'\x05') + ie2(2, b'\x10\x00') + fteid(1, 0x30, SGWU))], teid=0x10, seq=10)
mbr = gtpv2(34, [ie2(93, ie2(73, b'\x05') + fteid(0, 0x40, ENB))], teid=0x20, seq=11)
put(0, eth(v4(MME, SGWC, 17, udp(2123, 2123, csr)), vlans=[301]))
put(0, eth(v4(SGWC, MME, 17, udp(2123, 2123, csrsp)), vlans=[301]))
put(0, eth(v4(MME, SGWC, 17, udp(2123, 2123, mbr)), vlans=[301]))
for i in range(5):
    put(1, eth(v4(ENB, SGWU, 17, udp(2152, 2152, gtpu(0x30, inner4('203.0.113.8', '203.0.113.251')))), vlans=[302]))
    put(1, eth(v4(SGWU, ENB, 17, udp(2152, 2152, gtpu(0x40, inner4('203.0.113.251', '203.0.113.8')))), vlans=[302]))
# 10 SGi plain traffic of the S1-U UE and of the Gx UE (VLAN 205)
for i in range(4):
    put(0, eth(v4('203.0.113.8', '203.0.113.251', 17, udp(5000, 53, b'q' * 30)), vlans=[205]))
    put(0, eth(v4('203.0.113.5', '203.0.113.253', 6, tcp(40000, 80, 1, 1, 0x18, b'z' * 20)), vlans=[205]))
# 11 Gn GTPv1-C SGSN ↔ GGSN and 12 Gn GTP-U + Gi
SGSN, SGSNU, GGSNC, GGSNU = '192.0.2.100', '192.0.2.101', '192.0.2.110', '192.0.2.111'
cpdp = gtpv1(16, struct.pack('!BB', 14, 3) + struct.pack('!BI', 16, 1) + struct.pack('!BI', 17, 2) + struct.pack('!BB', 20, 5) + gsn(SGSN) + gsn(SGSNU))
cpdpr = gtpv1(17, struct.pack('!BB', 1, 128) + struct.pack('!BI', 16, 3) + struct.pack('!BI', 17, 4) + gsn(GGSNC) + gsn(GGSNU), teid=2)
put(0, eth(v4(SGSN, GGSNC, 17, udp(2123, 2123, cpdp)), vlans=[401]))
put(0, eth(v4(GGSNC, SGSN, 17, udp(2123, 2123, cpdpr)), vlans=[401]))
for i in range(3):
    put(1, eth(v4(SGSNU, GGSNU, 17, udp(2152, 2152, gtpu(3, inner4('203.0.113.9', '203.0.113.252')))), vlans=[402]))
    put(0, eth(v4('203.0.113.9', '203.0.113.252', 6, tcp(40000, 443, 1, 1, 0x18, b'g' * 30)), vlans=[403]))
# 13 GTP-U without any signalling (needs a decision), QinQ 10.400
for i in range(7):
    put(1, eth(v4('198.51.100.30', '192.0.2.120', 17, udp(2152, 2152, gtpu(0x77, inner4('203.0.113.20', '203.0.113.254')))), vlans=[10, 400]))
# 14 a fragmented S1-U packet (first fragment, then the rest) and one out of order
big = udp(2152, 2152, gtpu(0x30, inner4('203.0.113.8', '203.0.113.251', 1400)))
f1, f2 = big[:1400], big[1400:]
put(1, eth(v4(ENB, SGWU, 17, f1, ident=77, frag=0x2000), vlans=[302]))
put(1, eth(v4(ENB, SGWU, 17, f2, ident=77, frag=1400 // 8), vlans=[302]))
put(1, eth(v4(ENB, SGWU, 17, f2, ident=78, frag=1400 // 8), vlans=[302]))
put(1, eth(v4(ENB, SGWU, 17, f1, ident=78, frag=0x2000), vlans=[302]))
# 15 S6a over SCTP over IPv6 (ULR with the S6a/S6d-Indicator) and S1AP over SCTP
ulr = dia(316, 16777251, True, [avp(264, 'mme01.epc.example.net'), avp(1405, 0x22, 10415)])
put(0, eth(v6('2001:db8::80', '2001:db8::85', 132, sctp(3868, 3868, [sdata(46, ulr)])), et=0x86dd, vlans=[501]))
put(0, eth(v6('2001:db8::85', '2001:db8::80', 132, sctp(3868, 3868, [sack()])), et=0x86dd, vlans=[501]))
put(0, eth(v4(ENB, MME, 132, sctp(36412, 36412, [sdata(18, b'\x00\x11\x00\x10' + b'\0' * 12)])), vlans=[502]))
put(0, eth(v4(MME, ENB, 132, sctp(36412, 36412, [sack()])), vlans=[502]))
# 16 non-IP, 17 infrastructure, 18 MPLS-encapsulated Gx, 19 Diameter over TLS, 20 truncated
put(0, eth(b'\x00\x01\x08\x00\x06\x04\x00\x01' + b'\0' * 20, et=0x0806))
put(0, eth(b'\x02\x07\x04' + b'\0' * 30, et=0x88cc))
put(0, eth(v4('192.0.2.1', '192.0.2.2', 89, b'\x02\x01' + b'\0' * 30)))
put(0, eth(v4('192.0.2.1', '192.0.2.2', 17, udp(49152, 3784, b'\x20' * 24))))
put(0, eth(v4(PGW, PCRF, 6, tcp(40001, 3868, 99999, 1, 0x10)), mpls=[100, 200]))
put(0, eth(v4('192.0.2.12', PCRF, 6, tcp(40009, 5868, 1, 1, 0x18, b'\x17\x03\x03' + b'\0' * 40)), vlans=[101]))
put(0, eth(b'\x45\x00\x00'))
open(f'{OUT}/a.pcapng', 'wb').write(A.b)
with gzip.open(f'{OUT}/a.pcapng.gz', 'wb') as g: g.write(A.b)
open(f'{OUT}/a-cut.pcapng', 'wb').write(A.b[:len(A.b) - 37])

# ===================== capture B: classic pcap, big-endian, nanoseconds, Linux cooked v1 =====================
B = Pcap(lt=113, be=True, ns=True); t = 1700000100.0
def sll(p, et=0x0800): return struct.pack('!HHH8sH', 0, 1, 6, b'\x02\0\0\0\0\x09\0\0', et) + p
# CUPS: PFCP Sxa (S1-U + S5/S8-U) and Sxb (S5/S8-U + SGi) without the UP choosing the F-TEID
for i, (cp, up, it_a, it_b) in enumerate([('192.0.2.130', '192.0.2.131', 0, 1), ('192.0.2.140', '192.0.2.141', 1, 16)]):
    pdr = pie(1, pie(56, b'\x00\x01') + pie(2, pie(20, b'\x00') + pie(21, b'\x01' + struct.pack('!I', 5) + ip4('192.0.2.%d' % (150 + i))) + pie(160, bytes([it_a]))))
    far = pie(3, pie(108, b'\x00\x00\x00\x01') + pie(4, pie(42, b'\x01') + pie(160, bytes([it_b]))))
    t += .01; B.pkt(t, sll(v4(cp, up, 17, udp(8805, 8805, pfcp(50, [pdr, far], seid=0, seq=20 + i)))))
# PFCP without any interface type (needs a decision)
t += .01; B.pkt(t, sll(v4('192.0.2.160', '192.0.2.161', 17, udp(8805, 8805, pfcp(1, [pie(96, b'\0\0\0\1')], seq=3)))))
# Gx with no IP-CAN-Type (likely P-GW)
t += .01; B.pkt(t, sll(v4('192.0.2.170', PCRF, 6, tcp(40010, 3868, 1, 1, 0x18, dia(272, GX, True, [avp(264, 'gw.example.net'), avp(416, 2)])))))
open(f'{OUT}/b.pcap', 'wb').write(B.b)

# ===================== capture C: little-endian µs pcap, raw IP, a 2.5 MB file to exercise the progress bar =====================
C = Pcap(lt=101); t = 1700000200.0
for i in range(20000):
    t += .0001; C.pkt(t, v4('198.51.100.%d' % (40 + i % 8), '192.0.2.70', 17, udp(2152, 2152, gtpu(0x50 + i % 8, inner4('203.0.113.%d' % (30 + i % 50), '203.0.113.249', 60)))))
open(f'{OUT}/c.pcap', 'wb').write(C.b)
open(f'{OUT}/not-a-capture.pcap', 'wb').write(b'hello world, this is text')
print({f: os.path.getsize(f'{OUT}/{f}') for f in sorted(os.listdir(OUT))})
