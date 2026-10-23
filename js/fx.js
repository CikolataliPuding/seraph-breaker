// Seraph Breaker · fx.js: Visual effects: sparks, rings, cross blasts, bolts, shockwaves, toasts.
/* ================= FX ================= */
const G={pB:box(.14,.14,1),pBig:box(.32,.32,1.6),pel:box(.16,.16,.6),mis:box(.16,.16,.5),orb:new THREE.SphereGeometry(.3,10,8),gorb:new THREE.SphereGeometry(.45,14,10),spark:box(.16,.16,.16),plane:new THREE.PlaneGeometry(1,1),ring:new THREE.RingGeometry(.86,1,48),disc:new THREE.CircleGeometry(1,48),wall:new THREE.CylinderGeometry(1,1,1,48,1,true),coin:new THREE.CylinderGeometry(.26,.26,.07,12),gem:new THREE.OctahedronGeometry(.3,0),puff:new THREE.SphereGeometry(.35,8,6),slash:new THREE.RingGeometry(1.9,3.6,22,1,-Math.PI/2-1.2,2.4),blade:box(.9,.1,.25)};
// dispose: true frees the effect's own geometry and material when it ends (both made for this one effect), 'mat' only the material (shared geometry)
function addFx(obj,life,upd,dispose){ scene.add(obj); fx.push({obj,life,max:life,upd,dispose}); }
function fxDispose(f){ if(!f.dispose) return; if(f.dispose!=='mat'&&f.obj.geometry) f.obj.geometry.dispose(); if(f.obj.material) f.obj.material.dispose(); }
function sparks(pos,color,n=8,spd=7){
  if(mobileMode) n=Math.ceil(n*.6);
  for(let i=0;i<n;i++){ const m=new THREE.Mesh(G.spark,basic(color,true)); m.position.copy(pos); const v=new V3(rand(-1,1),rand(.2,1.4),rand(-1,1)).normalize().multiplyScalar(rand(.4,1)*spd);
    addFx(m,rand(.25,.55),(f,dt,k)=>{ v.y-=18*dt; m.position.addScaledVector(v,dt); m.scale.setScalar(k*1.4); }); }
}
function groundRing(pos,color,size,life=.5){ const m=new THREE.Mesh(G.ring,addMat(color,1)); m.rotation.x=-Math.PI/2; m.position.set(pos.x,.06,pos.z); addFx(m,life,(f,dt,k)=>{ m.scale.setScalar(size*(1-k*k)+.3); m.material.opacity=k; }); }
function crossBlast(pos,color,size=1){
  const g=new THREE.Group(); g.position.copy(pos);
  const mat=addMat(color,1),matW=addMat(0xffffff,1);
  const v=new THREE.Mesh(G.plane,mat),h=new THREE.Mesh(G.plane,mat),vc=new THREE.Mesh(G.plane,matW),hc=new THREE.Mesh(G.plane,matW); g.add(v,h,vc,hc);
  addFx(g,.9*size**.3,(f,dt,k)=>{ g.quaternion.copy(cam.quaternion); const t=1-k,grow=Math.min(1,t*6);
    v.scale.set(1.3*size*k+.1,18*size*grow,1); v.position.y=9*size*grow*.35; h.scale.set(9*size*grow,1.1*size*k+.1,1); h.position.y=1.5*size;
    vc.scale.set(.4*size*k,16*size*grow,1); vc.position.y=v.position.y; hc.scale.set(8*size*grow,.35*size*k,1); hc.position.y=h.position.y; mat.opacity=k; matW.opacity=k; });
  groundRing(pos,color,4*size,.7); sparks(pos.clone().setY(1.5),color,14,10*size); shake=Math.max(shake,.35*size);
  sfx(size>1.4?'bigboom':'boom');
}
function bolt(a,b,color){
  const pts=[],n=7; for(let i=0;i<=n;i++){ const p=a.clone().lerp(b,i/n); if(i>0&&i<n){ p.x+=rand(-.45,.45); p.y+=rand(-.45,.45); p.z+=rand(-.45,.45); } pts.push(p); }
  const geo=new THREE.BufferGeometry().setFromPoints(pts); const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  addFx(line,.16,(f,dt,k)=>{ line.material.opacity=k; },true);
}
function shockwave(pos,speed,max,color=0xff3a2a,friendly=false){
  const ring=new THREE.Mesh(G.ring,addMat(color,1)); ring.rotation.x=-Math.PI/2; ring.position.set(pos.x,.08,pos.z);
  const wall=new THREE.Mesh(G.wall,addMat(color,.5)); wall.position.set(pos.x,.45,pos.z); wall.scale.y=.9;
  scene.add(ring,wall); shocks.push({x:pos.x,z:pos.z,r:.5,speed,max,ring,wall,hit:friendly,friendly}); shake=Math.max(shake,.5);
}
function beamFlash(from,to,color,w){
  const o=new THREE.Mesh(beamGeo,addMat(color,.8)),c=new THREE.Mesh(beamGeo,addMat(0xffffff,1)); const len=from.distanceTo(to);
  [o,c].forEach(m=>{ m.position.copy(from); m.lookAt(to); });
  const g=new THREE.Group(); g.add(o,c);
  addFx(g,.28,(f,dt,k)=>{ o.scale.set(w*k,w*k,len); c.scale.set(w*.4*k,w*.4*k,len); o.material.opacity=k*.8; c.material.opacity=k; });
}
// dust puffs (heavy footsteps): a small pool of reused meshes, nothing is allocated per step
const dustPool=[];
function dustPuff(x,z,size=1){ let d=dustPool.find(p=>!p.on); if(!d){ if(dustPool.length>=(mobileMode?10:24)) return; const m=new THREE.Mesh(G.puff,new THREE.MeshBasicMaterial({color:0xd8d0de,transparent:true,opacity:.45,depthWrite:false})); scene.add(m); d={m,on:false,t:0,s:1}; dustPool.push(d); }
  d.on=true; d.t=0; d.s=size; d.m.visible=true; d.m.position.set(x+rand(-.2,.2),.22,z+rand(-.2,.2)); d.m.scale.setScalar(.4*size); }
function updateDust(dt){ for(const d of dustPool){ if(!d.on) continue; d.t+=dt; const k=d.t/.55; if(k>=1){ d.on=false; d.m.visible=false; continue; } d.m.position.y+=dt*.7; d.m.scale.setScalar((.4+k*1.1)*d.s); d.m.material.opacity=.4*(1-k); } }
function clearDust(){ for(const d of dustPool){ d.on=false; d.m.visible=false; } }
function popText(txt){ const el=$('pop'); el.textContent=txt; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
function toast(big,small=''){ const t=$('toast'); t.innerHTML=''; if(small){ const s=document.createElement('small'); s.textContent=small; t.appendChild(s); } t.appendChild(document.createTextNode(big)); t.classList.add('on'); toastT=1.6; }
