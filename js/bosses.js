// Seraph Breaker · bosses.js: Boss spawning, attack patterns (bossTick), beams and the cinematic intro.
/* ================= BOSSES ================= */
function spawnBoss(kind){
  const def=BOSSES[kind]; const m=BOSS_BUILD[kind]();
  boss={kind,def,model:m,pos:new V3(0,0,-6),vel:new V3(),hp:def.hp,maxHp:def.hp,r:def.r,t:0,flash:0,atk:'enter',atkT:99,phase:1,barrier:0,barrierCd:9,y:32,base:def.fly,spinA:0,beam:null,yaw:0,walk:0,lastAtk:'',stun:0,born:1,burn:0,slow:0,jz:juiceState(),dropY:0,sc:m.g.scale.x};
  scene.add(m.g,m.shadow); enemies.push(boss);
  $('bossName').textContent=def.name.toUpperCase(); $('bossPh').textContent='PHASE I'; $('bossImg').src=PORTRAIT[kind]||'';
}
const toDir=b=>{ const T=tgt(); return new V3(T.x-b.pos.x,0,T.z-b.pos.z).normalize(); };
const bossCore=b=>new V3(b.pos.x,b.kind==='colossus'?6:b.y,b.pos.z);
function bossStartAttack(b){
  const pool=b.def.pool[b.phase-1]; let a=pickOne(pool); if(a===b.lastAtk) a=pickOne(pool);
  if(a==='summon'&&enemies.length>4) a=pool[0];
  b.atk=a; b.lastAtk=a; b.atkT=0; b.subT=0; b.slam=0; b.slam2=-1;
  if(a==='beam') b.beam={t:0,fire:false,dir:toDir(b),sweep:0,tele:1.1,dur:.9};
  if(a==='sweep'){ const d=toDir(b),s=Math.random()<.5?-1:1,ang=Math.atan2(d.x,d.z)-s*1.15; b.beam={t:0,fire:false,dir:new V3(Math.sin(ang),0,Math.cos(ang)),sweep:s*(b.phase===3?1.7:1.4),tele:.9,dur:1.6}; }
  if(a==='slam'){ groundRing(b.pos,0xff2236,7,.9); groundRing(b.pos,0xff2236,4,.6); }
}
function bossTick(b,dt,to){
  const o=new V3(b.pos.x,1.8,b.pos.z),ph=b.phase,sp=eSpd(),ov=b.def.angel; b.atkT+=dt; b.subT-=dt;
  switch(b.atk){
    case 'ring':{ const n=ph===1?20:ph===2?26:32,rings=ph===3?2:1; for(let r=0;r<rings;r++) for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+r*(Math.PI/n)+b.t; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),(7+r*2.2)*sp,12,0xff3a5a,{life:4,r:.5,scale:1.15,over:ov}); } crossBlast(o.clone().setY(0),0xff3048,.6); return true; }
    case 'spiral': if(b.subT<=0){ b.subT=ph===3?.06:.09; b.spinA+=.27; const arms=ph===1?3:4; for(let k=0;k<arms;k++){ const a=b.spinA+k*Math.PI*2/arms; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),7.5*sp,10,0xff8a3a,{life:4,r:.45,over:ov}); } } return b.atkT>2.6;
    case 'aimed': if(b.subT<=0){ b.subT=.4; const base=Math.atan2(to.x,to.z); for(let i=-1;i<=1;i++){ const a=base+i*.16; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),12*sp,12,0xff5a2a,{life:3,r:.45,over:ov}); } } return b.atkT>1.6;
    case 'burst': if(b.subT<=0){ b.subT=ph===3?.08:.11; b.model.muzzle.getWorldPosition(_tmp2); const mz=_tmp2.clone().setY(1.8); const T=tgt(); const base=Math.atan2(T.x-mz.x,T.z-mz.z)+rand(-.09,.09); shoot('e',mz,new V3(Math.sin(base),0,Math.cos(base)),13,9,0xff5a2a,{life:3,r:.45}); sparks(mz,0xff8a40,2,4); b.jz.rec.v+=2.5; } return b.atkT>1.5;
    case 'missiles':{ const n=ph===1?8:ph===2?12:16; for(let i=0;i<n;i++){ const a=b.yaw+Math.PI+(i/(n-1)-.5)*Math.PI*1.6; const st=o.clone().add(new V3(Math.sin(a)*2,0,Math.cos(a)*2)); shoot('e',st,new V3(Math.sin(a),0,Math.cos(a)),5,11,0xffb040,{life:5,r:.45,home:1.6,turn:2.4,after:11,over:true}); } sparks(o.clone().setY(5),0xffb040,10,6); return true; }
    case 'slam': if(!b.slam&&b.atkT>.9){ b.slam=1; shockwave(b.pos,13,26); crossBlast(b.pos.clone(),0xff3a2a,.8); if(ph===3) b.slam2=.4; } if(b.slam2>0){ b.slam2-=dt; if(b.slam2<=0) shockwave(b.pos,9,26); } return b.atkT>1.5;
    case 'summon':{ const n=ph===3?3:2; for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2); spawnEnemy(b.def.minion,new V3(clamp(b.pos.x+Math.cos(a)*5,-AX+2,AX-2),0,clamp(b.pos.z+Math.sin(a)*5,-AZ+2,AZ-2))); } return true; }
    case 'shards':{ const n=ph>=2?12:8; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+b.t; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),9,12,0x8fd0ff,{life:5,r:.45,delay:.75,after:15+stage*1.5,over:true}); } return true; }
    case 'beam': case 'sweep': return updateBeam(b,dt);
  }
  return true;
}
function updateBeam(b,dt){
  const bm=b.beam; bm.t+=dt; const core=bossCore(b);
  if(!bm.sweep&&bm.t<bm.tele*.7) bm.dir.lerp(toDir(b),Math.min(1,dt*6)).normalize();
  if(bm.t>=bm.tele&&!bm.fire){ bm.fire=true; shake=.5; buzz(60); sfx('beam'); }
  if(bm.fire&&bm.sweep){ const a=Math.atan2(bm.dir.x,bm.dir.z)+bm.sweep*dt; bm.dir.set(Math.sin(a),0,Math.cos(a)); }
  const target=new V3(b.pos.x+bm.dir.x*10,1.2,b.pos.z+bm.dir.z*10), dir3=target.clone().sub(core).normalize(), len=core.y/Math.max(.01,-dir3.y), end=core.clone().addScaledVector(dir3,len);
  beams.forEach(x=>{ x.position.copy(core); x.lookAt(end); });
  if(!bm.fire){ beamTele.visible=true; const w=.12+Math.sin(bm.t*40)*.04; beamTele.scale.set(w,w,len); beamTele.material.opacity=.4+bm.t*.3; }
  else { beamTele.visible=false; beamOuter.visible=beamCore.visible=true;
    const k=Math.min(1,(bm.t-bm.tele)*8),w=(b.phase===3?1.5:1.15)*k*(1+Math.sin(bm.t*60)*.08); beamOuter.scale.set(w,w,len); beamCore.scale.set(w*.45,w*.45,len);
    if(Math.random()<.5) sparks(end,0xff4a7a,3,8);
    const ax=core.x,az=core.z,vx=end.x-ax,vz=end.z-az,px=player.pos.x,pz=player.pos.z,t=clamp(((px-ax)*vx+(pz-az)*vz)/(vx*vx+vz*vz),0,1),dd=Math.hypot(px-(ax+vx*t),pz-(az+vz*t));
    if(dd<w+.5&&!player.dead){ const blocked=player.shield&&player.aim.dot(_tmp2.set(-bm.dir.x,0,-bm.dir.z))>.5; if(blocked){ player.en-=60*dt; player.regenDelay=.9; sparks(shieldG.position,0xffa04a,2,6); }
      // the phone barrier cannot stop a beam, it only halves it while power lasts
      else if(mobileMode&&!player.st.noHex&&player.en>60){ player.en-=45*dt; player.regenDelay=1.2; hexFlash(core); hurt(11); } else hurt(22); } }
  if(bm.t>bm.tele+bm.dur){ hideBeams(); b.beam=null; return true; }
  return false;
}
function updateBoss(dt){
  const b=boss,m=b.model,def=b.def; b.t+=dt;
  if(b.flash>0){b.flash-=dt;if(b.flash<=0)unflash(b);}
  const T=tgt(); const to=_tmp.subVectors(T,b.pos).setY(0); const d=to.length()||1; to.divideScalar(d);
  const pd=Math.hypot(player.pos.x-b.pos.x,player.pos.z-b.pos.z);
  const newPh=b.hp<b.maxHp*.33?3:b.hp<b.maxHp*.66?2:1;
  if(newPh!==b.phase&&b.atk!=='enter'){ b.phase=newPh; $('bossPh').textContent='PHASE '+['I','II','III'][newPh-1]; groundRing(b.pos,0xff2236,14,1); shake=.6; hitstop(85,true); b.jz.pop.v=-8; if(def.barrier) b.barrier=3; b.atk='idle'; b.atkT=.7; b.beam=null; hideBeams(); clearEnemyShots(); }
  const cool=[1.3,1,.72][b.phase-1];
  if(b.atk==='enter'){ b.y+=(b.base-b.y)*Math.min(1,dt*2.6); b.atkT-=dt;
    if(b.atkT<=0){ b.y=b.base; b.atk='idle'; b.atkT=1; groundRing(b.pos,ARENAS[stage].theme.edge,16,1.2); crossBlast(b.pos.clone(),0xff6a1a,1.2); shake=.8; buzz(120); } }
  else if(b.stun>0){ b.stun-=dt; b.vel.multiplyScalar(.9); if(Math.random()<dt*8) sparks(bossCore(b),0x5fe0ff,2,4); b.pos.addScaledVector(b.vel,dt); }
  else {
    if(def.fly){ b.y=b.base+Math.sin(b.t*1.3)*.35; const orbit=new V3(Math.cos(b.t*.25)*7,0,Math.sin(b.t*.25)*7-2); const want=orbit.sub(b.pos).multiplyScalar(.6); if(d<7) want.addScaledVector(to,-4); if(b.beam&&b.beam.fire) want.multiplyScalar(.1); b.vel.lerp(want,Math.min(1,dt*1.5)); }
    else { const spd=b.phase===3?3.6:2.6; let want; if(d>10) want=to.clone().multiplyScalar(spd); else if(d<5.5) want=to.clone().multiplyScalar(-spd); else want=new V3(-to.z,0,to.x).multiplyScalar(spd*.5); if(b.atk==='slam'||b.atk==='burst') want.multiplyScalar(.1); b.vel.lerp(want,Math.min(1,dt*2)); }
    b.pos.addScaledVector(b.vel,dt*(b.slow>0?.6:1)); b.pos.x=clamp(b.pos.x,-AX+4,AX-4); b.pos.z=clamp(b.pos.z,-AZ+4,AZ-4);
    if(pd<b.r+.4){ hurt(18); _tmp2.set(player.pos.x-b.pos.x,0,player.pos.z-b.pos.z).normalize(); player.pos.addScaledVector(_tmp2,2); }
    if(def.barrier){ b.barrierCd-=dt; if(b.barrier>0) b.barrier-=dt; if(b.barrierCd<=0&&b.phase>=2){ b.barrier=3.2; b.barrierCd=rand(9,12); } }
    if(b.atk==='idle'){ b.atkT-=dt; if(b.atkT<=0) bossStartAttack(b); } else if(bossTick(b,dt,to)){ b.atk='idle'; b.atkT=cool; }
  }
  m.g.position.set(b.pos.x,b.y,b.pos.z); m.shadow.position.set(b.pos.x,.03,b.pos.z); m.shadow.scale.setScalar(clamp(1-(b.y-b.base)/30,.2,1));
  b.yaw=lerpAngle(b.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*(def.fly?2:3))); m.g.rotation.y=b.yaw;
  applyJuice(m.g,b.jz,dt,b.sc);
  if(b.kind==='colossus'){ stepMech(m,b,b.vel.length(),dt,3); mechLean(m,b.jz,dt,b.vel.x*.5,b.vel.z*.5,b.yaw,b.yaw);
    // slam wind-up: crouch, raise both arms, tremble at the top, then smash down
    if(b.atk==='slam'){ const k=b.atkT<.9?b.atkT/.9:Math.max(0,1-(b.atkT-.9)*3), tr=b.atkT>.6&&b.atkT<.9?Math.sin(b.t*60)*.05:0; m.hips.position.y=1.6-.45*k; m.arms[0].rotation.x=-2.6*k+tr; m.arms[1].rotation.x=-1.45-1.2*k-tr; m.torso.rotation.x=-.25*k; if(!b.slamHit&&b.atkT>=.9){ b.slamHit=1; b.jz.pop.v=-9; } }
    else b.slamHit=0;
    if(b.atk==='burst'){ spring(b.jz.rec,0,dt,20,.4); m.arms[1].rotation.x-=b.jz.rec.x*.3; } }
  else if(b.kind==='prism'){ m.crystal.rotation.y+=dt*.7; m.ring.rotation.z+=dt*.6; m.ring.rotation.x=Math.PI/2+Math.sin(b.t*.8)*.3; m.shards.forEach((s,i)=>{ const a=b.t*1.2+i/6*Math.PI*2; s.position.set(Math.cos(a)*4,Math.sin(b.t*2+i)*.6,Math.sin(a)*4); s.rotation.y+=dt*3; }); m.core.scale.setScalar(1+Math.sin(b.t*(4+b.phase*2))*.1); }
  else { m.rings[0].rotation.set(b.t*.9,b.t*.5,0); m.rings[1].rotation.set(-b.t*.6,0,b.t*.7); m.halo.rotation.z+=dt; m.wings.children.forEach((w,i)=>{ w.rotation.z=w.userData.base+Math.sin(b.t*2+i)*.12*w.userData.s; }); m.core.scale.setScalar(1+Math.sin(b.t*(4+b.phase*2))*.08); }
  if(m.shield){ m.shield.visible=b.barrier>0; if(b.barrier>0){ m.shield.rotation.z+=dt; m.shield.children.forEach((c,i)=>{ c.material.opacity=(i<3?.8:.18)*(.6+Math.sin(b.t*20+i)*.4); }); } }
}
function bossDeath(){
  const def=boss.def; score+=[5000,8000,12000][stage]; kills++; hideBeams(); clearEnemyShots();
  state='bossdeath'; stateT=3.2; boss.final=false; buzz(200); hitstop(120,true);
  dropGold(boss.pos,def.gold);
}
function startCine(){
  const kind=ARENAS[stage].boss, def=BOSSES[kind];
  spawnBoss(kind);
  $('cineImg').src=PORTRAIT[kind]||''; $('cineName').textContent=def.name; $('cineClass').textContent=def.cls; $('cineEpi').textContent=def.epi;
  $('cineThreat').textContent='THREAT '+'■'.repeat(def.threat)+'□'.repeat(5-def.threat)+` · LEVEL ${String(sortie.n+1).padStart(2,'0')}/12`;
  const c=$('cine'); c.hidden=false; requestAnimationFrame(()=>c.classList.add('on'));
  state='cine'; stateT=5; refreshControls();
}
function endCine(){
  if(state!=='cine') return;
  const c=$('cine'); c.classList.remove('on'); setTimeout(()=>{ if(state!=='cine') c.hidden=true; },650);
  state='fight'; if(boss){ boss.atkT=.25; boss.y=Math.min(boss.y,boss.base+6); } refreshControls();
}
