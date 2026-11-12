#!/usr/bin/env node
/* Screenshot of the app for a quick look.  node dev/tools/shot.js [fragment] [width] [file] [--light]
   e.g.  node dev/tools/shot.js '#if=s1mme' 1440   →  dev/out/shot.png      (fragment as in a deep link; '#help=tr-gtpu' opens the help)
   Saved in dev/out; the panel alone: add --panel. */
const E=require('../env');const {chromium}=require('playwright');const path=require('path');
const a=process.argv.slice(2),flags=a.filter(x=>x.startsWith('--')),pos=a.filter(x=>!x.startsWith('--'));
const frag=pos[0]||'',W=+pos[1]||1440,file=path.resolve(E.OUT,pos[2]||'shot.png');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:Math.round(W*0.6)},colorScheme:flags.includes('--light')?'light':'dark'});
 await p.goto(E.APP+(frag&&!frag.startsWith('#')?'#':'')+frag);await p.waitForTimeout(500);
 if(flags.includes('--light'))await p.evaluate(()=>{if(!document.body.classList.contains('light'))document.getElementById('theme').click();});await p.waitForTimeout(400);
 if(flags.includes('--panel')){const r=await p.evaluate(()=>{const x=document.getElementById('panel').getBoundingClientRect();return {x:x.left,y:x.top,width:x.width,height:x.height};});await p.screenshot({path:file,clip:r});}
 else await p.screenshot({path:file});console.log(file);await b.close();})();
