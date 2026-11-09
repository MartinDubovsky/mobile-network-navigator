const E=require('../env');
const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto(E.APP);await p.waitForTimeout(200);
const CSV='# network: Test network\nelement,instance,site,interface,ip,port,vlan,note\namf,amf-dc1-01,DC1,n2,198.51.100.66/26,38412,1109,Secondary N2 interface; SCTP multi-homing\namf,amf-dc2-01,DC2,n11,192.0.2.132/25,8080;443,1103,AMF service-based interface\n';
await p.evaluate(async t=>{await ndLoadText(t,'test.csv');},CSV);
console.log('warnings',await p.evaluate(()=>NDwarn));
await p.evaluate(()=>select('el','amf'));
const links=await p.$$eval('#panel .ndt .ndlink',x=>x.map(e=>e.textContent+'→'+e.dataset.sel));console.log(links);ok(links.includes('N11→if:n11'),'N11 is a link');
await p.click('#panel .ndt .ndlink:has-text("N11")');await p.waitForTimeout(100);
ok(await p.evaluate(()=>state.sel[1]==='n11'&&state.rp),'click opens N11 in the Ref. points view');
let t=await p.textContent('#panel');ok(t.includes('amf-dc2-01')&&t.includes('8080, 443'),'N11 panel shows the AMF address');
await p.evaluate(()=>select('if','namf'));t=await p.textContent('#panel');ok(t.includes('amf-dc2-01')&&t.includes('192.0.2.132/25'),'Namf stub (service-based view) shows the N11 address');
await p.evaluate(()=>select('if','sbi'));t=await p.textContent('#panel');ok(t.includes('amf-dc2-01'),'SBI bus lists it');
// kinds
console.log(await p.evaluate(()=>['198.51.100.66/26','198.51.100.64/26','198.51.100.128/26','2001:db8::5/64','2001:db8::/64','2001:db8:0:1::/56','::ffff:192.0.2.1/120','192.0.2.132/25','192.0.2.0/32'].map(x=>x+' '+ndAddrKind(x)).join(' | ')));
let r=await p.evaluate(()=>{const f=q=>{state.q=q;apply();const c=[...compute().elOn];return c.includes('amf');};return [f('198.51.100.66'),f('198.51.100.69'),f('192.0.2.132')];});
ok(r[0]&&!r[1]&&r[2],'search: exact address found, neighbour address not '+JSON.stringify(r));
await p.evaluate(()=>{state.q='';apply();});
// duplicate detection with prefix notation
const w=await p.evaluate(async()=>{ND=null;await ndLoadText('element,instance,site,interface,ip\namf,A1,S,n2,192.0.2.5/24\nsmf,S1,S,n4,192.0.2.5/24\nupf,U1,S,n3,192.0.2.0/24\n','d.csv');ndCloseModal();return NDwarn;});
ok(w.length===1&&w[0].includes('192.0.2.5'),'duplicate check uses the address part: '+w.join('|'));
// rp falls back to the NF's sbi address
await p.evaluate(async()=>{ND=null;await ndLoadText('element,instance,site,interface,ip,port\namf,A1,S,sbi,198.51.100.9,443\nsmf,S1,S,sbi,198.51.100.10,443\n','s.csv');select('if','n11');});
t=await p.textContent('#panel');ok(t.includes('A1')&&t.includes('S1')&&t.includes('198.51.100.9'),'N11 shows the AMF / SMF SBI addresses when no N11 entry exists');
await p.screenshot({path:E.OUT+'/n11.png',clip:{x:1480,y:80,width:440,height:900}});
console.log(errs.join('\n')||'no errors');await b.close();})();
