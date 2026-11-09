const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
await p.goto(E.APP);await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const out={missing:[],bad:[],flows:0,msgs:0,lanes:{},dupTitles:[],perLink:{}};
 LINKS.forEach(L=>{const F=MF[L.id];if(!F||!F.length){out.missing.push(L.id);return;}out.perLink[L.id]=F.length;
  const seen=new Set();F.forEach(f=>{const sl=mfSlug(f.t);if(seen.has(sl))out.dupTitles.push(L.id+':'+f.t);seen.add(sl);
   out.flows++;const P=mfLanes(L,f);out.lanes[P.length]=(out.lanes[P.length]||0)+1;
   if(!f.s)out.bad.push(L.id+':'+f.t+' no spec');
   f.m.forEach((row,k)=>{if(typeof row[0]==='number'){out.msgs++;if(row[0]>=P.length||row[1]>=P.length||row[0]<0||row[1]<0||row[0]===row[1])out.bad.push(L.id+':'+f.t+' row '+k+' lanes '+row[0]+'>'+row[1]+' of '+P.length);if(typeof row[2]!=='string'||!row[2])out.bad.push(L.id+':'+f.t+' row '+k+' no name');}
    else if(row[0]==='*'||row[0]==='='){if(typeof row[1]!=='string')out.bad.push(L.id+' note '+k);}
    else if(/^\*\d$/.test(row[0])){if(+row[0][1]>=P.length)out.bad.push(L.id+' lane note '+k);}
    else out.bad.push(L.id+':'+f.t+' row '+k+' unknown '+JSON.stringify(row).slice(0,60));});
   try{mfDiagram(L,f);mfText(L,F.indexOf(f));}catch(e){out.bad.push(L.id+':'+f.t+' render '+e.message);}});});
 return out;});
console.log('links',Object.keys(r.perLink).length,'missing',r.missing,'flows',r.flows,'msgs',r.msgs,'lanes',JSON.stringify(r.lanes));
console.log('bad',r.bad.join('\n'));console.log('dup',r.dupTitles);
// render every link panel
const n=await p.evaluate(()=>{let c=0;LINKS.forEach(L=>{select('if',L.id);if(document.querySelector('#panel .mfbox'))c++;});return c;});console.log('panels with flows',n);
await p.evaluate(()=>{state.cups=false;state.rp=false;select('if','s1mme');state.mfi.s1mme={i:7,q:''};renderPanel();});
await p.waitForTimeout(100);await p.evaluate(()=>document.querySelector('#panel .mfbox').scrollIntoView());
await p.screenshot({path:E.OUT+'/mf-s1ho.png',clip:{x:1480,y:80,width:440,height:1000}});
await p.evaluate(()=>{select('if','um');state.mfi.um={i:1,q:''};renderPanel();document.querySelector('#panel .mfbox').scrollIntoView();});
await p.screenshot({path:E.OUT+'/mf-um.png',clip:{x:1480,y:80,width:440,height:1000}});
await p.evaluate(()=>{select('if','n32');state.mfi.n32={i:1,q:''};renderPanel();});
await p.click('#panel [data-mfa="big"]');await p.waitForTimeout(150);
await p.screenshot({path:E.OUT+'/mf-n32big.png'});
console.log(errs.join('\n')||'no errors');await b.close();})();
