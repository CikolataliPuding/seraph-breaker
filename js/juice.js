// Seraph Breaker · juice.js: Game feel: hitstop, slow motion, springs, hit reactions, muzzle flash and death debris.
/* ================= JUICE ================= */
// hitstop freezes the simulation (not rendering) for a few frames. Never stacks past 120 ms; a short cooldown stops rapid crits from stuttering.
let hitstopT=0,hsCool=0,slowT=0;
function hitstop(ms,force){ if(!force&&hsCool>0) return; hitstopT=Math.min(.12,Math.max(hitstopT,ms/1000)); hsCool=force?.1:.25; }
// slow motion for enemies and their shots (perfect dodge)
function slowmo(s){ slowT=Math.max(slowT,s); }
// small spring: s={x,v}. f = stiffness (rad/s), z = damping ratio (1 = critically damped, <1 overshoots and settles)
const spr=(x=0)=>({x,v:0});
function spring(s,target,dt,f=10,z=.5){ if(dt<=0) return s.x; s.v+=(f*f*(target-s.x)-2*z*f*s.v)*dt; s.x+=s.v*dt; return s.x; }
const juiceState=()=>({tilt:spr(),pop:spr(),lean:spr(),roll:spr(),tlag:spr(),head:spr(),rec:spr(),sq:spr(),py:0});

// enemy hit reaction: knockback impulse along the hit direction, a backward tilt and a squash pop that springs back
function hitReact(e,pos,amt){
  const j=e.jz; if(!j) return;
  const dx=e.pos.x-pos.x,dz=e.pos.z-pos.z,l=Math.hypot(dx,dz);
  if(e!==boss&&l>.01){ const k=amt*(e.elite?1.2:2.2)*(e.heavyK||1); e.kx+=dx/l*k; e.kz+=dz/l*k; e.hdx=dx/l; e.hdz=dz/l; }
  j.tilt.v+=amt*(e===boss?1.2:4); j.pop.v+=amt*(e===boss?1.5:5);
}
// lean into movement, settle with overshoot when stopping, torso lags on turns, head looks at the target
function mechLean(m,j,dt,vx,vz,yaw,lookYaw){
  if(dt<=0) return;
  const s=Math.sin(yaw),c=Math.cos(yaw), fwd=vx*s+vz*c, lat=vx*c-vz*s;
  spring(j.lean,clamp(fwd*.03,-.28,.28),dt,9,.35); spring(j.roll,clamp(-lat*.028,-.22,.22),dt,9,.35);
  const dy=((yaw-j.py+Math.PI*3)%(Math.PI*2))-Math.PI; j.py=yaw;
  spring(j.tlag,clamp(-dy/dt*.05,-.45,.45),dt,12,.45);
  if(m.torso) m.torso.rotation.y+=j.tlag.x;
  if(m.head){ const want=lookYaw==null?0:clamp(((lookYaw-yaw+Math.PI*3)%(Math.PI*2))-Math.PI,-.9,.9); spring(j.head,want-j.tlag.x*1.4,dt,14,.6); m.head.rotation.y=j.head.x; }
}
// applies lean + tilt + pop to a model root (rotation order YXZ: yaw first, then pitch and roll in the model's own frame)
function applyJuice(g,j,dt,sc){
  spring(j.tilt,0,dt,16,.32); spring(j.pop,0,dt,18,.3);
  g.rotation.order='YXZ'; g.rotation.x=j.lean.x-j.tilt.x*.32; g.rotation.z=j.roll.x;
  const p=clamp(j.pop.x,-.6,.6); g.scale.set(sc*(1+p*.12),sc*(1-p*.18),sc*(1+p*.12));
}

/* muzzle flash: one reusable mesh, no per-shot allocation */
const mFlash=new THREE.Mesh(new THREE.OctahedronGeometry(.42,0),addMat(0xffffff,.95)); mFlash.visible=false; scene.add(mFlash);
let mFlashT=0;
function muzzleFlash(pos,color,size=1){ mFlash.position.copy(pos); mFlash.material.color.setHex(color); mFlash.scale.set(size,size,size*1.8); mFlash.rotation.set(rand(0,3),rand(0,3),rand(0,3)); mFlash.visible=true; mFlashT=.05; }

/* death debris: the model's own parts are detached and flung with gravity, spin and one bounce, then shrink away */
const debris=[];
const debrisMax=()=>mobileMode?60:150;
const shardGeo=new THREE.OctahedronGeometry(.22,0), shardPool=[];
shardGeo.userData.shared=mFlash.geometry.userData.shared=true;
function getShard(color){ const m=shardPool.pop()||new THREE.Mesh(shardGeo,null); m.material=basic(color,false); m.scale.set(1,1.8,1); return m; }
function pushDebris(o,v,life,pooled){
  if(debris.length>=debrisMax()) dropDebris(0);
  scene.add(o); debris.push({o,v,s:new V3(rand(-9,9),rand(-9,9),rand(-9,9)),life,max:life,b:0,pooled,base:o.scale.clone()});
}
function dropDebris(i){ const d=debris[i]; scene.remove(d.o); if(d.pooled) shardPool.push(d.o); else if(d.o.geometry&&!d.o.geometry.userData.shared) d.o.geometry.dispose(); debris.splice(i,1); }
const _dbc=new V3(),_dbw=new V3(),_dbs=new THREE.Sphere();
function shatter(model,pos,dx=0,dz=0,opt={}){
  const g=model.g; g.updateMatrixWorld(true);
  const list=[]; g.traverse(o=>{ if(!o.isMesh||o.material===outlineMat||o.userData.nofit) return; const geo=o.geometry; if(!geo.boundingSphere) geo.computeBoundingSphere(); o.getWorldScale(_dbw); list.push([o,geo.boundingSphere.radius*Math.max(_dbw.x,_dbw.y,_dbw.z)]); });
  list.sort((a,b)=>b[1]-a[1]);
  const n=Math.min(list.length,opt.max||(mobileMode?6:12)), spd=opt.spd||1;
  _dbc.set(pos.x,(opt.cy!=null?opt.cy:1.6),pos.z);
  for(let i=0;i<n;i++){ const o=list[i][0]; o.getWorldPosition(_dbw); scene.attach(o);
    const v=_dbw.clone().sub(_dbc); v.y=Math.max(0,v.y); if(v.lengthSq()<.01) v.set(rand(-1,1),0,rand(-1,1)); v.normalize().multiplyScalar(rand(3,7)*spd); v.x+=dx*4*spd; v.z+=dz*4*spd; v.y+=rand(4,8)*spd;
    pushDebris(o,v,rand(.9,1.3),false); }
  if(opt.crystal){ const k=mobileMode?3:7; for(let i=0;i<k;i++){ const m=getShard(i%2?opt.crystal:0xffffff); m.position.set(pos.x+rand(-.6,.6),(opt.cy||2)+rand(-.5,.5),pos.z+rand(-.6,.6)); pushDebris(m,new V3(rand(-7,7)+dx*4,rand(4,10),rand(-7,7)+dz*4),rand(.7,1.1),true); } }
}
function updateJuice(dt){
  if(mFlashT>0){ mFlashT-=dt||.016; if(mFlashT<=0) mFlash.visible=false; }
  if(dt<=0) return;
  for(let i=debris.length-1;i>=0;i--){ const d=debris[i],o=d.o; d.life-=dt;
    d.v.y-=26*dt; o.position.addScaledVector(d.v,dt); o.rotation.x+=d.s.x*dt; o.rotation.y+=d.s.y*dt; o.rotation.z+=d.s.z*dt;
    if(o.position.y<.15&&d.v.y<0){ o.position.y=.15; if(d.b++<1){ d.v.y*=-.42; d.v.x*=.6; d.v.z*=.6; d.s.multiplyScalar(.5); } else { d.v.set(0,0,0); d.s.multiplyScalar(.9); } }
    const k=Math.min(1,d.life/.35); o.scale.copy(d.base).multiplyScalar(Math.max(.001,k));
    if(d.life<=0) dropDebris(i); }
}
function clearJuice(){ while(debris.length) dropDebris(debris.length-1); hitstopT=0; slowT=0; mFlash.visible=false; }
