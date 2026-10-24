// Seraph Breaker · bosses.js: Boss spawning, attack patterns (bossTick), beams, boss parts (rotors, eyes), High-Co stage attacks and the cinematic intro.
/* ================= BOSSES ================= */
function spawnBoss(kind){
  const def=BOSSES[kind], m=BOSS_BUILD[kind](), form=def.form||kind;
  // boss armor follows the same room curve as the mobs (enemyScale in balance.js), normalized to the room 10 boss
  const hp=Math.round(def.hp*enemyScale(stage,sortie.ri,sortie.rule).boss);
  boss={kind,form,def,model:m,pos:new V3(0,0,-6),vel:new V3(),hp,maxHp:hp,r:def.r,t:0,flash:0,atk:'enter',atkT:99,phase:1,barrier:0,barrierCd:9,y:32,base:def.fly||0,spinA:0,beam:null,yaw:0,walk:0,lastAtk:'',stun:0,born:1,burn:0,slow:0,jz:juiceState(),dropY:0,sc:m.g.scale.x,jumpY:0,vuln:0,reflectT:0,spdK:1,wallA:[0,0,0]};
  // Hive Carrier rotors and Ophanim Throne eyes are parts you can shoot out
  if(form==='hive'){ boss.rotors=m.rotors.map(r=>({m:r,hp:hp*.1,alive:true})); m.bay.material=m.bay.material.clone(); }
  if(m.eyes) m.eyes.forEach(e=>{ e.hp=hp*.012; e.alive=true; });
  if(form==='highco'){ boss.poles=[]; boss.chute=buildHighCoChute(); boss.chuteT=0; roomGroup.add(boss.chute.g); }
  scene.add(m.g,m.shadow); enemies.push(boss);
  $('bossName').textContent=def.name.toUpperCase(); $('bossPh').textContent='PHASE I'; $('bossImg').src=PORTRAIT[kind]||''; $('bossBar').firstElementChild.style.background='';
  if(form==='highco') highcoInit(boss);
}
const toDir=b=>{ const T=tgt(); return new V3(T.x-b.pos.x,0,T.z-b.pos.z).normalize(); };
const bossCore=b=>new V3(b.pos.x,b.y+(b.def.coreY!=null?b.def.coreY:b.form==='colossus'?6:0)+(b.jumpY||0),b.pos.z);
// damage that lands near a rotor or an eye also hurts that part
function bossPartHit(b,pos,d){
  if(b.rotors){ let best=null,bd=2.8; for(const r of b.rotors){ if(!r.alive) continue; r.m.getWorldPosition(_tmp2); const dd=Math.hypot(_tmp2.x-pos.x,_tmp2.z-pos.z); if(dd<bd){ bd=dd; best=r; } }
    if(best){ best.hp-=d; if(best.hp<=0){ best.alive=false; best.m.visible=false; best.m.getWorldPosition(_tmp2); crossBlast(_tmp2.clone(),0xff6a1a,.9); b.spdK*=.78; popText('ROTOR DOWN'); hitstop(60,true); } } }
  if(b.model.eyes){ let best=null,bd=1.6; for(const e of b.model.eyes){ if(!e.alive) continue; e.w.getWorldPosition(_tmp2); const dd=Math.hypot(_tmp2.x-pos.x,_tmp2.z-pos.z); if(dd<bd){ bd=dd; best=e; } }
    if(best){ best.hp-=d; if(best.hp<=0){ best.alive=false; best.p.visible=false; best.w.material=toon(0x2a2232); best.w.getWorldPosition(_tmp2); sparks(_tmp2,0xff2a3a,8,6); sfx('hit'); } } }
}
const LOCKED_ATK=['stomp','lunge','roll','hcslam','hcdescend','hcform','hcdrain'];
/* fairness: attacks never overlap. An attack is over when its own projectiles have resolved (missiles landed, shockwaves and boss
   blasts gone), then the boss takes a short breather (BOSS_BREATH by phase, plus BOSS_SETTLE for volleys that are still in the air).
   While a heavy attack runs, summoned minions hold their fire (bossHeavy). */
const BOSS_BREATH=[.9,.7,.5], BOSS_SETTLE={ring:.5,spiral:.3,shards:.8,summon:.4,drones:.4,sparks:.4,mines:1.3,aimed:.2,eyes:.2,wave:.3,scream:.3,headbang:.3,pole:.3,pillars:.4,hcdescend:1.1,hcdrain:.3};
const LIGHT_ATK=['idle','enter','summon','drones','sparks','aimed','eyes','shieldup'];
const SLAM_T=1.15; // slam wind-up: the red ring shows the shockwave's reach and fills up as the countdown
function bossPending(){ for(const x of bullets) if(x.tag==='bmis') return true; for(const s of shocks) if(!s.friendly) return true; for(const x of blasts) if(x.boss) return true; return false; }
const bossHeavy=()=>!!(boss&&!boss.dead&&state==='fight'&&(!LIGHT_ATK.includes(boss.atk)||bossPending()));
// ground telegraph for a shockwave: the ring is its full reach, the disc fills up during the wind-up, then the ring stays until the wave is out
function slamTele(pos,R,wind,hold){
  const g=new THREE.Group(), ring=new THREE.Mesh(G.ring,addMat(0xff2236,.9)), fill=new THREE.Mesh(G.disc,addMat(0xff2236,.2)), life=wind+hold;
  ring.rotation.x=fill.rotation.x=-Math.PI/2; ring.scale.setScalar(R); fill.position.y=-.01; g.add(ring,fill); g.position.set(pos.x,.07,pos.z);
  addFx(g,life,(f,dt,k)=>{ const t=life*(1-k), c=Math.min(1,t/wind); fill.visible=t<wind; fill.scale.setScalar(Math.max(.01,R*c)); fill.material.opacity=.1+.22*c;
    ring.material.opacity=t<wind?.5+.45*Math.abs(Math.sin(t*(5+c*22))):.9*Math.max(0,(life-t)/Math.max(.01,hold)); });
}
// gun bursts: groups of 3 aimed shots with a gap between groups. Each group aims once (strafe to dodge) and the gun glints right before it.
function burstTick(b,groups,gap,fire,muzzle){
  if(b.subT<=0){
    if(!b.bn){ if(b.grp>=groups) return true; b.grp++; b.bn=3; const T=tgt(), m=muzzle(); b.baim=Math.atan2(T.x-m.x,T.z-m.z); }
    fire(b.baim+rand(-.035,.035)); b.bn--; b.subT=b.bn?.1:gap; }
  else if(!b.bn&&b.grp<groups&&b.subT<.2&&Math.random()<.6) sparks(muzzle().setY(1.9),0xffe08a,1,2);
  return false;
}
function bossStartAttack(b){
  const pool=b.def.pool[b.phase-1]; let a=pickOne(pool); if(a===b.lastAtk) a=pickOne(pool);
  if(['summon','drones','sparks'].includes(a)&&enemies.length>5) a=pool.find(x=>!['summon','drones','sparks'].includes(x))||pool[0];
  if(a==='eyes'&&b.model.eyes&&!b.model.eyes.some(e=>e.alive)) a='walls';
  if(a==='burst'&&!b.model.muzzle) a='aimed';
  b.atk=a; b.lastAtk=a; b.atkT=0; b.subT=0; b.grp=0; b.bn=0; b.slam=0; b.slam2=-1; b.waved=0; b.wallA=[rand(0,6),rand(0,6),rand(0,6)];
  if(a==='beam') b.beam={t:0,fire:false,dir:toDir(b),sweep:0,tele:1.1,dur:.9};
  if(a==='sweep'){ const d=toDir(b),s=Math.random()<.5?-1:1,ang=Math.atan2(d.x,d.z)-s*1.15; b.beam={t:0,fire:false,dir:new V3(Math.sin(ang),0,Math.cos(ang)),sweep:s*(b.phase===3?1.7:1.4),tele:.9,dur:1.6}; }
  // Siege Arachne: head laser sweeps 180° along the ground; the space under its belly is a blind spot
  if(a==='sweep180'){ const d=toDir(b),s=Math.random()<.5?-1:1,ang=Math.atan2(d.x,d.z)-s*Math.PI/2; b.beam={t:0,fire:false,dir:new V3(Math.sin(ang),0,Math.cos(ang)),sweep:s*Math.PI/1.8,tele:1,dur:1.8,flat:true,blind:true}; }
  if(a==='slam'){ b.slamR=[9,10,11][b.phase-1]; slamTele(b.pos,b.slamR,SLAM_T,(b.phase===3?.4:0)+b.slamR/9); }
  if(a==='burst'||a==='burst2') b.subT=.35;
  if(a==='walls'||a==='walls2'){ groundRing(b.pos,0xffd36a,7,.6); groundRing(b.pos,0xffd36a,4.5,.45); }
  if(a==='stomp'){ const T=tgt(), tx=clamp(T.x,-AX+4,AX-4), tz=clamp(T.z,-AZ+4,AZ-4); b.stomp={from:b.pos.clone(),to:new V3(tx,0,tz)}; queueBlast(tx,tz,{t:1.1,rad:4.2,dmg:0,hurtP:20,hurtE:false,color:0xff2236,size:1.2,boss:true}); slamTele(b.stomp.to,8,1.1,.75); }
  if(a==='bombline'){ const T=tgt(), hz=Math.random()<.5, len=hz?2*AX:2*AZ, n=Math.round(len/2.2); teleStrip(new V3(hz?-AX:T.x,0,hz?T.z:-AZ),hz?1:0,hz?0:1,len,2.6,0xff3a2a,1.1+n*.05);
    for(let i=0;i<n;i++){ const u=-len/2+(i+.5)*len/n; queueBlast(hz?u:T.x,hz?T.z:u,{t:1.1+i*.05,rad:1.5,dmg:0,hurtP:16,hurtE:false,color:0xff5a2a,size:.55,boss:true}); } }
  if(a==='lunge'){ const d=toDir(b), len=Math.max(3,Math.min(15,lineLen(b.pos.x,b.pos.z,d.x,d.z,15,1))); b.lunge={dir:d,len,done:0,hit:false}; teleStrip(b.pos,d.x,d.z,len,2.8,0xff2236,.7); }
  if(a==='roll'){ const d=toDir(b), len=Math.max(4,lineLen(b.pos.x,b.pos.z,d.x,d.z,30,2)-1); b.rollC={dir:d,len,done:0,hit:false,dropT:0}; teleStrip(b.pos,d.x,d.z,len,6,0xffd36a,1); }
  if(b.form==='highco') highcoStartAttack(b,a);
}
// Archon sword wave: a fan of light shots plus a big slash
function swordWave(b,ph){
  const T=tgt(), base=Math.atan2(T.x-b.pos.x,T.z-b.pos.z), n=ph===3?13:9, o=new V3(b.pos.x,1.8,b.pos.z);
  for(let i=0;i<n;i++){ const a=base+(i/(n-1)-.5)*1.75; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),9*eSpd(),12,0xffd36a,{life:3,r:.5}); }
  const g=new THREE.Group(), s=new THREE.Mesh(G.slash,addMat(0xffd36a,.9)); s.rotation.x=-Math.PI/2; s.scale.setScalar(1.6); g.add(s); g.position.copy(o); g.rotation.y=base;
  addFx(g,.25,(f,dt,k)=>{ s.material.opacity=k; s.scale.setScalar(1.6+(1-k)*.6); }); sfx('slash'); shake=Math.max(shake,.3);
}
function bossTick(b,dt,to){
  const o=new V3(b.pos.x,1.8,b.pos.z),ph=b.phase,sp=eSpd(); b.atkT+=dt; b.subT-=dt;
  switch(b.atk){
    case 'ring':{ const n=ph===1?20:ph===2?26:32,rings=ph===3?2:1; for(let r=0;r<rings;r++) for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+r*(Math.PI/n)+b.t; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),(7+r*2.2)*sp,12,0xff3a5a,{life:4,r:.5,scale:1.15}); } crossBlast(o.clone().setY(0),0xff3048,.6); return true; }
    case 'spiral': if(b.subT<=0){ b.subT=ph===3?.06:.09; b.spinA+=.27; const arms=ph===1?3:4; for(let k=0;k<arms;k++){ const a=b.spinA+k*Math.PI*2/arms; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),7.5*sp,10,0xff8a3a,{life:4,r:.45}); } } return b.atkT>2.6;
    case 'aimed': if(b.subT<=0){ b.subT=.4; const base=Math.atan2(to.x,to.z); for(let i=-1;i<=1;i++){ const a=base+i*.16; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),12*sp,12,0xff5a2a,{life:3,r:.45}); } } return b.atkT>1.6;
    // Iron Colossus gun: 3 groups of 3 at speed 10 (phase 3: 4 groups, speed 12, shorter gaps)
    case 'burst':{ const mzF=()=>b.model.muzzle.getWorldPosition(new V3());
      return burstTick(b,ph===3?4:3,ph===3?.38:.5,a=>{ const mz=mzF().setY(1.8); shoot('e',mz,new V3(Math.sin(a),0,Math.cos(a)),ph===3?12:10,9,0xff5a2a,{life:3,r:.45}); sparks(mz,0xff8a40,2,4); b.jz.rec.v+=2.5; },mzF); }
    case 'burst2':{ const cF=()=>b.model.lens?b.model.lens.getWorldPosition(new V3()):bossCore(b);
      return burstTick(b,ph===3?4:3,ph===3?.4:.5,a=>{ const c=cF(); for(const s of [-1,1]) shoot('e',new V3(c.x+Math.cos(a)*s*.6,1.8,c.z-Math.sin(a)*s*.6),new V3(Math.sin(a),0,Math.cos(a)),11*sp,9,0xff5a2a,{life:3,r:.45}); sparks(c,0xff8a40,2,4); },cF); }
    case 'missiles':{ const n=[5,8,12][ph-1]; for(let i=0;i<n;i++){ const a=b.yaw+Math.PI+(i/(n-1)-.5)*Math.PI*1.6; const st=o.clone().add(new V3(Math.sin(a)*2,0,Math.cos(a)*2)); shoot('e',st,new V3(Math.sin(a),0,Math.cos(a)),5,11,0xffb040,{life:5,r:.45,home:1.6,turn:2.4,after:11,air:'arc',tag:'bmis'}); } sparks(o.clone().setY(5),0xffb040,10,6); return true; }
    // slam: the wave stops at the red ring (b.slamR); phase 3 sends a slower second wave. Dash through a wave to dodge it.
    case 'slam': if(!b.slam&&b.atkT>SLAM_T){ b.slam=1; shockwave(b.pos,13,b.slamR); crossBlast(b.pos.clone(),0xff3a2a,.8); if(ph===3) b.slam2=.4; } if(b.slam2>0){ b.slam2-=dt; if(b.slam2<=0) shockwave(b.pos,9,b.slamR); } return b.atkT>SLAM_T+.5&&b.slam2<=0;
    case 'summon':{ const n=ph===3?3:2; for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2); spawnEnemy(b.def.minion,new V3(clamp(b.pos.x+Math.cos(a)*5,-AX+2,AX-2),0,clamp(b.pos.z+Math.sin(a)*5,-AZ+2,AZ-2)),false,{minion:true}); } return true; }
    case 'shards':{ const n=ph>=2?12:8; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+b.t; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),9,12,0x8fd0ff,{life:5,r:.45,delay:.75,after:15+stage*1.5}); } return true; }
    // Hive Carrier
    case 'drones': case 'sparks':{ const k=b.atk==='drones'?'drone':'spark', n=k==='spark'?5:ph===1?2:3; for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2), r=rand(2,4); spawnEnemy(k,new V3(clamp(b.pos.x+Math.cos(a)*r,-AX+1.5,AX-1.5),0,clamp(b.pos.z+Math.sin(a)*r,-AZ+1.5,AZ-1.5)),false,{minion:true}); } sparks(bossCore(b),0xff6a1a,10,6); sfx('door'); return true; }
    case 'bombline': return b.atkT>1.3;
    // Siege Arachne
    case 'mines':{ const n=ph===1?6:9, c=bossCore(b); for(let i=0;i<n;i++){ const x=rand(-AX+1.5,AX-1.5), z=rand(-AZ+2,AZ-2); if(Math.hypot(x-player.pos.x,z-player.pos.z)<2.5) continue; lobShell(c,new V3(x,0,z),.7+i*.05,0x2a2632,()=>dropEMine(x,z,1),true); } sfx('heavy'); return true; }
    case 'stomp':{ const S=b.stomp, k=Math.min(1,b.atkT/1.1); b.pos.lerpVectors(S.from,S.to,k); b.jumpY=Math.sin(Math.PI*k)*7; if(k>=1&&!S.done){ S.done=1; b.jumpY=0; shockwave(b.pos,12,8); shake=.8; b.jz.pop.v=-9; hitstop(60,true); } return b.atkT>1.6; }
    // Ophanim Throne: each ring turns its own bullet wall; open eyes fire aimed shots; phase 3 rolls across the room
    case 'walls': case 'walls2':{ if(b.atkT<.6) return false; if(b.subT<=0){ b.subT=.18; const arms=b.atk==='walls2'?3:2, c=new V3(b.pos.x,1.8,b.pos.z);
      for(let i=0;i<3;i++){ b.wallA[i]+=(i%2?1:-1)*(.7+.25*i)*.18*(ph===3?1.3:1); for(let k=0;k<arms;k++){ const a=b.wallA[i]+k*Math.PI*2/arms; shoot('e',c,new V3(Math.sin(a),0,Math.cos(a)),(5.5+i*.6)*sp,10,[0xffd36a,0xff8a3a,0xfff0c0][i],{life:3.6,r:.45}); } } } return b.atkT>3.4; }
    case 'eyes':{ const alive=b.model.eyes?b.model.eyes.filter(x=>x.alive):[]; if(b.model.eyes&&!alive.length) return true;
      if(b.subT<=0){ b.subT=.3; for(let k=0;k<3;k++){ let from; if(alive.length){ pickOne(alive).w.getWorldPosition(_tmp2); from=_tmp2.clone(); sparks(from,0xff2a3a,2,3); } else from=bossCore(b); from.y=1.8; const T=tgt(); shoot('e',from,new V3(T.x-from.x,0,T.z-from.z).normalize(),11*sp,11,0xff2a3a,{life:3,r:.42}); } } return b.atkT>2.4; }
    case 'roll':{ const R=b.rollC; if(b.atkT<1) return false; const step=16*dt; R.done+=step; b.pos.addScaledVector(R.dir,step);
      R.dropT-=dt; if(R.dropT<=0){ R.dropT=.18; for(const s of [-1,1]) shoot('e',new V3(b.pos.x,1.4,b.pos.z),new V3(-R.dir.z*s,0,R.dir.x*s),2.6*sp,10,0xffc040,{life:4,r:.45}); }
      if(!R.hit&&Math.hypot(player.pos.x-b.pos.x,player.pos.z-b.pos.z)<b.r+.5){ R.hit=true; contactHurt(b,24); }
      if(R.done>=R.len){ shake=.5; b.jz.pop.v=-6; return true; } return false; }
    // Archon: sword waves, a telegraphed lunge with a 1.5 s opening after it, and a shield that reflects your shots
    case 'wave':{ if(b.atkT<.55) return false; if(!b.waved){ b.waved=1; swordWave(b,ph); } if(ph>=2&&b.waved===1&&b.atkT>.85){ b.waved=2; swordWave(b,ph); } return b.atkT>1.3; }
    case 'lunge':{ const L=b.lunge; if(b.atkT<.7) return false; const step=Math.min(26*dt,L.len-L.done); L.done+=step; b.pos.addScaledVector(L.dir,step);
      if(!L.hit&&Math.hypot(player.pos.x-b.pos.x,player.pos.z-b.pos.z)<b.r+.6){ L.hit=true; contactHurt(b,24); } if(Math.random()<.6) sparks(bossCore(b).setY(2),0xffd36a,2,4);
      if(L.done>=L.len-.01){ b.vuln=1.5; b.jz.pop.v=-7; shake=.4; crossBlast(b.pos.clone(),0xffd36a,.7); return true; } return false; }
    case 'shieldup':{ if(b.atkT<.35) return false; b.reflectT=Math.max(.01,3.35-b.atkT); if(b.atkT>3.35){ b.reflectT=0; return true; } return false; }
    case 'beam': case 'sweep': case 'sweep180': return updateBeam(b,dt);
    case 'hcslam': case 'scream': case 'headbang': case 'pole': case 'pillars': case 'hcdescend': case 'hcform': case 'hcdrain': return highcoTick(b,dt,ph);
  }
  return true;
}
function updateBeam(b,dt){
  const bm=b.beam; bm.t+=dt;
  const core=bm.flat&&b.model.lens?b.model.lens.getWorldPosition(new V3()):bossCore(b);
  if(!bm.sweep&&bm.t<bm.tele*.7) bm.dir.lerp(toDir(b),Math.min(1,dt*6)).normalize();
  if(bm.t>=bm.tele&&!bm.fire){ bm.fire=true; shake=.5; buzz(60); sfx('beam'); }
  if(bm.fire&&bm.sweep){ const a=Math.atan2(bm.dir.x,bm.dir.z)+bm.sweep*dt; bm.dir.set(Math.sin(a),0,Math.cos(a)); }
  let end;
  if(bm.flat) end=new V3(core.x+bm.dir.x*30,1.2,core.z+bm.dir.z*30);
  else { const target=new V3(b.pos.x+bm.dir.x*10,1.2,b.pos.z+bm.dir.z*10), dir3=target.clone().sub(core).normalize(); end=core.clone().addScaledVector(dir3,core.y/Math.max(.01,-dir3.y)); }
  const len=core.distanceTo(end);
  beams.forEach(x=>{ x.position.copy(core); x.lookAt(end); });
  if(!bm.fire){ beamTele.visible=true; const w=.12+Math.sin(bm.t*40)*.04; beamTele.scale.set(w,w,len); beamTele.material.opacity=.4+bm.t*.3; }
  else { beamTele.visible=false; beamOuter.visible=beamCore.visible=true;
    const k=Math.min(1,(bm.t-bm.tele)*8),w=(b.phase===3?1.5:1.15)*k*(1+Math.sin(bm.t*60)*.08); beamOuter.scale.set(w,w,len); beamCore.scale.set(w*.45,w*.45,len);
    if(Math.random()<.5) sparks(end,0xff4a7a,3,8);
    const ax=core.x,az=core.z,vx=end.x-ax,vz=end.z-az,px=player.pos.x,pz=player.pos.z,t=clamp(((px-ax)*vx+(pz-az)*vz)/(vx*vx+vz*vz),0,1),dd=Math.hypot(px-(ax+vx*t),pz-(az+vz*t));
    const under=bm.blind&&Math.hypot(px-b.pos.x,pz-b.pos.z)<b.r*.95;
    if(dd<w+.5&&!player.dead&&!under){ const blocked=player.shield&&player.aim.dot(_tmp2.set(-bm.dir.x,0,-bm.dir.z))>.5; if(blocked){ player.en-=60*dt; player.regenDelay=.9; sparks(shieldG.position,0xffa04a,2,6); }
      // the phone barrier cannot stop a beam, it only halves it while power lasts
      else if(barrierAuto()&&!player.st.noHex&&player.en>60){ player.en-=45*dt; player.regenDelay=1.2; hexFlash(core); hurt(11); } else hurt(22); } }
  if(bm.t>bm.tele+bm.dur){ hideBeams(); b.beam=null; return true; }
  return false;
}
function updateBoss(dt){
  const b=boss,m=b.model,def=b.def,f=b.form; b.t+=dt;
  if(b.flash>0){b.flash-=dt;if(b.flash<=0)unflash(b);}
  const T=tgt(); const to=_tmp.subVectors(T,b.pos).setY(0); const d=to.length()||1; to.divideScalar(d);
  const pd=Math.hypot(player.pos.x-b.pos.x,player.pos.z-b.pos.z);
  // High-Co has no thresholds: his phase is the form, changed by highcoFormDown when a form's armor runs out
  const newPh=def.forms?b.phase:b.hp<b.maxHp*.33?3:b.hp<b.maxHp*.66?2:1;
  if(newPh!==b.phase&&b.atk!=='enter'){ b.phase=newPh; $('bossPh').textContent='PHASE '+['I','II','III'][newPh-1]; groundRing(b.pos,0xff2236,14,1); shake=.6; hitstop(85,true); b.jz.pop.v=-8; if(def.barrier) b.barrier=3; b.atk='idle'; b.atkT=.7; b.beam=null; b.jumpY=0; b.reflectT=0; b.vuln=0; hideBeams(); clearEnemyShots(); if(f==='highco') highcoPhase(b,newPh); }
  b.vuln=Math.max(0,b.vuln-dt);
  if(b.atk==='enter'){ b.y+=(b.base-b.y)*Math.min(1,dt*2.6); b.atkT-=dt;
    if(b.atkT<=0){ b.y=b.base; b.atk='idle'; b.atkT=1; groundRing(b.pos,ARENAS[stage].theme.edge,16,1.2); crossBlast(b.pos.clone(),0xff6a1a,1.2); shake=.8; buzz(120); } }
  else if(b.stun>0){ b.stun-=dt; b.jumpY=0; b.reflectT=0; b.vel.multiplyScalar(.9); if(Math.random()<dt*8) sparks(bossCore(b),0x5fe0ff,2,4); b.pos.addScaledVector(b.vel,dt); }
  else {
    const locked=LOCKED_ATK.includes(b.atk);
    if(locked) b.vel.set(0,0,0);
    else if(f==='archon'){ b.y=b.base+Math.sin(b.t*1.6)*.2; const spd=b.phase===3?4.2:3.4; let want; if(d>7) want=to.clone().multiplyScalar(spd); else if(d<4.5) want=to.clone().multiplyScalar(-spd); else want=new V3(-to.z,0,to.x).multiplyScalar(spd*.6); if(b.vuln>0||b.atk==='wave'||b.atk==='shieldup') want.multiplyScalar(.1); b.vel.lerp(want,Math.min(1,dt*2.5)); }
    else if(f==='throne'){ b.y=b.base+Math.sin(b.t*1.1)*.3; const want=new V3(Math.cos(b.t*.3)*3,0,Math.sin(b.t*.3)*3-3).sub(b.pos).multiplyScalar(.5); b.vel.lerp(want,Math.min(1,dt*1.5)); }
    else if(def.fly){ b.y=b.base+Math.sin(b.t*1.3)*.35; const orbit=new V3(Math.cos(b.t*.25)*7,0,Math.sin(b.t*.25)*7-2); const want=orbit.sub(b.pos).multiplyScalar(.6*b.spdK); if(d<7) want.addScaledVector(to,-4*b.spdK); if(b.beam&&b.beam.fire) want.multiplyScalar(.1); b.vel.lerp(want,Math.min(1,dt*1.5)); }
    else { const spd=(b.phase===3?3.6:2.6)*(f==='arachne'?.85:1)*(def.forms?def.forms[b.phase-1].spd:1); let want; if(d>10) want=to.clone().multiplyScalar(spd); else if(d<5.5) want=to.clone().multiplyScalar(-spd); else want=new V3(-to.z,0,to.x).multiplyScalar(spd*.5); if(b.atk==='burst'||b.atk==='burst2'||(b.beam&&b.beam.fire)) want.multiplyScalar(.1); if(b.atk==='slam') want.set(0,0,0); b.vel.lerp(want,Math.min(1,dt*2)); }
    b.pos.addScaledVector(b.vel,dt*(b.slow>0?.6:1)); b.pos.x=clamp(b.pos.x,-AX+3,AX-3); b.pos.z=clamp(b.pos.z,-AZ+3,AZ-3);
    // touching the boss hurts (the Arachne's belly is a safe blind spot; lunges and rolls deal their own hit)
    if(pd<b.r+.4&&f!=='arachne'&&!locked){ contactHurt(b,18); _tmp2.set(player.pos.x-b.pos.x,0,player.pos.z-b.pos.z).normalize(); player.pos.addScaledVector(_tmp2,2); }
    if(def.barrier){ b.barrierCd-=dt; if(b.barrier>0) b.barrier-=dt; if(b.barrierCd<=0&&b.phase>=2){ b.barrier=3.2; b.barrierCd=rand(9,12); } }
    // the breather only counts down once the last attack's missiles, shockwaves and blasts are gone
    if(b.atk==='idle'){ if(!bossPending()) b.atkT-=dt; if(b.atkT<=0&&b.vuln<=0) bossStartAttack(b); }
    else if(bossTick(b,dt,to)){ b.atkT=(BOSS_SETTLE[b.atk]||0)+(def.forms?def.forms[b.phase-1].breath:BOSS_BREATH[b.phase-1]); b.atk='idle'; }
  }
  m.g.position.set(b.pos.x,b.y+b.jumpY,b.pos.z); m.shadow.position.set(b.pos.x,.03,b.pos.z); m.shadow.scale.setScalar(clamp(1-(b.y+b.jumpY-b.base)/30,.2,1));
  const faceDir=b.atk==='lunge'&&b.lunge?b.lunge.dir:b.atk==='roll'&&b.rollC?b.rollC.dir:to;
  b.yaw=lerpAngle(b.yaw,Math.atan2(faceDir.x,faceDir.z),Math.min(1,dt*(def.fly?2:3))); m.g.rotation.y=b.yaw;
  applyJuice(m.g,b.jz,dt,b.sc);
  if(f==='colossus'){ if(stepMech(m,b,b.vel.length(),dt,3)){ b.byaw=b.yaw; footfall(b,m,3,.2); } mechLean(m,b.jz,dt,b.vel.x*.5,b.vel.z*.5,b.yaw,b.yaw);
    // slam wind-up: crouch, raise both arms, tremble at the top, then smash down
    if(b.atk==='slam'){ const k=b.atkT<SLAM_T?b.atkT/SLAM_T:Math.max(0,1-(b.atkT-SLAM_T)*3), tr=b.atkT>SLAM_T-.3&&b.atkT<SLAM_T?Math.sin(b.t*60)*.05:0; m.hips.position.y=1.6-.45*k; m.arms[0].rotation.x=-2.6*k+tr; m.arms[1].rotation.x=-1.45-1.2*k-tr; m.torso.rotation.x=-.25*k; if(!b.slamHit&&b.atkT>=SLAM_T){ b.slamHit=1; b.jz.pop.v=-9; } }
    else b.slamHit=0;
    if(b.atk==='burst'){ spring(b.jz.rec,0,dt,20,.4); m.arms[1].rotation.x-=b.jz.rec.x*.3; } }
  else if(f==='prism'){ m.crystal.rotation.y+=dt*.7; m.ring.rotation.z+=dt*.6; m.ring.rotation.x=Math.PI/2+Math.sin(b.t*.8)*.3; m.shards.forEach((s,i)=>{ const a=b.t*1.2+i/6*Math.PI*2; s.position.set(Math.cos(a)*4,Math.sin(b.t*2+i)*.6,Math.sin(a)*4); s.rotation.y+=dt*3; }); m.core.scale.setScalar(1+Math.sin(b.t*(4+b.phase*2))*.1); }
  else if(f==='seraph'){ m.rings[0].rotation.set(b.t*.9,b.t*.5,0); m.rings[1].rotation.set(-b.t*.6,0,b.t*.7); m.halo.rotation.z+=dt; m.wings.children.forEach((w,i)=>{ w.rotation.z=w.userData.base+Math.sin(b.t*2+i)*.12*w.userData.s; }); m.core.scale.setScalar(1+Math.sin(b.t*(4+b.phase*2))*.08); }
  else if(f==='hive'){ b.rotors.forEach(r=>{ if(r.alive) r.m.rotation.y+=dt*26*b.spdK; }); m.body.position.y=5+Math.sin(b.t*1.4)*.25; m.bay.material.opacity=b.atk==='drones'||b.atk==='sparks'||b.atk==='bombline'?.95:.55+Math.sin(b.t*5)*.3; }
  else if(f==='arachne'){ crawlGait(m,b,b.atk==='stomp'?6:b.vel.length(),dt,2.6);
    const tel=b.beam&&!b.beam.fire; m.lens.scale.setScalar(tel?1.6+Math.sin(b.t*40)*.3:1+Math.sin(b.t*6)*.15);
    m.tur.rotation.y=b.beam?Math.atan2(b.beam.dir.x,b.beam.dir.z)-b.yaw:lerpAngle(m.tur.rotation.y,0,Math.min(1,dt*4)); }
  else if(f==='throne'){ const spin=b.atk==='walls'||b.atk==='walls2'?3:1; m.rings.forEach((r,i)=>{ if(i===0) r.rotation.z+=dt*1.2*spin; if(i===1) r.rotation.x+=dt*spin; if(i===2) r.rotation.y+=dt*.8*spin; }); m.core.rotation.y+=dt*2;
    if(m.wings) m.wings.children.forEach((w,i)=>{ w.rotation.z=w.userData.base+Math.sin(b.t*1.8+i)*.1*w.userData.s; });
    if(b.atk==='roll'&&b.atkT>1) m.body.rotation.x+=dt*16/2.4; else m.body.rotation.x*=Math.pow(.05,dt); }
  else if(f==='highco') highcoAnim(b,m,dt);
  else if(f==='archon'){ m.halo.rotation.z+=dt; m.wings.children.forEach((w,i)=>{ w.rotation.z=w.userData.base+Math.sin(b.t*2+i)*.1*w.userData.s; });
    // wind-ups: the sword rises before a wave, the knight crouches before the lunge and kneels while it is open
    let by=4.6,swx=-.25+Math.sin(b.t*1.1)*.15,swz=-.35;
    if(b.atk==='wave'){ const k=b.atkT<.55?b.atkT/.55:Math.max(0,1-(b.atkT-.55)*4); swx=-.25-1.6*k; swz=-.35-.6*k; }
    if(b.atk==='lunge'){ by-=.6*Math.min(1,b.atkT/.7); swx=.9; if(b.atkT<.7) m.body.position.x=Math.sin(b.t*60)*.05; else m.body.position.x=0; }
    if(b.vuln>0){ by-=1.2; swx=.6; swz=-1; if(Math.random()<dt*8) sparks(bossCore(b),0x5fe0ff,2,4); }
    m.body.position.y+=(by-m.body.position.y)*Math.min(1,dt*10); m.sword.rotation.x+=(swx-m.sword.rotation.x)*Math.min(1,dt*12); m.sword.rotation.z+=(swz-m.sword.rotation.z)*Math.min(1,dt*12);
    const sh=b.reflectT>0; m.shield.position.lerp(_tmp2.set(sh?0:-1.75,sh?.4:.1,sh?1.6:.7),Math.min(1,dt*10)); m.shield.rotation.y+=((sh?0:-.4)-m.shield.rotation.y)*Math.min(1,dt*10); m.shield.scale.setScalar(sh?1.35+Math.sin(b.t*20)*.03:1); }
  if(m.shield&&def.barrier){ m.shield.visible=b.barrier>0; if(b.barrier>0){ m.shield.rotation.z+=dt; m.shield.children.forEach((c,i)=>{ c.material.opacity=(i<3?.8:.18)*(.6+Math.sin(b.t*20+i)*.4); }); } }
}
function bossDeath(){
  if(!player||player.dead||state==='dying'||state==='result') return;
  if(boss.poles){ boss.poles.forEach(p=>roomGroup.remove(p.m.g)); boss.poles.length=0; hcStreamsEnd(boss,false); }
  const def=boss.def; score+=[5000,8000,12000,16000,20000][stage]; kills++; hideBeams(); fizzleRoom(); boss.jumpY=0; boss.reflectT=0;
  const gm=Math.round(def.gems*ECON.bossGems[sortie.a]*sortie.farm); P.gems+=gm; sortie.gems+=gm; logEarn('gems','boss',gm);
  setState('bossdeath'); stateT=3.2; boss.final=false; buzz(200); hitstop(120,true);
  dropGold(boss.pos,def.gold*ECON.bossGold[sortie.a]*sortie.farm,'boss'); dropItem(boss.pos); gainXp(XP_BOSS);
}
function startCine(){
  const kind=room.boss, def=BOSSES[kind];
  spawnBoss(kind);
  $('cineImg').src=PORTRAIT[kind]||''; $('cineName').textContent=def.name; $('cineClass').textContent=def.cls; $('cineEpi').textContent=def.epi;
  $('cineThreat').textContent='THREAT '+'■'.repeat(def.threat)+'□'.repeat(5-def.threat)+` · ROOM ${sortie.ri+1}/${sortie.N}`;
  const c=$('cine'); c.hidden=false; requestAnimationFrame(()=>c.classList.add('on'));
  setState('cine'); stateT=5; refreshControls();
}
function endCine(){
  if(state!=='cine') return;
  const c=$('cine'); c.classList.remove('on'); setTimeout(()=>{ if(state!=='cine') c.hidden=true; },650);
  setState('fight'); if(boss){ boss.atkT=.25; boss.y=Math.min(boss.y,boss.base+6); } refreshControls();
}
/* ---- High-Co (Main Stage headliner) ----
   Phase I frontman · phase II the black angel lands in his place (Encore) · phase III rage: red wings, light pillars, faster crowd.
   Metal Scream hits the whole room (weaker with distance) unless an amp stack stands between him and you; a dash also clears it. */
let hcArena=null; // concert stage of the current High-Co room (built in buildBossRoom)
const HC_COL=[0x5a8aff,0xd8d4ff,0xff2030]; // wave/ring colour per phase
const HC_SLAM_R=6, HC_STUN=.6, HC_SCREAM=[30,8], HC_POLE_R=3.6, HC_POLE_DMG=9, HC_POLE_LIFE=6;
const hcBump=(t,x,w=.3)=>Math.max(0,1-Math.abs(t-x)/w);
// vertical light column: telegraph and impact flash
// one shared unit column (pillars fire up to 8 in a row): scaled to the radius, only the per-beam material is freed when it ends
const HC_BEAM_GEO=new THREE.CylinderGeometry(1,1,60,20,1,true);
function hcBeam(pos,color,r,life){ const m=new THREE.Mesh(HC_BEAM_GEO,addMat(color,.55)); m.position.set(pos.x,30,pos.z);
  addFx(m,life,(f,dt,k)=>{ m.material.opacity=.55*Math.min(1,k*2); const w=(.5+.5*k)*r; m.scale.set(w,1,w); },'mat'); }
function highcoStartAttack(b,a){
  b.hb=0; b.scr=0; b.poled=0;
  if(a==='hcslam'){ const T=tgt(); b.stomp={from:b.pos.clone(),to:new V3(clamp(T.x,-AX+3,AX-3),0,clamp(T.z,-AZ+3,AZ-3))}; slamTele(b.stomp.to,HC_SLAM_R,1.1,.6); }
  if(a==='pole'){ const T=tgt(); let x=0,z=0; for(let k=0;k<20;k++){ const an=rand(0,Math.PI*2), r=rand(1.5,4); x=clamp(T.x+Math.cos(an)*r,-AX+2.5,AX-2.5); z=clamp(T.z+Math.sin(an)*r,-AZ+2.5,AZ-2.5); if(!inBlock(x,z,1.5)) break; }
    b.poleAt=new V3(x,0,z); slamTele(b.poleAt,HC_POLE_R,.9,.2); }
  if(a==='pillars'){ const T=tgt(), n=b.phase===3?8:6; b.pq=[];
    for(let i=0;i<n;i++){ let x=i%2?rand(-AX+2,AX-2):T.x+rand(-2.5,2.5), z=i%2?rand(-AZ+2,AZ-2):T.z+rand(-2.5,2.5); x=clamp(x,-AX+1.5,AX-1.5); z=clamp(z,-AZ+1.5,AZ-1.5);
      const t=1+i*.35; b.pq.push({x,z,t,done:false}); queueBlast(x,z,{t,rad:1.8,dmg:0,hurtP:18,hurtE:false,color:0xff2030,size:.9,boss:true}); } }
}
function highcoTick(b,dt,ph){
  switch(b.atk){
    // jumps onto you: shockwave out to the red ring, and a short stun if you were still close when he landed
    case 'hcslam':{ const S=b.stomp, k=Math.min(1,b.atkT/1.1); b.pos.lerpVectors(S.from,S.to,k); b.jumpY=Math.sin(Math.PI*k)*6;
      if(k>=1&&!S.done){ S.done=1; b.jumpY=0; shockwave(b.pos,12,HC_SLAM_R,0xffd36a); groundRing(b.pos,0xffd36a,HC_SLAM_R*.55,.8); shake=.8; b.jz.pop.v=-9; hitstop(60,true);
        if(!player.dead&&player.dashT<=0&&player.inv<=0&&Math.hypot(player.pos.x-b.pos.x,player.pos.z-b.pos.z)<HC_SLAM_R*.55){ player.stunT=HC_STUN; popText('STUNNED'); } }
      return b.atkT>1.7; }
    // mic to the mouth (1 s wind-up, rings pulse out), then one scream over the whole room
    case 'scream':{ if(b.atkT<1){ if(b.subT<=0){ b.subT=.25; groundRing(b.pos,HC_COL[ph-1],3+b.atkT*5,.3); } return false; }
      if(!b.scr){ b.scr=1; hcScream(b); } return b.atkT>1.6; }
    // three head swings, each throws a fan of shots forward
    case 'headbang':{ const sw=[.5,1.1,1.7]; if(b.hb<3&&b.atkT>=sw[b.hb]){ hcHeadbang(b,ph); b.hb++; } return b.atkT>2.2; }
    // a pole bursts out of the floor where the red ring filled up; the dancer burns everything inside the ring
    case 'pole': if(b.atkT>=.9&&!b.poled){ b.poled=1; hcPole(b,b.poleAt); } return b.atkT>1.2;
    case 'pillars':{ for(const q of b.pq) if(!q.done&&b.atkT>=q.t){ q.done=true; hcBeam(new V3(q.x,0,q.z),0xff2030,1.4,.5); shake=Math.max(shake,.25); } return b.atkT>b.pq[b.pq.length-1].t+.3; }
    // between forms: the old body's debris settles, then the next form's entrance starts
    case 'hcform':{ b.hp=0; if(b.atkT>=b.formWait){ b.atk='hcdescend'; b.atkT=0; b.model.g.visible=b.model.shadow.visible=true; hcEntrance(b); } return false; }
    // form II / III entrance: drops down the light column (immune until it lands, the bar fills on the way down)
    case 'hcdescend':{ const D=HC_DESC[ph-1], k=Math.min(1,b.atkT/D); b.y=26*(1-k)*(1-k); if(b.immune) b.hp=Math.max(1,b.maxHp*k);
      if(k>=1&&b.immune){ b.immune=false; b.hp=b.maxHp; b.y=0; hcLand(b); } return b.atkT>D+.3; }
  }
  return true;
}
function hcScream(b){
  const c=HC_COL[b.phase-1];
  [0,.18,.36].forEach(d=>{ const r=new THREE.Mesh(G.ring,addMat(c,.9)), life=1.1+d; r.rotation.x=-Math.PI/2; r.position.set(b.pos.x,.08,b.pos.z);
    addFx(r,life,(f,dt,k)=>{ const u=Math.max(0,(1-k)*life-d)/1.1; r.visible=u>0; r.scale.setScalar(1+u*30); r.material.opacity=.9*(1-u)*(1-u); }); });
  shake=Math.max(shake,.8); buzz(140); sfx('beam');
  if(!player||player.dead) return;
  const dx=player.pos.x-b.pos.x, dz=player.pos.z-b.pos.z, d=Math.hypot(dx,dz)||1;
  for(let t=b.r;t<d;t+=.4){ const o=inBlock(b.pos.x+dx/d*t,b.pos.z+dz/d*t,0,'block'); if(o){ sparks(new V3((o.x0+o.x1)/2,2.4,(o.z0+o.z1)/2),c,10,6); popText('COVERED'); return; } }
  hurt(Math.round(HC_SCREAM[0]-(HC_SCREAM[0]-HC_SCREAM[1])*clamp(d/30,0,1)));
}
function hcHeadbang(b,ph){
  const T=tgt(), base=Math.atan2(T.x-b.pos.x,T.z-b.pos.z), n=ph===1?9:11, c=HC_COL[ph-1], o=new V3(b.pos.x,1.8,b.pos.z), sp=eSpd();
  for(let i=0;i<n;i++){ const a=base+(i/(n-1)-.5)*2.2; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),8.5*sp,12,c,{life:3,r:.5}); }
  if(ph===3) for(let i=0;i<n-1;i++){ const a=base+((i+.5)/(n-1)-.5)*2.2; shoot('e',o,new V3(Math.sin(a),0,Math.cos(a)),6*sp,10,c,{life:3.5,r:.45}); }
  const g=new THREE.Group(), w=new THREE.Mesh(new THREE.RingGeometry(1,1.5,32,1,0,Math.PI),addMat(c,.85)); w.rotation.x=-Math.PI/2; g.add(w); g.position.set(b.pos.x,.08,b.pos.z); g.rotation.y=base+Math.PI;
  addFx(g,.9,(f,dt,k)=>{ w.scale.setScalar(1.5+(1-k)*10); w.material.opacity=.85*k; }); shake=Math.max(shake,.25); sfx('boom');
}
function hcPole(b,at){
  if(b.poles.length>=2){ const old=b.poles.shift(); roomGroup.remove(old.m.g); }
  const m=buildHighCoPole(); m.g.position.set(at.x,-9.8,at.z); const s=HC_POLE_R/4; m.aura.scale.setScalar(s); m.fill.scale.setScalar(s); roomGroup.add(m.g);
  b.poles.push({m,x:at.x,z:at.z,t:0,cd:0}); shake=Math.max(shake,.3); crossBlast(at.clone(),0xff3048,.8);
}
/* ---- three forms ----
   Each form has its own armor bar (def.forms[n].hp share of the boss armor). When a form's armor runs out killEnemy hands it to
   highcoFormDown instead of bossDeath: a short hitstop, the old body shatters, enemy shots are cleared and every live attack (pillars, poles,
   beams, crowd streams) is cut off. The next form stays immune through its entrance ('hcform': a pause, then 'hcdescend' down a light column,
   timed so he lands on a bar's downbeat when the beat clock allows it), its bar fills up while he comes down, and after landing he takes a
   longer breather (BOSS_SETTLE.hcdescend) before the first attack. Only form III's death reaches bossDeath. */
function highcoInit(b){
  const F=b.def.forms; b.formHp=F.map(f=>Math.max(1,Math.round(b.maxHp*f.hp))); b.maxHp=b.hp=b.formHp[0]; b.formN=1; b.phase=1;
  b.drainCd=0; b.regenUsed=0; b.streams=null; hcHud(b);
}
function hcHud(b){ const f=b.def.forms[b.phase-1];
  $('bossName').textContent='HIGH-CO · '+f.name.toUpperCase();
  $('bossPh').innerHTML='FORM '+['I','II','III'][b.phase-1]+' '+b.def.forms.map((x,i)=>`<i class="hcpip${i<b.phase-1?' done':i===b.phase-1?' on':''}" style="--c:${x.bar}"></i>`).join('');
  $('bossBar').firstElementChild.style.background=f.bar; }
function highcoClearAttacks(b){
  for(let i=blasts.length-1;i>=0;i--) if(blasts[i].boss){ scene.remove(blasts[i].ring); blasts.splice(i,1); }
  b.poles.forEach(P=>{ P.t=Math.max(P.t,HC_POLE_LIFE); });
  if(b.pq) b.pq.forEach(q=>q.done=true);
  hcStreamsEnd(b,false); b.beam=null; hideBeams(); b.jumpY=0; b.reflectT=0; b.vuln=0; b.stun=0;
}
function highcoFormDown(b){
  const n=b.formN+1, old=b.model; b.hp=0; b.immune=true; highcoClearAttacks(b); clearEnemyShots();
  hitstop(120,true); hcShake(1); buzz(220); sfx('bigboom'); crossBlast(bossCore(b),b.def.forms[b.formN-1].col,1.6);
  shatter(old,b.pos,0,0,{max:mobileMode?8:18,spd:1.4,cy:3}); scene.remove(old.g,old.shadow);
  b.formN=n; b.phase=n; b.maxHp=b.formHp[n-1]; b.regenUsed=0; b.drainCd=b.def.regen.cd[n-1]*.6;
  const m=buildHighCo(2); if(n===3) setHighCoRage(m,true); m.g.visible=m.shadow.visible=false; scene.add(m.g,m.shadow); b.model=m; b.sc=m.g.scale.x;
  // the band comes back on stage for the new form (Main Stage mobs from the stage lip, they hold fire while he lands)
  (b.def.encore&&b.def.encore[n]||[]).forEach((k,i,a)=>{ const x=(i-(a.length-1)/2)*7; spawnEnemy(k,new V3(clamp(x,-AX+2,AX-2),0,-AZ+3),false,{minion:true}); });
  // landing on a strong beat: the descent takes HC_DESC[n] s, so the pause before it ends that long before a downbeat (bar of 4)
  const land=typeof BEAT!=='undefined'?BEAT.until(HC_DESC[n-1]+.7,4):HC_DESC[n-1]+.7;
  b.atk='hcform'; b.atkT=0; b.formWait=clamp(land-HC_DESC[n-1],.6,2.2); b.y=26; b.vel.set(0,0,0);
  hcHud(b); popText(n===2?'ENCORE':'SAKİN OLMAM LAZIM');
}
const HC_DESC=[0,2.2,1.5]; // entrance descent time per form (form I parachutes in during the cinematic)
const hcShake=v=>{ shake=Math.max(shake,v); };
function hcEntrance(b){ const c=b.def.forms[b.phase-1].col; hcBeam(b.pos,c,2.4,HC_DESC[b.phase-1]+.4); }
function hcLand(b){ const c=b.def.forms[b.phase-1].col; groundRing(b.pos,c,10,1); crossBlast(b.pos.clone(),c,1.2); hcShake(.7); b.jz.pop.v=-8; }
function hcStreamsEnd(b){ b.streams=null; }
function highcoAnim(b,m,dt){
  if(stepMech(m,b,b.vel.length(),dt,b.sc)&&!b.y){ b.byaw=b.yaw; footfall(b,m,b.sc,.12); } mechLean(m,b.jz,dt,b.vel.x*.5,b.vel.z*.5,b.yaw,b.yaw);
  const a=b.atk, t=b.atkT; let jaw=.12+Math.sin(b.t*3)*.04, lag=0, flap=2;
  m.head.rotation.x=0;
  if(a==='enter'){ m.arms[0].rotation.set(-2.9,0,.35); m.arms[1].rotation.set(-2.9,0,-.35); m.legs[0].rotation.x=.25; m.legs[1].rotation.x=-.15; m.shins[0].rotation.x=.4; }
  else if(a==='hcdescend'){ m.arms[0].rotation.set(-.3,0,.7); m.arms[1].rotation.set(-.3,0,-.7); flap=b.immune?10:3; }
  else if(a==='beam'||a==='sweep'){ m.arms[1].rotation.set(-1.5,0,0); m.arms[0].rotation.set(-.3,0,.4); jaw=.35; }
  else if(a==='hcslam'){ if(t<1.1){ const k=Math.min(1,t/.4); m.arms[0].rotation.set(-2.8*k,0,.2); m.arms[1].rotation.set(-2.8*k,0,-.2); }
    else { m.hips.position.y=1.25; m.torso.rotation.x=.45; m.arms[0].rotation.set(-.7,0,.2); m.arms[1].rotation.set(-.7,0,-.2); jaw=.5; } }
  else if(a==='scream'){ const k=Math.min(1,t*3), tr=t<1?Math.sin(b.t*50)*.03:0; m.arms[1].rotation.set(-2.2*k,0,.35*k); m.arms[0].rotation.set(-.6*k,0,-.5*k);
    jaw=.15+.45*k; m.head.rotation.x=-.25*k+tr; m.torso.rotation.x=.15*k; flap=6; }
  else if(a==='headbang'){ let s=0; for(const x of [.5,1.1,1.7]){ s=Math.max(s,hcBump(t,x)); lag=Math.max(lag,hcBump(t-.12,x)); }
    m.head.rotation.x=s*.8-.15; m.torso.rotation.x=.1+s*.3; m.hips.position.y-=s*.12; jaw=.3+.2*s; m.arms[0].rotation.set(-.3,0,.4+s*.3); m.arms[1].rotation.set(-.3,0,-.4-s*.3); flap=4; }
  else if(a==='pole'){ const k=Math.min(1,t*3); m.arms[0].rotation.set(-2.8*k,0,.2); jaw=.4*k; m.head.rotation.x=-.2*k; }
  else if(a==='pillars'){ const k=Math.min(1,t*3); m.arms[0].rotation.set(-2.9*k,0,.3); m.arms[1].rotation.set(-2.9*k,0,-.3); m.head.rotation.x=-.4*k; jaw=.45*k; }
  m.jaw.rotation.x=jaw; m.mouth.scale.y=1+jaw*2.5;
  m.hair.forEach((p,i)=>{ p.rotation.x=p.userData.rx-(a==='headbang'?lag*1.3-.3:0)*.9+Math.sin(b.t*2+i)*.04; p.rotation.z=p.userData.rz+Math.sin(b.t*1.6+i)*.05; });
  if(m.wings) m.wings.forEach(w=>w.rotation.y=w.userData.s*Math.sin(b.t*flap)*.25);
  // parachute: hangs over him while he drops in, then collapses behind the landing spot and goes away
  const C=b.chute;
  if(C){ if(a==='enter'){ C.g.position.set(b.pos.x,b.y+7,b.pos.z); C.g.rotation.z=Math.sin(b.t*2)*.06; }
    else { if(!C.land) C.land=b.pos.clone(); b.chuteT+=dt; const k=Math.min(1,b.chuteT/1.2);
      C.g.position.set(C.land.x,7-k*5.5,C.land.z-k*2.5); C.g.rotation.set(-k*1.35,0,0); C.canopy.scale.set(1+k*.2,1-k*.85,1); C.lines.forEach(l=>l.visible=k<.3);
      if(b.chuteT>1.8) C.g.scale.setScalar(Math.max(.001,1-(b.chuteT-1.8)/.6)); if(b.chuteT>2.4){ roomGroup.remove(C.g); b.chute=null; } } }
  // poles: rise, spin, burn whoever stands in the ring, sink back
  for(let i=b.poles.length-1;i>=0;i--){ const P=b.poles[i], pm=P.m; P.t+=dt; P.cd-=dt;
    const h=Math.min(1,P.t/.35)*(1-Math.max(0,Math.min(1,(P.t-HC_POLE_LIFE)/.6))); pm.g.position.y=-9.8*(1-h);
    pm.spin.rotation.y=b.t*4; pm.body.position.y=Math.sin(b.t*4)*.3; pm.tail.rotation.z=Math.sin(b.t*8)*.3;
    const live=P.t>.35&&P.t<HC_POLE_LIFE; pm.aura.visible=pm.fill.visible=live; pm.aura.material.opacity=.5+.3*Math.sin(b.t*12);
    if(live&&state==='fight'&&player&&!player.dead&&P.cd<=0&&Math.hypot(player.pos.x-P.x,player.pos.z-P.z)<HC_POLE_R){ P.cd=.5; hurt(HC_POLE_DMG); }
    if(P.t>HC_POLE_LIFE+.6){ roomGroup.remove(pm.g); b.poles.splice(i,1); } }
  if(hcArena&&hcArena.g.parent) animateHighCoArena(hcArena,b.t,b.phase);
}
