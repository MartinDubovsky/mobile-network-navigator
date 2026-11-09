import struct, random
import os
VDIR=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(VDIR,'..','gen','trgen.py')).read().split('# ===================== capture A')[0]
ns={'__file__':os.path.join(VDIR,'..','gen','trgen.py')}; exec(src, ns); globals().update({k:v for k,v in ns.items() if not k.startswith('__')})
random.seed(7)
A=PcapNG(); A.idb('probe-port-1'); A.idb('probe-port-2')
T=[1730000000.0]
def put(i,f,dt=0.00004): T[0]+=dt; A.pkt(i,T[0],f)
PGW,PCRF,OCS,IMS,AAA,GGSN='192.0.2.10','192.0.2.20','192.0.2.30','192.0.2.40','192.0.2.50','192.0.2.11'
GX=16777238
def diaseg(cli,srv,msgs,vlan,cport):
    cs,ss=1000,5000
    put(0,eth(v4(cli,srv,6,tcp(cport,3868,cs,0,0x02)),vlans=[vlan]));cs+=1
    put(0,eth(v4(srv,cli,6,tcp(3868,cport,ss,cs,0x12)),vlans=[vlan]));ss+=1
    for frm,p in msgs:
        if frm: put(0,eth(v4(cli,srv,6,tcp(cport,3868,cs,ss,0x18,p)),vlans=[vlan]));cs+=len(p)
        else: put(0,eth(v4(srv,cli,6,tcp(3868,cport,ss,cs,0x18,p)),vlans=[vlan]));ss+=len(p)
# Gx (EPS + GPRS), Gy, Ro, RADIUS
ccr=lambda host,ipcan,rat,ue: dia(272,GX,True,[avp(264,host),avp(416,1),avp(1027,ipcan,10415),avp(1032,rat,10415),avp(8,ip4(ue))])
cca=dia(272,GX,False,[avp(268,2001),avp(264,'pcrf01.epc.example.net')])
diaseg(PGW,PCRF,[(True,dia(257,0,True,[avp(264,'pgw01.epc.example.net'),avp(258,GX)])),(False,dia(257,0,False,[avp(268,2001),avp(264,'pcrf01.epc.example.net')]))]+[x for i in range(120) for x in [(True,ccr('pgw01.epc.example.net',5,1004,'203.0.113.%d'%(1+i%60))),(False,cca)]],101,40001)
diaseg(GGSN,PCRF,[x for i in range(40) for x in [(True,ccr('ggsn01.example.net',0,1000,'203.0.113.%d'%(150+i%20))),(False,cca)]],101,40002)
gy=dia(272,4,True,[avp(264,'pgw01.epc.example.net'),avp(461,'10.32251@3gpp.org'),avp(416,2)])
diaseg(PGW,OCS,[x for i in range(90) for x in [(True,gy),(False,dia(272,4,False,[avp(268,2001),avp(264,'ocs01.example.net')]))]],102,40003)
ro=dia(272,4,True,[avp(264,'scscf01.ims.example.net'),avp(461,'32260@3gpp.org'),avp(416,1)])
diaseg(IMS,OCS,[x for i in range(30) for x in [(True,ro),(False,dia(272,4,False,[avp(268,2001),avp(264,'ocs01.example.net')]))]],103,40004)
for i in range(80):
    put(0,eth(v4(PGW,AAA,17,udp(40100,1813,rad(4,[(40,struct.pack('!I',3)),(8,ip4('203.0.113.%d'%(1+i%60))),(32,b'pgw01'),(26,vsa3gpp(21,b'\x06'))]))),vlans=[104]))
    put(0,eth(v4(AAA,PGW,17,udp(1813,40100,rad(5,[]))),vlans=[104]))
# S11 + S1-U for 6 eNodeBs
MME,SGWC,SGWU,PGWC='192.0.2.80','192.0.2.81','192.0.2.70','192.0.2.90'
ENBS=['198.51.100.%d'%(10+i) for i in range(6)]
for i,enb in enumerate(ENBS):
    put(0,eth(v4(MME,SGWC,17,udp(2123,2123,gtpv2(32,[fteid(10,0x10+i,MME),fteid(7,0,PGWC,inst=1),ie2(93,ie2(73,b'\x05'))],seq=10+i))),vlans=[301]))
    put(0,eth(v4(SGWC,MME,17,udp(2123,2123,gtpv2(33,[ie2(2,b'\x10\x00'),fteid(11,0x20+i,SGWC),ie2(93,ie2(73,b'\x05')+ie2(2,b'\x10\x00')+fteid(1,0x30+i,SGWU))],teid=0x10+i,seq=10+i))),vlans=[301]))
    put(0,eth(v4(MME,SGWC,17,udp(2123,2123,gtpv2(34,[ie2(93,ie2(73,b'\x05')+fteid(0,0x40+i,enb))],teid=0x20+i,seq=40+i))),vlans=[301]))
    put(0,eth(v4(SGWC,MME,17,udp(2123,2123,gtpv2(35,[ie2(2,b'\x10\x00')],teid=0x10+i,seq=40+i))),vlans=[301]))
# PFCP N4 and 4 gNBs
SMF,UPFC,UPFU='192.0.2.60','192.0.2.61','192.0.2.62'
GNBS=['198.51.100.%d'%(21+i) for i in range(4)]
put(0,eth(v4(SMF,UPFC,17,udp(8805,8805,pfcp(5,[pie(60,b'\x02'+labels('smf01.5gc.example.net'))],seq=1))),vlans=[201]))
put(0,eth(v4(UPFC,SMF,17,udp(8805,8805,pfcp(6,[pie(60,b'\x02'+labels('upf01.5gc.example.net')),pie(19,b'\x01')],seq=1))),vlans=[201]))
for i,g in enumerate(GNBS):
    pdr=pie(1,pie(56,b'\x00\x01')+pie(2,pie(20,b'\x00')+pie(21,b'\x05')+pie(160,b'\x0b')))
    far=pie(3,pie(108,b'\x00\x00\x00\x01')+pie(44,b'\x02\x00')+pie(4,pie(42,b'\x01')+pie(160,b'\x11')))
    put(0,eth(v4(SMF,UPFC,17,udp(8805,8805,pfcp(50,[pie(60,b'\x02'+labels('smf01.5gc.example.net')),pdr,far],seid=0,seq=7+i))),vlans=[201]))
    put(0,eth(v4(UPFC,SMF,17,udp(8805,8805,pfcp(51,[pie(19,b'\x01'),pie(8,pie(56,b'\x00\x01')+pie(21,b'\x01'+struct.pack('!I',0x1001+i)+ip4(UPFU)))],seid=1,seq=7+i))),vlans=[201]))
    ufar=pie(10,pie(108,b'\x00\x00\x00\x02')+pie(11,pie(42,b'\x00')+pie(84,b'\x01\x00'+struct.pack('!I',0x2002+i)+ip4(g))+pie(160,b'\x0b')))
    put(0,eth(v4(SMF,UPFC,17,udp(8805,8805,pfcp(52,[ufar],seid=2,seq=30+i))),vlans=[201]))
    put(0,eth(v4(UPFC,SMF,17,udp(8805,8805,pfcp(53,[pie(19,b'\x01')],seid=1,seq=30+i))),vlans=[201]))
# Gn
SGSN,SGSNU,GGSNC,GGSNU='192.0.2.100','192.0.2.101','192.0.2.110','192.0.2.111'
put(0,eth(v4(SGSN,GGSNC,17,udp(2123,2123,gtpv1(16,struct.pack('!BB',14,3)+struct.pack('!BI',16,1)+struct.pack('!BI',17,2)+struct.pack('!BB',20,5)+gsn(SGSN)+gsn(SGSNU)))),vlans=[401]))
put(0,eth(v4(GGSNC,SGSN,17,udp(2123,2123,gtpv1(17,struct.pack('!BB',1,128)+struct.pack('!BI',16,3)+struct.pack('!BI',17,4)+gsn(GGSNC)+gsn(GGSNU),teid=2))),vlans=[401]))
# bulk user plane (cycled pre-built frames)
def bulk(n,frames,ifid):
    L=len(frames)
    for k in range(n): put(ifid,frames[k%L],0.00002)
ue=lambda i:'203.0.113.%d'%(1+i%60)
srv=lambda i:'203.0.113.%d'%(200+i%40)
s1u=[eth(v4(ENBS[i%6],SGWU,17,udp(2152,2152,gtpu(0x30+i%6,inner4(ue(i),srv(i),random.choice([60,400,1200]))))),vlans=[302]) for i in range(120)]
s1u+=[eth(v4(SGWU,ENBS[i%6],17,udp(2152,2152,gtpu(0x40+i%6,inner4(srv(i),ue(i),1300)))),vlans=[302]) for i in range(120)]
n3=[eth(v4(GNBS[i%4],UPFU,17,udp(2152,2152,gtpu(0x1001+i%4,inner4('203.0.113.%d'%(100+i%40),srv(i),800),ext85=True))),vlans=[202]) for i in range(80)]
gn=[eth(v4(SGSNU,GGSNU,17,udp(2152,2152,gtpu(3,inner4('203.0.113.%d'%(150+i%20),srv(i),500)))),vlans=[402]) for i in range(40)]
sgi=[eth(v4(ue(i),srv(i),6,tcp(40000,443,i,1,0x18,b'p'*random.choice([40,600,1300]))),vlans=[205]) for i in range(120)]
n6=[eth(v4('203.0.113.%d'%(100+i%40),srv(i),6,tcp(40000,443,i,1,0x18,b'q'*700)),vlans=[306]) for i in range(80)]
gi=[eth(v4('203.0.113.%d'%(150+i%20),srv(i),6,tcp(40000,443,i,1,0x18,b'g'*500)),vlans=[403]) for i in range(40)]
unk=[eth(v4('198.51.100.%d'%(60+i%3),'192.0.2.120',17,udp(2152,2152,gtpu(0x77,inner4('203.0.113.%d'%(50+i%9),srv(i),900)))),vlans=[10,400]) for i in range(30)]
bulk(310000,s1u,1);bulk(170000,n3,1);bulk(48000,gn,1);bulk(230000,sgi,0);bulk(120000,n6,0);bulk(30000,gi,0);bulk(36000,unk,1)
for i in range(200): put(0,eth(v4(SMF,UPFC,17,udp(8805,8805,pfcp(1,[pie(96,b'\0\0\0\1')],seq=900+i))),vlans=[201]))
open(os.path.join(VDIR,'demo-probe.pcapng'),'wb').write(A.b)
print(len(A.b)/1e6,'MB')
