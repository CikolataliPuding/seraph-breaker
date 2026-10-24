// Seraph Breaker · bullets.js: Projectiles, swept collision against blocks, airborne shots (missiles, Censer orbs) and the run-skill multishot (pshot).
/* ================= BULLETS ================= */
// o.air: 'arc' (homing missile: climbs, commits to a landing point with a ground marker, then comes down and explodes)
//        'float' (Censer orb: hovers above blocks and dives at you). Airborne shots cast a ground shadow and only hit blocks while low.
function shoot(from,pos,dir,speed,dmg,color,o={}){
  const geo=from==='p'?(o.geo||G.pB):G.orb;
  const m=new THREE.Mesh(geo,basic(color,from==='p'));
  m.position.copy(pos);
  if(from==='p') m.lookAt(pos.clone().add(dir));
  else { const c=new THREE.Mesh(G.orb,basic(0xffffff,false)); c.scale.setScalar(.5); m.add(c); if(o.scale) m.scale.setScalar(o.scale); }
  scene.add(m);
  const bounce=o.bounce||0;
  const b={m,from,vel:dir.clone().multiplyScalar(speed),dmg,life:o.life||2.2,r:o.r||.45,wall:o.wall||0,tag:o.tag||'',pierce:!!o.pierce,proc:!!o.proc,flat:!!o.flat,hit:(o.pierce||bounce)?new Set():null,home:o.home||0,turn:o.turn||2,after:o.after||speed,delay:o.delay||0,seek:o.seek||null,grav:!!o.grav,bounce,air:null,t0:playTime};
  if(o.air) b.air=airInit(o.air,pos);
  bullets.push(b);
}
// player projectiles go through the run skills (twin / diagonal / side / rear / storm / pierce / ricochet / wall bounce)
function pshot(mz,dir,speed,dmg,color,o={}){
  const rs=player.rs, base=Math.atan2(dir.x,dir.z), tw=rs.twin||0;
  const mk=(a,off,sc)=>{ const d=new V3(Math.sin(a),0,Math.cos(a)); const p=mz.clone().add(new V3(Math.cos(a)*off,0,-Math.sin(a)*off)); shoot('p',p,d,speed,dmg*sc,color,{...o,pierce:o.pierce||rs.pierce>0,bounce:o.pierce?0:(rs.ricochet||0),wall:rs.wall||0}); };
  for(let i=0;i<=tw;i++) mk(base,(i-tw/2)*.5,BAL.twin[Math.min(tw,BAL.twin.length-1)]);
  // extra projectiles are hard capped (BAL.cap.proj): twin, storm, diagonal, side, rear in that order
  let room=BAL.cap.proj-tw; const two=(a,b,sc)=>{ if(room<2) return; room-=2; mk(a,0,sc); mk(b,0,sc); };
  if(rs.storm) two(base+.2,base-.2,.6);
  if(rs.diag) two(base+.7,base-.7,.7);
  if(rs.side) two(base+Math.PI/2,base-Math.PI/2,.7);
  if(rs.rear&&room>=1) mk(base+Math.PI,0,.7);
}
function freeBullet(b){ scene.remove(b.m); if(b.air){ scene.remove(b.air.sh,b.air.mk); } }
// b (optional): the shot meant to go. If the array shifted since i was read, find it again; if it is already gone, do nothing.
function killBullet(i,b){ if(b&&bullets[i]!==b) i=bullets.indexOf(b); if(i<0||!bullets[i]) return; freeBullet(bullets[i]); bullets.splice(i,1); }
function clearEnemyShots(pos,rad){ for(let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; if(b.from!=='e')continue; if(!pos||Math.hypot(b.m.position.x-pos.x,b.m.position.z-pos.z)<rad){ if(pos) sparks(b.m.position,0x5fe0ff,1,3); killBullet(i); } } }

/* ================= SWEPT COLLISION ================= */
// first block the segment a→b touches, every block grown by r (slab test). {t: 0..1 along the segment, nx/nz: face normal hit} or null.
// A segment that starts inside a block (not just its grown margin) hits at t=0 with no normal.
function sweepBlock(ax,az,bx,bz,r){
  const dx=bx-ax,dz=bz-az; let best=null;
  for(const o of obstacles){ if(o.kind!=='block') continue;
    if(ax>o.x0&&ax<o.x1&&az>o.z0&&az<o.z1) return {t:0,o,nx:0,nz:0};
    let t0=0,t1=1,nx=0,nz=0,ok=true;
    const slab=(a,d,lo,hi,isX)=>{ if(Math.abs(d)<1e-9){ if(a<=lo||a>=hi) ok=false; return; }
      let ta=(lo-a)/d,tb=(hi-a)/d,n=-1; if(ta>tb){ const s=ta; ta=tb; tb=s; n=1; }
      if(ta>t0){ t0=ta; nx=isX?n:0; nz=isX?0:n; } if(tb<t1) t1=tb; if(t0>t1) ok=false; };
    slab(ax,dx,o.x0-r,o.x1+r,true); if(ok) slab(az,dz,o.z0-r,o.z1+r,false);
    // a start inside the grown margin only (no entry face) is ignored; next frame it is either clear or inside the block
    if(!ok||(!nx&&!nz)) continue;
    if(!best||t0<best.t) best={t:t0,o,nx,nz}; }
  return best;
}
// squared distance from point c to segment a→b, and where along it (k: 0..1) the closest point is
const _seg={d2:0,k:0};
function segDist(ax,az,bx,bz,cx,cz){ const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz; let k=l2>1e-9?((cx-ax)*dx+(cz-az)*dz)/l2:0; k=clamp(k,0,1); const px=ax+dx*k-cx,pz=az+dz*k-cz; _seg.d2=px*px+pz*pz; _seg.k=k; return _seg; }

/* ================= AIRBORNE SHOTS ================= */
const AIR_CRUISE={arc:5.2,float:3.2}, AIR_LOW=1.6; // blocks are 1.5 tall: above AIR_LOW a shot flies over them
function airInit(mode,pos){
  const sh=blob(.45); sh.position.set(pos.x,.04,pos.z); scene.add(sh);
  const mk=new THREE.Mesh(G.ring,addMat(0xff2a3a,.85)); mk.rotation.x=-Math.PI/2; mk.visible=false; scene.add(mk);
  return {mode,y:pos.y,sh,mk,L:null,D:0,s:0,t:0};
}
// moves the shot's height and its shadow/marker; returns true when an 'arc' missile reaches the ground (it explodes there)
function airStep(b,dt){
  const A=b.air, p=b.m.position; A.t+=dt;
  if(A.mode==='arc'){
    if(!A.L){ A.y+=(AIR_CRUISE.arc-A.y)*Math.min(1,dt*4);
      // homing is over: commit to the point in line with the target and mark it on the ground
      if(b.home<=0&&player){ const T=tgt(), sp=Math.hypot(b.vel.x,b.vel.z)||1, ux=b.vel.x/sp, uz=b.vel.z/sp;
        const D=clamp((T.x-p.x)*ux+(T.z-p.z)*uz,2.5,16); A.L=new V3(p.x+ux*D,0,p.z+uz*D); A.D=D; A.s=0; A.y0=A.y;
        A.L.x=clamp(A.L.x,-AX,AX); A.L.z=clamp(A.L.z,-AZ,AZ); A.mk.position.set(A.L.x,.07,A.L.z); A.mk.visible=true; } }
    else { A.s+=Math.hypot(b.vel.x,b.vel.z)*dt; const k=Math.min(1,A.s/A.D); A.y=.3+(A.y0-.3)*(1-k*k);
      A.mk.scale.setScalar(1.3+(1-k)*.9); A.mk.material.opacity=.45+.4*Math.abs(Math.sin(k*k*22));
      if(k>=1) return true; }
  } else { const T=tgt(), d=Math.hypot(T.x-p.x,T.z-p.z), want=1.4+(AIR_CRUISE.float-1.4)*clamp((d-1.2)/3.5,0,1);
    A.y+=(want-A.y)*Math.min(1,dt*3);
    // the dive point: where the orb comes down if it keeps its heading
    const dive=d<4.8; A.mk.visible=dive; if(dive){ const sp=Math.hypot(b.vel.x,b.vel.z)||1, f=clamp(d-1.2,0,3.5); A.mk.position.set(p.x+b.vel.x/sp*f,.07,p.z+b.vel.z/sp*f); A.mk.scale.setScalar(1.1); A.mk.material.opacity=.3+.25*Math.abs(Math.sin(A.t*8)); } }
  p.y=A.y+(A.mode==='float'?Math.sin(A.t*3)*.15:0);
  A.sh.position.set(p.x,.04,p.z); const h=clamp(p.y/6,0,1); A.sh.scale.setScalar(1.15-h*.5); A.sh.material.opacity=.4-h*.22;
  return false;
}
// a missile lands: small blast at the marker (it comes from above, so blocks give no cover; dashing still avoids it)
function airLand(b){ const p=b.m.position; crossBlast(new V3(p.x,0,p.z),0xffb040,.55); if(player&&!player.dead&&Math.hypot(player.pos.x-p.x,player.pos.z-p.z)<1.5) hurt(b.dmg); }
