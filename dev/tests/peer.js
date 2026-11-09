const E=require('../env');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1920,height:1080} });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto(E.APP); await p.waitForTimeout(300);
  await p.click('#tabs button[data-view="e2e"]');
  const cases=[['ltecp',0,0,'NAS (EMM / ESM)'],['3gup',0,0,'MAC'],['3gup',0,1,'Iub FP'],['2gcs',0,1,'TRAU frames'],['2gcs',0,0,'Speech codec (FR / EFR / HR / AMR)'],
   ['hspaup',0,0,'MAC-i/is'],['hspaup',1,1,'GTPv1-C'],['lteup',0,2,'GTP-U'],['saup',0,5,'IP (user)'],['nsaup',1,0,'NR PDCP'],['nsacp',1,0,'NR RRC (SCG config)'],['2gup',0,0,'LLC'],['sacp',0,0,'NAS-SM (5GSM)'],['2gcp',0,1,'E1']];
  for (const [sc,pi,ni,txt] of cases){
    await p.evaluate(id=>{state.e2e=id;renderE2E();},sc);
    const r = await p.evaluate(([pi,ni,txt])=>{const el=[...document.querySelectorAll(`#e2emain .ly[data-p="${pi}"][data-n="${ni}"]`)].find(x=>x.textContent===txt);
      if(!el)return 'NOT FOUND';const P=e2ePeers(el);return P.map(x=>{const node=x.closest('.e2e-node').querySelector('.e2e-name').textContent;const side=x.closest('.e2e-stack').querySelector('.e2e-side').textContent;return node+(side?'/'+side:'')+':'+x.textContent;}).join('  ⇄  ');},[pi,ni,txt]);
    console.log(sc.padEnd(7),txt.padEnd(22),'→',r);
  }
  await p.evaluate(()=>{state.e2e='nsaup';renderE2E();});
  const el = await p.$('#e2emain .ly[data-p="1"][data-n="0"]:text("NR PDCP")');
  if (el) await el.hover(); await p.waitForTimeout(150);
  await p.screenshot({path:E.OUT+'/80_nsaup.png'});
  await p.evaluate(()=>{state.e2e='hspaup';renderE2E();});
  const el2 = await p.$('#e2emain .ly[data-p="0"][data-n="0"]:text("MAC-i/is")'); if (el2) await el2.hover(); await p.waitForTimeout(150);
  await p.screenshot({path:E.OUT+'/81_hspa.png'});
  console.log(errs.join('\n')||'no errors'); await b.close();
})();
