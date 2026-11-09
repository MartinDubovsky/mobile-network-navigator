const E=require('../env');
const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(E.APP);await p.waitForTimeout(200);
const h=fs.readFileSync(E.OUT+'/dl/mobile-network-navigator-example-network-with-data.html','utf8');
await p.evaluate(async t=>{await ndLoadText(t,'saved.html');},h);
console.log('html load', await p.evaluate(()=>ND&&ND.instances.length));
// a plain index.html has no data
p.evaluate(t=>{ND=null;ndLoadText(t,'index.html');},fs.readFileSync(E.ROOT+'/index.html','utf8'));await p.waitForTimeout(200);
console.log('index.html ->', await p.textContent('#modal .mbody'));
// drop event
await p.keyboard.press('Escape');
const dt=await p.evaluateHandle(t=>{const d=new DataTransfer();d.items.add(new File([t],'drop.csv',{type:'text/csv'}));return d;},fs.readFileSync(E.ROOT+'/netdata-template.csv','utf8'));
await p.dispatchEvent('#map','dragenter',{dataTransfer:dt});console.log('overlay', await p.evaluate(()=>document.body.classList.contains('nddrop')));
await p.dispatchEvent('#map','drop',{dataTransfer:dt});await p.waitForTimeout(300);
console.log('drop ->', await p.evaluate(()=>ND&&ND.instances.length), await p.evaluate(()=>document.body.classList.contains('nddrop')));
// hash / deep link with data
await p.evaluate(()=>{location.hash='#if=s5';});await p.waitForTimeout(200);console.log('hash', await p.evaluate(()=>location.hash), (await p.textContent('#panel')).includes('198.51.100.17'));
console.log(errs.join('\n')||'no errors');await b.close();})();
