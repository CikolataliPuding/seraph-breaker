// Seraph Breaker · main.js: Main loop (frame) and boot. Always loaded last.
/* ================= MAIN LOOP ================= */
let last=performance.now(),hudT=0;
const _sunOff=new V3(-6,32,3);
function roomUpdate(dt,edt){
  if(spawnQ.length&&!enemies.length){ spawnWave(spawnQ); spawnQ=[]; toast('Second wave'); }
  updateEnemies(edt); updateEMines(edt,performance.now()/1000); updateHazards(dt);
  if(room.type!=='boss'&&room.type!=='angel'&&!room.cleared&&!enemies.length&&!spawnQ.length){
    room.cleared=true; if(typeof onRoomClear==='function') onRoomClear();
    openDoor(); saveRun(sortie.ri+1);
    if(!room.hurt&&Math.random()<.35&&arenaRoomType(sortie.ri+2)==='combat') spawnNpc('devil',new V3(rand(-3,3),0,-2));
  }
  if(npc){ npc.t+=dt; npc.m.g.position.y=Math.sin(npc.t*2)*.25; npc.m.g.rotation.y+=dt*.6;
    if(!npc.used&&Math.hypot(player.pos.x-npc.pos.x,player.pos.z-npc.pos.z)<2.4){ npc.used=true; if(npc.kind==='angel') angelChoice(); else devilChoice(); return; } }
  if(door&&door.open){ door.arrow.position.y=.25+Math.sin(performance.now()/200)*.15; if(player.pos.z<-AZ+.3&&Math.abs(player.pos.x)<1.4) goNextRoom(); }
  if(sortie.pendingLv>0&&state==='fight') showLevelUp();
}
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min(.033,(now-last)/1000); last=now;
  if(paused||state==='choice'||state==='result') dt=0;
  const rdt=dt; hsCool=Math.max(0,hsCool-rdt);
  // hitstop freezes the simulation while rendering continues; slow motion only slows enemies and their shots
  if(dt>0&&hitstopT>0){ hitstopT-=dt; dt=0; }
  if(dt>0&&slowT>0) slowT=Math.max(0,slowT-dt);
  const t=now/1000;
  if(state==='menu'){ camTarget.set(Math.sin(t*.12)*6,0,Math.cos(t*.12)*6); if(!$('menu').hidden&&(view==='home'||view==='frames')) renderPreview(t); }
  chrono=Math.max(0,chrono-dt); const eTS=(chrono>0?.3:1)*(slowT>0?.25:1), edt=dt*eTS;
  $('chronoTint').style.opacity=chrono>0||slowT>0?1:0;
  if(toastT>0){ toastT-=dt||.016; if(toastT<=0) $('toast').classList.remove('on'); }
  if(player&&dt>0){
    const act=state==='fight';
    if(['fight','card','warn','cine','bossdeath','trans'].includes(state)){ updatePlayer(dt,act); playTime+=dt; }
    if(state==='card'){ stateT-=dt; if(stateT<=0){ $('card').hidden=true; startRoom(sortie.ri); } }
    else if(state==='warn'){ stateT-=dt; if(stateT<=0){ $('warn').hidden=true; startCine(); } }
    else if(state==='cine'){ stateT-=dt; updateBoss(dt); if(stateT<=0) endCine(); }
    else if(state==='trans'){ stateT-=dt; if(!sortie.swapped&&stateT<=.22){ sortie.swapped=true; const f=sortie.force; sortie.force=null; startRoom(sortie.ri+1,f); } }
    else if(state==='fight'){ roomUpdate(dt,edt); }
    else if(state==='bossdeath'){ const b=boss; stateT-=dt;
      b.model.g.position.set(b.pos.x+rand(-.15,.15),b.y,b.pos.z+rand(-.15,.15));
      if(Math.random()<dt*7){ const p=bossCore(b).add(new V3(rand(-3,3),rand(-3,3),rand(-3,3))); crossBlast(p.setY(Math.max(.2,p.y-3)),Math.random()<.5?0xff2236:0xffd36a,rand(.6,1.1)); }
      if(stateT<=.8&&!b.final){ b.final=true; crossBlast(b.pos.clone().setY(0),0xff2236,3); hitstop(110,true); shatter(b.model,b.pos,0,0,{max:mobileMode?10:22,spd:1.6,cy:b.y+2,crystal:b.def.angel?0xffd36a:0}); scene.remove(b.model.g,b.model.shadow); enemies.slice().forEach(e=>{ if(e!==b&&!e.dead) killEnemy(e); }); enemies.length=0; }
      if(stateT<=0){ boss=null; $('bossHud').hidden=true; pickups.slice().forEach(q=>{ if(q.kind!=='heal'&&q.kind!=='item') collect(q); if(q.kind!=='item'){ scene.remove(q.m); q.gone=true; } }); for(let i=pickups.length-1;i>=0;i--) if(pickups[i].gone) pickups.splice(i,1);
        // the final boss ends the arena; earlier bosses open the door to the next room
        if(sortie.ri>=sortie.N-1) arenaComplete(); else { state='fight'; room.cleared=true; if(typeof onRoomClear==='function') onRoomClear(); openDoor(); saveRun(sortie.ri+1); refreshControls(); } } }
    else if(state==='dying'){ stateT-=dt; updateEnemies(edt); if(stateT<=0) showResult(false); }
    player.meteorCd=Math.max(0,(player.meteorCd||0)-dt);
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
    const b=bullets[i]; const bdt=b.from==='e'?edt:dt; b.life-=bdt;
    if(b.delay>0){ b.delay-=bdt; b.vel.multiplyScalar(Math.pow(.03,bdt)); if(b.delay<=0&&player){ const T=tgt(); b.vel.set(T.x-b.m.position.x,0,T.z-b.m.position.z).setLength(b.after); } }
    else if(b.home>0&&player){ b.home-=bdt; const sp=b.vel.length(), T=tgt(); _tmp.set(T.x-b.m.position.x,0,T.z-b.m.position.z).setLength(sp); b.vel.lerp(_tmp,Math.min(1,bdt*b.turn)).setLength(sp); if(b.home<=0) b.vel.setLength(b.after); }
    else if(b.seek){ if(b.seek.dead) b.seek=nearestFoe(b.m.position,14); if(b.seek){ const sp=b.vel.length(); _tmp.set(b.seek.pos.x-b.m.position.x,0,b.seek.pos.z-b.m.position.z).setLength(sp); b.vel.lerp(_tmp,Math.min(1,bdt*b.turn)).setLength(sp); b.m.lookAt(b.m.position.clone().add(b.vel)); } }
    b.m.position.addScaledVector(b.vel,bdt);
    const p=b.m.position;
    // Wall Bounce: player shots reflect off the room edge and blocks
    if(b.wall>0&&b.from==='p'){ let hitW=false;
      if(Math.abs(p.x)>AX){ p.x=Math.sign(p.x)*AX; b.vel.x*=-1; hitW=true; } else if(Math.abs(p.z)>AZ){ p.z=Math.sign(p.z)*AZ; b.vel.z*=-1; hitW=true; }
      else { const o=inBlock(p.x,p.z,0,'block'); if(o){ const dx=Math.min(p.x-o.x0,o.x1-p.x), dz=Math.min(p.z-o.z0,o.z1-p.z); if(dx<dz){ b.vel.x*=-1; p.x+=b.vel.x>0?dx+.05:-dx-.05; } else { b.vel.z*=-1; p.z+=b.vel.z>0?dz+.05:-dz-.05; } hitW=true; } }
      if(hitW){ b.wall--; b.life=Math.max(b.life,.5); b.m.lookAt(p.clone().add(b.vel)); sparks(p,unit.shot,2,3); if(b.hit) b.hit.clear(); } }
    if(b.life<=0||Math.abs(p.x)>AX+OUTW||Math.abs(p.z)>AZ+OUTW){ if(b.grav) makeHole(p); else if(b.life>0) sparks(p,b.from==='p'?unit.shot:0xff8a40,2,3); killBullet(i); continue; }
    if(!b.over&&obstacles.length&&inBlock(p.x,p.z,0,'block')){ if(b.grav) makeHole(p); sparks(p,b.from==='p'?unit.shot:0xff8a40,3,4); killBullet(i); continue; }
    if(b.from==='p'){
      let gone=false;
      for(const e of enemies){ if(e.dead||e.born<.4)continue; if(b.hit&&b.hit.has(e))continue;
        const shieldPad=e===boss&&boss.barrier>0?1.2:0, r=e.r+b.r*.5+shieldPad, dx=p.x-e.pos.x, dz=p.z-e.pos.z;
        if(dx*dx+dz*dz<r*r){ if(b.grav){ makeHole(p); gone=true; break; }
          // Bulwark: the front shield stops plain shots (pierce and ricochet get through, wall-bounce shots bounce off it)
          if(e.type==='bulwark'&&!b.pierce&&!b.bounce){ const fx=Math.sin(e.yaw),fz=Math.cos(e.yaw),l=Math.hypot(dx,dz)||1; if((dx*fx+dz*fz)/l>.3){ sparks(p,0xffa04a,3,4); sfx('shield'); e.model.hex.scale.setScalar(1.5); e.jz.pop.v+=.6;
            if(b.wall>0){ b.wall--; const dn=b.vel.x*fx+b.vel.z*fz; b.vel.x-=2*dn*fx; b.vel.z-=2*dn*fz; p.x+=fx*.6; p.z+=fz*.6; b.m.lookAt(p.clone().add(b.vel)); } else gone=true; break; } }
          // Archon shield phase: your shots fly back at you
          if(e===boss&&boss.reflectT>0){ const v=new V3(player.pos.x-p.x,0,player.pos.z-p.z).normalize(); shoot('e',p.clone().setY(1.8),v,13*eSpd(),9,0xffd36a,{life:2.4,r:.42,over:true}); sparks(p,0xffd36a,2,4); gone=true; break; }
          hitEnemy(e,b.dmg,p.clone());
          if(b.pierce&&!shieldPad) b.hit.add(e);
          else if(b.bounce>0&&!shieldPad){ b.bounce--; b.hit.add(e); const nx=nearestFoe(e.pos,8,null,b.hit); if(nx){ const sp=b.vel.length(); b.vel.set(nx.pos.x-p.x,0,nx.pos.z-p.z).setLength(sp); b.m.lookAt(p.clone().add(b.vel)); b.life=Math.max(b.life,.6); } else { gone=true; } break; }
          else { gone=true; break; } } }
      if(gone) killBullet(i);
    } else if(player&&!player.dead){
      _tmp.set(p.x-player.pos.x,0,p.z-player.pos.z); const d=_tmp.length();
      if(player.shield&&d<2.6&&d>.01&&_tmp.divideScalar(d).dot(player.aim)>.45){ sparks(p,0xffa04a,4,5); player.en-=7; player.regenDelay=.9; sfx('shield'); if(player.rs.reflect) reflectShot(b); killBullet(i); continue; }
      if(d<3.4&&orbitG.children.length&&orbitBlocks(b)){ killBullet(i); continue; }
      if(d<.75+b.r*.5){ if(player.dashT>.04){ perfectDodge(); continue; } if(tryBarrier(b)){ killBullet(i); continue; } hurt(b.dmg); killBullet(i); continue; }
    }
  }
  if(dt>0) for(let i=shocks.length-1;i>=0;i--){ const s=shocks[i]; s.r+=s.speed*edt; const k=1-s.r/s.max; s.ring.scale.setScalar(s.r); s.wall.scale.set(s.r,.9,s.r); s.ring.material.opacity=k; s.wall.material.opacity=k*.55;
    if(player&&!player.dead&&!s.hit){ const dd=Math.hypot(player.pos.x-s.x,player.pos.z-s.z); if(Math.abs(dd-s.r)<.7){ s.hit=true; hurt(16); } }
    if(s.r>=s.max){ scene.remove(s.ring,s.wall); shocks.splice(i,1); } }
  updateJuice(dt);
  for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; if(dt>0) f.life-=dt; const k=Math.max(0,f.life/f.max); f.upd(f,dt,k); if(f.life<=0){ scene.remove(f.obj); if(f.dispose&&f.obj.geometry) f.obj.geometry.dispose(); fx.splice(i,1); } }
  let want=1;
  if(state==='cine'&&boss){ camTarget.lerp(_tmp.set(boss.pos.x,bossCore(boss).y*.5,boss.pos.z),Math.min(1,(dt||.016)*3)); want=1.55; }
  else if(player&&!player.dead&&dt>0){ if(mobileMode) _tmp.set(0,0,mobileCamZ(player.pos.z)); else _tmp.copy(player.pos).addScaledVector(player.aim,1.5); camTarget.lerp(_tmp,Math.min(1,dt*5)); }
  camZoom+=(want-camZoom)*Math.min(1,(dt||.016)*3); if(Math.abs(cam.zoom-camZoom)>.001){ cam.zoom=camZoom; cam.updateProjectionMatrix(); }
  cam.position.copy(camTarget).add(mobileMode?CAM_OFF_M:CAM_OFF);
  if(shake>0){ cam.position.x+=rand(-1,1)*shake; cam.position.y+=rand(-1,1)*shake*.6; shake=Math.max(0,shake-(dt||.016)*1.8); }
  cam.lookAt(camTarget);
  sun.position.copy(camTarget).add(_sunOff); sun.target.position.copy(camTarget);
  hudT-=dt; if(player&&sortie&&hudT<=0){ hudT=.06; const p=player;
    $('hpBar').firstElementChild.style.width=(Math.max(0,p.hp)/p.maxHp*100)+'%'; $('hpTxt').textContent=Math.ceil(Math.max(0,p.hp))+'/'+p.maxHp;
    $('enBar').firstElementChild.style.width=Math.max(0,p.en/p.enMax*100)+'%'; $('enBar').classList.toggle('hot',p.overheat>0); $('enLbl').textContent=p.overheat>0?'Overheat':'Power'; $('enTxt').textContent=Math.max(0,Math.floor(p.en));
    const spv=p.od>0?p.od/5*100:p.lance>0?p.lance/2.4*100:p.sp; $('spBar').firstElementChild.style.width=spv+'%'; $('spBar').classList.toggle('ready',p.sp>=100); $('spLbl').textContent=SPECIALS[P.unit].name; $('spTxt').textContent=p.sp>=100?'READY':Math.floor(p.sp)+'%';
    $('roomTxt').textContent=String(sortie.ri+1).padStart(2,'0'); $('roomN').textContent='/'+sortie.N;
    $('arTxt').textContent=ARENAS[sortie.a].name.toUpperCase(); $('goldTxt').textContent=P.gold.toLocaleString(); $('gemTxt').textContent=P.gems;
    $('xpFill').style.width=(sortie.xp/xpNeed()*100)+'%'; const lv=$('lvTxt'); if(lv) lv.textContent='LV '+sortie.lv;
    if(boss) $('bossBar').firstElementChild.style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
    const spReady=p.sp>=100&&!busy(); $('abQ').classList.toggle('ready',spReady); $('abQ').style.setProperty('--cd',1-p.sp/100); $('tSP').classList.toggle('ready',spReady); $('tSP').style.setProperty('--cd',1-p.sp/100);
    [0,1].forEach(i=>{ const g=P.gadgets[i]; const f=g?p.gcd[i]/(GADGETS[g].cd*p.st.gadgetCd):0; $(i?'abR':'abE').style.setProperty('--cd',f); $(i?'tG2':'tG1').style.setProperty('--cd',f); });
    const df=p.dashCd/(1.4*p.st.dashCd); $('abS').style.setProperty('--cd',df);
    if(mobileMode){ const pp=$('dashPips').children; for(let i=0;i<pp.length;i++){ pp[i].className=i<p.dashCh?'f':i===p.dashCh?'c':''; pp[i].style.setProperty('--k',i===p.dashCh?p.dashRc/(1.5*p.st.dashCd):0); } }
  }
  renderer.render(scene,cam);
}

/* boot */
initMobile();
initDebug();
applyTheme(0);
makePortraits();
rebuildPreview();
openView('home');
requestAnimationFrame(frame);
