// Seraph Breaker · enemy-ai.js: Enemy behaviour by role (AI + ANIM tables): sensing, steering on the nav grid (nav.js), readable attack cycles and enemy mines.
/* ================= HELPERS ================= */
const _sv=new V3(),_sv2=new V3(),_lp=new V3(),_ld=new V3();
// how far a straight line runs before a block or the mat edge
function lineLen(x,z,dx,dz,max,pad=0){ let t=0; while(t<max){ t+=.4; const px=x+dx*t,pz=z+dz*t; if(Math.abs(px)>AX-1||Math.abs(pz)>AZ-1||inBlock(px,pz,pad,'block')) return Math.max(0,t-.4); } return max; }
// ground telegraph strip (fades out on its own)
// solid: normal blending, so a red strip stays red on the light floors (additive red turns pink there)
function teleStrip(pos,dx,dz,len,w,color,life,solid){ const g=new THREE.Group(), mat=warnFill(solid?new THREE.MeshBasicMaterial({color,transparent:true,opacity:.3,depthWrite:false}):addMat(color,.3)), pl=new THREE.Mesh(new THREE.PlaneGeometry(w,len),mat); pl.rotation.x=-Math.PI/2; pl.position.z=len/2; g.add(pl); g.position.set(pos.x,.05,pos.z); g.rotation.y=Math.atan2(dx,dz); addFx(g,life,(f,dt,k)=>{ mat.opacity=.18+.22*Math.abs(Math.sin((1-k)*life*9)); }); return g; }
// lobbed shell (howitzer, mine layers): visual arc with a ground shadow, then onLand. marker: a red landing ring (the Howitzer has its own).
function lobShell(from,to,dur,color,onLand,marker){ const g=new THREE.Group(), m=new THREE.Mesh(G.orb,basic(color,false)); m.scale.setScalar(1.2); const sh=blob(.4); sh.position.y=.04; g.add(m,sh);
  let mk=null; if(marker){ mk=new THREE.Mesh(G.ring,addMat(0xff3a2a,.8)); mk.rotation.x=-Math.PI/2; mk.position.set(to.x,.07,to.z); mk.scale.setScalar(1.3); g.add(mk); }
  let done=false; addFx(g,dur,(f,dt,k)=>{ const u=1-k, y=from.y*(1-u)+7*4*u*(1-u)+.3; m.position.set(from.x+(to.x-from.x)*u,y,from.z+(to.z-from.z)*u);
    sh.position.x=m.position.x; sh.position.z=m.position.z; sh.scale.setScalar(1.1-clamp(y/10,0,.6)); if(mk) mk.material.opacity=.35+.45*Math.abs(Math.sin(u*u*18));
    if(k<=.02&&!done){ done=true; sh.visible=false; if(mk) mk.visible=false; onLand&&onLand(); } }); }
// contact damage, with Thorn Plating paying it back
// Thorn Plating hits back 3x, at most 30% of the rammer's max armor (patch.md 34: a diving Herald died on its first touch)
// three Cellmites merge into a Cell Brute at their middle (the merging ones leave no loot)
function cellMerge(e){ const g=[e]; for(const o of enemies) if(g.length<3&&o!==e&&!o.dead&&o.kind==='cellmite'&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<2.4) g.push(o);
  if(g.length<3) return; let x=0,z=0; g.forEach(o=>{ x+=o.pos.x/3; z+=o.pos.z/3; o.noLoot=true; o.mergeT=0; killEnemy(o,true); });
  groundRing(new V3(x,0,z),HX.glow,2.4,.6); sfx('heavy'); spawnEnemy('cellbrute',freeNear(x,z,1.2),false,{noDrop:true}); }
function contactHurt(e,d){ d*=e.def.dmgK||1; const before=player.hp; hurt(d); if(player.thorn&&player.hp<before&&!e.dead) hitEnemy(e,Math.min(d*3*player.st.dmg,e.maxHp*BAL.thornCap),e.pos.clone().setY(2),false,true); }
// Spark explosion: hurts you only when it detonates on its own; it always hurts other enemies (chain reactions are queued and capped)
function sparkBoom(e){ if(e.boomed) return; e.boomed=true;
  if(e.tier>1) for(let i=0;i<4;i++){ const a=Math.PI/4+i*Math.PI/2; shoot('e',e.pos.clone().setY(.8),new V3(Math.sin(a),0,Math.cos(a)),6*eSpd(),6,0xff5a2a,{life:1.2,r:.4}); } // T2+: 4 diagonal shards
  queueBlast(e.pos.x,e.pos.z,{t:.02,rad:2.6,dmg:10*arenaCurve(stage).hp,hurtP:16,color:0xffa040,size:.8,skip:e,flat:true}); killEnemy(e,true); }
/* enemy mines (Crawler, Siege Arachne) */
function dropEMine(x,z,arm=.8){ if(emines.length>=14||room&&room.cleared) return; x=clamp(x,-AX+.6,AX-.6); z=clamp(z,-AZ+.6,AZ-.6);
  const g=new THREE.Group(); part(new THREE.CylinderGeometry(.4,.45,.16,8),toon(0x2a2632),g,0,.08,0,.05); const l=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),basic(0xff3a2a,false)); l.position.y=.2; g.add(l);
  const ring=new THREE.Mesh(G.ring,addMat(0xff3a2a,.3)); ring.rotation.x=-Math.PI/2; ring.position.y=.04; ring.scale.setScalar(1.5); g.add(ring); g.position.set(x,0,z); roomGroup.add(g); emines.push({g,l,x,z,arm,life:12}); }
/* Coil's live fields: a red ring blinks where a stake will open one (flight + 1 s on the ground), then a field of r 2.2 stays live 4 s and
   hurts 6 every .5 s inside; it blinks faster before it goes out, and every field dies with its Coil. 6 at most. */
const FIELD={r:2.2,warn:1,live:4,dmg:6,tick:.5,max:6};
function openField(e,x,z,warn){ if(efields.length>=FIELD.max||e.dead) return; const g=new THREE.Group(); g.position.set(x,0,z);
  // normal blending: the warning stays red on the light floors
  const ring=new THREE.Mesh(G.ring,new THREE.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:.8,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.y=.06; ring.scale.setScalar(FIELD.r);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(FIELD.r,24),new THREE.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.22,depthWrite:false})); disc.rotation.x=-Math.PI/2; disc.position.y=.05; disc.visible=false; g.add(ring,disc); roomGroup.add(g);
  efields.push({e,x,z,g,ring,disc,t:warn,live:false,cd:0}); }
function updateEFields(dt,t){ for(let i=efields.length-1;i>=0;i--){ const f=efields[i]; f.t-=dt; f.cd-=dt;
    if(f.e.dead||f.live&&f.t<=0){ sparks(new V3(f.x,.4,f.z),0xff8a40,3,3); roomGroup.remove(f.g); efields.splice(i,1); continue; }
    if(!f.live){ f.ring.material.opacity=.35+.45*Math.abs(Math.sin(t*9)); if(f.t<=0){ f.live=true; f.t=FIELD.live; f.disc.visible=true; f.ring.material.color.setHex(0xff7a2a); sparks(new V3(f.x,.5,f.z),0xffa040,4,4); } continue; }
    f.disc.material.opacity=f.t<.6?(Math.floor(t*14)%2?.1:.32):.2+.06*Math.sin(t*6);
    if(player&&!player.dead&&f.cd<=0&&Math.hypot(player.pos.x-f.x,player.pos.z-f.z)<FIELD.r){ f.cd=FIELD.tick; hurt(FIELD.dmg); } } }
function updateEMines(dt,t){ for(let i=emines.length-1;i>=0;i--){ const m=emines[i]; m.arm-=dt; m.life-=dt; m.l.visible=Math.floor(t*(m.arm>0?3:8))%2===0;
  const pd=player?Math.hypot(player.pos.x-m.x,player.pos.z-m.z):99; let boom=m.life<=0||(m.arm<=0&&!player.dead&&pd<1.4);
  if(boom){ if(m.life>0){ crossBlast(new V3(m.x,0,m.z),0xff5a2a,.6); if(pd<2.2) hurt(14); } roomGroup.remove(m.g); emines.splice(i,1); } } }

/* ================= SENSING + STEERING ================= */
// line of sight to the target, refreshed every ~0.14 s. seeT: how long it has been in view (an enemy fires only after AI_LV.react)
function sense(e,dt){ e.losT-=dt; if(e.losT<=0){ e.losT=rand(.1,.18); const T=tgt(); e.see=losClear(e.pos.x,e.pos.z,T.x,T.z); }
  if(e.see){ e.seeT+=dt; e.blindT=0; } else { e.seeT=0; e.blindT+=dt; if(e.blindT>.5&&e.replanT>.25) e.replanT=.25; } }
const canFire=e=>e.see&&e.seeT>=AIL().react*(e.elite?.7:1)&&!player.dead&&!e.hold;
// cooldowns run faster for elites, and (arena 3+) while your dash is recharging
const cdRate=e=>(e.elite?1.25:1)*(e.cdK||1)*(AIL().read&&!AIR.ready?1+AIL().read:1);
// aim direction from (fx,fz) for a shot of speed spd, led by the arena's lead
function leadDir(fx,fz,spd,out,k=Math.min(1,AIL().lead+(spotLit?.25:0))){ leadPoint(fx,fz,spd,k,_lp); out.set(_lp.x-fx,0,_lp.z-fz); const l=out.length(); if(l<.01){ const T=tgt(); out.set(T.x-fx,0,T.z-fz); } return out.normalize(); }
const turnTo=(a,b,max)=>{ const d=((b-a+Math.PI*3)%(Math.PI*2))-Math.PI; return a+clamp(d,-max,max); };
/* movement with inertia (MOVE in data.js). Close neighbours push the wanted velocity apart so a pack spreads out. Walkers turn their body toward
   where they go before they get going (and walk backward when they back off while aiming at you); acceleration is limited by mass and braking
   is faster. Flyers drift on an underdamped spring: they overshoot a little and settle. k scales the response (3 = normal). */
function steer(e,want,dt,k=3){
  let sx=0,sz=0; for(const o of enemies){ if(o===e||o.dead) continue; const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z,R=(e.r+o.r)*1.1,dd=dx*dx+dz*dz; if(dd<R*R&&dd>1e-4){ const d=Math.sqrt(dd),f=(R-d)/R; sx+=dx/d*f; sz+=dz/d*f; } }
  _sv2.set(want.x+sx*e.speed*1.3,0,want.z+sz*e.speed*1.3);
  const ms=e.def.mass||1, kk=clamp(k/3,.5,2.5);
  if(e.fly){ const f=MOVE.fly.f*Math.sqrt(kk/ms), z=MOVE.fly.z, a=e.av||(e.av=new V3()); a.x+=(f*f*(_sv2.x-e.vel.x)-2*z*f*a.x)*dt; a.z+=(f*f*(_sv2.z-e.vel.z)-2*z*f*a.z)*dt; e.vel.x+=a.x*dt; e.vel.z+=a.z*dt; return; }
  if(e.turnFirst){ const sp=Math.hypot(_sv2.x,_sv2.z); if(sp>.4){ let wa=Math.atan2(_sv2.x,_sv2.z); if(angDiff(wa,e.yaw)>2.1) wa+=Math.PI;
    e.byaw=turnTo(e.byaw,wa,MOVE.turn/ms*dt); _sv2.multiplyScalar(clamp((Math.cos(angDiff(e.byaw,wa))-.25)/.75,.08,1)); } }
  let dx=_sv2.x-e.vel.x, dz=_sv2.z-e.vel.z; const dl=Math.hypot(dx,dz), step=MOVE.accel/ms*kk*(dx*e.vel.x+dz*e.vel.z<0?MOVE.brake:1)*dt;
  if(dl>step){ dx*=step/dl; dz*=step/dl; } e.vel.x+=dx; e.vel.z+=dz;
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
/* readable attack cycle: 'pos' (moves; the cooldown ticks) → 'tele' (plants itself and winds up; beat attacks wind up until a beat) → fire → 'rec' (holds still) → 'pos', token released.
   pick() returns an attack from ATK when one is possible right now; without a free attack token the enemy keeps repositioning instead. */
function attackCycle(e,dt,want,pick,k=3){
  if(e.ph==='pos'){ steer(e,want,dt,k); if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    if(e.cd<=0){ const a=pick(); if(a&&takeToken(e)){ e.atk=a; e.ph='tele'; e.phT=e.phMax=a.beat?BEAT.until(a.tele,a.every||1):a.tele; if(a.start) a.start(e); } } return; }
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
// a Warden ring: n slow shots around it, turned by off (a fraction of one step)
function wardenRing(e,n,off){ for(let i=0;i<n;i++){ const a=(i+off)/n*Math.PI*2; shoot('e',e.pos.clone().setY(1.8),new V3(Math.sin(a),0,Math.cos(a)),6.5*eSpd(),10,0xffc040,{life:4,r:.45}); } }
// Coil stakes: one on your predicted path, two to the sides (4-6 units off, never within 3.5 of you); each opens a field (openField)
const _ck=new V3();
function coilSpot(e,T,i){ for(let k=0;k<12;k++){ let x,z; if(i===0){ x=T.x; z=T.z; } else { const a=Math.atan2(T.x-e.pos.x,T.z-e.pos.z)+(i===1?1:-1)*rand(.8,1.3), r=rand(4,6); x=player.pos.x+Math.sin(a)*r; z=player.pos.z+Math.cos(a)*r; }
    x=clamp(x,-AX+1.5,AX-1.5); z=clamp(z,-AZ+1.5,AZ-1.5); if(!inBlock(x,z,.5)&&Math.hypot(x-player.pos.x,z-player.pos.z)>=3.5) return _ck.set(x,0,z); if(i===0) i=1+(k&1); } return null; }
// Dominion: is a shot coming in at (dx,dz) from its center stopped by one of the three plates (70° each)? Not while they are down.
const _dq=new V3();
function dominionBlocks(e,dx,dz){ if(e.downT>0) return false; const f=Math.atan2(dx,dz);
  for(const p of e.model.pg){ if(p.userData.broken) continue; p.getWorldDirection(_dq); if(Math.abs(angDiff(f,Math.atan2(_dq.x,_dq.z)))<.61) return true; } return false; }
// Beacon: distance from (x,z) along (dx,dz) to the room edge (its arrow ignores blocks)
function edgeLen(x,z,dx,dz){ const tx=dx>1e-3?(AX-1-x)/dx:dx<-1e-3?(-AX+1-x)/dx:1e9, tz=dz>1e-3?(AZ-1-z)/dz:dz<-1e-3?(-AZ+1-z)/dz:1e9; return Math.max(1,Math.min(tx,tz)); }
// a free spot near (x,z) r away at angle a (falls back on other angles); not in a block, inside the room, at least minP from you
function spotNear(x,z,r,a,minP){ for(let k=0;k<14;k++){ const aa=a+(k?rand(-Math.PI,Math.PI):0), px=clamp(x+Math.sin(aa)*r,-AX+1.5,AX-1.5), pz=clamp(z+Math.cos(aa)*r,-AZ+1.5,AZ-1.5);
    if(!inBlock(px,pz,.6)&&(!player||Math.hypot(px-player.pos.x,pz-player.pos.z)>=minP)) return {x:px,z:pz}; } return null; }
/* tier endings (TIER in data.js, the mob doc): Seraph T2 charges a second time on a new .45 s lane, T3 also fans 5 slow feathers where each charge
   ends (a gold ring marks that spot with the lane); Ophan T2 rolls a second time on a new .5 s lane, T3 fires an 8-ring at every stop */
function seraphEnd(e,m,hit){ if(e.tier>=3) fanShot(e.pos.clone().setY(1.6),e.yaw,2,.3,3.2*eSpd(),8,0xffc040,{life:3,r:.42});
  if(e.tier>1&&!e.again&&!player.dead){ e.again=true; e.ph='tele'; e.phT=e.phMax=.45; e.locked=false; e.lock=null; e.vel.multiplyScalar(.2); return; }
  e.again=false; m.core.scale.setScalar(1); if(hit){ e.vel.multiplyScalar(-.3); e.ph='rec'; e.phT=1.1; } else { e.ph='rec'; e.phT=e.mini?.6:.9; } }
function ophanStop(e){ e.vel.set(0,0,0); e.jz.pop.v=-4;
  if(e.tier>=3) for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; shoot('e',e.pos.clone().setY(1.2),new V3(Math.sin(a),0,Math.cos(a)),2.8*eSpd(),9,0xffc040,{life:4,r:.45}); }
  if(e.tier>1&&!e.again&&!player.dead){ e.again=true; const ld=leadDir(e.pos.x,e.pos.z,e.speed,new V3()), len=Math.max(3,lineLen(e.pos.x,e.pos.z,ld.x,ld.z,30,e.r*.6)-.5);
    e.roll={x:ld.x,z:ld.z,len,done:0}; e.st='tele'; e.stT=.5; e.yaw=Math.atan2(ld.x,ld.z); teleStrip(e.pos,ld.x,ld.z,len,e.r*2,0xffd36a,.5);
    if(e.tier>=3) groundRing(new V3(e.pos.x+ld.x*len,0,e.pos.z+ld.z*len),0xffd36a,1.2,.6); return; }
  e.again=false; e.st='pause'; e.stT=e.tier>=3?1.5:1.2; dropToken(e); }
const ATK={
  // Sentry salvo: + or x by turns, one shot down each of 4 lines drawn on the floor (to a block or the edge) .8 s before
  salvo:{tele:.8,rec:.4,cd:[2.6,3.4],start(e){ e.salvoA=e.pat?Math.PI/4:0; for(let i=0;i<4;i++){ const a=e.salvoA+i*Math.PI/2, dx=Math.sin(a), dz=Math.cos(a); teleStrip(e.pos,dx,dz,Math.max(1,lineLen(e.pos.x,e.pos.z,dx,dz,17,.2)),.35,0xff3a2a,.8,true); } sfx('click'); },
    fire(e){ for(let i=0;i<4;i++){ const a=e.salvoA+i*Math.PI/2; shoot('e',e.pos.clone().setY(1),new V3(Math.sin(a),0,Math.cos(a)),7*eSpd(),8,0xff5a2a,{life:2.4,r:.45}); } e.pat=1-e.pat; e.jz.rec.v+=4; sfx('shot'); }},
  // Beacon: a gold lane to the room edge tracks you (.6 s), then locks white and wider (.45 s); the arrow (38 u/s, 20) passes through blocks
  beam:{tele:1.05,rec:.5,cd:[2.6,3.6],start(e){ const T=tgt(); e.aim=new V3(T.x-e.pos.x,0,T.z-e.pos.z).normalize();
      if(!e.lane){ const g=new THREE.Group(), mat=new THREE.MeshBasicMaterial({color:0xffd36a,transparent:true,opacity:.4,depthWrite:false}), pl=new THREE.Mesh(new THREE.PlaneGeometry(1,1),mat); pl.rotation.x=-Math.PI/2; g.add(pl); roomGroup.add(g); (e.props||(e.props=[])).push(g); e.lane={g,pl,mat}; }
      e.lane.g.visible=true; sfx('click'); },
    tick(e,dt){ const L=e.lane; if(!L) return; if(e.ph!=='tele'){ L.g.visible=false; return; } const lock=e.phT<=.45;
      if(!lock){ const T=tgt(); e.aim.set(T.x-e.pos.x,0,T.z-e.pos.z).normalize(); }
      const len=edgeLen(e.pos.x,e.pos.z,e.aim.x,e.aim.z), w=lock?.9:.5; L.g.position.set(e.pos.x,.05,e.pos.z); L.g.rotation.y=Math.atan2(e.aim.x,e.aim.z);
      L.pl.scale.set(w,len,1); L.pl.position.z=len/2; L.mat.color.setHex(lock?0xfff6e0:0xffd36a); L.mat.opacity=lock?(Math.floor(e.t*16)%2?.35:.7):.35; e.model.lens.scale.setScalar(lock?.7:1-.3*(1-(e.phT-.45)/.6)); },
    fire(e){ if(e.lane) e.lane.g.visible=false; const o=e.pos.clone().setY(1.6); shoot('e',o,e.aim.clone(),38*eSpd(),20,0xffe9a0,{life:1.2,r:.5,ghost:true}); sparks(o,0xffe9a0,4,4); e.model.lens.scale.setScalar(1); sfx('zap'); }},
  // Dominion's Judgement: the plates stop, a gold ring fills (1 s), a light pillar bursts to r 4.4 (14), then the plates sink for 1 s (no shield, +60%)
  judge:{tele:1,rec:1,cd:[3.8,4.8],start(e){ slamTele(e.pos,e.def.slam,1,.3,0xffd36a); e.judging=true; sfx('click'); },
    fire(e){ e.judging=false; crossBlast(e.pos.clone(),0xffe9a0,1.4); sparks(e.pos.clone().setY(1),0xffe9a0,10,8); shake=Math.max(shake,.2); e.downT=1; e.vulnT=1; sfx('heavy');
      if(player&&!player.dead&&Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z)<e.def.slam) hurt(14); },
    tick(e,dt){ if(e.downT>0) e.downT-=dt; }},
  stakes:{tele:.5,rec:.4,cd:[3.2,4.2],fire(e){ const T=leadPoint(e.pos.x,e.pos.z,6,AIL().lead,_lp,2.5), fly=.9; e.model.tube.getWorldPosition(_tmp2); const from=_tmp2.clone().setY(1.6);
    for(let i=0;i<3;i++){ const p=coilSpot(e,T,i); if(!p) continue; const x=p.x, z=p.z; openField(e,x,z,fly+FIELD.warn); lobShell(from,new V3(x,0,z),fly,0xc86a3a,()=>sparks(new V3(x,.3,z),0xffa040,3,3)); }
    e.jz.rec.v+=4; sfx('zap'); }},
  // Drone rifle: a led two-round burst after a short glint (three rounds at T2)
  rifle:{tele:.38,rec:.35,cd:[1.1,1.8],need:e=>e.see,fire(e){ e.burst=e.tier>1?3:2; e.bT=0; },
    tick(e,dt){ if(e.ph!=='rec'||!e.burst) return; e.bT-=dt; if(e.bT>0) return; e.bT=.14; e.burst--; const mz=_muz(e), s=10.5*eSpd(); shoot('e',mz,leadDir(mz.x,mz.z,s,new V3()),s,9,0xff5a2a,{life:3,r:.45}); sparks(mz,0xff8a40,3,3); e.jz.rec.v+=3; }},
  // Heavy spread shot: 5 shots (7 for elites and T2) fanned around the led aim
  fan:{tele:.5,rec:.45,cd:[1.6,2.2],need:e=>e.see,fire(e){ const mz=_muz(e), s=9*eSpd(), d=leadDir(mz.x,mz.z,s,_ld); fanShot(mz,Math.atan2(d.x,d.z),e.elite||e.tier>1?3:2,.2,s,12,0xff5a2a,{life:3.2,r:.5}); sparks(mz,0xff8a40,3,3); e.jz.rec.v+=6; }},
  /* Heavy slam: the red ring shows the reach and fills during the wind-up, then a small shockwave rolls out to it.
     Step outside the ring or dash through the wave. A little version of the Iron Colossus slam. */
  slam:{tele:.85,rec:.9,cd:[1.6,2.2],start(e){ slamTele(e.pos,e.def.slam,.85,.45); sfx('click'); },fire(e){ const s0=shake; shockwave(e.pos,12,e.def.slam,0xff5a2a); shake=Math.max(s0,.28); e.jz.pop.v=-6; sparks(e.pos.clone().setY(.4),0xc8c0d0,6,5); sfx('heavy'); }},
  // Bulwark: a short fan from behind the shield (9 tighter shots at T2)
  bfan:{tele:.45,rec:.5,cd:[2.4,3.2],need:e=>e.see,fire(e){ const mz=_muz(e); fanShot(mz,e.yaw,e.tier>1?4:2,e.tier>1?.12:.16,8.5*eSpd(),11,0xff5a2a,{life:1.6,r:.45}); e.jz.rec.v+=6; }},
  // Warden: a ring of slow shots around itself (area denial); T2 opens its petals again and sends a second ring half a step turned
  ring:{tele:.5,rec:.4,cd:[1.9,2.6],fire(e){ const n=e.elite?14:10; e.ringOff=rand(0,1); wardenRing(e,n,e.ringOff); e.ring2=e.tier>1?.32:0; },
    tick(e,dt){ if(e.ph!=='rec'||!(e.ring2>0)) return; e.ring2-=dt; if(e.ring2<=0){ e.jz.pop.v=-4; wardenRing(e,e.elite?14:10,e.ringOff+.5); } }},
  // Shardling: three shards around the led aim (five at T2)
  tri:{tele:.4,rec:.3,cd:[1.5,2.2],need:e=>e.see,fire(e){ const o=e.pos.clone().setY(1.6*e.sc+.3), s=10*eSpd(), d=leadDir(o.x,o.z,s,_ld); fanShot(o,Math.atan2(d.x,d.z),e.tier>1?2:1,e.tier>1?.18:.22,s,8,0x8fd0ff,{life:.95,r:.4}); }},
  // Crawler: two quick bursts of twin shots (three at T2), then it looks for cover
  burst:{tele:.3,rec:.5,cd:[1.3,2],need:e=>e.see,fire(e){ e.burst=e.tier>1?3:2; e.bT=0; },
    tick(e,dt){ if(e.ph!=='rec'||!e.burst) return; e.bT-=dt; if(e.bT>0) return; e.bT=.13; e.burst--; const s=10*eSpd(), d=leadDir(e.pos.x,e.pos.z,s,_ld), y=Math.atan2(d.x,d.z);
      for(const k of [-1,1]){ const o=new V3(e.pos.x+d.x*1.1+Math.cos(y)*k*.2,1.4,e.pos.z+d.z*1.1-Math.sin(y)*k*.2); shoot('e',o,d.clone(),s,8,0xff5a2a,{life:2.5,r:.4}); } sparks(e.pos.clone().setY(1.6).addScaledVector(d,1.1),0xff8a40,2,3); },
    after(e){ const c=coverSpot(e,5.5); if(c){ e.ph='cover'; e.goal=c; e.phT=rand(.9,1.5); } }},
  // a quick shot from the body (the hunted elite, whatever it is)
  snap:{tele:.3,rec:.25,cd:[1.3,2],need:e=>e.see,fire(e){ const o=e.pos.clone().setY(1.6), s=10*eSpd(); shoot('e',o,leadDir(o.x,o.z,s,new V3()),s,10,0xff5a2a,{life:2.5,r:.45}); }},
  // Censer: three slow homing light orbs that float over blocks (no line of sight needed); five, closer together, at T2
  orbs:{tele:.55,rec:.5,cd:[2.8,3.6],fire(e){ let live=0; for(const b of bullets) if(b.tag==='censer') live++; if(live>=12) return; const T=tgt(), b0=Math.atan2(T.x-e.pos.x,T.z-e.pos.z), w=e.tier>1?2:1;
    for(let i=-w;i<=w;i++){ const a=b0+i*(w>1?.35:.7); shoot('e',e.pos.clone().setY(2.2),new V3(Math.sin(a),0,Math.cos(a)),3.6*eSpd(),10,0xffe9a0,{life:6,r:.6,scale:1.35,home:6,turn:1.1,after:3.6,air:'float',tag:'censer'}); } sfx('zap'); }},
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
      if((pd<e.r+.5&&!player.dead)||(decoy&&d<e.r+.5)){ if(pd<e.r+.5) contactHurt(e,14); seraphEnd(e,m,true); }
      else if(e.phT<=0) seraphEnd(e,m,false); return; }
    if(e.ph==='tele'){ steer(e,_sv.set(0,0,0),dt,5); e.phT-=dt;
      if(e.phT>lockAt||!e.lock){ e.lock=leadDir(e.pos.x,e.pos.z,cs,e.lock||new V3(),AIL().lead); e.yaw=lerpAngle(e.yaw,Math.atan2(e.lock.x,e.lock.z),Math.min(1,dt*10)); }
      if(e.phT<=lockAt&&!e.locked){ e.locked=true; teleStrip(e.pos,e.lock.x,e.lock.z,cs*.55,e.r*1.4,0xffd36a,lockAt+.3); if(e.tier>=3) groundRing(new V3(e.pos.x+e.lock.x*cs*.55,0,e.pos.z+e.lock.z*cs*.55),0xffd36a,1,lockAt+.3); }
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
      if(r.done>=r.len) ophanStop(e); }
    else { e.vel.multiplyScalar(Math.pow(.02,dt)); // paused: turning, open to fire
      if(e.stT<=0&&!player.dead&&!e.hold){ if(takeToken(e)){ const ld=leadDir(e.pos.x,e.pos.z,e.speed,new V3()), len=Math.max(3,lineLen(e.pos.x,e.pos.z,ld.x,ld.z,30,e.r*.6)-.5);
          e.roll={x:ld.x,z:ld.z,len,done:0}; e.st='tele'; e.stT=.85; e.yaw=Math.atan2(ld.x,ld.z); teleStrip(e.pos,ld.x,ld.z,len,e.r*2,0xffd36a,.85); if(e.tier>=3) groundRing(new V3(e.pos.x+ld.x*len,0,e.pos.z+ld.z*len),0xffd36a,1.2,.9); } else e.stT=.3; } } },
  /* flanker: commits to one orbit direction for 2-3 s and works around to your side and back (more often in later arenas),
     fires a burst when it gets there, then ducks behind the nearest block. It never mirrors your strafing. */
  crawler(e,dt,to,d,pd,m){ const L=AIL(), T=tgt(), [n,f]=e.def.band, R=(n+f)/2, a=angOf(e.pos.x,e.pos.z,T), back=Math.atan2(-player.aim.x,-player.aim.z);
    e.orbT=(e.orbT||0)-dt;
    if(e.orbT<=0){ e.orbT=rand(2,3); const toward=Math.sign(((back-a+Math.PI*3)%(Math.PI*2))-Math.PI)||1; e.orb=Math.random()<L.aggr?toward:(Math.random()<.5?-1:1); }
    // stuck against a block or another enemy: turn the other way round
    if(e.ph==='pos'&&e.vel.lengthSq()<.5&&d>n){ e.stuckT=(e.stuckT||0)+dt; if(e.stuckT>.5){ e.stuckT=0; e.orb=-e.orb; e.orbT=rand(1.5,2.5); } } else e.stuckT=0;
    // skitter: quick bursts with sudden stops in between
    e.skT=(e.skT||0)-dt; if(e.skT<=0){ e.skGo=!e.skGo; e.skT=e.skGo?rand(.45,.8):rand(.12,.26); } const sk=e.skGo?1.3:.05;
    let want;
    if(e.ph==='cover'){ want=seek(e,e.goal.x,e.goal.z,e.speed,_sv).multiplyScalar(sk); steer(e,want,dt,5); e.phT-=dt; e.cd-=dt; if(e.phT<=0) e.ph='pos'; }
    else { if(d>f+3) want=chase(e,e.speed,_sv); else { const na=a+e.orb*.75; want=seek(e,clamp(T.x+Math.sin(na)*R,-AX+1.2,AX-1.2),clamp(T.z+Math.cos(na)*R,-AZ+1.2,AZ-1.2),e.speed,_sv); } want.multiplyScalar(sk);
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
        m.mouth.getWorldPosition(_tmp2); lobShell(_tmp2.clone(),new V3(T.x,0,T.z),1.2,0x3a3346);
        if(e.tier>1){ const px=-(T.z-e.pos.z), pz=T.x-e.pos.x, pl=Math.hypot(px,pz)||1; [-1,1].forEach((s,k)=>{ const x=clamp(T.x+px/pl*3.2*s,-AX+1,AX-1), z=clamp(T.z+pz/pl*3.2*s,-AZ+1,AZ-1);
          lobShell(_tmp2.clone(),new V3(x,0,z),1.5+.3*k,0x3a3346,()=>{ crossBlast(new V3(x,0,z),0xff5a2a,.9); if(player&&!player.dead&&Math.hypot(player.pos.x-x,player.pos.z-z)<2.3) hurt(18); },true); }); } } } },
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
    else if(e.stT<=0){ m.muzzle.getWorldPosition(_tmp2); shoot('e',_tmp2.clone().setY(1.6),new V3(fx,0,fz),34*eSpd(),22,0xff3a3a,{life:1.2,r:.42,scale:.9}); e.jz.rec.v+=7; sparks(_tmp2,0xff3a3a,5,6); sfx('heavy'); if(e.tier>1&&!e.again){ e.again=true; e.st='aim'; e.stT=.85; return; } e.again=false; e.st='move'; e.stT=rand(1.6,2.6); m.laser.visible=false; dropToken(e); } }, // T2: a second shot after a fresh .5 s track and .35 s lock
  /* charger (machine): walks its band, then lowers the plow (.9 s); the last .3 s lock a red lane to the wall (14 units at most) with a ring at its
     end, and it rams along it, ramping from 8 to 17. A block or wall at the end stuns it 1.4 s (+60% damage); a miss stops it 1 s. It cannot turn. */
  ram(e,dt,to,d,pd,m){ e.stT-=dt;
    if(e.st==='tele'){ e.vel.set(0,0,0); m.plow.rotation.x=-.3*(1-Math.min(1,(.9-e.stT)/.5));
      if(e.stT>.3){ const ld=leadDir(e.pos.x,e.pos.z,17,_ld); e.yaw=lerpAngle(e.yaw,Math.atan2(ld.x,ld.z),Math.min(1,dt*8)); }
      else if(!e.rush){ const dx=Math.sin(e.yaw), dz=Math.cos(e.yaw), wall=lineLen(e.pos.x,e.pos.z,dx,dz,14,e.r*.7), len=Math.max(2,Math.min(14,wall));
        e.rush={x:dx,z:dz,len,done:0,wall:wall<14,hit:false}; teleStrip(e.pos,dx,dz,len,1.9,0xff3a2a,.3+.15,true); groundRing(new V3(e.pos.x+dx*len,0,e.pos.z+dz*len),0xff3a2a,1.2,.6); sfx('click'); }
      if(e.stT<=0){ e.st='rush'; e.rt=0; e.jz.pop.v=4; } return; }
    if(e.st==='rush'){ const r=e.rush; e.rt+=dt; const v=8+9*Math.min(1,e.rt/.4); e.vel.set(r.x*v,0,r.z*v); r.done+=v*dt*(e.slow>0?.55:1);
      if(Math.random()<dt*20) sparks(e.pos.clone().setY(.5).addScaledVector(_tmp.set(r.x,0,r.z),-1),0xff7a2a,1,3);
      if(pd<e.r+.6&&!player.dead&&!r.hit){ r.hit=true; contactHurt(e,16); }
      if(r.done>=r.len){ e.vel.set(0,0,0); dropToken(e); if(r.wall){ e.st='stun'; e.stT=1.4; e.vulnT=1.4; shake=Math.max(shake,.22); sparks(e.pos.clone().setY(1).addScaledVector(_tmp.set(r.x,0,r.z),1.2),0xffd0a0,8,6); sfx('heavy'); } else { e.st='stop'; e.stT=1; } e.rush=null; } return; }
    if(e.st==='stun'||e.st==='stop'){ e.vel.multiplyScalar(Math.pow(.02,dt)); m.plow.rotation.x=-.3; if(e.stT<=0){ e.st='walk'; e.cd=rand(2,3); } return; }
    const [n,f]=e.def.band; steer(e,holdBand(e,dt,to,d,n,f),dt,2.2); faceAim(e,dt,to,4);
    if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    if(e.cd<=0&&e.see&&d<15&&takeToken(e)){ e.st='tele'; e.stT=.9; e.rush=null; e.vel.set(0,0,0); } },
  // denial (machine): backs off to its band (no line of sight needed) and drops stakes that open live fields (ATK.stakes)
  coil(e,dt,to,d,pd,m){ const [n,f]=e.def.band; attackCycle(e,dt,holdBand(e,dt,to,d,n,f,{noLos:true}),()=>d<16?ATK.stakes:null,2); faceAim(e,dt,to,3); },
  /* support (machine): hangs back behind the ally nearest you like the Cherub, then welds the most hurt ally: .5 s warning (its tip glows, an orange
     ring under the target), then a beam for 3 s (repairs 9%/s, the target takes 40% less), then 2.5 s rest. A block between them breaks the beam. */
  mender(e,dt,to,d,pd,m){ const T=tgt(); let front=null,fd=1e9;
    for(const o of enemies){ if(o===e||o.dead||o===boss||o.def&&o.def.role==='support') continue; const od=Math.hypot(o.pos.x-T.x,o.pos.z-T.z); if(od<fd){ fd=od; front=o; } }
    let gx,gz; if(front){ const ux=(front.pos.x-T.x)/(fd||1), uz=(front.pos.z-T.z)/(fd||1); gx=front.pos.x+ux*3; gz=front.pos.z+uz*3; } else { gx=e.pos.x-to.x*5; gz=e.pos.z-to.z*5; }
    const want=seek(e,clamp(gx,-AX+1.5,AX-1.5),clamp(gz,-AZ+1.5,AZ-1.5),e.speed,_sv); if(pd<6) want.addScaledVector(to,-e.speed*.8); steer(e,want,dt,2.5);
    e.yaw=lerpAngle(e.yaw,Math.atan2(-to.x,-to.z),Math.min(1,dt*3)); e.stT-=dt; const o=e.weld;
    const clear=o&&!o.dead&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<14&&lineLen(e.pos.x,e.pos.z,(o.pos.x-e.pos.x)/Math.max(.01,Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)),(o.pos.z-e.pos.z)/Math.max(.01,Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)),14,.1)>=Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)-.8;
    if(e.st==='aim'){ if(!clear){ e.st='rest'; e.stT=1; e.weld=null; return; } if(e.stT<=0){ e.st='beam'; e.stT=3; sfx('zap'); } return; }
    if(e.st==='beam'){ if(!clear||e.stT<=0){ if(o&&!o.dead) sparks(o.pos.clone().setY(1.6),0xffa040,4,4); e.st='rest'; e.stT=2.5; e.weld=null; return; }
      o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.09*dt); o.mendT=.15; if(Math.random()<dt*6) sparks(o.pos.clone().setY(1.8),0xffa040,1,2); return; }
    if(e.stT>0) return; let best=null,bh=1;
    for(const q of enemies){ if(q===e||q.dead||q===boss||q.def&&q.def.role==='support'||q.maxHp<=0) continue; const h=q.hp/q.maxHp; if(h<bh&&Math.hypot(q.pos.x-e.pos.x,q.pos.z-e.pos.z)<12){ bh=h; best=q; } }
    if(best&&bh<.98){ e.weld=best; e.st='aim'; e.stT=.5; groundRing(best.pos,0xffa040,1.4,.5); } else e.stT=.6; },
  // sniper (angel): holds a long band and fires the Beacon lane (ATK.beam); it needs to see you to start (blind for 3 s, it fires through the blocks anyway)
  beacon(e,dt,to,d,pd,m){ const [n,f]=e.def.band; attackCycle(e,dt,holdBand(e,dt,to,d,n,f),()=>(canFire(e)||e.cd<-3&&!player.dead)&&d<f*1.5?ATK.beam:null,2); if(e.ph==='pos'){ faceAim(e,dt,to,4); if(e.lane) e.lane.g.visible=false; } else if(e.aim) faceAim(e,dt,e.aim,8); },
  /* flanker (angel): circles you in its band, drifting to your side or back; there it stops and folds its wings (.6 s; the last .2 s lock a gold
     lane) and dives along it (20 u/s, up to 15 units, contact 12), flies on and comes back round. The attack token keeps two from diving at once. */
  herald(e,dt,to,d,pd,m){ e.stT=(e.stT||0)-dt;
    if(e.st==='tele'){ e.vel.multiplyScalar(Math.pow(.01,dt));
      if(e.stT>.2){ const ld=leadDir(e.pos.x,e.pos.z,20,_ld); e.yaw=lerpAngle(e.yaw,Math.atan2(ld.x,ld.z),Math.min(1,dt*10)); }
      else if(!e.dive){ const dx=Math.sin(e.yaw), dz=Math.cos(e.yaw), len=Math.max(4,Math.min(15,lineLen(e.pos.x,e.pos.z,dx,dz,15,.3))); e.dive={x:dx,z:dz,len,done:0,hit:false}; teleStrip(e.pos,dx,dz,len,1.3,0xffd36a,.2+.35,true); }
      if(e.stT<=0){ e.st='dive'; e.jz.pop.v=3; } return; }
    if(e.st==='dive'){ const r=e.dive; e.vel.set(r.x*20,0,r.z*20); r.done+=20*dt; if(pd<e.r+.5&&!player.dead&&!r.hit){ r.hit=true; contactHurt(e,12); }
      if(r.done>=r.len){ e.st='out'; e.stT=.9; dropToken(e); e.dive=null; } return; }
    if(e.st==='out'){ e.vel.multiplyScalar(Math.pow(.2,dt)); if(e.stT<=0){ e.st='orbit'; e.cd=rand(2.4,3.4); } return; }
    const T=tgt(), [n,f]=e.def.band, R=(n+f)/2, a=Math.atan2(e.pos.x-T.x,e.pos.z-T.z)+e.orb*dt*1.2, gx=T.x+Math.sin(a)*R, gz=T.z+Math.cos(a)*R;
    if(Math.abs(gx)>AX-2||Math.abs(gz)>AZ-2) e.orb=-e.orb; // a wall turns the orbit round
    steer(e,seek(e,clamp(gx,-AX+1.5,AX-1.5),clamp(gz,-AZ+1.5,AZ-1.5),e.speed,_sv),dt,3); faceAim(e,dt,to,6);
    if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    const side=Math.abs(angDiff(a,Math.atan2(player.aim.x,player.aim.z)))>1; // beside or behind you (or it has waited long enough)
    if(e.cd<=0&&(side||e.cd<-1.5)&&e.see&&d<11&&takeToken(e)){ e.st='tele'; e.stT=.6; e.dive=null; } },
  // tank (angel): walks in and holds at 4, plates turning; Judgement (ATK.judge) when you are close
  dominion(e,dt,to,d,pd,m){ const want=d>e.def.hold?chase(e,e.speed,_sv):_sv.set(0,0,0); attackCycle(e,dt,want,()=>d<e.def.slam+2.5?ATK.judge:null,2); faceAim(e,dt,to,3);
    if(e.ph==='pos'){ e.judging=false; if(e.downT>0) e.downT-=dt; } },
  // pattern turret (machine): never moves; fires ATK.salvo
  sentry(e,dt,to,d,pd,m){ e.vel.set(0,0,0); attackCycle(e,dt,_sv.set(0,0,0),()=>d<18&&!player.dead?ATK.salvo:null,1); },
  /* burrower (machine): under the floor it takes no hits and is no target (dust trail only); it surfaces at least 4.5 from you on a red ring (.9 s),
     stays up 2.2 s and lobs three shells (yours and both sides, each on its own red ring), then digs back in (.6 s) */
  borer(e,dt,to,d,pd,m){ e.stT-=dt;
    if(e.st==='under'){ e.under=true; m.g.visible=false; const T=tgt(); if(!e.goal2||e.stT>1.4) e.goal2=spotNear(T.x,T.z,rand(6,8),Math.atan2(e.pos.x-T.x,e.pos.z-T.z),5)||{x:e.pos.x,z:e.pos.z};
      steer(e,seek(e,e.goal2.x,e.goal2.z,6,_sv),dt,4); if(Math.random()<dt*14) sparks(e.pos.clone().setY(.15),0x8a7a68,1,2);
      if(e.stT<=0&&!player.dead){ const s=spotNear(T.x,T.z,rand(4.5,6.5),Math.atan2(e.pos.x-T.x,e.pos.z-T.z),4.5); if(s){ e.pos.set(s.x,0,s.z); e.vel.set(0,0,0); e.st='rise'; e.stT=.9; groundRing(e.pos,0xff3a2a,1.6,.9); sparks(e.pos.clone().setY(.2),0x8a7a68,6,4); } else e.stT=.5; } return; }
    if(e.st==='rise'){ e.vel.set(0,0,0); if(Math.random()<dt*20) sparks(e.pos.clone().setY(.2),0x8a7a68,1,3); if(e.stT<=0){ e.st='up'; e.stT=2.2; e.under=false; m.g.visible=true; e.jz.pop.v=6; e.shots=3; e.shotT=.3; sfx('heavy'); } return; }
    if(e.st==='up'){ e.vel.set(0,0,0); faceAim(e,dt,to,6); e.shotT-=dt;
      if(e.shots>0&&e.shotT<=0&&!player.dead){ e.shotT=.35; const k=3-e.shots, T=leadPoint(e.pos.x,e.pos.z,6,AIL().lead,_lp,2.5), a=Math.atan2(T.x-e.pos.x,T.z-e.pos.z)+Math.PI/2, off=(k-1)*2;
        const x=clamp(T.x+Math.sin(a)*off,-AX+1,AX-1), z=clamp(T.z+Math.cos(a)*off,-AZ+1,AZ-1); m.tube.getWorldPosition(_tmp2);
        lobShell(_tmp2.clone(),new V3(x,0,z),.9,0x6a5848,()=>{ crossBlast(new V3(x,0,z),0xff5a2a,.6); if(player&&!player.dead&&Math.hypot(player.pos.x-x,player.pos.z-z)<1.2) hurt(12); },true); e.shots--; }
      if(e.stT<=0){ e.st='dig'; e.stT=.6; } return; }
    if(e.st==='dig'){ e.vel.set(0,0,0); if(Math.random()<dt*20) sparks(e.pos.clone().setY(.2),0x8a7a68,1,3); if(e.stT<=0){ e.st='under'; e.stT=rand(3,4); e.goal2=null; } return; } },
  /* erratic hopper (machine): crouches (.35 s; .5 s and its foot glows before every third), hops 4-5 units in a random direction (never within 3 of
     you), its landing ring (r 1.6, the real shock radius) shown the whole time in the air; every third landing also fires 4 diagonal shots */
  hopper(e,dt,to,d,pd,m){ e.stT-=dt; e.vel.set(0,0,0);
    if(e.st==='wait'){ if(e.stT<=0&&!player.dead){ e.st='crouch'; e.stT=(e.hops%3===2)?.5:.35; } return; }
    if(e.st==='crouch'){ if(e.stT<=0){ const s=spotNear(e.pos.x,e.pos.z,rand(4,5),rand(-Math.PI,Math.PI),3); if(!s){ e.st='wait'; e.stT=.4; return; }
        e.hop={from:e.pos.clone(),to:new V3(s.x,0,s.z),t:0}; e.st='air'; groundRing(e.hop.to,0xff3a2a,1.6,.5); sfx('dash'); } return; }
    if(e.st==='air'){ const H=e.hop; H.t+=dt; const k=Math.min(1,H.t/.5); e.pos.lerpVectors(H.from,H.to,k); e.dropY=Math.sin(Math.PI*k)*2.2; e.dropV=0;
      if(k>=1){ e.dropY=0; e.hops++; e.st='wait'; e.stT=rand(.45,.8); e.jz.pop.v=-6; sparks(e.pos.clone().setY(.3),0xc8c0d0,4,4);
        if(player&&!player.dead&&pd<1.6+.4) hurt(8);
        if(e.hops%3===0) for(let i=0;i<4;i++){ const a=Math.PI/4+i*Math.PI/2; shoot('e',e.pos.clone().setY(.8),new V3(Math.sin(a),0,Math.cos(a)),6*eSpd(),7,0xff5a2a,{life:2.2,r:.42}); } } return; } },
  /* blinker (angel): walks its band; then fades out (.5 s) while a gold ring marks where it lands (4.5-6.5 from you, your back preferred, never at
     your feet), appears, and .3 s later lunges 6 units at you along a gold lane (16 u/s, contact 14); .9 s to recover */
  emissary(e,dt,to,d,pd,m){ e.stT=(e.stT||0)-dt;
    if(e.st==='vanish'){ e.vel.set(0,0,0); m.g.visible=Math.floor(e.t*24)%2===0; if(e.stT<=0){ sparks(e.pos.clone().setY(1.5),0xffd36a,8,5); e.pos.set(e.to.x,0,e.to.z); e.goal=null; e.path=null; m.g.visible=true; e.st='set'; e.stT=.3; } return; }
    if(e.st==='set'){ e.vel.set(0,0,0); faceAim(e,dt,to,12); if(e.stT<=0){ const dx=Math.sin(e.yaw), dz=Math.cos(e.yaw), len=Math.max(2,Math.min(6,lineLen(e.pos.x,e.pos.z,dx,dz,6,.3)));
        e.lunge={x:dx,z:dz,len,done:0,hit:false}; teleStrip(e.pos,dx,dz,len,1.3,0xffd36a,.5,true); e.st='aim'; e.stT=.5; } return; }
    if(e.st==='aim'){ e.vel.set(0,0,0); if(e.stT<=0){ e.st='lunge'; e.jz.pop.v=3; } return; }
    if(e.st==='lunge'){ const r=e.lunge; e.vel.set(r.x*16,0,r.z*16); r.done+=16*dt; if(pd<e.r+.5&&!player.dead&&!r.hit){ r.hit=true; contactHurt(e,14); } if(r.done>=r.len){ e.vel.set(0,0,0); e.st='recover'; e.stT=.9; dropToken(e); } return; }
    if(e.st==='recover'){ e.vel.multiplyScalar(Math.pow(.05,dt)); if(e.stT<=0){ e.st='walk'; e.cd=rand(3,4); } return; }
    const [n,f]=e.def.band; steer(e,holdBand(e,dt,to,d,n,f),dt,3); faceAim(e,dt,to,5);
    if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    if(e.cd<=0&&takeToken(e)){ const T=tgt(), back=Math.atan2(-player.aim.x,-player.aim.z), s=spotNear(T.x,T.z,rand(4.5,6.5),back,4.5); if(!s){ dropToken(e); e.cd=.5; return; }
      e.to=s; e.st='vanish'; e.stT=.5; groundRing(new V3(s.x,0,s.z),0xffd36a,1.4,.8); sfx('zap'); } },
  /* boomerang (angel): throws its chakram along a gold lane (11 units or to a block, .6 s warning), it hangs .3 s then flies back to the Aureole
     wherever it is (12 each way, once per pass); a thin gold line ties the chakram to the Aureole; killing the Aureole ends the chakram */
  aureole(e,dt,to,d,pd,m){ const [n,f]=e.def.band; steer(e,holdBand(e,dt,to,d,n,f),dt,2.5); faceAim(e,dt,to,4); const C=e.chak;
    if(C){ C.t+=dt; const p=C.m.position;
      if(C.ph==='tele'){ if(C.t>=.6){ C.ph='out'; C.t=0; m.ringA.visible=false; C.m.visible=true; p.set(e.pos.x,1.6,e.pos.z); sfx('slash'); } }
      else if(C.ph==='out'){ p.x+=C.x*9*dt; p.z+=C.z*9*dt; C.done+=9*dt; if(C.done>=C.len){ C.ph='hang'; C.t=0; } }
      else if(C.ph==='hang'){ if(C.t>=.3){ C.ph='back'; C.hit=false; } }
      else { const dx=e.pos.x-p.x, dz=e.pos.z-p.z, l=Math.hypot(dx,dz)||1; p.x+=dx/l*9*dt; p.z+=dz/l*9*dt; if(l<.8){ C.m.visible=false; C.tie.visible=false; m.ringA.visible=true; e.chak=null; dropToken(e); e.cd=rand(3.2,4.4); } }
      if(e.chak&&C.ph!=='tele'){ C.m.rotation.y+=dt*18; if(player&&!player.dead&&!C.hit&&Math.hypot(player.pos.x-p.x,player.pos.z-p.z)<1.1){ C.hit=true; hurt(12); }
        const tx=e.pos.x-p.x, tz=e.pos.z-p.z, L=Math.hypot(tx,tz)||.01; C.tie.visible=true; C.tie.position.set(p.x+tx/2,.06,p.z+tz/2); C.tie.rotation.y=Math.atan2(tx,tz); C.tie.scale.set(1,1,L); C.tie.material.opacity=Math.floor(e.t*10)%2?.25:.55; }
      return; }
    if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    if(e.cd<=0&&(e.see||e.cd<-3)&&takeToken(e)){ const ld=leadDir(e.pos.x,e.pos.z,9,_ld), len=Math.max(2,Math.min(11,lineLen(e.pos.x,e.pos.z,ld.x,ld.z,11,.3)));
      if(!e.chakM){ const cm=new THREE.Mesh(new THREE.TorusGeometry(.7,.09,6,20),basic(0xffd36a,false)); cm.rotation.x=Math.PI/2; const g=new THREE.Group(); g.add(cm); roomGroup.add(g);
        const tie=new THREE.Mesh(box(.06,.02,1),new THREE.MeshBasicMaterial({color:0xffd36a,transparent:true,opacity:.4,depthWrite:false})); roomGroup.add(tie); (e.props||(e.props=[])).push(g,tie); e.chakM={g,tie}; }
      e.chak={m:e.chakM.g,tie:e.chakM.tie,x:ld.x,z:ld.z,len,done:0,t:0,ph:'tele',hit:false}; e.chak.m.visible=false; teleStrip(e.pos,ld.x,ld.z,len,.4,0xffd36a,.7,true); sfx('click'); } },
  /* summoner (angel): stays back (runs when you come within 6); every 7-9 s it chants 1.2 s (gold rings fill where two Mini seraphs will stand, at
     least 4 from you), then they appear (4 at most, they give no xp); a stun stops the chant */
  cantor(e,dt,to,d,pd,m){ const [n,f]=e.def.band;
    if(e.st==='chant'){ e.vel.multiplyScalar(Math.pow(.05,dt)); e.stT-=dt; if(e.stT<=0){ for(const s of e.chantAt){ const c=spawnEnemy('mini',new V3(s.x,0,s.z),false,{minion:true,noDrop:true}); if(c){ c.summoner=e; c.wake=.5; } } e.st='move'; e.chantT=rand(7,9); sfx('door'); } return; }
    steer(e,holdBand(e,dt,to,d,n,f),dt,2.5); if(pd<6) e.vel.addScaledVector(to,-e.speed*.6*dt*4); faceAim(e,dt,to,3);
    if(player.dead) return; e.chantT-=dt;
    if(e.chantT<=0){ let k=0; for(const o of enemies) if(o.summoner===e&&!o.dead) k++; if(k>=4){ e.chantT=2; return; }
      const pts=[]; for(let i=0;i<2&&k+i<4;i++){ const s=spotNear(e.pos.x,e.pos.z,rand(1.8,3),rand(-Math.PI,Math.PI),4); if(s){ pts.push(s); groundRing(new V3(s.x,0,s.z),0xffd36a,1.2,1.2); } }
      if(!pts.length){ e.chantT=1; return; } e.chantAt=pts; e.st='chant'; e.stT=1.2; sfx('zap'); } },
  /* support: stays behind the enemy closest to you (its tank), heals and shields everyone inside the green aura */
  cherub(e,dt,to,d,pd,m){ const T=tgt(); let front=null,fd=1e9;
    for(const o of enemies){ if(o===e||o.dead||o===boss||o.def&&o.def.role==='support') continue; const od=Math.hypot(o.pos.x-T.x,o.pos.z-T.z); if(od<fd){ fd=od; front=o; } }
    let gx,gz; if(front){ const ux=(front.pos.x-T.x)/(fd||1), uz=(front.pos.z-T.z)/(fd||1); gx=front.pos.x+ux*3.2; gz=front.pos.z+uz*3.2; } else { gx=e.pos.x-to.x*5; gz=e.pos.z-to.z*5; }
    const want=seek(e,clamp(gx,-AX+1.5,AX-1.5),clamp(gz,-AZ+1.5,AZ-1.5),e.speed,_sv); if(pd<6) want.addScaledVector(to,-e.speed*.8);
    steer(e,want,dt,2.5);
    const R=4.6; for(const o of enemies){ if(o===e||o.dead||o===boss) continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<R){ o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.06*dt); if(Math.random()<dt*2) sparks(o.pos.clone().setY(2),0x7dff9a,1,2); } }
    // T2: an ally inside the aura under 30% armor gets a 3 s shield right away (8 s cooldown), a green ring first
    if(e.tier>1){ e.rescueT=(e.rescueT||0)-dt; if(e.rescueT<=0) for(const o of enemies){ if(o===e||o.dead||o===boss||o.hp>o.maxHp*.3||Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)>=R) continue; o.shieldT=3; groundRing(o.pos,0x7dff9a,1.6,.6); sfx('shield'); e.rescueT=8; break; } }
    e.cd-=dt; if(e.cd<=0){ e.cd=4.5; let k=0; for(const o of enemies){ if(o===e||o.dead||o===boss) continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<R){ o.shieldT=3; k++; } } if(k){ groundRing(e.pos,0x7dff9a,R,.6); sfx('shield'); } }
    e.yaw=lerpAngle(e.yaw,Math.atan2(-to.x,-to.z),Math.min(1,dt*3)); },
  /* rusher: rolls in along the flow field and speeds up as it goes; the fuse (0.55 s) only starts when it is close and can see you */
  // Cellmite: chases, a short ring then a bite in reach; three close together for 2 s merge into a Cell Brute
  cellmite(e,dt,to,d,pd,m){ steer(e,chase(e,e.speed,_sv),dt,3); e.biteCd-=dt;
    if(e.biteT>0){ e.biteT-=dt; if(e.biteT<=0&&pd<e.r+1.1&&!player.dead) contactHurt(e,7); }
    else if(e.biteCd<=0&&pd<e.r+1.4){ e.biteT=.35; e.biteCd=rand(1.1,1.6); groundRing(e.pos,0xff3a5a,1.1,.35); }
    let near=0; for(const o of enemies) if(o!==e&&!o.dead&&o.kind==='cellmite'&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<2.4) near++;
    e.mergeT=near>=2?e.mergeT+dt:Math.max(0,e.mergeT-dt*2);
    if(e.mergeT>=2) cellMerge(e); },
  cellbrute(e,dt,to,d,pd,m){ const want=d>e.def.hold?chase(e,e.speed,_sv):_sv.set(0,0,0);
    attackCycle(e,dt,want,()=>{ if(d<e.def.slam+.6&&e.slamCd<=0){ e.slamCd=rand(3,4); return ATK.slam; } return null; },2.2); faceAim(e,dt,to,4); },
  spark(e,dt,to,d,pd,m){
    if(e.bounceT>0) e.bounceT-=dt; // just bounced off a wall: let it fly for a moment
    else if(e.st!=='blink'){ e.rush=Math.min(1,(e.rush||0)+dt/1.5); steer(e,chase(e,e.speed*(.5+.8*e.rush),_sv),dt,1.6+e.rush*2.4);
      if(pd<2.5&&!player.dead&&losClear(e.pos.x,e.pos.z,player.pos.x,player.pos.z)){ e.st='blink'; e.stT=e.fuseShort?.45:e.def.fuse; m.warn.visible=true; sfx('click'); } }
    if(e.st==='blink'){ if(!(e.bounceT>0)) steer(e,_sv.copy(to).multiplyScalar(e.speed*.3),dt,3); e.stT-=dt; if(e.stT<=0){ sparkBoom(e); return; } }
    e.yaw=0; },
};
// the hunted elite (Hunt rooms): runs uphill on the flow field, away from you along real paths, and snaps a shot now and then
function huntAI(e,dt,to,d,pd,m){ let want;
  if(d<15){ if(e.fly||!NAV.ok) want=_sv.set(-to.x*e.speed,0,-to.z*e.speed); else want=fleeDir(e.pos.x,e.pos.z,_sv)?_sv.multiplyScalar(e.speed):backOff(e,to,e.speed,_sv); }
  else want=_sv.set(0,0,0);
  attackCycle(e,dt,want,()=>canFire(e)&&d<12?ATK.snap:null,3);
  if(e.vel.lengthSq()>.5&&e.ph==='pos') e.yaw=lerpAngle(e.yaw,Math.atan2(e.vel.x,e.vel.z),Math.min(1,dt*6)); else faceAim(e,dt,to,6);
  if(m.legs&&m.tur) e.aimYaw=Math.atan2(to.x,to.z); }
/* elite affixes over time: Blinker teleports (a ring marks where it lands), Summoner calls in small helpers (4 at most), Shielded regrows its barrier */
function affixTick(e,dt){
  if(e.blinkT!=null&&e.ph==='pos'){ if(!e.blinkTo){ e.blinkT-=dt; if(e.blinkT<=0){ const s=planSpot(e,6,11,{want:rand(-Math.PI,Math.PI),noLos:true}); e.blinkTo={x:s.x,z:s.z,t:.55}; groundRing(new V3(s.x,0,s.z),0xb070ff,1.8,.55); sfx('zap'); } }
    else { e.blinkTo.t-=dt; e.model.g.visible=Math.floor(e.t*24)%2===0; if(e.blinkTo.t<=0){ sparks(e.pos.clone().setY(1.5),0xb070ff,8,5); e.pos.set(e.blinkTo.x,0,e.blinkTo.z); e.vel.set(0,0,0); e.goal=null; e.path=null; e.blinkTo=null; e.blinkT=rand(3.5,5); e.model.g.visible=true; sparks(e.pos.clone().setY(1.5),0xb070ff,8,5); } } }
  if(e.sumT!=null){ e.sumT-=dt; if(e.sumT<=0){ e.sumT=rand(7,9); let n=0; for(const o of enemies) if(o.summoner===e&&!o.dead) n++;
    for(let i=0;i<2&&n<4;i++,n++){ const a=rand(0,Math.PI*2), c=spawnEnemy(ARENAS[stage].minion||(e.angel?'mini':ARENAS[stage].stage?'mosher':'spark'),new V3(clamp(e.pos.x+Math.cos(a)*2,-AX+1.5,AX-1.5),0,clamp(e.pos.z+Math.sin(a)*2,-AZ+1.5,AZ-1.5)),false,{minion:true}); if(c) c.summoner=e; }
    groundRing(e.pos,0xb070ff,3,.5); } }
  if(e.esh){ if(e.esh.hp<=0){ e.esh.cd-=dt; if(e.esh.cd<=0){ e.esh.hp=e.esh.max; e.esh.m.visible=true; groundRing(e.pos,0x5fe0ff,2.2,.4); } } else e.esh.m.scale.setScalar(Math.max(1,e.esh.m.scale.x-dt*.8)); }
}
/* ================= MAIN STAGE (Ritim senkronu) ================= */
/* Every Main Stage attack lands on a beat of the live music (BEAT, audio.js): the wind-up runs at least its tele time, then waits for the
   beat (ATK beat:true in attackCycle, BEAT.until in the state machines). Floor props (dance pad, follow spot, landing ring, flame jets) live
   in roomGroup and are listed in e.props, so they go with their owner (killEnemy). vulnT: the bestiary's open moments, +60% damage taken. */
const stageProp=(e,o,x,z)=>{ o.position.set(x,0,z); roomGroup.add(o); (e.props||(e.props=[])).push(o); return o; };
const MS_COL={pink:0xff3aa8,amber:0xffb84a,red:0xff3a3a,blue:0x6ad8ff,yellow:0xffd23a};
// a free floor point around the target, at range r (for dance pads, jets and landing spots)
function stageSpot(T,r0,r1){ for(let k=0;k<24;k++){ const a=rand(0,Math.PI*2), r=rand(r0,r1), x=clamp(T.x+Math.cos(a)*r,-AX+1.6,AX-1.6), z=clamp(T.z+Math.sin(a)*r,-AZ+1.6,AZ-1.6); if(!inBlock(x,z,1.1)) return new V3(x,0,z); } return new V3(clamp(T.x,-AX+2,AX-2),0,clamp(T.z,-AZ+2,AZ-2)); }
// the pilot is cornered: against the mat edge or a block (Mosher chains hurt more there)
const cornered=()=>Math.abs(player.pos.x)>AX-2.2||Math.abs(player.pos.z)>AZ-2.2||!!inBlock(player.pos.x,player.pos.z,1.4);
// cone on the floor that fills during a wind-up (amber: Shredder riff, red: Bass Brute headbang)
const CONE_GEO=new THREE.CircleGeometry(1,24,Math.PI/2-.45,.9); // a .9 rad slice of the unit disc around local -z once laid flat
const coneGeo=arc=>new THREE.CircleGeometry(1,24,Math.PI/2-arc/2,arc), CONE_BASS=coneGeo(ENEMY.bass.cone[1]);
CONE_GEO.userData.shared=CONE_BASS.userData.shared=true; // telegraph shapes reused by every mob
function teleCone(e,dir,len,life,col=MS_COL.amber,geo=CONE_GEO){ const g=new THREE.Group(), mat=warnFill(addMat(col,.25)), m=new THREE.Mesh(geo,mat);
  m.rotation.x=-Math.PI/2; g.add(m); g.position.set(e.pos.x,.06,e.pos.z); g.rotation.y=Math.atan2(dir.x,dir.z)+Math.PI;
  const o=col===MS_COL.red?1.6:1; // the Bass Brute's red cone reads fainter on the dark mat, so it is drawn stronger
  addFx(g,life,(f,dt,k)=>{ mat.opacity=(.15+.3*(1-k)+.12*Math.abs(Math.sin((1-k)*life*14)))*o; m.scale.setScalar(len*(.35+.65*(1-k))); }); return g; }
/* the pilot inside a floor cone from e along dir (len, arc in rad): hurt, or a perfect dodge when the dash is running through it. The cone
   flashes full size for a moment either way. */
function coneHit(e,dir,len,arc,dmg,geo){ const g=new THREE.Group(), mat=addMat(MS_COL.red,.7), m=new THREE.Mesh(geo,mat); m.rotation.x=-Math.PI/2; m.scale.setScalar(len); g.add(m);
  g.position.set(e.pos.x,.07,e.pos.z); g.rotation.y=Math.atan2(dir.x,dir.z)+Math.PI; addFx(g,.3,(f,dt,k)=>{ mat.opacity=.7*k; });
  if(player.dead) return false; const dx=player.pos.x-e.pos.x, dz=player.pos.z-e.pos.z, d=Math.hypot(dx,dz);
  if(d>len+.6) return false; const off=Math.abs(((Math.atan2(dx,dz)-Math.atan2(dir.x,dir.z))+Math.PI*3)%(Math.PI*2)-Math.PI);
  if(d>1.2&&off>arc/2+Math.atan2(.6,d)) return false;
  if(player.dashT>0){ player.inv=Math.max(player.inv,.35); perfectDodge(); return false; } hurt(dmg); return true; }
/* Drummer sky drops: a red marker fills on the floor, the drop falls out of the sky onto it and lands on a beat. Markers live in roomGroup (they
   go with the room) and are capped (STAGE.meteorMax) for low-end phones; the drop hurts only the pilot (amps and blocks are left alone). */
const stageMeteors=[];
function skyDrop(x,z,R,dmg,dur){ if(stageMeteors.filter(m=>!m.done).length>=STAGE.meteorMax[mobileMode?0:1]) return;
  const g=new THREE.Group(), ring=new THREE.Mesh(G.ring,addMat(MS_COL.red,.85)), fill=new THREE.Mesh(G.disc,addMat(MS_COL.red,.22)), orb=new THREE.Mesh(G.orb,basic(MS_COL.yellow,false));
  ring.rotation.x=fill.rotation.x=-Math.PI/2; ring.scale.setScalar(R); fill.position.y=-.01; orb.scale.setScalar(1.6); orb.add(new THREE.Mesh(G.orb,basic(0xffffff,false))); orb.children[0].scale.setScalar(.5);
  g.add(ring,fill,orb); g.position.set(x,.07,z); roomGroup.add(g); stageMeteors.push({g,ring,fill,orb,x,z,R,dmg,t:0,dur,done:false}); }
function updateSkyDrops(dt){
  for(let i=stageMeteors.length-1;i>=0;i--){ const M=stageMeteors[i]; if(!M.g.parent){ stageMeteors.splice(i,1); continue; } M.t+=dt; const k=Math.min(1,M.t/M.dur);
    if(!M.done){ M.fill.scale.setScalar(Math.max(.02,M.R*k)); M.ring.material.opacity=.5+.45*Math.abs(Math.sin(M.t*(6+k*20))); const fall=clamp((k-.55)/.45,0,1); M.orb.visible=fall>0; M.orb.position.y=16*(1-fall)+.4;
      if(Math.random()<dt*20&&fall>0) sparks(new V3(M.x,M.orb.position.y+.6,M.z),0xffb84a,1,2);
      if(k>=1){ M.done=true; M.orb.visible=false; M.fill.visible=false; crossBlast(new V3(M.x,.1,M.z),MS_COL.amber,.8); sparks(new V3(M.x,.4,M.z),MS_COL.yellow,8,7); shake=Math.max(shake,.12); sfx('boom');
        if(!player.dead&&state==='fight'&&Math.hypot(player.pos.x-M.x,player.pos.z-M.z)<M.R+.4){ if(player.dashT>0){ player.inv=Math.max(player.inv,.35); perfectDodge(); } else hurt(M.dmg); } M.t=0; } }
    else { M.ring.material.opacity=Math.max(0,.8-M.t*3); if(M.t>.3){ roomGroup.remove(M.g); [M.ring,M.fill].forEach(o=>o.material.dispose()); stageMeteors.splice(i,1); } } } }
// thin floor line from pos toward (dx,dz), len long, on the shared unit plane (no geometry per shot: Pyro Tech fires often)
function teleLine(pos,dx,dz,len,w,color,life){ const g=new THREE.Group(), mat=warnFill(addMat(color,.3)), pl=new THREE.Mesh(G.plane,mat); pl.rotation.x=-Math.PI/2; pl.scale.set(w,len,1); pl.position.z=len/2; g.add(pl);
  g.position.set(pos.x,.05,pos.z); g.rotation.y=Math.atan2(dx,dz); addFx(g,life,(f,dt,k)=>{ mat.opacity=.18+.22*Math.abs(Math.sin((1-k)*life*9)); }); return g; }
const MS_ATK={
  // Shredder riff: an amber sound-wave cone of shots toward you, on the beat
  riff:{beat:true,tele:.45,rec:.4,cd:[1.3,2],need:e=>e.see,start(e){ const s=9*eSpd(); e.aim=leadDir(e.pos.x,e.pos.z,s,new V3()); teleCone(e,e.aim,7,e.phT+.05); sfx('click'); },
    fire(e){ const o=e.pos.clone().setY(1.7), s=9*eSpd(), b=Math.atan2(e.aim.x,e.aim.z); for(let i=0;i<7;i++){ const a=b+(i/6-.5)*.9; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),s,11,MS_COL.amber,{life:1.4,r:.48}); }
      e.riffs++; e.jz.rec.v+=5; sfx('heavy'); }},
  // Shredder solo: 3 s of lightning that jumps off his bandmates to you on every beat while you are inside the ring, then he headbangs, open
  solo:{beat:true,tele:.6,rec:3,cd:[2.2,3],start(e){ slamTele(e.pos,7.5,e.phT,3.1); sfx('zap'); },fire(e){ e.riffs=0; e.soloing=true; },
    tick(e,dt){ if(e.ph!=='rec'||!BEAT.hit) return; let from=e.pos.clone().setY(2.6); const near=enemies.filter(o=>o!==e&&!o.dead&&o!==boss&&Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<7.5).slice(0,2);
      for(const o of near){ const to=o.pos.clone().setY(2.2); bolt(from,to,0xffe08a); from=to; }
      if(!player.dead&&Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z)<7.5){ bolt(from,player.pos.clone().setY(1.8),0xfff0c0); hurt(9); } else bolt(from,e.pos.clone().add(new V3(rand(-4,4),2,rand(-4,4))),0xffe08a); sfx('zap'); },
    after(e){ e.soloing=false; e.bangT=1; e.vulnT=1; }},
  // Bass Brute headbang: plants, the red cone shows the reach for a short wind-up, then the hit lands on the beat (step out or dash through)
  bang:{beat:true,tele:.55,rec:.75,cd:[1.8,2.6],start(e){ const T=tgt(); e.aim=new V3(T.x-e.pos.x,0,T.z-e.pos.z).normalize(); teleCone(e,e.aim,e.def.cone[0],e.phT+.05,MS_COL.red,CONE_BASS); sfx('click'); },
    fire(e){ coneHit(e,e.aim,e.def.cone[0],e.def.cone[1],e.def.cone[2],CONE_BASS); e.bangT=.45; e.jz.pop.v=-6; shake=Math.max(shake,.18); sfx('heavy'); }},
  // Pyro Tech fireworks: the lit rocket goes up in his hand (the tell), then a volley flies at you on the beat, trailing sparks; blocks stop it
  rocket:{beat:true,tele:.55,rec:.45,cd:[1.5,2.3],need:e=>e.see,start(e){ e.flareT=e.phT+.1; const T=tgt(); teleLine(e.pos,T.x-e.pos.x,T.z-e.pos.z,Math.min(12,Math.hypot(T.x-e.pos.x,T.z-e.pos.z)),.35,0xff6a2a,e.phT); sfx('click'); },
    // the first rocket of a volley flies at you, the next ones at where you are heading (led more each), so neither standing nor running straight is safe
    fire(e){ const [sp,dmg,n]=e.def.rockets, s=sp*eSpd(), o=e.pos.clone().setY(1.9);
      for(let i=0;i<n;i++){ const dd=leadDir(o.x,o.z,s,_ld,i/Math.max(1,n-1)); shoot('e',o,dd.clone(),s,dmg,0xff6a2a,{life:1.5,r:.5,fw:0xffb84a}); } e.jz.rec.v+=4; sfx('torch'); }},
  // Stage Diver brawl: a short wind-up, then a punch on the beat
  punch:{beat:true,tele:.3,rec:.45,cd:[.9,1.4],need:e=>Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z)<2.9,
    fire(e){ e.jz.rec.v+=6; if(!player.dead&&Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z)<2.6){ hurt(10); _tmp2.set(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z).normalize(); player.kick.addScaledVector(_tmp2,6); } sfx('slash'); }},
};
const MS_AI={
  /* Pulse Dancer: circles you with her scarves swatting shots away. With a token she cues a pink pad (the landing spot), teleports onto it on an
     even beat (every second beat), opens an 8-note ring and stands open for 0.4 s. */
  dancer(e,dt,to,d,pd,m){ const T=tgt(), [n,f]=e.def.band;
    if(!m.pad.userData.out){ m.pad.userData.out=1; m.g.remove(m.pad); stageProp(e,m.pad,0,0); m.pad.visible=false; }
    e.scarf=e.st==='dance'||e.st==='cue';
    if(e.st==='land'){ steer(e,_sv.set(0,0,0),dt,6); e.stT-=dt; if(e.stT<=0){ e.st='dance'; e.cd=rand(1.4,2.1); dropToken(e); } faceAim(e,dt,to,8); return; }
    // orbit at mid range, switching direction now and then
    e.orbT=(e.orbT||0)-dt; if(e.orbT<=0){ e.orbT=rand(1.5,2.6); e.orb=Math.random()<.5?-1:1; }
    const a=angOf(e.pos.x,e.pos.z,T)+(e.orb||1)*.7, R=(n+f)/2; steer(e,seek(e,clamp(T.x+Math.sin(a)*R,-AX+1.2,AX-1.2),clamp(T.z+Math.cos(a)*R,-AZ+1.2,AZ-1.2),e.speed,_sv),dt,4); faceAim(e,dt,to,6);
    if(e.st==='cue'){ e.stT-=dt; const k=1-e.stT/e.cueT; m.padFill.scale.setScalar(Math.max(.05,1.4*k)); m.pad.children[0].material.opacity=.5+.4*Math.abs(Math.sin(e.t*16));
      if(e.stT<=0){ sparks(e.pos.clone().setY(1.6),MS_COL.pink,10,6); e.pos.copy(e.dest); e.vel.set(0,0,0); e.path=null; m.pad.visible=false; e.st='land'; e.stT=.4; e.vulnT=.4; e.jz.pop.v=-6;
        groundRing(e.pos,MS_COL.pink,3,.4); const o0=rand(0,1); for(let i=0;i<8;i++){ const an=(i+o0)/8*Math.PI*2; shoot('e',e.pos.clone().setY(1.6),new V3(Math.sin(an),0,Math.cos(an)),6.5*eSpd(),10,MS_COL.pink,{life:2.6,r:.48}); } sfx('zap'); }
      return; }
    if(e.hold||player.dead) return; e.cd-=dt*cdRate(e);
    if(e.cd<=0&&takeToken(e)){ e.dest=stageSpot(T,3.5,5.5); m.pad.position.set(e.dest.x,0,e.dest.z); m.pad.visible=true; e.st='cue'; e.stT=e.cueT=BEAT.until(.7,2); } },
  /* Drummer: never leaves the stool. The beat before every second downbeat the red ring shows the kick's reach, then the kick sends a shockwave
     out to it (dash through it, or keep out). On beat 4 of every bar he throws sticks into the sky: red markers fill around the mat (one
     always where you are heading) and the drops land on them on the beat (skyDrop). While he plays, the band is 15% faster (stageTick). */
  drummer(e,dt,to,d,pd,m){ e.vel.set(0,0,0); e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*1.2));
    if(!BEAT.hit||e.hold||player.dead) return; const b=BEAT.idx%8;
    if(b===7&&takeToken(e)){ e.kickArm=true; slamTele(e.pos,e.def.slam,BEAT.spb,.35); }
    else if(b===0&&e.kickArm){ e.kickArm=false; shockwave(e.pos,11,e.def.slam,MS_COL.red); e.kickT=.25; shake=Math.max(shake,.15); sfx('heavy'); dropToken(e); }
    if(b===2) e.glint=.3;
    if(b===3&&canFire(e)){ const [n,R,dmg]=e.def.meteors, T=tgt(), dur=BEAT.until(BEAT.spb*1.6,1), at=stageSpot({x:T.x+AIR.pv.x*.5,z:T.z+AIR.pv.z*.5},0,1.2);
      skyDrop(at.x,at.z,R,dmg,dur); for(let i=1;i<n+(e.elite?1:0);i++){ const q=stageSpot({x:0,z:0},2,Math.max(AX,AZ)); skyDrop(q.x,q.z,R,dmg,dur); } e.cymT=.3; sfx('slash'); } },
  /* Shredder: keeps mid range and riffs; after two riffs he goes into a solo (ring + lightning), then headbangs for a second, open */
  shredder(e,dt,to,d,pd,m){ const [n,f]=e.def.band;
    if(e.bangT>0){ e.bangT-=dt; steer(e,_sv.set(0,0,0),dt,6); faceAim(e,dt,to,3); return; }
    attackCycle(e,dt,holdBand(e,dt,to,d,n,f),()=>e.riffs>=2&&d<9?MS_ATK.solo:canFire(e)&&d<f*1.3?MS_ATK.riff:null,2.5); faceAim(e,dt,to,e.ph==='pos'?6:2); },
  /* Bass Brute: big and slow, walks up to you. His low-frequency rings roll out on every second beat; inside them you are 35% slower and your
     dash recharges slower. In reach he plants and headbangs: a wide red cone in front of him, landing on the beat (MS_ATK.bang). */
  bass(e,dt,to,d,pd,m){ e.bangT=(e.bangT||0)-dt; const want=d>e.def.hold?chase(e,e.speed,_sv):_sv.set(0,0,0);
    attackCycle(e,dt,want,()=>e.see&&pd<e.def.cone[0]+.3?MS_ATK.bang:null,2); if(e.ph==='pos') faceAim(e,dt,to,3);
    if(BEAT.hit&&BEAT.idx%2===0){ e.ripT=0; if(pd<e.def.aura+2) shake=Math.max(shake,.06); }
    e.ripT=(e.ripT||0)+dt; if(!player.dead&&pd<e.def.aura) player.slowT=Math.max(player.slowT||0,.25); },
  /* Roadie: runs to a spot near the action and sets an amp down (it lands on the beat), up to def.amps at a time; with them out he keeps away */
  roadie(e,dt,to,d,pd,m){ const [n,f]=e.def.band, T=tgt();
    if(e.st==='set'){ steer(e,_sv.set(0,0,0),dt,6); e.stT-=dt; if(e.stT<=0){ const a=spawnEnemy('amp',new V3(e.pos.x+Math.sin(e.yaw)*1.4,0,e.pos.z+Math.cos(e.yaw)*1.4),false,{minion:true,noDrop:true,force:true,hpK:1/(roomHpScale()*SCALE.mob)}); if(a){ a.owner=e; groundRing(a.pos,MS_COL.amber,2,.4); sfx('heavy'); } e.st='run'; e.cd=rand(1.6,2.6); } return; }
    const mine=enemies.filter(o=>o.owner===e&&!o.dead).length, all=enemies.filter(o=>o.type==='amp'&&!o.dead).length;
    // the spot is picked again every 2 s (you move, and a spot behind blocks may not be reachable); once the cooldown is over he sets the amp
    // down at the spot, or wherever he is when he has been on his way too long
    if(mine<e.def.amps&&all<STAGE.ampMax&&!e.hold){ e.cd-=dt; e.spotT=(e.spotT||0)-dt; if(!e.ag||e.spotT<=0){ e.ag=stageSpot(T,4,7); e.spotT=2; }
      steer(e,seek(e,e.ag.x,e.ag.z,e.speed,_sv),dt,4); if(e.vel.lengthSq()>.3) e.yaw=lerpAngle(e.yaw,Math.atan2(e.vel.x,e.vel.z),Math.min(1,dt*8));
      const there=Math.hypot(e.ag.x-e.pos.x,e.ag.z-e.pos.z)<1.4||e.cd<-3;
      if(e.cd<=0&&there&&!inBlock(e.pos.x+Math.sin(e.yaw)*1.4,e.pos.z+Math.cos(e.yaw)*1.4,.8)){ e.st='set'; e.stT=BEAT.until(.6); e.ag=null; } return; }
    steer(e,holdBand(e,dt,to,d,n,f),dt,3); faceAim(e,dt,to,4); },
  // amp: lives 10 s, a yellow sound pulse rolls out of it on its beat of every bar
  amp(e,dt,to,d,pd,m){ e.vel.set(0,0,0); e.life-=dt; if(e.life<=0){ killEnemy(e,true); return; }
    if(BEAT.hit&&(BEAT.idx+e.beatOff)%4===0&&!player.dead&&!e.hold){ shockwave(e.pos,9,e.def.pulse,MS_COL.yellow); e.jz.pop.v=-4; } },
  /* Mosher: packs of 6-10 run at you and shove on the beat: little damage, a strong push; cornered against the edge or a block, the chains hurt */
  mosher(e,dt,to,d,pd,m){ steer(e,chase(e,e.speed,_sv),dt,3); if(e.vel.lengthSq()>.3) e.yaw=lerpAngle(e.yaw,Math.atan2(e.vel.x,e.vel.z),Math.min(1,dt*8));
    e.cd-=dt; if(!BEAT.hit||e.cd>0||player.dead||e.hold||pd>e.r+1.3) return;
    _tmp2.set(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z).normalize(); const c=cornered(); player.kick.addScaledVector(_tmp2,c?5:10); contactHurt(e,c?12:4);
    e.cd=BEAT.spb*2-.05; e.shove=.25; e.jz.pop.v=-4; sfx('hit'); },
  /* Pyro Tech: holds lit fireworks and keeps his range (backs off when you close in). The rocket goes up in his hand with a thin orange line
     toward you (the tell), then a volley of rockets flies at you on the beat with a spark trail and pops on impact (MS_ATK.rocket). */
  pyro(e,dt,to,d,pd,m){ const [n,f]=e.def.band;
    attackCycle(e,dt,holdBand(e,dt,to,d,n,f),()=>canFire(e)&&d<f*1.4?MS_ATK.rocket:null,3); faceAim(e,dt,to,e.ph==='pos'?5:3); },
  /* Lighting tech: hangs back where he can see you and turns the follow spot on you. The circle follows slowly; while you stand in it (and he
     sees you: blocks cut the light) it turns red and burns on every beat (stageTick; several spots do not stack) and every enemy shot at you
     is 25% faster and better aimed (spotLit). Fragile. */
  spot(e,dt,to,d,pd,m){ const [n,f]=e.def.band, T=tgt();
    if(!m.spot.userData.out){ m.spot.userData.out=1; m.g.remove(m.spot); stageProp(e,m.spot,e.pos.x,e.pos.z); e.sp=new V3(e.pos.x,0,e.pos.z); }
    steer(e,holdBand(e,dt,to,d,n,f),dt,3); faceAim(e,dt,to,4);
    const dx=T.x-e.sp.x, dz=T.z-e.sp.z, l=Math.hypot(dx,dz), st=Math.min(l,(e.stun>0?0:2.8)*dt); if(l>.01){ e.sp.x+=dx/l*st; e.sp.z+=dz/l*st; }
    m.spot.position.set(e.sp.x,0,e.sp.z); m.spot.scale.setScalar(e.def.spot[0]);
    const lit=!player.dead&&e.see&&Math.hypot(player.pos.x-e.sp.x,player.pos.z-e.sp.z)<e.def.spot[0]; if(lit) spotNext=true;
    m.spotFill.material.color.setHex(lit?0xff7a3a:0xfff0c0); m.spotRing.material.color.setHex(lit?0xff4a2a:0xfff0c0); m.spotFill.material.opacity=lit?.45+.15*Math.sin(e.t*14):.22;
    m.lamp.rotation.y=Math.atan2(e.sp.x-e.pos.x,e.sp.z-e.pos.z)-e.byaw; },
  /* Stage Diver: jumps in from beyond the mat with his arms out and keeps leaping at you: the red ring marks the landing (where you are
     heading) for a short moment, he lands on a beat and the crush wave rolls out. A moment dazed (open), a short brawl with his fists, then
     the next leap (def.leap seconds). Landing spots stay off blocks. */
  diver(e,dt,to,d,pd,m){ const T=tgt();
    if(!m.land.userData.out){ m.land.userData.out=1; m.g.remove(m.land); stageProp(e,m.land,0,0); m.land.visible=false; }
    const leap=from=>{ let to2=new V3(clamp(T.x+AIR.pv.x*.4,-AX+2,AX-2),0,clamp(T.z+AIR.pv.z*.4,-AZ+2,AZ-2)); if(inBlock(to2.x,to2.z,1.2)) to2=stageSpot(to2,1,3);
      e.leap={from,to:to2,t:0,dur:BEAT.until(.55,1)}; e.st='leap'; m.land.position.set(to2.x,0,to2.z); m.land.scale.setScalar(3.2); m.land.visible=true; sfx('click'); };
    if(e.st==='enter'){ const sx=Math.abs(e.pos.x)>AX-2.5?Math.sign(e.pos.x):0, sz=sx?0:-1; leap(new V3(e.pos.x+sx*4,0,e.pos.z+sz*4)); }
    if(e.st==='leap'){ const L=e.leap; L.t+=dt; const k=Math.min(1,L.t/L.dur); e.vel.set(0,0,0); e.pos.lerpVectors(L.from,L.to,k); e.dropY=Math.sin(Math.PI*k)*5+(1-k)*1.5; e.dropV=0;
      e.yaw=Math.atan2(L.to.x-L.from.x,L.to.z-L.from.z); m.landFill.scale.setScalar(Math.max(.05,k)); m.land.children[0].material.opacity=.5+.4*Math.abs(Math.sin(e.t*18));
      if(k>=1){ e.dropY=0; m.land.visible=false; shockwave(e.pos,12,3.2,0xff4a2a); shake=Math.max(shake,.3); e.jz.pop.v=-9; sparks(e.pos.clone().setY(.4),0xc8c0d0,8,6); sfx('boom'); e.st='daze'; e.stT=.6; e.vulnT=.6; dropToken(e); } return; }
    if(e.st==='daze'){ e.vel.multiplyScalar(.8); e.stT-=dt; if(Math.random()<dt*10) sparks(e.pos.clone().setY(3.4),0xffd36a,1,2); if(e.stT<=0){ e.st='brawl'; e.diveT=rand(e.def.leap[0],e.def.leap[1]); } return; }
    e.diveT-=dt;
    // the next leap waits for a free attack token (and for a punch to finish); it is tried again every frame
    if(e.diveT<=0&&e.ph==='pos'&&!e.hold&&!player.dead&&takeToken(e)){ leap(e.pos.clone()); return; }
    attackCycle(e,dt,d>2?chase(e,e.speed,_sv):_sv.set(0,0,0),()=>!player.dead&&pd<2.9?MS_ATK.punch:null,4); faceAim(e,dt,to,8); },
};
Object.assign(AI,MS_AI);
// POSE[type](e,dt,m): arm and body poses for the human cast, applied after the walk (stepMech) and lean
const beatK=()=>Math.max(0,1-BEAT.ph*4);
const bang=(h,k=.35)=>{ h.rotation.x=Math.max(0,Math.sin(BEAT.ph*Math.PI*2))*k; };
const POSE={
  dancer(e,dt,m){ const t=e.t, hit=beatK(); m.torso.rotation.y+=Math.sin(t*2.5)*.5; m.hips.rotation.z=Math.sin(t*5)*.12; pose(m,-2.6+Math.sin(t*3)*.4,-2.6-Math.sin(t*3)*.4,-.6,-.6); m.arms[0].rotation.z=-.4; m.arms[1].rotation.z=.4;
    m.belt.rotation.y=Math.sin(t*10)*.1; m.skirt.rotation.y+=dt*(e.scarf?6:1); m.ribbons.forEach((r,i)=>{ r.children[1].scale.setScalar(1+hit*.6+(e.scarf?.25:0)); r.children[1].material.opacity=.35+hit*.5; });
    m.g.visible=!(e.st==='cue'&&e.stT<.15&&Math.floor(e.t*30)%2); },
  shredder(e,dt,m){ const hit=beatK(); if(e.bangT>0){ pose(m,-.5,-.4,-.9,-1.2); m.head.rotation.x=Math.max(0,Math.sin(e.t*16))*.9; m.torso.rotation.x+=Math.max(0,Math.sin(e.t*16))*.3; }
    else { pose(m,-.9,-.4+Math.sin(e.t*22)*.15,-.9,-1.2); bang(m.head,.5); }
    m.arms[0].rotation.z=-.2; m.arms[1].rotation.z=.25; m.strings.material.opacity=e.soloing?.6+.4*Math.sin(e.t*60):.4+hit*.6; if(e.ph==='tele') m.torso.rotation.x-=teleK(e)*.25; },
  bass(e,dt,m){ pose(m,-.6,-.5+Math.sin(e.t*10)*.06,-1.2,-1); m.arms[0].rotation.z=-.15; bang(m.head,.25);
    if(e.ph==='tele'){ const k=teleK(e); m.head.rotation.x=-.7*k; m.torso.rotation.x-=.35*k; } else if(e.bangT>0){ const k=e.bangT/.45; m.head.rotation.x=1.1*k; m.torso.rotation.x+=.5*k; }
    m.rip.children.forEach((r,i)=>{ const k=((e.ripT||0)/(BEAT.spb*2)+i/3)%1; r.scale.setScalar(.8+k*(e.def.aura-1)); r.material.opacity=(1-k)*.55; }); },
  roadie(e,dt,m){ if(e.st==='set'){ pose(m,-1.4,-1.4,-.8,-.8); m.hips.position.y-=.45; m.torso.rotation.x+=.5; } else pose(m,-2.9,-2.9,-.4,-.4); },
  mosher(e,dt,m){ const hit=beatK(), sh=Math.max(0,e.shove||0); e.shove=sh-dt; m.torso.rotation.z=Math.sin(e.t*7)*.15; pose(m,-1.2+hit*.6-sh*4,-1.2-hit*.6-sh*4,-1.3+sh*3,-1.3+sh*3); bang(m.head,.4); },
  pyro(e,dt,m){ e.flareT=(e.flareT||0)-dt; const up=e.flareT>0; pose(m,-.2,up?-2.9:-1.8,0,up?0:-.6); m.flare.scale.setScalar(up?1.6+Math.random()*.8:1);
    if(up&&Math.random()<dt*25){ m.flare.getWorldPosition(_tmp2); sparks(_tmp2.clone(),0xffb84a,1,2); } },
  spot(e,dt,m){ pose(m,-1,-1.1,-.7,-.6); m.arms[1].rotation.z=.4; },
  diver(e,dt,m){ if(e.st==='leap'||e.st==='enter'){ pose(m,-1.6,-1.6,0,0); m.arms[0].rotation.z=-1.2; m.arms[1].rotation.z=1.2; m.torso.rotation.x=.5; m.legs[0].rotation.x=m.legs[1].rotation.x=.4; }
    else if(e.st==='daze'){ pose(m,-.3,-.3,-.2,-.2); m.head.rotation.z=Math.sin(e.t*6)*.25; }
    else { const k=teleK(e); m.arms[0].rotation.z=m.arms[1].rotation.z=0; pose(m,-1.3,-1.3-k*.8-(e.ph==='rec'?.6:0),-1.4,-1.4+(e.ph==='rec'?1:0)); } },
};
// stage props that never walk: drummer and amps
const ANIM_MS={
  drummer(e,dt,m){ const h=m.h, hit=beatK(); h.arms.forEach((a,i)=>{ a.rotation.x=-.9-Math.max(0,Math.sin((BEAT.ph+i*.5)*Math.PI*2))*.7; a.userData.fore.rotation.x=-.5; }); bang(h.head,.45); h.torso.rotation.x=.15+hit*.08;
    e.kickT=(e.kickT||0)-dt; e.cymT=(e.cymT||0)-dt; e.glint=(e.glint||0)-dt; const kk=Math.max(0,e.kickT)*4; m.kick.scale.set(1+hit*.06+kk*.1,1,1+hit*.06+kk*.1); m.cym.forEach((c,i)=>{ c.rotation.x=Math.sin(e.t*9+i)*.12*hit+(e.cymT>0?Math.sin(e.t*40)*.3:0); });
    if(e.glint>0&&Math.random()<.5) sparks(e.pos.clone().setY(3),MS_COL.yellow,1,2); m.wave.scale.setScalar(.4+BEAT.ph*1.4); m.wave.material.opacity=(1-BEAT.ph)*.6; },
  amp(e,dt,m){ m.pulse.scale.setScalar(1.3+BEAT.ph*1.4); m.pulse.material.opacity=(1-BEAT.ph)*.6*(e.life<2?.5+.5*Math.sin(e.t*20):1); m.lamp.scale.setScalar(1+beatK()*.3); m.body.scale.y=1+beatK()*.04; },
};
// ANIM[type](e,dt,m): idle and movement animation, from the bestiary's animate()
const teleK=e=>e.ph==='tele'&&e.phMax?1-e.phT/e.phMax:0;
const _rq=new THREE.Quaternion(),_rax=new V3();
/* spider gait (Crawler, Siege Arachne): diagonal leg pairs (front-right + back-left, front-left + back-right) step in turn. The phase advances
   with the distance covered, so planted feet do not slide; a stance sweeps each foot backward. Standing still, a leg twitches now and then. */
function crawlGait(m,o,spd,dt,sc){
  o.gait=(o.gait||0)+spd*dt*Math.PI/(.54*sc); o.gAmt=spd>.25*sc?Math.min(1,(o.gAmt||0)+dt*10):Math.max(0,(o.gAmt||0)-dt*7); const A=o.gAmt;
  if(A<.2){ o.twT=(o.twT==null?rand(.3,1.4):o.twT)-dt; if(o.twT<=0){ o.twT=rand(.35,1.6); o.twL=(Math.random()*4)|0; o.twK=.16; } }
  if(o.twK>0) o.twK-=dt;
  m.legs.forEach((l,i)=>{ const sx=l.position.x>0?1:-1, p=o.gait+(i===0||i===3?0:Math.PI); let lift=Math.max(0,Math.cos(p))*.34*A;
    if(o.twK>0&&o.twL===i) lift+=Math.sin(Math.max(0,o.twK)/.16*Math.PI)*.4;
    l.rotation.y=l.userData.ry-sx*Math.sin(p)*.38*A; l.rotation.z=lift; });
  m.body.position.y=1.15+Math.abs(Math.sin(o.gait))*.07*A;
  return A;
}
const ANIM={
  // secondary motion: the Drone's antenna whips with acceleration, its dish turns; the Heavy's pauldrons swing with the stride, vents flare in a wind-up
  drone(e,dt,m){ const s=Math.sin(e.byaw), c=Math.cos(e.byaw), af=(e.acx||0)*s+(e.acz||0)*c; if(!m.ant.userData.broken){ m.ant.rotation.x=clamp(af*.03,-.5,.5)+Math.sin(e.t*7)*.06*(e.walkAmt||0); m.ant.rotation.z=Math.sin(e.t*4.3)*.06; } if(!m.dish.userData.broken) m.dish.rotation.y+=dt*(e.see?5:1.5); },
  heavy(e,dt,m){ const w=e.walk||0, a=e.walkAmt||0; m.pauls.forEach((p,i)=>{ if(!p.userData.broken) p.rotation.x=Math.sin(w+i*Math.PI)*.2*a+(e.jz.lean.x||0)*.6; });
    const k=teleK(e); m.glows.forEach((g,i)=>g.scale.set(1,1+k*1.6+Math.sin(e.t*30+i)*.15*(k>0?1:.3),1)); },
  // Spark truly rolls: the body turns about the axis across its velocity, as fast as it moves (radius .75)
  cellmite(e,dt,m){ m.cells.forEach((c,i)=>{ c.position.z=Math.sin(e.t*9+i*2)*.12; c.rotation.z+=dt*2.4*(i%2?1:-1); }); m.body.position.y=1+Math.abs(Math.sin(e.t*6))*.15; m.link.material.opacity=.15+.75*Math.min(1,e.mergeT/2); },
  cellbrute(e,dt,m){ m.body.position.y=2+Math.sin(e.t*2)*.1; m.cells.forEach((c,i)=>c.scale.setScalar(1+Math.sin(e.t*3+i)*.04)); m.body.rotation.z=Math.sin(e.t*1.2)*.05; },
  spark(e,dt,m){ const sp=Math.hypot(e.vel.x,e.vel.z); if(sp>.05){ _rq.setFromAxisAngle(_rax.set(e.vel.z/sp,0,-e.vel.x/sp),sp*dt/.75); m.body.quaternion.premultiply(_rq); } const bl=e.st==='blink', fk=bl?1-e.stT/e.def.fuse:0, k=Math.sin(e.t*(bl?16+fk*40:9))>0; m.core.material.color.setHex(k?0xffffff:0xffa040); if(bl) m.warn.scale.setScalar(1.55+fk*.2); },
  crawler(e,dt,m){ crawlGait(m,e,e.vel.length(),dt,e.sc); m.tur.rotation.y=lerpAngle(m.tur.rotation.y,(e.aimYaw||e.yaw)-e.yaw,Math.min(1,dt*10)); m.tur.scale.setScalar(e.ph==='tele'?1.12+Math.sin(e.t*40)*.04:1); },
  howitzer(e,dt,m){ spring(e.jz.rec,0,dt,14,.4); m.mort.rotation.x=.55-e.jz.rec.x*.06+(e.cd<.5&&!e.shell?Math.sin(e.t*30)*.03:0); },
  bulwark(e,dt,m){ m.hex.rotation.z+=dt*1.2; m.hex.scale.setScalar(Math.max(1,m.hex.scale.x-dt*3)); },
  shardling(e,dt,m){ m.body.rotation.y+=dt*(1+(e.ph==='tele'?6:0)); m.body.position.y=1.7+Math.sin(e.t*2)*.2; m.subs.forEach((s,i)=>s.rotation.y+=dt*2.4*(i%2?1:-1)); },
  ram(e,dt,m){ const on=e.st==='tele'||e.st==='rush'; m.glows.forEach(g=>g.scale.setScalar(on?1.25+Math.sin(e.t*40)*.2:1)); m.eye.visible=!(e.st==='tele'&&e.stT<.3&&Math.sin(e.t*60)>0); },
  coil(e,dt,m){ m.rings.forEach((r,i)=>{ if(!r.userData.broken) r.rotation.z+=dt*(1.5+i)*(i%2?1:-1); }); m.orb.scale.setScalar(e.ph==='tele'?1.3+Math.sin(e.t*30)*.15:1+Math.sin(e.t*3)*.06); },
  mender(e,dt,m){ m.body.position.y=2.1+Math.sin(e.t*3)*.15; m.rotors.forEach((p,i)=>{ if(!p.userData.broken) p.rotation.y+=dt*(22+i); }); m.tip.scale.setScalar(e.st==='aim'||e.st==='beam'?1.4+Math.sin(e.t*30)*.2:1);
    const o=e.weld, on=e.st==='beam'&&o&&!o.dead; if(!m.beam){ m.beam=new THREE.Mesh(box(.08,.08,1),basic(0xffa040,true,.85)); m.beam.visible=false; roomGroup.add(m.beam); (e.props||(e.props=[])).push(m.beam); }
    m.beam.visible=!!on; if(on){ m.tip.getWorldPosition(_tmp2); const ax=_tmp2.x, ay=_tmp2.y, az=_tmp2.z, bx=o.pos.x, by=1.5, bz=o.pos.z, L=Math.hypot(bx-ax,by-ay,bz-az)||1;
      m.beam.position.set((ax+bx)/2,(ay+by)/2,(az+bz)/2); m.beam.scale.set(1,1,L); m.beam.lookAt(bx,by,bz); } },
  beacon(e,dt,m){ m.body.position.y=3+Math.sin(e.t*2)*.15; m.halo.rotation.z+=dt*1.5; m.ribbons.forEach((p,i)=>{ p.rotation.x=Math.sin(e.t*3+i)*.25; }); m.core.scale.setScalar(e.ph==='tele'?1.3+Math.sin(e.t*30)*.15:1); },
  herald(e,dt,m){ m.body.position.y=2+Math.sin(e.t*4)*.12; const fold=e.st==='tele'||e.st==='dive'; m.wings.forEach((w,i)=>{ if(!w.userData.broken) w.rotation.y=(i?1:-1)*(fold?.25:.7+Math.sin(e.t*12)*.15); }); },
  dominion(e,dt,m){ if(!e.judging&&!(e.downT>0)) m.plates.rotation.y+=dt*.7; m.plates.position.y+=((e.downT>0?.6:2.1)-m.plates.position.y)*Math.min(1,dt*10); m.halo.rotation.z+=dt; },
  sentry(e,dt,m){ const on=e.ph==='tele'; m.lamps.forEach(l=>{ l.visible=!on||Math.floor(e.t*14)%2===0; }); if(!on) m.drum.rotation.y+=dt*.4; },
  borer(e,dt,m){ m.drill.rotation.z+=dt*(e.st==='rise'||e.st==='dig'?30:8); },
  hopper(e,dt,m){ m.leg.scale.y=e.st==='crouch'?.6:e.st==='air'?1.15:1+Math.sin(e.t*6)*.03; m.head.position.y=.12+2.23*m.leg.scale.y; m.eye.visible=!(e.st==='crouch'&&Math.floor(e.t*20)%2); },
  emissary(e,dt,m){ if(e.st!=='vanish') m.body.position.y=.4+Math.sin(e.t*2.5)*.08; m.halo.rotation.z+=dt*1.5; m.spear.rotation.x=e.st==='aim'||e.st==='lunge'?1.2:0; },
  aureole(e,dt,m){ m.body.position.y=2.6+Math.sin(e.t*2)*.12; m.ringA.rotation.z+=dt*(e.chak&&e.chak.ph==='tele'?16:2); m.ringB.rotation.x+=dt*1.5; },
  cantor(e,dt,m){ m.body.position.y=2.4+Math.sin(e.t*1.6)*.12; m.rings.forEach((r,i)=>{ if(!r.userData.broken) r.rotation.z+=dt*(1+i*.3)*(e.st==='chant'?4:1); }); m.book.rotation.x=e.st==='chant'?-.9:0; },
  cherub(e,dt,m){ m.body.position.y=2.2+Math.sin(e.t*3)*.25; m.halo.rotation.z+=dt*2; const wa=wingBeat(e,dt,14); m.wings.forEach(p=>{ p.rotation.z=p.userData.s*(Math.sin(e.wph+p.userData.k)*(.4+wa*.25)); }); m.aura.scale.setScalar(2*(.95+Math.sin(e.t*2)*.05)); },
  censer(e,dt,m){ m.swing.rotation.z=Math.sin(e.t*1.6)*.28; m.swing.rotation.x=Math.cos(e.t*1.3)*.12; m.orbs.forEach((o,i)=>{ const a=e.t*.8+i*2.1; o.position.set(Math.cos(a)*1.9,-1.4+Math.sin(e.t*1.5+i)*.4,Math.sin(a)*1.9); }); m.glow.scale.setScalar((1+Math.sin(e.t*4)*.12)*(e.ph==='tele'?1.5:1)); },
  ophan(e,dt,m){ if(e.st==='roll') m.body.rotation.x+=e.speed*dt/1.6; else { m.body.rotation.x*=Math.pow(.05,dt); m.rings[0].rotation.z+=dt*(e.st==='tele'?5:1.2); m.rings[1].rotation.x+=dt*(e.st==='tele'?4:1); } m.core.rotation.y+=dt*2; },
  // anticipation: readable wind-ups before attacks
  warden(e,dt,m){ const wu=teleK(e); m.petals.forEach((p,i)=>{ if(!p.userData.broken) p.children[0].rotation.x=-.35-wu*.9; }); m.body.rotation.z+=dt*(.4+wu*3); m.iris.scale.setScalar(1+wu*.5+Math.sin(e.t*5)*.05);
    m.chains.forEach((c,i)=>{ c.rotation.x=Math.sin(e.t*1.8+i)*.25-(e.acz||0)*.01; c.rotation.z=Math.cos(e.t*1.5+i*2)*.25+(e.acx||0)*.01; });
    m.body.position.y=2.6+Math.sin(e.t*2)*.3-wu*.35; m.rings[0].rotation.x+=dt*(1.5+wu*9); m.rings[1].rotation.y+=dt*(1.1+wu*7); m.body.scale.set(1+wu*.12,1-wu*.1,1+wu*.12); m.eye.scale.setScalar(wu>.3?1.3+Math.sin(e.t*40)*.3:1); },
  seraph(e,dt,m){ const wn=teleK(e), ch=e.ph==='charge', wa=wingBeat(e,dt,6); m.body.position.y=2.1+Math.sin(e.t*2.5)*.3*(1-wn)+wn*.3; m.body.position.z=-wn*.9; m.body.position.x=wn?Math.sin(e.t*70)*.09*wn:0; m.body.rotation.x=ch?.5:-wn*.35; m.halo.rotation.z+=dt*(2+wn*14); m.wings.forEach((w,i)=>{ if(!w.userData.broken) w.rotation.x=ch?-.6:Math.sin(e.wph+i)*(.25+wa*.2)-wn*.5; }); if(e.ph!=='tele') m.core.scale.setScalar(1);
    // ribbons stream behind it (more while charging), the core ring spins up in the wind-up
    const sp=Math.hypot(e.vel.x,e.vel.z); m.ribbons.forEach((r,i)=>{ if(!r.userData.broken) r.rotation.x=-clamp(sp*.06,0,1.1)+Math.sin(e.t*5+i*1.3)*.12; }); m.ring.rotation.z+=dt*(1.5+wn*12); },
};

Object.assign(ANIM,ANIM_MS);
// wing beats speed up with acceleration (returns 0..1, how hard it is pulling)
function wingBeat(e,dt,base){ const a=Math.min(1,Math.hypot(e.acx||0,e.acz||0)/18); e.wph=(e.wph||0)+dt*base*(1+a*1.4); return a; }
// lean into acceleration and bank into turns, settling with a little overshoot (juice springs). Mechs do this in mechLean.
function bodyLean(e,dt,k){ const j=e.jz, s=Math.sin(e.yaw), c=Math.cos(e.yaw), fx=e.vel.x+(e.acx||0)*.3, fz=e.vel.z+(e.acz||0)*.3, fwd=fx*s+fz*c, lat=fx*c-fz*s;
  spring(j.lean,clamp(fwd*.02*k,-.2,.2),dt,9,.35); spring(j.roll,clamp(-lat*.028*k,-.3,.3),dt,8,.4); }
// heavy footfall: a dust puff under the planted foot and a thump; Heavies (and the Colossus) shake the screen a little
function footfall(e,m,sc,shk){ const side=Math.floor(e.walk/Math.PI)&1?1:-1, y=e.byaw!=null?e.byaw:e.yaw; dustPuff(e.pos.x+Math.cos(y)*side*.32*sc,e.pos.z-Math.sin(y)*side*.32*sc,sc*.8); sfx('step'); if(shk) shake=Math.max(shake,shk); }

/* ================= ENEMY UPDATE ================= */
function updateEnemies(dt){
  navUpdate(dt); senseUpdate(dt); spotLit=spotNext; spotNext=false;
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
    e.standT=Math.max(0,e.standT-dt); if(e.vulnT>0) e.vulnT-=dt; if(e.mendT>0) e.mendT-=dt;
    if(e.kx||e.kz){ e.pos.x+=e.kx*dt; e.pos.z+=e.kz*dt; const f=Math.exp(-9*dt); e.kx*=f; e.kz*=f; if(Math.abs(e.kx)+Math.abs(e.kz)<.02) e.kx=e.kz=0; }
    if(e.flash>0){e.flash-=dt;if(e.flash<=0)unflash(e);}
    const to=_tmp.subVectors(T,e.pos).setY(0); const d=to.length()||1; to.divideScalar(d);
    const pd=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
    const m=e.model;
    sense(e,dt); e.pathT-=dt;
    if(e.wake>0){ e.wake-=dt; e.vel.multiplyScalar(.8); }
    else if(e.stun>0){ if(!e.stunned){ e.stunned=true; interrupt(e); } e.stun-=dt; e.vel.multiplyScalar(e.frozen>0?0:.85); if(e.frozen>0){ e.frozen-=dt; if(e.frozen<=0) unflash(e); } if(Math.random()<dt*6) sparks(e.pos.clone().setY(2.6),0x5fe0ff,1,2); }
    else { e.stunned=false; if(e.affix) affixTick(e,dt); if(e.hunt) huntAI(e,dt,to,d,pd,m); else if(AI[e.type]){ aiSrc=e; AI[e.type](e,dt,to,d,pd,m); aiSrc=null; if(e.dead) continue; } }
    if(ANIM[e.type]) ANIM[e.type](e,dt,m);
    if(e.stumps&&Math.random()<dt*2.5*e.stumps.length){ pickOne(e.stumps).getWorldPosition(_tmp2); sparks(_tmp2.clone(),0xffc070,1,3); }
    if(e.shieldT>0){ e.shieldT-=dt; if(!e.shM){ e.shM=new THREE.Mesh(new THREE.TorusGeometry(e.r*.9,.06,6,28),basic(0xffd36a,true,.8)); e.shM.rotation.x=Math.PI/2; e.shM.position.y=1.4; e.shM.userData.nofit=1; m.g.add(e.shM); } e.shM.visible=true; e.shM.rotation.z+=dt*3; } else if(e.shM) e.shM.visible=false;
    // acceleration (smoothed): bodies lean into it, wings beat faster
    if(dt>0){ const ax=clamp((e.vel.x-(e.pvx||0))/dt,-60,60), az=clamp((e.vel.z-(e.pvz||0))/dt,-60,60), f=Math.min(1,dt*8); e.acx=(e.acx||0)+(ax-(e.acx||0))*f; e.acz=(e.acz||0)+(az-(e.acz||0))*f; e.pvx=e.vel.x; e.pvz=e.vel.z; }
    for(const o of enemies){ if(o===e||o.dead)continue; const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z,dd=Math.hypot(dx,dz),mn=(e.r+o.r)*.8; if(dd<mn&&dd>.001){ const k=o===boss?1:.5; e.pos.x+=dx/dd*(mn-dd)*k; e.pos.z+=dz/dd*(mn-dd)*k; } }
    e.pos.addScaledVector(e.vel,dt*(e.slow>0?.55:1)*(sortie.rule.moveSpd||1));
    const ox=e.pos.x, oz=e.pos.z;
    if(!e.fly) pushOut(e.pos,e.r*.55);
    e.pos.x=clamp(e.pos.x,-AX+1,AX-1); e.pos.z=clamp(e.pos.z,-AZ+1,AZ-1);
    // Spark bounces off blocks and the mat edge
    if(e.type==='spark'){ const nx=e.pos.x-ox, nz=e.pos.z-oz, nl=Math.hypot(nx,nz); if(nl>1e-3){ const vn=(e.vel.x*nx+e.vel.z*nz)/nl; if(vn<-1){ e.vel.x-=1.75*vn*nx/nl; e.vel.z-=1.75*vn*nz/nl; e.bounceT=.22; e.jz.pop.v+=2.5; sparks(e.pos.clone().setY(.6),0xffa040,2,3); } } }
    if(e.turnFirst&&e.vel.lengthSq()<.3) e.byaw=turnTo(e.byaw,e.yaw,MOVE.turn/(e.def.mass||1)*.6*dt); // standing: the body turns to its aim
    m.g.position.set(e.pos.x,e.dropY,e.pos.z); m.g.rotation.y=e.turnFirst?e.byaw:e.yaw; m.shadow.position.set(e.pos.x,.03,e.pos.z); m.shadow.scale.setScalar(e.sc/e.def.sc/(1+e.dropY*.15));
    if(!(m.legs&&m.hips)&&e.type!=='spark'&&e.type!=='howitzer'&&!e.def.still) bodyLean(e,dt,e.fly?.7:1);
    if(m.legs&&m.hips){ const sp=e.vel.length(), back=sp>.3&&angDiff(Math.atan2(e.vel.x,e.vel.z),e.byaw)>1.6;
      if(stepMech(m,e,sp,dt,e.sc,back?-1:1)&&(e.def.mass||1)>=2.4) footfall(e,m,e.sc,e.type==='heavy'?.06:0);
      // idle: breathing, and the head looks around now and then (straight at you while winding up)
      e.lookT=(e.lookT||0)-dt; if(e.lookT<=0){ e.lookT=rand(1.2,2.8); e.look=e.see?rand(-.3,.3):rand(-.8,.8); }
      mechLean(m,e.jz,dt,e.vel.x+(e.acx||0)*.35,e.vel.z+(e.acz||0)*.35,e.byaw,e.byaw+(e.look||0)*(1-teleK(e)));
      m.torso.rotation.y+=clamp(((e.yaw-e.byaw+Math.PI*3)%(Math.PI*2))-Math.PI,-1.5,1.5);
      const idle=1-(e.walkAmt||0); m.hips.position.y+=Math.sin(e.t*2.3+e.side)*.03*idle; m.torso.rotation.x+=Math.sin(e.t*2.3+e.side+.7)*.035*idle;
      // wind-ups: heavies crouch (deep before a slam, arms up), drones raise the rifle; both stand up after landing
      const wu=teleK(e); if(e.type==='heavy'){ const sl=e.atk===ATK.slam&&(e.ph==='tele'||e.ph==='rec'); m.hips.position.y-=wu*(sl?.5:.35); m.torso.rotation.x-=wu*.3; if(sl&&e.ph==='tele'){ m.arms[0].rotation.x=-2.4*wu; m.arms[1].rotation.x=-1.45-1.1*wu; } } else m.arms[1].rotation.x-=wu*.25;
      if(e.standT>0) m.hips.position.y-=e.standT/.35*.55;
      spring(e.jz.rec,0,dt,20,.4); m.torso.rotation.x-=e.jz.rec.x*.25; m.arms[1].rotation.x-=e.jz.rec.x*.4;
      if(POSE[e.type]){ POSE[e.type](e,dt,m); m.arms[1].rotation.x-=e.jz.rec.x*.4; } }
    applyJuice(m.g,e.jz,dt,e.sc);
    if(e.plate) e.plate.position.set(e.pos.x,e.dropY+e.plate.userData.h,e.pos.z);
    // dark room: you only see enemies near you (and any that are winding up or attacking)
    if(room&&room.dark){ const lit=pd<darkR()+e.r||e.ph==='tele'||e.ph==='charge'||e.st==='aim'||e.st==='lock'||e.st==='blink'||e.st==='tele'||e.st==='roll'||e.dropY>0;
      if(!e.blinkTo) m.g.visible=lit; m.shadow.visible=lit; if(e.plate) e.plate.visible=lit; }
  }
}
