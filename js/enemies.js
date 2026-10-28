// Seraph Breaker · enemies.js: Enemy spawning, damage (hitEnemy), kills and pickups.
/* ================= ENEMIES ================= */
const enemyCap=()=>mobileMode?16:22;
// enemy armor and damage multipliers of the current room (arena, room curve in balance.js, curses and modifiers)
// Main Stage rooms also climb from wave to wave (room.waveF: 0 on the first wave .. under 1 on the last)
const roomHpScale=()=>enemyScale(stage,sortie?sortie.ri:0,sortie&&sortie.rule,room&&room.waveF).hp;
const roomDmgScale=()=>{ if(!sortie) return 1; const s=enemyScale(stage,sortie.ri,null,room&&room.waveF); return room&&room.type==='boss'?s.bossDmg:s.dmg; };
// spawns a mob from ENEMY (data.js). Returns null when the room is at its entity cap (splits, summons and chains respect it).
function spawnEnemy(type,pos,elite=false,o={}){
  const def=ENEMY[type]; if(!def) return null;
  if(!o.force&&enemies.filter(x=>!x.dead&&x!==boss).length>=enemyCap()) return null;
  castShadows=false; const model=def.build(o); castShadows=true;
  const e={type:def.ai||type,kind:type,def,model,hp:def.hp,r:def.r,speed:def.speed,sc:def.sc,fly:!!def.fly,angel:!!def.angel,side:Math.random()<.5?-1:1,cd:rand(.5,1.3),walk:0,st:'hover',stT:rand(1.5,3),
    ph:'pos',phT:0,see:false,seeT:0,blindT:0,losT:0,slot:-1,goal:null,path:null,pathT:0,replanT:rand(0,.3),tok:false}; // AI state (enemy-ai.js, nav.js)
  if(type==='mini'){ e.mini=true; e.stT=rand(.8,1.6); }
  if(type==='heavy'){ e.cd=rand(1.5,2.5); e.side=1; }
  if(type==='warden') e.cd=rand(1.8,2.8);
  e.turnFirst=!!(model.legs&&model.hips&&def.speed>0); e.byaw=0; // mechs turn their body before they walk (enemy-ai.js steer)
  if(def.init) def.init(e,o);
  if(o.tier>1&&!elite) tierModel(e,o.tier);
  const R=sortie?sortie.rule:{}, hm=roomHpScale();
  e.hp*=hm*(o.hpK||1)*SCALE.mob; if(o.minion) e.minion=true; e.pos=pos.clone(); e.vel=new V3(); e.flash=0; e.t=0; e.born=0; e.yaw=0; e.stun=0; e.wake=.7; e.burn=0; e.slow=0;
  // juice: springs, knockback, and the drop-in from the light pillar
  e.jz=juiceState(); e.kx=e.kz=0; e.hdx=0; e.hdz=0; e.dropY=o.noDrop?0:9; e.dropV=0; e.standT=0; e.heavyK=def.cost>=2?.45:1;
  if(o.noDrop){ e.born=.5; e.wake=.3; }
  if(elite){ e.elite=true; e.hp*=3.2; e.sc*=1.3; e.r*=1.25; e.model.mats[0].color.lerp(new THREE.Color(0xffc83a),.45);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1.05,32),addMat(0xffc83a,.8)); ring.rotation.x=-Math.PI/2; ring.position.y=.05; ring.userData.nofit=1; e.model.g.add(ring);
    if(R.corruptElites){ corruptModel(e.model,.4); e.hp*=1.2; e.corrupt=true; } }
  // the hunted elite (Hunt rooms) runs faster and escapes when the timer ends
  if(o.hunt){ e.hunt=true; e.speed*=1.25; }
  e.maxHp=e.hp;
  if(elite) applyAffixes(e,o.affix);
  scene.add(e.model.g,e.model.shadow); e.model.g.position.copy(pos);
  enemies.push(e);
  if(!o.noDrop){ const p=new THREE.Mesh(box(1.2,30,1.2),addMat(e.angel?0xffe7a0:0xff5a3a,.7)); p.position.set(pos.x,15,pos.z);
    addFx(p,.6,(f,dt,k)=>{ p.scale.x=p.scale.z=k*1.2+.05; p.material.opacity=k*.7; });
    groundRing(pos,ARENAS[stage].theme.edge,2.5,.5); }
  return e;
}
/* mob tier (TIER in data.js): the side's body tint and 1-2 plates above the model; behavior comes from e.tier in enemy-ai.js */
function tierModel(e,tier){ e.tier=tier; const m=e.model, p=TIER.pal[e.angel?'angel':'machine'][tier]||{}, s=TIER.slot[e.kind]||{};
  if(p.main!=null) tierRecolor(m,s.main==null?0:s.main,p.main); if(p.accent!=null) tierRecolor(m,s.accent==null?1:s.accent,p.accent);
  // the plates float over the model's top (outlines left out), in the model's own scale
  m.g.updateMatrixWorld(true); const bb=new THREE.Box3(), tb=new THREE.Box3();
  m.g.traverse(o=>{ if(o.isMesh&&!o.userData.nofit&&o.material!==outlineMat&&o.visible){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); bb.union(tb); } });
  const y0=(bb.max.y-m.g.position.y+.4)/(m.g.scale.x||1), MP=basic(TIER.plate,false);
  for(let i=0;i<tier-1;i++) part(box(.55,.09,.16),MP,m.g,0,y0+i*.2,0,.04).userData.nofit=1; }
// repaint one mats[] color, and any other toon part of the same color in the model (Bulwark's shield trim)
function tierRecolor(m,i,hex){ const mt=m.mats&&m.mats[i]; if(!mt) return; const old=mt.color.getHex();
  m.g.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshToonMaterial&&o.material.color.getHex()===old) o.material.color.setHex(hex); }); mt.color.setHex(hex); }
/* elite affixes (AFFIX in data.js): 1-2 random ones (corrupted elites and the hunted one: 1, no Blinker on a fleeing or static elite) */
function applyAffixes(e,list){
  let ks=Object.keys(AFFIX).filter(k=>!(k==='blinker'&&(e.hunt||!e.speed))&&!(k==='swift'&&!e.speed));
  const n=e.corrupt||e.hunt?1:Math.random()<.45?2:1; e.affix=Array.isArray(list)?list.filter(k=>AFFIX[k]):[];
  while(!list&&e.affix.length<n&&ks.length){ const k=ks.splice((Math.random()*ks.length)|0,1)[0]; e.affix.push(k); }
  for(const k of e.affix){
    if(k==='swift'){ e.speed*=1.4; e.cdK=(e.cdK||1)*1.3; }
    if(k==='shielded'){ const mx=e.maxHp*.45; e.esh={hp:mx,max:mx,cd:0}; const s=new THREE.Mesh(new THREE.SphereGeometry(e.r*1.15,16,12),addMat(0x5fe0ff,.18)); s.position.y=1.5; s.userData.nofit=1; e.model.g.add(s); e.esh.m=s; }
    if(k==='blinker') e.blinkT=rand(2.5,4);
    if(k==='summoner') e.sumT=rand(3,5);
    if(k==='volatile') e.volatile=true; }
  e.plate=elitePlate(e); scene.add(e.plate);
}
// nameplate above an elite: its name and affixes (a canvas sprite that always faces the camera)
function elitePlate(e){
  const cv=document.createElement('canvas'); cv.width=320; cv.height=80; const g=cv.getContext('2d'); g.textAlign='center'; g.lineJoin='round';
  const line=(txt,y,font,col)=>{ g.font=font; g.lineWidth=6; g.strokeStyle='#0a0610'; g.strokeText(txt,160,y); g.fillStyle=col; g.fillText(txt,160,y); };
  line(((e.corrupt?t('CORRUPTED')+' ':'')+(e.hunt?t('HUNTED'):t('ELITE'))).toLocaleUpperCase(LANG)+' '+e.def.name.toUpperCase(),30,'700 26px "Barlow Condensed",Arial,sans-serif',e.corrupt?'#d8a0ff':'#ffc83a');
  if(e.affix.length) line(e.affix.map(k=>AFFIX[k].name).join(' · '),66,'600 24px "Barlow Condensed",Arial,sans-serif','#ffffff');
  const tex=new THREE.CanvasTexture(cv), sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
  sp.scale.set(mobileMode?6.4:5.6,mobileMode?1.6:1.4,1); sp.renderOrder=20; sp.userData.h=(e.fly?4.3:3)*e.sc/(e.def.sc||1)+.4; return sp;
}
function dropPlate(e){ if(!e.plate) return; scene.remove(e.plate); e.plate.material.map.dispose(); e.plate.material.dispose(); e.plate=null; }
// damage states: parts listed in model.breaks fall off once armor drops below their share, and the stump keeps sparking
function breakParts(e){ const f=e.hp/e.maxHp; for(const b of e.model.breaks){ if(b.done||f>=b.at||!b.o.parent) continue; b.done=true;
  const st=new THREE.Object3D(); st.position.copy(b.o.position); b.o.parent.add(st); (e.stumps||(e.stumps=[])).push(st);
  b.o.getWorldPosition(_tmp2); b.o.userData.broken=true; scene.attach(b.o); pushDebris(b.o,new V3(rand(-3,3)+e.hdx*3,rand(5,8),rand(-3,3)+e.hdz*3),rand(.9,1.3),false); sparks(_tmp2.clone(),0xffc070,6,6); sfx('hit'); } }
function flashModel(e){ e.model.mats.forEach(m=>m.emissive.setHex(0xffffff)); e.flash=.07; }
function unflash(e){ e.model.mats.forEach(m=>m.emissive.setHex(0)); }
// noProc: damage from a proc (no on-hit procs, and a kill from it triggers no on-kill procs). flat: no crit, Rage or boss bonus.
function hitEnemy(e,d,pos,dot,noProc,flat){
  if(e.under) return; // a Borer under the floor
  // player death wins: DoTs, queued blasts, orbits and procs stop dealing damage once the pilot is down
  if(!e||e.dead||!player||player.dead) return;
  if(e===boss){ if(boss.atk==='enter'||boss.immune||state==='cine') return; if(boss.barrier>0){ if(!dot) sparks(pos,0xffa04a,3,5); return; } if(!flat) d*=player.st.boss; if(boss.vuln>0) d*=1.6; if(boss.reflectT>0) d*=.3; }
  const rs=player.rs;
  let crit=false; if(!dot&&!flat&&Math.random()<player.st.crit){ d*=player.critMul||2; crit=true; }
  // Rage (doubled by Blood Engine): more damage as your armor drops
  if(rs.rage&&!flat) d*=1+.25*rs.rage*(rs.blood?2.5:1)*(1-player.hp/player.maxHp);
  if(e.shieldT>0) d*=.5;
  // Main Stage open moments (Dancer landing, Shredder headbang, Diver dazed)
  if(e.vulnT>0&&e!==boss) d*=1.6;
  if(e.mendT>0) d*=.6; // a Mender's repair beam is on it
  // Shielded affix: the barrier soaks 75% of every hit until it breaks; it comes back after 6 s
  if(e.esh&&e.esh.hp>0){ const ab=d*.75; e.esh.hp-=ab; d-=ab; e.esh.m.scale.setScalar(1.12); if(e.esh.hp<=0){ e.esh.cd=6; e.esh.m.visible=false; sparks(e.pos.clone().setY(1.6),0x5fe0ff,10,6); sfx('shield'); } }
  // Headshot: small chance to instantly destroy a normal enemy
  if(rs.headshot&&!dot&&e!==boss&&!e.elite&&Math.random()<Math.min(BAL.cap.headshot,.015*rs.headshot)){ d=e.hp+1; crit=true; sparks(pos,0xffffff,10,8); }
  // High-Co's stage fatigue: the damage counts toward his average first, then the share past the knee is lost (bosses.js hcFatigue)
  if(e===boss&&e.def.fatigue){ const F=e.def.fatigue; e.fatE=(e.fatT?e.fatE*Math.exp(-(playTime-e.fatT)/F.tau):0)+d; e.fatT=playTime; d*=1-hcFatigue(e); }
  if(sortie) sortie.dmgDealt=(sortie.dmgDealt||0)+Math.max(0,Math.min(d,e.hp));
  e.hp-=d;
  if(e===boss&&e.streams) hcStreamHit(e,d); // High-Co: hitting him while he channels cuts the crowd streams
  if(e.model.breaks&&e!==boss&&e.hp>0) breakParts(e);
  if(!dot||Math.random()<.12) flashModel(e);
  if(!dot){ xhHit(); const amt=clamp(d/e.maxHp*1.5,.12,1); hitReact(e,pos,crit?Math.max(amt,.5):amt);
    if(crit) hitstop(45); else if(d>=e.maxHp*.35&&e!==boss) hitstop(55); else if(e===boss&&d>=6) hitstop(40);
    sparks(pos,crit?0xffe14a:unit.shot,crit?6:3,6); sfx('hit');
    if(!noProc){
      if(rs.torch) e.burn=2.5;
      if(rs.cryo) e.slow=1.3;
      if(rs.poison){ e.psn=Math.min((e.psn||0)+1,BAL.proc.poison.stacks[Math.min(3,rs.poison)-1]); e.psnT=3; }
      if(rs.freeze&&e!==boss&&Math.random()<.07*rs.freeze){ e.stun=Math.max(e.stun,.9); e.frozen=.9; e.model.mats.forEach(m=>m.emissive.setHex(0x2a7aa8)); sparks(pos,0x9fe8ff,6,5); }
      if(rs.meteor&&Math.random()<.04*rs.meteor&&procOk('meteor')){ queueBlast(e.pos.x,e.pos.z,{t:.55,rad:3.4,dmg:16*player.st.dmg,color:0xff8a30,size:1}); }
      if(rs.arc&&Math.random()<(rs.arc>1?.35:.2)&&procOk('arc')){ const t=nearestFoe(e.pos,6,null,new Set([e])); if(t){ bolt(pos.clone().setY(2),t.pos.clone().setY(2),0xbfe8ff); hitEnemy(t,d*.6,t.pos.clone().setY(2),false,true); } } } }
  if(e===boss&&!dot) bossPartHit(boss,pos,d);
  if(e.hp<=0) killEnemy(e,noProc);
}
function aoe(pos,rad,dmg,stun=0,knock=0){ for(const e of enemies.slice()){ if(e.dead)continue; const d=Math.hypot(e.pos.x-pos.x,e.pos.z-pos.z); if(d<rad+e.r*.6){ if(stun&&e!==boss) e.stun=Math.max(e.stun,stun); if(knock&&e!==boss&&d>.01){ e.pos.x+=(e.pos.x-pos.x)/d*knock; e.pos.z+=(e.pos.z-pos.z)/d*knock; } hitEnemy(e,dmg,e.pos.clone().setY(2)); } } }
// byProc: the kill came from a proc (or is a cleanup kill), so on-kill procs do not fire again
// a split piece lands on the nearest free spot around (x,z), never inside a block (patch.md 34)
function freeNear(x,z,r){ x=clamp(x,-AX+1,AX-1); z=clamp(z,-AZ+1,AZ-1); if(!inBlock(x,z,r)) return new V3(x,0,z);
  for(let k=1;k<=6;k++) for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, px=clamp(x+Math.sin(a)*k*.6,-AX+1,AX-1), pz=clamp(z+Math.cos(a)*k*.6,-AZ+1,AZ-1); if(!inBlock(px,pz,r)) return new V3(px,0,pz); }
  return new V3(x,0,z); }
function killEnemy(e,byProc){
  if(e.dead) return;
  // High-Co: forms I and II going down start the next form (bosses.js); only form III's death is the boss kill
  if(e===boss&&e.formN&&e.formN<e.formHp.length){ if(!e.immune) highcoFormDown(e); return; }
  e.dead=true; dropToken(e);
  if(e===boss){ bossDeath(); return; }
  // Spark T3 shot down: two small Sparks (1 armor, .45 s fuse, no split) stand still .5 s where it was
  if(e.type==='spark'&&e.tier>=3&&!e.boomed&&!e.noLoot) for(const s of [-1,1]){ const c=spawnEnemy('spark',freeNear(e.pos.x+s*.9,e.pos.z,.6),false,{noDrop:true,force:true}); if(c){ c.hp=c.maxHp=1; c.fuseShort=true; c.wake=.5; c.model.g.scale.multiplyScalar(.6); c.r*=.6; c.gen=1; } }
  if(e.type==='spark'&&!e.boomed){ e.boomed=true; queueBlast(e.pos.x,e.pos.z,{t:.12,rad:2.6,dmg:10*arenaCurve(stage).hp,color:0xffa040,size:.8,skip:e,flat:true}); }
  if(e.ring) e.ring.visible=false;
  // Main Stage floor props (dance pad, follow spot, landing ring, flame jets) go with their owner
  if(e.props){ e.props.forEach(o=>roomGroup.remove(o)); e.props=null; }
  if(e.plate) dropPlate(e);
  // Volatile affix: a telegraphed blast where it died (hurts you and the other enemies)
  if(e.volatile&&!e.noLoot) queueBlast(e.pos.x,e.pos.z,{t:.75,rad:3.4,dmg:10*arenaCurve(stage).hp,hurtP:18,color:0xff3a2a,size:1,skip:e,flat:true});
  // Shardlings split into two smaller copies, twice (capped per room)
  if(e.type==='shardling'&&(e.gen||0)<2&&!e.noLoot){ let n=0; for(const o of enemies) if(o.type==='shardling'&&!o.dead) n++; for(const s of e.tier>=3?[-1,0,1]:[-1,1]){ if(n++>=10) break; const c=spawnEnemy('shardling',freeNear(e.pos.x+s*.9,e.pos.z+(s?0:.9),.6),false,{gen:(e.gen||0)+1,noDrop:true}); if(c){ c.kx=s*7; c.kz=rand(-3,3); c.elite=false; } } }
  if(sortie.rule.volatile){ const o=rand(0,1); for(let i=0;i<6;i++){ const a=(i+o)/6*Math.PI*2; shoot('e',e.pos.clone().setY(1.6),new V3(Math.sin(a),0,Math.cos(a)),4*eSpd(),8,0xb070ff,{life:3,r:.42}); } }
  const mul=e.elite?3:1, def=e.def||ENEMY.drone;
  score+=(def.score*(1+stage*.5)*mul)|0; kills++;
  const rs=player.rs;
  if(rs.vamp) player.hp=Math.min(player.maxHp,player.hp+player.maxHp*(.02*rs.vamp+(rs.blood?.06:0)));
  // Death Nova and Shard Burst: a share of the dying enemy's max armor, capped, no damage multipliers, no further chains
  if(!byProc){ const cap=k=>PROC_KILL[k].cap*roomHpScale(), rk=(k,a)=>a[Math.min(a.length,rs[k])-1];
    if(rs.nova&&procOk('nova')) queueBlast(e.pos.x,e.pos.z,{t:.14,rad:rk('nova',PROC_KILL.nova.rad),dmg:Math.min(e.maxHp*rk('nova',PROC_KILL.nova.pct),cap('nova')),flat:true,color:0xff5a2a,size:.7,skip:e});
    if(rs.shard&&procOk('shard')){ const n=rk('shard',PROC_KILL.shard.n),o=rand(0,1),dmg=Math.min(e.maxHp*rk('shard',PROC_KILL.shard.pct),cap('shard')); for(let i=0;i<n;i++){ const a=(i+o)/n*Math.PI*2; shoot('p',e.pos.clone().setY(1.8),new V3(Math.sin(a),0,Math.cos(a)),22,dmg,unit.shot,{life:.5,proc:true,flat:true}); } } }
  if(rs.dreset&&Math.random()<.35*rs.dreset){ if(mobileMode) player.dashCh=Math.min(player.dashMax,player.dashCh+1); else player.dashCd=0; }
  const angel=e.angel;
  crossBlast(e.pos.clone().setY(.2),angel?0xffd36a:0xff5a2a,def.cost>=2||e.elite?1.3:.9);
  if(e.elite) hitstop(75,true);
  shatter(e.model,e.pos,e.hdx,e.hdz,{crystal:angel?0xffd36a:0,cy:angel?2.2:1.4});
  scene.remove(e.model.g,e.model.shadow); enemies.splice(enemies.indexOf(e),1);
  // Shardling splits and boss summons pay a reduced share, so one Shardling is not worth seven kills; Survive spawns pay e.rw; leftovers pay nothing
  if(e.noLoot) return;
  const rw=(e.gen||e.minion?SPLIT_REWARD:1)*(e.rw==null?1:e.rw);
  const g=def.gold*econAt('killGold',stage)*mul*TIER.gold[(e.tier||1)-1]*(sortie.rule.goldMul||1)*rw*sortie.farm, gc=ECON.gemChance;
  dropGold(e.pos,g,'kill');
  if(Math.random()<(e.elite?gc.elite:def.cost>=2.5?gc.big:gc.small)*rw*sortie.farm) dropPick(e.pos,'gem',1);
  if(e.elite&&Math.random()<.25) dropItem(e.pos);
  if(Math.random()<econAt('healChance',stage)*rw) dropPick(e.pos,'heal',.14);
  if(def.xp) gainXp(def.xp*mul*(1+sortie.a*.12)*rw);
}
function dropPick(pos,kind,v,src){
  let m;
  if(kind==='heal'){ m=new THREE.Group(); const mat=basic(0x7dff9a,false); m.add(new THREE.Mesh(box(.7,.22,.22),mat),new THREE.Mesh(box(.22,.7,.22),mat),new THREE.Mesh(new THREE.SphereGeometry(.6,12,8),basic(0x7dff9a,true,.25))); }
  else if(kind==='gem'){ m=new THREE.Mesh(G.gem,basic(0x5fe0ff,false)); m.add(new THREE.Mesh(G.puff,basic(0x5fe0ff,true,.3))); m.scale.setScalar(1.3); }
  else { m=new THREE.Mesh(G.coin,basic(0xffc83a,false)); m.rotation.x=Math.PI/2; }
  m.position.set(pos.x,1,pos.z); scene.add(m);
  const a=rand(0,Math.PI*2),s=rand(2,5);
  pickups.push({m,kind,v,src:src||'kill',t:0,life:kind==='heal'?12:30,vel:new V3(Math.cos(a)*s,rand(5,8),Math.sin(a)*s)});
}
function dropGold(pos,total,src){ const n=Math.min(6,Math.max(1,Math.round(total/5))); for(let i=0;i<n;i++) dropPick(pos,'gold',total/n,src); }
