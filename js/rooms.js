// Seraph Breaker · rooms.js: Rooms: the open mat, boundary, obstacles, door, enemy waves and NPCs (angel/devil).
/* ================= ROOMS ================= */
function inBlock(x,z,pad=0,kind){ for(const o of obstacles){ if(kind&&o.kind!==kind) continue; if(x>o.x0-pad&&x<o.x1+pad&&z>o.z0-pad&&z<o.z1+pad) return o; } return null; }
function pushOut(pos,r){
  for(const o of obstacles){
    const cx=clamp(pos.x,o.x0,o.x1), cz=clamp(pos.z,o.z0,o.z1); let dx=pos.x-cx, dz=pos.z-cz; const d=Math.hypot(dx,dz);
    if(d<r){
      if(d>1e-4){ pos.x=cx+dx/d*r; pos.z=cz+dz/d*r; }
      else { const l=pos.x-o.x0,rr=o.x1-pos.x,t=pos.z-o.z0,b=o.z1-pos.z,m=Math.min(l,rr,t,b); if(m===l) pos.x=o.x0-r; else if(m===rr) pos.x=o.x1+r; else if(m===t) pos.z=o.z0-r; else pos.z=o.z1+r; }
    }
  }
}
function clearRoom(){
  roomGroup.children.slice().forEach(c=>roomGroup.remove(c)); obstacles=[]; door=null;
  if(npc){ scene.remove(npc.m.g); npc=null; }
}
function buildRoom(hx,hz,grid,withDoor){
  // desktop rooms are 2 columns wider than the 11-column layouts: an open lane on each side, blocks keep their size
  if(grid&&!mobileMode&&grid[0].length===11) grid=grid.map(r=>'.'+r+'.');
  clearRoom(); AX=hx; AZ=hz;
  const t=ARENAS[stage].theme;
  tileTex.repeat.set(hx,hz);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(2*hx,2*hz),new THREE.MeshToonMaterial({map:tileTex,gradientMap:grad,color:t.floor}));
  fl.rotation.x=-Math.PI/2; fl.position.y=.01; fl.receiveShadow=true; roomGroup.add(fl);
  // open mat, no walls: a glowing boundary line, and a red hazard band outside it that hurts
  const lineM=basic(t.edge,false); hazardMat=addMat(0xe8243c,.1);
  [[0,-hz,2*hx+.3,.3],[0,hz,2*hx+.3,.3],[-hx,0,.3,2*hz+.3],[hx,0,.3,2*hz+.3]].forEach(([x,z,w,d])=>{ const l=new THREE.Mesh(box(w,.08,d),lineM); l.position.set(x,.05,z); roomGroup.add(l); });
  [[0,-hz-OUTW/2,2*hx+2*OUTW,OUTW],[0,hz+OUTW/2,2*hx+2*OUTW,OUTW],[-hx-OUTW/2,0,OUTW,2*hz],[hx+OUTW/2,0,OUTW,2*hz]].forEach(([x,z,w,d])=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),hazardMat); p.rotation.x=-Math.PI/2; p.position.set(x,.02,z); roomGroup.add(p); });
  const pm=toon(t.wall); [[-hx,-hz],[hx,-hz],[-hx,hz],[hx,hz]].forEach(([x,z])=>{ const b=part(box(.5,1.6,.5),pm,roomGroup,x,.8,z,.08); const s=new THREE.Mesh(box(.54,.14,.54),lineM); s.position.y=.7; b.add(s); });
  if(withDoor){
    const fm=toon(0x2c2632); part(box(.5,2.8,.8),fm,roomGroup,-1.85,1.4,-hz-.3,.1); part(box(.5,2.8,.8),fm,roomGroup,1.85,1.4,-hz-.3,.1); part(box(4.2,.5,.8),fm,roomGroup,0,2.85,-hz-.3,.1);
    const bar=new THREE.Mesh(new THREE.PlaneGeometry(3.2,2.6),addMat(0xe8243c,.45)); bar.position.set(0,1.3,-hz-.3); roomGroup.add(bar);
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.6,1.2,3),basic(0x7dff9a,true,.8)); arrow.rotation.x=-Math.PI/2; arrow.position.set(0,.2,-hz+1.6); arrow.visible=false; roomGroup.add(arrow);
    door={bar,arrow,open:false};
  }
  const trapCells=[];
  if(grid){
    const cols=grid[0].length, rows=grid.length, flip=Math.random()<.5, cx=2*hx/cols, cz=2*hz/rows, bm=toon(t.block);
    grid.forEach((row,r)=>{ for(let c0=0;c0<cols;c0++){ const c=flip?cols-1-c0:c0, ch=row[c0]; if(ch==='.') continue;
      const x=-hx+cx*(c+.5), z=-hz+cz*(r+.5);
      if(ch==='#'){ const b=part(box(cx,1.5,cz),bm,roomGroup,x,.75,z,.1); b.receiveShadow=true; const s=new THREE.Mesh(box(cx+.04,.12,cz+.04),basic(t.edge,false)); s.position.y=.7; b.add(s); obstacles.push({x0:x-cx/2,x1:x+cx/2,z0:z-cz/2,z1:z+cz/2,kind:'block'}); }
      else trapCells.push({x,z});
    } });
  }
  buildNav(grid?grid[0].length*2:0,grid?grid.length*2:0);
  buildTraps(trapCells,grid?2*hx/grid[0].length:2,grid?2*hz/grid.length:2);
  fitCamera();
}
function buildBossRoom(){
  buildRoom(roomHalfX(true),BOSS_Z,null,true);
  const t=ARENAS[stage].theme, bm=toon(t.block), px=AX*.65;
  // High-Co plays a concert: same four cover spots, but they are amp stacks, and the stage, lights and crowd sit around the mat
  hcArena=null;
  if(room&&BOSSES[room.boss]&&(BOSSES[room.boss].form||room.boss)==='highco'){
    const covers=[[-px,-6.5],[px,-6.5],[-px,6.5],[px,6.5]];
    covers.forEach(([x,z])=>obstacles.push({x0:x-.9,x1:x+.9,z0:z-.9,z1:z+.9,kind:'block'}));
    hcArena=buildHighCoArena(AX,AZ,covers); roomGroup.add(hcArena.g); buildNav(); return;
  }
  [[-px,-6.5],[px,-6.5],[-px,6.5],[px,6.5]].forEach(([x,z])=>{ const b=part(box(1.8,2.2,1.8),bm,roomGroup,x,1.1,z,.1); const s=new THREE.Mesh(box(1.84,.14,1.84),basic(t.edge,false)); s.position.y=.8; b.add(s); obstacles.push({x0:x-.9,x1:x+.9,z0:z-.9,z1:z+.9,kind:'block'}); });
  [[7.6,8],[3.2,3.35]].forEach(([a,b])=>{ const hx=new THREE.Mesh(new THREE.RingGeometry(a,b,6),addMat(t.edge,.25)); hx.rotation.x=-Math.PI/2; hx.rotation.z=Math.PI/6; hx.position.y=.03; roomGroup.add(hx); });
  buildNav();
}
/* ground hazards (arena 2+): fire vents and collapsing tiles, always telegraphed before they hurt */
const HAZ_T={vent:[2.4,1,1.3],tile:[3,1.2,2.5]}; // idle, warn, active (seconds)
function addHazards(force=0){
  const ch=sortie.rule.hazards||0; if(!force&&Math.random()>=ch) return; const n=force||2+((Math.random()*3)|0), t=ARENAS[stage].theme;
  const cols=Math.floor(AX);
  for(let i=0;i<n;i++) for(let k=0;k<24;k++){ const x=-AX+2*(((Math.random()*cols)|0)+.5), z=-AZ+2*(((Math.random()*12)|0)+1.5);
    if(inBlock(x,z,1.2)||z>AZ-4||hazards.some(h=>Math.hypot(h.x-x,h.z-z)<3.2)) continue;
    const kind=Math.random()<.55?'vent':'tile', g=new THREE.Group(); g.position.set(x,0,z); roomGroup.add(g);
    let warn,act;
    if(kind==='vent'){ const base=new THREE.Mesh(new THREE.CircleGeometry(1.3,8),basic(0x1a1420,false)); base.rotation.x=-Math.PI/2; base.position.y=.035; g.add(base);
      for(let j=-1;j<=1;j++){ const s=new THREE.Mesh(box(1.8,.02,.16),basic(t.wall,false)); s.position.set(0,.05,j*.45); g.add(s); }
      warn=new THREE.Mesh(new THREE.CircleGeometry(1.3,20),addMat(0xff6a1a,.5)); warn.rotation.x=-Math.PI/2; warn.position.y=.06; g.add(warn);
      act=new THREE.Group(); for(let j=0;j<5;j++){ const f=new THREE.Mesh(new THREE.ConeGeometry(.35,2.2,6),addMat(j%2?0xffd040:0xff6a1a,.8)); const a=j/5*Math.PI*2; f.position.set(Math.cos(a)*.55,1.1,Math.sin(a)*.55); act.add(f); } g.add(act); }
    else { warn=new THREE.Mesh(box(2,.02,2),addMat(0xe8243c,.45)); warn.position.y=.05; g.add(warn);
      act=new THREE.Mesh(box(2,.03,2),basic(0x050306,false)); act.position.y=.04; g.add(act); }
    warn.visible=act.visible=false;
    hazards.push({kind,x,z,g,warn,act,ph:0,t:rand(0,HAZ_T[kind][0]),cd:0}); break; }
}
function updateHazards(dt){
  for(const h of hazards){ const T=HAZ_T[h.kind]; h.t-=dt; h.cd-=dt;
    if(h.t<=0){ h.ph=(h.ph+1)%3; h.t=T[h.ph]; h.warn.visible=h.ph===1; h.act.visible=h.ph===2;
      if(h.ph===2&&h.kind==='tile'){ crossBlast(new V3(h.x,0,h.z),0xe8243c,.5); if(player&&Math.abs(player.pos.x-h.x)<1.1&&Math.abs(player.pos.z-h.z)<1.1){ hurt(14); h.cd=.6; } } }
    if(h.ph===1){ const k=1-h.t/T[1]; h.warn.material.opacity=.25+.35*Math.abs(Math.sin(k*k*30)); }
    if(h.ph===2){ if(h.kind==='vent'){ h.act.children.forEach((f,i)=>{ f.scale.y=.8+Math.random()*.5; }); if(Math.random()<dt*10) sparks(new V3(h.x,1,h.z),0xff8a30,1,4); }
      const pin=player&&!player.dead&&(h.kind==='vent'?Math.hypot(player.pos.x-h.x,player.pos.z-h.z)<1.4:Math.abs(player.pos.x-h.x)<1.05&&Math.abs(player.pos.z-h.z)<1.05);
      if(pin&&h.cd<=0){ h.cd=h.kind==='vent'?.5:.6; hurt(h.kind==='vent'?10:6); }
      if(h.kind==='vent') for(const e of enemies){ if(!e.dead&&!e.fly&&e!==boss&&Math.hypot(e.pos.x-h.x,e.pos.z-h.z)<1.4) e.burn=Math.max(e.burn,1); } } }
}
// a room is clear: hazards fizzle, gold bonus, save. roomUpdate then lets pickups fly in, opens queued choices and finally the door.
function roomCleared(){ if(!room||room.cleared) return; room.cleared=true; room.clearT=0; room.doorPending=true; fizzleRoom(); clearBonus(); logRoomEnd('clear'); if(typeof onRoomClear==='function') onRoomClear(); saveRun(sortie.ri+1); }
// room clear: leftover enemy mines, floor hazards, enemy shots and pending enemy blasts fizzle out harmlessly
function fizzleRoom(){
  emines.forEach(m=>{ sparks(m.g.position.clone().setY(.4),0xa79fae,3,3); roomGroup.remove(m.g); }); emines.length=0;
  hazards.forEach(h=>{ h.warn.visible=h.act.visible=false; }); hazards.length=0;
  for(let i=blasts.length-1;i>=0;i--){ const b=blasts[i]; if(!b.hurtP) continue; scene.remove(b.ring); blasts.splice(i,1); }
  for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; if(b.from!=='e') continue; sparks(b.m.position,0xa79fae,1,3); killBullet(i); }
}
function openDoor(){ if(!door||door.open) return; door.open=true; door.bar.material.color.setHex(0x5fe0ff); door.bar.material.opacity=.25; door.arrow.visible=true; sfx('door'); toast('Room clear','Door open'); }
// spawns keep SPAWN_MIN from the pilot (ambush: AMBUSH_MIN behind or beside); with no such spot in 60 tries the farthest one tried is used
const SPAWN_MIN=8, AMBUSH_MIN=6;
function freeSpot(minFromEntry=6){ let best=null,bd=-1;
  for(let i=0;i<60;i++){ const x=rand(-AX+1.5,AX-1.5), z=rand(-AZ+1.5,AZ-3.5); if(inBlock(x,z,1)) continue; if(Math.hypot(x,z-(AZ-1.5))<minFromEntry) continue;
    const d=player?Math.hypot(x-player.pos.x,z-player.pos.z):99; if(d>=SPAWN_MIN) return new V3(x,0,z); if(d>bd){ bd=d; best=new V3(x,0,z); } }
  return best||new V3(rand(-3,3),0,-AZ+2.5);
}
// mobs unlock in the arena's list order as the run goes on (3 at first, one more every 4 rooms)
function arenaPool(a=sortie.a,ri=sortie.ri){ const A=ARENAS[a], ok=A.mobs.filter(t=>ENEMY[t]); return ok.slice(0,Math.min(ok.length,3+Math.floor(ri/4))); }
const HUNT_TYPES=['drone','crawler','seraph','shardling','lancer'];
/* role-based composition: a COMPS template core (or the next boss's teaching core), then the room budget (roomBudget × PACING k × kind k) fills up
   from the unlocked pool, and the room always ends up with a 'move' and a 'focus' enemy. spec = a room of the run plan. Returns the waves
   (lists of types; '*' = elite, '!' = the hunted elite). Pure: the debug simulation uses it too. */
function composeRoom(spec,a=sortie.a,ri=sortie.ri,rule=sortie.rule,cap=mobileMode?9:11){
  if(typeof spec!=='object') spec={type:spec?'elite':'combat',kind:'normal',k:1};
  const pool=arenaPool(a,ri), K=ROOM_KINDS[spec.kind]||ROOM_KINDS.normal, elite=spec.type==='elite', byTag=g=>pool.filter(t=>ENEMY[t].tag===g);
  let budget=roomBudget(a,ri,elite||spec.kind==='hunt')*(spec.k||1)*(K.k||1), core;
  if(spec.teach&&BOSS_TEACH[BOSSES[spec.teach].form||spec.teach]) core=BOSS_TEACH[BOSSES[spec.teach].form||spec.teach].slice();
  else { const ok=c=>c==='move'||c==='focus'?byTag(c).length>0:pool.includes(c), tpls=COMPS[a].filter(tp=>tp.core.every(ok)), tp=pickOne(tpls.length?tpls:[{core:['move','focus']}]);
    core=tp.core.map(c=>c==='move'||c==='focus'?pickOne(byTag(c).length?byTag(c):pool):c); }
  if(spec.kind==='gauntlet') core=core.slice(0,2);
  const list=[]; for(const t of core){ if(list.length>=cap) break; list.push(t); budget-=ENEMY[t].cost; }
  let guard=0; while(budget>.6&&list.length<cap&&guard++<60){ const t=pickOne(pool); if(ENEMY[t].cost<=budget+.4){ list.push(t); budget-=ENEMY[t].cost; } }
  // the guarantee: one enemy that makes you move, one that demands attention
  for(const g of ['move','focus']) if(!list.some(t=>ENEMY[t].tag===g)&&byTag(g).length) list.push(pickOne(byTag(g)));
  if(elite){ const ep=pool.filter(t=>ENEMY[t].elite!==false); const n=rule.elitePairs?2:1; for(let i=0;i<n;i++) list.unshift(pickOne(ep.length?ep:pool)+'*'); }
  if(spec.kind==='hunt'){ const hp=pool.filter(t=>HUNT_TYPES.includes(t)); list.unshift(pickOne(hp.length?hp:HUNT_TYPES)+'!'); }
  if(spec.kind==='reinforce'){ const w=[], n=K.waves||3, per=Math.ceil(list.length/n); for(let i=0;i<n;i++) w.push(list.slice(i*per,(i+1)*per)); return w.filter(x=>x.length); }
  const big=list.length>6&&!elite&&spec.kind!=='survive'&&spec.kind!=='ambush';
  return big?[list.slice(0,Math.ceil(list.length*.6)),list.slice(Math.ceil(list.length*.6))]:[list];
}
// spawn points: drop-in anywhere (away from you), ambush (behind you and on your flanks), or through a reinforcement gate
function ambushSpot(i){ const p=player.pos; for(let k=0;k<30;k++){ const side=(i+k)%3; let x,z;
    if(side===0){ x=clamp(p.x+rand(-5,5),-AX+1.5,AX-1.5); z=clamp(p.z+rand(AMBUSH_MIN,AMBUSH_MIN+2.5),-AZ+1.5,AZ-1.2); }
    else { x=(side===1?-1:1)*(AX-rand(1.3,2.5)); z=clamp(p.z+rand(-4,3),-AZ+1.5,AZ-1.5); }
    if(!inBlock(x,z,1)&&Math.hypot(x-p.x,z-p.z)>=AMBUSH_MIN) return new V3(x,0,z); } return freeSpot(); }
function gateSpot(g){ const G_=room.gates[g%room.gates.length]; for(let k=0;k<20;k++){ const x=clamp(G_.x+rand(-1.5,1.5)*(G_.side?0:1)+(G_.side?-G_.side*rand(.4,1.4):0),-AX+1,AX-1), z=clamp(G_.z+rand(-1.5,1.5)*(G_.side?1:0)+(G_.side?0:rand(.5,1.5)),-AZ+1,AZ-1); if(!inBlock(x,z,1)) return new V3(x,0,z); } return freeSpot(); }
// a seat for an enemy that never moves (the Main Stage drummer): the far half of the mat, clear of blocks all around, away from you
function seatSpot(){ for(let k=0;k<60;k++){ const x=rand(-AX+3,AX-3), z=rand(-AZ+3,-1); if(inBlock(x,z,2.6)||player&&Math.hypot(x-player.pos.x,z-player.pos.z)<7) continue; return new V3(x,0,z); } return freeSpot(); }
function spawnWave(list,mode){ list.forEach((t,i)=>{ const tag=t.slice(-1), elite=tag==='*'||tag==='!', k=elite?t.slice(0,-1):t;
  const pos=ENEMY[k]&&ENEMY[k].seat?seatSpot():mode==='ambush'?ambushSpot(i):mode==='gate'?gateSpot(i):freeSpot(), e=spawnEnemy(k,pos,elite,{noDrop:mode==='gate'&&!ENEMY[k].seat,hunt:tag==='!'});
  if(e&&mode==='gate'){ e.wake=.25; groundRing(pos,0xff5a3a,2,.4); }
  // an ambush flashes a red ring where each one lands and gives you a beat before it acts
  if(e&&mode==='ambush'){ e.wake=Math.max(e.wake,.8); groundRing(pos,0xff5a3a,2.2,.6); } }); }
// reinforcement gates on the mat edge: the top one (by the door) and one on each side
function buildGates(){ room.gates=[{x:0,z:-AZ+1.2,side:0},{x:-AX+1.2,z:-3,side:-1},{x:AX-1.2,z:-3,side:1}];
  room.gates.forEach(g=>{ const m=new THREE.Mesh(box(g.side?.3:3.4,.1,g.side?3.4:.3),basic(0xff5a3a,false)); m.position.set(g.side?g.side*AX:0,.07,g.side?g.z:-AZ+.2); roomGroup.add(m);
    if(g.side){ const f=new THREE.Mesh(box(.5,2.2,.4),toon(0x2c2632)); [-1.8,1.8].forEach(o=>{ const p=f.clone(); p.position.set(g.side*(AX+.3),1.1,g.z+o); roomGroup.add(p); }); } }); }
/* ================= MAIN STAGE WAVE ROOMS ================= */
// Main Stage mobs open up room by room (STAGE.unlock); the four band members come one at a time
const stageUnlocked=ri=>Object.keys(STAGE.unlock).filter(k=>ENEMY[k]&&ri+1>=STAGE.unlock[k]);
/* the waves of Main Stage room ri (0-based): lists of types ('*' = elite), built from the bestiary's compositions. Sound check: one band member
   (the newest one opens the room) + stage crew. Moshpit: a pack of Moshers (+ crew with what is left of the budget). Encore: the whole band.
   Each wave's budget grows inside the room and from room to room (STAGE.budget). Pure: the debug simulation and DBG.stageCurve use it too. */
function composeStage(ri,mob=mobileMode){
  const W=STAGE, n=W.waves[clamp(ri,0,W.waves.length-1)], ok=stageUnlocked(ri), band=W.band.filter(k=>ok.includes(k)), crew=W.crew.filter(k=>ok.includes(k)), cap=W.cap[mob?0:1], out=[];
  for(let w=0;w<n;w++){ let budget=W.budget.base+W.budget.room*ri+W.budget.wave*w; const list=[], add=t=>{ if(list.length<cap){ list.push(t); budget-=ENEMY[t].cost; } };
    const encore=ri+1>=W.encore.from&&w===n-1&&band.length===W.band.length, mosh=!encore&&ok.includes('mosher')&&ri+1>=W.mosh.from&&(w+1)%W.mosh.every===0;
    if(encore){ band.forEach(add); if(ri+1>=W.encore.elite) list[(Math.random()*list.length)|0]+='*'; }
    else if(mosh){ const sz=mob?W.mosh.sizeM:W.mosh.size, k=Math.min(cap-1,Math.round(rand(sz[0],sz[1]))); for(let i=0;i<k;i++) add('mosher'); }
    else { add(w===0?band[band.length-1]:pickOne(band)); }
    if(crew.length){ add(pickOne(crew)); let g=0; while(budget>.5&&list.length<cap&&g++<40){ const t=pickOne(crew); if(ENEMY[t].cost<=budget+.4) add(t); } }
    out.push(list); }
  return out;
}
// the festival around every Main Stage room: the stage behind the door, screens, light truss, speaker towers and the crowd (built once per size)
let stageDecor=null;
function addStageDecor(){ if(!stageDecor||stageDecor.ax!==AX||stageDecor.az!==AZ){ stageDecor=buildHighCoArena(AX,AZ,[],{crowd:'side'}); stageDecor.ax=AX; stageDecor.az=AZ; } roomGroup.add(stageDecor.g); }
/* wave flow of a Main Stage room (from roomKinds): when a wave is down (amps and summons do not count, they fizzle), a 3-4 s breather shows
   NEXT WAVE on the HUD, then the next wave comes through the gates. The last wave cleared clears the room. */
function stageWaves(dt){
  const S=room.stage, alive=enemies.filter(e=>!e.dead&&!e.minion).length; if(alive) return;
  const fizzle=()=>{ for(const e of enemies.slice()) if(!e.dead&&e!==boss){ e.noLoot=true; killEnemy(e,true); } };
  if(!spawnQ.length){ fizzle(); return; }
  if(S.breath==null){ fizzle(); S.breath=rand(STAGE.breather[0],STAGE.breather[1]); room.timer={name:'NEXT WAVE',t:S.breath,max:S.breath}; refreshControls(); toast('Wave clear',`Wave ${S.w+2}/${S.n} next`); }
  S.breath-=dt; room.timer.t=S.breath;
  if(S.breath<=0){ S.breath=null; room.timer=null; S.w++; room.waveF=S.w/S.n; const list=spawnQ.shift(), enc=list.filter(t=>STAGE.band.includes(t.replace('*',''))).length>=STAGE.band.length;
    spawnWave(list,'gate'); toast(enc?'Encore':`Wave ${S.w+1}/${S.n}`,enc?'The whole band is on stage':''); sfx('door'); refreshControls(); }
}
/* every frame in a Main Stage room: the drummer speeds the band up while he plays, his sky drops fall, the festival lights move. A follow spot
   (spotLit) burns on every beat once you have been inside it for spotGrace seconds; standing in several at once burns like one. */
function stageTick(dt){
  if(!BEAT.force) AU.tempoK=enemies.some(e=>e.type==='drummer'&&!e.dead)?STAGE.drumTempo:1;
  updateSkyDrops(dt);
  if(player&&!player.dead){ player.spotIn=spotLit?(player.spotIn||0)+dt:0; if(BEAT.hit&&player.spotIn>=STAGE.spotGrace){ dotHurt(ENEMY.spot.spot[1]); sparks(player.pos.clone().setY(1),0xff7a3a,4,3); } }
  if(stageDecor&&stageDecor.g.parent) animateHighCoArena(stageDecor,playTime,0);
}
const fightTrack=()=>ARENAS[stage]&&ARENAS[stage].stage?'stage':'battle';
/* room kinds (ROOM_KINDS): how a combat room starts. roomUpdate (main.js) runs the waves, the Survive / Hunt timers and the dark overlay. */
function startCombat(spec,tag){
  const K=ROOM_KINDS[spec.kind]||ROOM_KINDS.normal, waves=spec.kind==='stage'?null:composeRoom(spec);
  if(spec.kind==='gauntlet'){ addRandomTraps(4+Math.min(2,sortie.a),2*AX/11,2*AZ/15); addHazards(3); } else addHazards();
  room.timer=null; room.dark=false;
  if(spec.kind==='stage'){ const W=composeStage(sortie.ri); buildGates(); room.stage={n:W.length,w:0,breath:null}; room.waveF=0; spawnWave(W[0],'gate'); spawnQ=W.slice(1); toast(K.name,`${tag} · Wave 1/${W.length}`); return; }
  if(spec.kind==='ambush'){ room.ambushT=.7; room.ambush=waves[0]; spawnQ=[]; }
  else if(spec.kind==='reinforce'){ buildGates(); spawnWave(waves[0]); spawnQ=waves.slice(1); room.waveMode='gate'; room.waveT=9; }
  else { spawnWave(waves[0]); spawnQ=waves.slice(1); }
  if(spec.kind==='survive'){ room.timer={name:'SURVIVE',t:K.time,max:K.time}; room.spawnT=1.5; }
  if(spec.kind==='hunt'){ room.timer={name:'HUNT',t:K.time,max:K.time}; }
  if(spec.kind==='dark') room.dark=true;
  toast(spec.type==='elite'?'Elite room':K.name,spec.kind==='normal'||spec.kind==='teach'?tag:`${tag} · ${K.sub}`);
}
function startRoom(i,force){
  sortie.ri=i; const plan=sortie.plan&&sortie.plan[i], spec=force&&force.type?{type:force.type,kind:force.kind||(force.type==='combat'||force.type==='elite'?'normal':force.type),k:1,teach:force.teach}:plan||{type:arenaRoomType(i+1),kind:'normal',k:1};
  const type=spec.type;
  clearEnemiesAndShots();
  room={type,kind:spec.kind,spec,cleared:false,hurt:false,completeT:0,boss:type==='boss'?(force&&force.boss||pickBoss()):null};
  if(type==='boss'){ buildBossRoom(); player.pos.set(0,0,AZ-3); }
  else { buildRoom(roomHalfX(),ROOM_Z,type==='angel'?SANCTUM:ROOMS[DBG.layout]||pickOne(ROOMS),true); player.pos.set(0,0,AZ-1.5); if(ARENAS[stage].stage) addStageDecor(); }
  player.vel.set(0,0,0); player.stunT=0; player.slowT=0; AU.tempoK=BEAT.force?AU.tempoK:1; camTarget.set(mobileMode?0:player.pos.x,0,mobileMode?mobileCamZ(player.pos.z):player.pos.z);
  if(typeof onRoomStart==='function') onRoomStart();
  logRoomStart(type);
  $('fade').classList.remove('on');
  const tag=`Room ${i+1}/${sortie.N}`;
  // Main Stage: no Sanctuary on the way, so the crew patches the pilot up backstage before the headliner (STAGE.bossRepair of max armor)
  if(type==='boss'&&ARENAS[stage].stage){ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*STAGE.bossRepair*player.st.heal); toast('Backstage repair',`+${Math.round(STAGE.bossRepair*player.st.heal*100)}% armor`); }
  if(type==='boss'){ snapBoss(); $('warnTxt').textContent=BOSSES[room.boss].warn; setState('warn'); stateT=2.2; $('warn').hidden=false; playTrack('boss'); sfx('beam'); refreshControls(); return; }
  setState('fight'); playTrack(fightTrack());
  if(type==='angel'){ spawnNpc('angel',new V3(0,0,-2)); openDoor(); toast('Sanctuary',tag); }
  else startCombat(spec,tag);
  refreshControls();
}
function clearEnemiesAndShots(){
  enemies.forEach(e=>{ scene.remove(e.model.g,e.model.shadow); if(e.plate) dropPlate(e); }); enemies.length=0; boss=null; setDark(false);
  bullets.forEach(freeBullet); bullets.length=0;
  pickups.forEach(p=>scene.remove(p.m)); pickups.length=0;
  shocks.forEach(s=>scene.remove(s.ring,s.wall)); shocks.length=0;
  mines.forEach(m=>scene.remove(m.g)); mines.length=0;
  holes.forEach(h=>scene.remove(h.g)); holes.length=0;
  if(decoy){ scene.remove(decoy.m.g); decoy=null; }
  hideBeams(); spawnQ=[]; resetAI(); $('bossHud').hidden=true; clearBlasts(); emines.forEach(m=>roomGroup.remove(m.g)); emines.length=0; hazards.length=0;
}
function spawnNpc(kind,pos){
  const m=kind==='angel'?buildSeraph(1.25):buildDevil();
  if(kind==='angel'){ m.core.material=basic(0xffe14a,false); }
  m.g.position.copy(pos); scene.add(m.g);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.8,2,32),addMat(kind==='angel'?0xffe14a:0xd5352a,.6)); ring.rotation.x=-Math.PI/2; ring.position.set(pos.x,.05,pos.z); roomGroup.add(ring);
  npc={kind,m,pos:pos.clone(),t:0,used:false,ring};
  groundRing(pos,kind==='angel'?0xffe14a:0xd5352a,4,.8);
}
function npcGone(){ if(!npc) return; crossBlast(npc.pos.clone(),npc.kind==='angel'?0xffe14a:0xd5352a,.8); scene.remove(npc.m.g); roomGroup.remove(npc.ring); npc=null; }
