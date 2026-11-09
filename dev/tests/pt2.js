const E=require('../env');
const { chromium } = require('playwright');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(E.APP);await p.waitForTimeout(200);
const R=await p.evaluate(async()=>{const out={};
 const csv=`# network: CSV ports
# ports: diameter tcp 3870;3900-3910 – Gx and Gy peers
# ports: radius 31812-31813
# ports: GTP' udp 3390
# ports: sgsap sctp 29200
element,instance,site,interface,ip,port,vlan,note
mme,MME01,Site-A,s1mme,192.0.2.11,36412,101,
`;
 const a=ndParseCSV(csv);out.csv=a.d.ports;out.csvw=a.w;
 const back=ndToCSV(a.d);out.back=back.split('\r\n').filter(l=>l.startsWith('# ports'));
 const b2=ndParseCSV(back);out.rt=ndPortsEq(a.d.ports,b2.d.ports);
 /* Excel in a ; locale: rows padded with delimiters */
 const semi=back.split('\r\n').map(l=>l.startsWith('#')?l+';;;;;;;':l.replace(/,/g,';')).join('\r\n');const c=ndParseCSV(semi);out.semi=ndPortsEq(a.d.ports,c.d.ports);out.semiw=c.w;
 /* Excel with , : the comment line split into cells and padded */
 const comma=back.split('\r\n').map(l=>l.startsWith('# ports: diameter')?'# ports: diameter tcp 3870,3900-3910 – Gx and Gy peers,,,,,,':l).join('\r\n');const c2=ndParseCSV(comma);out.comma=c2.d.ports[0];
 /* JSON */
 const j=ndToJSON(a.d);out.json=j.ports;const j2=ndClean(JSON.parse(JSON.stringify(j)));out.jrt=ndPortsEq(a.d.ports,j2.d.ports);
 /* encrypted */
 const w=await ndEncrypt(j,'correct horse battery');out.encNoPorts=!JSON.stringify(w).includes('3870');const dj=await ndDecrypt(w,'correct horse battery');out.ert=ndPortsEq(a.d.ports,ndClean(dj).d.ports);
 /* HTML with data */
 const h=ndHTMLwith(j,false);const m=h.match(/<script[^>]*id="mnn-netdata"[^>]*>([\s\S]*?)<\/script>/i);out.hrt=!!m&&ndPortsEq(a.d.ports,ndClean(JSON.parse(m[1])).d.ports);
 /* merge */
 const mg=ndMerge(a.d,{...ndEmpty('x'),ports:[{proto:'diameter',tr:'tcp',ports:'3870;3900-3910',note:''},{proto:'pfcp',tr:'udp',ports:'8806',note:''}]});out.merge=mg.ports.map(r=>r.proto+' '+r.ports);
 /* validation */
 const v=ndPortsCheck({ports:[{proto:'radius',tr:'udp',ports:'2100-2200',note:''},{proto:'gtpc',tr:'',ports:'2150-2160',note:''},{proto:'diameter',tr:'udp',ports:'3870',note:''},{proto:'foo',tr:'',ports:'1',note:''},{proto:'diameter',tr:'tcp',ports:'30000-40000',note:''},{proto:'diameter',tr:'tcp',ports:'x',note:''}]});out.v=v;
 out.rules=ndPortRules({ports:[{proto:'radius',tr:'udp',ports:'2100-2200',note:''},{proto:'diameter',tr:'udp',ports:'3870',note:''},{proto:'foo',tr:'',ports:'1',note:''}]}).map(r=>r.proto);
 out.std=Object.keys(ND_PROTO).map(k=>k+': '+ndPortsStd(k));
 /* ports only file loads */
 return out;});
console.log(JSON.stringify(R.csv));ok(R.csv.length===4&&R.csv[0].proto==='diameter'&&R.csv[0].tr==='tcp'&&R.csv[0].ports==='3870;3900-3910'&&R.csv[0].note==='Gx and Gy peers','CSV: diameter tcp parsed with note');
ok(R.csv[1].proto==='radius'&&R.csv[1].tr===''&&R.csv[2].proto==='gtpp'&&R.csv[2].tr==='udp'&&R.csv[3].proto==='sgsap','CSV: radius (no transport), GTP′ alias, sgsap');
ok(R.csvw.length===0,'CSV: no warnings '+R.csvw.join('|'));
console.log('  '+R.back.join('\n  '));ok(R.rt,'CSV round trip');ok(R.semi&&R.semiw.length===0,'CSV ; with Excel padding');ok(R.comma&&R.comma.ports==='3870;3900-3910'&&R.comma.note==='Gx and Gy peers','CSV , split + padded');
console.log('  '+JSON.stringify(R.json));ok(R.jrt,'JSON round trip');ok(R.encNoPorts&&R.ert,'encrypted: ports not visible, round trip');ok(R.hrt,'HTML with data round trip');
console.log('  merge '+R.merge.join(', '));ok(R.merge.length===5&&R.merge.includes('pfcp 8806'),'merge adds new rules only');
console.log('  '+R.v.join('\n  '));
ok(R.v.some(x=>/2123 \(GTP-C\)/.test(x)&&/2152 \(GTP-U\)/.test(x)),'warns: RADIUS range covers GTP standard ports');
ok(R.v.some(x=>/also given to RADIUS/.test(x)),'warns: overlap with another rule');
ok(R.v.some(x=>/runs over TCP or SCTP – not used/.test(x)),'warns: Diameter over UDP');
ok(R.v.some(x=>/unknown protocol/.test(x)),'warns: unknown protocol');
ok(R.v.some(x=>/10001 ports/.test(x)),'warns: wide range');
ok(R.v.some(x=>/no valid port/.test(x)),'warns: bad port');
ok(JSON.stringify(R.rules)==='["radius"]','only usable rules are used');
console.log('  '+R.std.join('\n  '));
ok(R.std.some(x=>x==='radius: UDP 1645, 1646, 1812, 1813, 3799')&&R.std.some(x=>x==='diameter: TCP 3868 · SCTP 3868 · PPID 46')&&R.std.some(x=>x==='sgsap: SCTP 29118 · no PPID')&&R.std.some(x=>x==='nbap: SCTP no standard port · PPID 25'),'standard ports from the analysis tables');
// a CSV with only port lines loads
await p.evaluate(async()=>{await ndLoadText('# network: only ports\n# ports: diameter 3870\nelement,instance,site,interface,ip,port,vlan,note\n','x.csv');});
ok(await p.evaluate(()=>ND&&ND.network==='only ports'&&ND.ports.length===1),'ports-only CSV loads');
// dialog
await p.click('#ndbtn');await p.waitForTimeout(50);const mtxt=await p.evaluate(()=>document.querySelector('#ndmenu [data-ndm="ports"]').textContent);console.log('  menu: '+mtxt);
ok(mtxt.includes('Diameter TCP / SCTP 3870'),'menu shows the ports');
await p.click('#ndmenu [data-ndm="ports"]');await p.waitForTimeout(100);
ok(await p.evaluate(()=>!document.querySelector('#modal').hidden&&document.querySelectorAll('#modal .ndpt tbody tr').length===1),'dialog with 1 rule');
await p.click('#ndp-add');await p.selectOption('#modal .ndpt tbody tr:last-child .ndp-p','radius');
ok(await p.evaluate(()=>[...document.querySelectorAll('#modal .ndpt tbody tr:last-child .ndp-t option')].map(o=>o.textContent).join(',')==='UDP'),'transport follows the protocol');
await p.fill('#modal .ndpt tbody tr:last-child .ndp-ports','31812-x');await p.click('#modal .mbtns .primary');await p.waitForTimeout(50);
ok(await p.evaluate(()=>!document.querySelector('#modal').hidden&&/Check the ports of RADIUS/.test(document.querySelector('#nderr').textContent)&&document.querySelector('#modal .ndp-ports.bad')),'invalid port refused');
await p.fill('#modal .ndpt tbody tr:last-child .ndp-ports','2100-2200');await p.waitForTimeout(50);
ok(await p.evaluate(()=>/standard port/.test(document.querySelector('#modal .ndpw').textContent)),'live warning about standard ports');
await p.fill('#modal .ndpt tbody tr:last-child .ndp-ports','31812 31813');await p.fill('#modal .ndpt tbody tr:last-child .ndp-note','AAA');await p.click('#modal .mbtns .primary');await p.waitForTimeout(100);
ok(await p.evaluate(()=>document.querySelector('#modal').hidden&&ND.ports.length===2&&ND.ports[1].proto==='radius'&&ND.ports[1].ports==='31812;31813'&&ND.ports[1].tr==='udp'&&ND.ports[1].note==='AAA'),'saved: '+await p.evaluate(()=>JSON.stringify(ND.ports)));
ok(await p.evaluate(()=>NDdirty),'unsaved changes');
ok(await p.evaluate(()=>/Protocol ports: Diameter/.test(document.querySelector('#panel').textContent)),'overview shows the ports');
// remove all rules
await p.evaluate(()=>ndPortsDialog());await p.waitForTimeout(50);await p.evaluate(()=>document.querySelectorAll('#modal .nd-del').forEach(b=>b.click()));await p.click('#modal .mbtns .primary');await p.waitForTimeout(50);
ok(await p.evaluate(()=>ND.ports.length===0),'all rules removed');
// without network data the dialog starts a dataset
await p.evaluate(()=>{ND=null;NDdirty=false;ndRefresh();ndPortsDialog();});await p.waitForTimeout(50);await p.fill('#modal .ndp-ports','3870');await p.click('#modal .mbtns .primary');await p.waitForTimeout(50);
ok(await p.evaluate(()=>ND&&ND.ports.length===1&&ND.ports[0].proto==='diameter'&&ND.ports[0].tr===''),'no data → new dataset with the rule');
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');await b.close();process.exit(fails?1:0);})();
