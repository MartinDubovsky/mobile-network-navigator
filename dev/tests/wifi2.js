const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
for(const w of [1920,1440]){const p=await b.newPage({viewport:{width:w,height:1080}});p.on('pageerror',e=>errs.push(e.message));await p.goto(E.APP);await p.waitForTimeout(300);
 console.log(w,'hdr+toolbar',await p.evaluate(()=>[document.querySelector('#hdr').offsetHeight,document.querySelector('#toolbar').offsetHeight].join('+')));
 if(w===1920){await p.screenshot({path:E.OUT+'/w1920.png',clip:{x:0,y:0,width:1920,height:90}});
  await p.evaluate(()=>select('el','epdg'));await p.waitForTimeout(100);await p.screenshot({path:E.OUT+'/epdg-panel.png',clip:{x:1480,y:80,width:440,height:1000}});
  await p.evaluate(()=>{select('if','swu');document.querySelector('#panel .mfbox').scrollIntoView();});await p.waitForTimeout(100);await p.click('#panel [data-mfa="big"]');await p.waitForTimeout(150);await p.screenshot({path:E.OUT+'/swu-big.png'});await p.keyboard.press('Escape');
  await p.evaluate(()=>{setView('e2e');});await p.waitForTimeout(100);await p.click('#e2enav button:has-text("VoWiFi")');await p.waitForTimeout(150);await p.screenshot({path:E.OUT+'/e2e-wifi.png'});
  const r=await p.evaluate(()=>{const bad=[];['swu','swm','swx','s2b','s6b','s2bc','s2bu','s6bc'].forEach(id=>{const L=LM[id],F=MF[id];if(!F)bad.push('no flows '+id);else F.forEach(f=>{const P=mfLanes(L,f);f.m.forEach(r=>{if(typeof r[0]==='number'&&(r[0]>=P.length||r[1]>=P.length||r[0]===r[1]))bad.push(id+' '+f.t+' '+r[2]);});});});
   return {bad,flows:LINKS.reduce((a,l)=>a+(MF[l.id]?MF[l.id].length:0),0),msgs:LINKS.reduce((a,l)=>a+(MF[l.id]?MF[l.id].reduce((x,f)=>x+f.m.filter(r=>typeof r[0]==='number').length,0):0),0),links:LINKS.length,els:ELS.length,noflow:LINKS.filter(l=>!MF[l.id]).map(l=>l.id)};});
  console.log(JSON.stringify(r));}
 await p.close();}
console.log(errs.join('\n')||'no errors');await b.close();})();
