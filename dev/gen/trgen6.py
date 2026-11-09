#!/usr/bin/env python3
import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
"""GTP-U without signalling: tunnels oriented by the TCP set-up inside them (documentation addresses only)."""
src=open(_os.path.join(HERE,'trgen.py')).read().split('# ===================== capture A')[0]
ns={'__file__':_os.path.join(HERE,'trgen.py')};exec(src,ns);globals().update({k:v for k,v in ns.items() if not k.startswith('__')})
OUT=_os.path.join(HERE,'..','trcap')
UPF,SGW='198.51.100.41','198.51.100.42'
GNB1,ENB,GNB3,GNB4='192.0.2.31','192.0.2.32','192.0.2.33','192.0.2.34'
SRV,SRV2='198.51.100.200','198.51.100.210'   # SRV2: behind the tunnels whose ends come from fan-out
UL,DL,BI=[],[],[]          # dpdk0: uplink only, dpdk1: downlink only, eth2: both
def gu(a,b,inner,ext,vl,teid=0x100):
    return eth(v4(a,b,17,udp(2152,2152,gtpu(teid,inner,ext85=ext))),vlans=[vl])
def conn(L_up,L_dn,ran,core,ue,port,ext,vl,n=3,ue_opens=True,SRV=SRV):
    """one TCP connection inside the tunnel ran↔core; ue_opens=False: the server opens it (SYN downlink)"""
    c,s=(ue,SRV) if ue_opens else (SRV,ue)
    cp,sp=(port,443) if ue_opens else (port,22)
    syn=v4(c,s,6,tcp(cp,sp,1,0,0x02));sa=v4(s,c,6,tcp(sp,cp,1,2,0x12))
    (L_up if ue_opens else L_dn).append(gu(*((ran,core) if ue_opens else (core,ran)),syn,ext,vl))
    (L_dn if ue_opens else L_up).append(gu(*((core,ran) if ue_opens else (ran,core)),sa,ext,vl))
    for k in range(n):
        L_up.append(gu(ran,core,v4(ue,SRV,6,tcp(port,443,2+k,2,0x18,b'u'*60)),ext,vl))
        L_dn.append(gu(core,ran,v4(SRV,ue,6,tcp(443,port,2+k,2,0x18,b'd'*900)),ext,vl))
# 1 · N3 (PDU Session Container), gNB 1 ↔ UPF: 4 UE-opened connections, one of them IPv6 – split over the two probe ports
for i in range(4):conn(UL,DL,GNB1,UPF,'203.0.113.50',40000+i,True,300)
UL.append(gu(GNB1,UPF,v6('2001:db8:50::1','2001:db8:99::443',6,tcp(40100,443,1,0,0x02)),True,300))
DL.append(gu(UPF,GNB1,v6('2001:db8:99::443','2001:db8:50::1',6,tcp(443,40100,1,2,0x12)),True,300))
# 2 · no extension header, no signalling, eNodeB ↔ SGW on VLAN 301 (undecided until assigned): 3 connections, uplink on dpdk0
for i in range(3):conn(UL,DL,ENB,SGW,'203.0.113.60',41000+i,False,301,n=2)
# 3 · N3, gNB 3: 2 UE-opened and 2 server-opened connections – mixed, the direction stays open (fan-out names the ends)
for i in range(2):conn(BI,BI,GNB3,UPF,'203.0.113.70',42000+i,True,302,SRV=SRV2)
for i in range(2):conn(BI,BI,GNB3,UPF,'203.0.113.70',42100+i,True,302,ue_opens=False,SRV=SRV2)
# 4 · N3, gNB 4: only 2 handshakes (4 SYN / SYN-ACK packets) – too few; plus a later IPv4 fragment whose bytes look like a SYN (must not count)
for i in range(2):conn(BI,BI,GNB4,UPF,'203.0.113.80',43000+i,True,302,SRV=SRV2)
fr=v4('203.0.113.80',SRV2,6,tcp(43009,443,1,0,0x02),ident=9,frag=0x0010)
BI.append(gu(GNB4,UPF,fr,True,302))
# the UE of tunnel 1 on N6 (plain IP, VLAN 500) – data only, no handshakes: its direction follows from the tunnel
for k in range(5):
    UL.append(eth(v4('203.0.113.50',SRV,17,udp(50000,443,b'q'*80)),vlans=[500]))
    DL.append(eth(v4(SRV,'203.0.113.50',17,udp(443,50000,b'Q'*1000)),vlans=[500]))
A=PcapNG();A.idb('dpdk0');A.idb('dpdk1');A.idb('eth2');t=1700003000.0
for k in range(max(len(UL),len(DL),len(BI))):
    for i,L in enumerate((UL,DL,BI)):
        if k<len(L):t+=.001;A.pkt(i,t,L[k])
open(f'{OUT}/h-gtpu-tcp.pcapng','wb').write(A.b)
print('ok',len(UL),len(DL),len(BI))
