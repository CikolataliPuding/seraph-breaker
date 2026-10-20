// Seraph Breaker · bullets.js: Projectiles and the run-skill multishot (pshot).
/* ================= BULLETS ================= */
function shoot(from,pos,dir,speed,dmg,color,o={}){
  const geo=from==='p'?(o.geo||G.pB):G.orb;
  const m=new THREE.Mesh(geo,basic(color,from==='p'));
  m.position.copy(pos);
  if(from==='p') m.lookAt(pos.clone().add(dir));
  else { const c=new THREE.Mesh(G.orb,basic(0xffffff,false)); c.scale.setScalar(.5); m.add(c); if(o.scale) m.scale.setScalar(o.scale); }
  scene.add(m);
  const bounce=o.bounce||0;
  bullets.push({m,from,vel:dir.clone().multiplyScalar(speed),dmg,life:o.life||2.2,r:o.r||.45,pierce:!!o.pierce,hit:(o.pierce||bounce)?new Set():null,home:o.home||0,turn:o.turn||2,after:o.after||speed,delay:o.delay||0,seek:o.seek||null,grav:!!o.grav,over:!!o.over,bounce});
}
// player projectiles go through the run skills (twin / diagonal / rear / pierce / ricochet)
function pshot(mz,dir,speed,dmg,color,o={}){
  const rs=player.rs, base=Math.atan2(dir.x,dir.z), tw=rs.twin||0;
  const mk=(a,off,sc)=>{ const d=new V3(Math.sin(a),0,Math.cos(a)); const p=mz.clone().add(new V3(Math.cos(a)*off,0,-Math.sin(a)*off)); shoot('p',p,d,speed,dmg*sc,color,{...o,pierce:o.pierce||rs.pierce>0,bounce:o.pierce?0:(rs.ricochet||0)}); };
  for(let i=0;i<=tw;i++) mk(base,(i-tw/2)*.5,tw?.8:1);
  if(rs.diag){ mk(base+.7,0,.7); mk(base-.7,0,.7); }
  if(rs.rear) mk(base+Math.PI,0,.7);
}
function killBullet(i){ scene.remove(bullets[i].m); bullets.splice(i,1); }
function clearEnemyShots(pos,rad){ for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; if(b.from!=='e')continue; if(!pos||Math.hypot(b.m.position.x-pos.x,b.m.position.z-pos.z)<rad){ if(pos) sparks(b.m.position,0x5fe0ff,1,3); killBullet(i); } } }
