const E=require('../env');
const { chromium } = require('playwright');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m);}else console.log('ok  ',m);};
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob,null,{timeout:30000});await p.waitForTimeout(300);};
const ports=p=>p.evaluate(()=>TR.ports.map(x=>({name:x.name,v:x.v,cv:x.cv,ul:x.ul,dl:x.dl,unk:x.unk,links:[...x.links.values()].map(e=>e.k+(e.up?` ul${e.ul}/dl${e.dl}/?${e.unk}`:' '+Object.keys(e.pair).join('&'))).join(' | ')})));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(E.APP);await p.waitForTimeout(300);
/* 1 one pcapng, two DPDK ports: uplink on dpdk0, downlink on dpdk1 */
await load(p,E.CAP+'/d.pcapng');
let P=await ports(p);console.log(JSON.stringify(P,null,1));
ok(P[0].name==='dpdk0'&&P[0].v==='up'&&P[0].dl===0&&P[0].unk===0,'dpdk0: uplink only (S1-U and SGi)');
ok(P[1].name==='dpdk1'&&P[1].v==='down'&&P[1].ul===0,'dpdk1: downlink only');
ok(P[0].cv==='one'&&P[1].cv==='one','signalling: one direction per port');
ok(/s1u ul300\/dl0\/\?0/.test(P[0].links)&&/sgi ul300\/dl0\/\?0/.test(P[0].links),'per interface on dpdk0: S1-U 300 up, SGi 300 up, nothing unknown');
ok(/gx PGW → PCRF/.test(P[0].links)&&/gx PCRF → PGW/.test(P[1].links)&&/s11 MME → SGW/.test(P[0].links)&&/n4 SMF → UPF/.test(P[0].links),'signalling: PGW → PCRF, MME → SGW, SMF → UPF on dpdk0; the reverse on dpdk1');
ok(await p.evaluate(()=>/<td>S1-U, SGi<\/td><td>↑ <b>[^<]*dpdk0<\/b><\/td><td>↓ <b>[^<]*dpdk1<\/b><\/td>/.test(panel.innerHTML)),'pairing note: dpdk0 / dpdk1 carry the two directions of S1-U, SGi');
ok(await p.evaluate(()=>{const r=TR.rows.find(r=>r.canon==='s1u');return r.ul===300&&r.dl===300&&/↑ 50 % · ↓ 50 %/.test(panel.querySelector('tr[data-trr="s1u"]').textContent);}),'S1-U row shows ↑ 50 % · ↓ 50 %');
ok(await p.evaluate(()=>{const u=TR.ue;return u.get(trV4(new Uint8Array([203,0,113,1]),0)).ue===true&&u.get(trV4(new Uint8Array([203,0,113,200]),0)).ue===false;}),'UE address vs server told apart by direction inside GTP-U');
ok(await p.evaluate(()=>TR.roles.has('192.0.2.62')),'PFCP Created PDR paired across the two ports');
/* 2 the same traffic as two files – read in the order “downlink first” */
await load(p,[E.CAP+'/port-dl.pcap',E.CAP+'/port-ul.pcap']);
P=await ports(p);
ok(P.length===2&&P[0].name==='port-dl.pcap'&&P[0].v==='down'&&P[1].name==='port-ul.pcap'&&P[1].v==='up','two files: port-dl.pcap downlink, port-ul.pcap uplink');
ok(await p.evaluate(()=>TR.file.name==='2 files'&&TR.file.files.length===2&&TR.roles.has('192.0.2.62')),'two files analysed together; PFCP response read before its request still pairs');
ok(await p.evaluate(()=>/Files: /.test(panel.textContent)),'summary lists the files');
/* 3 a bad file among good ones is skipped and reported */
await load(p,[E.CAP+'/not-a-capture.pcap',E.CAP+'/port-ul.pcap']);
ok(await p.evaluate(()=>TR&&TR.file.files[0].err&&TR.file.files[1].pk>0&&/could not be read/.test(panel.textContent)),'unreadable file reported, the other analysed');
/* 4 suggestions for the network data */
await load(p,E.CAP+'/a.pcapng');
ok(await p.evaluate(()=>!ND&&!!panel.querySelector('[data-ta="ndsug"]')),'“Add to network data…” offered without network data');
await p.click('[data-ta="ndsug"]');await p.waitForTimeout(200);
let S=await p.evaluate(()=>[...document.querySelectorAll('.trsg')].map(g=>g.querySelector('.trsgel').textContent+'/'+g.querySelector('input[data-n]').value+': '+[...g.querySelectorAll('.trsga')].map(a=>(a.querySelector('input').checked?'☑':'☐')+a.querySelector('.trsgif').textContent+' '+a.querySelector('code').textContent+' '+a.querySelector('.trsgp').textContent+' '+a.querySelector('.trsgv').textContent).join(', ')));
console.log(S.join('\n'));
const has=re=>S.some(x=>re.test(x));
ok(has(/^PCRF\/pcrf01: ☑Gx ↔ PGW 192\.0\.2\.20 port 3868 VLAN 101, ☑Gx ↔ GGSN 192\.0\.2\.20/),'PCRF: the two Gx interfaces told apart (↔ PGW, ↔ GGSN)');
ok(has(/^SGW\/SGW 192\.0\.2\.70: ☑S1-U ↔ eNodeB 192\.0\.2\.70 port 2152 VLAN 302/),'SGW S1-U address, port 2152, VLAN 302, selected');
ok(has(/^eNodeB\/eNodeB 198\.51\.100\.10: ☑S1-U ↔ SGW 198\.51\.100\.10 port 2152 VLAN 302/),'eNodeB S1-U address selected');
ok(has(/^PCRF\/pcrf01: ☑Gx ↔ PGW 192\.0\.2\.20 port 3868 VLAN 101/),'PCRF named from Origin-Host, Gx port 3868');
ok(has(/^PGW\/pgw01: .*☑Gx ↔ PCRF 192\.0\.2\.10  VLAN 101.*☐Gy \/ Gz ↔ OCS \/ OFCS 192\.0\.2\.10/),'P-GW: Gx selected (client, no port), Gy likely and not selected');
ok(has(/^UPF\/upf01: ☑N4 ↔ SMF 192\.0\.2\.61 port 8805/)&&has(/^SMF\/smf01: ☑N4 ↔ UPF 192\.0\.2\.60 port 8805/),'SMF / UPF named from the PFCP Node ID');
ok(!has(/203\.0\.113\./),'no UE or internet addresses suggested');
await p.fill('input[data-n]',(await p.inputValue('input[data-n]')));
await p.click('.mbtns .primary');await p.waitForTimeout(300);
const nd=await p.evaluate(()=>({n:ND.network,dirty:NDdirty,inst:ND.instances.map(I=>I.element+':'+I.name+'['+I.addresses.map(A=>A.interface+'='+A.ip+(A.port?':'+A.port:'')+(A.vlan?'/v'+A.vlan:'')).join(',')+']'),warn:NDwarn,note:ND.instances[0].addresses[0].note}));
console.log(JSON.stringify(nd,null,1));
ok(nd.dirty&&nd.n==='Network from trace analysis'&&nd.warn.length===0,'network data created, unsaved, no validation warnings');
ok(nd.inst.some(x=>x==='sgw:SGW 192.0.2.70[s1u=192.0.2.70:2152/v302]'),'instance SGW with its S1-U address');
ok(/^trace a\.pcapng: certain – /.test(nd.note),'each address notes its source and evidence');
ok(await p.evaluate(()=>/◆ pcrf01/.test(panel.textContent)),'the trace now names the elements from the network data');
await p.click('[data-ta="ndsug"]');await p.waitForTimeout(200);
{const [d,all]=await p.evaluate(()=>[document.querySelectorAll('.trsga input:disabled').length,[...document.querySelectorAll('.trsga input:not(:disabled)')].map(c=>c.closest('.trsga').querySelector('.trsgif').textContent+' '+c.closest('.trsga').querySelector('code').textContent).sort().join('|')]);
 ok(d===22&&all==='Gy / Gz ↔ OCS / OFCS 192.0.2.10|Gy / Gz ↔ PGW 192.0.2.30|SGi ↔ PGW 192.0.2.50|SGi ↔ Packet Data Networks 192.0.2.10','second time: the 22 added addresses are disabled; only the likely Gy and SGi ones remain, still as Gy (not Ro) → '+d+' / '+all);}
await p.click('.mbtns button:not(.primary)');
/* 5 one listed address must not override protocol evidence: the Gy flow stays Gy */
ok(await p.evaluate(()=>{const f=TR.flows.find(f=>f.cls==='dia'&&f.app===4&&f.A==='192.0.2.10');return f.res.links[0]==='gy4g';}),'Gy stays Gy although the OCS address is listed on Ro');
await p.evaluate(()=>{ND=null;NDdirty=false;ndRefresh();});
console.log('errors',errs.length?errs:'none');if(errs.length)fails++;
console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
