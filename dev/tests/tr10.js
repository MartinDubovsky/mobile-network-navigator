const E=require('../env');
const { chromium } = require('playwright');const {spawnSync}=require('child_process');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
/* Every Wireshark filter of every row, on every test capture, run through tshark: it must be accepted, and it must select
   as many packets as the row counts (rows the filter calls approximate or “messages only” may differ). Skipped without tshark. */
if(spawnSync('tshark',['--version']).status!==0){console.log('SKIP – tshark not installed (apt-get install tshark) – the filters were not checked against Wireshark');process.exit(0);}
const ND1={format:'mobile-network-navigator/netdata',version:1,network:'P',instances:[],interfaces:{},ports:[{protocol:'Diameter',transport:'any',ports:'3870;3900'},{protocol:'radius',transport:'udp',ports:'31812-31813'},{protocol:'SGsAP',ports:'29200'},{protocol:'PFCP',transport:'UDP',ports:'8806'}]};
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));await p.goto(E.APP);await p.waitForTimeout(200);await p.click('#trbtn');const all=[];
const load=async f=>{const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>trPick())]);await fc.setFiles(f);await p.waitForFunction(()=>!trJob&&TR,null,{timeout:30000});await p.waitForTimeout(300);};
const grab=async cap=>{const L=await p.evaluate(()=>{const cnt=k=>{const i=k.indexOf(':'),kind=k.slice(0,i),id=k.slice(i+1);
  if(kind==='if')return TR.rows.find(r=>r.canon===id).pk;if(kind==='grp')return TR.groups.find(g=>g.gk===id).pk;if(kind==='port')return TR.file.ifs[+id].pk;if(kind==='el')return TR.ends.get(id).pk;return TR.other.find(o=>o.lbl===id).pk;};
  document.querySelectorAll('details.trsec').forEach(d=>d.open=true);trRender();document.querySelectorAll('details.trsec').forEach(d=>d.open=true);
  const ks=new Set([...document.querySelectorAll('#panel [data-ws]')].map(b=>b.dataset.ws));TR.groups.forEach(g=>ks.add('grp:'+g.gk));TR.rows.forEach(r=>ks.add('if:'+r.canon));
  return [...ks].map(k=>{const w=trWsFor(k);return w&&{k,f:trWsW(w.f),notes:w.notes,pk:cnt(k)};}).filter(Boolean);});L.forEach(x=>all.push({cap,...x}));};
for(const c of ['a.pcapng','b.pcap','c.pcap','d.pcapng','e-s11u.pcap','h-gtpu-tcp.pcapng']){await load(E.CAP+'/'+c);await grab(c);}
await load(E.CAP+'/g-sgi.pcapng');await p.evaluate(()=>{TR.groups.filter(g=>g.plain).forEach(g=>TR.manual[g.gk]='sgi');trResolve();});await grab('g-sgi.pcapng');
await p.evaluate(async j=>{await ndLoadText(JSON.stringify(j),'p.json');},ND1);await load(E.CAP+'/f-ports.pcap');await grab('f-ports.pcap');
await b.close();
let rej=0,diff=0,exact=0,appr=0;
for(const x of all){const r=spawnSync('tshark',['-n','-r',E.CAP+'/'+x.cap,'-Y',x.f,'-T','fields','-e','frame.number'],{encoding:'utf8',maxBuffer:1<<28});
 if(r.status!==0){rej++;console.log('FAIL rejected by Wireshark: '+x.cap+' '+x.k+' – '+(r.stderr||'').trim().split('\n').pop()+'\n     '+x.f);continue;}
 const n=r.stdout.split('\n').filter(l=>l.trim()).length,loose=x.notes.some(t=>/approximate|messages only|too many/.test(t));
 if(n===x.pk)exact++;else if(loose){appr++;console.log('     '+x.cap+' '+x.k+': app '+x.pk+', Wireshark '+n+' (allowed: '+x.notes.join(' · ')+')');}
 else{diff++;console.log('FAIL '+x.cap+' '+x.k+': app counts '+x.pk+', the filter selects '+n+'\n     '+x.f);}}
ok(all.length>=120,'filters checked: '+all.length);ok(!rej,'all accepted by Wireshark ('+rej+' rejected)');ok(!diff,'packet counts equal: '+exact+' exact, '+appr+' allowed to differ, '+diff+' wrong');
ok(all.every(x=>x.f[0]==='('||!x.f.includes(' ')),'copied filters are bracketed as a whole');
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');process.exit(fails?1:0);})();
