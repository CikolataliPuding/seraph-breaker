// Seraph Breaker · preview.js: Hangar mech preview and boss portraits.
/* ================= PREVIEW + PORTRAITS ================= */
const pv={canvas:$('pvCanvas'),w:0,h:0};
pv.r=new THREE.WebGLRenderer({canvas:pv.canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
pv.r.setPixelRatio(Math.min(devicePixelRatio,2));
function stdLights(sc){ sc.add(new THREE.HemisphereLight(0xffe0c8,0x302040,.95)); const d=new THREE.DirectionalLight(0xfff0e0,.95); d.position.set(3,6,5); sc.add(d); const r=new THREE.DirectionalLight(0xff6a1a,.7); r.position.set(-5,2,-4); sc.add(r); }
pv.scene=new THREE.Scene(); stdLights(pv.scene);
pv.cam=new THREE.PerspectiveCamera(30,1,.1,200);
(()=>{ const ped=new THREE.Mesh(new THREE.CylinderGeometry(1.7,1.9,.25,6),toon(0x2a2232)); ped.position.y=-.125; pv.scene.add(ped); const ring=new THREE.Mesh(new THREE.RingGeometry(1.85,1.95,6),addMat(0xff6a1a,.9)); ring.rotation.x=-Math.PI/2; ring.position.y=.01; pv.scene.add(ring); })();
pv.ped=new THREE.Group(); pv.scene.add(pv.ped);
// hangar: the preview fills the screen behind the menu with a hangar bay around the pad (ui-hangar.js placePreview).
// wide desktop: nav rail + side panel; phones and narrow windows: the single column over it, the mech framed in focus (Home's free slot)
const HANGAR={on:false,wide:false,g:new THREE.Group(),accent:[],focus:null};
const hangarWide=()=>!mobileMode&&innerWidth>=1000&&innerHeight>=600;
(()=>{ const H=HANGAR.g, dark=toon(0x1a1422), mid=toon(0x2a2232);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(90,90),toon(0x151019)); fl.rotation.x=-Math.PI/2; fl.position.y=-.27; H.add(fl);
  const grid=new THREE.GridHelper(90,45,0x3a2c48,0x241b2e); grid.position.y=-.26; H.add(grid);
  // back wall panels with light strips, two gantry pillars and a lit beam over the pad
  for(let i=-4;i<=4;i++){ const p=new THREE.Mesh(box(5.6,16,.6),i%2?dark:mid); p.position.set(i*6,8,-12); H.add(p); const s=new THREE.Mesh(box(.16,11,.1),addMat(0xff6a1a,.75)); s.position.set(i*6+2.4,7,-11.65); H.add(s); HANGAR.accent.push(s.material); }
  [-4.4,4.4].forEach(x=>{ const c=new THREE.Mesh(box(.7,10,.7),mid); c.position.set(x,5,-3); H.add(c); const l=new THREE.Mesh(box(.12,6,.12),addMat(0xff6a1a,.6)); l.position.set(x+(x<0?.42:-.42),4,-2.6); H.add(l); HANGAR.accent.push(l.material); });
  const beam=new THREE.Mesh(box(9.5,.7,.9),mid); beam.position.set(0,10,-3); H.add(beam);
  const lamp=new THREE.Mesh(box(3.2,.12,.5),addMat(0xfff0d8,.9)); lamp.position.set(0,9.6,-2.8); H.add(lamp);
  // floor rings around the pad in the selected arena's accent color
  [3.1,4.5,6.2].forEach((r,i)=>{ const g=new THREE.Mesh(new THREE.RingGeometry(r,r+.06,64),addMat(0xff6a1a,.5-i*.14)); g.rotation.x=-Math.PI/2; g.position.y=-.25; H.add(g); HANGAR.accent.push(g.material); });
  H.visible=false; pv.scene.add(H); })();
function hangarTheme(a){ const t=ARENAS[a]&&ARENAS[a].theme; if(t) HANGAR.accent.forEach(m=>m.color.setHex(t.edge)); }
function paint(){ const u=UNITS[P.unit]; return {c1:P.c1==null?u.c1:P.c1, c2:P.c2==null?u.c2:P.c2, c3:u.c3, eye:u.eye}; }
function unitCss(){ const c=paint(); return CSS(P.unit==='verdant'&&P.c1==null?c.c2:c.c1); }
function rebuildPreview(){ if(pv.mech) pv.ped.remove(pv.mech.g); const c=paint(); pv.mech=buildMech(c.c1,c.c2,c.c3,c.eye,1,P.unit); animMech(pv.mech,0,0); pv.mech.arms[1].rotation.x=-.9; pv.ped.add(pv.mech.g); }
function renderPreview(t){
  const w=pv.canvas.clientWidth,h=pv.canvas.clientHeight; if(!w||!h) return;
  if(pv.w!==w||pv.h!==h){ pv.r.setSize(w,h,false); pv.cam.aspect=w/h; pv.cam.updateProjectionMatrix(); pv.w=w; pv.h=h; }
  if(pv.mech) pv.mech.hips.position.y=1.6-Math.abs(Math.sin(t*2))*.03;
  // wide hangar: the mech stands in the free column between the nav rail (96 px) and the panel (~480 px), the camera drifts slowly
  if(HANGAR.wide){ pv.ped.rotation.y=-.45+Math.sin(t*.35)*.55; pv.cam.setViewOffset(w,h,w/2-(96+w-480)/2,0,w,h); pv.cam.position.set(Math.sin(t*.07)*2.6,4.2,21); pv.cam.lookAt(0,2.6,0); }
  // single column: the camera backs off until the pad and mech fill the focus box, and shifts the view onto it
  else { const f=HANGAR.focus||{x:w/2,y:h*.36,h:h*.36}, d=clamp(6.4*h/(.47*f.h),12,50); pv.ped.rotation.y=t*.4; pv.cam.setViewOffset(w,h,w/2-f.x,h/2-f.y,w,h); pv.cam.position.set(0,2.4+d*.1,d); pv.cam.lookAt(0,1.75,0); }
  pv.r.render(pv.scene,pv.cam);
}
const PORTRAIT={};
function makePortraits(){
  for(const kind of Object.keys(BOSSES)){
    const m=BOSS_BUILD[kind](), form=BOSSES[kind].form||kind; if(m.shield&&BOSSES[kind].barrier) m.shield.visible=false; if(form==='colossus') animMech(m,0,0);
    const sc=new THREE.Scene(); stdLights(sc); sc.add(m.g); m.g.rotation.y=-.5;
    // frame the body only (auras and telegraph rings are left out of the bounds)
    const hid=[]; m.g.traverse(o=>{ if(o.userData.nofit) hid.push([o,o.parent]); }); hid.forEach(([o,p])=>p.remove(o));
    const bb=new THREE.Box3().setFromObject(m.g), c=bb.getCenter(new V3()), s=bb.getSize(new V3());
    hid.forEach(([o,p])=>p.add(o));
    const pc=new THREE.PerspectiveCamera(30,1,.1,500), dist=Math.max(s.x,s.y,s.z)/(2*Math.tan(15*Math.PI/180))*.95;
    pc.position.set(c.x+dist*.2,c.y+dist*.1,c.z+dist); pc.lookAt(c);
    pv.r.setSize(320,320,false); pv.r.render(sc,pc);
    try{ PORTRAIT[kind]=pv.canvas.toDataURL('image/png'); }catch(e){ PORTRAIT[kind]=''; }
  }
  pv.w=pv.h=0;
}
