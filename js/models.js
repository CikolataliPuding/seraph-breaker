// Seraph Breaker · models.js: 3D models: mechs, angels, wardens, bosses and the devil.
/* ================= MODELS ================= */
function buildMech(c1,c2,c3,eye,scale=1,frame=''){
  const g=new THREE.Group(); const M1=toon(c1),M2=toon(c2),M3=toon(c3),ME=basic(eye,false);
  const hips=new THREE.Group(); hips.position.y=1.6; g.add(hips);
  const torso=new THREE.Group(); hips.add(torso);
  part(box(.85,.45,.55),M3,torso,0,.15,0);
  part(box(1.25,.8,.78),M1,torso,0,.75,0);
  part(box(.75,.42,.2),M2,torso,0,.82,.43,.06);
  part(box(.5,.25,.5),M3,torso,0,1.2,0);
  const head=new THREE.Group(); head.position.set(0,1.42,.05); torso.add(head);
  part(box(.36,.4,.5),M1,head,0,.12,0);
  part(box(.3,.18,.3),M3,head,0,-.06,.18,.05);
  const hl=frame==='verdant'?.9:.6;
  const horn=part(new THREE.ConeGeometry(.07,hl,5),M2,head,0,.3+hl*.25,.22,.05); horn.rotation.x=.5;
  if(frame==='crimson') [-1,1].forEach(s=>{ const f=part(box(.05,.4,.26),M2,head,s*.21,.32,0,.04); f.rotation.z=-s*.45; });
  const eyes=new THREE.Mesh(box(frame==='crimson'?.34:.3,.07,.06),ME); eyes.position.set(0,.14,.26); head.add(eyes);
  const sf=frame==='verdant'?1.15:frame==='crimson'?.9:1;
  const arms=[];
  [-1,1].forEach(s=>{
    const sh=part(box(.5*sf,.72*sf,.85*sf),M1,torso,s*.88,1.02,0);
    part(box(.06,.5*sf,.6*sf),M2,sh,s*.26*sf,0,0,.04);
    if(frame==='crimson'){ const sp=part(new THREE.ConeGeometry(.09,.5,4),M2,sh,0,.5,0,.04); sp.rotation.z=-s*.3; }
    const arm=new THREE.Group(); arm.position.set(s*.86,.92,0); torso.add(arm);
    part(box(.28,.6,.28),M3,arm,0,-.38,0,.06);
    part(box(.36,.62,.4),M1,arm,0,-.92,0);
    arms.push(arm);
  });
  const rifle=part(box(.2,1.5,.26),M3,arms[1],0,-1.45,.12,.07);
  part(box(.22,.4,.32),M2,rifle,0,.25,0,.05);
  const muzzle=new THREE.Object3D(); muzzle.position.y=-.8; rifle.add(muzzle);
  const legs=[],shins=[];
  [-1,1].forEach(s=>{
    const leg=new THREE.Group(); leg.position.set(s*.3,0,0); hips.add(leg);
    part(box(.38,.8,.42),M3,leg,0,-.4,0,.07);
    const shin=new THREE.Group(); shin.position.y=-.8; leg.add(shin);
    part(box(.44,.82,.52),M1,shin,0,-.38,0);
    part(box(.46,.18,.75),M2,shin,0,-.73,.1,.06);
    legs.push(leg); shins.push(shin);
  });
  g.scale.setScalar(scale);
  return {g,hips,torso,head,arms,legs,shins,muzzle,rifle,mats:[M1,M2,M3],shadow:blob(.9*scale)};
}
const STRIDE=.5;
function animMech(m,walk,amt){
  const s=Math.sin(walk), c=Math.cos(walk), A=STRIDE*amt;
  // a leg rotating +x pushes its foot backward: that is stance (foot planted, knee straight); the leg swinging forward lifts its knee
  const a0=s*A, a1=-s*A, b0=Math.max(0,-c)*1.1*amt, b1=Math.max(0,c)*1.1*amt;
  m.legs[0].rotation.x=a0; m.legs[1].rotation.x=a1; m.shins[0].rotation.x=b0; m.shins[1].rotation.x=b1;
  // keep the lowest foot planted: hip height = longest vertical leg reach (thigh .8 + shin/foot .82)
  const reach=(a,b)=>.8*Math.cos(a)+.82*Math.cos(a+b);
  m.hips.position.y=Math.max(reach(a0,b0),reach(a1,b1))-.02;
  m.arms[0].rotation.x=-s*.45*amt-.2; m.arms[1].rotation.x=-1.45;
  m.torso.rotation.y=-s*.1*amt; m.torso.rotation.x=.09*amt;
}
// advance the walk phase so a planted foot moves backward exactly as fast as the body moves forward
function stepMech(m,o,spd,dt,scale){
  const amt=clamp(spd/(2*scale),0,1);
  if(amt>.03){ o.walk=(o.walk||0)+dt*spd/(1.62*scale*STRIDE*amt); o.walkAmt=amt; }
  else o.walkAmt=Math.max(0,(o.walkAmt||0)-dt*4);
  animMech(m,o.walk||0,o.walkAmt||0);
}
function buildSeraph(scale=1){
  const g=new THREE.Group(); const body=new THREE.Group(); body.position.y=2.1; g.add(body);
  const MW=toon(0xeee8f4),MD=toon(0x2a2232);
  const crystal=part(new THREE.OctahedronGeometry(.8,0),MW,body,0,0,0,.1); crystal.scale.y=1.6;
  part(new THREE.OctahedronGeometry(.32,0),MD,body,0,-1.25,0,.06);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.28,14,10),basic(0xff2a3a,false)); core.position.z=.55; body.add(core);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.6,.05,6,32),basic(0xffd36a,false)); halo.rotation.x=Math.PI/2; halo.position.y=1.75; body.add(halo);
  const wings=[];
  [-1,1].forEach(s=>{ const w=part(box(1.5,.08,.5),MW,body,s*1.1,.3,-.2,.06); w.rotation.z=s*.5; wings.push(w); const w2=part(box(1.1,.06,.36),MW,body,s*.95,-.15,-.2,.05); w2.rotation.z=s*.15; wings.push(w2); });
  g.scale.setScalar(scale);
  return {g,body,core,halo,wings,mats:[MW,MD],shadow:blob(.8*scale)};
}
function buildWarden(){
  const g=new THREE.Group(); const body=new THREE.Group(); body.position.y=2.6; g.add(body);
  const MW=toon(0xe8e2f0),MG=toon(0xd4a640);
  part(new THREE.SphereGeometry(.7,16,12),MW,body,0,0,0,.1);
  const eye=new THREE.Mesh(new THREE.TorusGeometry(.3,.09,8,24),basic(0xff2a3a,false)); eye.position.z=.66; body.add(eye);
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),basic(0x0a0610,false)); pupil.position.z=.7; body.add(pupil);
  const r1=part(new THREE.TorusGeometry(1.1,.07,6,40),MG,body,0,0,0,.05), r2=part(new THREE.TorusGeometry(1.35,.05,6,40),MG,body,0,0,0,.04);
  return {g,body,rings:[r1,r2],eye,mats:[MW,MG],shadow:blob(.9)};
}
function buildShield(size){ const sh=new THREE.Group(); for(let i=0;i<3;i++) sh.add(new THREE.Mesh(new THREE.RingGeometry(size+i*.6,size+.25+i*.6,6),addMat(0xff7a2a,.8))); sh.add(new THREE.Mesh(new THREE.CircleGeometry(size,6),addMat(0xff7a2a,.18))); sh.visible=false; return sh; }
function buildColossus(){
  const m=buildMech(0x3a3d48,0xd2382a,0x1c1d24,0xff2a2a,3); const MP=toon(0x2a2c34);
  [-1,1].forEach(s=>{ const pod=part(box(.62,.5,.9),MP,m.torso,s*1.0,1.68,-.1,.06); for(let i=0;i<3;i++){ const t=new THREE.Mesh(box(.12,.12,.06),basic(0xff3a2a,false)); t.position.set(-.18+i*.18,.08,.46); pod.add(t);} });
  m.shadow=blob(2.6); m.kind='colossus'; return m;
}
function buildPrism(){
  const g=new THREE.Group(); const body=new THREE.Group(); g.add(body);
  const MB=toon(0x3a78ff),MC=toon(0x9ad0ff);
  const crystal=part(new THREE.OctahedronGeometry(2.6,0),MB,body,0,0,0,.18);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.7,18,12),basic(0xff2236,false)); core.position.z=1.6; body.add(core);
  core.add(new THREE.Mesh(new THREE.SphereGeometry(1.05,18,12),basic(0xff3048,true,.3)));
  const shards=[]; for(let i=0;i<6;i++){ const s=part(new THREE.OctahedronGeometry(.45,0),MC,body,0,0,0,.06); s.scale.y=1.8; const a=i/6*Math.PI*2; s.position.set(Math.cos(a)*4,0,Math.sin(a)*4); shards.push(s); }
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.6,.05,6,64),basic(0x8ad8ff,true,.7)); ring.rotation.x=Math.PI/2; body.add(ring);
  const shield=buildShield(4.2); body.add(shield);
  return {g,body,crystal,core,shards,ring,shield,mats:[MB,MC],shadow:blob(2.8),kind:'prism'};
}
function buildSeraphBoss(){
  const g=new THREE.Group(); const body=new THREE.Group(); g.add(body);
  const MW=toon(0xf2eef8),MB=toon(0x1c1626),MG=toon(0xd9c9ff);
  const crystal=part(new THREE.OctahedronGeometry(2,0),MW,body,0,0,0,.18); crystal.scale.set(1,1.7,1);
  const inner=part(new THREE.OctahedronGeometry(1.2,0),MB,body,0,-2.6,0,.12); inner.scale.y=1.3;
  const core=new THREE.Mesh(new THREE.SphereGeometry(.8,20,14),basic(0xff2236,false)); core.position.z=1.35; body.add(core);
  core.add(new THREE.Mesh(new THREE.SphereGeometry(1.2,20,14),basic(0xff3048,true,.35)));
  const mask=part(box(.9,1.1,.15),MW,body,0,1.6,1.05,.08);
  [-1,1].forEach(s=>{ const h=new THREE.Mesh(box(.18,.26,.05),basic(0x0a0610,false)); h.position.set(s*.2,.12,.09); mask.add(h); });
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.6,.1,8,48),basic(0xffd36a,false)); halo.rotation.x=Math.PI/2; halo.position.y=4; body.add(halo);
  const rings=[0,1].map(i=>{ const r=new THREE.Mesh(new THREE.TorusGeometry(3.4+i*.7,.06,6,64),basic(i?0xff6a1a:0xffffff,true,.7)); body.add(r); return r; });
  const wings=new THREE.Group(); wings.position.z=-.6; body.add(wings);
  for(let i=0;i<6;i++){ const s=i<3?-1:1,k=i%3; const piv=new THREE.Group(); piv.rotation.z=s*(.45+k*.42); wings.add(piv); part(box(.5,4.6-k*.8,.14),MG,piv,0,2.6-k*.3,0,.08); piv.userData.base=piv.rotation.z; piv.userData.s=s; }
  const shield=buildShield(3.8); body.add(shield);
  return {g,body,core,halo,rings,wings,shield,mats:[MW,MB,MG],shadow:blob(3),kind:'seraph'};
}
function buildDevil(){
  const g=new THREE.Group(); const body=new THREE.Group(); body.position.y=2.2; g.add(body);
  const MK=toon(0x2a1430),MR=toon(0xd5352a);
  const c=part(new THREE.OctahedronGeometry(.9,0),MK,body,0,0,0,.1); c.scale.y=1.5;
  [-1,1].forEach(s=>{ const h=part(new THREE.ConeGeometry(.16,.9,5),MR,body,s*.45,1.2,0,.05); h.rotation.z=-s*.5; const e=new THREE.Mesh(box(.16,.07,.05),basic(0xff2a2a,false)); e.position.set(s*.2,.35,.62); body.add(e); });
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.2,.05,6,40),basic(0xd5352a,true,.8)); ring.rotation.x=Math.PI/2; ring.position.y=-1.2; body.add(ring);
  return {g,body,mats:[MK,MR]};
}
const BOSS_BUILD={colossus:buildColossus,prism:buildPrism,seraph:buildSeraphBoss};
