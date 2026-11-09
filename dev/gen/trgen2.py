#!/usr/bin/env python3
import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
"""Direction tests: uplink on one capture interface, downlink on the other (documentation addresses only)."""
import struct
src=open(_os.path.join(HERE,'trgen.py')).read().split('# ===================== capture A')[0]
ns={'__file__':_os.path.join(HERE,'trgen.py')};exec(src,ns);globals().update({k:v for k,v in ns.items() if not k.startswith('__')})
OUT=_os.path.join(HERE,'..','trcap')
UL,DL=[],[]   # (frame) lists
MME,SGWC,SGWU,PGWC='192.0.2.80','192.0.2.81','192.0.2.70','192.0.2.90'
ENBS=['198.51.100.%d'%(10+i) for i in range(3)]
for i,enb in enumerate(ENBS):   # S11: requests MME→SGW on dpdk0, responses on dpdk1
    UL.append(eth(v4(MME,SGWC,17,udp(2123,2123,gtpv2(32,[fteid(10,0x10+i,MME),ie2(93,ie2(73,b'\x05'))],seq=10+i))),vlans=[301]))
    DL.append(eth(v4(SGWC,MME,17,udp(2123,2123,gtpv2(33,[ie2(2,b'\x10\x00'),fteid(11,0x20+i,SGWC),ie2(93,ie2(73,b'\x05')+ie2(2,b'\x10\x00')+fteid(1,0x30+i,SGWU))],teid=0x10+i,seq=10+i))),vlans=[301]))
    UL.append(eth(v4(MME,SGWC,17,udp(2123,2123,gtpv2(34,[ie2(93,ie2(73,b'\x05')+fteid(0,0x40+i,enb))],teid=0x20+i,seq=40+i))),vlans=[301]))
    DL.append(eth(v4(SGWC,MME,17,udp(2123,2123,gtpv2(35,[ie2(2,b'\x10\x00')],teid=0x10+i,seq=40+i))),vlans=[301]))
ue=lambda i:'203.0.113.%d'%(1+i%30); srv=lambda i:'203.0.113.%d'%(200+i%20)
for i in range(300):   # S1-U and SGi: uplink on dpdk0, downlink on dpdk1
    UL.append(eth(v4(ENBS[i%3],SGWU,17,udp(2152,2152,gtpu(0x30+i%3,inner4(ue(i),srv(i),100)))),vlans=[302]))
    DL.append(eth(v4(SGWU,ENBS[i%3],17,udp(2152,2152,gtpu(0x40+i%3,inner4(srv(i),ue(i),900)))),vlans=[302]))
    UL.append(eth(v4(ue(i),srv(i),6,tcp(40000,443,i,1,0x18,b'u'*80)),vlans=[205]))
    DL.append(eth(v4(srv(i),ue(i),6,tcp(443,40000,1,i,0x18,b'd'*900)),vlans=[205]))
# Gx: requests on dpdk0, answers on dpdk1 (each TCP direction re-assembled on its own)
GX=16777238;PGW,PCRF='192.0.2.10','192.0.2.20'
ccr=dia(272,GX,True,[avp(264,'pgw01.epc.example.net'),avp(416,1),avp(1027,5,10415)]);cca=dia(272,GX,False,[avp(268,2001),avp(264,'pcrf01.epc.example.net')])
cs,ss=1000,5000
for i in range(5):
    UL.append(eth(v4(PGW,PCRF,6,tcp(40001,3868,cs,ss,0x18,ccr)),vlans=[101]));cs+=len(ccr)
    DL.append(eth(v4(PCRF,PGW,6,tcp(3868,40001,ss,cs,0x18,cca)),vlans=[101]));ss+=len(cca)
# PFCP: request on dpdk0, response with the Created PDR on dpdk1 (the response file may be read first)
SMF,UPFC,UPFU='192.0.2.60','192.0.2.61','192.0.2.62'
pdr=pie(1,pie(56,b'\x00\x01')+pie(2,pie(20,b'\x00')+pie(21,b'\x05')+pie(160,b'\x0b')))
UL.append(eth(v4(SMF,UPFC,17,udp(8805,8805,pfcp(50,[pdr],seid=0,seq=7))),vlans=[201]))
DL.append(eth(v4(UPFC,SMF,17,udp(8805,8805,pfcp(51,[pie(19,b'\x01'),pie(8,pie(56,b'\x00\x01')+pie(21,b'\x01'+struct.pack('!I',0x1001)+ip4(UPFU)))],seid=1,seq=7))),vlans=[201]))
A=PcapNG();A.idb('dpdk0');A.idb('dpdk1');t=1700001000.0
for k in range(max(len(UL),len(DL))):
    if k<len(UL):t+=.001;A.pkt(0,t,UL[k])
    if k<len(DL):t+=.001;A.pkt(1,t,DL[k])
open(f'{OUT}/d.pcapng','wb').write(A.b)
for name,L in (('ul',UL),('dl',DL)):
    P=Pcap(lt=1);t=1700001000.0
    for fr in L:t+=.001;P.pkt(t,fr)
    open(f'{OUT}/port-{name}.pcap','wb').write(P.b)
print(len(UL),len(DL))
