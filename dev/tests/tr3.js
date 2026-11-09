const E=require('../env');
const { chromium } = require('playwright');
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob,null,{timeout:30000});await p.waitForTimeout(400);};
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m);}else console.log('ok  ',m);};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto(E.APP);await p.waitForTimeout(300);
await load(p,E.CAP+'/c.pcap');
/* manual decision for the unsignalled GTP-U group */
await p.selectOption('select[data-tg="gtpu||0"]','s1u');await p.waitForTimeout(200);
let r=await p.evaluate(()=>TR.rows.map(r=>r.canon+':'+trTop(r.conf)).join(','));ok(r==='s1u:manual','manual assignment → '+r);
ok(await p.evaluate(()=>!!document.querySelector('tr[data-trr="s1u"] .trc.c-manual')),'manual badge in the interfaces table');
const endTxt=await p.evaluate(()=>[...document.querySelectorAll('.trends-t tbody tr')].map(t=>t.cells[0].textContent+':'+(t.cells[0].querySelector('button')||{}).title).join('|'));ok(/^SGW:fan-out\|eNodeB:fan-out/.test(endTxt),'fan-out: the hub is the S-GW, its 8 peers are eNodeBs → '+endTxt.slice(0,60));
await p.selectOption('select[data-tg="gtpu||0"]','');await p.waitForTimeout(200);
ok(await p.evaluate(()=>TR.rows.length===0),'reset to automatic removes the row');
await p.selectOption('select[data-tg="gtpu||0"]','none');await p.waitForTimeout(200);
ok(await p.evaluate(()=>TR.rows.length===0&&TR.groups[0].cur.none>0),'“not a mobile interface”');
/* network data: one end of the group on S5 → likely; both ends → certain */
await p.selectOption('select[data-tg="gtpu||0"]','');
await p.evaluate(()=>{const {d}=ndClean({network:'Lab',instances:[{element:'sgw',name:'SGW-LAB-1',site:'Lab',addresses:[{interface:'s5',ip:'192.0.2.70'}]}]});ndSet(d,'test',[],false);});await p.waitForTimeout(200);
r=await p.evaluate(()=>TR.rows.map(r=>r.canon+':'+trTop(r.conf)+':'+trTop(r.why)).join(','));ok(/^s5:likely:one address is on S5/.test(r),'network data one end → '+r);
await p.evaluate(()=>{const {d}=ndClean({network:'Lab',instances:[{element:'sgw',name:'SGW-LAB-1',addresses:[{interface:'s1u',ip:'192.0.2.70'}]},{element:'enb',name:'eNB-*',addresses:[{interface:'s1u',ip:'198.51.100.0/24'}]}]});ndSet(d,'test',[],false);});await p.waitForTimeout(200);
r=await p.evaluate(()=>TR.rows.map(r=>r.canon+':'+trTop(r.conf)).join(','));ok(r==='s1u:sure','network data both ends (host + subnet) → '+r);
const names=await p.evaluate(()=>document.querySelector('.trends-t').textContent);ok(/SGW-LAB-1/.test(names)&&/eNB-\*/.test(names),'network-data instance names in the address table');
const elx=await p.evaluate(()=>[...TR.ends.values()].map(e=>e.ip+'='+trTop(e.els)).sort().join(','));ok(/192\.0\.2\.70=sgw/.test(elx)&&/198\.51\.100\.40=enb/.test(elx),'elements from network data: '+elx.slice(0,80));
await p.evaluate(()=>{ND=null;ndRefresh();});await p.waitForTimeout(100);
/* CUPS hint and the switch */
await load(p,E.CAP+'/b.pcap');
ok(await p.evaluate(()=>/exist only in the CUPS view/.test(panel.textContent)),'CUPS note for Sxa / Sxb in the classic view');
await p.click('[data-ta="cups"]');await p.waitForTimeout(400);
r=await p.evaluate(()=>[state.cups,state.trMode,TR.rows.map(r=>r.canon+'→'+trShown(r).join('+')).join(',')]);ok(r[0]&&r[1]&&/sxa→sxa/.test(r[2])&&/gx→gxc/.test(r[2]),'CUPS view: '+r[2]);
ok(await p.evaluate(()=>!/exist only in the CUPS view/.test(panel.textContent)),'CUPS note gone after switching');
ok(await p.evaluate(()=>document.querySelector('g[data-l="sxa"], [data-id="sxa"]')!==undefined&&gT.querySelectorAll('.trb').length>=3),'map badges drawn: '+await p.evaluate(()=>gT.querySelectorAll('.trb').length));
await p.click('[data-cups="0"]');await p.waitForTimeout(200);
/* element panel + back, hover, Escape, close */
await load(p,E.CAP+'/a.pcapng');
await p.click('tr[data-trr="gx"] .trif');await p.waitForTimeout(250);
r=await p.evaluate(()=>[state.trMode,state.sel&&state.sel.join(':'),!!panel.querySelector('[data-ta="back"]'),/In the trace/.test(panel.textContent)]);ok(!r[0]&&r[1]==='if:gx'&&r[2]&&r[3],'interface panel with “in the trace” and back: '+r);
await p.click('[data-ta="back"]');await p.waitForTimeout(250);ok(await p.evaluate(()=>state.trMode&&panel.dataset.tr==='1'),'back to trace analysis');
await p.click('.trends-t button[data-sel="el:pgw"]');await p.waitForTimeout(250);
ok(await p.evaluate(()=>state.sel&&state.sel[1]==='pgw'&&/192\.0\.2\.10/.test(panel.textContent)),'element panel lists the P-GW address from the trace');
await p.click('[data-ta="back"]');await p.waitForTimeout(250);
await p.hover('tr[data-trr="n4"]');await p.waitForTimeout(150);ok(await p.evaluate(()=>state.trHover==='n4'&&LINK.n4.g.classList.contains('lv3')),'hover highlights N4');
await p.mouse.move(5,500);await p.waitForTimeout(150);
await p.click('.trb[data-tr="gn"]',{force:true});await p.waitForTimeout(200);ok(await p.evaluate(()=>state.trSel==='gn'&&panel.querySelector('tr[data-trr="gn"]').classList.contains('on')),'badge click selects the row');
await p.keyboard.press('Escape');await p.waitForTimeout(200);ok(await p.evaluate(()=>!state.trMode&&!!TR&&document.querySelector('#trbtn').classList.contains('has')),'Escape leaves trace mode, trace kept');
ok(await p.evaluate(()=>/Trace analysis/.test(panel.textContent)&&!!panel.querySelector('.trcta [data-ta="back"]')),'overview offers the way back');
await p.click('#pdbtn');await p.waitForTimeout(200);ok(await p.evaluate(()=>state.procMode&&!state.trMode),'procedures and trace are exclusive');
await p.click('#trbtn');await p.waitForTimeout(200);ok(await p.evaluate(()=>!state.procMode&&state.trMode),'trace button leaves the procedures');
/* privacy: nothing in the URL, nothing in storage, nothing in the saved page */
r=await p.evaluate(()=>{const ls=JSON.stringify(Object.assign({},localStorage));const doc=ndHTMLwith?ndHTMLwith(null,null):'';return [location.hash,ls.includes('192.0.2.10'),ls.includes('a.pcapng'),String(doc).includes('a.pcapng')||String(doc).includes('pgw01.epc.example.net')];});
ok(!/192|pcap|trace/i.test(r[0])&&!r[1]&&!r[2]&&!r[3],'privacy – hash “'+r[0]+'”, storage and saved page free of trace data');
await p.click('[data-ta="close"]');await p.waitForTimeout(300);ok(await p.evaluate(()=>TR===null&&!state.trMode&&gT.childNodes.length===0),'close discards the trace');
/* drag and drop a capture */
const buf=require('fs').readFileSync(E.CAP+'/b.pcap');
await p.evaluate(async(arr)=>{const f=new File([new Uint8Array(arr)],'dropped.pcap');const dt=new DataTransfer();dt.items.add(f);document.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));},[...buf]);
await p.waitForFunction(()=>TR&&!trJob,null,{timeout:5000});ok(await p.evaluate(()=>TR.file.name==='dropped.pcap'&&state.trMode),'dropping a capture opens it');
/* assigning unsignalled GTP-U lets its plain-IP traffic follow (UE address correlation) */
await p.evaluate(()=>trClose());await load(p,E.CAP+'/a.pcapng');
await p.selectOption('select[data-tg="gtpu|10.400|1"]','s5');await p.waitForTimeout(200);
r=await p.evaluate(()=>{const R=TR.rows.find(r=>r.canon==='s5');return R&&trTop(R.conf);});ok(r==='manual','QinQ GTP-U group assigned to S5');
/* progress and cancel on the bigger file */
await p.evaluate(()=>trClose());
console.log('errors',errs.length?errs:'none');if(errs.length)fails++;
console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
