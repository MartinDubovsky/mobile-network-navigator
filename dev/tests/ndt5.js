const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(E.APP);await p.waitForTimeout(200);
const r=await p.evaluate(async()=>{let csv='element,instance,site,interface,ip,port,vlan,note\n';
 for(let i=0;i<2000;i++){ /* ip-check: ok – 4000 synthetic addresses do not fit the documentation ranges */const a=10,b2=(i>>8)&255,c=i&255;csv+=`enb,ENB${i},S${i%50},s1mme,10.${b2}.${c}.1,36412,101,\nenb,ENB${i},S${i%50},s1u,10.${b2}.${c}.2,2152,110,\nenb,ENB${i},S${i%50},x2lte,10.${b2}.${c}.1,36422,101,\n`;}
 csv+='mme,MME01,,s1mme,192.0.2.1,,,\n';
 let t0=performance.now();await ndLoadText(csv,'big.csv');const tl=performance.now()-t0;
 t0=performance.now();select('if','s1mme');const tp=performance.now()-t0;
 const more=document.querySelector('#panel').textContent.includes('1960 more');
 t0=performance.now();state.q='10.3.200.2'; /* ip-check: ok */apply();renderPanel();const ts=performance.now()-t0;
 const firstHit=document.querySelector('#panel tr.hit')?document.querySelector('#panel tr.hit td.ip').textContent:null;
 t0=performance.now();select('el','enb');const te=performance.now()-t0;
 return {n:ND.instances.length,warn:NDwarn.length,tl:Math.round(tl),tp:Math.round(tp),ts:Math.round(ts),te:Math.round(te),more,firstHit};});
console.log(JSON.stringify(r));
await p.evaluate(()=>{document.body.classList.add('light');state.q='';ND=null;});
await p.evaluate(async()=>{await ndLoadText(ND_TEMPLATE_CSV,'t');select('if','n3');});await p.waitForTimeout(100);
await p.screenshot({path:E.OUT+'/nd-light.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
