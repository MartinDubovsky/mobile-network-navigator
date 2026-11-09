const E=require('../env');
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
/* trace panel: collapsible sections, Wireshark filters per row, Save results (JSON / CSV / encrypted) and re-applying decisions */
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);};
const ws=(p,k)=>p.evaluate(k=>trWsFor(k),k);
const ND1={format:'mobile-network-navigator/netdata',version:1,network:'Ports test',instances:[{element:'pgw',name:'PGW01',addresses:[{interface:'gx',ip:'192.0.2.10'}]}],interfaces:{},
 ports:[{protocol:'Diameter',transport:'any',ports:'3870;3900'},{protocol:'radius',transport:'udp',ports:'31812-31813'}]};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1600,height:1000}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
const OUT=path.join(E.OUT,'tr9');fs.mkdirSync(OUT,{recursive:true});
await p.goto(E.APP);await p.waitForTimeout(200);await p.click('#trbtn');
await load(p,E.CAP+'/a.pcapng');
/* sections */
let sec=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('details.trsec')].map(d=>[d.dataset.sec,d.open])));console.log(JSON.stringify(sec));
ok(sec.ifs&&sec.ports&&sec.dec&&sec.els===false&&sec.nm===false&&sec.det===false,'sections and their defaults (23 addresses → elements closed)');
ok(await p.evaluate(()=>document.querySelector('details[data-sec=dec]').classList.contains('todo')),'Check and decide tinted while something is undecided');
ok(await p.evaluate(()=>/10 certain/.test(document.querySelector('details[data-sec=ifs] summary').textContent)&&/port0 ↑/.test(document.querySelector('details[data-sec=ports] summary').textContent)),'folded summaries show key figures');
await p.click('details[data-sec=els] [data-ta=ndsug]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>!document.querySelector('details[data-sec=els]').open&&!$('#modal').hidden),'“Add to network data…” in the folded section title opens its dialog, the section stays folded');
await p.evaluate(()=>ndCloseModal());
await p.click('details[data-sec=nm]>summary');await p.click('details[data-sec=ifs]>summary');await p.waitForTimeout(50);
await p.evaluate(()=>{trResolve();trRender();});
sec=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('details.trsec')].map(d=>[d.dataset.sec,d.open])));ok(sec.nm&&!sec.ifs,'your open / close survives a re-render');
await p.click('[data-ta=collapse]');ok(await p.evaluate(()=>[...document.querySelectorAll('details.trsec')].every(d=>!d.open)),'Collapse all');
await p.click('[data-ta=expand]');ok(await p.evaluate(()=>[...document.querySelectorAll('details.trsec')].every(d=>d.open)),'Expand all');
/* filters */
const n=await p.evaluate(()=>document.querySelectorAll('#panel [data-ws]').length);ok(n>=40,'filter buttons: '+n);
let w=await ws(p,'if:s1u');ok(w.f==='(udp.port==2152 || (ip.flags.mf==1 || ip.frag_offset>0)) && (ip.addr==192.0.2.70 && ip.addr==198.51.100.10)'&&/IP fragments/.test(w.notes[0]),'S1-U, with its IP fragments: '+w.f);
w=await ws(p,'if:gx');ok(w.f==='tcp.port==3868 && (ip.addr==192.0.2.10 && ip.addr==192.0.2.20)','Gx, the only Diameter application of the pair: the whole TCP connection: '+w.f);
w=await ws(p,'if:gn');ok(w.f==='((gtp && udp.port==2123) && (ip.addr==192.0.2.100 && ip.addr==192.0.2.110)) || (udp.port==2152 && (ip.addr==192.0.2.101 && ip.addr==192.0.2.111))','Gn: GTPv1-C and GTP-U: '+w.f);
w=await ws(p,'if:s6a');ok(w.f==='sctp && (ipv6.addr==2001:db8::80 && ipv6.addr==2001:db8::85)','S6a over SCTP / IPv6: the whole association: '+w.f);
w=await ws(p,'if:s1mme');ok(w.f==='sctp && (ip.addr==192.0.2.80 && ip.addr==198.51.100.10)','S1-MME: whole SCTP association');
w=await ws(p,'grp:gtpu|10.400|1');ok(w.f==='((vlan.id==10 || ieee8021ad.id==10) && (vlan.id==400 || ieee8021ad.id==400)) && (udp.port==2152 && (ip.addr==192.0.2.120 && ip.addr==198.51.100.30))','group with QinQ (802.1ad outer tag): '+w.f);
w=await ws(p,'port:1');ok(w.f==='frame.interface_id==1','capture interface');
w=await ws(p,'el:2001:db8::80');ok(w.f==='ipv6.addr==2001:db8::80','element IPv6');
w=await ws(p,'if:n6');ok(/^\(\(vlan\.id==306 \|\| ieee8021ad\.id==306\) && frame\.interface_id==1\) && \(\(ip \|\| ipv6\) && !\(udp\.port==2152 \|\| /.test(w.f)&&/ipv6\.nxt==89/.test(w.f)&&w.notes.some(x=>/approximate/.test(x)),'N6 plain IP: approximate, says so');
const bal=await p.evaluate(()=>[...document.querySelectorAll('#panel [data-ws]')].map(b=>trWsFor(b.dataset.ws)).filter(Boolean).every(w=>{let d=0;for(const c of w.f){if(c==='(')d++;if(c===')')d--;if(d<0)return false;}return d===0&&!/&& \|\||\|\| &&|\(\)/.test(w.f);}));
ok(bal,'every filter has balanced brackets');
const pairs=await p.evaluate(()=>{const fl=[];for(let i=0;i<4;i++)fl.push({cls:'gtpu',app:null,A:'198.51.100.1',B:'192.0.2.'+(10+i),x:{}});fl.push({cls:'gtpu',A:'198.51.100.2',B:'192.0.2.99',x:{}});return trWsMix(fl,[]).f;});
ok(pairs==='udp.port==2152 && ((ip.addr==198.51.100.1 && (ip.addr==192.0.2.10 || ip.addr==192.0.2.11 || ip.addr==192.0.2.12 || ip.addr==192.0.2.13)) || (ip.addr==198.51.100.2 && ip.addr==192.0.2.99))','pairs grouped around the shared address: '+pairs);
const two=await p.evaluate(()=>{const f1={cls:'dia',app:16777238,A:'192.0.2.1',B:'192.0.2.2',x:{tcp:1}},f2={cls:'dia',app:4,A:'192.0.2.1',B:'192.0.2.2',x:{tcp:1}};const keep=TR.flows;TR.flows=[f1,f2];const r=trWsMix([f1],[]);TR.flows=keep;return r;});
ok(two.f==='(diameter.applicationId==16777238 || diameter.applicationId==0) && (ip.addr==192.0.2.1 && ip.addr==192.0.2.2)'&&/messages only/.test(two.notes.join()),'two Diameter applications on one pair: by application, messages only (says so)');
const cut=await p.evaluate(()=>{const fl=[];for(let i=0;i<1600;i++)fl.push({cls:'pfcp',A:'198.51.100.1',B:'192.0.2.'+(i%250)+'x'+i,x:{}});return trWsMix(fl,[]);});
ok(cut.f==='pfcp'&&/too many/.test(cut.notes[0]),'over 1 500 pairs: protocol only, with a note');
/* the button copies */
await ctx.grantPermissions(['clipboard-read','clipboard-write']).catch(()=>{});
await p.click('tr[data-trr="gx"] .trws');await p.waitForTimeout(150);
ok(await p.evaluate(()=>TR.wsLast)==='('+(await ws(p,'if:gx')).f+')'&&await p.evaluate(()=>/Wireshark filter copied/.test(document.querySelector('.toast')?.textContent||'')),'⧉ filter copies, toast shown');
ok(await p.evaluate(()=>state.trSel!=='gx'),'the button does not select the row');
/* save: JSON and CSV */
await p.evaluate(()=>{const s=document.querySelector('select[data-tg="plain|205|0"]');s.value='none';s.dispatchEvent(new Event('change',{bubbles:true}));
 const s2=document.querySelector('select[data-tg="dia:4|102|0"]');s2.value='rorf';s2.dispatchEvent(new Event('change',{bubbles:true}));
 TR.names.set('192.0.2.30',new Map([['=HYPERLINK("x")','test']]));});
const save=async(k,nd)=>{await p.click('.trbtns [data-ta=save]');await p.check(`#modal input[value=${k}]`);if(nd!=null)await p.setChecked('#trsvnd',nd);const [d]=await Promise.all([p.waitForEvent('download'),p.click('#modal .mbtns .primary')]);const f=path.join(OUT,d.suggestedFilename());await d.saveAs(f);return f;};
const fj=await save('json');ok(path.basename(fj)==='a.trace-results.json','file name '+path.basename(fj));
const J=JSON.parse(fs.readFileSync(fj,'utf8'));
ok(J.format==='mobile-network-navigator/trace-results'&&J.capture.packets===102&&J.interfaces.length===13&&!J.interfaces.some(r=>r.interface==='gy4g')&&J.captureInterfaces.length===2&&J.elements.length===23,'JSON: capture, 13 interfaces (Gy assigned to Ro), 2 capture interfaces, 23 elements');
ok(J.decisions.filter(d=>d.choice).map(d=>d.group+'='+d.choice).sort().join(' ')==='dia:4|102|0=rorf plain|205|0=none','JSON: your 2 decisions');
ok(!J.networkData,'JSON: no network data loaded → none included');
const ues=await p.evaluate(()=>[...TR.ue.keys()].filter(k=>typeof k==='number').map(trIPs));const txt=fs.readFileSync(fj,'utf8');
ok(ues.length>0&&ues.every(u=>!txt.includes('"'+u+'"')&&!new RegExp(u.replace(/\./g,'\\.')+'[^0-9]').test(txt)),'JSON: no UE addresses ('+ues.join(', ')+')');
const fc=await save('csv');const C=fs.readFileSync(fc,'utf8');
ok(C.charCodeAt(0)===0xFEFF&&/\r\n# Interfaces\r\ninterface,name,packets/.test(C)&&/# Decisions/.test(C)&&/# Elements/.test(C),'CSV: blocks per table');
ok(C.includes("'=HYPERLINK")&&!/,=HYPERLINK/.test(C),'CSV: formula-like values neutralised');
/* encrypted: round trip */
const dec=await p.evaluate(async()=>{const w=await ndEncrypt(trResultsData(false),'pass phrase 1');return (await ndDecrypt(w,'pass phrase 1')).decisions.filter(d=>d.choice).length+'|'+w.format;});
ok(dec==='2|mobile-network-navigator/netdata-encrypted','encrypted JSON decrypts to the results');
/* re-apply after reopening */
await load(p,E.CAP+'/a.pcapng');ok(await p.evaluate(()=>Object.keys(TR.manual).length===0),'reopened: decisions forgotten');
let [ch]=await Promise.all([p.waitForEvent('filechooser'),p.click('[data-ta=decload]')]);await ch.setFiles(fj);await p.waitForSelector('#modal:not([hidden])');
ok(/2 of 2 decisions/.test(await p.textContent('#modal .mbody')),'Apply decisions from a file: 2 of 2');await p.click('#modal .mbtns .primary');
ok(await p.evaluate(()=>TR.manual['plain|205|0']==='none'&&TR.manual['dia:4|102|0']==='rorf'&&TR.rows.some(r=>r.canon==='rorf'&&r.conf.manual)),'decisions applied and resolved');
/* with network data: one file with everything; loading it gives back the network data and the decisions */
await p.evaluate(async j=>{await ndLoadText(JSON.stringify(j),'nd.json');},ND1);await p.waitForTimeout(300);
const fa=await save('json',true);const A=JSON.parse(fs.readFileSync(fa,'utf8'));
ok(A.networkData&&A.networkData.network==='Ports test'&&A.networkData.ports.length===2&&/Diameter/.test(A.protocolPorts),'JSON with network data and protocol ports');
const fc2=await save('csv');ok(!/Ports test/.test(fs.readFileSync(fc2,'utf8')),'CSV never carries the network data');
await p.evaluate(()=>{ND=null;ndRefresh();});await load(p,E.CAP+'/a.pcapng');
await p.evaluate(t=>{ndLoadText(t,'all.json');},fs.readFileSync(fa,'utf8'));await p.waitForSelector('#modal:not([hidden])');
ok(/2 of 2 decisions/.test(await p.textContent('#modal .mbody'))&&/also contains network data/.test(await p.textContent('#modal .mbody')),'Network data → Load: decisions, then the network data');
await p.click('#modal .mbtns .primary');await p.waitForTimeout(400);
ok(await p.evaluate(()=>ND&&ND.network==='Ports test'&&ND.ports.length===2&&TR.manual['dia:4|102|0']==='rorf'),'network data loaded, decisions kept');
/* custom ports: filter by port number */
await load(p,E.CAP+'/f-ports.pcap');w=await ws(p,'if:gx');
ok(w&&/^tcp\.port==3870 && /.test(w.f)&&w.notes.some(x=>/non-standard/.test(x)),'Gx on TCP 3870: by port number: '+(w&&w.f));
const pl=await p.evaluate(()=>trWsPlain());ok(/\(udp\.srcport>=31812 && udp\.srcport<=31813\) \|\| \(udp\.dstport>=31812 && udp\.dstport<=31813\)/.test(pl)&&/tcp\.port==3870/.test(pl),'plain IP excludes your protocol ports too');
/* privacy text and help */
ok(/Nothing is saved unless you/.test(await p.textContent('#panel .trpriv')),'privacy line names the exception');
await p.evaluate(()=>hpOpen('tr-save'));await p.waitForTimeout(200);const H=await p.textContent('#help');
ok(/udp\.port==2152/.test(H)&&/gtpv2/.test(H)&&/diameter\.applicationId==application \|\| diameter\.applicationId==0/.test(H)&&/approximate/.test(H)&&/Applying saved decisions/.test(H),'help: generated filter table, plain IP note, saving');
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
