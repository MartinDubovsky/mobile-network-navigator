/* Shared set-up for the dev scripts – require it first: const E=require('../env');
   E.ROOT  the repository, E.APP  file URL of index.html, E.CAP  generated test captures (dev/trcap), E.OUT  scratch output (dev/out).
   It also makes failures visible to the runner: a printed line containing the word FAIL, and any uncaught error
   on a page opened with Playwright, set the exit code to 1. */
const path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
const ROOT=path.resolve(__dirname,'..');
const APP=pathToFileURL(path.join(ROOT,'index.html')).href;
const CAP=path.join(__dirname,'trcap');
const OUT=path.join(__dirname,'out');fs.mkdirSync(OUT,{recursive:true});
const log=console.log;console.log=(...a)=>{if(a.some(x=>/\bFAIL/.test(typeof x==='string'?x:JSON.stringify(x)||'')))process.exitCode=1;log(...a);};
try{const pw=require('playwright'),launch=pw.chromium.launch.bind(pw.chromium),seen=new WeakSet();
 const hook=p=>{if(!seen.has(p)){seen.add(p);p.on('pageerror',e=>console.log('FAIL page error: '+e.message));}return p;};
 pw.chromium.launch=async(...a)=>{const b=await launch(...a);
  const nc=b.newContext.bind(b);b.newContext=async(...x)=>{const c=await nc(...x);const cp=c.newPage.bind(c);c.newPage=async(...y)=>hook(await cp(...y));return c;};
  const np=b.newPage.bind(b);b.newPage=async(...x)=>hook(await np(...x));return b;};}catch(e){}
module.exports={ROOT,APP,CAP,OUT};
