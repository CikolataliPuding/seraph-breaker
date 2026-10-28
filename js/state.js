// Seraph Breaker · state.js: Shared game state and reusable meshes (barrier, beams, hook, orbit blades).
/* ================= GAME STATE ================= */
let state='menu',paused=false,player=null,unit=null,boss=null,sortie=null,room=null;
const enemies=[],bullets=[],fx=[],pickups=[],shocks=[],mines=[],holes=[];
let decoy=null,buddy=null,wingman=null,chrono=0,npc=null,obstacles=[],door=null,stage=0;
const blasts=[],trails=[],emines=[],hazards=[],efields=[]; // efields: Coil's live ground fields (enemy-ai.js)
let shotSrc=null; // the pilot while its weapon fires: shots remember where they left the body, so the first frame of a shot sweeps from there
let aiSrc=null; // the enemy whose AI is running: its ENEMY dmgK scales the shots, blasts and touches it makes (patch.md 29)
let stateT=0,spawnQ=[],score=0,kills=0,playTime=0,shake=0,toastT=0,choiceBack='fight';
/* every state change goes through setState. Player death wins: once 'dying' or 'result' is set, only the result screen (from 'dying'),
   the menu or a new run (newRun=true: launchArena, debug jumps) can follow. Returns false when the change is refused. */
function setState(next,newRun){
  if((state==='dying'||state==='result')&&next!==state&&!newRun&&next!=='menu'&&!(state==='dying'&&next==='result')) return false;
  state=next; return true;
}
const playing=()=>['card','prep','warn','cine','fight','trans','bossdeath','dying','choice'].includes(state);
const ray=new THREE.Raycaster(), aimPlane=new THREE.Plane(new V3(0,1,0),-2.3), aimPt=new V3();
// spotLit: you stand in a Main Stage follow spot (enemy shots 25% faster and better aimed); spotNext collects it for the next frame
let spotLit=false, spotNext=false;
const eSpd=()=>(1+stage*.08)*(sortie&&sortie.rule.shotSpd||1)*(spotLit?1.25:1);
const tgt=()=>decoy?decoy.pos:player.pos;

const shieldG=new THREE.Group(); scene.add(shieldG); shieldG.visible=false;
const shFill=new THREE.Mesh(new THREE.CircleGeometry(1.6,6),addMat(0xff7a2a,.22)); shieldG.add(shFill);
const shRings=[0,1,2].map(()=>{ const r=new THREE.Mesh(new THREE.RingGeometry(.92,1,6),addMat(0xffa04a,.9)); shieldG.add(r); return r; });
shFill.rotation.z=Math.PI/6; shRings.forEach(r=>r.rotation.z=Math.PI/6);
const beamGeo=new THREE.CylinderGeometry(1,1,1,14,1,true); beamGeo.rotateX(Math.PI/2); beamGeo.translate(0,0,.5); beamGeo.userData.shared=true;
const beamTele=new THREE.Mesh(beamGeo,addMat(0xff2a3a,.5)), beamOuter=new THREE.Mesh(beamGeo,addMat(0xff4a7a,.6)), beamCore=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false}));
const beams=[beamTele,beamOuter,beamCore]; beams.forEach(b=>{b.visible=false;scene.add(b);});
const hideBeams=()=>beams.forEach(b=>b.visible=false);
const pBeamO=new THREE.Mesh(beamGeo,addMat(0xb8ff5a,.6)), pBeamC=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false}));
[pBeamO,pBeamC].forEach(b=>{b.visible=false;scene.add(b);});
const chargeOrb=new THREE.Mesh(new THREE.SphereGeometry(.3,12,8),addMat(0xffffff,.8)); chargeOrb.visible=false; scene.add(chargeOrb);
const odRing=new THREE.Mesh(new THREE.RingGeometry(1.4,1.6,6),addMat(0xffe14a,.8)); odRing.rotation.x=-Math.PI/2; odRing.visible=false; scene.add(odRing);
const hookLineGeo=new THREE.BufferGeometry().setFromPoints([new V3(),new V3()]); hookLineGeo.userData.shared=true;
const hookLine=new THREE.Line(hookLineGeo,new THREE.LineBasicMaterial({color:0xffe0a0})); hookLine.visible=false; hookLine.frustumCulled=false; scene.add(hookLine);
const hookHead=new THREE.Mesh(new THREE.ConeGeometry(.2,.5,4),basic(0xffe0a0,false)); hookHead.visible=false; scene.add(hookHead);
const orbitG=new THREE.Group(); scene.add(orbitG);
// phone mode: dash direction arrow under the mech, and the hex ring of the auto barrier while it is charged
const dashArrow=new THREE.Group(); (()=>{ const s=new THREE.Shape(); s.moveTo(0,.5); s.lineTo(.4,-.32); s.lineTo(0,-.12); s.lineTo(-.4,-.32); s.closePath();
  const m=new THREE.Mesh(new THREE.ShapeGeometry(s),addMat(0xffffff,.6)); m.rotation.x=-Math.PI/2; dashArrow.add(m); })(); dashArrow.visible=false; scene.add(dashArrow);
const barRing=new THREE.Mesh(new THREE.RingGeometry(1.3,1.42,6),addMat(0xffa04a,.25)); barRing.rotation.x=-Math.PI/2; barRing.visible=false; scene.add(barRing);
const roomGroup=new THREE.Group(); scene.add(roomGroup);
