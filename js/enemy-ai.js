// Seraph Breaker · enemy-ai.js: Enemy behaviour: drones, heavies, wardens, seraphs and the arena mobs (AI + ANIM tables), enemy mines.
/* ================= HELPERS ================= */
const _w=new V3();
// distance band + strafe: move in when too far, back off when too close, circle sideways in between
function kite(e,to,d,near,far,str=1){ _w.set(-to.z*e.side*str,0,to.x*e.side*str); if(d>far) _w.add(to); else if(d<near) _w.sub(to); if(_w.lengthSq()>1e-4) _w.normalize(); return _w.multiplyScalar(e.speed); }
// how far a straight line runs before a block or the mat edge
function lineLen(x,z,dx,dz,max,pad=0){ let t=0; while(t<max){ t+=.4; const px=x+dx*t,pz=z+dz*t; if(Math.abs(px)>AX-1||Math.abs(pz)>AZ-1||inBlock(px,pz,pad,'block')) return Math.max(0,t-.4); } return max; }
// ground telegraph strip (fades out on its own)
function teleStrip(pos,dx,dz,len,w,color,life){ const g=new THREE.Group(), mat=addMat(color,.3), pl=new THREE.Mesh(new THREE.PlaneGeometry(w,len),mat); pl.rotation.x=-Math.PI/2; pl.position.z=len/2; g.add(pl); g.position.set(pos.x,.05,pos.z); g.rotation.y=Math.atan2(dx,dz); addFx(g,life,(f,dt,k)=>{ mat.opacity=.18+.22*Math.abs(Math.sin((1-k)*life*9)); }); return g; }
// lobbed shell (howitzer, mine layers): visual arc, then onLand
function lobShell(from,to,dur,color,onLand){ const m=new THREE.Mesh(G.orb,basic(color,false)); m.scale.setScalar(1.2); let done=false; addFx(m,dur,(f,dt,k)=>{ const u=1-k; m.position.set(from.x+(to.x-from.x)*u,from.y*(1-u)+7*4*u*(1-u)+.3,from.z+(to.z-from.z)*u); if(k<=.02&&!done){ done=true; onLand&&onLand(); } }); }
// contact damage, with Thorn Plating paying it back
function contactHurt(e,d){ const before=player.hp; hurt(d); if(player.thorn&&player.hp<before&&!e.dead) hitEnemy(e,d*3*player.st.dmg,e.pos.clone().setY(2),false,true); }
// Spark explosion: hurts you only when it detonates on its own; it always hurts other enemies (chain reactions are queued and capped)
function sparkBoom(e){ if(e.boomed) return; e.boomed=true; queueBlast(e.pos.x,e.pos.z,{t:.02,rad:2.6,dmg:10*ARENAS[stage].hpMul,hurtP:16,color:0xffa040,size:.8,skip:e}); killEnemy(e); }
/* enemy mines (Crawler, Siege Arachne) */
function dropEMine(x,z,arm=.8){ if(emines.length>=14) return; x=clamp(x,-AX+.6,AX-.6); z=clamp(z,-AZ+.6,AZ-.6);
  const g=new THREE.Group(); part(new THREE.CylinderGeometry(.4,.45,.16,8),toon(0x2a2632),g,0,.08,0,.05); const l=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),basic(0xff3a2a,false)); l.position.y=.2; g.add(l);
  const ring=new THREE.Mesh(G.ring,addMat(0xff3a2a,.3)); ring.rotation.x=-Math.PI/2; ring.position.y=.04; ring.scale.setScalar(1.5); g.add(ring); g.position.set(x,0,z); roomGroup.add(g); emines.push({g,l,x,z,arm,life:12}); }
function updateEMines(dt,t){ for(let i=emines.length-1;i>=0;i--){ const m=emines[i]; m.arm-=dt; m.life-=dt; m.l.visible=Math.floor(t*(m.arm>0?3:8))%2===0;
  const pd=player?Math.hypot(player.pos.x-m.x,player.pos.z-m.z):99; let boom=m.life<=0||(m.arm<=0&&!player.dead&&pd<1.4);
  if(boom){ if(m.life>0){ crossBlast(new V3(m.x,0,m.z),0xff5a2a,.6); if(pd<2.2) hurt(14); } roomGroup.remove(m.g); emines.splice(i,1); } } }

/* ================= ARENA MOB AI ================= */
// AI[type](e,dt,to,d,pd,m): to = unit vector to the target, d = its distance, pd = distance to the player, m = model
const AI={
  spark(e,dt,to,d,pd,m){
    if(e.st!=='blink'){ e.vel.lerp(_w.copy(to).multiplyScalar(e.speed),Math.min(1,dt*3)); if(pd<2.6&&!player.dead){ e.st='blink'; e.stT=1; m.warn.visible=true; sfx('click'); } }
    else { e.vel.multiplyScalar(Math.pow(.02,dt)); e.stT-=dt; if(e.stT<=0){ sparkBoom(e); return; } }
    if(e.vel.lengthSq()>.1) e.yaw=Math.atan2(e.vel.x,e.vel.z);
  },
  crawler(e,dt,to,d,pd,m){
    e.flipT=(e.flipT||rand(1,2))-dt; if(e.flipT<=0){ e.flipT=rand(.9,1.8); e.side*=-1; }
    e.vel.lerp(kite(e,to,d,6,10,1.7),Math.min(1,dt*5));
    e.mineT=(e.mineT==null?rand(2,3.5):e.mineT)-dt;
    if(e.mineT<=0){ e.mineT=rand(3.5,5); for(const s of [-1,1]) dropEMine(e.pos.x-to.x*1.3+to.z*s*.9,e.pos.z-to.z*1.3-to.x*s*.9); }
    e.cd-=dt; if(e.cd<=0&&!e.burst&&!player.dead){ e.burst=2; e.bT=0; }
    if(e.burst){ e.bT-=dt; if(e.bT<=0){ e.bT=.13; e.burst--; const y=Math.atan2(to.x,to.z); for(const s of [-1,1]){ const o=new V3(e.pos.x+to.x*1.1+Math.cos(y)*s*.2,1.4,e.pos.z+to.z*1.1-Math.sin(y)*s*.2); shoot('e',o,to.clone(),10*eSpd(),8,0xff5a2a,{life:2.5,r:.4}); } sparks(e.pos.clone().setY(1.6).addScaledVector(to,1.1),0xff8a40,2,3); if(!e.burst) e.cd=rand(2,2.8); } }
    if(e.vel.lengthSq()>.3) e.yaw=lerpAngle(e.yaw,Math.atan2(e.vel.x,e.vel.z),Math.min(1,dt*6)); e.aimYaw=Math.atan2(to.x,to.z);
  },
  howitzer(e,dt,to,d,pd,m){
    e.vel.set(0,0,0); e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*1.5));
    // the bestiary target ring leaves the model and becomes the ground telegraph
    if(!e.ring){ e.ring=m.target; m.g.remove(e.ring); roomGroup.add(e.ring); }
    e.cd-=dt;
    if(e.shell){ const s=e.shell; s.t-=dt; e.ring.scale.setScalar(1.75+Math.sin(s.t*24)*.08); e.ring.material.opacity=.5+(1-s.t/1.2)*.5;
      if(s.t<=0){ e.ring.visible=false; e.shell=null; crossBlast(new V3(s.x,0,s.z),0xff5a2a,.9); if(player&&!player.dead&&Math.hypot(player.pos.x-s.x,player.pos.z-s.z)<2.3) hurt(18); } }
    else if(e.cd<=0&&!player.dead){ e.cd=rand(2.6,3.4); const T=tgt(); e.shell={x:T.x,z:T.z,t:1.2}; e.ring.position.set(T.x,.06,T.z); e.ring.scale.setScalar(1.75); e.ring.visible=true; e.jz.rec.v+=6; sfx('heavy');
      m.mouth.getWorldPosition(_tmp2); lobShell(_tmp2.clone(),new V3(T.x,0,T.z),1.2,0x3a3346); }
  },
  lancer(e,dt,to,d,pd,m){
    e.stT-=dt;
    if(e.st!=='aim'&&e.st!=='lock'){ e.vel.lerp(kite(e,to,d,9,14),Math.min(1,dt*3)); e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*6)); if(Math.random()<dt*.4) e.side*=-1;
      if(e.stT<=0&&!player.dead&&losClear(e.pos.x,e.pos.z,player.pos.x,player.pos.z)){ e.st='aim'; e.stT=1.4; e.blocked=0; } }
    else { e.vel.multiplyScalar(Math.pow(.01,dt));
      if(e.st==='aim'){ e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*7)); if(e.stT<=.35){ e.st='lock'; sfx('click'); } }
      // the red laser tracks you; a block in the way cuts it, and if it stays cut the shot is called off
      const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw), len=lineLen(e.pos.x,e.pos.z,fx,fz,26);
      e.blocked=len<d-1.2?(e.blocked||0)+dt:0;
      const L=len/1.05; m.laser.visible=true; m.laser.scale.set(e.st==='lock'?2.2:1,L/7,e.st==='lock'?2.2:1); m.laser.position.y=-.8-L/2; m.laser.material.opacity=e.st==='lock'?(Math.sin(e.t*50)>0?1:.4):.55;
      if(e.blocked>.45){ e.st='move'; e.stT=rand(1,1.6); m.laser.visible=false; }
      else if(e.stT<=0){ m.muzzle.getWorldPosition(_tmp2); shoot('e',_tmp2.clone().setY(1.6),new V3(fx,0,fz),34*eSpd(),22,0xff3a3a,{life:1.2,r:.42,scale:.9}); e.jz.rec.v+=7; sparks(_tmp2,0xff3a3a,5,6); sfx('heavy'); e.st='move'; e.stT=rand(2.2,3.2); m.laser.visible=false; } }
  },
  bulwark(e,dt,to,d,pd,m){
    e.vel.lerp(_w.copy(to).multiplyScalar(d>3.5?e.speed:0),Math.min(1,dt*2));
    e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*2)); // turns slowly: flank it
    e.cd-=dt; if(e.cd<=0&&d<10&&!player.dead){ e.cd=rand(2.8,3.6); m.muzzle.getWorldPosition(_tmp2); for(let i=-2;i<=2;i++){ const a=e.yaw+i*.16; shoot('e',_tmp2.clone().setY(1.6),new V3(Math.sin(a),0,Math.cos(a)),8.5*eSpd(),11,0xff5a2a,{life:1.6,r:.45}); } e.jz.rec.v+=6; }
  },
  shardling(e,dt,to,d,pd,m){
    e.vel.lerp(kite(e,to,d,6,10),Math.min(1,dt*2)); if(Math.random()<dt*.3) e.side*=-1;
    e.cd-=dt; if(e.cd<=0&&!player.dead){ e.cd=rand(2,2.8); const b=Math.atan2(to.x,to.z); for(let i=-1;i<=1;i++){ const a=b+i*.22; shoot('e',e.pos.clone().setY(1.6*e.sc+.3),new V3(Math.sin(a),0,Math.cos(a)),9*eSpd(),8,0x8fd0ff,{life:.95,r:.4,over:true}); } }
    e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*5));
  },
  cherub(e,dt,to,d,pd,m){
    // flees you and drifts toward its allies; heals and shields everyone inside the green aura
    let ax=0,az=0,n=0; for(const o of enemies){ if(o===e||o.dead||o===boss) continue; ax+=o.pos.x; az+=o.pos.z; n++; }
    _w.set(0,0,0); if(n){ _w.set(ax/n-e.pos.x,0,az/n-e.pos.z); if(_w.lengthSq()>1) _w.normalize(); }
    if(pd<9) _w.addScaledVector(to,-1.6); if(_w.lengthSq()>1) _w.normalize();
    e.vel.lerp(_w.multiplyScalar(e.speed),Math.min(1,dt*2.5));
    const R=4.6; for(const o of enemies){ if(o===e||o.dead||o===boss) continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<R){ o.hp=Math.min(o.maxHp,o.hp+o.maxHp*.06*dt); if(Math.random()<dt*2) sparks(o.pos.clone().setY(2),0x7dff9a,1,2); } }
    e.cd-=dt; if(e.cd<=0){ e.cd=4.5; let k=0; for(const o of enemies){ if(o===e||o.dead||o===boss) continue; if(Math.hypot(o.pos.x-e.pos.x,o.pos.z-e.pos.z)<R){ o.shieldT=3; k++; } } if(k){ groundRing(e.pos,0x7dff9a,R,.6); sfx('shield'); } }
    e.yaw=lerpAngle(e.yaw,Math.atan2(-to.x,-to.z),Math.min(1,dt*3));
  },
  censer(e,dt,to,d,pd,m){
    e.vel.lerp(kite(e,to,d,8,12,.6),Math.min(1,dt*1.5));
    e.cd-=dt; if(e.cd<=0&&!player.dead){ e.cd=rand(3.6,4.6); let live=0; for(const b of bullets) if(b.tag==='censer') live++;
      if(live<12){ const b0=Math.atan2(to.x,to.z); for(let i=-1;i<=1;i++){ const a=b0+i*.7; shoot('e',e.pos.clone().setY(2.2),new V3(Math.sin(a),0,Math.cos(a)),3.6*eSpd(),10,0xffe9a0,{life:6,r:.6,scale:1.35,home:6,turn:1.1,after:3.6,over:true,tag:'censer'}); } sfx('zap'); } }
    e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*3));
  },
  ophan(e,dt,to,d,pd,m){
    e.stT-=dt;
    if(e.st==='tele'){ e.vel.set(0,0,0); if(e.stT<=0){ e.st='roll'; e.dropT=0; } }
    else if(e.st==='roll'){ const r=e.roll; e.vel.set(r.x,0,r.z).multiplyScalar(e.speed); r.done+=e.speed*dt*(e.slow>0?.55:1);
      e.dropT-=dt; if(e.dropT<=0){ e.dropT=.24; for(const s of [-1,1]) shoot('e',e.pos.clone().setY(1.2),new V3(-r.z*s,0,r.x*s),2.4*eSpd(),9,0xffc040,{life:4,r:.45,over:true}); }
      if(pd<e.r+.6&&!player.dead&&!r.hit){ r.hit=true; contactHurt(e,16); }
      if(r.done>=r.len){ e.st='pause'; e.stT=1.2; e.vel.set(0,0,0); e.jz.pop.v=-4; } }
    else { e.vel.multiplyScalar(Math.pow(.02,dt)); // paused: turning, open to fire
      if(e.stT<=0&&!player.dead){ const len=Math.max(3,lineLen(e.pos.x,e.pos.z,to.x,to.z,30,e.r*.6)-.5); e.roll={x:to.x,z:to.z,len,done:0}; e.st='tele'; e.stT=.85; e.yaw=Math.atan2(to.x,to.z); teleStrip(e.pos,to.x,to.z,len,e.r*2,0xffd36a,.85); } }
  },
};
// ANIM[type](e,dt,m): idle and movement animation, from the bestiary's animate()
const ANIM={
  spark(e,dt,m){ m.body.rotation.x+=e.vel.length()*dt*1.4; const bl=e.st==='blink', k=Math.sin(e.t*(bl?14+(1-e.stT)*30:9))>0; m.core.material.color.setHex(k?0xffffff:0xffa040); if(bl) m.warn.scale.setScalar(1.55+(1-e.stT)*.15); },
  crawler(e,dt,m){ const mv=Math.min(1,e.vel.length()/3); m.legs.forEach(l=>{ l.rotation.z=Math.sin(e.t*12+l.userData.i*1.6)*.15*mv; }); m.body.position.y=1.15+Math.abs(Math.sin(e.t*12))*.05*mv; m.tur.rotation.y=lerpAngle(m.tur.rotation.y,(e.aimYaw||e.yaw)-e.yaw,Math.min(1,dt*10)); m.tur.scale.setScalar(e.cd<.35&&!e.burst?1.12+Math.sin(e.t*40)*.04:1); },
  howitzer(e,dt,m){ spring(e.jz.rec,0,dt,14,.4); m.mort.rotation.x=.55-e.jz.rec.x*.06+(e.cd<.5&&!e.shell?Math.sin(e.t*30)*.03:0); },
  bulwark(e,dt,m){ m.hex.rotation.z+=dt*1.2; m.hex.scale.setScalar(Math.max(1,m.hex.scale.x-dt*3)); },
  shardling(e,dt,m){ m.body.rotation.y+=dt*(1+(e.cd<.4?6:0)); m.body.position.y=1.7+Math.sin(e.t*2)*.2; m.subs.forEach((s,i)=>s.rotation.y+=dt*2.4*(i%2?1:-1)); },
  cherub(e,dt,m){ m.body.position.y=2.2+Math.sin(e.t*3)*.25; m.halo.rotation.z+=dt*2; m.wings.forEach(p=>{ p.rotation.z=p.userData.s*(Math.sin(e.t*14+p.userData.k)*.4); }); m.aura.scale.setScalar(2*(.95+Math.sin(e.t*2)*.05)); },
  censer(e,dt,m){ m.swing.rotation.z=Math.sin(e.t*1.6)*.28; m.swing.rotation.x=Math.cos(e.t*1.3)*.12; m.orbs.forEach((o,i)=>{ const a=e.t*.8+i*2.1; o.position.set(Math.cos(a)*1.9,-1.4+Math.sin(e.t*1.5+i)*.4,Math.sin(a)*1.9); }); m.glow.scale.setScalar((1+Math.sin(e.t*4)*.12)*(e.cd<.6?1.5:1)); },
  ophan(e,dt,m){ if(e.st==='roll') m.body.rotation.x+=e.speed*dt/1.6; else { m.body.rotation.x*=Math.pow(.05,dt); m.rings[0].rotation.z+=dt*(e.st==='tele'?5:1.2); m.rings[1].rotation.x+=dt*(e.st==='tele'?4:1); } m.core.rotation.y+=dt*2; },
};

/* ================= ENEMY AI ================= */
function updateEnemies(dt){
  const T=tgt(), small=AZ<10;
  for(const e of enemies.slice()){
    if(e.dead) continue;
    if(e===boss){ updateBoss(dt); continue; }
    e.t+=dt;
    // drop in with the light pillar, land with a squash and stand up
    if(e.dropY>0){ e.dropV-=40*dt; e.dropY=Math.max(0,e.dropY+e.dropV*dt); if(e.dropY===0){ e.jz.pop.v=-7; e.standT=.35; groundRing(e.pos,0xffffff,1.6,.3); sparks(e.pos.clone().setY(.3),0xc8c0d0,4,4); if(e.sc>1) shake=Math.max(shake,.12); } }
    else e.born=Math.min(1,e.born+dt*3);
    e.standT=Math.max(0,e.standT-dt);
    if(e.kx||e.kz){ e.pos.x+=e.kx*dt; e.pos.z+=e.kz*dt; const f=Math.exp(-9*dt); e.kx*=f; e.kz*=f; if(Math.abs(e.kx)+Math.abs(e.kz)<.02) e.kx=e.kz=0; }
    if(e.flash>0){e.flash-=dt;if(e.flash<=0)unflash(e);}
    const to=_tmp.subVectors(T,e.pos).setY(0); const d=to.length()||1; to.divideScalar(d);
    const pd=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
    const m=e.model;
    if(e.wake>0){ e.wake-=dt; e.vel.multiplyScalar(.8); }
    else if(e.stun>0){ e.stun-=dt; e.vel.multiplyScalar(e.frozen>0?0:.85); if(e.frozen>0){ e.frozen-=dt; if(e.frozen<=0) unflash(e); } if(Math.random()<dt*6) sparks(e.pos.clone().setY(2.6),0x5fe0ff,1,2); }
    else if(e.type==='drone'||e.type==='heavy'){
      const want=new V3(), far=(e.type==='heavy'?13:11)*(small?.6:1), near=(e.type==='heavy'?8:6.5)*(small?.6:1);
      if(d>far) want.copy(to); else if(d<near) want.copy(to).negate(); else want.set(-to.z*e.side,0,to.x*e.side);
      if(Math.random()<dt*.3)e.side*=-1;
      e.vel.lerp(want.multiplyScalar(e.speed),Math.min(1,dt*3));
      e.cd-=dt;
      if(e.cd<=0&&!player.dead){ m.muzzle.getWorldPosition(_tmp2); const mz=_tmp2.clone().setY(1.7);
        if(e.type==='heavy'){ e.cd=rand(2,2.8)*(e.elite?.75:1); const b=Math.atan2(to.x,to.z), n=e.elite?3:2; for(let i=-n;i<=n;i++){ const a=b+i*.2; shoot('e',mz,new V3(Math.sin(a),0,Math.cos(a)),8*eSpd(),12,0xff5a2a,{life:3.2,r:.5}); } }
        else { e.cd=rand(1.6,2.6)/eSpd(); shoot('e',mz,to.clone(),9*eSpd(),10,0xff5a2a,{life:3,r:.45}); }
        sparks(mz,0xff8a40,3,3); e.jz.rec.v+=e.type==='heavy'?6:3; }
      e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*8));
    } else if(e.type==='warden'){
      const want=new V3(-to.z*e.side,0,to.x*e.side).multiplyScalar(e.speed), far=small?9:14, near=small?6:10;
      if(d>far) want.addScaledVector(to,e.speed); else if(d<near) want.addScaledVector(to,-e.speed);
      e.vel.lerp(want,Math.min(1,dt*2)); e.cd-=dt;
      m.eye.scale.setScalar(e.cd<.5?1.3+Math.sin(e.t*40)*.3:1);
      if(e.cd<=0){ e.cd=rand(2.4,3.2)*(e.elite?.7:1); const n=e.elite?14:10,off=rand(0,1); for(let i=0;i<n;i++){ const a=(i+off)/n*Math.PI*2; shoot('e',e.pos.clone().setY(1.8),new V3(Math.sin(a),0,Math.cos(a)),6*eSpd(),10,0xffc040,{life:4,r:.45,over:true}); } }
      e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*6));
    } else if(AI[e.type]){ AI[e.type](e,dt,to,d,pd,m); if(e.dead) continue;
    } else {
      e.stT-=dt;
      if(e.st==='hover'){ const want=new V3(-to.z*e.side,0,to.x*e.side).multiplyScalar(e.speed); if(d>8) want.addScaledVector(to,e.speed); else if(d<5) want.addScaledVector(to,-e.speed); e.vel.lerp(want,Math.min(1,dt*2.5)); if(e.stT<=0){ e.st='wind'; e.stT=.65; e.vel.multiplyScalar(.2); } }
      else if(e.st==='wind'){ e.vel.multiplyScalar(.9); e.lock=to.clone(); m.core.scale.setScalar(1.4+Math.sin(e.t*50)*.4); if(e.stT<=0){ e.st='charge'; e.stT=.55; e.vel.copy(e.lock).multiplyScalar(22); e.jz.pop.v=4; } }
      else if(e.st==='charge'){
        if(Math.random()<.5){ const tr=new THREE.Mesh(G.spark,basic(0xffd36a,true)); tr.position.copy(e.pos).setY(2); tr.scale.setScalar(3); addFx(tr,.3,(f,dt,k)=>{tr.scale.setScalar(k*3);}); }
        if(pd<e.r+.5){ contactHurt(e,14); e.vel.multiplyScalar(-.3); e.st='hover'; e.stT=rand(1.5,2.5); }
        else if(decoy&&d<e.r+.5){ e.vel.multiplyScalar(-.3); e.st='hover'; e.stT=rand(1.5,2.5); }
        if(e.stT<=0){ e.st='hover'; e.stT=rand(1.8,3.2); m.core.scale.setScalar(1); } }
      e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*6));
    }
    // anticipation: readable wind-ups before attacks (timings unchanged)
    if(e.type==='warden'){ const wu=e.cd<.5&&!e.stun?1-e.cd/.5:0; m.body.position.y=2.6+Math.sin(e.t*2)*.3-wu*.35; m.rings[0].rotation.x+=dt*(1.5+wu*9); m.rings[1].rotation.y+=dt*(1.1+wu*7); m.body.scale.set(1+wu*.12,1-wu*.1,1+wu*.12); }
    if(e.type==='seraph'){ const wn=e.st==='wind'?1-e.stT/.65:0; m.body.position.y=2.1+Math.sin(e.t*2.5)*.3*(1-wn)+wn*.3; m.body.position.z=-wn*.9; m.body.position.x=wn?Math.sin(e.t*70)*.09*wn:0; m.body.rotation.x=e.st==='charge'?.5:-wn*.35; m.halo.rotation.z+=dt*(2+wn*14); m.wings.forEach((w,i)=>w.rotation.x=e.st==='charge'?-.6:Math.sin(e.t*6+i)*.25-wn*.5); }
    if(ANIM[e.type]) ANIM[e.type](e,dt,m);
    if(e.shieldT>0){ e.shieldT-=dt; if(!e.shM){ e.shM=new THREE.Mesh(new THREE.TorusGeometry(e.r*.9,.06,6,28),basic(0xffd36a,true,.8)); e.shM.rotation.x=Math.PI/2; e.shM.position.y=1.4; e.shM.userData.nofit=1; m.g.add(e.shM); } e.shM.visible=true; e.shM.rotation.z+=dt*3; } else if(e.shM) e.shM.visible=false;
    for(const o of enemies){ if(o===e||o.dead)continue; const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z,dd=Math.hypot(dx,dz),mn=(e.r+o.r)*.8; if(dd<mn&&dd>.001){ const k=o===boss?1:.5; e.pos.x+=dx/dd*(mn-dd)*k; e.pos.z+=dz/dd*(mn-dd)*k; } }
    e.pos.addScaledVector(e.vel,dt*(e.slow>0?.55:1)*(sortie.rule.moveSpd||1));
    if(!e.fly) pushOut(e.pos,e.r*.55);
    e.pos.x=clamp(e.pos.x,-AX+1,AX-1); e.pos.z=clamp(e.pos.z,-AZ+1,AZ-1);
    m.g.position.set(e.pos.x,e.dropY,e.pos.z); m.g.rotation.y=e.yaw; m.shadow.position.set(e.pos.x,.03,e.pos.z); m.shadow.scale.setScalar(e.sc/e.def.sc/(1+e.dropY*.15));
    if(m.legs&&m.hips){ stepMech(m,e,e.vel.length(),dt,e.sc); mechLean(m,e.jz,dt,e.vel.x,e.vel.z,e.yaw,e.yaw);
      // heavies crouch before the fan, drones raise the rifle; both stand up after landing
      const wu=e.cd<.4&&!e.stun&&e.wake<=0?1-e.cd/.4:0; if(e.type==='heavy'){ m.hips.position.y-=wu*.35; m.torso.rotation.x-=wu*.3; } else m.arms[1].rotation.x-=wu*.25;
      if(e.standT>0) m.hips.position.y-=e.standT/.35*.55;
      spring(e.jz.rec,0,dt,20,.4); m.torso.rotation.x-=e.jz.rec.x*.25; m.arms[1].rotation.x-=e.jz.rec.x*.4; }
    applyJuice(m.g,e.jz,dt,e.sc);
  }
}
