const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto(E.APP);await p.waitForTimeout(200);
const csv='element,instance,site,interface,ip\nnrf,NRF01,*,sbi,192.0.2.1\namf,AMF-DC2,DC2,n2,198.51.100.1\namf,AMF-DC1,DC1,n2,198.51.100.2\nenb,*,,s1mme,203.0.113.0/24\n';
await p.evaluate(async c=>{await ndLoadText(c,'s.csv');},csv);
ok(await p.evaluate(()=>JSON.stringify(ndSites())==='[["DC1",1],["DC2",1]]'),'"*" is not listed as a site: '+await p.evaluate(()=>JSON.stringify(ndSites())));
await p.evaluate(()=>{NDF.sel=new Set(['DC2']);ndSiteApply();});
ok(await p.evaluate(()=>ndCount('nrf')===1&&ndCount('amf')===1),'"*" instance shown with one site selected');
await p.evaluate(()=>{NDF.sel=new Set(['DC1']);NDF.noSite=false;ndSiteApply();});
ok(await p.evaluate(()=>ndCount('nrf')===1&&ndCount('enb')===0),'"*" stays visible when no-site entries are hidden');
await p.evaluate(()=>{NDF.sel=new Set();ndSiteApply();});ok(await p.evaluate(()=>ndCount('nrf')===0),'None hides it');
await p.evaluate(()=>{NDF.sel=new Set(['DC2']);NDF.noSite=true;ndSiteApply();select('el','nrf');});
ok((await p.textContent('#panel')).includes('all sites'),'panel shows “all sites”');
await p.click('#ndsite');const t=await p.textContent('#ndsitemenu');ok(t.includes('site * (all sites) and is always shown')&&!/\*\s*1/.test(t.replace('site * (all','')),'site menu note, no "*" entry');
await p.screenshot({path:E.OUT+'/site2.png',clip:{x:1260,y:40,width:660,height:360}});await p.keyboard.press('Escape');
// export filtered includes "*"
const x=await p.evaluate(()=>{NDexpf=true;const D={...ND,instances:ndInst()};return ndToCSV(D);});ok(x.includes('NRF01,*')&&x.includes('AMF-DC2')&&!x.includes('AMF-DC1'),'filtered export keeps "*" instances');
// template
await p.evaluate(async()=>{ND=null;ndFilterReset();await ndLoadText(ND_TEMPLATE_CSV,'t');});
ok(await p.evaluate(()=>NDwarn.length===0&&JSON.stringify(ndSites())==='[["Site-A",12],["Site-B",2]]'&&ndAllSiteN()===3),'template: ranges are site "*"');
console.log(errs.join('\n')||'no errors');await b.close();})();
