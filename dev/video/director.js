/* Renders the product video frame by frame: virtual clock in the page, 1920x1080 @ 30 fps, piped to ffmpeg.
   PREVIEW=n  → no video, save every n-th frame as a still (fast check of the whole timeline)
   STILLS=n   → while rendering the video also keep every n-th frame as a still */
const E=require('../env');const { chromium } = require('playwright');const fs=require('fs');const {spawn}=require('child_process');
const FPS=30,DT=1000/FPS,W=1440,H=810,SC=4/3;
const LANG=process.env.LANG_VO||'en',DIR=__dirname+'/'+LANG,ODIR=DIR+'/out';
const PREVIEW=+process.env.PREVIEW||0,STILLS=+process.env.STILLS||0,OUT=process.env.OUT||ODIR+'/video_noaudio.mp4',STD=DIR+'/stills';
const C={en:{map:['The map','Every generation on one map',['<b>GSM to 5G SA</b>, HSPA, EN-DC, Wi-Fi calling','Click any element or interface for details','Filter by <b>generation, plane or protocol</b>']],
 det:['Details','Everything about an interface',['<b>Protocol stacks</b>, ports, IDs and parameters','Key messages and <b>message flows</b>','3GPP specs and <b>cause codes</b>']],
 flo:['End-to-end procedures','39 call flows, step by step',['2G, 3G, 4G, 5G NSA / SA, Wi-Fi, interworking','Every message on its <b>real interface</b>','NAS named on its carrier']],
 tr1:['Trace analysis','Your capture, on the map',['pcap · pcapng · gzip – <b>decoded in your browser</b>','GTP, PFCP, Diameter, RADIUS, SCTP','<b>Packet counts</b> per interface and element']],
 tr2:['Trace analysis','Evidence for every result',['<b>✔ certain</b> – signalled or defined by the protocol','<b>◐ likely</b> – inferred, with the reason','F-TEIDs tell <b>S1-U, S5, N3, N9</b> apart']],
 tr3:'Decide in one click – <b>per VLAN or probe port</b>',
 prv:['Privacy by design','Your network stays yours',['Your IP plan lives in <b>your own file</b>','Never in the tool or its repository','<b>AES-256-GCM</b> encrypted export (PBKDF2)','Captures are <b>read locally</b>, never uploaded']]},
 fr:{map:['La carte','Toutes les générations sur une carte',['<b>Du GSM à la 5G SA</b>, HSPA, EN-DC, appels Wi-Fi','Un clic sur un élément ou une interface pour ses détails','Filtrer par <b>génération, plan ou protocole</b>']],
 det:['Détails','Tout sur une interface',['<b>Piles protocolaires</b>, ports, identifiants et paramètres','Messages clés et <b>flux de messages</b>','Spécifications 3GPP et <b>codes de cause</b>']],
 flo:['Procédures de bout en bout','39 flux d’appel, pas à pas',['2G, 3G, 4G, 5G NSA / SA, Wi-Fi, interfonctionnement','Chaque message sur son <b>interface réelle</b>','Message NAS nommé sur son porteur']],
 tr1:['Analyse de trace','Votre capture, sur la carte',['pcap · pcapng · gzip – <b>décodés dans votre navigateur</b>','GTP, PFCP, Diameter, RADIUS, SCTP','<b>Nombre de paquets</b> par interface et par élément']],
 tr2:['Analyse de trace','Une justification pour chaque résultat',['<b>✔ certain</b> – signalé ou défini par le protocole','<b>◐ likely</b> – probable\u00a0: déduit, avec la raison','Les F-TEID distinguent <b>S1-U, S5, N3 et N9</b>']],
 tr3:'Décision en un clic – <b>par VLAN ou par port de sonde</b>',
 prv:['Confidentialité dès la conception','Votre réseau reste le vôtre',['Votre plan IP reste dans <b>votre propre fichier</b>','Jamais dans l’outil ni dans son dépôt','Export chiffré <b>AES-256-GCM</b> (PBKDF2)','Captures <b>lues localement</b>, jamais transmises']]}}[LANG];
const N=JSON.parse(fs.readFileSync(DIR+'/narration.json','utf8')),D=JSON.parse(fs.readFileSync(DIR+'/vo/durations.json','utf8'));
/* ---- timeline from the narration ---- */
const EXTRA={intro:.25,map:.15,details:.2,flows:1.0,trace:.45,privacy:.35,outro:0};let t=1.4;const S={},cues=[];
for(const [sc,sents] of N){S[sc]=[];sents.forEach((txt,i)=>{const d=D[`${sc}_${i}`];S[sc].push(t);cues.push({sc,i,t:+t.toFixed(3),d:+d.toFixed(3),text:txt});t+=d+(txt.endsWith(',')?.22:.38);});t+=.55+EXTRA[sc];}
const END=+(cues[cues.length-1].t+cues[cues.length-1].d+4.6).toFixed(2);
fs.mkdirSync(ODIR,{recursive:true});fs.mkdirSync(STD,{recursive:true});
fs.writeFileSync(ODIR+'/timeline.json',JSON.stringify({cues,S,END},null,1));
console.log('END',END,'scene starts',Object.fromEntries(Object.entries(S).map(([k,v])=>[k,v[0].toFixed(2)])));
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
(async()=>{
 const b=await chromium.launch({args:['--force-color-profile=srgb','--hide-scrollbars','--font-render-hinting=none']});
 const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:SC,colorScheme:'dark',acceptDownloads:true});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.addInitScript({path:__dirname+'/vclock.js'});
 let chooser=null;p.on('filechooser',fc=>{if(chooser){fc.setFiles(chooser);chooser=null;}});
 await p.goto(E.APP);await p.waitForTimeout(900);
 await p.evaluate(l=>{window.__VO_LANG=l;},LANG);await p.addScriptTag({path:__dirname+'/overlay.js'});
 await p.evaluate(()=>{try{localStorage.clear();}catch(e){}const s=document.createElement('style');s.textContent='#toast{transition:none!important}';document.head.appendChild(s);__V.start();});
 const cdp=await ctx.newCDPSession(p);
 let ff=null;if(!PREVIEW){ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p','-r',String(FPS),'-movflags','+faststart',OUT],{stdio:['pipe','inherit','inherit']});}
 /* ---- frame engine ---- */
 let F=0,cur={x:1300,y:760},mv=null,sc=null,vbA=null;const now=()=>F/FPS;
 async function frame(){const tt=now(),a={dt:DT};
  if(mv){const k=Math.min(1,(tt-mv.t0)/mv.d),e=ease(k);const x=mv.x0+(mv.x1-mv.x0)*e+mv.bx*Math.sin(Math.PI*e),y=mv.y0+(mv.y1-mv.y0)*e+mv.by*Math.sin(Math.PI*e);
   cur={x,y};a.cx=x;a.cy=y;await p.mouse.move(x,y);if(k>=1)mv=null;}
  if(sc){const k=Math.min(1,(tt-sc.t0)/sc.d);a.scroll=sc.a+(sc.b-sc.a)*ease(k);if(k>=1)sc=null;}
  if(vbA){const k=Math.min(1,(tt-vbA.t0)/vbA.d),e=vbA.lin?k:ease(k);a.vb={x:vbA.a.x+(vbA.b.x-vbA.a.x)*e,y:vbA.a.y+(vbA.b.y-vbA.a.y)*e,w:vbA.a.w+(vbA.b.w-vbA.a.w)*e,h:vbA.a.h+(vbA.b.h-vbA.a.h)*e};if(k>=1)vbA=null;}
  await p.evaluate(a=>__O.frame(a),a);
  const cap=!PREVIEW||F%PREVIEW===0;
  if(cap){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:PREVIEW?80:94,clip:{x:0,y:0,width:W,height:H,scale:SC}});const buf=Buffer.from(r.data,'base64');
   if(ff){if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));}
   if(PREVIEW||(STILLS&&F%STILLS===0))fs.writeFileSync(`${STD}/${String(F).padStart(5,'0')}.jpg`,buf);}
  F++;if(F%300===0)process.stdout.write(`t=${now().toFixed(1)}s `);}
 const until=async t=>{while(now()<t-1e-6)await frame();};
 const wait=s=>until(now()+s);
 const box=async q=>p.evaluate(q=>{const e=q.startsWith('=')?eval(q.slice(1)):document.querySelector(q);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},q);
 const moveTo=async(x,y,d=.7)=>{const dx=x-cur.x,dy=y-cur.y,L=Math.hypot(dx,dy)||1;mv={t0:now(),d,x0:cur.x,y0:cur.y,x1:x,y1:y,bx:-dy/L*Math.min(40,L*.08),by:dx/L*Math.min(40,L*.08)};await until(mv.t0+d);mv=null;cur={x,y};};
 const pt=async(q,fx=.5,fy=.5)=>{const r=await box(q);if(!r)throw new Error('not found: '+q);return [r.x+r.w*fx,r.y+r.h*fy];};
 const click=async(q,o={})=>{const [x,y]=Array.isArray(q)?q:await pt(q,o.fx,o.fy);await moveTo(x,y,o.d||.7);await wait(o.pre??.12);await p.evaluate(()=>__O.ripple());
  if(o.dbl)await p.mouse.dblclick(x,y);else await p.mouse.click(x,y);await wait(o.post??.1);};
 const hover=async(q,d=.55)=>{const [x,y]=await pt(q);await moveTo(x,y,d);};
 const scrollTo=async(y,d)=>{const a=await p.evaluate(()=>document.getElementById('panel').scrollTop);sc={t0:now(),d,a,b:y};};
 const secTop=async txt=>p.evaluate(t=>{const h=[...document.querySelectorAll('#panel h3')].find(h=>h.textContent.trim().startsWith(t));return h?Math.max(0,h.offsetTop-12):0;},txt);
 const vbNow=async()=>p.evaluate(()=>({...vb}));
 const vbTo=async(b,d,lin)=>{vbA={t0:now(),d,a:await vbNow(),b,lin};};
 const O=async(fn,...args)=>p.evaluate(([fn,args])=>__O[fn](...args),[fn,args]);
 const FULL=await vbNow();
 /* =========================== INTRO =========================== */
 await vbTo({x:FULL.x+FULL.w*.14,y:FULL.y+FULL.h*.12,w:FULL.w*.72,h:FULL.h*.72},.01);await frame();
 await O('stage',.97,10);await wait(.2);
 await O('black',0,900);
 await until(S.intro[0]-.2);await O('head',true);
 await until(S.intro[1]);await O('card',0);
 await until(S.intro[1]+1.55);await O('card',1);
 await until(S.intro[1]+3.3);await O('card',2);
 await until(S.intro[2]-.35);await O('head',false);await O('cardsOut');
 await vbTo(FULL,7.2,true);
 await wait(.45);await O('stage',0,900);await O('side',1,700);await O('title',true);
 await until(S.map[0]-1.1);await O('title',false);await O('side',0,700);
 /* =========================== MAP =========================== */
 await until(S.map[0]-.25);
 await O('callout','#60a5fa',C.map[0],'map',C.map[1],C.map[2]);
 await O('cursor',true);
 await click('#genchips .chip[data-g="2g"]',{dbl:true,d:.9});
 await until(S.map[0]+1.55);await click('#genchips .chip[data-g="3g"]',{d:.55});
 await until(S.map[0]+2.55);await click('#genchips .chip[data-g="4g"]',{d:.55});
 await until(S.map[0]+3.55);await click('#genchips .chip[data-g="sa"]',{d:.55});
 await until(S.map[0]+4.6);await click('#genchips .chip[data-g="wifi"]',{d:.55});
 await until(S.map[1]+.15);await click('#genchips .chip[data-g="sa"]',{dbl:true,d:.6});
 await until(S.map[1]+1.35);await click('[data-plane="up"]',{d:.6});
 await until(S.map[1]+2.45);await click('#protosel',{d:.55});await p.selectOption('#protosel','pfcp');await wait(.05);
 await until(S.map[1]+3.6);
 /* =========================== DETAILS =========================== */
 await O('calloutOut');
 await p.evaluate(()=>{state.planes.up=true;document.getElementById('protosel').value='';document.getElementById('protosel').dispatchEvent(new Event('change'));toggleGen('all');});
 await wait(.4);
 await O('callout','#a78bfa',C.det[0],'info',C.det[1],C.det[2]);
 await until(S.details[0]+.2);await click('=LINK.s11.g.querySelector("text")||LINK.s11.g',{d:.85});
 await wait(.5);await hover('#panel h2',.6);
 await until(S.details[0]+1.6);await scrollTo(await secTop('Protocol stack'),1.1);
 await until(S.details[0]+3.5);await scrollTo(await secTop('Key procedures'),1.1);
 await until(S.details[1]-.3);await scrollTo(await secTop('Message flows'),1.2);
 await until(S.details[1]+1.6);await scrollTo((await secTop('Message flows'))+260,1.3);
 await until(S.details[1]+3.0);await scrollTo(await secTop('Troubleshooting'),1.3);
 await until(S.flows[0]-.45);
 /* =========================== FLOWS =========================== */
 await O('calloutOut');
 await click('#pdbtn',{d:.75});
 await wait(.45);
 await O('callout','#34d399',C.flo[0],'flow',C.flo[1],C.flo[2]);
 await hover('[data-proc="gsm-lu"]',.6);await wait(.25);await hover('[data-proc="gsm-mo-call"]',.45);await wait(.15);
 await click('#panel .pdq',{d:.55});for(const ch of 'initial attach'){await p.keyboard.type(ch);await frame();await frame();}
 await wait(.3);await click('[data-proc="lte-attach"]',{d:.6});
 await until(S.flows[1]-.5);await click('[data-pa="play"]',{d:.7});
 await moveTo(1180,700,1.2);
 await until(S.trace[0]-.6);
 /* =========================== TRACE =========================== */
 await O('calloutOut');
 await p.evaluate(()=>{pdClose();});await vbTo(FULL,.6);
 await click('#trbtn',{d:.7});
 await wait(.35);chooser=__dirname+'/demo-probe.pcapng';
 await click('.trdrop [data-ta="open"]',{d:.6});
 for(let i=0;i<600&&await p.evaluate(()=>!!trJob||!TR);i++)await frame();
 await O('callout','#f59e0b',C.tr1[0],'trace',C.tr1[1],C.tr1[2]);
 await until(S.trace[1]+1.6);await hover('tr[data-trr="s1u"]');await wait(.7);
 await hover('tr[data-trr="n3"]');await wait(.7);await hover('tr[data-trr="gn"]');await wait(.7);await hover('tr[data-trr="gx"]');await wait(.7);await hover('tr[data-trr="n4"]');
 await until(S.trace[2]-.3);
 await O('callout','#f59e0b',C.tr2[0],'trace',C.tr2[1],C.tr2[2]);
 await O('hl',await box('tr[data-trr="s1u"] td:nth-child(5)'),'#f59e0b',4);
 await until(S.trace[2]+2.4);await click('tr[data-trr="s1u"] td:nth-child(4)',{d:.6});
 await until(S.trace[2]+5.6);await O('hl',await box('tr[data-trr="n3"] td:nth-child(5)'),'#f59e0b',4);
 await until(S.trace[2]+8.0);await O('hlOut');
 await until(S.trace[3]-.6);await scrollTo(await secTop('Check and decide'),1.0);await wait(1.05);
 const sel='select[data-tg="gtpu|10.400|1"]';
 await O('hl',await box(sel),'#f59e0b',5);
 await click(sel,{d:.6});await wait(.35);await p.selectOption(sel,'s5');await wait(.15);await O('hlOut');
 await O('addItem',C.tr3);
 await until(S.privacy[0]-.55);
 /* =========================== PRIVACY =========================== */
 await O('calloutOut');
 await p.evaluate(()=>{trLeave();clearSel();});await vbTo(FULL,.8);await wait(.3);
 await O('callout','#22c55e',C.prv[0],'lock',C.prv[1],C.prv[2]);
 await click('#ndbtn',{d:.8});await wait(.3);chooser=__dirname+'/example-lab.netdata.csv';
 await click('#ndmenu [data-ndm="load"]',{d:.55});
 for(let i=0;i<90&&await p.evaluate(()=>!ND);i++)await frame();
 await wait(.6);await click('=NODE.mme.g.querySelector("rect")',{d:.8});
 await wait(.6);const yn=await p.evaluate(()=>{const h=[...document.querySelectorAll('#panel h3')].find(h=>/network|instances/i.test(h.textContent));return h?Math.max(0,h.offsetTop-12):0;});
 await scrollTo(yn,1.0);
 await until(S.privacy[2]-.7);await click('#ndbtn',{d:.65});await wait(.25);
 await hover('#ndmenu [data-ndm="json-enc"]',.5);await wait(.15);await click('#ndmenu [data-ndm="json-enc"]',{d:.15});
 await wait(.35);const pass='lab-network-2026';
 await click('#ndp1',{d:.5});for(let i=0;i<pass.length;i+=2){await p.keyboard.type(pass.slice(i,i+2));await frame();}
 await click('#ndp2',{d:.3});for(let i=0;i<pass.length;i+=2){await p.keyboard.type(pass.slice(i,i+2));await frame();}
 await wait(.2);await click('=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Encrypt")',{d:.5});
 for(let i=0;i<60&&await p.evaluate(()=>!!document.querySelector('#ndp1'));i++)await frame();
 await until(S.privacy[3]-.55);await click('#trbtn',{d:.6});await wait(.3);
 const pv=await box('#panel .trpriv');if(pv)await O('hl',pv,'#22c55e',5);
 await until(S.outro[0]-.7);
 /* =========================== OUTRO =========================== */
 await O('hlOut');await O('calloutOut');await O('cursor',false);
 await p.evaluate(()=>{trLeave();clearSel();});await vbTo(FULL,1.2);
 await O('stage',.95,900);await wait(.5);await O('end');
 await until(S.outro[1]+.2);await O('tag');
 await until(END-1.1);await O('black',1,1000);
 await until(END);
 if(ff){ff.stdin.end();await new Promise(r=>ff.on('close',r));}
 console.log('\nprivacy check',JSON.stringify({p3:S.privacy[3]}),'\nframes',F,'seconds',now().toFixed(2),'errors',errs.slice(0,5));await b.close();})().catch(e=>{console.error('FAILED',e);process.exit(1);});
