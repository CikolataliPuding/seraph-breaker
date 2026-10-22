// Seraph Breaker · input.js: Keyboard and mouse input and the crosshair (desktop mode).
/* ================= INPUT ================= */
const keys={}; let mouseDown=false,rightDown=false,usedMouse=false; const ndc=new THREE.Vector2();
addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT'){ if(e.code==='Enter') e.target.blur(); return; }
  keys[e.code]=true;
  if(e.code==='Space'){ e.preventDefault(); tryDash(); }
  if(e.repeat) return;
  if(e.code==='KeyQ') trySpecial();
  if(e.code==='KeyE') useGadget(0);
  if(e.code==='KeyR') useGadget(1);
  if(e.code==='KeyP'||e.code==='Escape'){ if(state==='cine') endCine(); else togglePause(); }
});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('blur',()=>{ for(const k in keys)keys[k]=false; mouseDown=rightDown=false; });
let mouseX=innerWidth/2,mouseY=innerHeight/2;
addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'){ mouseX=e.clientX; mouseY=e.clientY; if(e.target===canvas||xhOn){ usedMouse=true; ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); } } });
canvas.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse')return; if(e.button===0)mouseDown=true; if(e.button===2)rightDown=true; });
addEventListener('pointerup',e=>{ if(e.pointerType!=='mouse')return; if(e.button===0)mouseDown=false; if(e.button===2)rightDown=false; });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&playing()&&!paused) togglePause(); });
// touch controls (floating joystick, auto-fire, buttons) live in mobile.js

/* ================= CROSSHAIR ================= */
// during a fight the system cursor is hidden and this crosshair follows the mouse: red over an enemy, a short X on hits,
// a filling ring while Rail Lance charges, and wide spread ticks for the Crimson scatter cannon. Menus, pause and choices keep the normal cursor.
let xhOn=false,xhHitT=0;
function setCrosshair(on){ if(on===xhOn) return; xhOn=on; $('xhair').hidden=!on; document.body.classList.toggle('aiming',on); }
function xhHit(){ xhHitT=.13; }
function updateCrosshair(dt){
  const on=!mobileMode&&usedMouse&&state==='fight'&&!paused&&!!player&&!player.dead; setCrosshair(on); if(!on) return;
  const el=$('xhair'), p=player, wp=P.weapon==='sig'?P.unit:P.weapon; el.style.transform=`translate(${mouseX}px,${mouseY}px)`;
  // the aim point is on the muzzle-height plane (see updatePlayer), so "over an enemy" means a shot would pass through it
  let foe=false; if(p.aimOk) for(const e of enemies){ if(e.dead||e.born<.4) continue; if(Math.hypot(e.pos.x-aimPt.x,e.pos.z-aimPt.z)<e.r+.25){ foe=true; break; } }
  xhHitT=Math.max(0,xhHitT-dt); el.classList.toggle('foe',foe); el.classList.toggle('hit',xhHitT>0);
  el.classList.toggle('rail',wp==='rail'); el.style.setProperty('--k',wp==='rail'?p.charge.toFixed(3):0);
  // Crimson pellets fan out ±0.225 rad: the ticks sit at that half-width, measured at the aim distance
  const wide=wp==='crimson'&&p.aimOk; el.classList.toggle('wide',wide);
  if(wide){ const d=Math.hypot(aimPt.x-p.pos.x,aimPt.z-p.pos.z); el.style.setProperty('--g',clamp(d*Math.tan(.225)*innerHeight*cam.zoom/camVS,7,140).toFixed(1)+'px'); } else el.style.removeProperty('--g');
}
