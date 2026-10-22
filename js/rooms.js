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
  if(grid){
    const cols=grid[0].length, rows=grid.length, flip=Math.random()<.5, cx=2*hx/cols, cz=2*hz/rows, bm=toon(t.block);
    grid.forEach((row,r)=>{ for(let c0=0;c0<cols;c0++){ const c=flip?cols-1-c0:c0, ch=row[c0]; if(ch==='.') continue;
      const x=-hx+cx*(c+.5), z=-hz+cz*(r+.5);
      if(ch==='#'){ const b=part(box(cx,1.5,cz),bm,roomGroup,x,.75,z,.1); b.receiveShadow=true; const s=new THREE.Mesh(box(cx+.04,.12,cz+.04),basic(t.edge,false)); s.position.y=.7; b.add(s); obstacles.push({x0:x-cx/2,x1:x+cx/2,z0:z-cz/2,z1:z+cz/2,kind:'block'}); }
      else { const w=new THREE.Mesh(box(cx,.06,cz),basic(t.water,false)); w.position.set(x,.04,z); roomGroup.add(w); const gl=new THREE.Mesh(box(cx*.7,.07,cz*.7),addMat(0xffffff,.12)); gl.position.set(x,.05,z); roomGroup.add(gl); obstacles.push({x0:x-cx/2,x1:x+cx/2,z0:z-cz/2,z1:z+cz/2,kind:'water'}); }
    } });
  }
  fitCamera();
}
function buildBossRoom(){
  buildRoom(roomHalfX(true),BOSS_Z,null,true);
  const t=ARENAS[stage].theme, bm=toon(t.block), px=AX*.65;
  [[-px,-6.5],[px,-6.5],[-px,6.5],[px,6.5]].forEach(([x,z])=>{ const b=part(box(1.8,2.2,1.8),bm,roomGroup,x,1.1,z,.1); const s=new THREE.Mesh(box(1.84,.14,1.84),basic(t.edge,false)); s.position.y=.8; b.add(s); obstacles.push({x0:x-.9,x1:x+.9,z0:z-.9,z1:z+.9,kind:'block'}); });
  [[7.6,8],[3.2,3.35]].forEach(([a,b])=>{ const hx=new THREE.Mesh(new THREE.RingGeometry(a,b,6),addMat(t.edge,.25)); hx.rotation.x=-Math.PI/2; hx.rotation.z=Math.PI/6; hx.position.y=.03; roomGroup.add(hx); });
}
/* ground hazards (arena 2+): fire vents and collapsing tiles, always telegraphed before they hurt */
const HAZ_T={vent:[2.4,1,1.3],tile:[3,1.2,2.5]}; // idle, warn, active (seconds)
function addHazards(){
  const ch=sortie.rule.hazards||0; if(Math.random()>=ch) return; const n=2+((Math.random()*3)|0), t=ARENAS[stage].theme;
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
function freeSpot(minFromEntry=6){
  for(let i=0;i<60;i++){ const x=rand(-AX+1.5,AX-1.5), z=rand(-AZ+1.5,AZ-3.5); if(inBlock(x,z,1)) continue; if(Math.hypot(x,z-(AZ-1.5))<minFromEntry) continue; if(player&&Math.hypot(x-player.pos.x,z-player.pos.z)<5) continue; return new V3(x,0,z); }
  return new V3(rand(-3,3),0,-AZ+2.5);
}
// mobs unlock in the arena's list order as the run goes on (2 at first, one more every 4 rooms)
function arenaPool(a=sortie.a,ri=sortie.ri){ const A=ARENAS[a], ok=A.mobs.filter(t=>ENEMY[t]); return ok.slice(0,Math.min(ok.length,2+Math.floor(ri/4))); }
// room budget (roomBudget in balance.js) grows slowly with the room index and the arena; rooms are short: one wave, two at most
// pure: also used by the debug simulation (DBG.sim) without a live run
function composeRoom(elite,a=sortie.a,ri=sortie.ri,rule=sortie.rule,cap=mobileMode?9:11){
  const pool=arenaPool(a,ri);
  let budget=roomBudget(a,ri,elite);
  const list=[]; let guard=0;
  while(budget>.6&&list.length<cap&&guard++<60){ const t=pickOne(pool); if(ENEMY[t].cost<=budget+.4){ list.push(t); budget-=ENEMY[t].cost; } }
  if(list.length<2) list.push(pool[0]);
  if(elite){ const ep=pool.filter(t=>ENEMY[t].elite!==false); const n=rule.elitePairs?2:1; for(let i=0;i<n;i++) list.unshift(pickOne(ep.length?ep:pool)+'*'); }
  const big=list.length>6&&!elite;
  return big?[list.slice(0,Math.ceil(list.length*.6)),list.slice(Math.ceil(list.length*.6))]:[list];
}
function spawnWave(list){ list.forEach(t=>{ const elite=t.endsWith('*'); spawnEnemy(elite?t.slice(0,-1):t,freeSpot(),elite); }); }
function startRoom(i,force){
  sortie.ri=i; const type=force&&force.type||arenaRoomType(i+1);
  clearEnemiesAndShots();
  room={type,cleared:false,hurt:false,completeT:0,boss:type==='boss'?(force&&force.boss||pickBoss()):null};
  if(type==='boss'){ buildBossRoom(); player.pos.set(0,0,AZ-3); }
  else { buildRoom(roomHalfX(),ROOM_Z,type==='angel'?SANCTUM:pickOne(ROOMS),true); player.pos.set(0,0,AZ-1.5); }
  player.vel.set(0,0,0); camTarget.set(mobileMode?0:player.pos.x,0,mobileMode?mobileCamZ(player.pos.z):player.pos.z);
  if(typeof onRoomStart==='function') onRoomStart();
  logRoomStart(type);
  $('fade').classList.remove('on');
  const tag=`Room ${i+1}/${sortie.N}`;
  if(type==='boss'){ $('warnTxt').textContent=BOSSES[room.boss].warn; setState('warn'); stateT=2.2; $('warn').hidden=false; playTrack('boss'); sfx('beam'); refreshControls(); return; }
  setState('fight'); playTrack('battle');
  if(type==='angel'){ spawnNpc('angel',new V3(0,0,-2)); openDoor(); toast('Sanctuary',tag); }
  else { addHazards(); const waves=composeRoom(type==='elite'); spawnWave(waves[0]); spawnQ=waves[1]||[]; toast(type==='elite'?'Elite room':'Hostiles',tag); }
  refreshControls();
}
function clearEnemiesAndShots(){
  enemies.forEach(e=>scene.remove(e.model.g,e.model.shadow)); enemies.length=0; boss=null;
  bullets.forEach(freeBullet); bullets.length=0;
  pickups.forEach(p=>scene.remove(p.m)); pickups.length=0;
  shocks.forEach(s=>scene.remove(s.ring,s.wall)); shocks.length=0;
  mines.forEach(m=>scene.remove(m.g)); mines.length=0;
  holes.forEach(h=>scene.remove(h.g)); holes.length=0;
  if(decoy){ scene.remove(decoy.m.g); decoy=null; }
  hideBeams(); spawnQ=[]; $('bossHud').hidden=true; clearBlasts(); emines.forEach(m=>roomGroup.remove(m.g)); emines.length=0; hazards.length=0;
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
