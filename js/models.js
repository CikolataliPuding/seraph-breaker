// Seraph Breaker · models.js: 3D models: mechs, angels, arena mobs and bosses (from docs/bestiary.html), corrupted variants and the devil.
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
/* ================= ARENA MOBS + BOSSES (ported from docs/bestiary.html) ================= */
// Crawler: small four-legged spider tank. The Siege Arachne boss is a scaled-up one.
function buildCrawler(scale=1,pal){
  const P=pal||{c1:0x4c4658,c2:0x9a2c42,c3:0x24202c,eye:0xff2a2a};
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=1.15; g.add(body);
  const M1=toon(P.c1),M2=toon(P.c2),M3=toon(P.c3),ME=basic(P.eye,false);
  part(box(1.6,.5,1.9),M1,body,0,0,0); part(box(1.1,.3,1.2),M3,body,0,.38,-.1,.06); part(box(1.62,.12,.4),M2,body,0,.05,.78,.04);
  const tur=new THREE.Group(); tur.position.set(0,.68,.1); body.add(tur);
  part(box(.75,.34,.75),M1,tur,0,0,0); [-1,1].forEach(s=>part(box(.1,.1,.95),M3,tur,s*.17,0,.62,.04));
  const eye=new THREE.Mesh(box(.5,.07,.05),ME); eye.position.set(0,.06,.39); tur.add(eye);
  const legs=[];
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx,sz],i)=>{
    const leg=new THREE.Group(); leg.position.set(sx*.75,0,sz*.75); leg.rotation.y=Math.atan2(-sz,sx); body.add(leg);
    const th=part(box(.95,.2,.22),M3,leg,.4,.28,0,.06); th.rotation.z=.55;
    const sh=part(box(.2,1.55,.22),M1,leg,.92,-.28,0,.06); sh.rotation.z=.12;
    part(new THREE.ConeGeometry(.14,.3,4),M2,leg,1.0,-1.05,0,.04).rotation.z=Math.PI;
    legs.push(leg); leg.userData.i=i; leg.userData.ry=leg.rotation.y;
  });
  g.scale.setScalar(scale);
  return {g,body,tur,legs,mats:[M1,M2,M3],shadow:blob(1.4*scale)};
}
// Lancer: thin long-barrel sniper mech. A red laser line tracks you before it fires.
function buildLancer(){
  const m=buildMech(0x3e4a5a,0xe8e8ee,0x1c2028,0x3ad0ff,1.05); const M3=m.mats[2], M2=m.mats[1];
  part(box(.1,1.6,.1),M3,m.rifle,0,-1.5,0,.04); part(box(.16,.3,.16),M2,m.rifle,0,-.5,-.2,.04);
  part(box(.16,.34,.2),M3,m.rifle,0,.1,-.22,.04);
  const laser=new THREE.Mesh(box(.035,7,.035),basic(0xff2a3a,true,.75)); laser.position.y=-5.8; m.rifle.add(laser);
  const ant=part(box(.05,.9,.05),M3,m.torso,-.4,1.6,-.3,.03); ant.rotation.z=.15;
  part(box(.9,.5,.35),M3,m.torso,0,.9,-.5,.06);
  laser.userData.nofit=1; laser.visible=false; m.laser=laser; m.shadow=blob(.95); return m;
}
// Howitzer: tracked mortar. Marks a target circle on the ground and lobs a shell onto it.
function buildHowitzer(){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=.4; g.add(body);
  const M1=toon(0x5a5244),M2=toon(0xc08a2a),M3=toon(0x2a2620),ME=basic(0xff3030,false);
  [-1,1].forEach(s=>{ part(box(.55,.6,2.3),M3,body,s*.85,0,0); part(box(.57,.1,2.32),M2,body,s*.85,.32,0,.04); });
  part(box(1.3,.7,1.7),M1,body,0,.45,0); part(box(.8,.42,.6),M1,body,0,.98,.45,.06);
  const e=new THREE.Mesh(box(.5,.07,.05),ME); e.position.set(0,1.02,.76); body.add(e);
  const mort=new THREE.Group(); mort.position.set(0,.95,-.35); mort.rotation.x=.55; body.add(mort);
  part(new THREE.CylinderGeometry(.3,.36,1.7,10),M3,mort,0,.8,0);
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(.32,.07,6,16),M2); mouth.rotation.x=Math.PI/2; mouth.position.y=1.65; mort.add(mouth);
  part(box(.6,.4,.5),M2,body,0,.6,-1.05,.05);
  const target=new THREE.Mesh(new THREE.RingGeometry(1.1,1.25,32),addMat(0xff3a2a,.7)); target.rotation.x=-Math.PI/2; target.position.set(0,.05,3.2); target.userData.nofit=1; target.visible=false; g.add(target);
  return {g,body,mort,mouth,target,mats:[M1,M2,M3],shadow:blob(1.5)};
}
// Bulwark: mech with a huge front shield that stops shots. Needs pierce or a flank.
function buildBulwark(){
  const m=buildMech(0x5a5244,0xc08a2a,0x2a2620,0xff3030,1.15);
  const sh=new THREE.Group(); sh.position.set(0,.7,1.05); m.torso.add(sh);
  part(box(1.9,2.5,.2),toon(0x3a3d48),sh,0,-.3,0,.08); part(box(1.5,.18,.24),toon(0xc08a2a),sh,0,.55,0,.04);
  const slit=new THREE.Mesh(box(.8,.08,.06),basic(0xff3030,false)); slit.position.set(0,.2,.13); sh.add(slit);
  const hex=new THREE.Mesh(new THREE.RingGeometry(.55,.68,6),addMat(0xff7a2a,.9)); hex.position.set(0,-.55,.13); hex.rotation.z=Math.PI/6; sh.add(hex);
  m.hex=hex; m.shadow=blob(1.1); return m;
}
// Spark: small spiked kamikaze ball. Rolls in, blinks, explodes.
function buildSpark(){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=.75; g.add(body);
  const M1=toon(0x2a2632),M2=toon(0xd5352a);
  part(new THREE.IcosahedronGeometry(.62,0),M1,body,0,0,0,.08);
  [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(d=>{ const c=part(new THREE.ConeGeometry(.15,.5,4),M2,body,d[0]*.68,d[1]*.68,d[2]*.68,.04); c.lookAt(new V3(d[0]*3,d[1]*3,d[2]*3)); c.rotateX(Math.PI/2); });
  const core=new THREE.Mesh(new THREE.SphereGeometry(.34,12,8),basic(0xffa040,true,.9)); body.add(core);
  const warn=new THREE.Mesh(new THREE.RingGeometry(1.6,1.75,32),addMat(0xffa040,.6)); warn.rotation.x=-Math.PI/2; warn.position.y=.05; warn.userData.nofit=1; warn.visible=false; g.add(warn);
  return {g,body,core,warn,mats:[M1,M2],shadow:blob(.6)};
}
// Shardling: crystal cluster. Splits into two smaller copies when it dies.
function buildShardling(){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=1.7; g.add(body);
  const MB=toon(0x3a78ff),MC=toon(0x9ad0ff);
  const main=part(new THREE.OctahedronGeometry(.6,0),MB,body,0,0,0,.08); main.scale.y=1.7;
  const subs=[]; for(let i=0;i<4;i++){ const a=i/4*Math.PI*2; const s=part(new THREE.OctahedronGeometry(.28,0),MC,body,Math.cos(a)*.75,(i%2?.3:-.3),Math.sin(a)*.75,.05); s.scale.y=1.8; s.rotation.z=(i%2?.4:-.4); subs.push(s); }
  const core=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),basic(0xff2236,false)); core.position.z=.42; body.add(core);
  return {g,body,subs,mats:[MB,MC],shadow:blob(.8)};
}
// Cherub: small choir angel. Never attacks; heals and shields enemies in its aura. Priority target.
function buildCherub(){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=2.2; g.add(body);
  const MW=toon(0xf6f0e6),MG=toon(0xd9a520);
  part(new THREE.SphereGeometry(.45,14,10),MW,body,0,0,0,.08);
  const sk=part(new THREE.ConeGeometry(.42,.8,6),MW,body,0,-.62,0,.06); sk.rotation.x=Math.PI;
  const band=new THREE.Mesh(box(.5,.08,.05),basic(0xffd36a,false)); band.position.set(0,.05,.44); body.add(band);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.42,.05,6,28),basic(0xffd36a,false)); halo.rotation.x=Math.PI/2; halo.position.y=.75; body.add(halo);
  const wings=[]; [-1,1].forEach(s=>{ [0,1].forEach(k=>{ const piv=new THREE.Group(); piv.position.set(s*.3,.05-k*.25,-.2); body.add(piv); const w=part(box(.9-k*.25,.06,.32),k?MG:MW,piv,s*(.45-k*.1),0,0,.05); piv.userData.s=s; piv.userData.k=k; wings.push(piv); }); });
  const aura=new THREE.Mesh(new THREE.RingGeometry(2.2,2.35,40),addMat(0x7dff9a,.55)); aura.rotation.x=-Math.PI/2; aura.position.y=.05; aura.userData.nofit=1; g.add(aura);
  return {g,body,halo,wings,aura,mats:[MW,MG],shadow:blob(.6)};
}
// Ophan: two interlocked rings covered in eyes. Rolls in straight lines and leaves slow shots behind.
function buildOphan(scale=1,R=1.3,nr=2,ne=4){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=(R+1.1); g.add(body);
  const MG=toon(0xd9a520),MW=toon(0xf2eef8);
  const rings=[], eyes=[];
  for(let r=0;r<nr;r++){ const rr=R+r*.45; const ring=part(new THREE.TorusGeometry(rr,.13,8,40),MG,body,0,0,0,.06);
    if(r===1) ring.rotation.y=Math.PI/2; if(r===2) ring.rotation.x=Math.PI/2;
    for(let i=0;i<ne;i++){ const a=i/ne*Math.PI*2+r; const eg=new THREE.Group(); eg.position.set(Math.cos(a)*rr,Math.sin(a)*rr,0); ring.add(eg);
      const w=part(new THREE.SphereGeometry(.2,10,8),MW,eg,0,0,0,.05); const p=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),basic(0xff2a3a,false)); p.position.z=.16; eg.add(p); eyes.push({g:eg,w,p,hp:0,alive:true}); }
    rings.push(ring); }
  const core=new THREE.Mesh(new THREE.OctahedronGeometry(.42,0),basic(0xff2236,false)); body.add(core);
  core.add(new THREE.Mesh(new THREE.SphereGeometry(.7,14,10),basic(0xff6a3a,true,.25)));
  g.scale.setScalar(scale);
  return {g,body,rings,core,eyes,mats:[MG,MW],shadow:blob(1.2*scale)};
}
// Censer: chained lantern. Releases slow homing light orbs.
function buildCenser(){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=3.6; g.add(body);
  const MG=toon(0xd9a520),MD=toon(0x2a2232);
  const halo=part(new THREE.TorusGeometry(.55,.07,6,28),MG,body,0,0,0,.04); halo.rotation.x=Math.PI/2;
  const swing=new THREE.Group(); body.add(swing);
  [0,1,2].forEach(i=>{ const a=i/3*Math.PI*2; const c=part(box(.04,1.1,.04),MG,swing,Math.cos(a)*.35,-.55,Math.sin(a)*.35,0); c.rotation.z=Math.cos(a)*.25; c.rotation.x=-Math.sin(a)*.25; });
  const cage=part(new THREE.OctahedronGeometry(.62,0),MD,swing,0,-1.5,0,.08); cage.scale.y=1.35;
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.42,12,8),basic(0xffd36a,true,.85)); glow.position.y=-1.5; swing.add(glow);
  const cap=part(new THREE.ConeGeometry(.35,.4,6),MG,swing,0,-.75,0,.04);
  const orbs=[]; for(let i=0;i<3;i++){ const o=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),basic(0xffe9a0,true,.8)); body.add(o); orbs.push(o); }
  return {g,body,swing,glow,orbs,mats:[MG,MD],shadow:blob(.7)};
}

/* ---- arena bosses ---- */
// Hive Carrier: flying four-rotor carrier. Drops drones and bombs straight lines across the room.
function buildHive(){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=5; g.add(body);
  const M1=toon(0x3a3d48),M2=toon(0xd2382a),M3=toon(0x1c1d24);
  part(box(3.6,1.2,5.6),M1,body,0,0,0,.14); part(new THREE.ConeGeometry(1.2,1.6,4),M1,body,0,0,3.4,.1).rotation.set(Math.PI/2,Math.PI/4,0);
  part(box(1.6,.8,1.6),M3,body,0,.95,1.4,.08); const e=new THREE.Mesh(box(1.1,.12,.06),basic(0xff2a2a,false)); e.position.set(0,1.05,2.22); body.add(e);
  part(box(3.7,.22,.5),M2,body,0,.3,-1.8,.05);
  const bay=new THREE.Mesh(box(2.2,.08,3.2),basic(0xff6a1a,true,.8)); bay.position.y=-.64; body.add(bay);
  [-1,1].forEach(s=>{ const pod=part(box(.6,.6,1.8),M3,body,s*2.1,-.2,.6,.06); for(let i=0;i<3;i++){ const t=new THREE.Mesh(box(.14,.14,.06),basic(0xff3a2a,false)); t.position.set(0,.05-i*.0,.92); t.position.x=(-.18+i*.18); pod.add(t);} });
  const rotors=[];
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx,sz])=>{ const arm=part(box(1.5,.25,.35),M3,body,sx*2.4,.2,sz*2.1,.05); arm.rotation.y=sx*sz*.6;
    const hub=new THREE.Group(); hub.position.set(sx*3.2,.35,sz*2.7); body.add(hub);
    const ring=part(new THREE.TorusGeometry(1.15,.1,6,32),M1,hub,0,0,0,.05); ring.rotation.x=Math.PI/2;
    const bl=new THREE.Group(); hub.add(bl); part(box(2,.06,.26),M2,bl,0,0,0,.03); part(box(.26,.06,2),M2,bl,0,0,0,.03); rotors.push(bl); });
  return {g,body,rotors,bay,mats:[M1,M2,M3],shadow:blob(3.4)};
}
// Siege Arachne: giant spider siege machine. Sweeps with a head laser and lays mine fields.
function buildArachne(){
  const m=buildCrawler(2.6,{c1:0x3a3d48,c2:0xd2382a,c3:0x1c1d24,eye:0xff2a2a});
  const M3=m.mats[2];
  const can=part(new THREE.CylinderGeometry(.22,.3,1.3,10),M3,m.tur,0,.05,.95,.05); can.rotation.x=Math.PI/2;
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),basic(0xff2236,false)); lens.position.set(0,.05,1.62); m.tur.add(lens);
  lens.add(new THREE.Mesh(new THREE.SphereGeometry(.34,12,8),basic(0xff3048,true,.35)));
  [-1,0,1].forEach(i=>{ const sp=part(new THREE.ConeGeometry(.12,.55,4),m.mats[1],m.body,i*.4,.7,-.75,.03); sp.rotation.x=-.4; });
  m.lens=lens; m.shadow=blob(3.6); return m;
}
// Ophanim Throne: three eye-covered rings. Rotating bullet walls, aimed eye fire, a rolling charge.
function buildThrone(){
  const m=buildOphan(1,2.4,3,8);
  const MW=toon(0xf2eef8);
  const wings=new THREE.Group(); wings.position.z=-.8; m.body.add(wings);
  for(let i=0;i<4;i++){ const s=i<2?-1:1,k=i%2; const piv=new THREE.Group(); piv.rotation.z=s*(.7+k*.6); wings.add(piv); part(box(.5,4.2-k*.9,.14),MW,piv,0,2.6,0,.07); piv.userData.base=piv.rotation.z; piv.userData.s=s; }
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.1,.1,8,40),basic(0xffd36a,false)); halo.rotation.x=Math.PI/2; halo.position.y=4; m.body.add(halo);
  m.wings=wings; m.shadow=blob(3.2); return m;
}
// Archon: armored angel judge. Sword waves, a lunge, and a shield phase that reflects your shots.
function buildArchon(){
  const g=new THREE.Group(), body=new THREE.Group(); body.position.y=4.6; g.add(body);
  const MW=toon(0xf2eef8),MG=toon(0xd9a520),MD=toon(0x1c1626),ML=toon(0xd9c9ff);
  const tor=part(new THREE.OctahedronGeometry(1.3,0),MW,body,0,0,0,.14); tor.scale.set(1,1.4,.8);
  part(box(1.1,1,.5),MG,body,0,.35,.6,.08);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),basic(0xff2236,false)); core.position.set(0,.35,.9); body.add(core);
  const sk=part(new THREE.ConeGeometry(1,2.4,6),MD,body,0,-2.2,0,.1); sk.rotation.x=Math.PI;
  const head=new THREE.Group(); head.position.y=2.15; body.add(head);
  part(box(.85,1.05,.85),MW,head,0,0,0,.08); const vis=new THREE.Mesh(box(.6,.1,.06),basic(0xff2236,false)); vis.position.set(0,.05,.45); head.add(vis);
  part(new THREE.ConeGeometry(.14,1,4),MG,head,0,.95,-.1,.04);
  [-1,1].forEach(s=>part(box(.9,.5,1),MG,body,s*1.25,1.1,0,.07));
  const sword=new THREE.Group(); sword.position.set(1.75,.4,.6); sword.rotation.z=-.35; sword.rotation.x=-.25; body.add(sword);
  part(box(.32,4.8,.12),ML,sword,0,2.6,0,.07); part(new THREE.ConeGeometry(.23,.6,4),ML,sword,0,5.3,0,.04);
  part(box(1.1,.2,.3),MG,sword,0,.15,0,.05); part(box(.16,.8,.16),MD,sword,0,-.35,0,.04);
  const edge=new THREE.Mesh(box(.08,4.8,.14),basic(0xffd36a,true,.7)); edge.position.set(.18,2.6,0); sword.add(edge);
  const shield=new THREE.Group(); shield.position.set(-1.75,.1,.7); shield.rotation.y=-.4; body.add(shield);
  part(box(1.7,2.6,.2),MG,shield,0,0,0,.08);
  const hx=new THREE.Mesh(new THREE.RingGeometry(.5,.62,6),addMat(0xffd36a,.9)); hx.position.z=.12; hx.rotation.z=Math.PI/6; shield.add(hx);
  const wings=new THREE.Group(); wings.position.set(0,.8,-.7); body.add(wings);
  for(let i=0;i<4;i++){ const s=i<2?-1:1,k=i%2; const piv=new THREE.Group(); piv.rotation.z=s*(.55+k*.55); wings.add(piv); part(box(.42,3.6-k*.8,.12),MW,piv,0,2.1,0,.06); piv.userData.base=piv.rotation.z; piv.userData.s=s; }
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.8,.07,6,32),basic(0xffd36a,false)); halo.rotation.x=Math.PI/2; halo.position.y=3.1; body.add(halo);
  return {g,body,sword,shield,wings,halo,mats:[MW,MG,MD,ML],shadow:blob(2.2)};
}
// Corrupted variant look: purple tint, crystal spikes and a void aura. Works on any model (mobs, bosses).
function corruptModel(m,amt=.45){
  const tint=new THREE.Color(0x6a1a5a); m.g.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshToonMaterial) o.material.color.lerp(tint,amt); });
  m.g.updateMatrixWorld(true); const bb=new THREE.Box3(); m.g.traverse(o=>{ if(o.isMesh&&!o.userData.nofit&&o.material!==outlineMat) bb.expandByObject(o); });
  const s=bb.getSize(new V3()), c=bb.getCenter(new V3()), sc=m.g.scale.x||1, host=m.torso||m.body||m.g, MV=basic(0xb070ff,false);
  host.updateMatrixWorld(true); const inv=new THREE.Matrix4().copy(host.matrixWorld).invert(), hs=host.getWorldScale(new V3()).x||1;
  [[-.35,.95,-.5,.6],[.35,1,-.5,.7],[0,1.1,-.55,.9],[-.6,.8,-.4,.45],[.6,.8,-.4,.5]].forEach(([x,y,z,k])=>{ const w=new V3(c.x+x*s.x*.5,bb.min.y+y*s.y,c.z+z*s.z*.5).applyMatrix4(inv); const cr=part(new THREE.OctahedronGeometry(.22*k*Math.max(1,s.y/3)/hs,0),MV,host,w.x,w.y,w.z,.03); cr.scale.y=2.2; cr.rotation.x=-.5; });
  const aura=new THREE.Mesh(new THREE.RingGeometry(1,1.08,40),addMat(0xb070ff,.55)); aura.rotation.x=-Math.PI/2; aura.position.y=.05; aura.scale.setScalar(Math.max(1.2,Math.max(s.x,s.z)/sc*.6)); aura.userData.nofit=1; m.g.add(aura);
  m.corrupt=true; return m;
}
// generalized bestiary buildCorrupted: any boss model + purple tint, crystal spikes and a void aura
const buildCorrupted=kind=>corruptModel(BOSS_BUILD[kind](),.45);
const BOSS_BUILD={colossus:buildColossus,prism:buildPrism,seraph:buildSeraphBoss,hive:buildHive,arachne:buildArachne,throne:buildThrone,archon:buildArchon};
for(const k in BOSSES) if(BOSSES[k].form&&!BOSS_BUILD[k]) BOSS_BUILD[k]=()=>buildCorrupted(BOSSES[k].form);
