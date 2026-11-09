const E=require('../env');
const { chromium } = require('playwright');
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob,null,{timeout:30000});await p.waitForTimeout(300);};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(E.APP);await p.waitForTimeout(300);
await load(p,process.argv[2]||E.CAP+'/a.pcapng');
const r=await p.evaluate(()=>({err:trErr,file:TR&&{...TR.file,ifs:TR.file.ifs.map(i=>i.name+':'+i.pk)},
 rows:TR&&TR.rows.map(r=>r.canon+' '+r.pk+' '+trTop(r.conf)+' | '+trTop(r.why)),
 groups:TR&&TR.groups.map(g=>g.gk+' '+g.pk+' cur='+JSON.stringify(g.cur)+' | '+trTop(g.why)),
 other:TR&&TR.other.map(o=>o.lbl+' '+o.pk),nonip:TR&&[...TR.nonip.entries()].map(([k,v])=>k+':'+v.pk),infra:TR&&[...TR.infra.entries()].map(([k,v])=>k+':'+v.pk),trunc:TR&&TR.trunc,bad:TR&&TR.bad,frag:TR&&TR.fragOrph,
 ends:TR&&[...TR.ends.values()].map(e=>e.ip+'='+trTop(e.els)+' ['+[...e.links].join(',')+'] '+[...(TR.names.get(e.ip)||new Map()).keys()].join(';'))}));
console.log(JSON.stringify(r,null,1));
await p.screenshot({path:E.OUT+'/tr1.png'});
console.log('errs',errs);await b.close();})();
