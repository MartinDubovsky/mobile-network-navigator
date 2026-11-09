/* Content audit: interface and element names mentioned in the texts (elements, interfaces, generation notes, E2E stacks)
   that are not drawn on the map – a list to review by hand, not an error report.  node dev/tools/audit-mentions.js */
const fs=require('fs');const s=fs.readFileSync(require('path').join(__dirname,'..','..','index.html'),'utf8');
const js=s.slice(s.indexOf('const GENS'),s.indexOf('/* =====================================================================\n   HELPERS'));
const {ELS,LINKS,E2E,GENINFO}=new Function(js+';return {ELS,LINKS,E2E,GENINFO};')();
const drawn=new Set();LINKS.forEach(l=>l.n.split(/\s*\/\s*|\s+/).forEach(x=>drawn.add(x.replace(/[()]/g,''))));
const els=new Set(ELS.map(e=>e.n));
const ifRe=/\b(S\d{1,2}[a-z]?′?|N\d{1,2}[a-z]?|T6a|S6t|SWx|SWm|SWa|STa|S2[abc]|G[a-z]|Rx|Ro|Rf|Sy|Sd|Sh|Cx|Dx|Mw|Mg|Mj|ISC|Bx|Iu-BC|Sxa|Sxb|Sxc|SGd|NLs|NLg)\b/g;
const elRe=/\b(SMSC|SMS-SC|SMSF|LMF|N3IWF|TNGF|ePDG|3GPP AAA|AAA|DEA|DRA|SCEF|TDF|CBC|CBCF|gsmSCF|UDSF|NSSAAF|BM-SC|5G-EIR|CGF|CDF|RU|SCC-AS|ATCF|MGCF|IM-MGW|TAS|P-CSCF|S-CSCF|I-CSCF|DN-AAA|V-PCRF|H-PCRF|V-SMF|H-SMF|I-UPF|PSA|I-SMF|PDF|CRF|TPF)\b/g;
const where={};
function scan(txt,src){if(!txt)return;String(txt).replace(ifRe,m=>{(where['IF '+m]=where['IF '+m]||new Set()).add(src);}).replace(elRe,m=>{(where['EL '+m]=where['EL '+m]||new Set()).add(src);});}
function scanObj(o,src){['full','sum','sb'].forEach(k=>scan(o[k],src));['fn','pr','specs','tips'].forEach(k=>(o[k]||[]).forEach(x=>scan(x,src)));(o.kv||[]).forEach(kv=>scan(kv.join(' '),src));if(o.notes)Object.values(o.notes).forEach(x=>scan(x,src));(o.st||[]).forEach(st=>{scan(st.t,src);st.l.forEach(x=>scan(x,src));});}
ELS.forEach(e=>scanObj(e,'el:'+e.id));LINKS.forEach(l=>scanObj(l,'if:'+l.id));
Object.entries(GENINFO).forEach(([k,g])=>{scan(g.sum,'gen:'+k);g.pts.forEach(p=>scan(p,'gen:'+k));});
E2E.forEach(e=>{scan(e.sum,'e2e:'+e.id);(e.notes||[]).forEach(n=>scan(n,'e2e:'+e.id));});
const out=[];for(const [k,v] of Object.entries(where)){const [t,name]=k.split(' ');const key=k.slice(3);
 if(t==='IF'&&drawn.has(key))continue; if(t==='EL'&&[...els].some(e=>e.includes(key)))continue;
 if(t==='IF'&&/^S\d$|^N\d$/.test(key)&&drawn.has(key))continue;
 out.push(k.padEnd(16)+' <- '+[...v].slice(0,6).join(', '));}
console.log(out.sort().join('\n'));
