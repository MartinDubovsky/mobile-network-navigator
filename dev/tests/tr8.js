const E=require('../env');
const { chromium } = require('playwright');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
/* GTP-U without signalling: tunnels oriented by the TCP set-up inside them (h-gtpu-tcp.pcapng, trgen6.py) */
const load=async(p,f)=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(200);};
const flows=p=>p.evaluate(()=>Object.fromEntries([...TR.flows.values()].filter(f=>f.cls==='gtpu').map(f=>{const l=f.res.links[0],E=l?f.E.get(l):null;
 return [f.A,{hs:f.x.hs,l:f.res.links,ul:f.ul,tcp:f.ulTcp,ea:E&&E[f.A]?E[f.A].el+'/'+E[f.A].src:null,eb:E&&E[f.B]?E[f.B].el+'/'+E[f.B].src:null}];})));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:950}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(E.APP);await p.waitForTimeout(200);await p.click('#trbtn');
await load(p,E.CAP+'/h-gtpu-tcp.pcapng');
let F=await flows(p);console.log(JSON.stringify(F));
const T='TCP set-up inside the tunnel (the UE side sends the SYNs)';
const f1=F['192.0.2.31'],f2=F['192.0.2.32'],f3=F['192.0.2.33'],f4=F['192.0.2.34'];
ok(f1&&f1.hs+''==='10,0','tunnel 1: 10 votes for gNB → UPF uplink (4 IPv4 + 1 IPv6 handshakes, SYN and SYN-ACK each)');
ok(f1.l+''==='n3'&&f1.ul===0&&f1.tcp,'tunnel 1: N3, uplink a→b, from TCP set-up');
ok(/^gnb/.test(f1.ea)&&f1.ea.endsWith(T)&&f1.eb==='upf/'+T,'tunnel 1: gNB / UPF from TCP set-up: '+f1.ea+' · '+f1.eb);
ok(f3.hs+''==='4,4'&&f3.tcp===false&&/fan-out$/.test(f3.ea),'tunnel 3: mixed handshakes – TCP undecided, ends from fan-out');
ok(f4.hs+''==='4,0'&&f4.tcp===false&&/fan-out$/.test(f4.ea),'tunnel 4: 4 votes (the later fragment not counted) – under the minimum, fan-out');
ok(f2.hs+''==='6,0'&&!f2.l.length&&f2.ul==null&&f2.ea==null,'tunnel 2: undecided interface – no ends, no direction');
// N6: the UE and the server are known only from the TCP-oriented tunnel → counted as TCP set-up
let N6=await p.evaluate(()=>{const R=TR.rows.find(r=>r.canon==='n6');return R&&[R.ul,R.dl,R.dtcp];});
ok(N6&&N6[0]===5&&N6[1]===5&&N6[2]===10,'N6 ↑5 ↓5, all from TCP set-up: '+N6);
const ue=await p.evaluate(()=>[...TR.ue].filter(([k])=>['203.0.113.50','198.51.100.210'].includes(trIPs(k))).map(([k,u])=>trIPs(k)+':'+u.ue+':'+u.uet).sort());
ok(ue+''==='198.51.100.210:false:false,203.0.113.50:true:true','UE known from the TCP-oriented tunnel only (uet), server behind fan-out tunnels not: '+ue);
// capture interfaces
let P=await p.evaluate(()=>TR.ports.filter(x=>x.pk).map(x=>({n:x.name,v:x.v,ul:x.ul,dl:x.dl,unk:x.unk,tcp:x.tcp})));console.log(JSON.stringify(P));
const g=n=>P.find(x=>x.n===n);
ok(g('dpdk0').v==='up'&&g('dpdk0').ul===22&&g('dpdk0').dl===0&&g('dpdk0').tcp===22,'dpdk0 → uplink, from TCP set-up (unknown: the undecided tunnel)');
ok(g('dpdk1').v==='down'&&g('dpdk1').dl===22&&g('dpdk1').tcp===22,'dpdk1 → downlink, from TCP set-up');
ok(g('eth2').v==='both','eth2 → both');
let txt=await p.evaluate(()=>document.querySelector('#panel').textContent);
ok(/mostly from TCP connection set-up/.test(txt)&&/TCP set-up/.test(txt),'panel names the method');
const n3=await p.evaluate(()=>{const R=TR.rows.find(r=>r.canon==='n3');return [R.dtcp,R.ul+R.dl,document.querySelector('tr[data-trr="n3"] .trtcp')!=null];});
ok(n3[0]===34&&n3[1]===83&&!n3[2],'N3: 34 of 83 packets oriented by TCP set-up (tunnel 1), the rest by fan-out – not marked TCP: '+n3);
const tip=await p.evaluate(()=>[...document.querySelectorAll('#panel .trends-t button[data-sel]')].map(b=>b.textContent+'|'+b.title).filter(x=>/TCP set-up inside/.test(x)));
ok(tip.length>=2,'element tooltip names the rule: '+tip.join(' · '));
// assign tunnel 2 to S1-U → the eNodeB end from TCP set-up
await p.evaluate(()=>{TR.groups.filter(g=>g.gk.startsWith('gtpu|301')).forEach(g=>TR.manual[g.gk]='s1u');trResolve();renderPanel();});
F=await flows(p);const s=F['192.0.2.32'];
ok(s.l+''==='s1u'&&s.ul===0&&s.tcp&&s.ea==='enb/'+T&&s.eb==='sgw/'+T,'tunnel 2 as S1-U: eNodeB / SGW from TCP set-up: '+s.ea+' · '+s.eb);
P=await p.evaluate(()=>TR.ports.filter(x=>x.pk).map(x=>({n:x.name,unk:x.unk})));ok(P.find(x=>x.n==='dpdk0').unk===0,'dpdk0: nothing of unknown direction left');
// suggestions: ends from TCP set-up are never pre-selected
const sg=await p.evaluate(()=>trSuggest().flatMap(S=>S.addrs.map(A=>A.ip+':'+A.conf+':'+/element from TCP/.test(A.why))).filter(x=>/^192\.0\.2\.3[12]|^198\.51\.100\.4[12]/.test(x)).sort());
ok(sg.join(' ')==='192.0.2.31:likely:true 192.0.2.32:manual:true 198.51.100.41:likely:true 198.51.100.42:manual:true','suggestions not certain (never pre-selected), the reason names the rule: '+sg.join(' '));
// network data names one end → it wins, TCP set-up no longer used for that flow
await p.evaluate(async()=>{await ndLoadText(JSON.stringify({format:'mobile-network-navigator/netdata',version:1,network:'t',instances:[{element:'upf',name:'UPF01',addresses:[{interface:'n3',ip:'198.51.100.41'}]}],interfaces:{}}),'t.json');});await p.waitForTimeout(300);
F=await flows(p);ok(F['192.0.2.31'].eb==='upf/network data'&&F['192.0.2.31'].tcp===false&&F['192.0.2.31'].ul===0,'network data wins over TCP set-up, same direction: '+F['192.0.2.31'].ea+' · '+F['192.0.2.31'].eb);
// help
await p.evaluate(()=>hpOpen('tr-ends'));await p.waitForTimeout(200);txt=await p.evaluate(()=>document.querySelector('#help').textContent);
ok(/TCP set-up inside the tunnel/.test(txt)&&/at least 6 SYN and SYN-ACK packets/.test(txt),'help: rule in “Which element is which”');
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
