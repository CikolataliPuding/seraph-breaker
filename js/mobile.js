// Seraph Breaker · mobile.js: Control modes. Mobile portrait (Archero-style): floating joystick, auto-fire, auto or hold-to-shield barrier, flick/double-tap dash with charges. Mobile landscape: twin sticks, desktop rules, fullscreen.
/* ================= CONTROL MODE ================= */
function wantMobile(){ if(typeof DEBUG!=='undefined'&&DEBUG&&QS.get('mobile')==='1') return true; return P.ctrl==='mobile'||(P.ctrl!=='desktop'&&isTouch); }
/* a touch device held sideways (patch.md 28 [karar]) plays by the desktop rules: desktop rooms and camera, firing while moving costs the same
   35% speed, the dash runs on its cooldown. Left thumb: move stick, right thumb: aim stick that fires while held (a light aim assist snaps to
   an enemy within 20°). Held upright it stays the portrait Archero mode. Turning the phone switches the mode (the next room takes its size). */
function setMode(){
  const w=wantMobile(), side=innerWidth>innerHeight, m=w&&!side; mobileMode=m; landMode=w&&side; document.body.classList.toggle('mob',m); document.body.classList.toggle('land',landMode);
  const hint=$('mHint'); if(hint) hint.textContent=t(landMode?'Left thumb: move · right thumb: aim and fire · DASH and SP on the right':'Drag to move · let go to fire · dash: DASH button (drag to aim) or double-tap and slide');
  // phones: cap the pixel ratio and use a smaller shadow map
  renderer.setPixelRatio(Math.min(devicePixelRatio,m||landMode?1.5:isTouch?1.6:2));
  const sm=m||landMode?768:isTouch?1024:2048; if(sun.shadow.mapSize.x!==sm){ sun.shadow.mapSize.set(sm,sm); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
  resize(); resetTouch(); if(typeof refreshControls==='function') refreshControls();
}

/* ================= FLOATING JOYSTICK ================= */
const JOY_R=58;
const joy={id:null,ox:0,oy:0,x:0,y:0,t0:0,hist:[],lastTap:0,tx:0,ty:0,moved:0,arm:0};
/* aimed dash (phone). You choose the direction, the auto-aim never does:
   - Dash button: while the stick is held it dashes at once along the stick; otherwise drag from the button and it dashes the way you drag
     (a plain tap dashes the way you last moved).
   - Second finger: with the stick held, tap anywhere else to dash along the stick.
   - Double tap: tap, then touch again and slide: it dashes the way you slide (no slide within DASH_ARM s: the way you last moved).
   - Flick: a fast flick of the stick on release. */
const DASH_DRAG=14, DASH_ARM=.14;
// landscape aim stick (right half of the screen)
const aimJ={id:null,ox:0,oy:0,x:0,y:0}, _av=new V3();
function aimVec(out){ if(aimJ.id===null||Math.hypot(aimJ.x,aimJ.y)<.25) return null; return out.set(aimJ.x,0,aimJ.y); }
// landscape on a phone: the first touch after turning it goes fullscreen and locks the turn (Android; iPhone Safari has no fullscreen for pages,
// there "Add to Home Screen" opens it without the browser bars)
let fsAsked=false;
function goFull(){ if(!landMode||fsAsked||document.fullscreenElement) return; fsAsked=true; const de=document.documentElement;
  if(de.requestFullscreen) de.requestFullscreen({navigationUI:'hide'}).then(()=>{ try{ screen.orientation.lock('landscape').catch(()=>{}); }catch(_){} }).catch(()=>{}); }
let mShieldHeld=false; // Mobile shield: Manual, the hold-to-shield button
function initMobile(){
  const layer=$('touch'), el=$('stkM'), knob=el.firstElementChild, pips=$('dashPips');
  const end=e=>{ if(aimJ.id===e.pointerId){ aimJ.id=null; aimJ.x=aimJ.y=0; $('stkA').hidden=true; return; }
    if(joy.id!==e.pointerId) return;
    // a fast flick on release dashes in the flick direction
    const now=performance.now(), h=joy.hist; let fx=0,fy=0,fv=0;
    for(let i=h.length-1;i>=0;i--){ if(now-h[i][0]>90) { const dt=Math.max(16,now-h[i][0]); fx=e.clientX-h[i][1]; fy=e.clientY-h[i][2]; fv=Math.hypot(fx,fy)/dt; break; } }
    if(!fv&&h.length){ const a=h[0],dt=Math.max(16,now-a[0]); fx=e.clientX-a[1]; fy=e.clientY-a[2]; fv=Math.hypot(fx,fy)/dt; }
    if(joy.arm){ joy.arm=0; tryDash(); }
    else if(!landMode&&fv>1.15&&Math.hypot(joy.x,joy.y)>.45) tryDash(new V3(fx,0,fy).normalize());
    // a short tap counts toward a double tap
    if(now-joy.t0<220&&joy.moved<14){ joy.lastTap=now; joy.tx=e.clientX; joy.ty=e.clientY; }
    joy.id=null; joy.x=joy.y=0; el.hidden=true; joy.hist.length=0;
  };
  const ela=$('stkA'), knobA=ela.firstElementChild;
  layer.addEventListener('pointerdown',e=>{
    if(e.target!==layer) return;
    // landscape: the right half is the aim stick, the left half the move stick (no double-tap or second-finger dash: the DASH button does it)
    if(landMode&&e.clientX>innerWidth*.5){ if(aimJ.id!==null) return; aimJ.id=e.pointerId; aimJ.ox=e.clientX; aimJ.oy=e.clientY; aimJ.x=aimJ.y=0;
      ela.style.left=aimJ.ox+'px'; ela.style.top=aimJ.oy+'px'; ela.hidden=false; knobA.style.transform=''; try{ layer.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault(); return; }
    if(landMode&&joy.id!==null) return;
    // a second finger while the stick is held: dash along the stick
    if(joy.id!==null){ if(e.pointerId!==joy.id){ e.preventDefault(); tryDash(); } return; }
    $('mHint').hidden=true;
    if(!landMode&&e.clientY<innerHeight*.4) return;
    const now=performance.now();
    // double tap: arm the dash; sliding this touch picks its direction
    if(!landMode&&now-joy.lastTap<300&&Math.hypot(e.clientX-joy.tx,e.clientY-joy.ty)<60){ joy.lastTap=0; joy.arm=now; setTimeout(()=>{ if(joy.arm===now){ joy.arm=0; tryDash(); } },DASH_ARM*1000); }
    joy.id=e.pointerId; joy.ox=e.clientX; joy.oy=e.clientY; joy.x=joy.y=0; joy.t0=now; joy.moved=0; joy.hist.length=0; joy.hist.push([now,e.clientX,e.clientY]);
    el.style.left=joy.ox+'px'; el.style.top=joy.oy+'px'; el.hidden=false; knob.style.transform='';
    pips.style.left=joy.ox+'px'; pips.style.top=(joy.oy-JOY_R-22)+'px'; pips.style.bottom='auto';
    try{ layer.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault();
  });
  layer.addEventListener('pointermove',e=>{
    if(aimJ.id===e.pointerId){ let dx=e.clientX-aimJ.ox,dy=e.clientY-aimJ.oy; const l=Math.hypot(dx,dy);
      if(l>JOY_R){ aimJ.ox+=dx*(1-JOY_R/l); aimJ.oy+=dy*(1-JOY_R/l); dx*=JOY_R/l; dy*=JOY_R/l; ela.style.left=aimJ.ox+'px'; ela.style.top=aimJ.oy+'px'; }
      aimJ.x=dx/JOY_R; aimJ.y=dy/JOY_R; knobA.style.transform=`translate(${dx}px,${dy}px)`; return; }
    if(joy.id!==e.pointerId) return;
    let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy; const l=Math.hypot(dx,dy); joy.moved=Math.max(joy.moved,l);
    // drag past the rim and the stick follows the thumb
    if(l>JOY_R){ joy.ox+=dx*(1-JOY_R/l); joy.oy+=dy*(1-JOY_R/l); dx*=JOY_R/l; dy*=JOY_R/l; el.style.left=joy.ox+'px'; el.style.top=joy.oy+'px'; }
    joy.x=dx/JOY_R; joy.y=dy/JOY_R; knob.style.transform=`translate(${dx}px,${dy}px)`;
    if(joy.arm&&joy.moved>=DASH_DRAG){ joy.arm=0; tryDash(new V3(dx,0,dy).normalize()); }
    const h=joy.hist; h.push([performance.now(),e.clientX,e.clientY]); if(h.length>8) h.shift();
  });
  layer.addEventListener('pointerup',end); layer.addEventListener('pointercancel',end); layer.addEventListener('lostpointercapture',end);
  const tap=(id,fn)=>$(id).addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); fn(); const d=$(id); d.classList.add('on'); setTimeout(()=>d.classList.remove('on'),120); });
  const sh=$('tSH'), shOff=e=>{ mShieldHeld=false; sh.classList.remove('on'); };
  sh.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); mShieldHeld=true; sh.classList.add('on'); try{ sh.setPointerCapture(e.pointerId); }catch(_){} });
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>sh.addEventListener(t,shOff));
  // dash button: along the held stick at once, else drag to aim (release without a drag: the way you last moved)
  const db=$('tDash'); let dbId=null,dbX=0,dbY=0;
  db.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); db.classList.add('on');
    if(landMode||joyVec(_jv).lengthSq()>0){ tryDash(); return; } // landscape: along the move stick, else where you aim
    dbId=e.pointerId; dbX=e.clientX; dbY=e.clientY; try{ db.setPointerCapture(e.pointerId); }catch(_){} });
  db.addEventListener('pointermove',e=>{ if(e.pointerId!==dbId) return; const dx=e.clientX-dbX,dy=e.clientY-dbY; if(Math.hypot(dx,dy)>=DASH_DRAG){ dbId=null; tryDash(new V3(dx,0,dy).normalize()); } });
  const dbEnd=e=>{ db.classList.remove('on'); if(e.pointerId!==dbId) return; dbId=null; if(e.type==='pointerup') tryDash(); };
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>db.addEventListener(t,dbEnd));
  tap('tSP',trySpecial); tap('tG1',()=>useGadget(0)); tap('tG2',()=>useGadget(1)); tap('tPause',togglePause);
  addEventListener('touchstart',()=>{ if(!isTouch){ isTouch=true; document.body.classList.add('touch'); if(P.ctrl==='auto') setMode(); } },{passive:true});
  addEventListener('resize',()=>{ if(wantMobile()&&(innerWidth>innerHeight)!==landMode){ fsAsked=false; setMode(); } resetTouch(); });
  addEventListener('pointerdown',()=>{ if(isTouch) goFull(); },{passive:true});
  setMode();
}
function resetTouch(){ aimJ.id=null; aimJ.x=aimJ.y=0; const ea=$('stkA'); if(ea) ea.hidden=true; mShieldHeld=false; joy.arm=0; const sh=$('tSH'); if(sh) sh.classList.remove('on'); joy.id=null; joy.x=joy.y=0; const el=$('stkM'); if(el) el.hidden=true; joy.hist.length=0; }
function joyVec(out){ if(joy.id===null||Math.hypot(joy.x,joy.y)<.18) return out.set(0,0,0); return out.set(joy.x,0,joy.y); }

/* ================= AUTO-AIM ================= */
// segment vs block test (blocks stop shots, canals do not); pad grows each block (negative shrinks it, the default)
function losClear(ax,az,bx,bz,pad=-.15){
  for(const o of obstacles){ if(o.kind!=='block') continue;
    let t0=0,t1=1; const dx=bx-ax,dz=bz-az;
    const ok=(p,q)=>{ if(Math.abs(p)<1e-9) return q>=0; const r=q/p; if(p<0){ if(r>t1) return false; if(r>t0) t0=r; } else { if(r<t0) return false; if(r<t1) t1=r; } return true; };
    if(ok(-dx,ax-(o.x0-pad))&&ok(dx,(o.x1+pad)-ax)&&ok(-dz,az-(o.z0-pad))&&ok(dz,(o.z1+pad)-az)) return false; }
  return true;
}
// nearest visible enemy; near-ties (within 1.5 units) go to the one with the lowest HP
function autoTarget(){
  const p=player; let best=null,bd=1e9;
  for(const e of enemies){ if(e.dead||e.born<.4||e.dropY>0||e.under) continue; if(e===boss&&(boss.atk==='enter'||boss.immune||state==='cine')) continue;
    const d=Math.hypot(e.pos.x-p.pos.x,e.pos.z-p.pos.z)-e.r*.5; if(d>bd+1.5) continue;
    if(!losClear(p.pos.x,p.pos.z,e.pos.x,e.pos.z,.3)) continue; // grown by most of a shot's radius: a line grazing a corner would only feed the block
    if(!best||d<bd-1.5||(Math.abs(d-bd)<=1.5&&e.hp<best.hp)){ if(d<bd) bd=d; best=e; } }
  return best;
}
// melee and short-range weapons only auto-fire when the target is close enough
function autoRangeOk(f){ const w=P.weapon, d=Math.hypot(f.pos.x-player.pos.x,f.pos.z-player.pos.z)-f.r*.6; return w==='blade'?d<5.5:w==='torch'?d<8:true; }

/* ================= AUTO BARRIER ================= */
// Mobile shield: Auto (default) blocks the next enemy shot that would hit while power is above 60; each block costs 30, so a full bar holds 2.
// Manual (P.mshield) adds a hold-to-shield button that works like the desktop directional hex shield instead.
const barrierAuto=()=>mobileMode&&P.mshield!=='manual';
function barrierCharges(){ const p=player; if(!p||p.st.noHex) return {n:0,k:0}; const n=p.en>60?Math.min(2,Math.floor((p.en-60.0001)/30)+1):0; return {n,k:n>=2?0:n?(p.en-60)/30:p.en/60}; }
function tryBarrier(b){
  const p=player; if(!barrierAuto()||p.st.noHex||p.en<=60||p.dashT>0) return false;
  p.en-=30*p.st.hexDrain; p.regenDelay=1.2; sfx('shield'); buzz(15);
  hexFlash(b.m.position); sparks(b.m.position,0xffa04a,5,5); hexBurst(p.pos,1.4,.3);
  if(p.en<=60) barrierBreak();
  if(p.rs.reflect) reflectShot(b);
  return true;
}
let hexFlashT=0; const _hf=new V3();
function hexFlash(from){ const p=player; _hf.set(from.x-p.pos.x,0,from.z-p.pos.z); if(_hf.lengthSq()<1e-4) _hf.copy(p.aim); _hf.normalize(); shieldG.position.copy(p.pos).addScaledVector(_hf,1.4).setY(1.9); shieldG.lookAt(_tmp.copy(shieldG.position).add(_hf)); shieldG.visible=true; hexFlashT=.18; }
// the ring pops on every block and shatters when the last charge is used
function hexBurst(pos,size,life){ const m=new THREE.Mesh(barRing.geometry,addMat(0xffc070,.9)); m.rotation.x=-Math.PI/2; m.rotation.z=barRing.rotation.z; m.position.set(pos.x,.14,pos.z); addFx(m,life,(f,dt,k)=>{ m.scale.setScalar(size*(1+(1-k)*.8)); m.material.opacity=k*.9; }); }
function barrierBreak(){ const p=player; hexBurst(p.pos,1.6,.5); sparks(p.pos.clone().setY(1.2),0xffa04a,12,7); popText(t('BARRIER DOWN')); if(p.rs.hexnova) hexNova(); }

/* ================= AUTO GADGETS ================= */
function autoGadgets(){
  if(!P.autoGadget) return; const p=player;
  for(let s=0;s<2;s++){ const id=P.gadgets[s]; if(!id||p.gcd[s]>0) continue; const f=nearestFoe(p.pos,9); if(!f) continue;
    if(id==='hook'||id==='jets'){ _tmp.subVectors(f.pos,p.pos).setY(0).normalize(); p.aim.copy(_tmp); }
    p.autoUse=true; useGadget(s); p.autoUse=false; break; }
}
