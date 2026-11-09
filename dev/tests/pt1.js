const E=require('../env');
const { chromium } = require('playwright');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);};
const rows=p=>p.evaluate(()=>Object.fromEntries(TR.rows.map(r=>[r.canon,Object.keys(r.conf).join('/')+':'+Object.keys(r.cls).join('/')])));
const ND1={format:'mobile-network-navigator/netdata',version:1,network:'Ports test',instances:[],interfaces:{},
 ports:[{protocol:'Diameter',transport:'any',ports:'3870;3900',note:'Gx and S6a peers'},{protocol:'radius',transport:'udp',ports:'31812-31813'},{protocol:'SGsAP',ports:'29200'},{protocol:'PFCP',transport:'UDP',ports:'8806'}]};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(E.APP);await p.waitForTimeout(200);await p.click('#trbtn');
await load(p,E.CAP+'/f-ports.pcap');
let r=await rows(p);console.log('without ports',JSON.stringify(r));
ok(!r.gx&&!r.s6a&&!r.sgs&&!r.n4,'without protocol ports: Gx, S6a, SGs, N4 not found');
ok(await p.evaluate(()=>!document.querySelector('#panel .trpm')),'no “your protocol ports” line');
// a manual choice for a plain-IP group survives the re-read
const gk=await p.evaluate(()=>{const G=TR.groups.find(g=>g.gk.startsWith('plain'));return G?G.gk:null;});
// load network data with ports → the trace is read again
await p.evaluate(async j=>{await ndLoadText(JSON.stringify(j),'ports.json');},ND1);
await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);
r=await rows(p);console.log('with ports',JSON.stringify(r));
ok(r.gx&&r.gx.startsWith('sure')&&r.gx.includes('Diameter Gx'),'Gx on TCP 3870 → certain');
ok(r.s6a&&r.s6a.startsWith('sure'),'S6a on SCTP 3900 (PPID 0) → certain');
ok(r.sgi&&r.sgi.includes('RADIUS'),'RADIUS on UDP 31812 → SGi (RAT E-UTRAN)');
ok(r.sgs&&r.sgs.startsWith('sure'),'SGsAP on SCTP 29200 → SGs certain');
ok(r.n4&&r.n4.startsWith('sure'),'PFCP on UDP 8806 → N4 certain');
ok(await p.evaluate(()=>TR.pm.rules.length===4),'TR.pm has the 4 rules');
const line=await p.evaluate(()=>{const e=document.querySelector('#panel .trpm');return e&&e.textContent;});console.log('  '+line);
ok(line&&line.includes('Diameter TCP / SCTP 3870, 3900')&&line.includes('RADIUS UDP 31812–31813'),'result shows the ports used');
// elements: the listening side on a custom SCTP port is the VLR
const ends=await p.evaluate(()=>Object.fromEntries([...TR.ends.values()].map(e=>[e.ip,Object.keys(e.els).join('/')])));console.log('  '+JSON.stringify(ends));
ok(ends['198.51.100.61']==='mscs'&&ends['192.0.2.41'].includes('mme'),'SGs: VLR listens on 29200, MME the other end');
ok(ends['198.51.100.31']==='pcrf'&&ends['192.0.2.31']==='pgw','Gx: PGW is the client, PCRF the server');
// suggestions carry the ports actually used
const sg=await p.evaluate(()=>trSuggest().flatMap(S=>S.addrs.map(A=>S.el+' '+A.ip+' '+A.interface+' '+A.port)));console.log('  '+sg.join(' | '));
ok(sg.includes('pcrf 198.51.100.31 gx 3870'),'PCRF suggested with port 3870');
ok(sg.includes('pgw 192.0.2.31 gx '),'PGW (client) without port');
ok(sg.some(x=>x.startsWith('hss 198.51.100.41')&&x.endsWith(' 3900')),'HSS suggested with port 3900');
ok(sg.some(x=>x.startsWith('mscs 198.51.100.61')&&x.endsWith(' 29200')),'VLR with 29200');
ok(sg.some(x=>x.startsWith('upf 198.51.100.71')&&x.endsWith(' 8806'))&&sg.some(x=>x.startsWith('smf 192.0.2.71')&&x.endsWith(' 8806')),'SMF / UPF with 8806');
// manual choice kept over a re-read
const gk2=await p.evaluate(()=>{const G=TR.groups.find(g=>g.gk.startsWith('plain'))||TR.groups[0];if(!G)return null;TR.manual[G.gk]='none';trResolve();return G.gk;});
await p.evaluate(()=>{ND.ports=ND.ports.filter(r=>r.proto!=='sgsap');ndTouch();});
await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);
r=await rows(p);ok(!r.sgs,'SGsAP rule removed → SGs gone after re-read');
if(gk2)ok(await p.evaluate(k=>TR.manual[k]==='none',gk2),'manual choice kept: '+gk2);
ok(await p.evaluate(()=>NDdirty),'network data marked unsaved');
// no change → no re-read
const before=await p.evaluate(()=>{window.__TR=TR;ndTouch();return true;});await p.waitForTimeout(100);ok(await p.evaluate(()=>TR===window.__TR&&!trJob),'unchanged ports → no re-read');
// leaving trace mode: a change re-reads quietly without switching the view
await p.keyboard.press('Escape');await p.evaluate(()=>select('el','mme'));await p.waitForTimeout(100);
await p.evaluate(()=>{ND.ports.push({proto:'sgsap',tr:'',ports:'29200',note:''});ndTouch();});await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});
ok(await p.evaluate(()=>!state.trMode&&state.sel&&state.sel[1]==='mme'),'quiet re-read keeps the view');
r=await rows(p);ok(r.sgs&&r.sgs.startsWith('sure'),'SGs back');
// close trace → no re-read later
await p.evaluate(()=>{trClose();ND.ports=[];ndTouch();});await p.waitForTimeout(200);ok(await p.evaluate(()=>!TR&&!trJob),'closed trace is not read again');
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
