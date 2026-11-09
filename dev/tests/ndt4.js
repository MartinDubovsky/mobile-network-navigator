const E=require('../env');require('fs').mkdirSync(E.OUT+'/dl',{recursive:true});
const { chromium } = require('playwright');
const fs=require('fs');
const URL0=E.APP;
(async () => {
  const b = await chromium.launch(); const ctx=await b.newContext({viewport:{width:1920,height:1080},acceptDownloads:true});
  const errs=[]; const hook=pg=>{pg.on('pageerror', e => errs.push('PAGEERR '+e.message)); pg.on('console', m => { if(m.type()==='error'||m.type()==='warning') errs.push('CONSOLE '+m.text()); }); pg.on('dialog',d=>{errs.push('DIALOG '+d.type());d.accept();});};
  const ok=(c,msg)=>console.log((c?'PASS ':'FAIL ')+msg);
  let p=await ctx.newPage();hook(p);
  await p.goto(URL0); await p.waitForTimeout(300);
  // load template via file chooser from menu
  fs.writeFileSync(E.OUT+'/dl/in.csv', await p.evaluate(()=>ND_TEMPLATE_CSV));
  await p.click('#ndbtn'); await p.waitForTimeout(100);
  await p.screenshot({path:E.OUT+'/nd-menu-empty.png',clip:{x:1300,y:40,width:620,height:520}});
  const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('#ndmenu [data-ndm="load"]')]);
  await fc.setFiles(E.OUT+'/dl/in.csv'); await p.waitForTimeout(400);
  ok(await p.evaluate(()=>ND&&ND.instances.length===17),'loaded via file chooser');
  ok(!(await p.evaluate(()=>ndModalOpen())),'no modal when no warnings');
  // export CSV
  const dl=async(act)=>{await p.click('#ndbtn');const [d]=await Promise.all([p.waitForEvent('download'),p.click(`#ndmenu [data-ndm="${act}"]`)]);const fn=E.OUT+'/dl/'+d.suggestedFilename();await d.saveAs(fn);return fn;};
  const fcsv=await dl('csv'); console.log('csv ->',fcsv);
  const fjson=await dl('json'); console.log('json ->',fjson);
  const fhtml=await dl('html'); console.log('html ->',fhtml, fs.statSync(fhtml).size);
  // roundtrip compare
  const cmp=await p.evaluate(async([csv,json])=>{const a=JSON.stringify(ndToJSON(ND).instances);const r1=ndParseCSV(csv);const r2=ndClean(JSON.parse(json));
    const strip=d=>JSON.stringify(ndToJSON(d).instances);return {csv:strip(r1.d)===a,json:strip(r2.d)===a,w1:r1.w,w2:r2.w,ifs:JSON.stringify(r1.d.interfaces)===JSON.stringify(ND.interfaces)};},[fs.readFileSync(fcsv,'utf8'),fs.readFileSync(fjson,'utf8')]);
  ok(cmp.csv&&cmp.json&&cmp.ifs&&!cmp.w1.length&&!cmp.w2.length,'CSV + JSON round-trip identical '+JSON.stringify(cmp));
  // encrypted JSON
  await p.click('#ndbtn');await p.click('#ndmenu [data-ndm="json-enc"]');await p.waitForTimeout(100);
  await p.fill('#ndp1','short');await p.fill('#ndp2','short');await p.click('#modal .primary');ok((await p.textContent('#nderr')).includes('10 characters'),'short passphrase rejected');
  await p.fill('#ndp1','correct horse battery');await p.fill('#ndp2','correct horse battery staple');await p.click('#modal .primary');ok((await p.textContent('#nderr')).includes('do not match'),'mismatch rejected');
  await p.fill('#ndp2','correct horse battery');
  const [d2]=await Promise.all([p.waitForEvent('download'),p.click('#modal .primary')]);const fenc=E.OUT+'/dl/'+d2.suggestedFilename();await d2.saveAs(fenc);
  const encj=JSON.parse(fs.readFileSync(fenc,'utf8'));ok(encj.format.endsWith('encrypted')&&!fs.readFileSync(fenc,'utf8').includes('192.0.2')&&encj.iterations===600000,'encrypted JSON has no plaintext '+fenc);
  // encrypted HTML
  await p.click('#ndbtn');await p.click('#ndmenu [data-ndm="html-enc"]');await p.waitForTimeout(100);
  await p.fill('#ndp1','correct horse battery');await p.fill('#ndp2','correct horse battery');
  const [d3]=await Promise.all([p.waitForEvent('download'),p.click('#modal .primary')]);const fhenc=E.OUT+'/dl/enc-'+d3.suggestedFilename();await d3.saveAs(fhenc);
  const ht=fs.readFileSync(fhenc,'utf8');const blk=h=>{const m=h.match(/<script type="application\/json" id="mnn-netdata"[^>]*>([\s\S]*?)<\/script>/g);return m||[];};
  ok(blk(ht).length===1&&!blk(ht)[0].includes('MME01')&&ht.includes('data-encrypted="1"'),'encrypted HTML has no plaintext in data block');
  const plain=fs.readFileSync(fhtml,'utf8');ok(plain.startsWith('<!DOCTYPE html>')&&plain.includes('"MME01"')&&blk(plain).length===1&&blk(plain)[0].includes('"MME01"'),'plain HTML embeds data once');
  ok(!/<body[^>]*class=/.test(plain)&&!plain.includes('<g class="node')&&!plain.includes('class="ndb"'),'saved HTML is pristine (no rendered state)');
  // open plain HTML with data
  let q=await ctx.newPage();hook(q);await q.goto(require('url').pathToFileURL(fhtml).href);await q.waitForTimeout(500);
  ok(await q.evaluate(()=>ND&&ND.instances.length===17&&!NDdirty&&NDsrc.kind==='embedded'),'saved HTML opens with data');
  // save again from the saved file -> still exactly one data block
  const [d4]=await Promise.all([q.waitForEvent('download'),(async()=>{await q.click('#ndbtn');await q.click('#ndmenu [data-ndm="html"]');})()]);const f2=E.OUT+'/dl/again.html';await d4.saveAs(f2);
  ok(blk(fs.readFileSync(f2,'utf8')).length===1,'re-saving keeps one data block');
  await q.close();
  // open encrypted HTML: wrong then right passphrase
  q=await ctx.newPage();hook(q);await q.goto(require('url').pathToFileURL(fhenc).href);await q.waitForTimeout(300);
  ok(await q.evaluate(()=>ndModalOpen()),'passphrase prompt on open');
  await q.fill('#ndp1','wrong passphrase!');await q.click('#modal .primary');await q.waitForTimeout(1500);
  ok((await q.textContent('#modal .mbody')).includes('Wrong passphrase'),'wrong passphrase message');
  await q.fill('#ndp1','correct horse battery');await q.click('#modal .primary');await q.waitForTimeout(1500);
  ok(await q.evaluate(()=>ND&&ND.instances.length===17&&NDsrc.enc),'encrypted HTML unlocked');
  ok((await q.textContent('#ndstat')).includes('🔒'),'lock shown in status');
  await q.close();
  // encrypted HTML, cancel -> tool works without data
  q=await ctx.newPage();hook(q);await q.goto(require('url').pathToFileURL(fhenc).href);await q.waitForTimeout(300);await q.keyboard.press('Escape');await q.waitForTimeout(100);
  ok(await q.evaluate(()=>!ndModalOpen()&&ND===null),'Esc on unlock -> no data, tool usable');await q.close();
  // load encrypted JSON into fresh page via drop-equivalent
  q=await ctx.newPage();hook(q);await q.goto(URL0);await q.waitForTimeout(200);
  q.evaluate(t=>{ndLoadText(t,'x.enc.json');},fs.readFileSync(fenc,'utf8'));await q.waitForTimeout(200);
  await q.fill('#ndp1','correct horse battery');await q.click('#modal .primary');await q.waitForTimeout(1500);
  ok(await q.evaluate(()=>ND&&ND.instances.length===17),'encrypted JSON loads');
  // merge: load semicolon csv and choose merge
  q.evaluate(()=>{ndLoadText('element;instance;interface;ip\nmme;MME01;s10;192.0.2.13\nmme;MME09;s1mme;192.0.2.99\n','add.csv');});await q.waitForTimeout(200);
  ok((await q.textContent('#modal .mbody')).includes('Replace'),'replace/merge prompt');
  await q.click('#modal .mbtns button:has-text("Merge")');await q.waitForTimeout(200);
  ok(await q.evaluate(()=>ND.instances.length===18&&ND.instances.find(I=>I.name==='MME01').addresses.some(A=>A.interface==='s10')&&NDdirty),'merge combined instances');
  // editor: add instance to AMF
  await q.evaluate(()=>select('el','amf'));await q.click('#panel [data-nd^="add:"]');await q.waitForTimeout(100);
  await q.fill('#nd-name','AMF02');await q.fill('#nd-site','Site-B');
  await q.fill('#modal .nd-ip','192.0.2.300');await q.click('#modal .primary');ok((await q.textContent('#nderr')).includes('Please check'),'invalid IP flagged in editor');
  await q.fill('#modal .nd-ip','192.0.2.65');await q.click('#nd-addrow');
  const rows=await q.$$('#modal .ndedit tbody tr');await rows[1].$eval('.nd-if',s=>{s.value='sbi';});await (await rows[1].$('.nd-ip')).fill('192.0.2.66');
  // '/' typed in input must stay in input
  await (await rows[1].$('.nd-note')).type('a/b');ok((await (await rows[1].$('.nd-note')).inputValue())==='a/b','"/" can be typed in editor');
  await q.screenshot({path:E.OUT+'/nd-editor.png'});
  await q.click('#modal .primary');await q.waitForTimeout(100);
  ok(await q.evaluate(()=>{const I=ND.instances.find(I=>I.name==='AMF02');return I&&I.site==='Site-B'&&I.addresses.length===2&&I.addresses[1].interface==='sbi'&&!ndModalOpen();}),'editor saved new instance');
  ok((await q.textContent('#panel')).includes('AMF02'),'panel refreshed');
  // edit & delete
  const id=await q.evaluate(()=>ND.instances.find(I=>I.name==='AMF02').id);await q.click(`#panel [data-nd="edit:${id}"]`);await q.click('#modal .mbtns button:has-text("Delete instance")');await q.waitForTimeout(100);
  await q.click('#modal .mbtns button:has-text("Delete")');await q.waitForTimeout(100);
  ok(await q.evaluate(()=>!ND.instances.find(I=>I.name==='AMF02')&&!ndModalOpen()),'instance deleted');
  // interface info edit
  await q.evaluate(()=>select('if','n2'));await q.click('#panel [data-nd^="ifedit:"]');await q.fill('#nd-sub','192.0.2.64/28');await q.fill('#nd-vl','121');await q.press('#nd-sub','Enter');await q.waitForTimeout(100);
  ok(await q.evaluate(()=>ND.interfaces.n2&&ND.interfaces.n2.subnet==='192.0.2.64/28'),'interface info saved with Enter');
  // remember
  await q.click('#ndbtn');await q.check('#ndrem');await q.waitForTimeout(100);
  const q2=await ctx.newPage();hook(q2);await q2.goto(URL0);await q2.waitForTimeout(400);
  ok(await q2.evaluate(()=>ND&&ND.instances.length===18&&NDsrc.kind==='browser'),'remembered data restored in new tab');
  await q2.click('#ndbtn');await q2.uncheck('#ndrem');await q2.waitForTimeout(100);
  ok(await q2.evaluate(()=>localStorage.getItem('mnn-netdata-v1')===null),'unticking removes stored data');
  // clear
  await q2.click('#ndmenu [data-ndm="clear"]');await q2.click('#modal .mbtns button:has-text("Remove")');await q2.waitForTimeout(100);
  ok(await q2.evaluate(()=>ND===null&&document.querySelectorAll('.ndb:not([style*="none"])').length===0),'clear removes data + badges');
  await b.close();
  console.log(errs.join('\n')||'no errors');
})();
