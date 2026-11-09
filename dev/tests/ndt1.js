const E=require('../env');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx=await b.newContext({viewport:{width:1920,height:1080},acceptDownloads:true}); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e => errs.push('PAGEERR '+e.message)); p.on('console', m => { if(m.type()==='error'||m.type()==='warning') errs.push('CONSOLE '+m.type()+' '+m.text()); });
  await p.goto(E.APP); await p.waitForTimeout(400);
  console.log('ver', await p.textContent('#ver'));
  // load template via ndLoadText
  const r = await p.evaluate(async()=>{await ndLoadText(ND_TEMPLATE_CSV,'tmpl.csv');return {inst:ND.instances.length,warn:NDwarn,ifs:Object.keys(ND.interfaces),net:ND.network};});
  console.log(JSON.stringify(r,null,1));
  console.log('modal open?', await p.evaluate(()=>ndModalOpen()));
  console.log('badges', await p.evaluate(()=>[...document.querySelectorAll('.ndb')].filter(b=>b.style.display!=='none').map(b=>b.parentNode.dataset.id+':'+b.textContent).join(' ')));
  console.log('status', await p.textContent('#ndstat'));
  await p.screenshot({path:E.OUT+'/nd1.png'});
  console.log(errs.join('\n')||'no errors');
  await b.close();
})();
