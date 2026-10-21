// Seraph Breaker · enemies.js: Enemy spawning, damage (hitEnemy), kills and pickups.
/* ================= ENEMIES ================= */
const enemyCap=()=>mobileMode?16:22;
// spawns a mob from ENEMY (data.js). Returns null when the room is at its entity cap (splits, summons and chains respect it).
function spawnEnemy(type,pos,elite=false,o={}){
  const def=ENEMY[type]; if(!def) return null;
  if(!o.force&&enemies.filter(x=>!x.dead&&x!==boss).length>=enemyCap()) return null;
  castShadows=false; const model=def.build(o); castShadows=true;
  const e={type:def.ai||type,kind:type,def,model,hp:def.hp,r:def.r,speed:def.speed,sc:def.sc,fly:!!def.fly,angel:!!def.angel,side:Math.random()<.5?-1:1,cd:rand(1.2,2.4),walk:0,st:'hover',stT:rand(1.5,3)};
  if(type==='mini'){ e.mini=true; e.stT=rand(.8,1.6); }
  if(type==='heavy'){ e.cd=rand(1.5,2.5); e.side=1; }
  if(type==='warden') e.cd=rand(1.8,2.8);
  if(def.init) def.init(e,o);
  const R=sortie?sortie.rule:{}, hm=ARENAS[stage].hpMul*(1+(sortie?sortie.ri:0)*.022)*(R.hpMul||1);
  e.hp*=hm*(o.hpK||1); e.pos=pos.clone(); e.vel=new V3(); e.flash=0; e.t=0; e.born=0; e.yaw=0; e.stun=0; e.wake=.9; e.burn=0; e.slow=0;
  // juice: springs, knockback, and the drop-in from the light pillar
  e.jz=juiceState(); e.kx=e.kz=0; e.hdx=0; e.hdz=0; e.dropY=o.noDrop?0:9; e.dropV=0; e.standT=0; e.heavyK=def.cost>=2?.45:1;
  if(o.noDrop){ e.born=.5; e.wake=.3; }
  if(elite){ e.elite=true; e.hp*=3.2; e.sc*=1.3; e.r*=1.25; e.model.mats[0].color.lerp(new THREE.Color(0xffc83a),.45);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.05,32),addMat(0xffc83a,.8)); ring.rotation.x=-Math.PI/2; ring.position.y=.05; ring.userData.nofit=1; e.model.g.add(ring);
    if(R.corruptElites){ corruptModel(e.model,.4); e.hp*=1.2; e.corrupt=true; } }
  e.maxHp=e.hp;
  scene.add(e.model.g,e.model.shadow); e.model.g.position.copy(pos);
  enemies.push(e);
  if(!o.noDrop){ const p=new THREE.Mesh(box(1.2,30,1.2),addMat(e.angel?0xffe7a0:0xff5a3a,.7)); p.position.set(pos.x,15,pos.z);
    addFx(p,.6,(f,dt,k)=>{ p.scale.x=p.scale.z=k*1.2+.05; p.material.opacity=k*.7; });
    groundRing(pos,ARENAS[stage].theme.edge,2.5,.5); }
  return e;
}
function flashModel(e){ e.model.mats.forEach(m=>m.emissive.setHex(0xffffff)); e.flash=.07; }
function unflash(e){ e.model.mats.forEach(m=>m.emissive.setHex(0)); }
function hitEnemy(e,d,pos,dot,noProc){
  if(!e||e.dead) return;
  if(e===boss){ if(boss.atk==='enter'||state==='cine') return; if(boss.barrier>0){ if(!dot) sparks(pos,0xffa04a,3,5); return; } d*=player.st.boss; if(boss.vuln>0) d*=1.6; if(boss.reflectT>0) d*=.3; }
  const rs=player.rs;
  let crit=false; if(!dot&&Math.random()<player.st.crit){ d*=player.critMul||2; crit=true; }
  // Rage (doubled by Blood Engine): more damage as your armor drops
  if(rs.rage) d*=1+.25*rs.rage*(rs.blood?2:1)*(1-player.hp/player.maxHp);
  if(e.shieldT>0) d*=.5;
  // Headshot: small chance to instantly destroy a normal enemy
  if(rs.headshot&&!dot&&e!==boss&&!e.elite&&Math.random()<.015*rs.headshot){ d=e.hp+1; crit=true; sparks(pos,0xffffff,10,8); }
  e.hp-=d;
  if(!(player.od>0||player.lance>0)) player.sp=Math.min(100,player.sp+d*.55*player.st.sp);
  if(!dot||Math.random()<.12) flashModel(e);
  if(!dot){ const amt=clamp(d/e.maxHp*1.5,.12,1); hitReact(e,pos,crit?Math.max(amt,.5):amt);
    if(crit) hitstop(45); else if(d>=e.maxHp*.35&&e!==boss) hitstop(55); else if(e===boss&&d>=6) hitstop(40);
    sparks(pos,crit?0xffe14a:unit.shot,crit?6:3,6); sfx('hit');
    if(!noProc){
      if(rs.torch) e.burn=2.5;
      if(rs.cryo) e.slow=1.3;
      if(rs.poison){ e.psn=Math.min((e.psn||0)+1,3+2*rs.poison); e.psnT=3; }
      if(rs.freeze&&e!==boss&&Math.random()<.07*rs.freeze){ e.stun=Math.max(e.stun,.9); e.frozen=.9; e.model.mats.forEach(m=>m.emissive.setHex(0x2a7aa8)); sparks(pos,0x9fe8ff,6,5); }
      if(rs.meteor&&player.meteorCd<=0&&Math.random()<.04*rs.meteor){ player.meteorCd=.5; queueBlast(e.pos.x,e.pos.z,{t:.55,rad:3.4,dmg:16*player.st.dmg,color:0xff8a30,size:1}); }
      if(rs.arc&&Math.random()<(rs.arc>1?.35:.2)){ const t=nearestFoe(e.pos,6,null,new Set([e])); if(t){ bolt(pos.clone().setY(2),t.pos.clone().setY(2),0xbfe8ff); hitEnemy(t,d*.6,t.pos.clone().setY(2),false,true); } } } }
  if(e===boss&&!dot) bossPartHit(boss,pos,d);
  if(e.hp<=0) killEnemy(e);
}
function aoe(pos,rad,dmg,stun=0,knock=0){ for(const e of enemies.slice()){ if(e.dead)continue; const d=Math.hypot(e.pos.x-pos.x,e.pos.z-pos.z); if(d<rad+e.r*.6){ if(stun&&e!==boss) e.stun=Math.max(e.stun,stun); if(knock&&e!==boss&&d>.01){ e.pos.x+=(e.pos.x-pos.x)/d*knock; e.pos.z+=(e.pos.z-pos.z)/d*knock; } hitEnemy(e,dmg,e.pos.clone().setY(2)); } } }
function killEnemy(e){
  e.dead=true;
  if(e===boss){ bossDeath(); return; }
  if(e.type==='spark'&&!e.boomed){ e.boomed=true; queueBlast(e.pos.x,e.pos.z,{t:.12,rad:2.6,dmg:10*ARENAS[stage].hpMul,color:0xffa040,size:.8,skip:e}); }
  if(e.ring) e.ring.visible=false;
  // Shardlings split into two smaller copies, twice (capped per room)
  if(e.type==='shardling'&&(e.gen||0)<2){ let n=0; for(const o of enemies) if(o.type==='shardling'&&!o.dead) n++; for(const s of [-1,1]){ if(n++>=10) break; const c=spawnEnemy('shardling',new V3(clamp(e.pos.x+s*.9,-AX+1,AX-1),0,clamp(e.pos.z,-AZ+1,AZ-1)),false,{gen:(e.gen||0)+1,noDrop:true}); if(c){ c.kx=s*7; c.kz=rand(-3,3); c.elite=false; } } }
  if(sortie.rule.volatile){ const o=rand(0,1); for(let i=0;i<6;i++){ const a=(i+o)/6*Math.PI*2; shoot('e',e.pos.clone().setY(1.6),new V3(Math.sin(a),0,Math.cos(a)),4*eSpd(),8,0xb070ff,{life:3,r:.42,over:true}); } }
  const mul=e.elite?3:1, def=e.def||ENEMY.drone;
  score+=(def.score*(1+stage*.5)*mul)|0; kills++;
  if(!(player.od>0||player.lance>0)) player.sp=Math.min(100,player.sp+5*player.st.sp);
  const rs=player.rs;
  if(rs.vamp) player.hp=Math.min(player.maxHp,player.hp+player.maxHp*(.02*rs.vamp+(rs.blood?.04:0)));
  if(rs.nova) queueBlast(e.pos.x,e.pos.z,{t:.14,rad:3+.6*rs.nova,dmg:(6+5*rs.nova)*player.st.dmg,color:0xff5a2a,size:.7,skip:e});
  if(rs.shard){ const n=4+2*rs.shard,o=rand(0,1); for(let i=0;i<n;i++){ const a=(i+o)/n*Math.PI*2; shoot('p',e.pos.clone().setY(1.8),new V3(Math.sin(a),0,Math.cos(a)),22,1.6*player.st.dmg,unit.shot,{life:.5}); } }
  if(rs.dreset&&Math.random()<.35*rs.dreset){ if(mobileMode) player.dashCh=Math.min(player.dashMax,player.dashCh+1); else player.dashCd=0; }
  const angel=e.angel;
  crossBlast(e.pos.clone().setY(.2),angel?0xffd36a:0xff5a2a,def.cost>=2||e.elite?1.3:.9);
  if(e.elite) hitstop(75,true);
  shatter(e.model,e.pos,e.hdx,e.hdz,{crystal:angel?0xffd36a:0,cy:angel?2.2:1.4});
  scene.remove(e.model.g,e.model.shadow); enemies.splice(enemies.indexOf(e),1);
  const g=def.gold*(1+stage*.4)*mul*(sortie.rule.goldMul||1);
  dropGold(e.pos,g);
  if(Math.random()<(e.elite?.3:def.cost>=2.5?.05:.015)) dropPick(e.pos,'gem',1);
  if(Math.random()<.12) dropPick(e.pos,'heal',16);
  if(def.xp) gainXp(def.xp*mul*(1+sortie.a*.12)*(e.gen?.35:1));
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
