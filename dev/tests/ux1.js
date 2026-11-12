/* ux1 – corrections of 2026.11.11: SCTP ports (SBc-AP 29168, Iuh 29169, Diameter / DTLS 5868), OpenFlow on TCP,
   map labels free of overlaps, search results and Enter, toolbar height while searching, generation chips as buttons,
   Back between selections, view toggles remembered, dialogs keep the focus, panel hide / show, release-note italics */
const E=require('../env');
const { chromium } = require('playwright');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);};
(async()=>{const b=await chromium.launch();const errs=[];
let p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(String(e)));
await p.goto(E.APP);await p.waitForTimeout(300);
// ---- trace: SCTP classes
await p.click('#trbtn');await load(p,E.CAP+'/i-sctp.pcap');
const oth=await p.evaluate(()=>Object.fromEntries(TR.other.map(o=>[o.lbl,o.pk])));console.log(JSON.stringify(oth));
ok(oth['SBc-AP']===9,'SBc-AP: PPID 24 (6 packets) and port 29168 without DATA chunks (3) – 9 packets, got '+oth['SBc-AP']);
ok(oth['HNBAP (Iuh)']===6,'HNBAP by PPID 20 on port 29169 – 6 packets, got '+oth['HNBAP (Iuh)']);
ok(oth['RUA (Iuh)']===9,'RUA by PPID 19, and the association without DATA chunks on 29169 – 9 packets, got '+oth['RUA (Iuh)']);
ok(await p.evaluate(()=>TR_SCTPPORT[29168]==='sbcap'&&TR_PPID[24]==='sbcap'&&trSctpPorts('hnbap').join()==='29169'&&trSctpPorts('rua').join()==='29169'),'tables: 29168 = SBc-AP, 29169 = RUA and HNBAP');
const dec=await p.evaluate(()=>TR.groups.map(g=>g.gk+':'+g.pk).join(' '));
ok(/diatls\|\|0:3/.test(dec),'SCTP port 5868 is Diameter over TLS / DTLS');
const infra=await p.evaluate(()=>[...TR.infra.entries()].map(([k,v])=>k+':'+v.pk).join(' '));console.log(infra);
ok(/OpenFlow:2/.test(infra),'OpenFlow on TCP 6633 and 6653 is infrastructure (2 packets)');
ok(await p.evaluate(()=>!TR_INFRA_UDP[6633]),'UDP 6633 is not OpenFlow');
await p.evaluate(()=>trClose&&trClose());
// ---- help tables follow
await p.goto(E.APP+'#help=tr-class');await p.waitForTimeout(400);
const ht=await p.evaluate(()=>document.getElementById('help').innerText);
ok(/SBc-AP\s+24\s+29168/.test(ht)&&/HNBAP \(Iuh\)\s+20\s+29169/.test(ht)&&/RUA \(Iuh\)\s+19\s+29169/.test(ht),'help: SCTP table lists SBc-AP 24 / 29168 and Iuh on 29169');
ok(!/inside GTP-U it is not used/.test(ht)&&!/SIGTRAN \(R8\)/.test(await p.content()),'stale help sentence and “SIGTRAN (R8)” are gone');
await p.close();
// ---- map: no overlapping labels in the four views
p=await b.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>errs.push(String(e)));await p.goto(E.APP);await p.waitForTimeout(300);
const ov=()=>p.evaluate(()=>{const vis=g=>getComputedStyle(g).display!=='none'&&!g.classList.contains('hidden');const bb=e=>e.getBBox();
 const I=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const N=[...document.querySelectorAll('#map .node')].filter(vis).filter(g=>!g.classList.contains('container')).map(g=>[g.dataset.id,bb(g.querySelector('.nb'))]);
 const L=[...document.querySelectorAll('#map .lbl')].filter(vis).map(g=>[g.dataset.id,bb(g.querySelector('rect'))]);const out=[];
 for(let i=0;i<L.length;i++){for(let j=i+1;j<L.length;j++)if(I(L[i][1],L[j][1])>1)out.push(L[i][0]+'×'+L[j][0]);for(const n of N)if(I(L[i][1],n[1])>1)out.push(L[i][0]+'×'+n[0]);}
 const zs=[...document.querySelectorAll('#map .zone text')].map(t=>bb(t));
 document.querySelectorAll('#map .link').forEach(g=>{if(!vis(g))return;const q=g.querySelector('path.v');if(!q)return;const tl=q.getTotalLength();for(let s=0;s<=tl;s+=2){const c=q.getPointAtLength(s);if(zs.some(z=>c.x>z.x&&c.x<z.x+z.width&&c.y>z.y+1&&c.y<z.y+z.height-1)){out.push(g.dataset.id+'×zone title');break;}}});
 return out;});
for(const [n,f] of [['classic, service-based',async()=>{}],['classic, ref. points',async()=>p.click('[data-rp="1"]')],['CUPS, ref. points',async()=>p.click('[data-cups="1"]')],['CUPS, service-based',async()=>p.click('[data-rp="0"]')]]){await f();await p.waitForTimeout(200);const o=await ov();ok(!o.length,'map '+n+': no label on another label, on a box or line on a zone title'+(o.length?' – '+o.join(', '):''));}
// ---- view toggles are remembered
await p.reload();await p.waitForTimeout(300);ok(await p.evaluate(()=>state.cups&&!state.rp),'CUPS / service-based remembered after a reload');
await p.goto('about:blank');await p.goto(E.APP+'#if=s11');await p.waitForTimeout(300);ok(await p.evaluate(()=>!state.cups&&state.sel[1]==='s11'),'a deep link to a classic-only interface still opens the classic view');
await p.evaluate(()=>localStorage.clear());await p.close();
// ---- search, toolbar, chips, history, dialogs, panel
for(const w of [1366,1440]){p=await b.newPage({viewport:{width:w,height:860}});p.on('pageerror',e=>errs.push(String(e)));await p.goto(E.APP);await p.waitForTimeout(300);
 const h0=await p.evaluate(()=>document.getElementById('toolbar').offsetHeight);await p.fill('#search','gtp');await p.waitForTimeout(300);
 const h1=await p.evaluate(()=>document.getElementById('toolbar').offsetHeight);ok(h0===h1,`toolbar keeps its height while searching at ${w} (${h0} → ${h1})`);
 ok(await p.evaluate(()=>/interfaces/.test(document.getElementById('qcount').textContent)&&document.getElementById('qcount').getBoundingClientRect().width>0),'match count shown');
 const hd=await p.evaluate(()=>document.getElementById('hdr').offsetHeight);ok(hd<=80,`header is two rows at ${w} (${hd} px)`);await p.close();}
p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(String(e)));await p.goto('about:blank');await p.goto(E.APP);await p.waitForTimeout(300);
await p.fill('#search','s11');await p.waitForTimeout(300);
const res=await p.evaluate(()=>[...document.querySelectorAll('#panel .srch [data-sel]')].map(x=>x.dataset.sel));console.log(res.join(' '));
ok(res[0]==='if:s11'&&res.includes('el:mme'),'search results listed in the panel, the exact name first');
await p.press('#search','Enter');await p.waitForTimeout(200);ok(await p.evaluate(()=>state.sel&&state.sel[1]==='s11'&&location.hash==='#if=s11'),'Enter opens the first result');
await p.fill('#search','zzqq');await p.waitForTimeout(250);await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.fill('#search','zzqq');await p.waitForTimeout(250);
ok(await p.evaluate(()=>!!document.querySelector('#panel .srch .none')),'no match: the panel says so');await p.fill('#search','');await p.waitForTimeout(200);
// Back / Forward
await p.evaluate(()=>select('el','mme'));await p.evaluate(()=>select('if','s6a'));await p.evaluate(()=>select('el','hss'));
await p.goBack();await p.waitForTimeout(250);ok(await p.evaluate(()=>state.sel&&state.sel[1]==='s6a'),'Back returns to the previous selection (S6a)');
await p.goBack();await p.waitForTimeout(250);ok(await p.evaluate(()=>state.sel&&state.sel[1]==='mme'),'Back again: MME');
await p.goForward();await p.waitForTimeout(250);ok(await p.evaluate(()=>state.sel&&state.sel[1]==='s6a'),'Forward: S6a');
await p.evaluate(()=>pdOpen('lte-attach'));await p.waitForTimeout(600);await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);
await p.goBack();await p.waitForTimeout(400);ok(await p.evaluate(()=>!state.procMode&&state.sel&&state.sel[1]==='s6a'),'Back from a procedure (steps add no entries) returns to S6a');
// lane names stay visible in a long procedure
await p.evaluate(()=>pdOpen('lte-attach'));await p.waitForTimeout(600);await p.evaluate(()=>{document.getElementById('panel').scrollTop=1400;});await p.waitForTimeout(200);
ok(await p.evaluate(()=>{const h=document.querySelector('#panel .mfh').getBoundingClientRect(),P=document.getElementById('panel').getBoundingClientRect(),c=document.querySelector('#panel .pdctl').getBoundingClientRect();return h.top>=c.bottom-2&&h.top<P.top+90;}),'procedure: lane names stay under the Prev / Next bar when scrolled');
await p.keyboard.press('Escape');await p.waitForTimeout(200);
// unknown link
await p.evaluate(()=>{location.hash='#if=nope';});await p.waitForTimeout(250);ok(await p.evaluate(()=>!!document.querySelector('.toast')),'unknown deep link: a message');
// chips
ok(await p.evaluate(()=>[...document.querySelectorAll('#genchips .chip')].every(c=>c.tagName==='BUTTON'&&c.hasAttribute('aria-pressed'))),'generation chips are buttons with aria-pressed');
await p.focus('#genchips .chip[data-g="sa"]');await p.keyboard.press('Enter');await p.waitForTimeout(150);
ok(await p.evaluate(()=>state.gens.has('sa')&&document.querySelector('#genchips .chip[data-g="sa"]').getAttribute('aria-pressed')==='true'),'a chip works from the keyboard');
await p.click('#genchips .chip[data-g="all"]');
// dialogs: Tab stays inside, focus returns
await p.focus('#ver');await p.keyboard.press('Enter');await p.waitForTimeout(250);let inside=true;for(let i=0;i<8;i++){await p.keyboard.press('Tab');inside=inside&&await p.evaluate(()=>!!document.activeElement.closest('#modal'));}
ok(inside,'Tab stays inside an open dialog');await p.keyboard.press('Escape');await p.waitForTimeout(150);ok(await p.evaluate(()=>document.activeElement.id==='ver'),'closing the dialog returns the focus');
// release notes: no literal asterisks
await p.click('#ver');await p.waitForTimeout(250);ok(await p.evaluate(()=>!/\*[^*\s,][^*]*[^*\s]\*/.test(document.querySelector('#modal .mbody').innerText)&&document.querySelectorAll('#modal .mbody i').length>5),'release history renders *italic*');await p.keyboard.press('Escape');
// help closes when the release history is opened by link
await p.evaluate(()=>hpOpen('start'));await p.waitForTimeout(250);await p.evaluate(()=>{location.hash='#releases';});await p.waitForTimeout(300);
ok(await p.evaluate(()=>!hpIsOpen()&&ndModalOpen()),'#releases closes the help first');await p.keyboard.press('Escape');
// panel hide / show
const w0=await p.evaluate(()=>document.getElementById('svgwrap').offsetWidth);await p.click('#pcol');await p.waitForTimeout(150);
const w1=await p.evaluate(()=>document.getElementById('svgwrap').offsetWidth);ok(w1>w0+300,`hiding the panel widens the map (${w0} → ${w1})`);
await p.evaluate(()=>select('el','sgw'));await p.waitForTimeout(150);ok(await p.evaluate(()=>document.getElementById('panel').offsetWidth>300),'selecting something brings the panel back');
// E2E stacks get the panel’s room
await p.keyboard.press('Escape');await p.click('[data-view="e2e"]');await p.waitForTimeout(250);ok(await p.evaluate(()=>document.getElementById('panel').offsetWidth===0&&document.getElementById('e2emain').clientWidth>1100),'E2E stacks use the full width');
await p.click('[data-view="arch"]');await p.waitForTimeout(150);ok(await p.evaluate(()=>document.getElementById('panel').offsetWidth>300),'… and the panel is back in the architecture view');
// theme follows the system until chosen
await p.close();const cd=await b.newContext({colorScheme:'dark',viewport:{width:1200,height:800}}),cl=await b.newContext({colorScheme:'light',viewport:{width:1200,height:800}});
const pd=await cd.newPage(),pl=await cl.newPage();await pd.goto(E.APP);await pl.goto(E.APP);await pd.waitForTimeout(200);
ok(await pd.evaluate(()=>!document.body.classList.contains('light'))&&await pl.evaluate(()=>document.body.classList.contains('light')),'theme follows the system setting');
await pl.click('#theme');await pl.reload();await pl.waitForTimeout(200);ok(await pl.evaluate(()=>!document.body.classList.contains('light')),'… until you choose one');
ok(!errs.length,'errors '+errs.join(' | '));console.log(fails?'FAILED '+fails:'ALL PASSED');await b.close();})();
