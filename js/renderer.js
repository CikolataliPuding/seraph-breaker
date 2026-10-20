// Seraph Breaker · renderer.js: Three.js renderer, camera, lights, toon materials and the city around the arena.
/* ================= RENDERER ================= */
const canvas=$('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.6:2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x1d1424); scene.fog=new THREE.Fog(0x1d1424,48,95);
const cam=new THREE.OrthographicCamera(-10,10,10,-10,.1,300);
const CAM_OFF=new V3(30,30,30), camTarget=new V3();
let camZoom=1;
function resize(){ const w=innerWidth,h=innerHeight,a=w/h; renderer.setSize(w,h,false); const vs=a<1?25:(h<520?17:22); cam.left=-vs*a/2; cam.right=vs*a/2; cam.top=vs/2; cam.bottom=-vs/2; cam.updateProjectionMatrix(); }
addEventListener('resize',resize); resize();
const hemi=new THREE.HemisphereLight(0xffd6b8,0x2a1d3a,.75); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe6cc,.95); sun.castShadow=true; const sm=isTouch?1024:2048; sun.shadow.mapSize.set(sm,sm);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:90}); sun.shadow.bias=-.0008; scene.add(sun,sun.target);
const rim=new THREE.DirectionalLight(0xff7a40,.35); rim.position.set(-20,8,-30); scene.add(rim);
const grad=(()=>{ const d=new Uint8Array([80,80,80,255,165,165,165,255,255,255,255,255]); const t=new THREE.DataTexture(d,3,1,THREE.RGBAFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
const toon=(c,e=0)=>new THREE.MeshToonMaterial({color:c,gradientMap:grad,emissive:e});
const outlineMat=new THREE.MeshBasicMaterial({color:0x0a0610,side:THREE.BackSide});
const basicCache={};
function basic(c,add=true,op=1){ const k=c+'_'+add+'_'+op; return basicCache[k]||(basicCache[k]=new THREE.MeshBasicMaterial({color:c,transparent:op<1||add,opacity:op,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:!add})); }
const addMat=(c,op=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const box=(x,y,z)=>new THREE.BoxGeometry(x,y,z);
let castShadows=true;
function part(geo,mat,parent,x=0,y=0,z=0,t=.09){
  const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=castShadows; parent.add(m);
  if(t){ geo.computeBoundingBox(); const s=new V3(); geo.boundingBox.getSize(s); const o=new THREE.Mesh(geo,outlineMat); o.scale.set((s.x+t)/(s.x||1),(s.y+t)/(s.y||1),(s.z+t)/(s.z||1)); m.add(o); }
  return m;
}
const blob=r=>{ const m=new THREE.Mesh(new THREE.CircleGeometry(r,18),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.34,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=.03; return m; };

/* world: ground + city ring */
let ARENA=24, hazardMat=null;
const OUTW=6, ROOM_R=13, BOSS_R=16, OUT_DPS=6;
let groundMat,cityMat,winInst,tileTex;
(function buildWorld(){
  const cv=document.createElement('canvas'); cv.width=cv.height=256; const g=cv.getContext('2d');
  g.fillStyle='#3e3a44'; g.fillRect(0,0,256,256); g.strokeStyle='#57525e'; g.lineWidth=2; g.strokeRect(1,1,254,254);
  g.strokeStyle='#4a4652'; g.lineWidth=1; g.beginPath(); g.moveTo(128,0); g.lineTo(128,256); g.moveTo(0,128); g.lineTo(256,128); g.stroke();
  for(let i=0;i<220;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*.05})`; g.fillRect(Math.random()*256,Math.random()*256,2,2); }
  const tex=new THREE.CanvasTexture(cv); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(40,40);
  groundMat=new THREE.MeshToonMaterial({map:tex,gradientMap:grad,color:0x5a4c64});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),groundMat); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
  const tc=document.createElement('canvas'); tc.width=tc.height=128; const t2=tc.getContext('2d');
  t2.fillStyle='#c8c4cc'; t2.fillRect(0,0,128,128); t2.fillStyle='#b4b0b8'; t2.fillRect(0,0,64,64); t2.fillRect(64,64,64,64);
  t2.strokeStyle='#8a8690'; t2.lineWidth=3; t2.strokeRect(1.5,1.5,125,125);
  tileTex=new THREE.CanvasTexture(tc); tileTex.wrapS=tileTex.wrapT=THREE.RepeatWrapping;
  const tones=[0x4a4256,0x3c3648,0x5a4e60,0x463e52,0x655868].map(c=>new THREE.Color(c));
  const blocks=[],wins=[],reach=isTouch?13:18;
  for(let x=-ARENA-reach;x<=ARENA+reach;x+=4.5) for(let z=-ARENA-reach;z<=ARENA+reach;z+=4.5){
    if(Math.abs(x)<ARENA+2.5&&Math.abs(z)<ARENA+2.5) continue; if(Math.random()<.22) continue;
    const near=(x>ARENA||z>ARENA), h=near?rand(.6,2.2):rand(3,15), w=rand(2.4,3.8), d=rand(2.4,3.8), px=x+rand(-.4,.4), pz=z+rand(-.4,.4);
    blocks.push({px,pz,w,h,d,c:tones[(Math.random()*tones.length)|0]});
    if(h>4){ const n=Math.floor(h/1.6); for(let i=1;i<n;i++) if(Math.random()>.45) wins.push({px,pz,w:w*.7,y:i*1.6,d:d+.04}); }
  }
  const ub=box(1,1,1),dm=new THREE.Object3D();
  cityMat=new THREE.MeshToonMaterial({color:0xffffff,gradientMap:grad});
  const bi=new THREE.InstancedMesh(ub,cityMat,blocks.length), oi=new THREE.InstancedMesh(ub,outlineMat,blocks.length);
  bi.castShadow=true; bi.receiveShadow=true;
  blocks.forEach((b,i)=>{ dm.position.set(b.px,b.h/2,b.pz); dm.scale.set(b.w,b.h,b.d); dm.updateMatrix(); bi.setMatrixAt(i,dm.matrix); bi.setColorAt(i,b.c); dm.scale.set(b.w+.14,b.h+.14,b.d+.14); dm.updateMatrix(); oi.setMatrixAt(i,dm.matrix); });
  bi.instanceColor.needsUpdate=true; scene.add(bi,oi);
  winInst=new THREE.InstancedMesh(ub,new THREE.MeshBasicMaterial({color:0xffc47a}),Math.max(1,wins.length));
  wins.forEach((w,i)=>{ dm.position.set(w.px,w.y,w.pz); dm.scale.set(w.w,.18,w.d); dm.updateMatrix(); winInst.setMatrixAt(i,dm.matrix); });
  winInst.count=wins.length; scene.add(winInst);
})();
function applyTheme(i){ const t=STAGES[i].theme; scene.background.setHex(t.bg); scene.fog.color.setHex(t.bg); hemi.color.setHex(t.hemiS); hemi.groundColor.setHex(t.hemiG); groundMat.color.setHex(t.ground); cityMat.color.setHex(t.city); rim.color.setHex(t.rim); winInst.material.color.setHex(t.win); }
