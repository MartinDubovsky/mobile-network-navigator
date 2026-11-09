const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto(E.APP+'#proc=lte-attach');await p.waitForTimeout(700);
await p.click('#panel [data-pa="play"]');
const log=await p.evaluate(()=>new Promise(res=>{const out=[];const t0=performance.now();const iv=setInterval(()=>{const d=gP.querySelector('circle');const P=PM[state.proc],r=P.m[state.procStep];let dist=null;
  if(d&&r){const segs=pdSegs(P,r);const tot=segs.reduce((s,x)=>s+x.len,0);const e=pdAt(segs,tot);dist=Math.hypot(+d.getAttribute('cx')-e[0],+d.getAttribute('cy')-e[1]);}
  out.push({t:Math.round(performance.now()-t0),k:state.procStep,dist,op:d?+d.style.opacity||1:null});if(performance.now()-t0>9000){clearInterval(iv);res(out);}},25);}));
const steps={};log.forEach(x=>{(steps[x.k]=steps[x.k]||[]).push(x);});
let restarts=0,unfinished=0,durs=[];const ks=Object.keys(steps);
ks.forEach((k,i)=>{const a=steps[k].filter(x=>x.dist!=null);for(let j=1;j<a.length;j++)if(a[j].dist>a[j-1].dist+4)restarts++;
 if(i<ks.length-1){if(a.length&&a[a.length-1].dist>1)unfinished++;durs.push(steps[k][steps[k].length-1].t-steps[k][0].t);}});
console.log('steps seen',ks.length,'step durations ms',durs.join(' '));
ok(ks.length>=4,'play advanced through several steps');
ok(restarts===0,'dot travels once per step while playing (restarts: '+restarts+')');
ok(unfinished===0,'dot reached its destination before every step change ('+unfinished+' early)');
ok(durs.every(d=>d>=1600),'each step lasts at least ~1.7 s');
await p.click('#panel [data-pa="play"]');await p.waitForTimeout(100);ok(await p.evaluate(()=>!pdPlaying&&!pdPlayTimer),'pause stops the timer');
// manual: repeats
const rep=await p.evaluate(()=>new Promise(res=>{let back=0,prev=null;const P=PM[state.proc],r=P.m[state.procStep];const segs=pdSegs(P,r);const tot=segs.reduce((s,x)=>s+x.len,0);const e=pdAt(segs,tot);const t0=performance.now();
 const iv=setInterval(()=>{const d=gP.querySelector('circle');const dist=Math.hypot(+d.getAttribute('cx')-e[0],+d.getAttribute('cy')-e[1]);if(prev!=null&&dist>prev+4)back++;prev=dist;if(performance.now()-t0>4500){clearInterval(iv);res(back);}},25);}));
ok(rep>=1,'when paused / stepping by hand the animation repeats ('+rep+' restarts in 4.5 s)');
ok(errs.length===0,'no errors '+errs.join('|'));await b.close();})();
