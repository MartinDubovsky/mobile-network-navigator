const E=require('../env');
const { chromium } = require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
/* Hand-over from Capture Tool: a stand-in tool page (COOP same-origin-allow-popups) opens the navigator, served sandboxed
   (CSP sandbox allow-scripts allow-downloads – opaque origin) as Capture Tool serves it, and hands over capture files by window message. */
const TOOL=`<!DOCTYPE html><meta charset="utf-8"><title>tool</title><script>
window.log=[];let w=null,pending=null;
addEventListener('message',async e=>{if(e.source!==w)return;log.push(e.data);
 if(e.data&&e.data.type==='mnn-ready'&&pending){const p=pending;pending=null;await send(p);}});
async function send(p){const files=[];for(const x of p.files){const b=await (await fetch('/cap/'+x.src)).blob();files.push({file:new File([b],x.name),name:x.name,group:x.group});}
 w.postMessage({type:'mnn-open-capture',version:p.version||1,from:'Capture Tool',label:p.label,files},'*');}
window.openNav=p=>{pending=p;w=window.open('/nav/index.html','mnn');};
window.post=m=>w.postMessage(m,'*');window.sendAgain=p=>send(p);
</script>`;
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);
 if(u==='/tool.html'){r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cross-Origin-Opener-Policy':'same-origin-allow-popups'});r.end(TOOL);return;}
 if(u==='/nav/index.html'){r.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"sandbox allow-scripts allow-downloads",'Cache-Control':'no-store'});r.end(fs.readFileSync(path.join(E.ROOT,'index.html')));return;}
 if(u.startsWith('/cap/')){const f=path.join(E.CAP,path.basename(u));if(fs.existsSync(f)){r.writeHead(200,{'Content-Type':'application/octet-stream'});r.end(fs.readFileSync(f));return;}}
 r.writeHead(404);r.end();});
(async()=>{await new Promise(res=>srv.listen(0,'127.0.0.1',res));const BASE=`http://localhost:${srv.address().port}`;
const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true,viewport:{width:1600,height:1000}});const errs=[];
const t=await ctx.newPage();t.on('pageerror',e=>errs.push('tool: '+e));await t.goto(BASE+'/tool.html');
/* a capture on two probes; Probe-A has two rotated parts */
const [nav]=await Promise.all([ctx.waitForEvent('page'),t.evaluate(()=>openNav({label:'Capture 100123',files:[
 {src:'a.pcapng',name:'100123_2026-11-19_10-00-00.pcapng',group:'Probe-A'},{src:'a.pcapng',name:'100123_2026-11-19_10-00-00-1.pcapng',group:'Probe-A'},
 {src:'a.pcapng',name:'100123_2026-11-19_10-00-00.pcapng',group:'Probe-B'}]}))]);
nav.on('pageerror',e=>errs.push('navigator: '+e));
await nav.waitForFunction(()=>typeof TR!=='undefined'&&TR&&!trJob,null,{timeout:30000});await nav.waitForTimeout(200);
ok(await nav.evaluate(()=>self.origin==='null'),'navigator runs sandboxed (opaque origin)');
ok(await nav.evaluate(()=>!pwaWeb()&&!document.querySelector('link[rel=manifest]')),'sandbox: install / offline code skipped, no error');
let log=await t.evaluate(()=>log);ok(log[0]&&log[0].type==='mnn-ready'&&log[0].version===1&&/^\d{4}\./.test(log[0].app),'tool gets mnn-ready with the app version');
ok(log[1]&&log[1].type==='mnn-received'&&log[1].ok===true&&log[1].files===3,'receipt: 3 files accepted');
const ifs=await nav.evaluate(()=>TR.file.ifs.map((I,i)=>trPortName(i)+'='+I.pk));console.log('  '+ifs.join(' · '));
ok(ifs.length===4&&ifs[0]==='Probe-A · port0=120'&&ifs[1]==='Probe-A · port1=84'&&ifs[2]==='Probe-B · port0=60'&&ifs[3]==='Probe-B · port1=42','capture interfaces grouped per probe: the two parts of Probe-A share theirs');
ok(await nav.evaluate(()=>TR.file.files.length===3&&TR.file.pk===306),'3 files, 306 packets');
const src=await nav.textContent('#panel .trsrc');ok(/Handed over by Capture Tool \(http:\/\/localhost:\d+\) – Capture 100123/.test(src),'panel names the source: '+src);
ok(await nav.evaluate(()=>state.trMode&&TR.rows.length>5),'trace panel open with the results');
let w=await nav.evaluate(()=>trWsFor('port:1'));ok(w&&w.f==='frame.interface_id==1'&&w.notes[0]==='in the files of Probe-A','Wireshark filter of a grouped capture interface: “in the files of Probe-A”');
/* a direction-per-port view is not split across the parts */
ok(await nav.evaluate(()=>TR.ports.filter(p=>p.pk).length===4),'4 capture interfaces in the direction table');
/* re-reading (protocol ports changed) keeps the groups and the source */
await nav.evaluate(()=>trOpenFiles(trFiles,{quiet:true}));await nav.waitForFunction(()=>TR&&!trJob);
ok(await nav.evaluate(()=>TR.file.ifs.length===4&&trSrc&&/Capture 100123/.test(trSrc.label)),'re-read keeps groups and source');
/* invalid messages */
await t.evaluate(()=>post({type:'mnn-open-capture',version:1,files:['not a file']}));await nav.waitForTimeout(150);
log=await t.evaluate(()=>log);ok(log.at(-1).ok===false&&/Blob or File/.test(log.at(-1).error)&&await nav.evaluate(()=>TR.file.files.length===3),'not a file: refused with a reason, trace unchanged');
await t.evaluate(()=>post({type:'mnn-open-capture',version:2,files:[]}));await nav.waitForTimeout(150);
log=await t.evaluate(()=>log);ok(log.at(-1).ok===false&&/version 2/.test(log.at(-1).error),'unknown version refused');
await t.evaluate(()=>post({type:'mnn-open-capture',version:1,files:[]}));await nav.waitForTimeout(150);ok((await t.evaluate(()=>log)).at(-1).ok===false,'no files refused');
const n=(await t.evaluate(()=>log)).length;
await nav.evaluate(()=>dispatchEvent(new MessageEvent('message',{data:{type:'mnn-open-capture',version:1,files:[{file:new Blob([new Uint8Array(4)])}]},source:null})));await nav.waitForTimeout(150);
ok(await nav.evaluate(()=>TR.file.files.length===3)&&(await t.evaluate(()=>log)).length===n,'a message from anyone but the opener is ignored');
/* a second capture from the tool replaces the trace */
await t.evaluate(()=>sendAgain({label:'Capture 100124',files:[{src:'port-ul.pcap',name:'100124_ul.pcap',group:'Probe-C'},{src:'port-dl.pcap',name:'100124_dl.pcap',group:'Probe-D'}]}));
await nav.waitForFunction(()=>TR&&!trJob&&TR.file.files.length===2,null,{timeout:30000});
ok(await nav.evaluate(()=>TR.file.ifs.map((I,i)=>trPortName(i)).join('|')==='Probe-C|Probe-D'&&/Capture 100124/.test(document.querySelector('#panel .trsrc').textContent)),'second hand-over replaces the trace (Probe-C / Probe-D)');
/* saving works in the sandbox (allow-downloads) */
await nav.click('.trbtns [data-ta=save]');await nav.check('#modal input[value=json]');const [d]=await Promise.all([nav.waitForEvent('download'),nav.click('#modal .mbtns .primary')]);
ok(/trace-results\.json$/.test(d.suggestedFilename()),'Save results downloads in the sandbox: '+d.suggestedFilename());
/* opened from disk: no opener, nothing happens */
const p=await ctx.newPage();p.on('pageerror',e=>errs.push('file: '+e));await p.goto(E.APP);await p.waitForTimeout(200);ok(await p.evaluate(()=>!window.opener&&!trSrc),'opened directly: no hand-over');
await b.close();srv.close();
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');process.exit(fails?1:0);})();
