// Seraph Breaker · input.js: Keyboard and mouse input (desktop mode).
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
canvas.addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'){ usedMouse=true; ndc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);} });
canvas.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse')return; if(e.button===0)mouseDown=true; if(e.button===2)rightDown=true; });
addEventListener('pointerup',e=>{ if(e.pointerType!=='mouse')return; if(e.button===0)mouseDown=false; if(e.button===2)rightDown=false; });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&playing()&&!paused) togglePause(); });
// touch controls (floating joystick, auto-fire, buttons) live in mobile.js
