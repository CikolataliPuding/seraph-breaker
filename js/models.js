// Seraph Breaker · models.js: 3D models: mechs, angels, arena mobs and bosses (from docs/bestiary.html), the Main Stage cast (docs/main-stage.html), High-Co and his concert stage, corrupted variants and the devil.
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
// advance the walk phase so a planted foot moves backward exactly as fast as the body moves forward (dir -1: walking backward).
// Returns true on a footfall (a foot plants), for dust and footsteps.
function stepMech(m,o,spd,dt,scale,dir=1){
  const amt=clamp(spd/(2*scale),0,1); let fall=false;
  if(amt>.03){ const w0=o.walk||0; o.walk=w0+dir*dt*spd/(1.62*scale*STRIDE*amt); o.walkAmt=amt; fall=amt>.25&&Math.floor(o.walk/Math.PI)!==Math.floor(w0/Math.PI); }
  else o.walkAmt=Math.max(0,(o.walkAmt||0)-dt*4);
  animMech(m,o.walk||0,o.walkAmt||0);
  return fall;
}
/* Seraph (charger): a crystal with a forward lance, a glowing core ring, feathered wings and trailing ribbons that stream behind it.
   Damage states (m.breaks): two ribbons fall off below 50% armor, an inner wing below 25%. */
function buildSeraph(scale=1){
  const g=new THREE.Group(); const body=new THREE.Group(); body.position.y=2.1; g.add(body);
  const MW=toon(0xeee8f4),MD=toon(0x2a2232),MG=toon(0xd9c9ff);
  const crystal=part(new THREE.OctahedronGeometry(.8,0),MW,body,0,0,0,.1); crystal.scale.y=1.6;
  part(new THREE.OctahedronGeometry(.32,0),MD,body,0,-1.25,0,.06);
  const lance=part(new THREE.ConeGeometry(.17,1.15,5),MD,body,0,-.15,.95,.05); lance.rotation.x=Math.PI/2;
  const core=new THREE.Mesh(new THREE.SphereGeometry(.28,14,10),basic(0xff2a3a,false)); core.position.z=.55; body.add(core);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.4,.045,6,20),basic(0xff5a6a,true,.85)); ring.position.z=.58; body.add(ring);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.6,.05,6,32),basic(0xffd36a,false)); halo.rotation.x=Math.PI/2; halo.position.y=1.75; body.add(halo);
  const wings=[];
  [-1,1].forEach(s=>{ const w=part(box(1.5,.08,.5),MW,body,s*1.1,.3,-.2,.06); w.rotation.z=s*.5; wings.push(w);
    [0,1].forEach(k=>part(box(.42,.05,.28),MG,w,s*(.55+k*.32),-.02,-.28-k*.06,.03));
    const w2=part(box(1.1,.06,.36),MW,body,s*.95,-.15,-.2,.05); w2.rotation.z=s*.15; wings.push(w2); });
  const ribbons=[-1,0,1].map(i=>{ const p=new THREE.Group(); p.position.set(i*.26,-1.35,-.2); body.add(p); part(box(.09,1,.04),MG,p,0,-.5,0,.03); return p; });
  g.scale.setScalar(scale);
  return {g,body,core,ring,halo,wings,ribbons,mats:[MW,MD,MG],shadow:blob(.8*scale),breaks:[{o:ribbons[0],at:.5},{o:ribbons[2],at:.5},{o:wings[1],at:.25}]};
}
/* Warden (area denial): an eye orb inside gold rings, ringed by four petal shields that open before it fires, a glowing iris
   and three chains swaying under it. Damage states: two petals fall off below 50% armor, the outer ring below 25%. */
function buildWarden(){
  const g=new THREE.Group(); const body=new THREE.Group(); body.position.y=2.6; g.add(body);
  const MW=toon(0xe8e2f0),MG=toon(0xd4a640),MD=toon(0x2a2232);
  part(new THREE.SphereGeometry(.7,16,12),MW,body,0,0,0,.1);
  const eye=new THREE.Mesh(new THREE.TorusGeometry(.3,.09,8,24),basic(0xff2a3a,false)); eye.position.z=.66; body.add(eye);
  const iris=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,6,24),basic(0xff5a3a,true,.7)); iris.position.z=.62; body.add(iris);
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),basic(0x0a0610,false)); pupil.position.z=.7; body.add(pupil);
  const r1=part(new THREE.TorusGeometry(1.1,.07,6,40),MG,body,0,0,0,.05), r2=part(new THREE.TorusGeometry(1.35,.05,6,40),MG,body,0,0,0,.04);
  const petals=[0,1,2,3].map(i=>{ const p=new THREE.Group(); p.rotation.z=i*Math.PI/2+Math.PI/4; body.add(p); const pl=part(box(.34,.5,.1),MW,p,0,.72,.18,.04); pl.rotation.x=-.35; part(box(.2,.08,.12),MG,pl,0,.2,.02,.02); return p; });
  const chains=[0,1,2].map(i=>{ const a=i/3*Math.PI*2, c=new THREE.Group(); c.position.set(Math.cos(a)*.35,-.6,Math.sin(a)*.35); body.add(c); for(let k=0;k<3;k++) part(box(.08,.22,.08),k%2?MG:MD,c,0,-.15-k*.24,0,.02); return c; });
  return {g,body,rings:[r1,r2],eye,iris,petals,chains,mats:[MW,MG,MD],shadow:blob(.9),breaks:[{o:petals[0],at:.5},{o:petals[2],at:.5},{o:r2,at:.25}]};
}
/* Drone (kiter): a light rifle scout. A backpack with a swaying antenna and a turning sensor dish makes it read from above,
   a red visor and a rifle lamp glow. Damage states: antenna and dish break off below 50% armor, the whole pack below 25%. */
function buildDrone(){
  const m=buildMech(0x4c4658,0x9a2c42,0x24202c,0xff2a2a,.8), [M1,M2,M3]=m.mats, ME=basic(0xff3a2a,false);
  const pack=part(box(.8,.72,.42),M3,m.torso,0,.85,-.58); part(box(.6,.12,.3),M2,pack,0,.4,0,.04);
  const ant=new THREE.Group(); ant.position.set(-.25,.42,-.05); pack.add(ant); part(box(.06,1.15,.06),M3,ant,0,.57,0,.03); const tip=new THREE.Mesh(box(.13,.13,.13),ME); tip.position.y=1.16; ant.add(tip);
  const dish=new THREE.Group(); dish.position.set(.28,.46,0); pack.add(dish); const dd=part(new THREE.CylinderGeometry(.28,.08,.12,10),M1,dish,0,.14,0,.04); dd.rotation.x=.6;
  const vis=new THREE.Mesh(box(.42,.06,.04),ME); vis.position.set(0,.2,.27); m.head.add(vis);
  const lamp=new THREE.Mesh(box(.1,.1,.1),basic(0xffd06a,false)); lamp.position.set(0,-.25,.18); m.rifle.add(lamp);
  const cab=part(new THREE.CylinderGeometry(.04,.04,1.1,6),M3,m.torso,.6,.6,-.38,0); cab.rotation.set(.9,0,-.5);
  m.ant=ant; m.dish=dish; m.breaks=[{o:ant,at:.5},{o:dish,at:.5},{o:pack,at:.25}]; return m;
}
/* Heavy (tank / slammer): wide pauldrons that swing with the stride, a slam fist on the left arm, a triple fan barrel on the right
   and back vents that glow and flare during a wind-up. Damage states: one pauldron below 50% armor, the vents and the other pauldron below 25%. */
function buildHeavy(){
  const m=buildMech(0x5a5244,0xc08a2a,0x2a2620,0xff3030,1.25), [M1,M2,M3]=m.mats, MG=basic(0xff7a2a,false);
  const pauls=[-1,1].map(s=>{ const p=new THREE.Group(); p.position.set(s*.98,1.42,0); m.torso.add(p); part(box(.78,.18,1.02),M2,p,s*.1,0,0,.05); part(box(.12,.6,.92),M1,p,s*.46,-.32,0,.05); return p; });
  const fist=part(box(.62,.56,.64),M2,m.arms[0],0,-1.36,0,.06); part(box(.68,.12,.68),M3,fist,0,-.24,0,.04);
  [-1,0,1].forEach(i=>part(box(.12,.5,.12),M3,m.rifle,i*.13,-.95,.06,.03));
  const vents=new THREE.Group(); vents.position.set(0,.85,-.52); m.torso.add(vents); part(box(1,.62,.26),M3,vents,0,0,0,.05);
  const glows=[-.3,0,.3].map(x=>{ const v=new THREE.Mesh(box(.18,.4,.05),MG); v.position.set(x,0,-.15); vents.add(v); return v; });
  m.pauls=pauls; m.glows=glows; m.breaks=[{o:pauls[0],at:.5},{o:vents,at:.25},{o:pauls[1],at:.25}]; return m;
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
/* ---- High-Co (rock frontman boss, Main Stage) ---- */
// High-Co: rock frontman boss in two stages.
// Stage 1: shaved sides, spiky black top with a blue-dyed mullet, orange eye paint, chinstrap beard, white tank top, fishnet sleeves.
// Stage 2: shaved sides, long silver hair swept back, blue war paint across the eyes, full beard, black buckled vest and harness,
//          feather pauldrons, tattooed bare arms, black claw gloves, huge black feathered wings.
// Same skeleton as buildMech (hips/torso/head/arms/legs/shins), so animMech and stepMech drive it unchanged.
// m.laser is a hidden beam on the mic (like the Lancer's); turn it on for the laser attack.
const highcoTex={};
// skin texture baked on a small canvas: optional sleeve tattoo swirls and a white fishnet grid on top
function skinTex(net,tattoo){
  const k=(net?'n':'')+(tattoo?'t':''); if(highcoTex[k]) return highcoTex[k];
  const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d');
  g.fillStyle='#e0b89c'; g.fillRect(0,0,64,64);
  if(tattoo){ g.strokeStyle='#4a5660'; g.lineWidth=5; g.lineCap='round';
    [[4,10,30,4,58,16],[2,30,24,20,60,36],[6,52,34,40,60,58],[14,0,10,30,22,64]].forEach(([a,b,c,d,e,f])=>{ g.beginPath(); g.moveTo(a,b); g.quadraticCurveTo(c,d,e,f); g.stroke(); });
    g.fillStyle='#5a3a44'; g.beginPath(); g.arc(40,26,7,0,Math.PI*2); g.fill(); }
  if(net){ g.strokeStyle='#ffffff'; g.lineWidth=2;
    for(let i=-64;i<128;i+=16){ g.beginPath(); g.moveTo(i,0); g.lineTo(i+64,64); g.moveTo(i,64); g.lineTo(i+64,0); g.stroke(); } }
  return highcoTex[k]=new THREE.CanvasTexture(cv);
}
function buildHighCo(stage=1,scale=2.6){
  const g=new THREE.Group(), s2=stage===2; let rageStripe=null, MW, MC, MV;
  const skin=(net,tat)=>new THREE.MeshToonMaterial({color:0xffffff,map:skinTex(net,tat),gradientMap:grad});
  const MF=toon(0xe0b89c), MZ=toon(0x8a7468), MH=toon(0x120e16), MU=toon(0x3a6ad8), MS=toon(0xbcb8c8), MK=toon(0x1e1a24);
  const MG=toon(0xc8c2cc), MD=toon(0x4a4450), MB=toon(0xc0904a), ML=toon(0x3a2e2a); // silver hair, dark streak, brass, leather
  const MT=toon(s2?0x24212c:0xf2f0f4), MP=toon(s2?0x1e1a24:0xe8e6ee);
  const MA=s2?skin(false,true):skin(true,false), MAT=s2?MA:skin(true,true); // arm skin: fishnet (stage 1) / tattoo sleeves (stage 2)
  const feather=(w,len,mat,parent,x,y,z,rz,t=.04)=>{ const geo=new THREE.OctahedronGeometry(1,0); geo.scale(w/2,len/2,.03); geo.translate(0,-len/2,0);
    const f=part(geo,mat,parent,x,y,z,t); f.rotation.z=rz; return f; };
  const hips=new THREE.Group(); hips.position.y=1.6; g.add(hips);
  const torso=new THREE.Group(); hips.add(torso);
  part(box(.8,.42,.5),MP,torso,0,.15,0);
  part(box(1.0,.82,.58),MT,torso,0,.76,0);
  if(s2){
    part(box(.88,.22,.6),MK,torso,0,.36,0,.04); // wide belt with studs
    for(let i=0;i<5;i++) part(box(.05,.05,.03),MS,torso,-.3+i*.15,.36,.3,0);
    [.62,.8,.98].forEach(y=>part(box(.12,.06,.04),MB,torso,-.14,y,.3,.02)); // vest buckles
    part(box(.84,.2,.66),ML,torso,0,1.1,0,.05); // leather harness collar
    [-1,1].forEach(s=>part(box(.12,.1,.04),MB,torso,s*.15,1.1,.34,.02));
    // feather pauldrons
    [-1,1].forEach(s=>{ const p=new THREE.Group(); p.position.set(s*.52,1.18,0); torso.add(p);
      for(let i=0;i<7;i++){ const z=-.24+i*.08; feather(.18,.5+(i%2)*.15,i%2?MD:MH,p,s*(.05+(i%3)*.04),.06,z,s*(1.1+(i%3)*.35),.03); } });
  } else {
    part(box(.84,.1,.54),MK,torso,0,.34,0,.04); part(box(.16,.11,.04),MS,torso,0,.34,.28,.02);
    part(box(.42,.16,.05),MF,torso,0,1.08,.28,.02); [-1,1].forEach(s=>part(box(.14,.08,.6),MT,torso,s*.36,1.2,0,.02)); // neckline + straps
  }
  part(box(.26,.28,.26),MF,torso,0,1.28,0,.05);

  // head: oversized so the face reads from the iso camera
  const head=new THREE.Group(); head.position.set(0,1.5,.04); head.scale.setScalar(1.35); torso.add(head);
  part(box(.36,.44,.42),MF,head,0,.1,0,.06);
  [-1,1].forEach(s=>{ part(box(.02,.2,.34),MZ,head,s*.185,.22,-.03,0); part(box(.05,.12,.08),MF,head,s*.2,.1,-.02,.02); }); // shaved sides + ears
  part(box(.08,.1,.07),MF,head,0,.08,.225,.02); // nose
  if(s2){ // blue war paint band across both eyes, white edge on top
    part(box(.39,.1,.03),basic(0x2a7cff,false),head,0,.17,.215,0);
    part(box(.39,.025,.03),basic(0xeef4ff,false),head,0,.23,.217,0);
    rageStripe=part(box(.39,.03,.03),basic(0xe0202a,false),head,0,.11,.217,0); rageStripe.visible=false; // red edge under the band, rage only
    [-1,1].forEach(s=>part(box(.07,.03,.03),basic(0x0a0610,false),head,s*.085,.165,.222,0));
  } else [-1,1].forEach(s=>{
    const b=part(box(.15,.05,.05),MH,head,s*.09,.255,.215,.02); b.rotation.z=s*.3;
    const sh=part(box(.15,.075,.03),basic(0xff4a1a,false),head,s*.09,.18,.215,0); sh.rotation.z=s*.25; // eye paint
    const ln=part(box(.15,.025,.035),basic(0x0a0610,false),head,s*.09,.14,.217,0); ln.rotation.z=s*.2; // liner
  });
  part(box(.22,.04,.05),MH,head,0,.0,.225,.02); // mustache
  [-1,1].forEach(s=>part(box(.04,.1,.05),MH,head,s*.11,-.05,.225,.02));
  const mouth=new THREE.Mesh(box(.15,.12,.03),basic(0x5a0a14,false)); mouth.position.set(0,-.07,.212); head.add(mouth);
  const jaw=new THREE.Group(); jaw.position.set(0,-.04,0); head.add(jaw);
  part(box(.3,.12,.3),MF,jaw,0,-.1,.06,.04);
  if(s2){ // full beard with a grey streak
    part(box(.38,.26,.22),MH,jaw,0,-.17,.1,.04);
    part(box(.26,.22,.16),MH,jaw,0,-.38,.12,.04);
    part(box(.08,.3,.04),MD,jaw,0,-.3,.21,0);
  } else { // chinstrap along the jaw into a goatee
    [-1,1].forEach(s=>part(box(.04,.2,.2),MH,head,s*.17,0,.08,.02));
    part(box(.3,.04,.2),MH,jaw,0,-.17,.08,.02);
    part(box(.07,.18,.05),MH,jaw,0,-.2,.215,.02);
  }
  // hair: strands on pivots so they can whip on a headbang
  const hair=[];
  const strand=(x,y,z,segs,rx,rz)=>{ const p=new THREE.Group(); p.position.set(x,y,z); p.rotation.set(rx,0,rz); head.add(p);
    let yy=0; segs.forEach(([w,len,d,mat,kz])=>{ const m=part(box(w,len,d),mat,p,0,yy-len/2,0,.04); if(kz) m.rotation.z=kz; yy-=len*.92; });
    p.userData.rx=rx; p.userData.rz=rz; hair.push(p); return p; };
  if(!s2){
    part(box(.26,.1,.46),MH,head,0,.35,-.01,.05);
    [[-.08,.12,.34],[0,.13,.42],[.08,.12,.34],[-.09,0,.4],[0,0,.5],[.09,0,.4],[-.07,-.14,.38],[0,-.15,.44],[.07,-.14,.38]].forEach(([x,z,l],i)=>{
      const c=part(new THREE.ConeGeometry(.09,l,4),MH,head,x,.38+l*.4,z,.03); c.rotation.set(-.35-(z<0?.3:0),i*.7,-x*2); });
    part(box(.3,.34,.12),MH,head,0,.12,-.24,.04); // mullet root
    [[-.12,.75],[-.04,.9],[.05,.85],[.13,.7]].forEach(([x,l])=>strand(x,-.02,-.25,[[.1,.24,.08,MH],[.1,l,.08,MU]],.15,x*.4));
    strand(.16,0,-.14,[[.1,.2,.08,MH],[.1,.8,.08,MU]],-.25,.5); // blue lock falling over the shoulder
  } else {
    // dark band on top swept back, long silver hair flowing down the back and past the shoulders
    part(box(.24,.1,.5),MD,head,0,.36,-.02,.04);
    part(box(.3,.4,.14),MD,head,0,.2,-.24,.04);
    const wave=(l,mat)=>[[.11,l*.36,.1,mat,.16],[.12,l*.34,.1,mat,-.18],[.11,l*.34,.1,mat,.14]];
    [[-.14,1.25,MG],[-.05,1.45,MD],[.05,1.4,MG],[.14,1.2,MG]].forEach(([x,l,m],i)=>strand(x,.36,-.18-(i%2)*.04,wave(l,m),.45,x*.4));
    [-1,1].forEach(s=>{ strand(s*.2,.24,-.12,wave(1.15,MG),.12,s*.14); strand(s*.1,.3,-.26,wave(1.3,s<0?MG:MD),.35,s*.25); }); // behind the ears, down to the shoulders
  }

  // arms
  const arms=[];
  [-1,1].forEach(s=>{
    part(box(.36,.36,.42),s<0?MAT:MA,torso,s*.58,1.04,0,.06);
    const arm=new THREE.Group(); arm.position.set(s*.64,.98,0); torso.add(arm);
    part(box(.26,.6,.28),s<0?MAT:MA,arm,0,-.32,0,.06);
    part(box(.25,.6,.27),MA,arm,0,-.9,0,.06);
    if(s2){ part(box(.28,.3,.3),MK,arm,0,-1.06,0,.03); // arm wrap
      part(box(.24,.26,.26),MK,arm,0,-1.33,0,.05); // claw glove
      [-.07,0,.07].forEach(x=>{ const c=part(new THREE.ConeGeometry(.03,.12,4),MS,arm,x,-1.36,.15,0); c.rotation.x=Math.PI/2; }); }
    else { part(box(.28,.06,.3),MT,arm,0,-1.18,0,.02); part(box(.22,.24,.24),MF,arm,0,-1.33,0,.05); }
    arms.push(arm);
  });
  // hand mic with a cable; the laser beam comes out of its head
  const mic=new THREE.Group(); mic.position.set(0,-1.4,.08); arms[1].add(mic);
  part(new THREE.CylinderGeometry(.045,.035,.42,8),MS,mic,0,-.15,0,.03);
  part(new THREE.SphereGeometry(.085,10,8),MK,mic,0,-.4,0,.03);
  part(box(.02,.5,.02),MK,mic,0,.25,-.06,0);
  const muzzle=new THREE.Object3D(); muzzle.position.y=-.5; mic.add(muzzle);
  const lc=s2?0x4a9cff:0xff5a1a, laser=new THREE.Group(); laser.position.y=-.5; mic.add(laser);
  const beam=new THREE.Mesh(box(.05,12,.05),basic(0xffffff,true,.95)); beam.position.y=-6; laser.add(beam);
  const glow=new THREE.Mesh(box(.16,12,.16),basic(lc,true,.6)); glow.position.y=-6; laser.add(glow);
  laser.traverse(o=>o.userData.nofit=1); laser.visible=false;

  // legs
  const legs=[],shins=[];
  [-1,1].forEach(s=>{
    const leg=new THREE.Group(); leg.position.set(s*.22,0,0); hips.add(leg);
    part(box(.34,.8,.38),MP,leg,0,-.4,0,.06);
    const shin=new THREE.Group(); shin.position.y=-.8; leg.add(shin);
    part(box(.32,.6,.36),MP,shin,0,-.28,0,.06);
    part(box(.36,.3,.55),MK,shin,0,-.67,.07,.05);
    legs.push(leg); shins.push(shin);
  });

  // stage 2: black feathered wings. A bone arcs up and out; feathers hang from it, growing longer toward the tip,
  // with a row of shorter coverts in front and small ones along the bone.
  let wings=null;
  if(s2){
    wings=[]; MW=toon(0x16121c); MC=toon(0x2c2436); MV=toon(0x3a3046); // black by default, setHighCoRage turns them red
    [-1,1].forEach(s=>{ const root=new THREE.Group(); root.position.set(s*.25,1.0,-.36); root.rotation.x=-.2; torso.add(root);
      const N=9, bone=u=>[s*(.2+u*2.3), .2+Math.sin(u*Math.PI*.8)*1.4]; // arc from shoulder blade up and out
      for(let i=0;i<N;i++){ const u=i/(N-1), [x,y]=bone(u); feather(.52,1.0+u*1.7,MW,root,x,y,0,s*(u*.9-.15)); } // primaries
      for(let i=0;i<7;i++){ const u=i/6*.85, [x,y]=bone(u); feather(.46,.7+u*.6,MC,root,x,y+.05,.05,s*(u*.7-.1)); } // coverts
      for(let i=0;i<6;i++){ const u=i/5*.9, [x,y]=bone(u); feather(.34,.45,MV,root,x,y+.12,.08,s*.4); } // small feathers on the bone
      root.userData.s=s; wings.push(root); });
  }
  g.scale.setScalar(scale);
  return {g,hips,torso,head,jaw,mouth,hair,arms,legs,shins,muzzle,rifle:mic,mic,laser,wings,wingMats:wings&&[MW,MC,MV],rageStripe,stage,rage:false,mats:[MF,MH,MT,MP],shadow:blob(.8*scale),kind:'highco'};
}
// Stage 2 rage: black wings turn crimson (coverts stay black) and a red stripe shows under the war paint.
const HC_WINGS={calm:[0x16121c,0x2c2436,0x3a3046],rage:[0x9a1424,0x16121c,0x5a0c18]};
function setHighCoRage(m,on){
  if(!m.wingMats) return; m.rage=on;
  m.wingMats.forEach((mat,i)=>mat.color.setHex(HC_WINGS[on?'rage':'calm'][i])); m.rageStripe.visible=on;
}
// Spawn prop: striped parachute in world units. Hang it over the boss (canopy top ~7 above the harness).
function buildHighCoChute(){
  const g=new THREE.Group(), canopy=new THREE.Group(); canopy.position.y=6.2; g.add(canopy);
  const cols=[0xd2382a,0xf2f0f4,0x1e1a24,0xf2f0f4], N=12;
  for(let i=0;i<N;i++){ const geo=new THREE.SphereGeometry(3.4,3,4,i/N*Math.PI*2,Math.PI*2/N,0,Math.PI*.42);
    part(geo,toon(cols[i%4]),canopy,0,0,0,.08).scale.y=.6; }
  const lines=[]; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, x=Math.cos(a)*3.1, z=Math.sin(a)*3.1, top=new V3(x,6.2+1.6*.0+.9,z);
    const len=top.length(), l=new THREE.Mesh(box(.04,len,.04),basic(0x1e1a24,false)); l.position.copy(top).multiplyScalar(.5); l.lookAt(top); l.rotateX(Math.PI/2); g.add(l); lines.push(l); }
  return {g,canopy,lines};
}
// Stage 2 summon: a pole bursts out of the floor with a spinning dancer that hurts everything around it.
// Kept anonymous on purpose (faceless visor, band tee): it is a stage gag, not any real person.
function buildHighCoPole(){
  const g=new THREE.Group();
  const MS=toon(0xd8d4e0), MK=toon(0x1e1a24), MR=toon(0xd2382a), MF=toon(0xe0b89c), MH=toon(0x5a2a3a);
  part(new THREE.CylinderGeometry(1.1,1.3,.3,16),MK,g,0,.15,0,.06);
  const ringB=part(new THREE.TorusGeometry(1.15,.06,6,32),MR,g,0,.32,0,0); ringB.rotation.x=Math.PI/2;
  const pole=part(new THREE.CylinderGeometry(.16,.16,9,10),MS,g,0,4.8,0,.05);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8),basic(0xff3048,false)); cap.position.y=9.4; g.add(cap);
  cap.add(new THREE.Mesh(new THREE.SphereGeometry(.55,12,8),basic(0xff3048,true,.35)));
  // dancer on a spinning collar, built small and blocky like the arena mobs
  const spin=new THREE.Group(); spin.position.y=4.2; g.add(spin);
  const d=new THREE.Group(); d.position.x=.7; spin.add(d); d.scale.setScalar(1.7);
  const body=new THREE.Group(); d.add(body); body.rotation.z=.35;
  part(box(.5,.62,.32),MK,body,0,0,0,.05); // band tee
  part(box(.26,.22,.04),basic(0xd2382a,false),body,0,.06,.17,0); // tee logo
  part(box(.18,.12,.18),MF,body,0,.37,0,.04);
  const head=new THREE.Group(); head.position.y=.62; body.add(head);
  part(box(.34,.36,.34),MF,head,0,0,0,.05);
  part(box(.38,.14,.38),MH,head,0,.16,-.02,.04);
  part(box(.3,.08,.04),basic(0xff5a8a,false),head,0,.0,.18,0); // visor glow, no face
  const tail=new THREE.Group(); tail.position.set(0,.12,-.18); head.add(tail);
  part(box(.12,.6,.1),MH,tail,0,-.3,0,.04); tail.rotation.x=.9;
  const armU=new THREE.Group(); armU.position.set(-.3,.25,0); body.add(armU); armU.rotation.z=2.5; // gripping the pole above
  part(box(.14,.55,.14),MF,armU,0,-.28,0,.04);
  const armF=new THREE.Group(); armF.position.set(.3,.25,0); body.add(armF); armF.rotation.z=-1.6; // free arm thrown out
  part(box(.14,.55,.14),MF,armF,0,-.28,0,.04);
  [-1,1].forEach(s=>{ const leg=new THREE.Group(); leg.position.set(s*.13,-.3,0); body.add(leg); leg.rotation.z=s*.6+.5;
    part(box(.18,.75,.2),MK,leg,0,-.38,0,.04); part(box(.2,.14,.3),MR,leg,0,-.78,.05,.03); });
  // damage aura on the floor
  const aura=new THREE.Mesh(new THREE.RingGeometry(3.8,4.1,48),addMat(0xff3048,.7)); aura.rotation.x=-Math.PI/2; aura.position.y=.06; aura.userData.nofit=1; g.add(aura);
  const fill=new THREE.Mesh(new THREE.CircleGeometry(3.8,48),addMat(0xff3048,.12)); fill.rotation.x=-Math.PI/2; fill.position.y=.05; fill.userData.nofit=1; g.add(fill);
  return {g,pole,spin,dancer:d,body,tail,aura,fill,cap,shadow:blob(1.3)};
}
// High-Co boss room: a night concert. The stage sits behind the door edge (-z), the crowd behind the front edge (+z), so the
// playable mat stays open except the amp stacks (covers: [x,z] centers, 1.8 square) that block the Metal Scream.
// Tall props stay on the far sides of the iso camera (-x, -z) so they never hide the fight. Decor casts no shadows.
function buildHighCoArena(X,Z,covers,o={}){
  const g=new THREE.Group(), cs=castShadows; castShadows=false;
  const MK=toon(0x1e1a24), MD=toon(0x2c2834), MS=toon(0x9a96a6), MR=toon(0xd2382a), MW=toon(0x4a4450);
  // floor: dark stage boards
  const cv=document.createElement('canvas'); cv.width=cv.height=128; const c2=cv.getContext('2d');
  c2.fillStyle='#2e2836'; c2.fillRect(0,0,128,128); c2.fillStyle='#352e3e'; for(let i=0;i<8;i++) if(i%2) c2.fillRect(0,i*16,128,16);
  c2.strokeStyle='#241e2a'; c2.lineWidth=2; for(let i=0;i<=8;i++){ c2.beginPath(); c2.moveTo(0,i*16); c2.lineTo(128,i*16); c2.stroke(); }
  const tex=new THREE.CanvasTexture(cv); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(X/2,Z/2);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(2*X,2*Z),new THREE.MeshToonMaterial({map:tex,gradientMap:grad})); floor.rotation.x=-Math.PI/2; floor.position.y=.015; floor.receiveShadow=true; g.add(floor);
  // light pools sweeping across the floor
  const pools=[0,1,2,3].map(()=>{ const p=new THREE.Mesh(new THREE.CircleGeometry(2.6,32),addMat(0xff3048,.16)); p.rotation.x=-Math.PI/2; p.position.y=.04; g.add(p); return p; });
  // main stage behind the door: drum riser, amp walls, LED wall
  const st=new THREE.Group(); st.position.z=-Z-4.2; g.add(st);
  part(box(2*X+4,1.4,6),MD,st,0,.7,0,.1);
  const led=new THREE.Mesh(box(2*X+4,.12,.06),addMat(0xff3048,.9)); led.position.set(0,1.25,3.03); st.add(led);
  part(box(3,.7,2),MK,st,0,1.75,1.8,.06);
  part(box(4,.8,3),MW,st,0,1.8,-.8,.08);
  const kit=new THREE.Group(); kit.position.set(0,2.2,-.8); st.add(kit);
  part(new THREE.CylinderGeometry(.75,.75,.6,14),MR,kit,0,.4,0,.05).rotation.x=Math.PI/2;
  [[-1.1,.9,.35],[1.1,.9,.35],[-.6,1.1,-.4],[.6,1.1,-.4]].forEach(([x,y,r])=>part(new THREE.CylinderGeometry(r,r,.3,12),MK,kit,x,y-.4,.3,.04));
  [-1.6,1.6].forEach(x=>{ part(box(.05,1.4,.05),MS,kit,x,.6,.2,0); part(new THREE.CylinderGeometry(.5,.5,.04,14),toon(0xd9a520),kit,x,1.3,.2,.03).rotation.z=.2; });
  const amp=(parent,x,y,z,w=1.6,h=1.2,d=.9)=>{ const a=part(box(w,h,d),MK,parent,x,y,z,.06);
    const gr=new THREE.Mesh(box(w*.82,h*.7,.02),basic(0x0a0610,false)); gr.position.z=d/2+.01; a.add(gr);
    part(box(w,.1,d+.02),MS,a,0,h/2-.05,0,0); return a; };
  [-1,1].forEach(s=>{ for(let i=0;i<4;i++) for(let j=0;j<2;j++) amp(st,s*(X-2.2-i*1.7),2+j*1.2,-1.6); });
  const sc=document.createElement('canvas'); sc.width=512; sc.height=160; const sx=sc.getContext('2d');
  sx.fillStyle='#120a16'; sx.fillRect(0,0,512,160); sx.font='bold 110px Impact, Arial Black, sans-serif'; sx.textAlign='center'; sx.textBaseline='middle';
  sx.fillStyle='#ff3048'; sx.fillText('HIGH-CO',256,84); sx.strokeStyle='#ffd0d6'; sx.lineWidth=3; sx.strokeText('HIGH-CO',256,84);
  part(box(13,4.6,.4),MK,st,0,6.6,-2.6,.1);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(12.4,4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc)})); screen.position.set(0,6.6,-2.38); st.add(screen);
  // lighting truss over the stage lip; moving heads throw light cones into the room
  const truss=new THREE.Group(); truss.position.z=-Z-2.2; g.add(truss);
  [-1,1].forEach(s=>part(box(.5,12,.5),MS,truss,s*(X+1.5),6,0,.05));
  part(box(2*X+3.5,.5,.5),MS,truss,0,12,0,.05);
  const heads=[], cones=[];
  for(let i=0;i<6;i++){ const h=new THREE.Group(); h.position.set(-X+1.5+i*(2*X-3)/5,11.6,0); truss.add(h); part(box(.5,.5,.5),MK,h,0,0,0,.04);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(2.2,12,20,1,true),addMat(0xff3048,.12)); cone.position.y=-6; h.add(cone); heads.push(h); cones.push(cone); }
  // pyro on the stage lip, bursting on the beat
  const pyro=[-1,1].map(s=>{ const p=new THREE.Group(); p.position.set(s*(X-1),1.4,-Z-1.8); g.add(p); part(box(.8,.3,.8),MK,p,0,0,0,.04);
    const f=new THREE.Mesh(new THREE.ConeGeometry(.5,4,10,1,true),addMat(0xff8a2a,.8)); f.position.y=2.1; f.rotation.x=Math.PI; p.add(f);
    const f2=new THREE.Mesh(new THREE.ConeGeometry(.28,3,10,1,true),addMat(0xffe08a,.9)); f2.position.y=1.6; f2.rotation.x=Math.PI; p.add(f2);
    p.userData.flame=[f,f2]; return p; });
  // line-array speaker towers (none on the near +x/+z corner)
  [[-1,-Z*.45],[-1,Z*.45],[1,-Z*.45]].forEach(([s,z])=>{ const t=new THREE.Group(); t.position.set(s*(X+1.6),0,z); g.add(t);
    part(box(.3,8,.3),MS,t,0,4,0,.03);
    for(let i=0;i<5;i++){ const b=part(box(1.4,.6,1.1),MK,t,-s*.5,7.6-i*.62,0,.05); b.rotation.z=s*i*.05; } });
  // barrier and crowd beyond the front edge (one row on phones). o.crowd 'side': along the far -x edge instead, so the crowd never stands
  // between the iso camera and the entry (the Main Stage wave rooms start you right at the front edge)
  const side=o.crowd==='side', rows=mobileMode?1:2, spots=[];
  if(side){ for(let z=-Z;z<Z;z+=2) part(box(.15,1.1,1.9),MS,g,-X-.8,.55,z+1,.04); for(let r=0;r<rows;r++) for(let z=-Z+.5;z<=Z;z+=1.3) if(Math.abs(Math.abs(z)-Z*.45)>1.2) spots.push([-X-2.2-r*1.3,z+(r%2)*.65]); }
  else { for(let x=-X;x<X;x+=2) part(box(1.9,1.1,.15),MS,g,x+1,.55,Z+.8,.04); for(let r=0;r<rows;r++) for(let x=-X-1;x<=X+1;x+=1.3) spots.push([x+(r%2)*.65,Z+2.2+r*1.3]); }
  const crowd=[], tones=[0x24202c,0x2e2836,0x1a1620,0x3a2e3a].map(c=>toon(c)), skin=toon(0xc8a088);
  for(const [cx,cz] of spots){ const p=new THREE.Group(); p.position.set(cx+Math.random()*.3,0,cz); if(side) p.rotation.y=Math.PI/2; g.add(p);
    const M=pickOne(tones), up=Math.random()<.5;
    part(box(.6,.9,.4),M,p,0,1.1,0,.04); part(box(.38,.4,.38),skin,p,0,1.8,0,.04);
    [-1,1].forEach(s=>{ const a=part(box(.16,.6,.16),M,p,s*.38,up?1.75:1.1,0,0); if(up) a.rotation.z=-s*.3; });
    if(Math.random()<.25){ const ph=new THREE.Mesh(box(.12,.2,.03),basic(0xd8f0ff,false)); ph.position.set(.4,2.15,.1); p.add(ph); }
    p.userData.ph=Math.random()*6; crowd.push(p); }
  // amp stacks on the mat: cover from the Metal Scream
  (covers||[]).forEach(([x,z])=>{ const c=new THREE.Group(); c.position.set(x,0,z); g.add(c); amp(c,0,.65,0,1.8,1.3,1.8); amp(c,0,1.95,0,1.6,1.2,1.6); });
  castShadows=cs;
  return {g,pools,heads,cones,pyro,crowd,led};
}
// arena life per phase: I warm red/blue, II cold white/violet (the black angel), III all red (rage, faster crowd, constant pyro).
// phase 0: the Main Stage wave rooms around the same stage, in the festival's pink and amber, with the pyro on the beat of the live music.
const HC_LIGHT=[[0xff3048,0x4a9cff],[0xe8e0ff,0x8a6aff],[0xff2030,0xff2030]], STAGE_LIGHT=[0xff3aa8,0xffb84a];
function animateHighCoArena(a,t,phase){
  const L=phase===0?STAGE_LIGHT:HC_LIGHT[phase-1]||HC_LIGHT[0], rage=phase===3;
  a.pools.forEach((p,i)=>{ const k=t*.5+i*1.7; p.position.set(Math.sin(k)*7,.04,Math.cos(k*.8+i)*11); p.material.color.setHex(L[i%2]); });
  a.heads.forEach((h,i)=>{ h.rotation.z=Math.sin(t*.9+i)*.45; h.rotation.x=.25+Math.cos(t*.7+i*.6)*.25; });
  a.cones.forEach((c,i)=>c.material.color.setHex(L[i%2]));
  a.crowd.forEach(p=>{ p.position.y=Math.max(0,Math.sin(t*(rage?9:6)+p.userData.ph))*.35; });
  const beat=rage||(phase===0?BEAT.idx%4===0&&BEAT.ph<.35:(t%2.4)<.35); a.pyro.forEach(p=>p.userData.flame.forEach(f=>{ f.visible=beat; f.scale.y=.8+Math.random()*.4; }));
  a.led.material.opacity=.6+.4*Math.abs(Math.sin(t*4));
  if(phase>0) hypeHighCoArena(a,t,phase);
}
/* High-Co's room only (the Main Stage wave rooms keep the look above): the crowd jumps on the beat of his music and the light pools pulse
   with it; a.hype (bosses.js hcCrowd: 1 on a form entrance or a crowd channel, 2 for the final form's roar) makes both go wild for a few
   seconds, and the final form keeps the crowd at a high floor. */
function hypeHighCoArena(a,t,phase){
  const dt=Math.min(.1,Math.max(0,t-(a.lt==null?t:a.lt))); a.lt=t;
  a.hype=Math.max(phase===3?.6:0,(a.hype||0)-dt*.5); const h=Math.min(2,a.hype), k=1-BEAT.ph, kick=k*k*k;
  a.crowd.forEach(p=>{ const q=(BEAT.ph+p.userData.ph*.03)%1, u=(1-q)*(1-q); p.position.y=u*(.3+.35*h); p.rotation.z=h>.5?Math.sin(t*7+p.userData.ph)*.08*h:0; });
  a.pools.forEach(p=>{ p.material.opacity=.14+kick*(.12+.12*h); p.scale.setScalar(1+kick*.15*h); });
  if(h>1.2) a.cones.forEach((c,i)=>{ if((BEAT.idx+i)%2===0&&k>.6) c.material.color.setHex(0xffffff); });
}
/* ================= MAIN STAGE CAST (ported from docs/main-stage.html) ================= */
/* An all-human festival cast. buildHuman uses the mech skeleton (hips/torso/head/arms/legs/shins), so stepMech, mechLean and the juice
   springs drive it unchanged; POSE (enemy-ai.js) sets the arms after the walk. mats[0] is the shirt, so elites tint the clothes, not the skin.
   Telegraph meshes (dance pad, landing ring, spot circle) are userData.nofit and are moved onto the floor in game. */
const ST={black:0x1a1418,red:0xc8243a,gold:0xe8b23a,chrome:0xc8c8d4,mag:0xff3aa8,amber:0xffb84a};
const cyl=(a,b,h,s=16)=>new THREE.CylinderGeometry(a,b,h,s);
const SKIN=[0xf0c8a8,0xd8a07a,0xb07850,0x8a5a3a];
function buildHuman(o={}){
  const skin=toon(o.skin||SKIN[1]), top=toon(o.top||0x1a1418), pants=toon(o.pants||0x22222a), shoe=toon(o.shoe||0x111014), hairM=toon(o.hair||0x1a1210);
  const g=new THREE.Group(); const hips=new THREE.Group(); hips.position.y=1.6; g.add(hips);
  const torso=new THREE.Group(); hips.add(torso);
  part(box(.56,.3,.32),pants,torso,0,.05,0,.05);
  const chest=part(box(.64,.78,.36),top,torso,0,.55,0,.06);
  if(o.belt) part(box(.6,.1,.34),toon(o.belt),torso,0,.2,0,.03);
  part(box(.16,.14,.16),skin,torso,0,1.0,0,0);
  // the head is a little oversized so faces and hair read from the game camera
  const head=new THREE.Group(); head.position.set(0,1.28,.02); head.scale.setScalar(1.2); torso.add(head);
  part(box(.4,.46,.42),skin,head,0,0,0,.06);
  [-1,1].forEach(s=>{ const e=new THREE.Mesh(box(.07,.05,.03),basic(0x1a1012,false)); e.position.set(s*.1,.04,.215); head.add(e); });
  const hs=o.hairStyle||'short';
  if(hs==='long'){ part(box(.44,.14,.46),hairM,head,0,.27,0,.04); part(box(.46,.75,.14),hairM,head,0,-.18,-.22,.04); [-1,1].forEach(s=>part(box(.08,.6,.3),hairM,head,s*.23,-.1,-.06,.03)); }
  else if(hs==='mohawk'){ part(box(.42,.06,.44),hairM,head,0,.24,0,.02); for(let i=0;i<5;i++) part(new THREE.ConeGeometry(.06,.32,4),hairM,head,0,.4,-.16+i*.08,.02); }
  else if(hs==='bun'){ part(box(.44,.12,.46),hairM,head,0,.27,0,.04); part(new THREE.SphereGeometry(.14,10,8),hairM,head,0,.36,-.18,.03); part(box(.46,.45,.12),hairM,head,0,-.05,-.22,.03); }
  else if(hs==='cap'){ part(box(.44,.14,.46),toon(o.capCol||ST.amber),head,0,.27,0,.04); part(box(.38,.04,.24),toon(o.capCol||ST.amber),head,0,.22,.3,.02); }
  else if(hs==='short') part(box(.44,.12,.46),hairM,head,0,.26,0,.04);
  if(o.beard) part(box(.36,.22,.12),hairM,head,0,-.2,.18,.03);
  if(o.band){ const b=new THREE.Mesh(box(.45,.07,.47),basic(o.band,false)); b.position.y=.16; head.add(b); }
  const arms=[];
  [-1,1].forEach(s=>{ const arm=new THREE.Group(); arm.position.set(s*.42,.88,0); torso.add(arm);
    part(box(.2,.44,.22),o.sleeves?top:skin,arm,0,-.2,0,.04);
    const fore=new THREE.Group(); fore.position.y=-.44; arm.add(fore);
    part(box(.17,.4,.19),skin,fore,0,-.2,0,.04); part(box(.15,.14,.16),skin,fore,0,-.46,0,.03);
    arm.userData.fore=fore; arms.push(arm); });
  const legs=[],shins=[];
  [-1,1].forEach(s=>{ const leg=new THREE.Group(); leg.position.set(s*.15,0,0); hips.add(leg);
    part(box(.24,.8,.27),pants,leg,0,-.4,0,.05);
    const shin=new THREE.Group(); shin.position.y=-.8; leg.add(shin);
    part(box(.22,.66,.25),pants,shin,0,-.33,0,.04); part(box(.25,.15,.42),shoe,shin,0,-.72,.07,.03);
    legs.push(leg); shins.push(shin); });
  // the right hand is the muzzle for anything thrown or fired
  const muzzle=new THREE.Object3D(); muzzle.position.y=-.55; arms[1].userData.fore.add(muzzle);
  g.scale.setScalar(o.scale||1);
  return {g,hips,torso,chest,head,arms,legs,shins,muzzle,mats:[top,pants,skin],shadow:blob(.55*(o.scale||1))};
}
// arm pose (shoulder pitch, forearm pitch), applied after the walk animation
function pose(m,a0,a1,f0=0,f1=0){ m.arms[0].rotation.x=a0; m.arms[1].rotation.x=a1; m.arms[0].userData.fore.rotation.x=f0; m.arms[1].userData.fore.rotation.x=f1; }
// Pulse Dancer: long skirt, sequin belt, glowing scarf balls. The pink pad marks where she lands next.
function buildDancer(){
  const m=buildHuman({skin:0xf6dcc8,top:ST.mag,pants:ST.mag,hair:0xf0d070,hairStyle:'long',scale:1.15});
  part(box(.68,.05,.4),toon(ST.gold),m.chest,0,0,0,0);
  [-1,1].forEach(s=>{ const st=new THREE.Mesh(box(.05,.3,.02),basic(ST.gold,false)); st.position.set(s*.16,.42,.19); m.chest.add(st); });
  const skirt=new THREE.Group(); m.hips.add(skirt);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const f=new THREE.Mesh(box(.16,.5,.01),addMat(i%2?ST.gold:ST.mag,.55)); f.position.set(Math.sin(a)*.3,-.2,Math.cos(a)*.2); f.rotation.y=a; skirt.add(f); }
  const belt=new THREE.Group(); belt.position.y=.02; m.torso.add(belt);
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; const c=new THREE.Mesh(new THREE.CircleGeometry(.05,8),basic(ST.gold,false)); c.position.set(Math.sin(a)*.34,0,Math.cos(a)*.22); c.rotation.y=a; belt.add(c); }
  const ribbons=m.arms.map(a=>{ const r=new THREE.Group(); r.position.y=-.62; a.userData.fore.add(r); r.add(new THREE.Mesh(new THREE.SphereGeometry(.17,14,10),basic(0xffe0f4,false))); r.add(new THREE.Mesh(new THREE.SphereGeometry(.3,14,10),basic(ST.mag,true,.45))); return r; });
  const pad=new THREE.Group(); pad.userData.nofit=1; const pr=new THREE.Mesh(new THREE.RingGeometry(1.25,1.6,32),addMat(ST.mag,.9)); pr.rotation.x=-Math.PI/2; pr.position.y=.06; pad.add(pr);
  const pf=new THREE.Mesh(G.disc,addMat(ST.mag,.4)); pf.rotation.x=-Math.PI/2; pf.position.y=.05; pf.scale.setScalar(1.4); pad.add(pf); pad.visible=false; m.g.add(pad);
  m.ribbons=ribbons; m.belt=belt; m.skirt=skirt; m.pad=pad; m.padFill=pf; m.breaks=[{o:ribbons[0],at:.5}]; m.shadow=blob(.8); return m;
}
// Drummer: a metal drummer on his stool behind the kit. He never gets up. The red ring pulses with the kick.
function buildDrummer(){
  const g=new THREE.Group(); const M2=toon(ST.red),M3=toon(ST.chrome),MG=toon(ST.gold);
  const kit=new THREE.Group(); g.add(kit);
  const kick=part(cyl(.9,.9,.7,20),M2,kit,0,.9,.95,.07); kick.rotation.x=Math.PI/2;
  const kh=new THREE.Mesh(new THREE.CircleGeometry(.78,20),toon(0xeee8f4)); kh.position.set(0,.9,1.31); kit.add(kh);
  const logo=new THREE.Mesh(new THREE.RingGeometry(.28,.38,6),basic(ST.amber,false)); logo.position.set(0,.9,1.32); kit.add(logo);
  [[-.65,1.75,.75],[.65,1.75,.75]].forEach(([x,y,z])=>{ const t=part(cyl(.32,.32,.3,14),M2,kit,x,y,z,.05); t.rotation.x=.4; });
  part(cyl(.42,.42,.4,14),M2,kit,1.15,1.0,.2,.05); part(cyl(.32,.32,.22,14),toon(0xd8d8e0),kit,-.95,1.25,.35,.04);
  const stands=[[-1.3,2.45,.5],[1.35,2.6,.3]].map(([x,y,z])=>{ const st=new THREE.Group(); kit.add(st); part(box(.05,y,.05),M3,st,x,y/2,z,0); const c=part(cyl(.55,.55,.04,20),MG,st,x,y,z,.03); c.rotation.z=x<0?.25:-.25; st.userData.c=c; return st; });
  const h=buildHuman({skin:SKIN[2],top:0x141014,pants:0x22202a,hair:0x2a1a12,hairStyle:'long',band:ST.red});
  h.g.position.set(0,.35,-.95); h.g.scale.setScalar(1.15); g.add(h.g);
  part(cyl(.35,.4,1.25,8),toon(0x2a2632),g,0,.62,-.95,.05);
  h.legs.forEach(l=>{ l.rotation.x=-1.4; }); h.shins.forEach(s=>s.rotation.x=1.4);
  h.arms.forEach(a=>{ const st=part(box(.05,.7,.05),toon(0xd8c8a0),a.userData.fore,0,-.55,.3,.02); st.rotation.x=-1.1; });
  const wave=new THREE.Mesh(new THREE.RingGeometry(2.4,2.6,40),addMat(ST.red,.6)); wave.rotation.x=-Math.PI/2; wave.position.y=.05; wave.userData.nofit=1; g.add(wave);
  const muzzle=new THREE.Object3D(); muzzle.position.set(0,2.4,.6); g.add(muzzle);
  g.scale.setScalar(1.1);
  return {g,kit,kick,cym:stands.map(s=>s.userData.c),h,head:h.head,wave,muzzle,mats:[h.mats[0],M2,M3],shadow:blob(1.9),breaks:[{o:stands[0],at:.5},{o:stands[1],at:.25}]};
}
// Shredder: long-haired guitarist in a leather jacket with a red V guitar
function buildShredder(){
  const m=buildHuman({skin:SKIN[0],top:0x141014,pants:0x1e1e26,hair:0x3a2414,hairStyle:'long',sleeves:true,belt:ST.chrome,scale:1.2});
  [-1,1].forEach(s=>{ for(let i=0;i<3;i++){ const sp=part(new THREE.ConeGeometry(.04,.14,4),toon(ST.chrome),m.chest,s*(.18+i*.06),.3,-.19,0); sp.rotation.z=-s*.6; } });
  const MG=toon(ST.red),MN=toon(0x3a2a1a);
  const gtr=new THREE.Group(); gtr.position.set(-.05,.25,.32); gtr.rotation.z=-.65; m.torso.add(gtr);
  [-1,1].forEach(s=>{ const w=part(box(.26,.85,.1),MG,gtr,s*.18,-.3,0,.04); w.rotation.z=s*.45; });
  part(box(.3,.25,.11),MG,gtr,0,-.05,0,.04); part(box(.09,1.25,.06),MN,gtr,0,.7,0,.03); const hd=part(box(.18,.24,.07),MG,gtr,0,1.4,0,.03);
  const strings=new THREE.Mesh(box(.05,1.7,.01),addMat(ST.amber,.7)); strings.position.set(0,.5,.06); gtr.add(strings);
  m.gtr=gtr; m.strings=strings; m.breaks=[{o:hd,at:.5}]; m.shadow=blob(.75); return m;
}
// Bass Brute: big bald bearded bassist in a vest. The blue rings are his low-frequency waves.
function buildBassist(){
  const m=buildHuman({skin:SKIN[1],top:0x2a2a34,pants:0x1a1a22,hair:0x2a1810,hairStyle:'bald',beard:true,scale:1.45});
  part(box(.66,.6,.38),toon(0x3a2a20),m.chest,0,.05,0,.03);
  const MB=toon(0x2b3a7a),MN=toon(0x2a1e14);
  const bass=new THREE.Group(); bass.position.set(-.02,.2,.32); bass.rotation.z=-.55; m.torso.add(bass);
  part(box(.55,.72,.13),MB,bass,0,-.3,0,.05); part(box(.4,.28,.13),MB,bass,.1,.12,0,.04);
  part(box(.1,1.55,.07),MN,bass,0,.9,0,.03); const hd=part(box(.22,.28,.08),MB,bass,0,1.75,0,.03);
  for(let i=0;i<4;i++){ const s=new THREE.Mesh(box(.01,2.1,.01),addMat(0x9ad0ff,.8)); s.position.set(-.035+i*.023,.7,.075); bass.add(s); }
  const rip=new THREE.Group(); rip.userData.nofit=1; m.g.add(rip); for(let i=0;i<3;i++){ const r=new THREE.Mesh(new THREE.RingGeometry(1,1.12,40),addMat(0x6ad8ff,.5)); r.rotation.x=-Math.PI/2; r.position.y=.05; rip.add(r); }
  m.bass=bass; m.rip=rip; m.breaks=[{o:hd,at:.35}]; m.shadow=blob(1); return m;
}
// Roadie: stage crew in a cap with a speaker cabinet on his back. He sets amps down (buildAmp) and never attacks himself.
function buildHauler(){
  const m=buildHuman({skin:SKIN[2],top:0x2a2a30,pants:0x3a3640,hairStyle:'cap',capCol:ST.amber,beard:true,hair:0x1a1210,scale:1.1});
  const shirtTxt=new THREE.Mesh(box(.4,.12,.02),basic(ST.amber,false)); shirtTxt.position.set(0,.65,.19); m.torso.add(shirtTxt);
  const cab=part(box(1.0,1.15,.6),toon(0x141016),m.torso,0,1.05,-.5,.07);
  [-.27,.27].forEach(y=>{ const sp=new THREE.Mesh(new THREE.CircleGeometry(.27,18),basic(0x2a2226,false)); sp.position.set(0,y,.31); cab.add(sp); const ring=new THREE.Mesh(new THREE.RingGeometry(.27,.32,18),basic(ST.amber,false)); ring.position.set(0,y,.315); cab.add(ring); });
  m.cab=cab; m.shadow=blob(.7); return m;
}
// amp the Roadie sets down: one shot breaks it; it pulses a yellow sound burst on the beat for 10 s
function buildAmp(){
  const g=new THREE.Group(), body=new THREE.Group(); g.add(body); const MK=toon(0x141016);
  part(box(.9,1,.6),MK,body,0,.5,0,.06); part(box(.92,.08,.62),toon(ST.chrome),body,0,1.02,0,0);
  const cone=new THREE.Mesh(new THREE.CircleGeometry(.3,18),basic(0x2a2226,false)); cone.position.set(0,.55,.31); body.add(cone);
  const lamp=new THREE.Mesh(new THREE.RingGeometry(.3,.36,18),basic(ST.amber,false)); lamp.position.set(0,.55,.315); body.add(lamp);
  const pulse=new THREE.Mesh(G.ring,addMat(ST.amber,.6)); pulse.rotation.x=-Math.PI/2; pulse.position.y=.05; pulse.userData.nofit=1; g.add(pulse);
  return {g,body,cone,lamp,pulse,mats:[MK],shadow:blob(.6)};
}
// Mosher: mohawk, studs and a chain. Comes in packs of 6-10.
function buildMosher(){
  const m=buildHuman({skin:pickOne(SKIN),top:0x101012,pants:0x2a2230,hair:pickOne([0x3aff7a,0xff3aa8,0x3ab0ff,0xffd23a]),hairStyle:'mohawk',belt:ST.chrome,scale:1.05});
  part(box(.68,.7,.4),toon(0x2a1e1a),m.chest,0,.02,0,.03);
  [-1,1].forEach(s=>{ for(let i=0;i<3;i++){ const sp=part(new THREE.ConeGeometry(.045,.16,4),toon(ST.chrome),m.torso,s*(.22+i*.06),.95,-.05,0); sp.rotation.z=-s*.4; } });
  const chain=new THREE.Mesh(box(.04,.04,.36),basic(ST.chrome,false)); chain.position.set(0,-.3,.12); chain.rotation.y=.4; m.arms[1].userData.fore.add(chain);
  m.chain=chain; m.shadow=blob(.6); return m;
}
// Pyro Tech: fireproof suit, a quiver of fireworks on the back and a lit rocket in the right hand (the burning fuse is m.flare)
function buildPyro(){
  const m=buildHuman({skin:SKIN[1],top:0xc8b890,pants:0xb8a880,shoe:0x2a2420,hairStyle:'bald',sleeves:true,scale:1.1});
  part(box(.48,.52,.48),toon(0xc8b890),m.head,0,.02,-.02,.05); const visor=new THREE.Mesh(box(.36,.2,.03),addMat(0xffb84a,.75)); visor.position.set(0,.05,.25); m.head.add(visor);
  const tank=new THREE.Group(); tank.position.set(0,.6,-.3); m.torso.add(tank); part(cyl(.2,.2,.5,10),toon(0x2a2420),tank,0,0,0,.04);
  [[-.1,0xff3a3a],[.1,0xffd23a],[0,0x3ad0ff]].forEach(([x,c],i)=>{ part(cyl(.07,.07,.7,8),toon(c),tank,x,.25,i===2?-.08:.05,.03); part(new THREE.ConeGeometry(.08,.16,8),toon(0xeeeeee),tank,x,.68,i===2?-.08:.05,.02); });
  const fore=m.arms[1].userData.fore, rk=part(cyl(.08,.08,.75,8),toon(ST.red),fore,0,-.55,.12,.03); rk.rotation.x=Math.PI/2; part(new THREE.ConeGeometry(.09,.2,8),toon(0xffd23a),fore,0,-.55,.57,.02).rotation.x=Math.PI/2;
  const flare=new THREE.Mesh(new THREE.SphereGeometry(.1,8,6),basic(0xff6a2a,false)); flare.position.set(0,-.55,-.28); fore.add(flare);
  m.flare=flare; m.breaks=[{o:tank,at:.4}]; m.shadow=blob(.7); return m;
}
// Lighting tech: a follow spot on a tripod. The bright circle on the floor is where the light is; it follows you slowly.
function buildSpot(){
  const m=buildHuman({skin:SKIN[0],top:0x1e1e26,pants:0x2a2a34,hair:0x8a5a2a,hairStyle:'bun',sleeves:true,scale:1.1});
  const hp=new THREE.Mesh(new THREE.TorusGeometry(.24,.035,6,16,Math.PI),basic(0x2a2a2a,false)); hp.position.y=.12; m.head.add(hp);
  const rig=new THREE.Group(); rig.position.set(.75,0,.55); m.g.add(rig);
  [0,1,2].forEach(i=>{ const a=i/3*Math.PI*2; const l=part(box(.05,1.7,.05),toon(0x2a2632),rig,Math.cos(a)*.3,.8,Math.sin(a)*.3,0); l.rotation.z=Math.cos(a)*.18; l.rotation.x=-Math.sin(a)*.18; });
  const lamp=new THREE.Group(); lamp.position.y=1.8; rig.add(lamp);
  const can=part(cyl(.22,.3,.8,14),toon(ST.chrome),lamp,0,0,.2,.05); can.rotation.x=Math.PI/2;
  const lens=new THREE.Mesh(new THREE.CircleGeometry(.22,14),basic(0xfff0c0,false)); lens.position.z=.61; lamp.add(lens);
  const spot=new THREE.Group(); spot.userData.nofit=1; const sd=new THREE.Mesh(G.disc,addMat(0xfff0c0,.28)); sd.rotation.x=-Math.PI/2; sd.position.y=.05; spot.add(sd);
  const sr=new THREE.Mesh(G.ring,addMat(0xfff0c0,.7)); sr.rotation.x=-Math.PI/2; sr.position.y=.06; spot.add(sr); spot.scale.setScalar(2); m.g.add(spot);
  m.rig=rig; m.lamp=lamp; m.spot=spot; m.spotFill=sd; m.spotRing=sr; m.breaks=[{o:rig,at:.34}]; m.shadow=blob(.7); return m;
}
// Stage Diver: arms out, he leaps in over the crowd and crushes the landing spot (red ring), then brawls with his fists
function buildDiver(){
  const m=buildHuman({skin:SKIN[3],top:ST.red,pants:0x1a1a22,hair:0x101010,hairStyle:'short',sleeves:true,band:0x101010,scale:1.2});
  part(box(.7,.6,.4),toon(0x141014),m.chest,0,.08,0,.03);
  const land=new THREE.Group(); land.userData.nofit=1; const lr=new THREE.Mesh(G.ring,addMat(0xff4a2a,.85)); lr.rotation.x=-Math.PI/2; lr.position.y=.06; land.add(lr);
  const lf=new THREE.Mesh(G.disc,addMat(0xff4a2a,.2)); lf.rotation.x=-Math.PI/2; lf.position.y=.05; land.add(lf); land.visible=false; m.g.add(land);
  m.land=land; m.landFill=lf; m.shadow=blob(.75); return m;
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
const BOSS_BUILD={colossus:buildColossus,prism:buildPrism,seraph:buildSeraphBoss,hive:buildHive,arachne:buildArachne,throne:buildThrone,archon:buildArchon,highco:()=>buildHighCo(1)};
for(const k in BOSSES) if(BOSSES[k].form&&!BOSS_BUILD[k]) BOSS_BUILD[k]=()=>buildCorrupted(BOSSES[k].form);
