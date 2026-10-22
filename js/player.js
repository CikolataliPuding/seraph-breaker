// Seraph Breaker · player.js: Player stats, movement, dash, barrier, special moves, gadgets and weapons.
/* ================= PLAYER ================= */
function makePlayer(){
  unit=UNITS[P.unit];
  document.documentElement.style.setProperty('--unit',unitCss());
  const c=paint(); const m=buildMech(c.c1,c.c2,c.c3,c.eye,1,P.unit); scene.add(m.g,m.shadow);
  // stats come from balance.js (Core + tree × run buckets); recalcStats() rebuilds them whenever a skill, item or curse changes
  player={model:m,pos:new V3(0,0,6),vel:new V3(),st:null,hp:0,maxHp:0,en:100,overheat:0,regenDelay:0,fireCd:0,dashT:0,dashCd:0,dashDir:new V3(),inv:0,shield:false,aim:new V3(-1,0,-1).normalize(),aimOk:false,lastMove:new V3(0,0,-1),yaw:Math.PI,walk:0,dead:false,flash:0,
    sp:0,od:0,leap:null,lance:0,lanceDir:new V3(),charge:0,prevFire:false,lunge:0,slashSide:1,hook:null,jump:null,gcd:[0,0],secondUsed:false,rs:{},orbA:0,jz:juiceState(),kick:new V3(),wasDash:false,dashCh:2,dashMax:2,dashRc:0,still:0,perfect:false,lives:0,luck:0,echoQ:null,enMax:100,critMul:2,extra:{},procs:{},bonus:null};
  recalcStats(); player.hp=player.maxHp;
  odRing.material.color.setHex(0xffe14a); pBeamO.material.color.setHex(unit.shot);
  buildOrbit(); renderRunSkills();
}
function busy(){ const p=player; return p.leap||p.jump||(p.hook&&p.hook.phase==='pull')||p.lance>0; }
// desktop: dash costs power and has a cooldown. Phone: 2 charges that recharge, no power cost.
// direction: desktop = held keys, else the mouse aim. Phone = flick, else the stick, else the last way you moved; never the auto-aim,
// which locks onto the nearest enemy and would dash you into it.
function tryDash(dir){
  if(state!=='fight'||!player||player.dead||paused||busy()||player.stunT>0) return;
  const p=player;
  if(mobileMode){ if(p.dashCh<1) return; p.dashCh--; }
  else { if(p.overheat>0||p.en<35||p.dashCd>0) return; p.en-=35; p.regenDelay=.9; }
  p.dashT=.17; p.dashCd=1.4*p.st.dashCd; p.perfect=false;
  p.dashDir.copy(dashAim(dir)).normalize();
  groundRing(p.pos,unit.shot,2,.35); sfx('dash'); if(p.mineLayer) placeMine(p.pos);
  // perfect dodge: an enemy shot was about to land (within ~0.15 s)
  for(const b of bullets){ if(b.from!=='e') continue; const rx=p.pos.x-b.m.position.x,rz=p.pos.z-b.m.position.z,vv=b.vel.x*b.vel.x+b.vel.z*b.vel.z; if(vv<1) continue;
    const t=(rx*b.vel.x+rz*b.vel.z)/vv; if(t<0||t>.18) continue; if(Math.hypot(rx-b.vel.x*t,rz-b.vel.z*t)<.75+b.r*.5+.35){ perfectDodge(); break; } }
  if(!p.perfect) for(const s of shocks){ const dd=Math.hypot(p.pos.x-s.x,p.pos.z-s.z); if(!s.hit&&dd>s.r&&dd-s.r<s.speed*.15+.7){ perfectDodge(); break; } }
}
function dashAim(dir){ const p=player, mv=dir&&dir.isVector3&&dir.lengthSq()>.01?dir:moveVec(); return mv.lengthSq()>.01?mv:mobileMode?p.lastMove:p.aim; }
function perfectDodge(){
  const p=player; if(!p||p.perfect) return; p.perfect=true;
  slowmo(.4); if(!(p.od>0||p.lance>0)) p.sp=Math.min(100,p.sp+15); sfx('perfect'); buzz(25);
  groundRing(p.pos,0xffffff,3.2,.45); groundRing(p.pos,unit.shot,2,.3); popText('PERFECT');
}
function trySpecial(){
  if(state!=='fight'||!player||player.dead||paused||busy()) return;
  const p=player; if(p.sp<100||p.od>0) return;
  p.sp=0; sfx('special'); buzz(80);
  const sp=p.st.spPow; // Overload Special: harder and longer
  if(P.unit==='azure'){ p.od=5*(1+(sp-1)*.5); groundRing(p.pos,0xffe14a,6,.6); }
  else if(P.unit==='crimson'){
    let to; if(p.aimOk&&!mobileMode) to=aimPt.clone().setY(0); else to=p.pos.clone().addScaledVector(p.aim,7);
    const d=to.clone().sub(p.pos); if(d.length()>9) d.setLength(9); to=p.pos.clone().add(d); to.x=clamp(to.x,-AX+1,AX-1); to.z=clamp(to.z,-AZ+1,AZ-1);
    p.leap={from:p.pos.clone(),to,t:0,dur:.5};
  }
  else { p.lance=2.4*(1+(sp-1)*.5); p.lanceMax=p.lance; p.lanceDir.copy(p.aim); sfx('beam'); }
}
function useGadget(slot){
  if(state!=='fight'||!player||player.dead||paused||busy()) return;
  const id=P.gadgets[slot], p=player; if(!id||p.gcd[slot]>0) return;
  p.gcd[slot]=GADGETS[id].cd*p.st.gadgetCd; sfx('click');
  // Gadget Echo: the gadget fires a second time a moment later
  if(p.rs.echo&&!p.echoing&&id!=='decoy'&&id!=='drone') p.echoQ={slot,t:.35};
  switch(id){
    case 'hook': p.hook={phase:'out',dist:0,dir:p.aim.clone(),pos:p.pos.clone().setY(2),target:null,end:null}; sfx('dash'); break;
    case 'mines': for(let i=0;i<3;i++){ const a=i/3*Math.PI*2+p.yaw; const pos=p.pos.clone().add(new V3(Math.cos(a)*1.6,0,Math.sin(a)*1.6)); const g=new THREE.Group(); part(new THREE.CylinderGeometry(.45,.5,.18,8),toon(0x2a2632),g,0,.09,0,.06); const l=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),basic(0xff2a2a,false)); l.position.y=.22; g.add(l); g.position.copy(pos); scene.add(g); mines.push({g,l,pos,arm:.6,life:25}); } break;
    case 'jets': { let dir=mobileMode&&!p.autoUse?dashAim().clone():moveVec(); if(dir.lengthSq()<.01) dir=p.aim.clone(); const to=p.pos.clone().addScaledVector(dir.clone().normalize(),8); to.x=clamp(to.x,-AX+1,AX-1); to.z=clamp(to.z,-AZ+1,AZ-1); p.jump={from:p.pos.clone(),to,t:0,dur:.75}; groundRing(p.pos,0xffa04a,2.5,.4); sfx('dash'); break; }
    case 'decoy': { if(decoy) scene.remove(decoy.m.g); const c=paint(); castShadows=false; const m=buildMech(c.c1,c.c2,c.c3,c.eye,1,P.unit); castShadows=true; const holo=addMat(0x5fe0ff,.35); m.g.traverse(o=>{ if(o.isMesh) o.material=o.material===outlineMat?addMat(0x5fe0ff,.12):holo; }); m.g.position.copy(p.pos); m.g.rotation.y=p.yaw; animMech(m,0,0); scene.add(m.g); decoy={m,pos:p.pos.clone(),t:5}; groundRing(p.pos,0x5fe0ff,3,.5); break; }
    case 'emp': { clearEnemyShots(p.pos,9); for(let i=emines.length-1;i>=0;i--){ const m=emines[i]; if(Math.hypot(m.x-p.pos.x,m.z-p.pos.z)<9){ sparks(m.g.position.clone().setY(.4),0x5fe0ff,3,3); roomGroup.remove(m.g); emines.splice(i,1); } } for(const e of enemies){ if(e.dead)continue; if(Math.hypot(e.pos.x-p.pos.x,e.pos.z-p.pos.z)<9+e.r){ if(e===boss){ boss.stun=.9; if(boss.beam){ boss.beam=null; hideBeams(); boss.atk='idle'; boss.atkT=1.2; } } else e.stun=2.5; flashModel(e); } }
      groundRing(p.pos,0x5fe0ff,9,.6); groundRing(p.pos,0xffffff,7,.4); sfx('zap'); shake=.3; break; }
    case 'drone': { if(buddy) scene.remove(buddy.g); const g=new THREE.Group(); part(box(.6,.25,.6),toon(0xe8e8ee),g,0,0,0,.05); const r=new THREE.Mesh(new THREE.TorusGeometry(.5,.04,6,20),basic(unit.shot,false)); r.rotation.x=Math.PI/2; g.add(r); scene.add(g); buddy={g,t:12,a:0,cd:0}; break; }
    case 'chrono': chrono=4; groundRing(p.pos,0x5fe0ff,14,1); sfx('special'); break;
  }
}
const _mv=new V3(),_jv=new V3();
function moveVec(){
  let x=0,z=0;
  // desktop camera is isometric (W = up-left on the ground); the phone camera looks straight at the door (W = -z)
  if(mobileMode){ if(keys.KeyW||keys.ArrowUp)z-=1; if(keys.KeyS||keys.ArrowDown)z+=1; if(keys.KeyA||keys.ArrowLeft)x-=1; if(keys.KeyD||keys.ArrowRight)x+=1; }
  else { if(keys.KeyW||keys.ArrowUp){x-=1;z-=1} if(keys.KeyS||keys.ArrowDown){x+=1;z+=1} if(keys.KeyA||keys.ArrowLeft){x-=1;z+=1} if(keys.KeyD||keys.ArrowRight){x+=1;z-=1} }
  const kl=Math.hypot(x,z); if(kl>0){x/=kl;z/=kl;}
  if(mobileMode){ joyVec(_jv); x+=_jv.x; z+=_jv.z; }
  _mv.set(x,0,z); const l=_mv.length(); if(l>1)_mv.divideScalar(l); return _mv;
}
function nearestFoe(from,maxD=1e9,cone=null,skip=null){ let best=null,bd=maxD*maxD; for(const e of enemies){ if(e.dead||e.born<.4||(skip&&skip.has(e)))continue; const dx=e.pos.x-from.x,dz=e.pos.z-from.z,d=dx*dx+dz*dz; if(d>=bd)continue; if(cone){ const l=Math.sqrt(d)||1; if((dx*cone.x+dz*cone.z)/l<cone.c) continue; } bd=d; best=e; } return best; }
function hurt(d){
  const p=player; if(godMode) return; if(!p||p.dead||p.inv>0||p.dashT>0||p.leap||p.jump||(p.hook&&p.hook.phase==='pull')||state!=='fight') return;
  if(p.aegis){ p.aegis=false; p.inv=.5; hexFlash(p.pos.clone().addScaledVector(p.aim,2)); sparks(p.pos.clone().setY(2),0xb070ff,10,6); popText('AEGIS'); sfx('shield'); return; }
  if(p.st.dodge&&Math.random()<p.st.dodge){ p.inv=.3; sparks(p.pos.clone().setY(2),0xffffff,6,5); popText('DODGE'); return; }
  // every enemy hit and hazard goes through here: the room's damage curve applies once
  d*=roomDmgScale()*p.st.armor*(p.lance>0?.5:1); if(sortie) sortie.dmgTaken=(sortie.dmgTaken||0)+Math.min(d,Math.max(0,p.hp));
  p.hp-=d; p.inv=.55; shake=Math.max(shake,.4); if(d>=14) hitstop(40); p.jz.sq.v+=2; flashModel(p); buzz(40); sfx('hurt'); if(room) room.hurt=true;
  $('vign').style.opacity=1; setTimeout(()=>{ $('vign').style.opacity=player&&!player.dead&&player.hp<player.maxHp*.3?.45:0; },160);
  sparks(p.pos.clone().setY(2),0xff4a3a,10,8);
  if(p.hp<=0) zeroHp();
}
function zeroHp(){
  const p=player; if(godMode){ p.hp=1; return; }
  if(p.lives>0){ p.lives--; p.hp=p.maxHp*.5; p.inv=2; crossBlast(p.pos.clone(),0xffd36a,1.3); clearEnemyShots(p.pos,10); popText('EXTRA LIFE'); return; }
  if(p.st.second&&!p.secondUsed){ p.secondUsed=true; p.hp=p.maxHp*.3; p.inv=1.6; crossBlast(p.pos.clone(),0x7dff9a,1); clearEnemyShots(p.pos,8); return; }
  p.hp=0; p.dead=true; dashArrow.visible=barRing.visible=false; crossBlast(p.pos.clone(),unit.shot,1.6); hitstop(120,true); shatter(p.model,p.pos,0,0,{max:14,spd:1.2}); scene.remove(p.model.g,p.model.shadow); setState('dying'); stateT=1.8; shieldG.visible=false; pBeamO.visible=pBeamC.visible=false; chargeOrb.visible=false; buzz(300);
}
const _tmp=new V3(),_tmp2=new V3(),_mz=new V3();
function shotDir(mz){ const p=player; if(p.aimOk&&!mobileMode){ _tmp2.set(aimPt.x-mz.x,0,aimPt.z-mz.z); if(_tmp2.lengthSq()>2.2) return _tmp2.normalize().clone(); } return p.aim.clone(); }
function updatePlayer(dt,canAct){
  const p=player; if(p.dead) return;
  p.inv=Math.max(0,p.inv-dt); p.dashCd=Math.max(0,p.dashCd-dt); p.gcd[0]=Math.max(0,p.gcd[0]-dt); p.gcd[1]=Math.max(0,p.gcd[1]-dt);
  p.overheat=Math.max(0,p.overheat-dt); p.regenDelay=Math.max(0,p.regenDelay-dt);
  if(p.echoQ){ p.echoQ.t-=dt; if(p.echoQ.t<=0){ const s=p.echoQ.slot; p.echoQ=null; p.echoing=true; p.gcd[s]=0; useGadget(s); p.echoing=false; } }
  if(p.flash>0){p.flash-=dt;if(p.flash<=0)unflash(p);}
  let touchFire=false; p.aimOk=false;
  if(mobileMode){
    if(p.dashCh<p.dashMax){ p.dashRc+=dt; if(p.dashRc>=1.5*p.st.dashCd){ p.dashRc=0; p.dashCh++; } }
    if(hexFlashT>0){ hexFlashT-=dt; if(hexFlashT<=0) shieldG.visible=false; }
    // moving = not firing. Standing still auto-fires at the nearest enemy in sight and slowly steadies the aim (+fire rate).
    const mv=moveVec();
    if(canAct&&mv.lengthSq()>.04){ p.aim.copy(mv).normalize(); p.lastMove.copy(p.aim); p.still=0; }
    else { p.still+=dt; const f=canAct?autoTarget():null; if(f){ _tmp.subVectors(f.pos,p.pos).setY(0); if(_tmp.lengthSq()>.01) p.aim.copy(_tmp.normalize()); touchFire=autoRangeOk(f); } }
    if(canAct) autoGadgets();
    // dash direction arrow under the mech (bright while a charge is ready)
    dashArrow.visible=canAct; if(canAct){ const d=dashAim(); dashArrow.position.set(p.pos.x+d.x*1.55,.09,p.pos.z+d.z*1.55); dashArrow.rotation.y=Math.atan2(-d.x,-d.z); dashArrow.children[0].material.opacity=p.dashCh>=1?.6:.18; }
    // auto barrier: a faint hex ring turns around you while a block is charged
    const autoB=P.mshield!=='manual'&&!p.st.noHex&&p.en>60; barRing.visible=canAct&&autoB; if(barRing.visible){ barRing.position.set(p.pos.x,.12,p.pos.z); barRing.rotation.z+=dt*1.4; barRing.material.opacity=.22+Math.sin(performance.now()/260)*.06+(p.en>90?.1:0); }
  }
  else { dashArrow.visible=barRing.visible=false; }
  // desktop aim: the mouse ray meets the plane at muzzle height, so shots fly exactly through the crosshair
  if(!mobileMode&&usedMouse){ p.model.muzzle.getWorldPosition(_mz); aimPlane.constant=-_mz.y; ray.setFromCamera(ndc,cam); if(ray.ray.intersectPlane(aimPlane,aimPt)){ p.aimOk=true; _tmp.set(aimPt.x-p.pos.x,0,aimPt.z-p.pos.z); if(_tmp.lengthSq()>.3) p.aim.copy(_tmp.normalize()); } }
  const fireIn=canAct&&(mouseDown||keys.KeyJ||touchFire);
  const wantShield=canAct&&!p.st.noHex&&(mobileMode?P.mshield==='manual'&&mShieldHeld:keys.ShiftLeft||keys.ShiftRight||rightDown)&&!busy();
  p.shield=wantShield&&p.overheat<=0&&p.en>0;
  if(p.shield){ p.en-=42*p.st.hexDrain*dt; p.regenDelay=.9; if(p.en<=0){ p.en=0; p.overheat=2.2; p.regenDelay=1.4; p.shield=false; sparks(p.pos.clone().setY(2),0xff4a3a,10,6); if(p.rs.hexnova) hexNova(); } }
  else if(p.regenDelay<=0) p.en=Math.min(p.enMax,p.en+12*p.st.regen*dt);
  const m=p.model; let air=0;
  if(p.od>0) p.od-=dt;
  if(p.leap){ const L=p.leap; L.t+=dt; const k=Math.min(1,L.t/L.dur); p.pos.lerpVectors(L.from,L.to,k); air=Math.sin(Math.PI*k)*4.5; p.vel.set(0,0,0);
    if(k>=1){ p.leap=null; pushOut(p.pos,.7); p.jz.sq.v=-7; hitstop(70,true); aoe(p.pos,7,45*p.st.dmg*p.st.spPow,.8,2.5); crossBlast(p.pos.clone(),0xff4a2a,2); shockwave(p.pos,22,9,0xffa040,true); clearEnemyShots(p.pos,5); buzz(120); } }
  else if(p.jump){ const J=p.jump; J.t+=dt; const k=Math.min(1,J.t/J.dur); p.pos.lerpVectors(J.from,J.to,k); air=Math.sin(Math.PI*k)*3.5; p.vel.set(0,0,0);
    if(k>=1){ p.jump=null; pushOut(p.pos,.7); p.jz.sq.v=-5; aoe(p.pos,4.2,14*p.st.dmg,.6,1.5); groundRing(p.pos,0xffa040,5,.5); sparks(p.pos.clone().setY(.5),0xffa040,10,6); shake=.3; sfx('boom'); } }
  else if(p.hook&&p.hook.phase==='pull'){ const h=p.hook; const dest=h.target&&!h.target.dead?h.target.pos.clone().addScaledVector(h.dir,-(h.target.r+1)):h.end;
    _tmp.set(dest.x-p.pos.x,0,dest.z-p.pos.z); const d=_tmp.length(); const step=32*dt;
    if(d<=step+.1){ p.pos.set(dest.x,0,dest.z); pushOut(p.pos,.7); if(h.target&&!h.target.dead){ if(h.target!==boss) h.target.stun=1.2; hitEnemy(h.target,8*p.st.dmg,h.target.pos.clone().setY(2)); } p.hook=null; groundRing(p.pos,0xffe0a0,2,.3); }
    else p.pos.addScaledVector(_tmp.normalize(),step); p.vel.set(0,0,0); }
  else {
    // stunned (High-Co's slam): no moving or dashing for a moment, stars over the head
    if(p.stunT>0){ p.stunT-=dt; if(Math.random()<dt*14) sparks(p.pos.clone().setY(3.2),0xffd36a,1,2); }
    const mv=(canAct||state==='trans')&&!(p.stunT>0)?moveVec():_tmp2.set(0,0,0);
    const sp=unit.speed*p.st.spd*(p.shield?.45:1)*(p.od>0?1.2:1)*(p.lance>0?0:1);
    if(p.dashT>0){ p.dashT-=dt; p.vel.copy(p.dashDir).multiplyScalar(30);
      if(p.rs.trail){ p.trailT=(p.trailT||0)-dt; if(p.trailT<=0){ p.trailT=.04; dropTrail(p.pos); } }
      if(Math.random()<.6){ const ghost=new THREE.Mesh(box(.9,2.6,.6),addMat(unit.shot,.35)); ghost.position.copy(p.pos).setY(1.6); addFx(ghost,.25,(f,dt,k)=>{ghost.material.opacity=k*.35;}); } }
    else if(p.lunge>0){ p.lunge-=dt; p.vel.copy(p.aim).multiplyScalar(18); }
    else p.vel.lerp(_tmp.copy(mv).multiplyScalar(sp),Math.min(1,dt*12));
    p.pos.addScaledVector(p.vel,dt);
    if(p.kick.lengthSq()>1e-4){ p.pos.addScaledVector(p.kick,dt); p.kick.multiplyScalar(Math.exp(-10*dt)); }
    pushOut(p.pos,.7);
  }
  // the mat has no walls: past the boundary line the hazard zone drains armor every second
  p.pos.x=clamp(p.pos.x,-AX-OUTW,AX+OUTW); p.pos.z=clamp(p.pos.z,-AZ-OUTW,AZ+OUTW);
  const outside=Math.abs(p.pos.x)>AX||Math.abs(p.pos.z)>AZ, atDoor=door&&door.open&&Math.abs(p.pos.x)<1.6&&p.pos.z<0;
  if(outside&&!atDoor&&air===0&&canAct){
    p.hp-=OUT_DPS*p.st.armor*dt; if(sortie) sortie.dmgTaken=(sortie.dmgTaken||0)+OUT_DPS*p.st.armor*dt; if(room) room.hurt=true;
    if(!p.outWarn){ p.outWarn=true; toast('Out of bounds','Get back on the mat'); sfx('hurt'); buzz(60); }
    $('vign').style.opacity=.85; if(Math.random()<dt*10) sparks(p.pos.clone().setY(.4),0xe8243c,1,4);
    if(hazardMat) hazardMat.opacity=.18+Math.sin(performance.now()/90)*.08;
    if(p.hp<=0) zeroHp();
  } else if(p.outWarn){ p.outWarn=false; $('vign').style.opacity=p.hp<p.maxHp*.3?.45:0; if(hazardMat) hazardMat.opacity=.1; }
  const faceDir=p.lance>0?p.lanceDir:p.aim;
  if(p.lance>0) p.lanceDir.lerp(p.aim,Math.min(1,dt*2.2)).normalize();
  p.yaw=lerpAngle(p.yaw,Math.atan2(faceDir.x,faceDir.z),Math.min(1,dt*16));
  m.g.position.set(p.pos.x,air,p.pos.z); m.g.rotation.y=p.yaw; m.shadow.position.set(p.pos.x,.03,p.pos.z); m.shadow.scale.setScalar(1-air/8);
  stepMech(m,p,air>0?0:Math.min(p.vel.length(),14),dt,1);
  // juice: lean into movement with overshoot, torso lag on turns, rifle recoil, dash stretch and landing squash
  mechLean(m,p.jz,dt,p.dashT>0?0:p.vel.x,p.dashT>0?0:p.vel.z,p.yaw,Math.atan2(p.aim.x,p.aim.z));
  spring(p.jz.rec,0,dt,22,.45); spring(p.jz.sq,0,dt,16,.32);
  const rc=p.jz.rec.x; m.arms[1].rotation.x-=rc*.45; m.rifle.position.y=-1.45+rc*.18;
  if(P.unit==='crimson'&&P.weapon==='sig'){ m.torso.position.z=-rc*.12; m.torso.rotation.x-=rc*.14; m.torso.position.x=Math.sin(performance.now()*.09)*rc*.05; }
  if(p.wasDash&&p.dashT<=0) p.jz.sq.v=-3.2; p.wasDash=p.dashT>0;
  let sx=1,sy=1,sz=1; if(p.dashT>0){ const f=Math.abs(p.dashDir.x*Math.sin(p.yaw)+p.dashDir.z*Math.cos(p.yaw)); sz=1+.34*f; sx=1+.34*(1-f); sy=.84; } else if(air>0){ sy=1.08; sx=sz=.95; }
  const q=clamp(p.jz.sq.x,-.5,.5); m.g.scale.set(sx*(1-q*.5),sy*(1+q),sz*(1-q*.5)); m.g.rotation.order='YXZ'; m.g.rotation.x=p.jz.lean.x; m.g.rotation.z=p.jz.roll.x;
  m.g.visible=!(p.inv>0&&Math.floor(p.inv*30)%2===0);
  if(!busy()&&!p.shield) weaponUpdate(dt,fireIn); else { chargeOrb.visible=false; p.charge=0; p.prevFire=fireIn; }
  if(p.lance>0){
    p.lance-=dt; m.muzzle.getWorldPosition(_mz);
    const from=_mz.clone().setY(2.2), end=from.clone().addScaledVector(p.lanceDir,32);
    pBeamO.visible=pBeamC.visible=true; [pBeamO,pBeamC].forEach(b=>{ b.position.copy(from); b.lookAt(end); });
    const w=1.4*(1+Math.sin(performance.now()/30)*.08)*Math.min(1,((p.lanceMax||2.4)-p.lance)*6,p.lance*4); pBeamO.scale.set(w,w,32); pBeamC.scale.set(w*.4,w*.4,32);
    for(const e of enemies.slice()){ if(e.dead)continue; const t=clamp((e.pos.x-from.x)*p.lanceDir.x+(e.pos.z-from.z)*p.lanceDir.z,0,32); const px=from.x+p.lanceDir.x*t,pz=from.z+p.lanceDir.z*t; if(Math.hypot(e.pos.x-px,e.pos.z-pz)<e.r+.9) hitEnemy(e,65*p.st.dmg*p.st.spPow*dt,e.pos,true); }
    for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; if(b.from!=='e')continue; const q=b.m.position,t=clamp((q.x-from.x)*p.lanceDir.x+(q.z-from.z)*p.lanceDir.z,0,32); if(Math.hypot(q.x-from.x-p.lanceDir.x*t,q.z-from.z-p.lanceDir.z*t)<1.3) killBullet(i); }
    if(Math.random()<.5) sparks(end.clone().setY(1),unit.shot,2,6); shake=Math.max(shake,.12);
    if(p.lance<=0) pBeamO.visible=pBeamC.visible=false;
  }
  odRing.visible=p.od>0; if(p.od>0){ odRing.position.set(p.pos.x,.08,p.pos.z); odRing.rotation.z+=dt*4; odRing.material.opacity=.5+Math.sin(performance.now()/80)*.3; }
  updateOrbits(dt,canAct);
  if(p.hook){ const h=p.hook;
    if(h.phase==='out'){ h.dist+=44*dt; h.pos.copy(p.pos).setY(2).addScaledVector(h.dir,h.dist);
      // the line from you to the hook is swept against blocks: the hook stops at the first one (no reaching through walls)
      const hb=sweepBlock(p.pos.x,p.pos.z,h.pos.x,h.pos.z,.2); if(hb){ h.dist*=hb.t; h.pos.copy(p.pos).setY(2).addScaledVector(h.dir,h.dist); }
      for(const e of enemies){ if(e.dead||e.born<.4)continue; if(Math.hypot(e.pos.x-h.pos.x,e.pos.z-h.pos.z)<e.r+.4){ h.target=e; h.phase='pull'; break; } }
      if(h.phase==='out'&&(hb||h.dist>=14||Math.abs(h.pos.x)>AX-1||Math.abs(h.pos.z)>AZ-1)){ h.phase='pull'; h.end=new V3(clamp(h.pos.x-h.dir.x,-AX+1,AX-1),0,clamp(h.pos.z-h.dir.z,-AZ+1,AZ-1)); } }
    const hp=h.target&&!h.target.dead?h.target.pos.clone().setY(2):h.phase==='pull'?h.end.clone().setY(2):h.pos;
    const arr=hookLineGeo.attributes.position.array; arr[0]=p.pos.x;arr[1]=2+air;arr[2]=p.pos.z;arr[3]=hp.x;arr[4]=hp.y;arr[5]=hp.z; hookLineGeo.attributes.position.needsUpdate=true;
    hookLine.visible=hookHead.visible=true; hookHead.position.copy(hp); hookHead.lookAt(hp.clone().add(h.dir)); hookHead.rotateX(Math.PI/2);
  } else hookLine.visible=hookHead.visible=false;
  if(!mobileMode) shieldG.visible=p.shield; else if(p.shield) shieldG.visible=true; else if(hexFlashT<=0) shieldG.visible=false;
  if(p.shield){ shieldG.position.copy(p.pos).addScaledVector(p.aim,1.7).setY(1.9); shieldG.lookAt(_tmp.copy(shieldG.position).add(p.aim)); const t=performance.now()/1000; shRings.forEach((r,i)=>{ const k=((t*1.6+i/3)%1); r.scale.setScalar(.3+k*1.4); r.material.opacity=(1-k)*.9; }); }
  // once the room is clear every pickup (heal orbs and items too) flies to you
  const collectAll=(room&&room.cleared)||(!enemies.length&&!spawnQ.length);
  for(let i=pickups.length-1;i>=0;i--){ const q=pickups[i]; q.t+=dt;
    if(q.t<.45){ q.vel.y-=22*dt; q.m.position.addScaledVector(q.vel,dt); q.m.position.x=clamp(q.m.position.x,-AX+.5,AX-.5); q.m.position.z=clamp(q.m.position.z,-AZ+.5,AZ-.5); if(q.m.position.y<.6){ q.m.position.y=.6; q.vel.y=0; q.vel.multiplyScalar(.5);} }
    else { const d=Math.hypot(p.pos.x-q.m.position.x,p.pos.z-q.m.position.z);
      if(collectAll||(q.kind!=='heal'&&q.kind!=='item'&&d<p.st.magnet)||(q.kind==='heal'&&d<1.8)||(q.kind==='item'&&d<2)){ _tmp.set(p.pos.x-q.m.position.x,1.4-q.m.position.y,p.pos.z-q.m.position.z); const sp=Math.max(8,22-d*2); q.m.position.addScaledVector(_tmp.normalize(),Math.min(d,sp*dt)); }
      else q.m.position.y=.9+Math.sin(q.t*3+i)*.2;
      if(d<1.1){ scene.remove(q.m); pickups.splice(i,1); collect(q); continue; } }
    q.m.rotation.y+=dt*3;
    if(q.t>q.life&&!collectAll){ scene.remove(q.m); pickups.splice(i,1); } }
}
function collect(q){
  const p=player;
  if(q.kind==='item'){ takeItem(q.id); return; }
  if(q.kind==='heal'){ p.hp=Math.min(p.maxHp,p.hp+p.maxHp*q.v*p.st.heal); sparks(q.m.position,0x7dff9a,8,5); sfx('coin'); }
  else if(q.kind==='gem'){ P.gems+=q.v; sortie.gems+=q.v; logEarn('gems','pickup',q.v); sparks(q.m.position,0x5fe0ff,8,5); sfx('gem'); }
  else { const v=Math.max(1,Math.round(q.v*p.st.goldMul)); P.gold+=v; sortie.gold+=v; logEarn('gold',q.src||'kill',v); sfx('coin'); }
}
function weaponUpdate(dt,fireIn){
  const p=player,m=p.model;
  const wp=P.weapon==='sig'?P.unit:P.weapon;
  const rateM=p.st.rate*(p.od>0?.4:1)*(p.rs.storm?.9:1)*(mobileMode?1-.15*Math.min(1,p.still/1.2):1), dmg=p.st.dmg*(p.od>0?1.3*p.st.spPow:1);
  p.fireCd-=dt;
  m.muzzle.getWorldPosition(_mz); const mz=_mz.clone(); const dir=shotDir(mz); const base=Math.atan2(dir.x,dir.z);
  const col=unit.shot;
  const fired=(kick,size=1)=>{ p.jz.rec.v+=kick; muzzleFlash(mz,col,size); };
  if(wp!=='rail') chargeOrb.visible=false;
  switch(wp){
    case 'azure': if(fireIn&&p.fireCd<=0){ p.fireCd=.1*rateM; const a=base+rand(-.025,.025); pshot(mz,new V3(Math.sin(a),0,Math.cos(a)),36,1*dmg,col,{life:.9,pierce:p.od>0}); sparks(mz,col,1,3); fired(1.6,.7); sfx('shot'); } break;
    case 'crimson': if(fireIn&&p.fireCd<=0){ p.fireCd=.32*rateM; for(let i=-2;i<=2;i++){ const a=base+i*.1+rand(-.025,.025); shoot('p',mz,new V3(Math.sin(a),0,Math.cos(a)),rand(28,33),1.05*dmg,col,{geo:G.pel,life:.5,pierce:p.rs.pierce>0,bounce:p.rs.ricochet||0,wall:p.rs.wall||0}); }
      if(p.rs.twin||p.rs.diag||p.rs.rear||p.rs.side||p.rs.storm) pshot(mz,dir,30,1.6*dmg,col,{geo:G.pel,life:.55}); shake=Math.max(shake,.08); fired(5,1.4); sfx('heavy'); } break;
    case 'verdant': if(fireIn&&p.fireCd<=0){ p.fireCd=.42*rateM; pshot(mz,dir,27,3.8*dmg,col,{geo:G.pBig,life:1.2,r:.8,pierce:true}); shake=Math.max(shake,.1); fired(3.5,1.2); p.kick.addScaledVector(dir,-4.5); sfx('heavy'); } break;
    case 'rail':
      // phone: charges while standing and releases on its own at full charge
      if(mobileMode&&fireIn&&p.charge>=1) fireIn=false;
      if(fireIn&&p.fireCd<=0){ p.charge=Math.min(1,p.charge+dt/.9); chargeOrb.visible=true; chargeOrb.position.copy(mz); chargeOrb.scale.setScalar(.4+p.charge*1.4); chargeOrb.material.color.setHex(p.charge>=1?0xffffff:col); }
      else if(!fireIn&&p.prevFire&&p.charge>.08){ const c=p.charge; p.charge=0; chargeOrb.visible=false; p.fireCd=.3*rateM;
        // the rail stops at the first block in its path
        const rb=sweepBlock(mz.x,mz.z,mz.x+dir.x*40,mz.z+dir.z*40,.1), len=rb?Math.max(.5,40*rb.t):40;
        const end=mz.clone().addScaledVector(dir,len); const d=(4+20*Math.pow(c,1.5))*dmg;
        for(const e of enemies.slice()){ if(e.dead)continue; const t=clamp((e.pos.x-mz.x)*dir.x+(e.pos.z-mz.z)*dir.z,0,len); if(Math.hypot(e.pos.x-mz.x-dir.x*t,e.pos.z-mz.z-dir.z*t)<e.r+.35) hitEnemy(e,d,e.pos.clone().setY(2)); }
        beamFlash(mz,end,col,.35+c*.6); shake=Math.max(shake,.15+c*.3); fired(2+c*4,.8+c); p.kick.addScaledVector(dir,-c*6); if(c>.9) hitstop(50); sfx(c>.9?'beam':'heavy'); }
      else if(!fireIn){ p.charge=0; chargeOrb.visible=false; }
      break;
    case 'torch':
      if(fireIn){ const n=mobileMode?1:2; for(let i=0;i<n;i++){ const a=base+rand(-.32,.32); const pm=new THREE.Mesh(G.puff,addMat(Math.random()<.5?0xff8a30:0xffd040,.8)); pm.position.copy(mz); const v=new V3(Math.sin(a),rand(-.05,.1),Math.cos(a)).multiplyScalar(rand(12,16)); addFx(pm,.38,(f,dt,k)=>{ pm.position.addScaledVector(v,dt); pm.scale.setScalar(.5+(1-k)*2.4); pm.material.opacity=k*.75; }); }
        for(const e of enemies.slice()){ if(e.dead)continue; const dx=e.pos.x-p.pos.x,dz=e.pos.z-p.pos.z,d=Math.hypot(dx,dz); if(d<6.8+e.r*.5&&d>.01&&(dx*dir.x+dz*dir.z)/d>.82){ hitEnemy(e,20*dmg*dt,e.pos,true); if(p.rs.torch) e.burn=2.5; if(p.rs.cryo) e.slow=1.3; } }
        for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; if(b.from!=='e')continue; const dx=b.m.position.x-p.pos.x,dz=b.m.position.z-p.pos.z,d=Math.hypot(dx,dz); if(d<3.5&&d>.01&&(dx*dir.x+dz*dir.z)/d>.8) killBullet(i); }
        sfx('torch'); }
      break;
    case 'arc':
      if(fireIn&&p.fireCd<=0){ p.fireCd=.42*rateM; const hit=new Set(); let cur=nearestFoe(p.pos,12,{x:dir.x,z:dir.z,c:.45})||nearestFoe(p.pos,6); let from=mz.clone();
        if(!cur) bolt(from,from.clone().addScaledVector(dir,6),col);
        fired(1.2,.6);
        for(let j=0;j<4+(p.rs.twin||0)&&cur;j++){ hit.add(cur); const to=cur.pos.clone().setY(2); bolt(from,to,j?0xbfe8ff:col); hitEnemy(cur,4.5*dmg,to); from=to; cur=nearestFoe(cur.pos,6,null,hit); }
        sfx('zap'); }
      break;
    case 'blade':
      if(fireIn&&p.fireCd<=0){ p.fireCd=.36*rateM; p.lunge=.11; p.slashSide*=-1;
        const g=new THREE.Group(); const s=new THREE.Mesh(G.slash,addMat(col,.9)); s.rotation.x=-Math.PI/2; s.scale.x=p.slashSide; g.add(s); g.position.set(p.pos.x,1.8,p.pos.z); g.rotation.y=base;
        addFx(g,.18,(f,dt,k)=>{ if(player) g.position.set(player.pos.x,1.8,player.pos.z); s.material.opacity=k; s.scale.y=1+(1-k)*.25; });
        const reach=3.8+(p.rs.twin?.6:0);
        for(const e of enemies.slice()){ if(e.dead)continue; const dx=e.pos.x-p.pos.x,dz=e.pos.z-p.pos.z,d=Math.hypot(dx,dz); if(d<reach+e.r*.6&&(d<.01||(dx*dir.x+dz*dir.z)/d>.3)) hitEnemy(e,8.5*dmg,e.pos.clone().setY(2)); }
        for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; if(b.from!=='e')continue; const dx=b.m.position.x-p.pos.x,dz=b.m.position.z-p.pos.z,d=Math.hypot(dx,dz); if(d<reach&&(d<.01||(dx*dir.x+dz*dir.z)/d>.2)){ sparks(b.m.position,col,2,4); killBullet(i); } }
        sfx('slash'); shake=Math.max(shake,.1); p.jz.rec.v-=3; }
      break;
    case 'swarm':
      if(fireIn&&p.fireCd<=0){ p.fireCd=.5*rateM; const n=1+(p.rs.twin||0); for(let i=-n;i<=n;i+=2){ const a=base+i*.5; const st=p.pos.clone().setY(2.8).add(new V3(Math.cos(p.yaw)*i*.6,0,-Math.sin(p.yaw)*i*.6)); const t=nearestFoe(p.pos,18,{x:dir.x,z:dir.z,c:.2})||nearestFoe(p.pos,18); shoot('p',st,new V3(Math.sin(a),0,Math.cos(a)),15,3.4*dmg,0xffd060,{geo:G.mis,life:2.2,seek:t,turn:7}); } p.jz.rec.v+=1; sfx('shot'); }
      break;
    case 'grav':
      if(fireIn&&p.fireCd<=0){ p.fireCd=1.8*rateM; shoot('p',mz,dir,10,6*dmg,0xb070ff,{geo:G.gorb,life:.85,r:.6,grav:true}); fired(4,1.3); p.kick.addScaledVector(dir,-3); sfx('heavy'); }
      break;
  }
  p.prevFire=fireIn;
}
function makeHole(pos){
  const g=new THREE.Group(); const core=new THREE.Mesh(new THREE.SphereGeometry(.7,16,12),new THREE.MeshBasicMaterial({color:0x05030a})); const ring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.14,8,40),addMat(0xb070ff,.85)); ring.rotation.x=Math.PI/2; const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.4,.05,6,48),addMat(0xff7ad0,.5)); ring2.rotation.x=Math.PI/2.3;
  g.add(core,ring,ring2); g.position.set(pos.x,1.6,pos.z); scene.add(g); holes.push({g,ring,ring2,t:2.4,pos:g.position}); sfx('beam');
}
