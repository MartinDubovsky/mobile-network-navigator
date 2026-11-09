const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(E.APP);await p.waitForTimeout(300);
const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);const t0=Date.now();await fc.setFiles(E.CAP+'/big.pcap');
await p.waitForTimeout(1500);const mid=await p.evaluate(()=>({pc:panel.querySelector('.trpc')&&panel.querySelector('.trpc').textContent,pk:panel.querySelector('.trpk')&&panel.querySelector('.trpk').textContent}));console.log('progress at 1.5 s',mid);
await p.screenshot({path:E.OUT+'/tr4.png'});
await p.waitForFunction(()=>!trJob,null,{timeout:600000});const dt=(Date.now()-t0)/1000;
const r=await p.evaluate(()=>({pk:TR.file.pk,rows:TR.rows.map(r=>r.canon+':'+r.pk),groups:TR.groups.map(g=>g.gk+':'+g.pk),mem:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6)+' MB':'?'}));
console.log('seconds',dt,'packets/s',Math.round(r.pk/dt),r);console.log('errs',errs);
/* cancel test */
const [fc2]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc2.setFiles(E.CAP+'/big.pcap');await p.waitForTimeout(800);await p.click('[data-ta="cancel"]');await p.waitForTimeout(800);
console.log('after cancel',await p.evaluate(()=>[trJob,TR,state.trMode,!!panel.querySelector('[data-ta="open"]')]));
await b.close();})();
