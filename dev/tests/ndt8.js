const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();for(const w of [1920,1600,1440,1366]){const p=await b.newPage({viewport:{width:w,height:900}});await p.goto(E.APP);await p.waitForTimeout(200);
await p.evaluate(async()=>{await ndLoadText(ND_TEMPLATE_CSV,'t');NDF.sel=new Set(['Site-B']);ndSiteApply();});await p.waitForTimeout(100);
const h=await p.evaluate(()=>[document.querySelector('#hdr').offsetHeight,document.querySelector('#toolbar').offsetHeight]);console.log(w,'hdr+toolbar',h.join('+'));
if(w===1440)await p.screenshot({path:E.OUT+'/tb1440.png',clip:{x:0,y:0,width:1440,height:110}});await p.close();}
await b.close();})();
