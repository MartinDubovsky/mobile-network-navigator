const E=require('../env');
const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:1080},acceptDownloads:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto(E.APP);await p.waitForTimeout(300);
const pr=await p.evaluate(()=>['8080;443','8080, 443','30000-30100','2123/2152','443 8080 | 9090','70000','100-50','abc','0','',' 080 '].map(v=>v+' => '+(ndPortOK(v)?'ok "'+ndPortNorm(v)+'" / "'+ndPortShow(v)+'"':'BAD')));
console.log(pr.join('\n'));
ok(await p.evaluate(()=>ndPortOK('8080;443')&&!ndPortOK('70000')&&!ndPortOK('100-50')&&!ndPortOK('0')&&ndPortNorm(' 080 ')==='80'),'port parsing');
// user's case from a CSV
const w=await p.evaluate(async()=>{await ndLoadText('element,instance,site,interface,ip,port\namf,dc1-5gc-amf01-sbi-v4-consumer_for_smf_and_pcf,DC1,n11,192.0.2.1,8080;443\namf,X,DC1,n11,192.0.2.2,"8080,443"\namf,Y,DC2,n11,192.0.2.3,8080 443 99999\n','u.csv');return NDwarn;});
console.log(w.join('\n'));ok(w.length===1&&w[0].includes('99999'),'8080;443 accepted, only the bad list warned');
await p.evaluate(()=>ndCloseModal());
await p.evaluate(()=>select('el','amf'));ok((await p.textContent('#panel')).includes('8080, 443'),'ports shown as a list');
// template
await p.evaluate(async()=>{ND=null;await ndLoadText(ND_TEMPLATE_CSV,'t.csv');});
ok(await p.evaluate(()=>ND.instances.length===17&&NDwarn.length===0),'template: 17 instances, no warnings '+await p.evaluate(()=>ND.instances.length+' '+NDwarn.join('|')));
ok(await p.evaluate(()=>JSON.stringify(ndSites())==='[["Site-A",12],["Site-B",2]]'),'sites '+await p.evaluate(()=>JSON.stringify(ndSites())));
ok(await p.isVisible('#ndsite'),'site button visible');
await p.click('#ndsite');await p.waitForTimeout(80);await p.screenshot({path:E.OUT+'/site-menu.png',clip:{x:1260,y:40,width:660,height:420}});
await p.fill('#ndsiteq','b');await p.press('#ndsiteq','Enter');await p.waitForTimeout(80);
ok(await p.evaluate(()=>NDF.sel&&NDF.sel.size===1&&NDF.sel.has('Site-B')),'Enter selects the listed sites');
ok((await p.textContent('#ndsite')).includes('Site-B'),'button label '+await p.textContent('#ndsite'));
const badges=await p.evaluate(()=>[...document.querySelectorAll('.ndb')].filter(b=>b.style.display!=='none').map(b=>b.parentNode.dataset.id+b.querySelector('text').textContent).join(' '));
console.log('badges',badges);ok(badges.includes('mmeIP 1')&&!badges.includes('sgwIP')&&badges.includes('enbIP 1'),'badges follow the filter (no-site ranges kept)');
await p.keyboard.press('Escape');ok(await p.isHidden('#ndsitemenu'),'Esc closes the site menu');
await p.evaluate(()=>select('el','sgw'));let t=await p.textContent('#panel');ok(t.includes('No SGW instances in the selected sites')&&t.includes('1 more instance is hidden'),'hidden count in panel');
await p.evaluate(()=>select('el','mme'));t=await p.textContent('#panel');ok(t.includes('MME02')&&!t.includes('MME01'),'element panel filtered');
await p.screenshot({path:E.OUT+'/site-panel.png',clip:{x:1480,y:80,width:440,height:600}});
await p.evaluate(()=>select('if','s1mme'));t=await p.textContent('#panel');ok(t.includes('MME02')&&!t.includes('MME01')&&t.includes('198.51.100.128/26'),'interface panel filtered');
let r=await p.evaluate(()=>{state.q='198.51.100.6';apply();const c=[...compute().elOn];state.q='';apply();return c;});ok(!r.includes('sgw'),'search ignores hidden sites');
// no-site toggle
await p.click('#ndsite');await p.uncheck('#ndsitenone');await p.waitForTimeout(50);ok(await p.evaluate(()=>ndCount('enb')===1),'site * ranges stay visible when no-site entries are hidden');await p.check('#ndsitenone');await p.keyboard.press('Escape');
// editor default site + new site stays visible
await p.evaluate(()=>select('el','amf'));await p.click('#panel [data-nd^="add:"]');ok((await p.inputValue('#nd-site'))==='Site-B','new instance defaults to the filtered site');
await p.fill('#nd-name','AMF09');await p.fill('#nd-site','Site-C');await p.fill('#modal .nd-ip','192.0.2.99');await p.fill('#modal .nd-port','8080, 443');await p.click('#modal .primary');await p.waitForTimeout(80);
ok(await p.evaluate(()=>{const I=ND.instances.find(x=>x.name==='AMF09');return I&&I.addresses[0].port==='8080;443'&&NDF.sel.has('Site-C')&&ndVis(I);}),'port normalised, filter extended for the new site');
// export filtered
await p.click('#ndbtn');ok(await p.isVisible('#ndexpf'),'export-filtered option shown');await p.check('#ndexpf');
const [d]=await Promise.all([p.waitForEvent('download'),p.click('#ndmenu [data-ndm="csv"]')]);const fn='dl/'+d.suggestedFilename();await d.saveAs(fn);const csv=fs.readFileSync(fn,'utf8');
console.log('file',fn);ok(csv.includes('MME02')&&!csv.includes('MME01')&&csv.includes(',s1mme,192.0.2.0/28')&&csv.includes('AMF09'),'filtered export: selected sites + interface info');
ok(await p.evaluate(()=>NDdirty),'partial export keeps the unsaved flag');
// show all via panel chip
await p.evaluate(()=>select('el','mme'));await p.click('#panel [data-nd="siteclear"]');ok(await p.evaluate(()=>NDF.sel===null),'✕ in the panel clears the filter');
// remember keeps filter
await p.evaluate(()=>{NDF.sel=new Set(['Site-B']);ndSiteApply();});await p.click('#ndbtn');await p.check('#ndrem');await p.keyboard.press('Escape');
const q=await ctx.newPage();q.on('pageerror',e=>errs.push('Q '+e.message));await q.goto(E.APP);await q.waitForTimeout(400);
ok(await q.evaluate(()=>NDF.sel&&NDF.sel.has('Site-B')&&NDF.sel.size===1&&ND.instances.length===18),'remembered data keeps the site filter');
await q.evaluate(()=>{localStorage.clear();});
console.log(errs.join('\n')||'no errors');await b.close();})();
