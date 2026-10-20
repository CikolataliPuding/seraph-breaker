// Seraph Breaker · enemies.js: Enemy spawning, damage (hitEnemy), kills and pickups.
/* ================= ENEMIES ================= */
function spawnEnemy(type,pos,elite=false){
  let e; castShadows=false;
  const hm=STAGES[stage].hpMul*(1+(sortie?levelInfo(sortie.n).k:0)*.08);
  if(type==='seraph') e={type,model:buildSeraph(1),hp:7,r:1.45,speed:5,st:'hover',stT:rand(1.5,3),side:Math.random()<.5?-1:1,sc:1,fly:true};
  else if(type==='mini') e={type:'seraph',mini:true,model:buildSeraph(.7),hp:4,r:1.05,speed:6,st:'hover',stT:rand(.8,1.6),side:Math.random()<.5?-1:1,sc:.7,fly:true};
  else if(type==='heavy') e={type,model:buildMech(0x5a5244,0xc08a2a,0x2a2620,0xff3030,1.25),hp:20,r:1.7,speed:2.4,cd:rand(1.5,2.5),side:1,walk:0,sc:1.25};
  else if(type==='warden') e={type,model:buildWarden(),hp:11,r:1.45,speed:3,cd:rand(1.8,2.8),side:Math.random()<.5?-1:1,sc:1,fly:true};
  else e={type:'drone',model:buildMech(0x4c4658,0x9a2c42,0x24202c,0xff2a2a,.8),hp:5,r:1.15,speed:3.4,cd:rand(1.2,2.4),side:Math.random()<.5?-1:1,walk:0,sc:.8};
  castShadows=true;
  e.hp*=hm; e.pos=pos.clone(); e.vel=new V3(); e.flash=0; e.t=0; e.born=0; e.yaw=0; e.stun=0; e.wake=.9; e.burn=0; e.slow=0;
  if(elite){ e.elite=true; e.hp*=3.2; e.sc*=1.3; e.r*=1.25; e.model.mats[0].color.lerp(new THREE.Color(0xffc83a),.45);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.05,32),addMat(0xffc83a,.8)); ring.rotation.x=-Math.PI/2; ring.position.y=.05; e.model.g.add(ring); }
  e.maxHp=e.hp;
  scene.add(e.model.g,e.model.shadow); e.model.g.position.copy(pos);
  enemies.push(e);
  const angel=e.fly;
  const p=new THREE.Mesh(box(1.2,30,1.2),addMat(angel?0xffe7a0:0xff5a3a,.7)); p.position.set(pos.x,15,pos.z);
  addFx(p,.6,(f,dt,k)=>{ p.scale.x=p.scale.z=k*1.2+.05; p.material.opacity=k*.7; });
  groundRing(pos,STAGES[stage].theme.edge,2.5,.5);
  return e;
}
function flashModel(e){ e.model.mats.forEach(m=>m.emissive.setHex(0xffffff)); e.flash=.07; }
function unflash(e){ e.model.mats.forEach(m=>m.emissive.setHex(0)); }
function hitEnemy(e,d,pos,dot,noProc){
  if(!e||e.dead) return;
  if(e===boss){ if(boss.atk==='enter'||state==='cine') return; if(boss.barrier>0){ if(!dot) sparks(pos,0xffa04a,3,5); return; } d*=player.st.boss; }
  let crit=false; if(!dot&&Math.random()<player.st.crit){ d*=2; crit=true; }
  e.hp-=d;
  if(!(player.od>0||player.lance>0)) player.sp=Math.min(100,player.sp+d*.55*player.st.sp);
  if(!dot||Math.random()<.12) flashModel(e);
  if(!dot){ sparks(pos,crit?0xffe14a:unit.shot,crit?6:3,6); sfx('hit');
    if(!noProc){ const rs=player.rs;
      if(rs.torch) e.burn=2.5;
      if(rs.cryo) e.slow=1.3;
      if(rs.arc&&Math.random()<(rs.arc>1?.35:.2)){ const t=nearestFoe(e.pos,6,null,new Set([e])); if(t){ bolt(pos.clone().setY(2),t.pos.clone().setY(2),0xbfe8ff); hitEnemy(t,d*.6,t.pos.clone().setY(2),false,true); } } } }
  if(e.hp<=0) killEnemy(e);
}
function aoe(pos,rad,dmg,stun=0,knock=0){ for(const e of enemies.slice()){ if(e.dead)continue; const d=Math.hypot(e.pos.x-pos.x,e.pos.z-pos.z); if(d<rad+e.r*.6){ if(stun&&e!==boss) e.stun=Math.max(e.stun,stun); if(knock&&e!==boss&&d>.01){ e.pos.x+=(e.pos.x-pos.x)/d*knock; e.pos.z+=(e.pos.z-pos.z)/d*knock; } hitEnemy(e,dmg,e.pos.clone().setY(2)); } } }
const XP={drone:1,seraph:1.3,heavy:3,warden:2};
function killEnemy(e){
  e.dead=true;
  if(e===boss){ bossDeath(); return; }
  const mul=e.elite?3:1;
  score+=(({drone:100,seraph:150,heavy:300,warden:250}[e.type]||100)*(1+stage*.5)*mul)|0; kills++;
  if(!(player.od>0||player.lance>0)) player.sp=Math.min(100,player.sp+5*player.st.sp);
  if(player.rs.vamp) player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.02*player.rs.vamp);
  const angel=e.fly;
  crossBlast(e.pos.clone().setY(.2),angel?0xffd36a:0xff5a2a,e.type==='heavy'||e.elite?1.3:.9);
  scene.remove(e.model.g,e.model.shadow); enemies.splice(enemies.indexOf(e),1);
  const g=({drone:6,seraph:8,heavy:16,warden:12}[e.type]||6)*(e.mini?.4:1)*(1+stage*.4)*mul;
  dropGold(e.pos,g);
  if(Math.random()<(e.elite?.3:e.type==='heavy'?.05:.015)) dropPick(e.pos,'gem',1);
  if(Math.random()<.12) dropPick(e.pos,'heal',16);
  if(!e.mini) gainXp((XP[e.type]||1)*mul);
}
function dropPick(pos,kind,v){
  let m;
  if(kind==='heal'){ m=new THREE.Group(); const mat=basic(0x7dff9a,false); m.add(new THREE.Mesh(box(.7,.22,.22),mat),new THREE.Mesh(box(.22,.7,.22),mat),new THREE.Mesh(new THREE.SphereGeometry(.6,12,8),basic(0x7dff9a,true,.25))); }
  else if(kind==='gem'){ m=new THREE.Mesh(G.gem,basic(0x5fe0ff,false)); m.add(new THREE.Mesh(G.puff,basic(0x5fe0ff,true,.3))); m.scale.setScalar(1.3); }
  else { m=new THREE.Mesh(G.coin,basic(0xffc83a,false)); m.rotation.x=Math.PI/2; }
  m.position.set(pos.x,1,pos.z); scene.add(m);
  const a=rand(0,Math.PI*2),s=rand(2,5);
  pickups.push({m,kind,v,t:0,life:kind==='heal'?12:30,vel:new V3(Math.cos(a)*s,rand(5,8),Math.sin(a)*s)});
}
function dropGold(pos,total){ const n=Math.min(6,Math.max(1,Math.round(total/5))); for(let i=0;i<n;i++) dropPick(pos,'gold',total/n); }
