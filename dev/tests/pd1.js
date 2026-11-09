const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:1080}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto(E.APP);await p.waitForTimeout(300);
ok((await p.evaluate(()=>[$('#hdr').offsetHeight,$('#toolbar').offsetHeight]).then(x=>x.join('+')))==='44+36','header 44 + toolbar 36 at 1920: '+(await p.evaluate(()=>[$('#hdr').offsetHeight,$('#toolbar').offsetHeight].join('+'))));
// data integrity: every message resolves to existing, visible links in all views
const integ=await p.evaluate(()=>{const bad=[];const modes=[[false,false],[false,true],[true,false],[true,true]];
 PROC.forEach(P=>{P.p.forEach(x=>{if(!EM[x.e])bad.push(P.id+' lane '+x.e);});
  P.m.forEach((r,k)=>{if(!mfIsMsg(r)){if(!['*','='].includes(r[0][0]))bad.push(P.id+' row '+k);if(r[0].length>1&&!P.p[+r[0].slice(1)])bad.push(P.id+' lane note '+k);return;}
   if(!P.p[r[0]]||!P.p[r[1]]||r[0]===r[1])bad.push(P.id+' lanes '+k);if(typeof r[3]!=='string'||typeof r[4]!=='string')bad.push(P.id+' fields '+k);
   const sp=r[5]||'';if(sp&&sp!=='sbi')sp.split('+').forEach(id=>{if(!LM[id])bad.push(P.id+' iface '+id);});
   modes.forEach(([c,rp])=>{state.cups=c;state.rp=rp;const h=pdHops(P,r);if(!h.length)bad.push(P.id+' nohop '+k+' '+c+rp);h.forEach(id=>{if(!linkVisible(LM[id]))bad.push(P.id+' hidden '+id+' '+c+rp);});
    /* hop chain must connect the two lanes */
    {const o=pdOrder(P,r),gf=PD_GROUP(P.p[r[0]].e),gt=PD_GROUP(P.p[r[1]].e);const hs=o.filter(x=>!x.bus);
     if(hs.length){if(!gf.includes(hs[0].from)&&!(gf.includes('gnb')&&false))bad.push(P.id+' start '+k+' '+hs[0].from);if(!gt.includes(hs[hs.length-1].to))bad.push(P.id+' end '+k+' '+hs[hs.length-1].to);}
     for(let i=1;i<o.length;i++){const a=o[i-1],c=o[i];if(a.bus||c.bus){if(!((a.bus&&c.from==='bus')||(c.bus&&a.to==='bus')))bad.push(P.id+' busjoin '+k);continue;}if(a.to!==c.from)bad.push(P.id+' gap '+k+' '+a.id+'>'+c.id);}}
});});});
 state.cups=false;state.rp=false;return bad;});
ok(integ.length===0,'all '+await p.evaluate(()=>PROC.length)+' procedures resolve to links in classic/CUPS × SBI/ref-point views'+(integ.length?': '+integ.slice(0,12).join(' | '):''));
// NAS naming: carried NAS messages are named, relayed ones are UE↔core rows with a precise layer tag
const nasLint=await p.evaluate(()=>{const bad=[];PROC.forEach(P=>P.m.forEach((r,k)=>{if(!mfIsMsg(r))return;const [tag,name,nas]=pdNm(r);
 if(/NAS-PDU|dedicatedInfoNAS|dedicatedNAS-Message/.test(r[3])&&!nas)bad.push(P.id+':'+k+' '+name);
 if(tag==='NAS')bad.push(P.id+':'+k+' generic NAS tag');
 if(/^(EMM|ESM|5GMM|5GSM|MM|CC|GMM|SM)$/.test(tag)){const ends=[P.p[r[0]].e,P.p[r[1]].e];if(!ends.includes('ue'))bad.push(P.id+':'+k+' NAS not UE-ended');}}));return bad;});
ok(nasLint.length===0,'every carried NAS message is named on its carrier; NAS rows use EMM/ESM/5GMM/MM/CC/GMM/SM'+(nasLint.length?': '+nasLint.join(' | '):''));
const att=await p.evaluate(()=>{const P=PM['lte-attach'];return pdMsgs(P).map(k=>{const [t,n,c]=pdNm(P.m[k]);return t+'|'+n+(c?' ['+c+']':'');});});
console.log('  attach:',att.join('\n          '));
ok(att.filter(x=>x.includes('[Attach Request + PDN Connectivity Request]')).length===2&&att.filter(x=>x.includes('[Attach Accept + Activate Default EPS Bearer Context Request]')).length===2&&att.includes('EMM|Attach Complete + Activate Default EPS Bearer Context Accept'),'attach names Attach Request (RRC + S1AP), Attach Accept (S1AP + RRC) and Attach Complete');
// 2G: GSM location update highlights BTS/BSC/MSC/HLR, steps show the right hops
const g2=await p.evaluate(()=>{pdOpen('gsm-lu');const P=PM['gsm-lu'];const ms=pdMsgs(P);const hop=n=>{pdGo(ms[n-1]);return Object.values(LINK).filter(o=>o.g.classList.contains('lv3')).map(o=>o.L.id).sort().join('+')+'|'+pdShort(P.m[ms[n-1]]);};
 const r={inv:['ue','bts','bsc','mscs','hlr'].map(id=>NODE[id].g.classList.contains('lv0')?0:1).join(''),out:['mme','rnc','sgsn','mgw'].map(id=>NODE[id].g.classList.contains('lv0')?0:1).join(''),
  s1:hop(1),s5:hop(5),s9:hop(9),s10:hop(10),s12:hop(12),s19:hop(19)};pdClose();return r;});await p.waitForTimeout(500);
const vbOk=await p.evaluate(()=>Math.round(vb.w)===1900&&!state.procMode);
console.log('  2G LU:',JSON.stringify(g2));
ok(g2.inv==='11111'&&g2.out==='0000'&&g2.s1==='um|Channel Request'&&g2.s5==='abis|IMMEDIATE ASSIGN COMMAND (Immediate Assignment)'&&g2.s9==='abis|ESTABLISH INDICATION (Location Updating Request)'&&g2.s10==='acp|COMPLETE LAYER 3 INFORMATION (Location Updating Request)'&&g2.s12==='abis+acp+um|Identity Request'&&g2.s19==='abis|ENCRYPTION COMMAND (Ciphering Mode Command)','GSM location update: nodes, Um / Abis / A hops and carried RR / NAS messages');
ok(vbOk,'opening and closing a procedure in the same frame leaves the map un-zoomed');
ok(await p.evaluate(()=>{const P=PM['gsm-lu'];const r=P.m.find(r=>mfIsMsg(r)&&r[2].startsWith('RSL|IMMEDIATE'));return pdCarLbl(pdNm(r)[2])==='RR: Immediate Assignment'&&pdCarLbl(pdNm(P.m.find(r=>mfIsMsg(r)&&r[2].startsWith('LAPDm|SABM')))[2])==='NAS: Location Updating Request';}),'carried-message labels: RR: … and NAS: …');
// group order follows the generations: 2G, 3G, HSPA, 4G, 5G NSA, 5G SA, Wi-Fi, Interworking
const grp=await p.evaluate(()=>{pdOpenList();const r=[...document.querySelectorAll('#pdlistbody h3')].map(h=>h.textContent);pdClose();return r;});
ok(grp.join('|')==='2G GSM|3G UMTS|HSPA / HSPA+|4G LTE / EPC|5G NSA|5G SA|Wi-Fi|Interworking','groups in generation order: '+grp.join(' | '));
// open list
await p.click('#pdbtn');await p.waitForTimeout(450);
ok(await p.evaluate(()=>state.procMode&&!state.proc&&document.body.classList.contains('procwide')),'button opens the list, panel widened');
ok((await p.$$('.pdcard')).length===39,'39 procedure cards: '+(await p.$$('.pdcard')).length);
ok(await p.evaluate(()=>location.hash==='#procedures'),'hash #procedures');
await p.fill('.pdq','handover');await p.waitForTimeout(50);ok(await p.$$eval('.pdcard',x=>{const ids=x.map(e=>e.dataset.proc);return ['gsm-ho','lte-x2ho','lte-s1ho','nr-xnho','nr-n2ho','lte-wifi-ho','wifi-lte-ho','srvcc'].every(i=>ids.includes(i));}),'filter "handover" finds all handover procedures: '+(await p.$$eval('.pdcard b',x=>x.map(e=>e.textContent).join(' | '))));
await p.fill('.pdq','pfcp');await p.waitForTimeout(50);ok((await p.$$('.pdcard')).length===8,'filter "pfcp" → 8: '+(await p.$$eval('.pdcard b',x=>x.map(e=>e.textContent).join(' | '))));
await p.fill('.pdq','');
await p.hover('.pdcard[data-proc="nr-pdu"]');await p.waitForTimeout(60);
const hv=await p.evaluate(()=>[NODE.amf.g.classList.contains('lv0'),NODE.mme.g.classList.contains('lv0'),LINK.n4.g.classList.contains('lv0')].join());
await p.mouse.move(300,300);await p.waitForTimeout(60);const hv2=await p.evaluate(()=>Object.values(NODE).some(o=>o.g.classList.contains('lv0')));
ok(hv==='false,true,false'&&!hv2,'hovering a card previews its nodes on the map, leaving clears it '+hv+' '+hv2);
await p.screenshot({path:E.OUT+'/pd-list.png'});
await p.click('.pdcard[data-proc="lte-attach"]');await p.waitForTimeout(600);
const lv=await p.evaluate(()=>{const c=id=>NODE[id].g.classList.contains('lv0')?0:1;return {inv:['ue','enb','mme','hss','sgw','pgw','pcrf'].map(c).join(''),out:['amf','smf','rnc','sgsn','bts','upf'].map(c).join(''),links:['s1mme','s11','s5','s6a','gx','lteuu'].map(id=>LINK[id].g.classList.contains('lv0')?0:1).join(''),nl:['n2','sgs','x2lte'].map(id=>LINK[id].g.classList.contains('lv0')?0:1).join('')};});
ok(lv.inv==='1111111'&&lv.out==='000000'&&lv.links==='111111'&&lv.nl==='000','attach highlights its nodes and links only '+JSON.stringify(lv));
ok(await p.evaluate(()=>vb.w<1900),'map zoomed to the involved area: '+await p.evaluate(()=>JSON.stringify(vb)));
ok(await p.evaluate(()=>location.hash==='#proc=lte-attach'),'hash #proc=lte-attach');
// step
await p.locator('#panel .pdm').first().click();
const s1=await p.evaluate(()=>({k:state.procStep,n:pdNum(PM[state.proc],state.procStep),lv3:Object.values(LINK).filter(o=>o.g.classList.contains('lv3')).map(o=>o.L.id),ov:gP.childNodes.length,h:location.hash}));
ok(s1.n===1&&s1.lv3.join()==='lteuu'&&s1.ov===2&&s1.h==='#proc=lte-attach&step=1','click first message → step 1 on LTE-Uu, overlay drawn '+JSON.stringify(s1));
for(let i=0;i<4;i++){await p.keyboard.press('ArrowRight');}
const s5=await p.evaluate(()=>({n:pdNum(PM[state.proc],state.procStep),lv3:Object.values(LINK).filter(o=>o.g.classList.contains('lv3')).map(o=>o.L.id),els:Object.values(NODE).filter(o=>o.g.classList.contains('lv3')).map(o=>o.E.id)}));
ok(s5.n===5&&s5.lv3.sort().join()==='lteuu,s1mme'&&s5.els.sort().join()==='enb,mme,ue','→ ×4 reaches step 5 Identity Request (NAS over LTE-Uu + S1-MME, eNB in between) '+JSON.stringify(s5));
await p.keyboard.press('ArrowRight');
await p.keyboard.press('ArrowRight');const s6=await p.evaluate(()=>({n:pdNum(PM[state.proc],state.procStep),lv3:Object.values(LINK).filter(o=>o.g.classList.contains('lv3')).map(o=>o.L.id).sort(),els:Object.values(NODE).filter(o=>o.g.classList.contains('lv3')).map(o=>o.E.id).sort()}));
ok(s6.n===7&&s6.lv3.join()==='s6a'&&s6.els.join()==='hss,mme','step 7 AIR on S6a '+JSON.stringify(s6));
await p.screenshot({path:E.OUT+'/pd-attach.png'});
// CUPS view keeps working
await p.click('[data-cups="1"]');await p.waitForTimeout(100);
const cu=await p.evaluate(()=>({mode:state.procMode,proc:state.proc,on:['s11c','s5c','gxc','sxa','sxb','s5u','s1uc'].map(id=>LINK[id].g.classList.contains('lv0')?0:1).join(''),els:['sgwc','sgwu','pgwc','pgwu'].map(id=>NODE[id].g.classList.contains('lv0')?0:1).join('')}));
ok(cu.mode&&cu.proc==='lte-attach'&&cu.on==='1111100'&&cu.els==='1111','CUPS toggle: procedure stays, control-plane CUPS copies + Sxa/Sxb lit, user-plane copies unused by attach messages stay dim '+JSON.stringify(cu));
await p.click('[data-cups="0"]');await p.waitForTimeout(80);
// 5G PDU session in SBI and ref-point mode
await p.evaluate(()=>pdOpen('nr-pdu'));await p.waitForTimeout(500);
const n5=await p.evaluate(()=>({sb:['namf','nsmf','nudm','npcf','n4','n2','n3','n1'].map(id=>LINK[id].g.classList.contains('lv0')?0:1).join(''),bus:LINK.sbi.g.classList.contains('lv0')?0:1,gnb:['gnb','gnbdu','gnbcucp','gnbcuup'].map(id=>NODE[id].g.classList.contains('lv0')?0:1).join(''),nrf:NODE.nrf.g.classList.contains('lv0')}));
ok(n5.sb==='11111111'&&n5.bus===1&&n5.gnb==='1111'&&n5.nrf,'PDU session (service-based view): stubs, bus, N1/N2/N3/N4 and gNB parts lit, NRF dimmed '+JSON.stringify(n5));
await p.click('[data-rp="1"]');await p.waitForTimeout(80);
const n5r=await p.evaluate(()=>({rp:['n11','n10','n7'].map(id=>LINK[id].g.classList.contains('lv0')?0:1).join(''),mode:state.procMode}));
ok(n5r.rp==='111'&&n5r.mode,'reference-point view: N11, N10, N7 lit '+JSON.stringify(n5r));
const lbl=await p.evaluate(()=>[...document.querySelectorAll('#panel .pdif')].slice(0,6).map(e=>e.textContent));
console.log('  iface labels:',lbl.join(' | '));
await p.click('[data-rp="0"]');await p.waitForTimeout(80);
// network data → addresses
await p.evaluate(async()=>{ND=null;await ndLoadText(ND_TEMPLATE_CSV,'t.csv');});await p.waitForTimeout(150);
await p.evaluate(()=>pdOpen('lte-attach'));await p.waitForTimeout(400);
const ip=await p.evaluate(()=>{const P=PM['lte-attach'];const f=n=>{const k=pdMsgs(P)[n-1];return pdIPText(P,P.m[k]);};return {ics:f(4),air:f(7),csr:f(17),csr5:f(18),nas:f(9),sel:[...document.querySelectorAll('#panel select.pdis')].map(s=>s.selectedOptions[0].textContent)};});
console.log('  addresses:',JSON.stringify(ip));
ok(ip.ics==='198.51.100.128/26 -> 192.0.2.11 port 36412'&&ip.air==='192.0.2.31 -> 192.0.2.51 port 3868'&&ip.csr==='192.0.2.21 -> 198.51.100.5 port 2123'&&ip.csr5==='198.51.100.7 -> 198.51.100.17'&&ip.nas==='','IP addresses per hop from the template (S1-MME range→MME01, S6a, S11, S5; none for multi-hop NAS)');
ok((await p.$$('#panel .pdip')).length>5,'address lines rendered: '+(await p.$$('#panel .pdip')).length);
// choose MME02 for the MME lane
await p.selectOption('#panel select.pdis[data-pl="2"]',{label:'MME02 · Site-B'});await p.waitForTimeout(100);
const ip2=await p.evaluate(()=>{const P=PM['lte-attach'];const k=pdMsgs(P)[3];return [pdIPText(P,P.m[k]),pdIPText(P,P.m[pdMsgs(P)[6]])];});
ok(ip2[0]==='198.51.100.128/26 -> 198.51.100.41 port 36412'&&ip2[1]==='? -> 192.0.2.51 port 3868','MME02 chosen: S1-MME 198.51.100.41, no S6a address for MME02 '+JSON.stringify(ip2));
await p.evaluate(()=>{state.procInst={};});
// 5G with IPv6 ranges and SBI
await p.evaluate(()=>pdOpen('nr-pdu'));await p.waitForTimeout(300);
const ip5=await p.evaluate(()=>{const P=PM['nr-pdu'];return pdMsgs(P).map(k=>pdIPText(P,P.m[k])).filter(Boolean);});
console.log('  5G:',ip5.join(' | '));
ok(ip5.includes('192.0.2.62 -> 192.0.2.71 port 443')&&ip5.includes('192.0.2.72 -> 198.51.100.33 port 8805')&&ip5.some(x=>x.startsWith('2001:db8:100::/48 -> 192.0.2.61')),'5G: SBI AMF→SMF, N4 SMF→UPF, N2 gNB range→AMF');
await p.screenshot({path:E.OUT+'/pd-pdu.png'});
// copy text
const txt=await p.evaluate(()=>pdText(PM['nr-pdu']));ok(txt.includes('{N11}')&&txt.includes('[192.0.2.62 -> 192.0.2.71 port 443]')&&txt.includes('(NAS: DL NAS Transport (PDU Session Establishment Accept))'),'copy-as-text has interfaces, carried NAS and addresses');
// larger view
await p.click('#panel [data-pa="big"]');await p.waitForTimeout(150);ok(await p.evaluate(()=>!!document.querySelector('#modal .pdbox.big .pdm')),'larger view opens');
await p.click('#modal .pdbox [data-pa="next"]');await p.waitForTimeout(80);ok(await p.evaluate(()=>pdNum(PM[state.proc],state.procStep)===1&&!!document.querySelector('#modal .pdm.focus')),'Next inside the larger view');
await p.keyboard.press('Escape');await p.waitForTimeout(80);ok(await p.evaluate(()=>state.procMode&&!ndModalOpen()),'Esc closes the modal only');
// click map element → leaves, back button returns
await p.evaluate(()=>select('el','amf'));await p.waitForTimeout(100);
ok(await p.evaluate(()=>!state.procMode&&state.pdReturn&&state.pdReturn.id==='nr-pdu'&&!!document.querySelector('#panel [data-pa="return"]')),'selecting an element leaves the procedure, offers a way back');
ok(await p.evaluate(()=>[...document.querySelectorAll('#panel .pdchip')].map(b=>b.dataset.proc).join()).then(x=>x.includes('nr-reg')&&x.includes('nr-pdu')&&!x.includes('lte-attach')),'AMF panel lists its procedures: '+await p.evaluate(()=>[...document.querySelectorAll('#panel .pdchip')].map(b=>b.dataset.proc).join()));
await p.click('#panel [data-pa="return"]');await p.waitForTimeout(200);ok(await p.evaluate(()=>state.proc==='nr-pdu'&&state.procStep===pdMsgs(PM['nr-pdu'])[0]),'back to the procedure at the same step');
// interface chips
await p.evaluate(()=>select('if','s11c'));ok(await p.evaluate(()=>[...document.querySelectorAll('#panel .pdchip')].length>=6),'S11 (CUPS copy) panel lists procedures: '+await p.evaluate(()=>[...document.querySelectorAll('#panel .pdchip')].length));
await p.evaluate(()=>select('if','n11'));ok(await p.evaluate(()=>[...document.querySelectorAll('#panel .pdchip')].map(b=>b.dataset.proc).join()).then(x=>x.includes('nr-pdu')),'N11 lists the PDU session');
// Esc closes procedure view and restores the map
await p.evaluate(()=>pdOpen('lte-x2ho'));await p.waitForTimeout(450);await p.keyboard.press('Escape');await p.waitForTimeout(450);
ok(await p.evaluate(()=>!state.procMode&&!document.body.classList.contains('procwide')&&Math.round(vb.w)===1900&&location.hash===''),'Esc leaves the view and restores the map '+await p.evaluate(()=>JSON.stringify(vb)+location.hash));
// deep link
await p.goto(E.APP+'#proc=wifi-attach&step=3');await p.waitForTimeout(600);
ok(await p.evaluate(()=>state.proc==='wifi-attach'&&pdNum(PM[state.proc],state.procStep)===3&&!!document.querySelector('#panel .pdm.focus')),'deep link #proc=wifi-attach&step=3');
await p.screenshot({path:E.OUT+'/pd-wifi.png'});
await p.evaluate(()=>document.body.classList.toggle('light'));await p.evaluate(()=>pdOpen('lte-x2ho',pdMsgs(PM['lte-x2ho'])[13]));await p.waitForTimeout(500);await p.screenshot({path:E.OUT+'/pd-light.png'});await p.evaluate(()=>document.body.classList.toggle('light'));
// gen chip leaves the mode; tabs leave the mode
await p.click('#genchips .chip[data-g="sa"]');await p.waitForTimeout(100);ok(await p.evaluate(()=>!state.procMode&&state.gens.has('sa')),'generation chip leaves the procedure view');
ok(await p.evaluate(()=>!!document.querySelector('#panel .pdchip[data-proc="nr-reg"]')),'5G SA overview lists its procedures');
await p.evaluate(()=>{toggleGen('all');pdOpenList();});await p.click('#tabs [data-view="table"]');await p.waitForTimeout(80);ok(await p.evaluate(()=>!state.procMode&&state.view==='table'),'switching tab leaves the view');
await p.click('#tabs [data-view="arch"]');
ok(await p.evaluate(()=>!!document.querySelector('#panel .pdcta')),'overview has the procedures link');
// label stays inside the visible map (Um runs along the left edge)
await p.evaluate(()=>pdOpen('gsm-mt-call',pdMsgs(PM['gsm-mt-call'])[7]));await p.waitForTimeout(800);
const lb=await p.evaluate(()=>{const r=gP.querySelector('.pdlbl rect').getBoundingClientRect(),m=svg.getBoundingClientRect();return [r.left>=m.left,r.right<=m.right,r.top>=m.top,r.bottom<=m.bottom].join();});
ok(lb==='true,true,true,true','map label of a hop on the map edge stays inside the map '+lb);
// every procedure renders and every step overlays
const all=await p.evaluate(async()=>{const r=[];for(const P of PROC){pdOpen(P.id);for(const k of pdMsgs(P)){pdGo(k);if(!gP.querySelector('circle'))r.push(P.id+':'+k);}if(document.querySelectorAll('#panel .pdm').length!==pdMsgs(P).length)r.push(P.id+' rows');}pdClose();return r;});
ok(all.length===0,'every step of every procedure draws its map overlay'+(all.length?': '+all.slice(0,10).join(' '):''));
// 1440 toolbar with network data
await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(150);
ok(await p.evaluate(()=>$('#toolbar').offsetHeight<=40),'toolbar one line at 1440 with network data: '+await p.evaluate(()=>$('#toolbar').offsetHeight));
await p.evaluate(()=>pdOpen('nr-reg'));await p.waitForTimeout(500);await p.screenshot({path:E.OUT+'/pd-1440.png'});
await p.setViewportSize({width:420,height:860});await p.waitForTimeout(150);await p.screenshot({path:E.OUT+'/pd-mobile.png',fullPage:false});
ok(errs.length===0,'no errors '+errs.join(' | '));
await b.close();})();
