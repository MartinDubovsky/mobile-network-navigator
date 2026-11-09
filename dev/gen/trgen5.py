#!/usr/bin/env python3
import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
"""SGi without signalling: the direction from TCP connection set-up (documentation addresses only)."""
src=open(_os.path.join(HERE,'trgen.py')).read().split('# ===================== capture A')[0]
ns={'__file__':_os.path.join(HERE,'trgen.py')};exec(src,ns);globals().update({k:v for k,v in ns.items() if not k.startswith('__')})
OUT=_os.path.join(HERE,'..','trcap')
UL,DL,BI=[],[],[]
SRV=['198.51.100.200','198.51.100.201','198.51.100.202']
ue=lambda i:'203.0.113.%d'%(10+i)
# probe ports split by direction: dpdk0 uplink only, dpdk1 downlink only (VLAN 400)
for i in range(10):
    u,s=ue(i),SRV[i%3];p=40000+i
    UL.append(eth(v4(u,s,6,tcp(p,443,100,0,0x02)),vlans=[400]))            # SYN
    DL.append(eth(v4(s,u,6,tcp(443,p,900,101,0x12)),vlans=[400]))          # SYN-ACK
    UL.append(eth(v4(u,s,6,tcp(p,443,101,901,0x10)),vlans=[400]))          # ACK
    for k in range(8):
        UL.append(eth(v4(u,s,6,tcp(p,443,101+k*100,901,0x18,b'u'*100)),vlans=[400]))
        DL.append(eth(v4(s,u,6,tcp(443,p,901+k*1200,101,0x18,b'd'*1200)),vlans=[400]))
        DL.append(eth(v4(s,u,6,tcp(443,p,2101+k*1200,101,0x10,b'd'*1200)),vlans=[400]))
    UL.append(eth(v4(u,s,17,udp(50000+i,443,b'q'*60)),vlans=[400]))       # QUIC from the same UE
    DL.append(eth(v4(s,u,17,udp(443,50000+i,b'Q'*1200)),vlans=[400]))
# an internet scanner probing two of the UEs (downlink SYNs, uplink RSTs)
for i in range(2):
    DL.append(eth(v4('192.0.2.250',ue(i),6,tcp(61000,22,7,0,0x02)),vlans=[400]))
    UL.append(eth(v4(ue(i),'192.0.2.250',6,tcp(22,61000,0,8,0x14)),vlans=[400]))
# a third port with both directions (VLAN 401)
for i in range(10,14):
    u,s=ue(i),SRV[i%3];p=41000+i
    BI.append(eth(v4(u,s,6,tcp(p,80,1,0,0x02)),vlans=[401]));BI.append(eth(v4(s,u,6,tcp(80,p,1,2,0x12)),vlans=[401]))
    for k in range(5):BI.append(eth(v4(u,s,6,tcp(p,80,2,2,0x18,b'u'*80)),vlans=[401]));BI.append(eth(v4(s,u,6,tcp(80,p,2,2,0x18,b'd'*900)),vlans=[401]))
A=PcapNG();A.idb('dpdk0');A.idb('dpdk1');A.idb('eth2');t=1700002000.0
for k in range(max(len(UL),len(DL),len(BI))):
    for i,L in enumerate((UL,DL,BI)):
        if k<len(L):t+=.001;A.pkt(i,t,L[k])
open(f'{OUT}/g-sgi.pcapng','wb').write(A.b)
print('ok',len(UL),len(DL),len(BI))
