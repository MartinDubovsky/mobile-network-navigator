const E=require('../env');
const { chromium } = require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
/* Installable app: served over http://localhost (like GitHub Pages over HTTPS) the page links the manifest, registers sw.js,
   is installable for Chromium, starts offline and offers a new version; from file:// none of it runs. */
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
let extra='';   /* appended to index.html to simulate a new release */
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(E.ROOT,p);
 if(!f.startsWith(E.ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
 let b=fs.readFileSync(f);if(p==='/index.html'&&extra)b=Buffer.from(b.toString('utf8').replace(/<meta name="version" content="[^"]+">/,'<meta name="version" content="'+extra+'">').replace(/const VERSION = '[^']+';/,"const VERSION = '"+extra+"';"));r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});r.end(b);});
(async()=>{await new Promise(res=>srv.listen(0,'127.0.0.1',res));const URL0=`http://localhost:${srv.address().port}/`;
/* the files */
const man=JSON.parse(fs.readFileSync(path.join(E.ROOT,'manifest.webmanifest'),'utf8'));
const png=f=>{const d=fs.readFileSync(path.join(E.ROOT,f));return d.readUInt32BE(16)+'x'+d.readUInt32BE(20);};
ok(man.start_url==='./'&&man.scope==='./'&&man.display==='standalone'&&man.name==='Mobile Network Navigator','manifest: name, start_url, scope, standalone');
ok(man.icons.every(i=>fs.existsSync(path.join(E.ROOT,i.src)))&&man.icons.filter(i=>i.type==='image/png').every(i=>png(i.src)===i.sizes),'manifest icons exist, PNG sizes as declared');
ok(man.icons.some(i=>i.purpose==='maskable')&&png('icons/apple-touch-icon.png')==='180x180','maskable icon and 180 × 180 apple-touch-icon');
const sw=fs.readFileSync(path.join(E.ROOT,'sw.js'),'utf8');const listed=[...sw.match(/const FILES = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
ok(listed.every(f=>fs.existsSync(path.join(E.ROOT,f)))&&listed.includes('index.html')&&man.icons.every(i=>listed.includes(i.src)),'sw.js caches index.html, the manifest and every icon');
const b=await chromium.launch();const errs=[];
/* file:// – one offline file, nothing linked or registered */
let ctx=await b.newContext();let p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));await p.goto(E.APP);await p.waitForTimeout(300);
ok(await p.evaluate(()=>!document.querySelector('link[rel=manifest]')&&!pwaWeb()),'file://: no manifest link, no service worker');
ok(await p.evaluate(()=>/connect-src 'none'/.test(document.querySelector('meta[http-equiv=Content-Security-Policy]').content)),'CSP still forbids network access');
ok(await p.evaluate(()=>{const l=document.querySelector('link[rel=icon]');return l&&/^data:image\/svg\+xml,/.test(l.href)&&!l.href.includes('#');}),'inline favicon (data URL, # encoded)');
await ctx.close();
/* served: installable, offline */
ctx=await b.newContext();p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));await p.goto(URL0);
await p.waitForFunction(()=>navigator.serviceWorker.controller||navigator.serviceWorker.ready.then(()=>true),null,{timeout:15000});
await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForTimeout(500);
ok(await p.evaluate(()=>!!document.querySelector('link[rel=manifest]')&&!!document.querySelector('link[rel=apple-touch-icon]')),'served: manifest and apple-touch-icon linked');
const cdp=await ctx.newCDPSession(p);const ie=await cdp.send('Page.getInstallabilityErrors');const am=await cdp.send('Page.getAppManifest');
console.log('  installability errors: '+JSON.stringify(ie.installabilityErrors)+' · manifest errors: '+JSON.stringify(am.errors));
ok(!am.errors.length,'manifest parsed without errors');
ok(!ie.installabilityErrors.length,'Chromium: installable (no installability errors)');
const cached=await p.evaluate(async()=>{const c=await caches.open('mnn-app-v1');return (await c.keys()).map(r=>new URL(r.url).pathname).sort();});
ok(cached.length===8&&cached.includes('/index.html'),'service worker cached the app files: '+cached.join(' '));
await p.reload();await p.waitForTimeout(300);ok(await p.evaluate(()=>!!navigator.serviceWorker.controller),'page controlled by the worker');
await ctx.setOffline(true);await p.reload();await p.waitForTimeout(500);
ok(await p.evaluate(()=>typeof VERSION==='string'&&document.querySelectorAll('#map g').length>50),'starts offline from the cache');
await ctx.setOffline(false);
/* not for other files under the scope */
const r404=await p.evaluate(async u=>(await fetch(u).catch(()=>({status:'blocked'}))).status,URL0+'not-there.txt').catch(()=>'blocked');
ok(r404!==200,'other paths are not answered from the cache ('+r404+')');
/* a new release: the cached copy is shown, the new one is fetched in the background and offered */
extra='2099.01.01';await p.reload();   /* the cached (old) page is shown, the new release is fetched in the background → offered */
await p.waitForSelector('#pwaupd',{timeout:10000}).catch(()=>{});
ok(await p.evaluate(()=>!!document.querySelector('#pwaupd')&&/new version/.test(document.querySelector('#pwaupd').textContent)),'new version downloaded → reload offered');
ok(await p.evaluate(()=>VERSION)!=='2099.01.01','… while the page shown is still the old version');
await p.click('#pwaupd [data-pw=later]');ok(await p.evaluate(()=>!document.querySelector('#pwaupd')),'“Later” dismisses it');
await p.reload();await p.waitForTimeout(800);ok(await p.evaluate(()=>VERSION==='2099.01.01'&&!document.querySelector('#pwaupd')),'next start: the new version, nothing offered');
/* install button in the release history, once the browser offers installing */
await p.evaluate(()=>{const e=new Event('beforeinstallprompt');e.prompt=()=>{window.__prompted=true;};dispatchEvent(e);});
await p.click('#ver');await p.waitForTimeout(150);const btn=p.locator('#modal .mbtns button',{hasText:'Install as an app'});
ok(await btn.count()===1,'release history offers “Install as an app”');await btn.click();ok(await p.evaluate(()=>window.__prompted===true),'… which opens the browser’s install prompt');
/* a copy saved with network data never registers the worker */
const html=await p.evaluate(()=>ndHTMLwith({format:'mobile-network-navigator/netdata',version:1,network:'x',instances:[],interfaces:{}},false));
ok(!/rel="manifest"/.test(html)&&/id="mnn-netdata"/.test(html),'saved-with-data HTML has no manifest link (and skips the worker: embedded data)');
await ctx.close();await b.close();srv.close();
ok(errs.length===0,'errors '+errs.join(' | '));console.log(fails?fails+' FAILED':'ALL PASSED');process.exit(fails?1:0);})();
