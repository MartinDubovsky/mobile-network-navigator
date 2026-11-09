/* video overlay: titles, callouts, cursor, highlights – all animated with WAAPI so that the virtual clock steps them */
(()=>{
const css=`
#vo{position:fixed;inset:0;pointer-events:none;z-index:2147483000;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:#e5e7eb}
#vo *{box-sizing:border-box}
#vo .lay{position:absolute;inset:0;opacity:0}
#vo #vo-black{background:#000;opacity:1}
#vo-stage{background:radial-gradient(900px 560px at 50% 42%,rgba(37,72,140,.42),rgba(6,9,16,0) 70%),linear-gradient(180deg,rgba(5,8,14,.95),rgba(5,8,14,.97))}
#vo-side{background:linear-gradient(90deg,rgba(5,8,14,.96) 0%,rgba(5,8,14,.86) 38%,rgba(5,8,14,.35) 72%,rgba(5,8,14,.15) 100%)}
#vo .vo-head{position:absolute;left:0;right:0;top:132px;text-align:center;font-size:40px;font-weight:700;letter-spacing:-.02em;color:#f8fafc;opacity:0}
#vo .vo-head small{display:block;font-size:15px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#7dd3fc;margin-bottom:12px}
#vo .vo-cards{position:absolute;left:0;right:0;top:268px;display:flex;justify-content:center;gap:30px}
#vo .vo-card{width:318px;height:236px;border-radius:14px;background:linear-gradient(180deg,#141c2b,#0e1521);border:1px solid rgba(148,163,184,.2);box-shadow:0 24px 60px rgba(0,0,0,.55);overflow:hidden;opacity:0}
#vo .vo-card .tb{height:30px;display:flex;align-items:center;gap:6px;padding:0 12px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(148,163,184,.14);font-size:11.5px;color:#94a3b8;font-weight:600}
#vo .vo-card .tb i{width:9px;height:9px;border-radius:50%;background:#334155;display:inline-block}#vo .vo-card .tb i:nth-child(1){background:#f87171}#vo .vo-card .tb i:nth-child(2){background:#fbbf24}#vo .vo-card .tb i:nth-child(3){background:#34d399}
#vo .vo-card .tb span{margin-left:8px}
#vo .vo-card .bd{padding:12px 14px;font-size:11px;line-height:1.75}
#vo .pk{font-family:"DejaVu Sans Mono",monospace;font-size:9.6px;color:#cbd5e1;white-space:nowrap;display:flex;gap:8px}#vo .pk b{color:#64748b;font-weight:400;width:12px}#vo .pk em{font-style:normal;color:#fbbf24;width:52px}#vo .pk.s em{color:#60a5fa}#vo .pk.d em{color:#a78bfa}
#vo .pk.sel{background:rgba(59,130,246,.22);margin:0 -14px;padding:0 14px}
#vo .spec h4{margin:2px 0 8px;font-size:12px;color:#f1f5f9}#vo .spec .ln{height:6px;border-radius:3px;background:rgba(148,163,184,.25);margin:7px 0}#vo .spec .ln.hl{background:rgba(250,204,21,.55)}
#vo .gens{display:grid;grid-template-columns:1fr 1fr;gap:9px 14px;padding-top:4px}#vo .gens div{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:#e2e8f0}#vo .gens i{width:11px;height:11px;border-radius:50%}
#vo-title{position:absolute;left:70px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;opacity:0}
#vo-title .k{font-size:13px;font-weight:700;letter-spacing:.24em;color:#7dd3fc;text-transform:uppercase}
#vo-title h1{margin:14px 0 0;font-size:60px;line-height:1.02;font-weight:800;letter-spacing:-.035em;color:#fff}
#vo-title p{margin:16px 0 0;font-size:21px;color:#cbd5e1;font-weight:500}
#vo .gbar{display:flex;height:6px;width:520px;border-radius:3px;overflow:hidden;margin-top:26px}#vo .gbar i{flex:1}
#vo .gnames{margin-top:12px;font-size:13.5px;color:#94a3b8;font-weight:600;letter-spacing:.04em}
#vo-co{position:absolute;left:20px;bottom:20px;width:410px;border-radius:14px;background:rgba(7,11,19,.92);border:1px solid rgba(148,163,184,.2);box-shadow:0 22px 60px rgba(0,0,0,.55);padding:15px 18px 13px 24px;opacity:0;overflow:hidden}
#vo-co .bar{position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--a)}
#vo-co .lab{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.18em;color:var(--a);text-transform:uppercase}
#vo-co .lab svg{width:15px;height:15px}
#vo-co .ttl{margin:7px 0 9px;font-size:20.5px;line-height:1.2;font-weight:750;color:#f8fafc;letter-spacing:-.01em}
#vo-co ul{list-style:none;margin:0;padding:0}
#vo-co li{position:relative;padding-left:22px;margin:5px 0;font-size:14px;line-height:1.38;color:#cbd5e1;opacity:0}
#vo-co li::before{content:'';position:absolute;left:2px;top:6px;width:9px;height:9px;border-radius:3px;background:var(--a);box-shadow:0 0 10px var(--a)}
#vo-co li b{color:#f1f5f9;font-weight:650}
#vo-hl{position:absolute;border:2px solid var(--a,#60a5fa);border-radius:9px;box-shadow:0 0 0 5px color-mix(in srgb,var(--a,#60a5fa) 22%,transparent),0 0 28px color-mix(in srgb,var(--a,#60a5fa) 55%,transparent);opacity:0}
#vo-cur{position:absolute;left:0;top:0;width:26px;height:26px;opacity:0;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}
#vo .vo-rip{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:2.5px solid rgba(255,255,255,.95);background:rgba(255,255,255,.18)}
#vo-end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
#vo-end .logo{width:74px;height:74px;opacity:0}
#vo-end h1{margin:18px 0 0;font-size:58px;font-weight:800;letter-spacing:-.035em;color:#fff;opacity:0}
#vo-end .sub{margin-top:12px;font-size:19px;color:#94a3b8;font-weight:600;letter-spacing:.02em;opacity:0}
#vo-end .tiles{display:flex;gap:18px;margin-top:40px}
#vo-end .tile{width:218px;padding:16px 16px 15px;border-radius:13px;background:rgba(15,23,36,.92);border:1px solid rgba(148,163,184,.2);opacity:0}
#vo-end .tile svg{width:26px;height:26px}
#vo-end .tile b{display:block;margin-top:9px;font-size:15.5px;color:#f8fafc;font-weight:700}
#vo-end .tile span{display:block;margin-top:3px;font-size:12.5px;color:#94a3b8;line-height:1.35}
#vo-end .tag{margin-top:40px;font-size:24px;font-weight:650;color:#e2e8f0;letter-spacing:-.01em;opacity:0}
#vo-end .tag em{font-style:normal;background:linear-gradient(90deg,#60a5fa,#a78bfa,#34d399);-webkit-background-clip:text;background-clip:text;color:transparent}
#legend{display:none!important}
`;
const LG=window.__VO_LANG||'en';
const TX={en:{kick:'Mobile network engineering',head:'You know the moment.',gens:['2G GSM','3G UMTS','HSPA','4G LTE / EPC','5G NSA','5G SA','Wi-Fi calling','Interworking'],
 tk:'For mobile network engineers',tsub:'Every generation, every interface – on one map.',
 esub:'One HTML file · No installation · Works offline',
 tiles:[['Interactive map','2G to 5G, Wi-Fi and IMS – every element and interface'],['Message flows','Sequence diagrams and 39 end-to-end procedures'],['Trace analysis','Your pcap on the map, with the evidence'],['Private by design','Your IP plan in your own file, AES-256 encrypted']],
 tag:'Your mobile network, <em>on one map.</em>'},
 fr:{kick:'Ingénierie des réseaux mobiles',head:'Vous connaissez ce moment.',gens:['2G GSM','3G UMTS','HSPA','4G LTE / EPC','5G NSA','5G SA','Appels Wi-Fi','Interfonctionnement'],
 tk:'Pour les ingénieurs réseaux mobiles',tsub:'Chaque génération, chaque interface – sur une seule carte.',
 esub:'Un seul fichier HTML · Sans installation · Hors ligne',
 tiles:[['Carte interactive','De la 2G à la 5G, Wi-Fi et IMS – chaque élément, chaque interface'],['Flux de messages','Diagrammes de séquence et 39 procédures de bout en bout'],['Analyse de trace','Votre pcap sur la carte, avec la justification'],['Confidentiel par conception','Votre plan IP dans votre fichier, chiffré en AES-256']],
 tag:'Votre réseau mobile, <em>sur une seule carte.</em>'}}[LG];
const GEN=['#ef4444','#f59e0b','#ec4899','#3b82f6','#06b6d4','#8b5cf6','#eab308','#22c55e'];
const ICON={
 map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="2.4"/><circle cx="19" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M7.3 6h9.4M6.2 8.1l4.6 7.8M17.8 8.1l-4.6 7.8"/></svg>',
 info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
 flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18M19 3v18"/><path d="M5 7h12l-2.5-2.5M19 12H7l2.5 2.5M5 17h12l-2.5-2.5"/></svg>',
 trace:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3l2.5-6 4 13 3-9 2 2H21"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3" fill="currentColor"/></svg>'};
const root=document.createElement('div');root.id='vo';
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
root.innerHTML=`<div class="lay" id="vo-stage"></div><div class="lay" id="vo-side"></div>
<div class="vo-head" id="vo-head"><small>${TX.kick}</small>${TX.head}</div>
<div class="vo-cards" id="vo-cards">
 <div class="vo-card"><div class="tb"><i></i><i></i><i></i><span>probe-port-1.pcapng</span></div><div class="bd">
  ${[['s','192.0.2.80 → 192.0.2.81','GTPv2-C','Create Session Request'],['s','192.0.2.81 → 192.0.2.80','GTPv2-C','Create Session Response'],['','198.51.100.10 → 192.0.2.70','GTP-U','T-PDU'],['d','192.0.2.60 → 192.0.2.61','PFCP','Session Establishment Req'],['','192.0.2.10 → 192.0.2.20','Diameter','CCR-I (Gx)'],['','198.51.100.21 → 192.0.2.62','GTP-U','T-PDU'],['d','192.0.2.61 → 192.0.2.60','PFCP','Session Establishment Resp'],['s','192.0.2.80 → 192.0.2.81','GTPv2-C','Modify Bearer Request'],['','192.0.2.20 → 192.0.2.10','Diameter','CCA-I (Gx)']].map((r,i)=>`<div class="pk ${r[0]}${i===3?' sel':''}"><b>${i+1}</b><em>${r[2]}</em><span>${r[3]}</span></div>`).join('')}</div></div>
 <div class="vo-card"><div class="tb"><i></i><i></i><i></i><span>3GPP TS 23.401</span></div><div class="bd spec"><h4>5.3.2.1 E-UTRAN Initial Attach</h4><!-- ip-check: ok (TS 23.401 clause) -->
  ${[90,100,82,96,60,100,88,74,94,66].map((w,i)=>`<div class="ln${i===4||i===5?' hl':''}" style="width:${w}%"></div>`).join('')}</div></div>
 <div class="vo-card"><div class="tb"><i></i><i></i><i></i><span>Architecture</span></div><div class="bd"><div class="gens">
  ${TX.gens.map((n,c)=>[n,c]).map(([n,c])=>`<div><i style="background:${GEN[c]}"></i>${n}</div>`).join('')}</div></div></div>
</div>
<div id="vo-title"><div class="k">${TX.tk}</div><h1>Mobile Network<br>Navigator</h1><p>${TX.tsub}</p>
 <div class="gbar">${GEN.map(c=>`<i style="background:${c}"></i>`).join('')}</div><div class="gnames">2G · 3G · HSPA · 4G · 5G NSA · 5G SA · Wi-Fi</div></div>
<div id="vo-co"><div class="bar"></div><div class="lab"></div><div class="ttl"></div><ul></ul></div>
<div id="vo-hl"></div>
<div id="vo-end"><svg class="logo" viewBox="0 0 74 74"><defs><linearGradient id="vog" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset=".55" stop-color="#a78bfa"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs>
 <rect x="2" y="2" width="70" height="70" rx="18" fill="none" stroke="url(#vog)" stroke-width="3"/><g stroke="url(#vog)" stroke-width="3" stroke-linecap="round"><path d="M20 24h34M18.5 27l14 20M55.5 27l-14 20"/></g><g fill="url(#vog)"><circle cx="18" cy="24" r="6"/><circle cx="56" cy="24" r="6"/><circle cx="37" cy="51" r="6"/></g></svg>
 <h1>Mobile Network Navigator</h1><div class="sub">${TX.esub}</div>
 <div class="tiles">${[['map','#60a5fa'],['flow','#34d399'],['trace','#f59e0b'],['lock','#22c55e']].map(([i,c],k)=>[i,c,TX.tiles[k][0],TX.tiles[k][1]]).map(([i,c,b,s])=>`<div class="tile" style="color:${c}">${ICON[i]}<b>${b}</b><span>${s}</span></div>`).join('')}</div>
 <div class="tag">${TX.tag}</div></div>
<div class="lay" id="vo-black"></div>
<svg id="vo-cur" viewBox="0 0 26 26"><path d="M4 2.5 L4 21 L9 16.6 L12.4 24 L15.6 22.6 L12.3 15.4 L19 15.2 Z" fill="#fff" stroke="#0b1220" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
document.body.appendChild(root);
const $=s=>root.querySelector(s);
const EZ='cubic-bezier(.22,.8,.24,1)',EZI='cubic-bezier(.55,0,.75,.2)';
const fade=(el,to,ms,delay)=>{if(typeof el==='string')el=$(el);const from=getComputedStyle(el).opacity;el.animate([{opacity:from},{opacity:to}],{duration:ms,delay:delay||0,easing:'ease-in-out',fill:'forwards'});};
const rise=(el,ms,delay,dy)=>{el.animate([{opacity:0,transform:`translateY(${dy||18}px) scale(.985)`},{opacity:1,transform:'none'}],{duration:ms,delay:delay||0,easing:EZ,fill:'both'});};
const O={cx:-50,cy:-50,
 black:(to,ms)=>fade('#vo-black',to,ms),
 stage:(to,ms)=>fade('#vo-stage',to,ms),
 side:(to,ms)=>fade('#vo-side',to,ms),
 head:(show)=>{const h=$('#vo-head');if(show)rise(h,900,0,14);else h.animate([{opacity:1},{opacity:0,transform:'translateY(-10px)'}],{duration:500,easing:EZI,fill:'forwards'});},
 card:(i)=>{const c=root.querySelectorAll('.vo-card')[i];c.animate([{opacity:0,transform:'translateY(36px) scale(.95)'},{opacity:1,transform:'none'}],{duration:800,easing:EZ,fill:'forwards'});},
 cardsOut:()=>{root.querySelectorAll('.vo-card').forEach((c,i)=>c.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translate(${(1-i)*120}px,10px) scale(.86)`}],{duration:650,delay:i*60,easing:EZI,fill:'forwards'}));},
 title:(show)=>{const t=$('#vo-title');if(show){t.style.opacity=1;[...t.children].forEach((c,i)=>rise(c,850,i*140,22));const bar=t.querySelector('.gbar');bar.animate([{width:'0px'},{width:'520px'}],{duration:1100,delay:500,easing:EZ,fill:'both'});}
  else t.animate([{opacity:1},{opacity:0,transform:'translateX(-24px)'}],{duration:600,easing:EZI,fill:'forwards'});},
 callout:(a,lab,ico,ttl,items)=>{const c=$('#vo-co');c.style.setProperty('--a',a);c.querySelector('.lab').innerHTML=(ICON[ico]||'')+lab;c.querySelector('.ttl').textContent=ttl;
  c.querySelector('ul').innerHTML=items.map(x=>`<li>${x}</li>`).join('');c.getAnimations().forEach(x=>x.cancel());
  c.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'none'}],{duration:600,easing:EZ,fill:'forwards'});
  c.querySelectorAll('li').forEach((li,i)=>li.animate([{opacity:0,transform:'translateX(-10px)'},{opacity:1,transform:'none'}],{duration:500,delay:320+i*260,easing:EZ,fill:'both'}));},
 addItem:(html)=>{const c=$('#vo-co');const li=document.createElement('li');li.innerHTML=html;c.querySelector('ul').appendChild(li);li.animate([{opacity:0,transform:'translateX(-10px)'},{opacity:1,transform:'none'}],{duration:500,easing:EZ,fill:'forwards'});},
 calloutOut:()=>{const c=$('#vo-co');c.animate([{opacity:getComputedStyle(c).opacity},{opacity:0,transform:'translateY(14px)'}],{duration:380,easing:EZI,fill:'forwards'});},
 hl:(r,a,pad)=>{const h=$('#vo-hl');pad=pad==null?5:pad;h.style.setProperty('--a',a||'#60a5fa');Object.assign(h.style,{left:(r.x-pad)+'px',top:(r.y-pad)+'px',width:(r.w+2*pad)+'px',height:(r.h+2*pad)+'px'});
  h.getAnimations().forEach(x=>x.cancel());h.animate([{opacity:0,transform:'scale(1.08)'},{opacity:1,transform:'none'}],{duration:450,easing:EZ,fill:'forwards'});},
 hlOut:()=>{const h=$('#vo-hl');h.animate([{opacity:getComputedStyle(h).opacity},{opacity:0}],{duration:300,fill:'forwards'});},
 cursor:(show)=>fade('#vo-cur',show?1:0,show?350:300),
 pos:(x,y)=>{O.cx=x;O.cy=y;$('#vo-cur').style.transform=`translate(${x-4}px,${y-2.5}px)`;},
 ripple:()=>{const r=document.createElement('div');r.className='vo-rip';r.style.left=O.cx+'px';r.style.top=O.cy+'px';root.insertBefore(r,$('#vo-cur'));
  r.animate([{transform:'scale(.3)',opacity:.95},{transform:'scale(1.25)',opacity:0}],{duration:520,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
  $('#vo-cur').animate([{transform:`translate(${O.cx-4}px,${O.cy-2.5}px) scale(1)`},{transform:`translate(${O.cx-4}px,${O.cy-2.5}px) scale(.82)`},{transform:`translate(${O.cx-4}px,${O.cy-2.5}px) scale(1)`}],{duration:220});},
 end:()=>{const e=$('#vo-end');e.style.opacity=1;rise($('#vo-end .logo'),800,0,16);rise($('#vo-end h1'),900,180,20);rise($('#vo-end .sub'),800,420,14);
  root.querySelectorAll('#vo-end .tile').forEach((t,i)=>rise(t,750,900+i*170,22));},
 tag:()=>rise($('#vo-end .tag'),900,0,12),
 frame:(a)=>{if(a.cx!=null)O.pos(a.cx,a.cy);if(a.scroll!=null){const p=document.getElementById('panel');p.scrollTop=a.scroll;}if(a.vb){vb.x=a.vb.x;vb.y=a.vb.y;vb.w=a.vb.w;vb.h=a.vb.h;setVB();}__V.step(a.dt);}};
window.__O=O;
})();
