// Seraph Breaker · main.js: Main loop (frame) and boot. Always loaded last.
/* ================= MAIN LOOP ================= */
let last=performance.now(),hudT=0;
// HUD words, translated once (i18n.js): the HUD redraws every 60 ms
const HUD_TXT={heat:t('Overheat'),bar:t('Barrier'),pow:t('Power'),ready:t('READY'),lr:t('LEVEL READY'),max:t('MAX LVL'),fat:t('Fatigue')};
const _sunOff=new V3(-6,32,3);
/* combat room kinds while the room runs: ambush drop, waves (next one when the room thins out, or through the gates on a timer),
   Survive (endless spawns until the timer ends; the leftovers fizzle), Hunt (the elite escapes when the timer ends) */
function roomKinds(dt){
  if(room.ambush){ room.ambushT-=dt; if(room.ambushT<=0){ spawnWave(room.ambush,'ambush'); room.ambush=null; toast(t('Ambush!')); sfx('door'); } return; }
  if(room.stage){ stageWaves(dt); return; }
  const alive=enemies.filter(e=>!e.dead&&!e.minion).length;
  if(spawnQ.length){ room.waveT=(room.waveT==null?99:room.waveT)-dt; if(!alive||room.waveMode==='gate'&&(alive<=2||room.waveT<=0)){ spawnWave(spawnQ.shift(),room.waveMode); room.waveT=9; toast(t(room.waveMode==='gate'?'Reinforcements':'Second wave')); } }
  const T=room.timer; if(!T||room.cleared) return; T.t-=dt;
  if(room.kind==='survive'){ const K=ROOM_KINDS.survive, cap=K.cap[clamp(sortie.a,0,K.cap.length-1)]-(mobileMode?1:0); room.spawnT-=dt;
    if(T.t>1.5&&room.spawnT<=0&&alive<cap){ room.spawnT=rand(1,1.6); const pool=arenaPool(), e=spawnEnemy(pickOne(pool),freeSpot()); if(e) e.rw=K.reward; }
    if(T.t<=0){ room.timer=null; for(const e of enemies.slice()){ if(e.dead||e===boss) continue; e.noLoot=true; killEnemy(e,true); } spawnQ=[]; toast(t('Survived'),t('Room clear')); refreshControls(); } }
  if(room.kind==='hunt'){ const h=enemies.find(e=>e.hunt&&!e.dead);
    if(!h){ room.timer=null; toast(t('Caught')); refreshControls(); }
    else if(T.t<=0){ room.timer=null; crossBlast(h.pos.clone(),0xb070ff,.8); h.dead=true; dropToken(h); if(h.plate) dropPlate(h); scene.remove(h.model.g,h.model.shadow); enemies.splice(enemies.indexOf(h),1); toast(t('Escaped'),t('The elite got away')); refreshControls(); } }
}
function roomUpdate(dt,edt){
  if(room.type!=='boss'&&room.type!=='angel') roomKinds(dt);
  if(ARENAS[stage].stage) stageTick(dt);
  updateEnemies(edt); updateEMines(edt,performance.now()/1000); updateEFields(edt,performance.now()/1000); updateHazards(dt); updateTraps(dt);
  if(room.type!=='boss'&&room.type!=='angel'&&!room.cleared&&!enemies.length&&!spawnQ.length&&!room.ambush&&!(room.timer&&room.kind==='survive')){
    roomCleared();
    if(!room.hurt&&Math.random()<.35&&arenaRoomType(sortie.ri+2)==='combat') spawnNpc('devil',new V3(rand(-3,3),0,-2));
  }
  // after the clear: pickups fly in, then queued level-ups and item swaps open one after another, then the door opens
  if(room.doorPending){ room.clearT+=dt; if(room.clearT>.6&&(room.clearT>3||!pickups.some(q=>q.kind==='item'))&&!pumpChoices()){ room.doorPending=false; openDoor(); saveRun(sortie.ri+1); } if(state!=='fight') return; }
  else if(room.cleared&&choiceQ.length&&pumpChoices()) return;
  if(npc){ npc.t+=dt; npc.m.g.position.y=Math.sin(npc.t*2)*.25; npc.m.g.rotation.y+=dt*.6;
    if(!npc.used&&Math.hypot(player.pos.x-npc.pos.x,player.pos.z-npc.pos.z)<2.4){ npc.used=true; if(npc.kind==='angel') angelChoice(); else devilChoice(); return; } }
  if(door&&door.open){ door.arrow.position.y=.25+Math.sin(performance.now()/200)*.15; if(player.pos.z<-AZ+.3&&Math.abs(player.pos.x)<1.4) goNextRoom(); }
}
function frame(now){
  requestAnimationFrame(frame);
  const raw=clamp((now-last)/1000,0,.033); last=now;
  // debug fast-forward (DBG.turbo): several fixed 1/60 s steps per drawn frame (a 60 Hz screen), for measurement runs in a headless browser
  const n=typeof DBG!=='undefined'&&DBG.turbo>1?DBG.turbo:1;
  for(let i=0;i<n;i++) tick(n>1?1/60:raw,now+i*16.7);
  // the hangar covers the whole screen in the menu: the game scene behind it is not drawn
  if(!(typeof DBG!=='undefined'&&DBG.noRender)&&!(state==='menu'&&HANGAR.on&&!$('menu').hidden)) renderer.render(scene,cam);
}
function tick(dt,now){
  if(BOT.on) botTick(dt);
  const rawDt=dt; beatTick(rawDt); if(paused||state==='choice'||state==='result') dt=0;
  const rdt=dt; hsCool=Math.max(0,hsCool-rdt);
  // hitstop freezes the simulation while rendering continues; slow motion only slows enemies and their shots
  if(dt>0&&hitstopT>0){ hitstopT-=dt; dt=0; }
  if(dt>0&&slowT>0) slowT=Math.max(0,slowT-dt);
  const t=now/1000;
  if(state==='menu'){ camTarget.set(Math.sin(t*.12)*6,0,Math.cos(t*.12)*6); if(!$('menu').hidden&&(view==='home'||view==='frames'||HANGAR.on)) renderPreview(t); }
  chrono=Math.max(0,chrono-dt); const eTS=(chrono>0?.3:1)*(slowT>0?.25:1), edt=dt*eTS;
  $('chronoTint').style.opacity=chrono>0||slowT>0?1:0;
  if(toastT>0){ toastT-=dt||.016; if(toastT<=0) $('toast').classList.remove('on'); }
  if(player&&dt>0){
    const act=state==='fight';
    if(['fight','card','warn','cine','bossdeath','trans','prep'].includes(state)){ updatePlayer(dt,act); playTime+=dt; }
    // a resumed run first shows the level-ups it saved, then starts the room
    if(state==='card'){ stateT-=dt; if(stateT<=0){ $('card').hidden=true; setState('prep'); } }
    else if(state==='prep'){ if(!pumpChoices()){ const f=sortie.force; sortie.force=null; startRoom(sortie.ri,f); } } // force: Retry boss brings back the same boss
    else if(state==='warn'){ stateT-=dt; if(stateT<=0){ $('warn').hidden=true; startCine(); } }
    else if(state==='cine'){ stateT-=dt; updateBoss(dt); if(stateT<=0) endCine(); }
    else if(state==='trans'){ stateT-=dt; if(!sortie.swapped&&stateT<=.22){ sortie.swapped=true; const f=sortie.force; sortie.force=null; startRoom(sortie.ri+1,f); } }
    else if(state==='fight'){ roomUpdate(dt,edt); }
    else if(state==='bossdeath'){ const b=boss; stateT-=dt;
      b.model.g.position.set(b.pos.x+rand(-.15,.15),b.y,b.pos.z+rand(-.15,.15));
      if(Math.random()<dt*7){ const p=bossCore(b).add(new V3(rand(-3,3),rand(-3,3),rand(-3,3))); crossBlast(p.setY(Math.max(.2,p.y-3)),Math.random()<.5?0xff2236:0xffd36a,rand(.6,1.1)); }
      if(stateT<=.8&&!b.final){ b.final=true; crossBlast(b.pos.clone().setY(0),0xff2236,3); hitstop(110,true); shatter(b.model,b.pos,0,0,{max:mobileMode?10:22,spd:1.6,cy:b.y+2,crystal:b.def.angel?0xffd36a:0}); scene.remove(b.model.g,b.model.shadow); enemies.slice().forEach(e=>{ if(e!==b&&!e.dead) killEnemy(e,true); }); enemies.length=0; }
      if(stateT<=0){ boss=null; $('bossHud').hidden=true; pickups.slice().forEach(q=>{ if(q.kind!=='heal'&&q.kind!=='item') collect(q); if(q.kind!=='item'){ scene.remove(q.m); q.gone=true; } }); for(let i=pickups.length-1;i>=0;i--) if(pickups[i].gone) pickups.splice(i,1);
        // the final boss ends the arena (queued level-ups no longer matter); earlier bosses clear the room: choices, then the door
        if(sortie.ri>=sortie.N-1){ logRoomEnd('clear'); arenaComplete(); } else if(setState('fight')){ roomCleared(); refreshControls(); } } }
    else if(state==='dying'){ stateT-=dt; updateEnemies(edt); if(stateT<=0) showResult(false); }
    updateBlasts(edt); updateTrails(dt);
    for(const e of enemies){ if(e.dead) continue; if(e.psnT>0){ e.psnT-=dt; hitEnemy(e,e.psn*.8*player.st.dmg*dt,e.pos,true); if(Math.random()<dt*6) sparks(e.pos.clone().setY(2),0x8aff5a,1,3); if(e.dead) continue; } if(e.burn>0){ e.burn-=dt; hitEnemy(e,3*player.st.dmg*dt,e.pos,true); if(Math.random()<dt*8) sparks(e.pos.clone().setY(2),0xff7a2a,1,3); } if(e.slow>0) e.slow-=dt; }
    if(decoy){ decoy.t-=dt; decoy.m.g.visible=Math.floor(decoy.t*12)%5!==0; if(decoy.t<=0){ scene.remove(decoy.m.g); decoy=null; } }
    if(wingman&&player){ wingman.a+=dt*1.8; wingman.g.position.set(player.pos.x+Math.cos(wingman.a)*2.4,3.4+Math.sin(t*2.5)*.2,player.pos.z+Math.sin(wingman.a)*2.4); wingman.cd-=dt;
      const f=state==='fight'?nearestFoe(wingman.g.position,15):null; if(f){ wingman.g.rotation.y=Math.atan2(f.pos.x-wingman.g.position.x,f.pos.z-wingman.g.position.z); if(wingman.cd<=0){ wingman.cd=player.rs.wing>1?.33:.5; const dir=new V3(f.pos.x-wingman.g.position.x,0,f.pos.z-wingman.g.position.z).normalize(); shoot('p',wingman.g.position.clone().setY(2.4),dir,30,1.4*player.st.dmg,unit.shot,{life:.8}); } } }
    if(buddy&&player){ buddy.t-=dt; buddy.a+=dt*2.2; buddy.g.position.set(player.pos.x+Math.cos(buddy.a)*2.2,3.2+Math.sin(t*3)*.2,player.pos.z+Math.sin(buddy.a)*2.2); buddy.g.rotation.y+=dt*5; buddy.cd-=dt;
      if(buddy.cd<=0&&state==='fight'){ const f=nearestFoe(buddy.g.position,15); if(f){ buddy.cd=.3; const dir=new V3(f.pos.x-buddy.g.position.x,0,f.pos.z-buddy.g.position.z).normalize(); shoot('p',buddy.g.position.clone().setY(2.4),dir,30,1.6*player.st.dmg,0x9ff0ff,{life:.8}); } }
      if(buddy.t<=0){ scene.remove(buddy.g); buddy=null; } }
    for(let i=mines.length-1;i>=0;i--){ const mn=mines[i]; mn.arm-=dt; mn.life-=dt; mn.l.visible=Math.floor(t*(mn.arm>0?4:10))%2===0;
      let boom=mn.life<=0; if(mn.arm<=0) for(const e of enemies){ if(!e.dead&&Math.hypot(e.pos.x-mn.pos.x,e.pos.z-mn.pos.z)<2.2+e.r*.5){ boom=true; break; } }
      if(boom){ if(mn.life>0){ aoe(mn.pos,4,30*player.st.dmg); crossBlast(mn.pos.clone(),0xff6a1a,.8); } scene.remove(mn.g); mines.splice(i,1); } }
    for(let i=holes.length-1;i>=0;i--){ const h=holes[i]; h.t-=dt; h.ring.rotation.z+=dt*6; h.ring2.rotation.z-=dt*3; h.g.scale.setScalar(Math.min(1,(2.4-h.t)*5));
      for(const e of enemies.slice()){ if(e.dead)continue; const dx=h.pos.x-e.pos.x,dz=h.pos.z-e.pos.z,d=Math.hypot(dx,dz); if(d<8&&e!==boss&&d>.3){ e.pos.x+=dx/d*6*dt; e.pos.z+=dz/d*6*dt; } if(d<3+e.r*.5) hitEnemy(e,10*player.st.dmg*dt,e.pos,true); }
      for(let j=bullets.length-1;j>=0;j--){ const b=bullets[j]; if(b.from!=='e')continue; const dx=h.pos.x-b.m.position.x,dz=h.pos.z-b.m.position.z,d=Math.hypot(dx,dz); if(d<1.3) killBullet(j); else if(d<6.5){ b.m.position.x+=dx/d*9*dt; b.m.position.z+=dz/d*9*dt; } }
      if(h.t<=0){ aoe(h.pos,4.8,24*player.st.dmg); crossBlast(h.pos.clone().setY(0),0xb070ff,1.1); scene.remove(h.g); holes.splice(i,1); } }
  }
  if(dt>0) for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i]; if(!b) continue; const bdt=b.from==='e'?edt:dt; b.life-=bdt;
    if(b.delay>0){ b.delay-=bdt; b.vel.multiplyScalar(Math.pow(.03,bdt)); if(b.delay<=0&&player){ const T=tgt(); b.vel.set(T.x-b.m.position.x,0,T.z-b.m.position.z).setLength(b.after); } }
    else if(b.home>0&&player){ b.home-=bdt; const sp=b.vel.length(), T=tgt(); _tmp.set(T.x-b.m.position.x,0,T.z-b.m.position.z).setLength(sp); b.vel.lerp(_tmp,Math.min(1,bdt*b.turn)).setLength(sp); if(b.home<=0) b.vel.setLength(b.after); }
    else if(b.seek){ if(b.seek.dead) b.seek=nearestFoe(b.m.position,14); if(b.seek){ const sp=b.vel.length(); _tmp.set(b.seek.pos.x-b.m.position.x,0,b.seek.pos.z-b.m.position.z).setLength(sp); b.vel.lerp(_tmp,Math.min(1,bdt*b.turn)).setLength(sp); b.m.lookAt(b.m.position.clone().add(b.vel)); } }
    const p=b.m.position, ox=p.x, oz=p.z;
    p.addScaledVector(b.vel,bdt); if(b.fw&&Math.random()<bdt*40) sparks(p,b.fw,1,1.2); // firework trail
    // airborne shots (missiles, Censer orbs): height, shadow and landing marker; a missile that reaches the ground explodes
    if(b.air&&airStep(b,bdt)){ airLand(b); killBullet(i,b); continue; }
    // collisions are swept along this frame's path (ox,oz → p), with the shot's radius, so fast shots and frame spikes cannot skip corners
    const low=!b.air||p.y<AIR_LOW, rr=b.r*.5;
    // Wall Bounce: player shots reflect off the room edge and blocks
    if(b.wall>0&&b.from==='p'){ let hitW=false; const h=obstacles.length?sweepBlock(ox,oz,p.x,p.z,rr):null;
      if(h&&(h.nx||h.nz)){ p.x=ox+(p.x-ox)*h.t+h.nx*.05; p.z=oz+(p.z-oz)*h.t+h.nz*.05; if(h.nx) b.vel.x*=-1; else b.vel.z*=-1; hitW=true; }
      else if(h){ const o=h.o, dx=Math.min(p.x-o.x0,o.x1-p.x), dz=Math.min(p.z-o.z0,o.z1-p.z); if(dx<dz){ b.vel.x*=-1; p.x+=b.vel.x>0?dx+rr+.05:-dx-rr-.05; } else { b.vel.z*=-1; p.z+=b.vel.z>0?dz+rr+.05:-dz-rr-.05; } hitW=true; }
      else if(Math.abs(p.x)>AX){ p.x=Math.sign(p.x)*AX; b.vel.x*=-1; hitW=true; } else if(Math.abs(p.z)>AZ){ p.z=Math.sign(p.z)*AZ; b.vel.z*=-1; hitW=true; }
      if(hitW){ b.wall--; b.life=Math.max(b.life,.5); b.m.lookAt(p.clone().add(b.vel)); sparks(p,unit.shot,2,3); if(b.hit) b.hit.clear(); } }
    if(b.life<=0||Math.abs(p.x)>AX+OUTW||Math.abs(p.z)>AZ+OUTW){ if(b.grav) makeHole(p); else if(b.life>0) sparks(p,b.from==='p'?unit.shot:0xff8a40,2,3); killBullet(i,b); continue; }
    if(low&&obstacles.length&&!b.ghost){ const h=sweepBlock(ox,oz,p.x,p.z,rr); if(h){ p.x=ox+(p.x-ox)*h.t; p.z=oz+(p.z-oz)*h.t; if(b.grav) makeHole(p); sparks(p,b.from==='p'?unit.shot:0xff8a40,3,4); killBullet(i,b); continue; } }
    if(b.from==='p'){
      let gone=false;
      for(const e of enemies){ if(e.dead||e.born<.4||e.under)continue; if(b.hit&&b.hit.has(e))continue;
        const shieldPad=e===boss&&boss.barrier>0?1.2:0, r=e.r+b.r*.5+shieldPad, dx=p.x-e.pos.x, dz=p.z-e.pos.z;
        if(segDist(ox,oz,p.x,p.z,e.pos.x,e.pos.z).d2<r*r){ if(b.grav){ makeHole(p); gone=true; break; }
          // Dominion: its turning plates stop plain shots while they are up
          if(e.type==='dominion'&&!b.pierce&&!b.bounce&&dominionBlocks(e,dx,dz)){ sparks(p,0xffd36a,3,4); sfx('shield'); e.jz.pop.v+=.4; gone=true; break; }
          // Bulwark: the front shield stops plain shots (pierce and ricochet get through, wall-bounce shots bounce off it)
          if(e.type==='bulwark'&&!b.pierce&&!b.bounce){ const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),l=Math.hypot(dx,dz)||1; if((dx*fx+dz*fz)/l>.3){ sparks(p,0xffa04a,3,4); sfx('shield'); e.model.hex.scale.setScalar(1.5); e.jz.pop.v+=.6;
            if(b.wall>0){ b.wall--; const dn=b.vel.x*fx+b.vel.z*fz; b.vel.x-=2*dn*fx; b.vel.z-=2*dn*fz; p.x+=fx*.6; p.z+=fz*.6; b.m.lookAt(p.clone().add(b.vel)); } else gone=true; break; } }
          // Pulse Dancer: her spinning scarves swat 40% of plain shots away (not while she lands, nor piercing shots)
          if(e.type==='dancer'&&e.scarf&&!b.pierce&&Math.random()<.4){ sparks(p,0xff3aa8,3,5); gone=true; break; }
          // Archon shield phase: your shots fly back at you
          if(e===boss&&boss.reflectT>0){ const v=new V3(player.pos.x-p.x,0,player.pos.z-p.z).normalize(); shoot('e',p.clone().setY(1.8),v,13*eSpd(),9,0xffd36a,{life:2.4,r:.42}); sparks(p,0xffd36a,2,4); gone=true; break; }
          hitEnemy(e,b.dmg,p.clone(),false,b.proc,b.flat);
          if(b.pierce&&!shieldPad) b.hit.add(e);
          else if(b.bounce>0&&!shieldPad){ b.bounce--; b.hit.add(e); b.dmg*=BAL.proc.ricochet.falloff; const nx=nearestFoe(e.pos,8,null,b.hit); if(nx){ const sp=b.vel.length(); b.vel.set(nx.pos.x-p.x,0,nx.pos.z-p.z).setLength(sp); b.m.lookAt(p.clone().add(b.vel)); b.life=Math.max(b.life,.6); } else { gone=true; } break; }
          else { gone=true; break; } } }
      // a hit can clear shots (a boss death, High-Co's form change), which moves this shot's index: killBullet finds it again
      if(gone) killBullet(i,b);
    } else if(player&&!player.dead&&(!b.air||p.y<2.4)){
      _tmp.set(p.x-player.pos.x,0,p.z-player.pos.z); const d=_tmp.length(), pr=.75+b.r*.5;
      if(player.shield&&d<2.6&&d>.01&&_tmp.divideScalar(d).dot(player.aim)>.45){ sparks(p,0xffa04a,4,5); player.en-=7; player.regenDelay=.9; sfx('shield'); if(player.rs.reflect) reflectShot(b); killBullet(i,b); continue; }
      if(d<3.4&&orbitG.children.length&&orbitBlocks(b)){ killBullet(i,b); continue; }
      if(d<pr||segDist(ox,oz,p.x,p.z,player.pos.x,player.pos.z).d2<pr*pr){ if(player.dashT>(player.beatDash?0:.04)){ perfectDodge(); continue; } if(tryBarrier(b)){ killBullet(i,b); continue; } hurt(b.dmg); killBullet(i,b); continue; }
    }
  }
  if(dt>0) for(let i=shocks.length-1;i>=0;i--){ const s=shocks[i]; s.r+=s.speed*edt; const k=.35+.65*(1-s.r/s.max); s.ring.scale.setScalar(s.r); s.wall.scale.set(s.r,.9,s.r); s.ring.material.opacity=k; s.wall.material.opacity=k*.55;
    // the wave front is swept between frames (a dash can jump across it); dashing through it is a perfect dodge with a short invulnerability
    if(player&&!player.dead&&!s.hit){ const df=Math.hypot(player.pos.x-s.x,player.pos.z-s.z)-s.r, crossed=Math.abs(df)<.7||(s.pd!=null&&Math.sign(df)!==Math.sign(s.pd)); s.pd=df;
      if(crossed){ s.hit=true; if(player.dashT>0){ player.inv=Math.max(player.inv,.35); perfectDodge(); } else hurt(16); } }
    if(s.r>=s.max){ scene.remove(s.ring,s.wall); shocks.splice(i,1); } }
  // behind the choice screen the world keeps moving in slow motion (effects and debris only; nothing can hurt you)
  const fxdt=state==='choice'&&!paused?rawDt*.15:dt;
  updateJuice(fxdt); updateDust(fxdt);
  for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; if(fxdt>0) f.life-=fxdt; const k=Math.max(0,f.life/f.max); f.upd(f,fxdt,k); if(f.life<=0){ scene.remove(f.obj); fxDispose(f); fx.splice(i,1); } }
  let want=1;
  if(state==='cine'&&boss){ camTarget.lerp(_tmp.set(boss.pos.x,bossCore(boss).y*.5,boss.pos.z),Math.min(1,(dt||.016)*3)); want=1.55; }
  // High-Co entrances: the camera holds on him for a moment with a zoom punch (bosses.js hcCam)
  else if(HC_CAM.t>0&&player&&!player.dead&&dt>0){ HC_CAM.t-=dt; if(mobileMode) _tmp.set(0,0,mobileCamZ(HC_CAM.pos.z)); else _tmp.copy(HC_CAM.pos); camTarget.lerp(_tmp,Math.min(1,dt*4)); want=HC_CAM.zoom; }
  else if(player&&!player.dead&&dt>0){ if(mobileMode) _tmp.set(0,0,mobileCamZ(player.pos.z)); else _tmp.copy(player.pos).addScaledVector(player.aim,1.5); camTarget.lerp(_tmp,Math.min(1,dt*5)); }
  camZoom+=(want-camZoom)*Math.min(1,(dt||.016)*3); if(Math.abs(cam.zoom-camZoom)>.001){ cam.zoom=camZoom; cam.updateProjectionMatrix(); }
  cam.position.copy(camTarget).add(mobileMode?CAM_OFF_M:CAM_OFF);
  if(REDUCED_MOTION) shake=0;
  if(shake>0){ cam.position.x+=rand(-1,1)*shake; cam.position.y+=rand(-1,1)*shake*.6; shake=Math.max(0,shake-(dt||.016)*1.8); }
  cam.lookAt(camTarget);
  sun.position.copy(camTarget).add(_sunOff); sun.target.position.copy(camTarget);
  hudT-=dt; if(player&&sortie&&hudT<=0){ hudT=.06; const p=player;
    $('hpBar').firstElementChild.style.width=(Math.max(0,p.hp)/p.maxHp*100)+'%'; $('hpTxt').textContent=Math.ceil(Math.max(0,p.hp))+'/'+p.maxHp;
    $('enBar').firstElementChild.style.width=Math.max(0,p.en/p.enMax*100)+'%'; $('enBar').classList.toggle('hot',p.overheat>0); $('enLbl').textContent=p.overheat>0?HUD_TXT.heat:mobileMode?HUD_TXT.bar:HUD_TXT.pow; $('enTxt').textContent=Math.max(0,Math.floor(p.en));
    const spv=p.od>0?p.od/5*100:p.lance>0?p.lance/2.4*100:p.sp; $('spBar').firstElementChild.style.width=spv+'%'; $('spBar').classList.toggle('ready',p.sp>=100); $('spLbl').textContent=SPECIALS[P.unit].name; $('spTxt').textContent=p.sp>=100?HUD_TXT.ready:Math.floor(p.sp)+'%';
    $('roomTxt').textContent=String(sortie.ri+1).padStart(2,'0'); $('roomN').textContent='/'+sortie.N;
    // Main Stage: wave counter and the beat pip (it flashes on every beat of the live music)
    const ws=room&&room.stage; $('waveRow').hidden=!ws; if(ws) $('waveTxt').textContent=`${Math.min(ws.w+1,ws.n)}/${ws.n}`;
    const bp=$('beatPip'), bs=!!sortie.rule.beatSync; bp.hidden=!bs; if(bs) bp.classList.toggle('on',BEAT.ph<.25);
    $('arTxt').textContent=ARENAS[sortie.a].name.toLocaleUpperCase(LANG); $('goldTxt').textContent=P.gold.toLocaleString(); $('gemTxt').textContent=P.gems;
    const cap=atCap(); $('xpFill').style.width=(cap?100:sortie.xp/xpNeed()*100)+'%'; const lr=$('lvReady'), pl=sortie.pendingLv; lr.hidden=!pl; if(pl) lr.textContent=pl>1?HUD_TXT.lr+' ×'+pl:HUD_TXT.lr; const lv=$('lvTxt'); if(lv) lv.textContent=cap?HUD_TXT.max:'LV '+sortie.lv;
    { const fr=boss&&boss.def.fatigue?hcFatigue(boss):0, fe=$('bossFat'); fe.hidden=fr<.05; if(fr>=.05) fe.textContent=HUD_TXT.fat+' −'+Math.round(fr*100)+'%'; }
    if(boss) $('bossBar').firstElementChild.style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
    else if(room&&room.timer){ const T=room.timer; $('bossName').textContent=T.name; $('bossPh').textContent=Math.ceil(Math.max(0,T.t))+' s'; $('bossBar').firstElementChild.style.width=Math.max(0,T.t/T.max*100)+'%'; }
    const spReady=p.sp>=100&&!busy(); $('abQ').classList.toggle('ready',spReady); $('abQ').style.setProperty('--cd',1-p.sp/100); $('tSP').classList.toggle('ready',spReady); $('tSP').style.setProperty('--cd',1-p.sp/100);
    [0,1].forEach(i=>{ const g=P.gadgets[i]; const f=g?p.gcd[i]/(GADGETS[g].cd*p.st.gadgetCd):0; $(i?'abR':'abE').style.setProperty('--cd',f); $(i?'tG2':'tG1').style.setProperty('--cd',f); });
    const df=p.dashCd/(1.4*p.st.dashCd); $('abS').style.setProperty('--cd',df);
    // phone barrier charges (Auto): 2 pips like the dash pips
    if(mobileMode){ const bp=$('barPips').children, bc=barrierCharges(), au=barrierAuto(); $('barPips').hidden=!au; if(au) for(let i=0;i<bp.length;i++){ bp[i].className=i<bc.n?'f':i===bc.n?'c':''; bp[i].style.setProperty('--k',i===bc.n?bc.k:0); } }
    if(mobileMode){ const dbt=$('tDash'); dbt.classList.toggle('empty',p.dashCh<1); dbt.style.setProperty('--cd',p.dashCh<1?1-p.dashRc/(1.5*p.st.dashCd):0); }
    if(mobileMode){ const pp=$('dashPips').children; for(let i=0;i<pp.length;i++){ pp[i].className=i<p.dashCh?'f':i===p.dashCh?'c':''; pp[i].style.setProperty('--k',i===p.dashCh?p.dashRc/(1.5*p.st.dashCd):0); } }
  }
  updateCrosshair(rawDt);
  if(room&&room.dark) updateDark();
}

/* dark rooms: a screen overlay with a hole of light around the pilot (bigger on phones) */
const darkR=()=>{ const L=ROOM_KINDS.dark.light; return mobileMode?L.m:L.d; };
let darkOn=false; const _dk=new V3(),_dk2=new V3();
function setDark(on){ darkOn=on; $('dark').hidden=!on; }
function updateDark(){ if(!player||player.dead){ return; } if(!darkOn) setDark(true);
  const p=_dk.copy(player.pos).setY(1).project(cam), x=(p.x+1)/2*innerWidth, y=(1-p.y)/2*innerHeight, R=darkR();
  _dk2.setFromMatrixColumn(cam.matrixWorld,0).setY(0).normalize().multiplyScalar(R).add(player.pos).setY(1).project(cam); const rx=Math.abs((_dk2.x+1)/2*innerWidth-x);
  _dk2.setFromMatrixColumn(cam.matrixWorld,2).setY(0).normalize().multiplyScalar(R).add(player.pos).setY(1).project(cam); const ry=Math.max(rx*.4,Math.abs((1-_dk2.y)/2*innerHeight-y));
  $('dark').style.background=`radial-gradient(ellipse ${rx.toFixed(0)}px ${ry.toFixed(0)}px at ${x.toFixed(0)}px ${y.toFixed(0)}px,rgba(5,3,10,0) 55%,rgba(5,3,10,.55) 80%,rgba(5,3,10,.9) 100%)`; }
/* boot */
initMobile();
initDebug();
applyTheme(0);
makePortraits();
rebuildPreview();
openView('home');
if(!P.lore.intro) storyShow();
newsBoot();
requestAnimationFrame(frame);
