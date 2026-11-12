const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();for(const w of [1440,1366]){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto(E.APP);await p.waitForTimeout(200);
await p.evaluate(async()=>{await ndLoadText(ND_TEMPLATE_CSV,'t');NDF.sel=new Set(['Site-B']);ndSiteApply();});await p.waitForTimeout(100);
const r=await p.evaluate(()=>{const t=document.querySelector('#toolbar');return {h:t.offsetHeight,cs:getComputedStyle(t).columnGap,kids:[...t.children].map(c=>Math.round(c.getBoundingClientRect().width)+'@'+Math.round(c.getBoundingClientRect().left)+'/'+Math.round(c.getBoundingClientRect().top)).join(' '),search:document.querySelector('#search').offsetWidth};});console.log(w,r);
const y=await p.evaluate(()=>document.querySelector('#toolbar').getBoundingClientRect().top);await p.screenshot({path:E.OUT+`/tb${w}.png`,clip:{x:0,y,width:w,height:70}});await p.close();}
await b.close();})();
