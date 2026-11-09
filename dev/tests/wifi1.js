const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:2400,height:1700}});const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(E.APP);await p.waitForTimeout(400);
await p.evaluate(()=>{document.getElementById('panel').style.display='none';document.getElementById('legend').style.display='none';sizeMain();});await p.waitForTimeout(200);
await p.screenshot({path:E.OUT+'/wifimap.png'});
await p.evaluate(()=>{state.cups=true;apply();});await p.waitForTimeout(100);await p.screenshot({path:E.OUT+'/wifimap-cups.png',clip:{x:700,y:480,width:900,height:560}});
await p.evaluate(()=>{state.cups=false;toggleGen('wifi',true);});await p.waitForTimeout(100);await p.screenshot({path:E.OUT+'/wifimap-gen.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
