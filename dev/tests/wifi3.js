const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(E.APP);await p.waitForTimeout(200);
const r=await p.evaluate(async()=>{await ndLoadText('element,instance,site,interface,ip,port\nePDG,EPDG01,S1,SWu,203.0.113.10,500;4500\nepdg,EPDG01,S1,S2b,192.0.2.10,2123;2152\n3GPP AAA,AAA01,S1,SWm,192.0.2.20,3868\naaa,AAA01,S1,s6b,192.0.2.20,3868\npgw,PGW01,S1,S2b,192.0.2.30,2123;2152\n','w.csv');
 select('if','s2b');const t1=document.querySelector('#panel').textContent;state.cups=true;select('if','s2bc');const t2=document.querySelector('#panel').textContent;
 return {warn:NDwarn,s2b:t1.includes('EPDG01')&&t1.includes('PGW01'),s2bc:t2.includes('EPDG01')&&t2.includes('PGW01'),table:(setView('table'),document.querySelector('#itable').textContent.includes('SWu'))};});
console.log(JSON.stringify(r));console.log(errs.join('\n')||'no errors');await b.close();})();
