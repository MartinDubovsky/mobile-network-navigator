/* virtual clock: once __V.on is set, time, rAF, timers and CSS/Web animations advance only in __V.step(ms) */
(()=>{const rNow=performance.now.bind(performance),rDate=Date.now,rST=window.setTimeout.bind(window),rCT=window.clearTimeout.bind(window),rSI=window.setInterval.bind(window),rCI=window.clearInterval.bind(window),rRAF=window.requestAnimationFrame.bind(window),rCAF=window.cancelAnimationFrame.bind(window);
 const V={on:false,t:0,base:0,raf:[],tm:new Map(),seq:1e6};window.__V=V;
 V.start=()=>{V.t=rNow();V.base=rDate()-V.t;V.on=true;};
 performance.now=()=>V.on?V.t:rNow();Date.now=()=>V.on?Math.round(V.base+V.t):rDate();
 window.requestAnimationFrame=cb=>{if(!V.on)return rRAF(cb);const id=++V.seq;V.raf.push([id,cb]);return id;};
 window.cancelAnimationFrame=id=>{V.raf=V.raf.filter(x=>x[0]!==id);rCAF(id);};
 window.setTimeout=(cb,ms,...a)=>{if(!V.on)return rST(cb,ms,...a);const id=++V.seq;V.tm.set(id,{at:V.t+Math.max(0,+ms||0),cb,a});return id;};
 window.clearTimeout=id=>{if(V.tm.has(id))V.tm.delete(id);else rCT(id);};
 window.setInterval=(cb,ms,...a)=>{if(!V.on)return rSI(cb,ms,...a);const id=++V.seq;V.tm.set(id,{at:V.t+Math.max(1,+ms||0),cb,a,rep:Math.max(1,+ms||0)});return id;};
 window.clearInterval=id=>{if(V.tm.has(id))V.tm.delete(id);else rCI(id);};
 V.step=dt=>{const end=V.t+dt;
  for(let g=0;g<5000;g++){let best=null,bid=null;V.tm.forEach((x,id)=>{if(x.at<=end&&(!best||x.at<best.at)){best=x;bid=id;}});if(!best)break;
   V.t=Math.max(V.t,best.at);if(best.rep)best.at+=best.rep;else V.tm.delete(bid);try{typeof best.cb==='function'?best.cb(...best.a):eval(best.cb);}catch(e){console.error(e);}}
  V.t=end;const cbs=V.raf;V.raf=[];cbs.forEach(([id,cb])=>{try{cb(V.t);}catch(e){console.error(e);}});
  for(const a of document.getAnimations()){if(!a.__v){a.__v=1;a.__ct=a.currentTime||0;a.pause();}else a.__ct+=dt;
   const e=a.effect&&a.effect.getComputedTiming().endTime;
   if(e!=null&&isFinite(e)&&a.__ct>=e){if(typeof CSSTransition!=='undefined'&&(a instanceof CSSTransition||a instanceof CSSAnimation))a.finish();else{a.currentTime=e;try{a.commitStyles();}catch(_){}a.cancel();}}
   else a.currentTime=a.__ct;}};
})();
