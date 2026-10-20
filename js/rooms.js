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
function buildRoom(R,grid,withDoor){
  clearRoom(); ARENA=R;
  const t=STAGES[stage].theme;
  tileTex.repeat.set(R,R);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(2*R,2*R),new THREE.MeshToonMaterial({map:tileTex,gradientMap:grad,color:t.floor}));
  fl.rotation.x=-Math.PI/2; fl.position.y=.01; fl.receiveShadow=true; roomGroup.add(fl);
  // open mat, no walls: a glowing boundary line, and a red hazard band outside it that hurts
  const lineM=basic(t.edge,false); hazardMat=addMat(0xe8243c,.1);
  [[0,-R,2*R+.3,.3],[0,R,2*R+.3,.3],[-R,0,.3,2*R+.3],[R,0,.3,2*R+.3]].forEach(([x,z,w,d])=>{ const l=new THREE.Mesh(box(w,.08,d),lineM); l.position.set(x,.05,z); roomGroup.add(l); });
  [[0,-R-OUTW/2,2*R+2*OUTW,OUTW],[0,R+OUTW/2,2*R+2*OUTW,OUTW],[-R-OUTW/2,0,OUTW,2*R],[R+OUTW/2,0,OUTW,2*R]].forEach(([x,z,w,d])=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),hazardMat); p.rotation.x=-Math.PI/2; p.position.set(x,.02,z); roomGroup.add(p); });
  const pm=toon(t.wall); [[-R,-R],[R,-R],[-R,R],[R,R]].forEach(([x,z])=>{ const b=part(box(.5,1.6,.5),pm,roomGroup,x,.8,z,.08); const s=new THREE.Mesh(box(.54,.14,.54),lineM); s.position.y=.7; b.add(s); });
  if(withDoor){
    const fm=toon(0x2c2632); part(box(.5,2.8,.8),fm,roomGroup,-1.85,1.4,-R-.3,.1); part(box(.5,2.8,.8),fm,roomGroup,1.85,1.4,-R-.3,.1); part(box(4.2,.5,.8),fm,roomGroup,0,2.85,-R-.3,.1);
    const bar=new THREE.Mesh(new THREE.PlaneGeometry(3.2,2.6),addMat(0xe8243c,.45)); bar.position.set(0,1.3,-R-.3); roomGroup.add(bar);
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.6,1.2,3),basic(0x7dff9a,true,.8)); arrow.rotation.x=-Math.PI/2; arrow.position.set(0,.2,-R+1.6); arrow.visible=false; roomGroup.add(arrow);
    door={bar,arrow,open:false};
  }
  if(grid){
    const flip=Math.random()<.5, cell=2*R/9, bm=toon(t.block);
    grid.forEach((row,r)=>{ for(let c0=0;c0<9;c0++){ const c=flip?8-c0:c0, ch=row[c0]; if(ch==='.') continue;
      const x=-R+cell*(c+.5), z=-R+cell*(r+.5), h=cell/2;
      if(ch==='#'){ const b=part(box(2,1.5,2),bm,roomGroup,x,.75,z,.1); b.receiveShadow=true; const s=new THREE.Mesh(box(2.04,.12,2.04),basic(t.edge,false)); s.position.y=.7; b.add(s); obstacles.push({x0:x-1,x1:x+1,z0:z-1,z1:z+1,kind:'block'}); }
      else { const w=new THREE.Mesh(box(cell,.06,cell),basic(t.water,false)); w.position.set(x,.04,z); roomGroup.add(w); const gl=new THREE.Mesh(box(cell*.7,.07,cell*.7),addMat(0xffffff,.12)); gl.position.set(x,.05,z); roomGroup.add(gl); obstacles.push({x0:x-h,x1:x+h,z0:z-h,z1:z+h,kind:'water'}); }
    } });
  }
}
function buildBossRoom(){
  buildRoom(BOSS_R,null,false);
  const t=STAGES[stage].theme, bm=toon(t.block);
  [[-8,-8],[8,-8],[-8,8],[8,8]].forEach(([x,z])=>{ const b=part(box(1.8,2.2,1.8),bm,roomGroup,x,1.1,z,.1); const s=new THREE.Mesh(box(1.84,.14,1.84),basic(t.edge,false)); s.position.y=.8; b.add(s); obstacles.push({x0:x-.9,x1:x+.9,z0:z-.9,z1:z+.9,kind:'block'}); });
  [[7.6,8],[3.2,3.35]].forEach(([a,b])=>{ const hx=new THREE.Mesh(new THREE.RingGeometry(a,b,6),addMat(t.edge,.25)); hx.rotation.x=-Math.PI/2; hx.rotation.z=Math.PI/6; hx.position.y=.03; roomGroup.add(hx); });
}
function openDoor(){ if(!door||door.open) return; door.open=true; door.bar.material.color.setHex(0x5fe0ff); door.bar.material.opacity=.25; door.arrow.visible=true; sfx('door'); toast('Room clear','Door open'); }
function freeSpot(minFromEntry=6){
  for(let i=0;i<60;i++){ const x=rand(-ARENA+1.5,ARENA-1.5), z=rand(-ARENA+1.5,ARENA-3.5); if(inBlock(x,z,1)) continue; if(Math.hypot(x,z-(ARENA-1.5))<minFromEntry) continue; if(player&&Math.hypot(x-player.pos.x,z-player.pos.z)<5) continue; return new V3(x,0,z); }
  return new V3(rand(-3,3),0,-ARENA+2.5);
}
function composeRoom(elite){
  const inf=levelInfo(sortie.n), cost={drone:1,seraph:1.3,warden:1.9,heavy:2.6};
  let budget=3.6+stage*1.4+inf.k*1.1+sortie.ri*.55; if(elite) budget*=.7;
  const list=[]; let guard=0;
  while(budget>.8&&list.length<10&&guard++<40){ const t=pickOne(inf.pool); if(cost[t]<=budget+.4){ list.push(t); budget-=cost[t]; } }
  if(list.length<2) list.push(D);
  if(elite) list.unshift(stage===0?'heavy*':pickOne(['heavy*','warden*']));
  const big=list.length>5 && !elite;
  return big?[list.slice(0,Math.ceil(list.length*.6)),list.slice(Math.ceil(list.length*.6))]:[list];
}
function spawnWave(list){ list.forEach(t=>{ const elite=t.endsWith('*'); spawnEnemy(elite?t.slice(0,-1):t,freeSpot(),elite); }); }
function startRoom(i){
  sortie.ri=i; const type=sortie.rooms[i];
  clearEnemiesAndShots();
  room={type,cleared:false,hurt:false,completeT:0};
  if(type==='boss'){ buildBossRoom(); player.pos.set(0,0,10); }
  else { buildRoom(ROOM_R,type==='angel'?SANCTUM:pickOne(ROOMS),true); player.pos.set(0,0,ARENA-1.5); }
  player.vel.set(0,0,0); camTarget.copy(player.pos);
  $('fade').classList.remove('on');
  if(type==='boss'){ $('warnTxt').textContent=BOSSES[STAGES[stage].boss].warn; state='warn'; stateT=2.2; $('warn').hidden=false; playTrack('boss'); sfx('beam'); return; }
  state='fight'; playTrack('battle');
  if(type==='angel'){ spawnNpc('angel',new V3(0,0,-1)); openDoor(); toast('Sanctuary',`Room ${i+1}/${sortie.rooms.length}`); }
  else { const waves=composeRoom(type==='elite'); spawnWave(waves[0]); spawnQ=waves[1]||[]; toast(type==='elite'?'Elite room':'Hostiles',`Room ${i+1}/${sortie.rooms.length}`); }
  refreshControls();
}
function clearEnemiesAndShots(){
  enemies.forEach(e=>scene.remove(e.model.g,e.model.shadow)); enemies.length=0; boss=null;
  bullets.forEach(b=>scene.remove(b.m)); bullets.length=0;
  pickups.forEach(p=>scene.remove(p.m)); pickups.length=0;
  shocks.forEach(s=>scene.remove(s.ring,s.wall)); shocks.length=0;
  mines.forEach(m=>scene.remove(m.g)); mines.length=0;
  holes.forEach(h=>scene.remove(h.g)); holes.length=0;
  if(decoy){ scene.remove(decoy.m.g); decoy=null; }
  hideBeams(); spawnQ=[]; $('bossHud').hidden=true;
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
