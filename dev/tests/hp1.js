const E=require('../env');
const { chromium } = require('playwright');
const F=E.APP;
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(F);await p.waitForTimeout(300);
ok(await p.evaluate(()=>typeof hpOpen==='function'&&HP_ON),'module loaded');
await p.click('#hpbtn');await p.waitForTimeout(100);
ok(await p.evaluate(()=>hpIsOpen()),'button opens help');
ok(await p.evaluate(()=>location.hash==='#help=start'),'hash #help=start: '+await p.evaluate(()=>location.hash));
const n=await p.evaluate(()=>document.querySelectorAll('#help .hps').length);ok(n>=25,'sections '+n);
ok(await p.evaluate(()=>document.activeElement.classList.contains('hpbody')),'focus in body');
// TOC navigation
await p.click('#help .hptoc [data-hpl="tr-gtpu"]');await p.waitForTimeout(150);
ok(await p.evaluate(()=>location.hash==='#help=tr-gtpu'),'toc → hash tr-gtpu: '+await p.evaluate(()=>location.hash));
ok(await p.evaluate(()=>{const s=document.querySelector('#hp-tr-gtpu'),B=document.querySelector('#help .hpbody');return Math.abs(s.getBoundingClientRect().top-B.getBoundingClientRect().top)<20;}),'section at top');
ok(await p.evaluate(()=>document.querySelector('#help .hptoc .on').dataset.hpl==='tr-gtpu'),'toc active');
// scroll spy
await p.evaluate(()=>{const B=document.querySelector('#help .hpbody');B.scrollTop+=document.querySelector('#hp-tr-pfcp').getBoundingClientRect().top-B.getBoundingClientRect().top+5;});await p.waitForTimeout(150);
ok(await p.evaluate(()=>location.hash==='#help=tr-pfcp'),'scroll spy → '+await p.evaluate(()=>location.hash));
// search
await p.keyboard.press('/');ok(await p.evaluate(()=>document.activeElement.id==='hp-q'),'/ focuses help search');
await p.keyboard.type('ULR-Flags');await p.waitForTimeout(100);
const vis=await p.evaluate(()=>[...document.querySelectorAll('#help .hps')].filter(s=>!s.hidden).map(s=>s.dataset.hps));ok(vis.includes('tr-dia'),'search finds tr-dia: '+vis.join(','));
ok(await p.evaluate(()=>document.querySelectorAll('#help mark.hpm').length>0),'marks');
await p.keyboard.press('Escape');ok(await p.evaluate(()=>hpIsOpen()&&document.querySelector('#hp-q').value===''),'Esc clears search first');
ok(await p.evaluate(()=>[...document.querySelectorAll('#help .hps')].every(s=>!s.hidden)&&!document.querySelector('#help mark.hpm')),'all back, no marks');
await p.keyboard.press('Escape');ok(await p.evaluate(()=>!hpIsOpen()),'Esc closes');
ok(await p.evaluate(()=>location.hash===''),'hash restored: "'+await p.evaluate(()=>location.hash)+'"');
// ? key
await p.click('#svgwrap',{position:{x:5,y:5}}).catch(()=>{});await p.keyboard.press('Shift+Slash');await p.waitForTimeout(50);
ok(await p.evaluate(()=>hpIsOpen()),'? opens');await p.keyboard.press('Shift+Slash');ok(await p.evaluate(()=>!hpIsOpen()),'? closes');
// ? in the search box types
await p.click('#search');await p.keyboard.type('?');ok(await p.evaluate(()=>!hpIsOpen()&&document.querySelector('#search').value==='?'),'? in search box types');
await p.evaluate(()=>{const s=document.querySelector('#search');s.value='';s.dispatchEvent(new Event('input'));});
// select something, open help, close → hash back
await p.evaluate(()=>select('if','s1mme'));await p.waitForTimeout(100);
await p.evaluate(()=>hpOpen('tr-dia'));await p.waitForTimeout(100);ok(await p.evaluate(()=>location.hash==='#help=tr-dia'),'open at section');
await p.click('#help .hpx');ok(await p.evaluate(()=>!hpIsOpen()&&location.hash==='#if=s1mme'&&state.sel&&state.sel[1]==='s1mme'),'close restores #if=s1mme: '+await p.evaluate(()=>location.hash));
// backdrop click closes
await p.evaluate(()=>hpOpen());await p.mouse.click(4,500);ok(await p.evaluate(()=>!hpIsOpen()),'backdrop closes');
// deep link on load
await p.goto(F+'#help=tr-plain');await p.waitForTimeout(300);
ok(await p.evaluate(()=>hpIsOpen()&&document.querySelector('#help .hptoc .on').dataset.hpl==='tr-plain'),'deep link opens tr-plain');
await p.goto(F+'#help');await p.waitForTimeout(300);ok(await p.evaluate(()=>hpIsOpen()),'deep link #help');
// hashchange while open
await p.evaluate(()=>{location.hash='#help=tr-sug';});await p.waitForTimeout(200);ok(await p.evaluate(()=>document.querySelector('#help .hptoc .on').dataset.hpl==='tr-sug'),'hashchange → tr-sug');
// internal link
await p.evaluate(()=>hpGo('tr-overview'));await p.click('#hp-tr-overview a[data-hpl="tr-classify"]');await p.waitForTimeout(100);ok(await p.evaluate(()=>location.hash==='#help=tr-classify'),'internal link');
// overview link + trace panel links
await p.goto(F);await p.waitForTimeout(300);await p.click('#panel [data-hp="start"]');ok(await p.evaluate(()=>hpIsOpen()),'overview link');await p.keyboard.press('Escape');
await p.click('#trbtn');await p.waitForTimeout(100);await p.click('#panel [data-hp="tr-overview"]');ok(await p.evaluate(()=>hpIsOpen()&&location.hash==='#help=tr-overview'),'trace intro link');
await p.keyboard.press('Escape');ok(await p.evaluate(()=>!hpIsOpen()&&state.trMode),'Esc closes help only, trace mode stays');
// arrow keys do not step a procedure behind the help
await p.evaluate(()=>pdOpen('lte-attach'));await p.waitForTimeout(200);const st0=await p.evaluate(()=>state.procStep);await p.evaluate(()=>hpOpen());await p.keyboard.press('ArrowRight');await p.waitForTimeout(100);
ok(await p.evaluate(s=>state.procStep===s,st0),'arrow key ignored behind help');await p.keyboard.press('Escape');ok(await p.evaluate(()=>!!state.proc),'procedure still open after closing help');
// content sanity: tables generated
const t=await p.evaluate(()=>{const g=id=>document.querySelector('#hp-'+id).textContent;return {fteid:g('tr-gtpu').includes('S11 MME GTP-U'),sctp:g('tr-classify').includes('38412'),dia:g('tr-dia').includes('16777238'),rat:g('tr-radius').includes('E-UTRAN (6)'),cand:g('tr-evidence').includes('S11')};});
ok(Object.values(t).every(Boolean),'generated tables '+JSON.stringify(t));
ok(!(await p.evaluate(()=>document.querySelector('#help').innerHTML)).match(/undefined|NaN|\[object/),'no undefined/NaN in help');
ok(errs.length===0,'no errors '+errs.join(' | '));
console.log(fails?fails+' FAILED':'ALL PASS');await b.close();process.exit(fails?1:0);})();
