const E=require('../env');
const { chromium } = require('playwright');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
/* Check and decide: tick several groups and set one interface for all of them */
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(E.APP);await p.waitForTimeout(200);await p.click('#trbtn');await load(p,E.CAP+'/a.pcapng');
const G=await p.evaluate(()=>TR.groups.map(g=>({gk:g.gk,lbl:g.lbl,plain:!!g.plain})));console.log('  groups: '+G.map(g=>g.gk).join(' '));
const box=k=>`#panel input[data-tsel="${k}"]`,bar=()=>p.textContent('#panel .trbulk');
ok(G.length===7&&await p.locator('#panel input[data-tsel]').count()===8,'a checkbox per group and one for all');
ok(/Tick several groups/.test(await bar()),'hint while nothing is ticked');
const plain=G.filter(g=>g.plain).map(g=>g.gk);ok(plain.length===3,'3 plain-IP groups');
await p.click(box(plain[0]));await p.click(box(plain[1]));
ok(/2 selected/.test(await bar())&&await p.evaluate(()=>document.querySelectorAll('#panel tr.trsel').length===2),'2 ticked, rows highlighted');
let opts=await p.evaluate(()=>[...document.querySelectorAll('#trbulksel optgroup')].map(g=>g.label+':'+[...g.children].map(o=>o.value).join(',')));console.log('  '+opts.join(' | '));
ok(/^Candidates:.*sgi/.test(opts[0])&&/gi/.test(opts[0])&&/n6/.test(opts[0])&&!/s11/.test(opts.join()),'options: candidates first, user plane only');
ok(await p.evaluate(()=>{const h=document.querySelector('#panel input[data-tsel="*"]');return h.indeterminate&&!h.checked;}),'header checkbox half-ticked');
/* shift-click: a range */
const ks=G.map(g=>g.gk);await p.click(box(ks[0]));await p.click(box(ks[3]),{modifiers:['Shift']});
let sel=await p.evaluate(()=>[...trDecSel]);ok([0,1,2,3].every(i=>sel.includes(ks[i])),'Shift-click ticks the range 1–4 ('+sel.length+' ticked)');
/* mixed planes: both plane lists */
opts=await p.evaluate(()=>[...document.querySelectorAll('#trbulksel optgroup')].map(g=>g.label));ok(opts.some(l=>/user and control plane/.test(l)),'mixed selection: other interfaces of both planes');
/* apply without choosing */
await p.click('[data-ta=decbulk]');ok(await p.evaluate(()=>trDecSel.size)===sel.length&&await p.evaluate(()=>/Choose the interface/.test([...document.querySelectorAll('.toast')].map(t=>t.textContent).join('|'))),'Apply without a choice: asks for it, nothing changed');
/* clear, select the plain ones, set SGi */
await p.click('[data-ta=decsel][data-v=clear]');ok(await p.evaluate(()=>trDecSel.size===0),'select none');
for(const k of plain)await p.click(box(k));await p.selectOption('#trbulksel','sgi');await p.click('[data-ta=decbulk]');
let man=await p.evaluate(()=>({...TR.manual}));ok(plain.every(k=>man[k]==='sgi')&&Object.keys(man).length===3,'SGi set for the 3 plain-IP groups');
ok(await p.evaluate(()=>trDecSel.size===0&&/SGi set for 3 groups/.test([...document.querySelectorAll('.toast')].map(t=>t.textContent).join('|'))),'selection cleared, toast');
ok(await p.evaluate(ks=>ks.every(k=>document.querySelector(`select[data-tg="${k}"]`).value==='sgi'),plain),'each row shows SGi, badge assigned');
ok(await p.evaluate(()=>TR.rows.some(r=>r.canon==='sgi'&&r.conf.manual)),'the SGi interface row counts them as assigned');
/* quick picks */
await p.click('[data-ta=decsel][data-v=undecided]');sel=await p.evaluate(()=>[...trDecSel]);
const und=await p.evaluate(()=>TR.groups.filter(G=>TR.manual[G.gk]==null&&!trTop(G.cur)).map(G=>G.gk));ok(sel.length===und.length&&und.length>0,'select undecided: '+und.length);
await p.click('[data-ta=decsel][data-v=all]');ok(await p.evaluate(()=>trDecSel.size===TR.groups.length&&document.querySelector('#panel input[data-tsel="*"]').checked),'select all (header ticked)');
/* not a mobile-network interface, then automatic again */
await p.selectOption('#trbulksel','none');await p.click('[data-ta=decbulk]');ok(await p.evaluate(()=>TR.groups.every(G=>TR.manual[G.gk]==='none')),'all: not a mobile-network interface');
await p.click(box('*'));await p.selectOption('#trbulksel','auto');await p.click('[data-ta=decbulk]');ok(await p.evaluate(()=>Object.keys(TR.manual).length===0),'automatic: your choices removed');
/* the selection survives a re-render, not a new trace */
await p.click(box(ks[1]));await p.evaluate(()=>{trResolve();trRender();});ok(await p.evaluate(k=>trDecSel.has(k)&&document.querySelector(`input[data-tsel="${k}"]`).checked,ks[1]),'selection kept across re-renders');
await load(p,E.CAP+'/a.pcapng');ok(await p.evaluate(()=>trDecSel.size===0),'cleared when a trace is opened');
/* single-row selector still works */
await p.evaluate(k=>{const s=document.querySelector(`select[data-tg="${k}"]`);s.value='gi';s.dispatchEvent(new Event('change',{bubbles:true}));},plain[0]);ok(await p.evaluate(k=>TR.manual[k]==='gi',plain[0]),'per-row selector unchanged');
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
