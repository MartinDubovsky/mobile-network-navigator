const E=require('../env');
const { chromium } = require('playwright');
const fs=require('fs');
const URL0=E.APP;
(async () => {
  const b = await chromium.launch(); const ctx=await b.newContext({viewport:{width:1920,height:1080},acceptDownloads:true}); let p = await ctx.newPage();
  const errs=[]; const hook=pg=>{pg.on('pageerror', e => errs.push('PAGEERR '+e.message)); pg.on('console', m => { if(m.type()==='error'||m.type()==='warning') errs.push('CONSOLE '+m.text()); });};
  hook(p);
  await p.goto(URL0); await p.waitForTimeout(300);
  const ok=(c,msg)=>console.log((c?'PASS ':'FAIL ')+msg);
  await p.evaluate(async()=>{await ndLoadText(ND_TEMPLATE_CSV,'t.csv');});
  // element panel
  await p.click('.node[data-id="mme"]'); await p.waitForTimeout(150);
  let t=await p.textContent('#panel');
  ok(t.includes('MME01')&&t.includes('192.0.2.11')&&t.includes('192.0.2.250'),'MME panel shows instance + addresses');
  await p.screenshot({path:E.OUT+'/nd-mme.png',clip:{x:1480,y:80,width:440,height:1000}});
  // interface panel
  await p.evaluate(()=>select('if','s1mme')); await p.waitForTimeout(100);
  t=await p.textContent('#panel');
  ok(t.includes('All instances (range)')&&t.includes('198.51.100.128/26')&&t.includes('MME01')&&t.includes('192.0.2.0/28'),'S1-MME shows both ends + subnet');
  await p.evaluate(()=>{document.querySelector('#panel').scrollTop=0;});
  await p.screenshot({path:E.OUT+'/nd-s1mme.png',clip:{x:1480,y:80,width:440,height:1000}});
  // s1unsa shows SGW s1u
  await p.evaluate(()=>select('if','s1unsa'));t=await p.textContent('#panel');ok(t.includes('SGW01')&&t.includes('198.51.100.6'),'S1-U (en-gNB) shows SGW S1-U address');
  // SBI bus
  await p.evaluate(()=>select('if','sbi'));t=await p.textContent('#panel');ok(t.includes('AMF01')&&t.includes('NRF01')&&t.includes('SMF01'),'SBI bus lists NF SBI addresses');
  await p.evaluate(()=>select('if','namf'));t=await p.textContent('#panel');ok(t.includes('192.0.2.62')&&!t.includes('NRF01'),'Namf stub shows AMF SBI only');
  // CUPS
  await p.evaluate(()=>{state.cups=true;select('if','s11c');});t=await p.textContent('#panel');ok(t.includes('SGW01')&&t.includes('198.51.100.5')&&t.includes('MME01'),'S11 (CUPS) falls back to SGW data');
  await p.evaluate(()=>select('if','n2'));t=await p.textContent('#panel');ok(t.includes('2001:db8:100::/48')&&t.includes('AMF01'),'N2 shows CU-CP range + AMF');
  await p.evaluate(()=>select('if','n2ngenb'));t=await p.textContent('#panel');ok(t.includes('AMF01')&&!t.includes('2001:db8:100'),'N2 (ng-eNB) shows AMF, not gNB range');
  await p.evaluate(()=>select('el','gnb'));t=await p.textContent('#panel');ok(t.includes('gNB-CU-CP')&&t.includes('2001:db8:200::/48'),'gNB container lists part instances');
  // search
  let r=await p.evaluate(()=>{clearSel();state.q='192.0.2.11';apply();const c=compute();return {el:[...c.elOn],ln:[...c.linkOn]};});
  ok(r.el.includes('mme')&&r.ln.includes('s1mme'),'search exact IP -> MME + S1-MME '+JSON.stringify(r).slice(0,200));
  r=await p.evaluate(()=>{state.q='198.51.100.130';apply();const c=compute();return {el:[...c.elOn],ln:[...c.linkOn]};});
  ok(r.el.includes('enb')&&r.ln.includes('s1mme'),'search IP inside eNB range -> eNodeB + S1-MME '+JSON.stringify(r).slice(0,200));
  r=await p.evaluate(()=>{state.q='mme01';apply();const c=compute();return [...c.elOn];});ok(r.includes('mme'),'search instance name');
  await p.evaluate(()=>select('el','enb'));
  r=await p.evaluate(()=>{state.q='198.51.100.130';renderPanel();return document.querySelectorAll('#panel tr.hit').length;});ok(r===1,'row highlight for IP-in-range: '+r);
  await p.evaluate(()=>{state.q='';apply();clearSel();});
  // semicolon CSV, aliases, warnings
  const csv2='﻿Node Type;Hostname;Interface;IP address;Port;Comment\nMME;MME02;S1-MME;198.51.100.1;36412;x\nGGSN;GGSN01;Gx;198.51.100.2;;"semi;colon"\nPGW;PGW02;Gi;198.51.100.3;;\nMSC Server;MSS02;A;198.51.100.4;2905;\nCS-MGW;MGW02;A;198.51.100.5;;\nSGW-C;SGWC1;S11;198.51.100.6;;\nfoo;X;S1;203.0.113.1;;\nMME;MME03;S1-MME;198.51.100.300;;\nHSS;HSS02;S6a;198.51.100.1;99999;\n';
  r=await p.evaluate(async(c)=>{ND=null;await ndLoadText(c,'semi.csv');return ND.instances.map(I=>I.element+'/'+I.name+':'+I.addresses.map(A=>A.interface+'='+A.ip+(A.note?'('+A.note+')':'')).join(','));},csv2);
  console.log(r.join(' | '));
  const w=await p.evaluate(()=>NDwarn);console.log(w.join('\n'));
  ok(await p.evaluate(()=>ndModalOpen()),'replace/merge asked or warnings shown');
  await p.screenshot({path:E.OUT+'/nd-modal.png'});
  await b.close();
  console.log(errs.join('\n')||'no errors');
})();
