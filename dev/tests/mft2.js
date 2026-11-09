const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:1080},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto(E.APP+'#if=s1mme&mf=s1-handover');await p.waitForTimeout(400);
ok((await p.textContent('#panel .mfc.on'))==='S1 handover','deep link selects the procedure');
ok(await p.evaluate(()=>location.hash)==='#if=s1mme&mf=s1-handover','hash kept');
await p.click('#panel .mfc:has-text("Paging")');await p.waitForTimeout(50);
ok(await p.evaluate(()=>location.hash)==='#if=s1mme&mf=paging','hash updates on chip click: '+await p.evaluate(()=>location.hash));
await p.focus('#panel .mfc.on');await p.keyboard.press('ArrowRight');ok((await p.textContent('#panel .mfc.on'))==='Dedicated bearer set-up','arrow key moves to next procedure');
// search → flow
await p.fill('#search','create bearer request');await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const c=compute();return [...c.linkOn];});ok(r.includes('s11')&&r.includes('s5'),'search finds S11 and S5: '+r.join(','));
await p.evaluate(()=>select('if','s11'));ok((await p.textContent('#panel .mfc.on'))==='Network-initiated dedicated bearer','panel opens the matching procedure');
ok((await p.$$('#panel .mfm.hit')).length>=1,'matching message highlighted');
await p.fill('#search','');await p.waitForTimeout(250);
// copy
await p.evaluate(()=>select('if','n4'));await p.click('#panel [data-mfa="copy"]');await p.waitForTimeout(150);
const clip=await p.evaluate(()=>mfText(LM.n4,0));console.log(clip.split('\n').slice(0,5).join('\n'));
ok(clip.includes('SMF -> UPF: PFCP Association Setup Request'),'text export');
// larger
await p.click('#panel [data-mfa="big"]');ok(await p.evaluate(()=>ndModalOpen()&&document.querySelector('#modal .mbox').classList.contains('wide')),'larger view opens');
await p.click('#modal .mfc:nth-child(2)');ok((await p.textContent('#panel .mfc.on'))===(await p.textContent('#modal .mfc.on')),'modal and panel stay in sync');
await p.keyboard.press('Escape');ok(!(await p.evaluate(()=>ndModalOpen())),'Esc closes');
await p.evaluate(()=>{ndCloseModal();});
// network data modal not affected by wide class
await p.evaluate(()=>ndMenuAction('new'));ok(!(await p.evaluate(()=>document.querySelector('#modal .mbox').classList.contains('wide'))),'other modals not wide');await p.keyboard.press('Escape');
// mobile
const m=await b.newPage({viewport:{width:390,height:844}});m.on('pageerror',e=>errs.push('M '+e.message));await m.goto(E.APP+'#if=n2&mf=n2-handover');await m.waitForTimeout(400);
await m.evaluate(()=>document.querySelector('#panel .mfbox').scrollIntoView());await m.screenshot({path:E.OUT+'/mf-mobile.png'});
// light
await p.evaluate(()=>{document.body.classList.add('light');select('if','x2endc');state.mfi.x2endc={i:1,q:''};renderPanel();document.querySelector('#panel .mfbox').scrollIntoView();});
await p.screenshot({path:E.OUT+'/mf-light.png',clip:{x:1480,y:80,width:440,height:1000}});
console.log(errs.join('\n')||'no errors');await b.close();})();
