// Seraph Breaker · enemy-ai.js: Enemy behaviour (drones, heavies, wardens, seraphs).
/* ================= ENEMY AI ================= */
function updateEnemies(dt){
  const T=tgt(), small=ARENA<12;
  for(const e of enemies.slice()){
    if(e.dead) continue;
    if(e===boss){ updateBoss(dt); continue; }
    e.t+=dt; e.born=Math.min(1,e.born+dt*3);
    if(e.flash>0){e.flash-=dt;if(e.flash<=0)unflash(e);}
    const to=_tmp.subVectors(T,e.pos).setY(0); const d=to.length()||1; to.divideScalar(d);
    const pd=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
    const m=e.model;
    if(e.wake>0){ e.wake-=dt; e.vel.multiplyScalar(.8); }
    else if(e.stun>0){ e.stun-=dt; e.vel.multiplyScalar(.85); if(Math.random()<dt*6) sparks(e.pos.clone().setY(2.6),0x5fe0ff,1,2); }
    else if(e.type==='drone'||e.type==='heavy'){
      const want=new V3(), far=(e.type==='heavy'?13:11)*(small?.6:1), near=(e.type==='heavy'?8:6.5)*(small?.6:1);
      if(d>far) want.copy(to); else if(d<near) want.copy(to).negate(); else want.set(-to.z*e.side,0,to.x*e.side);
      if(Math.random()<dt*.3)e.side*=-1;
      e.vel.lerp(want.multiplyScalar(e.speed),Math.min(1,dt*3));
      e.cd-=dt;
      if(e.cd<=0&&!player.dead){ m.muzzle.getWorldPosition(_tmp2); const mz=_tmp2.clone().setY(1.7);
        if(e.type==='heavy'){ e.cd=rand(2,2.8)*(e.elite?.75:1); const b=Math.atan2(to.x,to.z), n=e.elite?3:2; for(let i=-n;i<=n;i++){ const a=b+i*.2; shoot('e',mz,new V3(Math.sin(a),0,Math.cos(a)),8*eSpd(),12,0xff5a2a,{life:3.2,r:.5}); } }
        else { e.cd=rand(1.6,2.6)/eSpd(); shoot('e',mz,to.clone(),9*eSpd(),10,0xff5a2a,{life:3,r:.45}); }
        sparks(mz,0xff8a40,3,3); }
      e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*8));
    } else if(e.type==='warden'){
      const want=new V3(-to.z*e.side,0,to.x*e.side).multiplyScalar(e.speed), far=small?9:14, near=small?6:10;
      if(d>far) want.addScaledVector(to,e.speed); else if(d<near) want.addScaledVector(to,-e.speed);
      e.vel.lerp(want,Math.min(1,dt*2)); e.cd-=dt;
      m.eye.scale.setScalar(e.cd<.5?1.3+Math.sin(e.t*40)*.3:1);
      if(e.cd<=0){ e.cd=rand(2.4,3.2)*(e.elite?.7:1); const n=e.elite?14:10,off=rand(0,1); for(let i=0;i<n;i++){ const a=(i+off)/n*Math.PI*2; shoot('e',e.pos.clone().setY(1.8),new V3(Math.sin(a),0,Math.cos(a)),6*eSpd(),10,0xffc040,{life:4,r:.45,over:true}); } }
      e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*6));
    } else {
      e.stT-=dt;
      if(e.st==='hover'){ const want=new V3(-to.z*e.side,0,to.x*e.side).multiplyScalar(e.speed); if(d>8) want.addScaledVector(to,e.speed); else if(d<5) want.addScaledVector(to,-e.speed); e.vel.lerp(want,Math.min(1,dt*2.5)); if(e.stT<=0){ e.st='wind'; e.stT=.65; e.vel.multiplyScalar(.2); } }
      else if(e.st==='wind'){ e.vel.multiplyScalar(.9); e.lock=to.clone(); m.core.scale.setScalar(1.4+Math.sin(e.t*50)*.4); if(e.stT<=0){ e.st='charge'; e.stT=.55; e.vel.copy(e.lock).multiplyScalar(22); } }
      else if(e.st==='charge'){
        if(Math.random()<.5){ const tr=new THREE.Mesh(G.spark,basic(0xffd36a,true)); tr.position.copy(e.pos).setY(2); tr.scale.setScalar(3); addFx(tr,.3,(f,dt,k)=>{tr.scale.setScalar(k*3);}); }
        if(pd<e.r+.5){ hurt(14); e.vel.multiplyScalar(-.3); e.st='hover'; e.stT=rand(1.5,2.5); }
        else if(decoy&&d<e.r+.5){ e.vel.multiplyScalar(-.3); e.st='hover'; e.stT=rand(1.5,2.5); }
        if(e.stT<=0){ e.st='hover'; e.stT=rand(1.8,3.2); m.core.scale.setScalar(1); } }
      e.yaw=lerpAngle(e.yaw,Math.atan2(to.x,to.z),Math.min(1,dt*6));
    }
    if(e.type==='warden'){ m.body.position.y=2.6+Math.sin(e.t*2)*.3; m.rings[0].rotation.x+=dt*1.5; m.rings[1].rotation.y+=dt*1.1; }
    if(e.type==='seraph'){ m.body.position.y=2.1+Math.sin(e.t*2.5)*.3; m.halo.rotation.z+=dt*2; m.wings.forEach((w,i)=>w.rotation.x=Math.sin(e.t*6+i)*.25); }
    for(const o of enemies){ if(o===e||o.dead)continue; const dx=e.pos.x-o.pos.x,dz=e.pos.z-o.pos.z,dd=Math.hypot(dx,dz),mn=(e.r+o.r)*.8; if(dd<mn&&dd>.001){ const k=o===boss?1:.5; e.pos.x+=dx/dd*(mn-dd)*k; e.pos.z+=dz/dd*(mn-dd)*k; } }
    e.pos.addScaledVector(e.vel,dt*(e.slow>0?.55:1));
    if(!e.fly) pushOut(e.pos,e.r*.55);
    e.pos.x=clamp(e.pos.x,-ARENA+1,ARENA-1); e.pos.z=clamp(e.pos.z,-ARENA+1,ARENA-1);
    m.g.position.copy(e.pos); m.g.rotation.y=e.yaw; m.shadow.position.set(e.pos.x,.03,e.pos.z); m.g.scale.setScalar(e.sc*e.born);
    if(e.type==='drone'||e.type==='heavy') stepMech(m,e,e.vel.length(),dt,e.sc);
  }
}
