// Seraph Breaker · enemy-ai.js: Enemy behaviour by role (AI + ANIM tables): sensing, steering on the nav grid (nav.js), readable attack cycles and enemy mines.
/* ================= HELPERS ================= */
const _sv=new V3(),_sv2=new V3(),_lp=new V3(),_ld=new V3();
// how far a straight line runs before a block or the mat edge
function lineLen(x,z,dx,dz,max,pad=0){ let t=0; while(t<max){ t+=.4; const px=x+dx*t,pz=z+dz*t; if(Math.abs(px)>AX-1||Math.abs(pz)>AZ-1||inBlock(px,pz,pad,'block')) return Math.max(0,t-.4); } return max; }
// ground telegraph strip (fades out on its own)
function teleStrip(pos,dx,dz,len,w,color,life){ const g=new THREE.Group(), mat=addMat(color,.3), pl=new THREE.Mesh(new THREE.PlaneGeometry(w,len),mat); pl.rotation.x=-Math.PI/2; pl.position.z=len/2; g.add(pl); g.position.set(pos.x,.05,pos.z); g.rotation.y=Math.atan2(dx,dz); addFx(g,life,(f,dt,k)=>{ mat.opacity=.18+.22*Math.abs(Math.sin((1-k)*life*9)); }); return g; }
// lobbed shell (howitzer, mine layers): visual arc with a ground shadow, then onLand. marker: a red landing ring (the Howitzer has its own).
function lobShell(from,to,dur,color,onLand,marker){ const g=new THREE.Group(), m=new THREE.Mesh(G.orb,basic(color,false)); m.scale.setScalar(1.2); const sh=blob(.4); sh.position.y=.04; g.add(m,sh);
  let mk=null; if(marker){ mk=new THREE.Mesh(G.ring,addMat(0xff3a2a,.8)); mk.rotation.x=-Math.PI/2; mk.position.set(to.x,.07,to.z); mk.scale.setScalar(1.3); g.add(mk); }
  let done=false; addFx(g,dur,(f,dt,k)=>{ const u=1-k, y=from.y*(1-u)+7*4*u*(1-u)+.3; m.position.set(from.x+(to.x-from.x)*u,y,from.z+(to.z-from.z)*u);
    sh.position.x=m.position.x; sh.position.z=m.position.z; sh.scale.setScalar(1.1-clamp(y/10,0,.6)); if(mk) mk.material.opacity=.35+.45*Math.abs(Math.sin(u*u*18));
    if(k<=.02&&!done){ done=true; sh.visible=false; if(mk) mk.visible=false; onLand&&onLand(); } }); }
// contact damage, with Thorn Plating paying it back
function contactHurt(e,d){ const before=player.hp; hurt(d); if(player.thorn&&player.hp<before&&!e.dead) hitEnemy(e,d*3*player.st.dmg,e.pos.clone().setY(2),false,true); }
// Spark explosion: hurts you only when it detonates on its own; it always hurts other enemies (chain reactions are queued and capped)
function sparkBoom(e){ if(e.boomed) return; e.boomed=true; queueBlast(e.pos.x,e.pos.z,{t:.02,rad:2.6,dmg:10*ARENAS[stage].hpMul,hurtP:16,color:0xffa040,size:.8,skip:e,flat:true}); killEnemy(e,true); }
/* enemy mines (Crawler, Siege Arachne) */
function dropEMine(x,z,arm=.8){ if(emines.length>=14||room&&room.cleared) return; x=clamp(x,-AX+.6,AX-.6); z=clamp(z,-AZ+.6,AZ-.6);
  const g=new THREE.Group(); part(new THREE.CylinderGeometry(.4,.45,.16,8),toon(0x2a2632),g,0,.08,0,.05); const l=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),basic(0xff3a2a,false)); l.position.y=.2; g.add(l);
  const ring=new THREE.Mesh(G.ring,addMat(0xff3a2a,.3)); ring.rotation.x=-Math.PI/2; ring.position.y=.04; ring.scale.setScalar(1.5); g.add(ring); g.position.set(x,0,z); roomGroup.add(g); emines.push({g,l,x,z,arm,life:12}); }
function updateEMines(dt,t){ for(let i=emines.length-1;i>=0;i--){ const m=emines[i]; m.arm-=dt; m.life-=dt; m.l.visible=Math.floor(t*(m.arm>0?3:8))%2===0;
  const pd=player?Math.hypot(player.pos.x-m.x,player.pos.z-m.z):99; let boom=m.life<=0||(m.arm<=0&&!player.dead&&pd<1.4);
  if(boom){ if(m.life>0){ crossBlast(new V3(m.x,0,m.z),0xff5a2a,.6); if(pd<2.2) hurt(14); } roomGroup.remove(m.g); emines.splice(i,1); } } }

/* ================= SENSING + STEERING ================= */
// line of sight to the target, refreshed every ~0.14 s. seeT: how long it has been in view (an enemy fires only after AI_LV.react)
function sense(e,dt){ e.losT-=dt; if(e.losT<=0){ e.losT=rand(.1,.18); const T=tgt(); e.see=losClear(e.pos.x,e.pos.z,T.x,T.z); }
  if(e.see){ e.seeT+=dt; e.blindT=0; } else { e.seeT=0; e.blindT+=dt; if(e.blindT>.5&&e.replanT>.25) e.replanT=.25; } }
const canFire=e=>e.see&&e.seeT>=AIL().react*(e.elite?.7:1)&&!player.dead&&!e.hold;
// cooldowns run faster for elites, and (arena 3+) while your dash is recharging
const cdRate=e=>(e.elite?1.25:1)*(AIL().read&&!AIR.ready?1+AIL().read:1);
// aim direction from (fx,fz) for a shot of speed spd, led by the arena's lead
function leadDir(fx,fz,spd,out,k=AIL().lead){ leadPoint(fx,fz,spd,k,_lp); out.set(_lp.x-fx,0,_lp.z-fz); const l=out.length(); if(l<.01){ const T=tgt(); out.set(T.x-fx,0,T.z-fz); } return out.normalize(); }
// soft separation: close neighbours push the wanted velocity apart so a pack spreads out; k = how fast the velocity follows it
function steer(e,want,dt,k){
  let sx=0,sz=0; for(const o of enemies){ if(o===e||o.dead) continue; const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z,R=(e.r+o.r)*1.1,dd=dx*dx+dz*dz; if(dd<R*R&&dd>1e-4){ const d=Math.sqrt(dd),f=(R-d)/R; sx+=dx/d*f; sz+=dz/d*f; } }
  _sv2.set(want.x+sx*e.speed*1.3,0,want.z+sz*e.speed*1.3);
  e.vel.lerp(_sv2,Math.min(1,dt*k));
}
// toward the target along the flow field (straight when the way is clear). Flyers ignore blocks.
function chase(e,spd,out){ const T=tgt(), dx=T.x-e.pos.x,dz=T.z-e.pos.z,l=Math.hypot(dx,dz)||1;
  if(e.fly||!NAV.ok||walkClear(e.pos.x,e.pos.z,T.x,T.z,e.r*.5)||!flowDir(e.pos.x,e.pos.z,out)) return out.set(dx/l*spd,0,dz/l*spd);
  return out.multiplyScalar(spd); }
// toward a point: straight when clear, else along an A* path that is replanned when the goal moves
function seek(e,gx,gz,spd,out){
  const dx=gx-e.pos.x,dz=gz-e.pos.z,l=Math.hypot(dx,dz); if(l<.3) return out.set(0,0,0);
  const arrive=Math.min(1,l/1.5);
  if(e.fly||!NAV.ok||walkClear(e.pos.x,e.pos.z,gx,gz,e.r*.5)){ e.path=null; return out.set(dx/l*spd*arrive,0,dz/l*spd*arrive); }
  if(!e.path||e.pathT<=0||Math.abs(e.pathG.x-gx)+Math.abs(e.pathG.z-gz)>1.5){ e.path=navPath(e.pos.x,e.pos.z,gx,gz,e.r*.5); e.pathG={x:gx,z:gz}; e.pathT=1.2; e.pathI=0; }
  const P=e.path; if(!P||!P.length) return chase(e,spd,out);
  while(e.pathI<P.length-2&&(Math.hypot(P[e.pathI]-e.pos.x,P[e.pathI+1]-e.pos.z)<.7||walkClear(e.pos.x,e.pos.z,P[e.pathI+2],P[e.pathI+3],e.r*.5))) e.pathI+=2;
  const wx=P[e.pathI]-e.pos.x,wz=P[e.pathI+1]-e.pos.z,wl=Math.hypot(wx,wz)||1; return out.set(wx/wl*spd,0,wz/wl*spd);
}
// back away from the target; against a wall it slides sideways instead
function backOff(e,to,spd,out){ out.set(-to.x*spd,0,-to.z*spd); if(e.fly||!NAV.ok||spd<=0) return out;
  if(!walkClear(e.pos.x,e.pos.z,e.pos.x-to.x*1.6,e.pos.z-to.z*1.6)){ out.set(-to.z*e.side*spd,0,to.x*e.side*spd); if(!walkClear(e.pos.x,e.pos.z,e.pos.x+out.x/spd*1.6,e.pos.z+out.z/spd*1.6)){ e.side*=-1; out.multiplyScalar(-1); } }
  return out; }
// ranged roles: stand on a slot at range [near,far] that can see the target (replanned about once a second, sooner when the view is lost)
function holdBand(e,dt,to,d,near,far,o){
  e.replanT-=dt; if(e.replanT<=0||!e.goal){ e.replanT=rand(.7,1.1); planSpot(e,near,far,o); }
  if(d<near*.75&&e.see) return backOff(e,to,e.speed,_sv);
  return seek(e,e.goal.x,e.goal.z,e.speed,_sv);
}
const faceAim=(e,dt,to,k)=>{ e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*k)); };
/* readable attack cycle: 'pos' (moves; the cooldown ticks) → 'tele' (plants itself and winds up) → fire → 'rec' (holds still) → 'pos', token released.
   pick() returns an attack from ATK when one is possible right now; without a free attack token the enemy keeps repositioning instead. */
function attackCycle(e,dt,want,pick,k=3){
  if(e.ph==='pos'){ steer(e,want,dt,k); if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    if(e.cd<=0){ const a=pick(); if(a&&takeToken(e)){ e.atk=a; e.ph='tele'; e.phT=e.phMax=a.tele; if(a.start) a.start(e); } } return; }
  const a=e.atk; steer(e,_sv2.copy(want).multiplyScalar(a.move||0),dt,6); e.phT-=dt; if(a.tick) a.tick(e,dt);
  if(e.ph==='tele'&&e.phT<=0){ if(!a.need||a.need(e)){ a.fire(e); e.ph='rec'; e.phT=a.rec; } else { e.ph='pos'; e.cd=.3; dropToken(e); } }
  else if(e.ph==='rec'&&e.phT<=0){ e.ph='pos'; e.cd=rand(a.cd[0],a.cd[1]); dropToken(e); if(a.after) a.after(e); }
}
// stun / freeze interrupts whatever the enemy was doing and frees its token
function interrupt(e){ dropToken(e); if(e.ph!=='pos'&&e.ph!=='cover'){ e.ph='pos'; e.cd=Math.max(e.cd,.5); }
  if(e.type==='lancer'&&(e.st==='aim'||e.st==='lock')){ e.st='move'; e.stT=rand(1,1.6); e.model.laser.visible=false; }
  if(e.type==='ophan'&&e.st!=='pause'){ e.st='pause'; e.stT=1; } }
const _muz=e=>{ e.model.muzzle.getWorldPosition(_tmp2); return _tmp2.clone().setY(1.7); };
function fanShot(from,base,n,step,spd,dmg,color,o){ for(let i=-n;i<=n;i++){ const a=base+i*step; shoot('e',from,new V3(Math.sin(a),0,Math.cos(a)),spd,dmg,color,o); } }

/* ================= ATTACKS ================= */
// tele: wind-up seconds · rec: recovery · cd: cooldown range after it · need: checked at the end of the wind-up (else the attack is called off)
const ATK={
  // Drone rifle: one led shot after a short glint
  rifle:{tele:.38,rec:.3,cd:[1.2,2],need:e=>e.see,fire(e){ const mz=_muz(e), s=9*eSpd(); shoot('e',mz,leadDir(mz.x,mz.z,s,new V3()),s,10,0xff5a2a,{life:3,r:.45}); sparks(mz,0xff8a40,3,3); e.jz.rec.v+=3; }},
  // Heavy spread shot: 5 shots (7 for elites) fanned around the led aim
  fan:{tele:.5,rec:.45,cd:[1.9,2.5],need:e=>e.see,fire(e){ const mz=_muz(e), s=8*eSpd(), d=leadDir(mz.x,mz.z,s,_ld); fanShot(mz,Math.atan2(d.x,d.z),e.elite?3:2,.2,s,12,0xff5a2a,{life:3.2,r:.5}); sparks(mz,0xff8a40,3,3); e.jz.rec.v+=6; }},
  /* Heavy slam: the red ring shows the reach and fills during the wind-up, then a small shockwave rolls out to it.
     Step outside the ring or dash through the wave. A little version of the Iron Colossus slam. */
  slam:{tele:.85,rec:.9,cd:[1.6,2.2],start(e){ slamTele(e.pos,e.def.slam,.85,.45); sfx('click'); },fire(e){ const s0=shake; shockwave(e.pos,12,e.def.slam,0xff5a2a); shake=Math.max(s0,.28); e.jz.pop.v=-6; sparks(e.pos.clone().setY(.4),0xc8c0d0,6,5); sfx('heavy'); }},
  // Bulwark: a short fan from behind the shield
  bfan:{tele:.45,rec:.5,cd:[2.4,3.2],need:e=>e.see,fire(e){ const mz=_muz(e); fanShot(mz,e.yaw,2,.16,8.5*eSpd(),11,0xff5a2a,{life:1.6,r:.45}); e.jz.rec.v+=6; }},
  // Warden: a ring of slow shots around itself (area denial)
  ring:{tele:.5,rec:.4,cd:[2.2,3],fire(e){ const n=e.elite?14:10,off=rand(0,1); for(let i=0;i<n;i++){ const a=(i+off)/n*Math.PI*2; shoot('e',e.pos.clone().setY(1.8),new V3(Math.sin(a),0,Math.cos(a)),6*eSpd(),10,0xffc040,{life:4,r:.45}); } }},
  // Shardling: three shards around the led aim
  tri:{tele:.4,rec:.3,cd:[1.8,2.6],need:e=>e.see,fire(e){ const o=e.pos.clone().setY(1.6*e.sc+.3), s=9*eSpd(), d=leadDir(o.x,o.z,s,_ld); fanShot(o,Math.atan2(d.x,d.z),1,.22,s,8,0x8fd0ff,{life:.95,r:.4}); }},
  // Crawler: two quick bursts of twin shots, then it looks for cover
  burst:{tele:.3,rec:.5,cd:[1.6,2.3],need:e=>e.see,fire(e){ e.burst=2; e.bT=0; },
    tick(e,dt){ if(e.ph!=='rec'||!e.burst) return; e.bT-=dt; if(e.bT>0) return; e.bT=.13; e.burst--; const s=10*eSpd(), d=leadDir(e.pos.x,e.pos.z,s,_ld), y=Math.atan2(d.x,d.z);
      for(const k of [-1,1]){ const o=new V3(e.pos.x+d.x*1.1+Math.cos(y)*k*.2,1.4,e.pos.z+d.z*1.1-Math.sin(y)*k*.2); shoot('e',o,d.clone(),s,8,0xff5a2a,{life:2.5,r:.4}); } sparks(e.pos.clone().setY(1.6).addScaledVector(d,1.1),0xff8a40,2,3); },
    after(e){ const c=coverSpot(e,5.5); if(c){ e.ph='cover'; e.goal=c; e.phT=rand(.9,1.5); } }},
  // Censer: three slow homing light orbs that float over blocks (no line of sight needed)
  orbs:{tele:.55,rec:.5,cd:[3.2,4.2],fire(e){ let live=0; for(const b of bullets) if(b.tag==='censer') live++; if(live>=12) return; const T=tgt(), b0=Math.atan2(T.x-e.pos.x,T.z-e.pos.z);
    for(let i=-1;i<=1;i++){ const a=b0+i*.7; shoot('e',e.pos.clone().setY(2.2),new V3(Math.sin(a),0,Math.cos(a)),3.6*eSpd(),10,0xffe9a0,{life:6,r:.6,scale:1.35,home:6,turn:1.1,after:3.6,air:'float',tag:'censer'}); } sfx('zap'); }},
};

/* ================= ROLE AI ================= */
// AI[type](e,dt,to,d,pd,m): to = unit vector to the target, d = its distance, pd = distance to the player, m = model
const AI={
  // kiter: holds its band with line of sight and backs off when you push in
  drone(e,dt,to,d,pd,m){ const [n,f]=e.def.band; attackCycle(e,dt,holdBand(e,dt,to,d,n,f),()=>canFire(e)&&d<f*1.4?ATK.rifle:null); faceAim(e,dt,to,8); },
  shardling(e,dt,to,d,pd,m){ const [n,f]=e.def.band; attackCycle(e,dt,holdBand(e,dt,to,d,n,f),()=>canFire(e)&&d<f*1.3?ATK.tri:null,2); faceAim(e,dt,to,5); },
  // tank: walks in along the flow field; slams when you are inside its ring, fans when you are not
  heavy(e,dt,to,d,pd,m){ e.slamCd=(e.slamCd||0)-dt;
    const want=d>e.def.hold?chase(e,e.speed,_sv):d<2.4?backOff(e,to,e.speed*.6,_sv):_sv.set(0,0,0);
    attackCycle(e,dt,want,()=>{ if(d<e.def.slam+.6&&e.slamCd<=0){ e.slamCd=rand(3.2,4.2)/(.6+.4*AIL().aggr); return ATK.slam; } return canFire(e)&&d<12?ATK.fan:null; },2.2);
    faceAim(e,dt,to,e.ph==='pos'?5:8); },
  bulwark(e,dt,to,d,pd,m){ const want=d>e.def.hold?chase(e,e.speed,_sv):_sv.set(0,0,0); attackCycle(e,dt,want,()=>canFire(e)&&d<10?ATK.bfan:null,2);
    e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*2)); }, // turns slowly: flank it
  // denial: hovers at range and fills the area with rings
  warden(e,dt,to,d,pd,m){ const [n,f]=e.def.band; attackCycle(e,dt,holdBand(e,dt,to,d,n,f),()=>(canFire(e)||d<7)?ATK.ring:null,2); faceAim(e,dt,to,6); },
  /* charger: hovers on a slot, winds up, locks a predicted line (shown on the ground for the last moment) and charges along it */
  seraph(e,dt,to,d,pd,m){ const mini=e.mini, lockAt=mini?.18:.25, cs=22;
    if(e.ph==='charge'){ e.phT-=dt;
      if(Math.random()<.5){ const tr=new THREE.Mesh(G.spark,basic(0xffd36a,true)); tr.position.copy(e.pos).setY(2); tr.scale.setScalar(3); addFx(tr,.3,(f,dt,k)=>{tr.scale.setScalar(k*3);}); }
      if((pd<e.r+.5&&!player.dead)||(decoy&&d<e.r+.5)){ if(pd<e.r+.5) contactHurt(e,14); e.vel.multiplyScalar(-.3); e.ph='rec'; e.phT=1.1; }
      else if(e.phT<=0){ e.ph='rec'; e.phT=mini?.6:.9; m.core.scale.setScalar(1); } return; }
    if(e.ph==='tele'){ steer(e,_sv.set(0,0,0),dt,5); e.phT-=dt;
      if(e.phT>lockAt||!e.lock){ e.lock=leadDir(e.pos.x,e.pos.z,cs,e.lock||new V3(),AIL().lead); e.yaw=lerpAngle(e.yaw,Math.atan2(e.lock.x,e.lock.z),Math.min(1,dt*10)); }
      if(e.phT<=lockAt&&!e.locked){ e.locked=true; teleStrip(e.pos,e.lock.x,e.lock.z,cs*.55,e.r*1.4,0xffd36a,lockAt+.3); }
      m.core.scale.setScalar(1.4+Math.sin(e.t*50)*.4);
      if(e.phT<=0){ e.ph='charge'; e.phT=.55; e.vel.copy(e.lock).multiplyScalar(cs); e.jz.pop.v=4; } return; }
    if(e.ph==='rec'){ steer(e,_sv.set(0,0,0),dt,2); e.phT-=dt; if(e.phT<=0){ e.ph='pos'; e.cd=rand(1.5,2.6); dropToken(e); } faceAim(e,dt,to,3); return; }
    const [n,f]=e.def.band; steer(e,holdBand(e,dt,to,d,n,f),dt,2.5); faceAim(e,dt,to,6);
    if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    if(e.cd<=0&&d<13&&takeToken(e)){ e.ph='tele'; e.phT=e.phMax=mini?.5:.65; e.locked=false; e.lock=null; } },
  ophan(e,dt,to,d,pd,m){ e.stT-=dt;
    if(e.st==='tele'){ e.vel.set(0,0,0); if(e.stT<=0){ e.st='roll'; e.dropT=0; } }
    else if(e.st==='roll'){ const r=e.roll; e.vel.set(r.x,0,r.z).multiplyScalar(e.speed); r.done+=e.speed*dt*(e.slow>0?.55:1);
      e.dropT-=dt; if(e.dropT<=0){ e.dropT=.24; for(const s of [-1,1]) shoot('e',e.pos.clone().setY(1.2),new V3(-r.z*s,0,r.x*s),2.4*eSpd(),9,0xffc040,{life:4,r:.45}); }
      if(pd<e.r+.6&&!player.dead&&!r.hit){ r.hit=true; contactHurt(e,16); }
      if(r.done>=r.len){ e.st='pause'; e.stT=1.2; e.vel.set(0,0,0); e.jz.pop.v=-4; dropToken(e); } }
    else { e.vel.multiplyScalar(Math.pow(.02,dt)); // paused: turning, open to fire
      if(e.stT<=0&&!player.dead&&!e.hold){ if(takeToken(e)){ const ld=leadDir(e.pos.x,e.pos.z,e.speed,new V3()), len=Math.max(3,lineLen(e.pos.x,e.pos.z,ld.x,ld.z,30,e.r*.6)-.5);
          e.roll={x:ld.x,z:ld.z,len,done:0}; e.st='tele'; e.stT=.85; e.yaw=Math.atan2(ld.x,ld.z); teleStrip(e.pos,ld.x,ld.z,len,e.r*2,0xffd36a,.85); } else e.stT=.3; } } },
  /* flanker: commits to one orbit direction for 2-3 s and works around to your side and back (more often in later arenas),
     fires a burst when it gets there, then ducks behind the nearest block. It never mirrors your strafing. */
  crawler(e,dt,to,d,pd,m){ const L=AIL(), T=tgt(), [n,f]=e.def.band, R=(n+f)/2, a=angOf(e.pos.x,e.pos.z,T), back=Math.atan2(-player.aim.x,-player.aim.z);
    e.orbT=(e.orbT||0)-dt;
    if(e.orbT<=0){ e.orbT=rand(2,3); const toward=Math.sign(((back-a+Math.PI*3)%(Math.PI*2))-Math.PI)||1; e.orb=Math.random()<L.aggr?toward:(Math.random()<.5?-1:1); }
    // stuck against a block or another enemy: turn the other way round
    if(e.ph==='pos'&&e.vel.lengthSq()<.5&&d>n){ e.stuckT=(e.stuckT||0)+dt; if(e.stuckT>.5){ e.stuckT=0; e.orb=-e.orb; e.orbT=rand(1.5,2.5); } } else e.stuckT=0;
    let want;
    if(e.ph==='cover'){ want=seek(e,e.goal.x,e.goal.z,e.speed,_sv); steer(e,want,dt,5); e.phT-=dt; e.cd-=dt; if(e.phT<=0) e.ph='pos'; }
    else { if(d>f+3) want=chase(e,e.speed,_sv); else { const na=a+e.orb*.75; want=seek(e,clamp(T.x+Math.sin(na)*R,-AX+1.2,AX-1.2),clamp(T.z+Math.cos(na)*R,-AZ+1.2,AZ-1.2),e.speed,_sv); }
      const flanked=L.aggr<.5||angDiff(a,back)<1.9||(e.waitT||0)>2.5; if(canFire(e)&&!flanked) e.waitT=(e.waitT||0)+dt;
      attackCycle(e,dt,want,()=>canFire(e)&&d<f+3&&flanked?(e.waitT=0,ATK.burst):null,5); }
    e.mineT=(e.mineT==null?rand(2.5,4):e.mineT)-dt;
    if(e.mineT<=0&&e.ph!=='tele'){ e.mineT=rand(4.5,6); for(const s of [-1,1]) dropEMine(e.pos.x-to.x*1.3+to.z*s*.9,e.pos.z-to.z*1.3-to.x*s*.9); }
    if(e.vel.lengthSq()>.3) e.yaw=lerpAngle(e.yaw,Math.atan2(e.vel.x,e.vel.z),Math.min(1,dt*6)); e.aimYaw=Math.atan2(to.x,to.z); },
  // artillery: never moves, lobs a shell onto a red ring; standing still makes it fire much faster
  howitzer(e,dt,to,d,pd,m){
    e.vel.set(0,0,0); e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*1.5));
    // the bestiary target ring leaves the model and becomes the ground telegraph
    if(!e.ring){ e.ring=m.target; m.g.remove(e.ring); roomGroup.add(e.ring); }
    if(e.shell){ const s=e.shell; s.t-=dt; e.ring.scale.setScalar(1.75+Math.sin(s.t*24)*.08); e.ring.material.opacity=.5+(1-s.t/1.2)*.5;
      if(s.t<=0){ e.ring.visible=false; e.shell=null; dropToken(e); crossBlast(new V3(s.x,0,s.z),0xff5a2a,.9); if(player&&!player.dead&&Math.hypot(player.pos.x-s.x,player.pos.z-s.z)<2.3) hurt(18); } }
    else { e.cd-=dt*cdRate(e)*(AIR.still>.9?1.9:1);
      if(e.cd<=0&&!player.dead&&!e.hold&&takeToken(e)){ e.cd=rand(2.6,3.4); const T=leadPoint(e.pos.x,e.pos.z,Math.max(1,d/1.2),AIL().lead*.5,_lp,2.5); e.shell={x:T.x,z:T.z,t:1.2}; e.ring.position.set(T.x,.06,T.z); e.ring.scale.setScalar(1.75); e.ring.visible=true; e.jz.rec.v+=6; sfx('heavy');
        m.mouth.getWorldPosition(_tmp2); lobShell(_tmp2.clone(),new V3(T.x,0,T.z),1.2,0x3a3346); } } },
  censer(e,dt,to,d,pd,m){ const [n,f]=e.def.band; attackCycle(e,dt,holdBand(e,dt,to,d,n,f,{noLos:true}),()=>ATK.orbs,1.5); faceAim(e,dt,to,3); },
  /* sniper: looks for an open lane at long range, then a red laser tracks you (leading you in later arenas), locks and fires.
     A block in the way cuts the laser; if it stays cut the shot is called off. */
  lancer(e,dt,to,d,pd,m){ const [n,f]=e.def.band; e.stT-=dt*(e.st==='move'?cdRate(e):1);
    if(e.st!=='aim'&&e.st!=='lock'){ steer(e,holdBand(e,dt,to,d,n,f,{lane:true}),dt,3); faceAim(e,dt,to,6);
      if(e.stT<=0&&canFire(e)&&takeToken(e)){ e.st='aim'; e.stT=1.4; e.blocked=0; } return; }
    steer(e,_sv.set(0,0,0),dt,6);
    if(e.st==='aim'){ const ld=leadDir(e.pos.x,e.pos.z,34*eSpd(),_ld); e.yaw=lerpAngle(e.yaw,Math.atan2(ld.x,ld.z),Math.min(1,dt*7)); if(e.stT<=.35){ e.st='lock'; sfx('click'); } }
    const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw), len=lineLen(e.pos.x,e.pos.z,fx,fz,26);
    e.blocked=len<d-1.2?(e.blocked||0)+dt:0;
    const Ll=len/1.05; m.laser.visible=true; m.laser.scale.set(e.st==='lock'?2.2:1,Ll/7,e.st==='lock'?2.2:1); m.laser.position.y=-.8-Ll/2; m.laser.material.opacity=e.st==='lock'?(Math.sin(e.t*50)>0?1:.4):.55;
    if(e.blocked>.45){ e.st='move'; e.stT=rand(1,1.6); m.laser.visible=false; dropToken(e); }
    else if(e.stT<=0){ m.muzzle.getWorldPosition(_tmp2); shoot('e',_tmp2.clone().setY(1.6),new V3(fx,0,fz),34*eSpd(),22,0xff3a3a,{life:1.2,r:.42,scale:.9}); e.jz.rec.v+=7; sparks(_tmp2,0xff3a3a,5,6); sfx('heavy'); e.st='move'; e.stT=rand(2,3); m.laser.visible=false; dropToken(e); } },
  /* support: stays behind the enemy closest to you (its tank), heals and shields everyone inside the green aura */
  cherub(e,dt,to,d,pd,m){ const T=tgt(); let front=null,fd=1e9;
    for(const o of enemies){ if(o===e||o.dead||o===boss||o.def&&o.def.role==='support') continue; const od=Math.hypot(o.pos.x-T.x,o.pos.z-T.z); if(od<fd){ fd=od; front=o; } }
    let gx,gz; if(front){ const ux=(front.pos.x-T.x)/(fd||1), uz=(front.pos.z-T.z)/(fd||1); gx=front.pos.x+ux*3.2; gz=front.pos.z+uz*3.2; } else { gx=e.pos.x-to.x*5; gz=e.pos.z-to.z*5; }
    const want=seek(e,clamp(gx,-AX+1.5,AX-1.5),clamp(gz,-AZ+1.5,AZ-1.5),e.speed,_sv); if(pd<6) want.addScaledVector(to,-e.speed*.8);
    steer(e,want,dt,2.5);
    const R=4.6; for(const o of enemies){ if(o===e||o.dead||o===boss) continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<R){ o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.06*dt); if(Math.random()<dt*2) sparks(o.pos.clone().setY(2),0x7dff9a,1,2); } }
    e.cd-=dt; if(e.cd<=0){ e.cd=4.5; let k=0; for(const o of enemies){ if(o===e||o.dead||o===boss) continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<R){ o.shieldT=3; k++; } } if(k){ groundRing(e.pos,0x7dff9a,R,.6); sfx('shield'); } }
    e.yaw=lerpAngle(e.yaw,Math.atan2(-to.x,-to.z),Math.min(1,dt*3)); },
  /* rusher: rolls in along the flow field and speeds up as it goes; the fuse (0.55 s) only starts when it is close and can see you */
  spark(e,dt,to,d,pd,m){
    if(e.st!=='blink'){ e.rush=Math.min(1,(e.rush||0)+dt/1.5); steer(e,chase(e,e.speed*(.5+.8*e.rush),_sv),dt,1.6+e.rush*2.4);
      if(pd<2.5&&!player.dead&&losClear(e.pos.x,e.pos.z,player.pos.x,player.pos.z)){ e.st='blink'; e.stT=e.def.fuse; m.warn.visible=true; sfx('click'); } }
    else { steer(e,_sv.copy(to).multiplyScalar(e.speed*.3),dt,3); e.stT-=dt; if(e.stT<=0){ sparkBoom(e); return; } }
    if(e.vel.lengthSq()>.1) e.yaw=Math.atan2(e.vel.x,e.vel.z); },
};
// ANIM[type](e,dt,m): idle and movement animation, from the bestiary's animate()
const teleK=e=>e.ph==='tele'&&e.phMax?1-e.phT/e.phMax:0;
const ANIM={
  spark(e,dt,m){ m.body.rotation.x+=e.vel.length()*dt*1.4; const bl=e.st==='blink', fk=bl?1-e.stT/e.def.fuse:0, k=Math.sin(e.t*(bl?16+fk*40:9))>0; m.core.material.color.setHex(k?0xffffff:0xffa040); if(bl) m.warn.scale.setScalar(1.55+fk*.2); },
  crawler(e,dt,m){ const mv=Math.min(1,e.vel.length()/3); m.legs.forEach(l=>{ l.rotation.z=Math.sin(e.t*12+l.userData.i*1.6)*.15*mv; }); m.body.position.y=1.15+Math.abs(Math.sin(e.t*12))*.05*mv; m.tur.rotation.y=lerpAngle(m.tur.rotation.y,(e.aimYaw||e.yaw)-e.yaw,Math.min(1,dt*10)); m.tur.scale.setScalar(e.ph==='tele'?1.12+Math.sin(e.t*40)*.04:1); },
  howitzer(e,dt,m){ spring(e.jz.rec,0,dt,14,.4); m.mort.rotation.x=.55-e.jz.rec.x*.06+(e.cd<.5&&!e.shell?Math.sin(e.t*30)*.03:0); },
  bulwark(e,dt,m){ m.hex.rotation.z+=dt*1.2; m.hex.scale.setScalar(Math.max(1,m.hex.scale.x-dt*3)); },
  shardling(e,dt,m){ m.body.rotation.y+=dt*(1+(e.ph==='tele'?6:0)); m.body.position.y=1.7+Math.sin(e.t*2)*.2; m.subs.forEach((s,i)=>s.rotation.y+=dt*2.4*(i%2?1:-1)); },
  cherub(e,dt,m){ m.body.position.y=2.2+Math.sin(e.t*3)*.25; m.halo.rotation.z+=dt*2; m.wings.forEach(p=>{ p.rotation.z=p.userData.s*(Math.sin(e.t*14+p.userData.k)*.4); }); m.aura.scale.setScalar(2*(.95+Math.sin(e.t*2)*.05)); },
  censer(e,dt,m){ m.swing.rotation.z=Math.sin(e.t*1.6)*.28; m.swing.rotation.x=Math.cos(e.t*1.3)*.12; m.orbs.forEach((o,i)=>{ const a=e.t*.8+i*2.1; o.position.set(Math.cos(a)*1.9,-1.4+Math.sin(e.t*1.5+i)*.4,Math.sin(a)*1.9); }); m.glow.scale.setScalar((1+Math.sin(e.t*4)*.12)*(e.ph==='tele'?1.5:1)); },
  ophan(e,dt,m){ if(e.st==='roll') m.body.rotation.x+=e.speed*dt/1.6; else { m.body.rotation.x*=Math.pow(.05,dt); m.rings[0].rotation.z+=dt*(e.st==='tele'?5:1.2); m.rings[1].rotation.x+=dt*(e.st==='tele'?4:1); } m.core.rotation.y+=dt*2; },
  // anticipation: readable wind-ups before attacks
  warden(e,dt,m){ const wu=teleK(e); m.body.position.y=2.6+Math.sin(e.t*2)*.3-wu*.35; m.rings[0].rotation.x+=dt*(1.5+wu*9); m.rings[1].rotation.y+=dt*(1.1+wu*7); m.body.scale.set(1+wu*.12,1-wu*.1,1+wu*.12); m.eye.scale.setScalar(wu>.3?1.3+Math.sin(e.t*40)*.3:1); },
  seraph(e,dt,m){ const wn=teleK(e), ch=e.ph==='charge'; m.body.position.y=2.1+Math.sin(e.t*2.5)*.3*(1-wn)+wn*.3; m.body.position.z=-wn*.9; m.body.position.x=wn?Math.sin(e.t*70)*.09*wn:0; m.body.rotation.x=ch?.5:-wn*.35; m.halo.rotation.z+=dt*(2+wn*14); m.wings.forEach((w,i)=>w.rotation.x=ch?-.6:Math.sin(e.t*6+i)*.25-wn*.5); if(e.ph!=='tele') m.core.scale.setScalar(1); },
};

/* ================= ENEMY UPDATE ================= */
function updateEnemies(dt){
  navUpdate(dt); senseUpdate(dt);
  const T=tgt();
  for(const e of enemies.slice()){
    if(e.dead) continue;
    if(e===boss){ updateBoss(dt); continue; }
    e.t+=dt;
    // drop in with the light pillar, land with a squash and stand up
    if(e.dropY>0){ e.dropV-=40*dt; e.dropY=Math.max(0,e.dropY+e.dropV*dt); if(e.dropY===0){ e.jz.pop.v=-7; e.standT=.35; groundRing(e.pos,0xffffff,1.6,.3); sparks(e.pos.clone().setY(.3),0xc8c0d0,4,4); if(e.sc>1) shake=Math.max(shake,.12); } }
    else e.born=Math.min(1,e.born+dt*3);
    // summoned minions hold their fire while their boss runs a heavy attack, then resume at staggered times
    e.hold=!!(e.minion&&bossHeavy()); if(e.hold&&e.ph==='pos') e.cd=Math.max(e.cd,rand(.35,.8));
    e.standT=Math.max(0,e.standT-dt);
    if(e.kx||e.kz){ e.pos.x+=e.kx*dt; e.pos.z+=e.kz*dt; const f=Math.exp(-9*dt); e.kx*=f; e.kz*=f; if(Math.abs(e.kx)+Math.abs(e.kz)<.02) e.kx=e.kz=0; }
    if(e.flash>0){e.flash-=dt;if(e.flash<=0)unflash(e);}
    const to=_tmp.subVectors(T,e.pos).setY(0); const d=to.length()||1; to.divideScalar(d);
    const pd=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
    const m=e.model;
    sense(e,dt); e.pathT-=dt;
    if(e.wake>0){ e.wake-=dt; e.vel.multiplyScalar(.8); }
    else if(e.stun>0){ if(!e.stunned){ e.stunned=true; interrupt(e); } e.stun-=dt; e.vel.multiplyScalar(e.frozen>0?0:.85); if(e.frozen>0){ e.frozen-=dt; if(e.frozen<=0) unflash(e); } if(Math.random()<dt*6) sparks(e.pos.clone().setY(2.6),0x5fe0ff,1,2); }
    else { e.stunned=false; if(AI[e.type]){ AI[e.type](e,dt,to,d,pd,m); if(e.dead) continue; } }
    if(ANIM[e.type]) ANIM[e.type](e,dt,m);
    if(e.shieldT>0){ e.shieldT-=dt; if(!e.shM){ e.shM=new THREE.Mesh(new THREE.TorusGeometry(e.r*.9,.06,6,28),basic(0xffd36a,true,.8)); e.shM.rotation.x=Math.PI/2; e.shM.position.y=1.4; e.shM.userData.nofit=1; m.g.add(e.shM); } e.shM.visible=true; e.shM.rotation.z+=dt*3; } else if(e.shM) e.shM.visible=false;
    for(const o of enemies){ if(o===e||o.dead)continue; const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z,dd=Math.hypot(dx,dz),mn=(e.r+o.r)*.8; if(dd<mn&&dd>.001){ const k=o===boss?1:.5; e.pos.x+=dx/dd*(mn-dd)*k; e.pos.z+=dz/dd*(mn-dd)*k; } }
    e.pos.addScaledVector(e.vel,dt*(e.slow>0?.55:1)*(sortie.rule.moveSpd||1));
    if(!e.fly) pushOut(e.pos,e.r*.55);
    e.pos.x=clamp(e.pos.x,-AX+1,AX-1); e.pos.z=clamp(e.pos.z,-AZ+1,AZ-1);
    m.g.position.set(e.pos.x,e.dropY,e.pos.z); m.g.rotation.y=e.yaw; m.shadow.position.set(e.pos.x,.03,e.pos.z); m.shadow.scale.setScalar(e.sc/e.def.sc/(1+e.dropY*.15));
    if(m.legs&&m.hips){ stepMech(m,e,e.vel.length(),dt,e.sc); mechLean(m,e.jz,dt,e.vel.x,e.vel.z,e.yaw,e.yaw);
      // wind-ups: heavies crouch (deep before a slam, arms up), drones raise the rifle; both stand up after landing
      const wu=teleK(e); if(e.type==='heavy'){ const sl=e.atk===ATK.slam&&(e.ph==='tele'||e.ph==='rec'); m.hips.position.y-=wu*(sl?.5:.35); m.torso.rotation.x-=wu*.3; if(sl&&e.ph==='tele'){ m.arms[0].rotation.x=-2.4*wu; m.arms[1].rotation.x=-1.45-1.1*wu; } } else m.arms[1].rotation.x-=wu*.25;
      if(e.standT>0) m.hips.position.y-=e.standT/.35*.55;
      spring(e.jz.rec,0,dt,20,.4); m.torso.rotation.x-=e.jz.rec.x*.25; m.arms[1].rotation.x-=e.jz.rec.x*.4; }
    applyJuice(m.g,e.jz,dt,e.sc);
  }
}
