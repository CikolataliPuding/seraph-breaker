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
function paint(){ const u=UNITS[P.unit]; return {c1:P.c1==null?u.c1:P.c1, c2:P.c2==null?u.c2:P.c2, c3:u.c3, eye:u.eye}; }
function unitCss(){ const c=paint(); return CSS(P.unit==='verdant'&&P.c1==null?c.c2:c.c1); }
function rebuildPreview(){ if(pv.mech) pv.ped.remove(pv.mech.g); const c=paint(); pv.mech=buildMech(c.c1,c.c2,c.c3,c.eye,1,P.unit); animMech(pv.mech,0,0); pv.mech.arms[1].rotation.x=-.9; pv.ped.add(pv.mech.g); }
function renderPreview(t){
  const w=pv.canvas.clientWidth,h=pv.canvas.clientHeight; if(!w||!h) return;
  if(pv.w!==w||pv.h!==h){ pv.r.setSize(w,h,false); pv.cam.aspect=w/h; pv.cam.updateProjectionMatrix(); pv.w=w; pv.h=h; }
  pv.ped.rotation.y=t*.5; if(pv.mech) pv.mech.hips.position.y=1.6-Math.abs(Math.sin(t*2))*.03;
  const far=pv.cam.aspect<1?14:11.5; pv.cam.position.set(0,2.8,far); pv.cam.lookAt(0,1.55,0); pv.r.render(pv.scene,pv.cam);
}
const PORTRAIT={};
function makePortraits(){
  for(const kind of Object.keys(BOSSES)){
    const m=BOSS_BUILD[kind](); if(m.shield) m.shield.visible=false; if(kind==='colossus') animMech(m,0,0);
    const sc=new THREE.Scene(); stdLights(sc); sc.add(m.g); m.g.rotation.y=-.5;
    const bb=new THREE.Box3().setFromObject(m.g), c=bb.getCenter(new V3()), s=bb.getSize(new V3());
    const pc=new THREE.PerspectiveCamera(30,1,.1,500), dist=Math.max(s.x,s.y,s.z)/(2*Math.tan(15*Math.PI/180))*.95;
    pc.position.set(c.x+dist*.2,c.y+dist*.1,c.z+dist); pc.lookAt(c);
    pv.r.setSize(320,320,false); pv.r.render(sc,pc);
    try{ PORTRAIT[kind]=pv.canvas.toDataURL('image/png'); }catch(e){ PORTRAIT[kind]=''; }
  }
  pv.w=pv.h=0;
}
