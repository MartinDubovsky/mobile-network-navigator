const E=require('../env');
const { chromium } = require('playwright');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);};
const ports=p=>p.evaluate(()=>TR.ports.filter(x=>x.pk).map(x=>({n:x.name,v:x.v,ul:x.ul,dl:x.dl,unk:x.unk,tcp:x.tcp})));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(E.APP);await p.waitForTimeout(200);await p.click('#trbtn');
await load(p,E.CAP+'/g-sgi.pcapng');
let P=await ports(p);console.log(JSON.stringify(P));
ok(P.every(x=>x.v==null&&x.ul+x.dl===0),'undecided plain IP: no direction (as before)');
ok(await p.evaluate(()=>TR.hs.size===18),'handshake roles for 18 addresses (14 UEs, 3 servers, 1 scanner): '+await p.evaluate(()=>TR.hs.size));
const roles=await p.evaluate(()=>[...TR.hs].map(([k,h])=>trIPs(k)+'='+h.join('/')+':'+trHsRole(h)).sort());console.log('  '+roles.join(' '));
ok(roles.includes('198.51.100.200=0/10:s')&&roles.includes('192.0.2.250=2/0:c')&&roles.includes('203.0.113.12=2/0:c')&&roles.includes('203.0.113.10=2/1:null'),'roles: servers accept, UEs open, scanned UEs mixed');
// assign the plain groups to SGi
await p.evaluate(()=>{TR.groups.filter(g=>g.plain).forEach(g=>TR.manual[g.gk]='sgi');trResolve();renderPanel();});await p.waitForTimeout(100);
P=await ports(p);console.log(JSON.stringify(P));
const g=n=>P.find(x=>x.n===n);
ok(g('dpdk0').v==='up'&&g('dpdk0').ul===110&&g('dpdk0').dl===2&&g('dpdk0').unk===0,'dpdk0 → uplink (110 ↑, 2 ↓ scanner RSTs)');
ok(g('dpdk1').v==='down'&&g('dpdk1').dl===180&&g('dpdk1').ul===2,'dpdk1 → downlink (180 ↓, 2 ↑ scanner SYNs)');
ok(g('eth2').v==='both'&&g('eth2').ul===24&&g('eth2').dl===24,'eth2 → both, 24 / 24');
ok(P.every(x=>x.tcp>=.5*(x.ul+x.dl)),'marked as from TCP set-up');
const txt=await p.evaluate(()=>document.querySelector('#panel').textContent);
ok(/mostly from TCP connection set-up/.test(txt)&&/↑ Uplink/.test(txt)&&/↓ Downlink/.test(txt),'panel shows the verdicts and the method');
ok(/dpdk0.*\(uplink\) and .*dpdk1.*\(downlink\) carry the two directions of SGi/.test(await p.evaluate(()=>document.querySelector('#panel .trnote')?.textContent||'')),'pair hint dpdk0 / dpdk1');
const row=await p.evaluate(()=>{const R=TR.rows.find(r=>r.canon==='sgi');return [R.ul,R.dl];});ok(row[0]===136&&row[1]===206,'SGi row ↑136 ↓206: '+row);
// marked as not a mobile-network interface → no direction
await p.evaluate(()=>{TR.groups.filter(g=>g.plain).forEach(g=>TR.manual[g.gk]='none');trResolve();});P=await ports(p);ok(P.every(x=>x.ul+x.dl===0),'not a mobile-network interface → no direction');
// VLAN from network data resolves the group → direction too
await p.evaluate(async()=>{TR.manual={};await ndLoadText(JSON.stringify({format:'mobile-network-navigator/netdata',version:1,network:'v',instances:[],interfaces:{sgi:{subnet:'',vlan:'400',note:''}}}),'v.json');});await p.waitForTimeout(200);
P=await ports(p);ok(g&&P.find(x=>x.n==='dpdk0').v==='up'&&P.find(x=>x.n==='dpdk1').v==='down'&&P.find(x=>x.n==='eth2').v==null,'VLAN 400 = SGi in network data → dpdk0 up, dpdk1 down; VLAN 401 still open');
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
