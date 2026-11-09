const E=require('../env');
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto(E.APP);
const r=await p.evaluate(()=>{const x=ndClean({format:'mobile-network-navigator/netdata',version:1,network:'J',instances:[{element:'amf',name:'A1',site:'S1',addresses:[{interface:'sbi',ip:'192.0.2.1',port:[8080,443]},{interface:'n2',ip:'192.0.2.2',port:38412}]}]});return JSON.stringify(x.d.instances[0].addresses.map(a=>a.port))+' '+x.w.length;});
console.log(r);await b.close();})();
