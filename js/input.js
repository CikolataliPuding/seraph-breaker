// Seraph Breaker · input.js: Keyboard, mouse and touch (twin-stick) input.
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
addEventListener('touchstart',()=>{ if(!isTouch){ isTouch=true; document.body.classList.add('touch'); refreshControls(); } },{passive:true});
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&playing()&&!paused) togglePause(); });
const tc={move:{id:null,x:0,y:0,el:$('stkM')},aim:{id:null,x:0,y:0,el:$('stkA')},shield:false};
// called from main.js at boot: it passes tryDash/trySpecial/togglePause (defined in later files) by reference
function initTouchControls(){
  const layer=$('touch'),R=55;
  layer.addEventListener('pointerdown',e=>{
    if(e.target!==layer&&!e.target.classList.contains('ghostStk')) return;
    const s=e.clientX<innerWidth*.5?tc.move:tc.aim; if(s.id!==null) return;
    s.id=e.pointerId; s.ox=e.clientX; s.oy=e.clientY; s.x=s.y=0; s.el.style.left=s.ox+'px'; s.el.style.top=s.oy+'px'; s.el.hidden=false; s.el.firstElementChild.style.transform='';
    try{ layer.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault();
  });
  layer.addEventListener('pointermove',e=>{ for(const s of [tc.move,tc.aim]) if(s.id===e.pointerId){ let dx=e.clientX-s.ox,dy=e.clientY-s.oy; const l=Math.hypot(dx,dy); if(l>R){dx*=R/l;dy*=R/l;} s.x=dx/R; s.y=dy/R; s.el.firstElementChild.style.transform=`translate(${dx}px,${dy}px)`; } });
  const end=e=>{ for(const s of [tc.move,tc.aim]) if(s.id===e.pointerId){ s.id=null; s.x=s.y=0; s.el.hidden=true; } };
  layer.addEventListener('pointerup',end); layer.addEventListener('pointercancel',end);
  const hex=$('tHex');
  hex.addEventListener('pointerdown',e=>{ e.stopPropagation(); try{hex.setPointerCapture(e.pointerId);}catch(_){} tc.shield=true; hex.classList.add('on'); });
  const off=()=>{ tc.shield=false; hex.classList.remove('on'); }; hex.addEventListener('pointerup',off); hex.addEventListener('pointercancel',off);
  const tap=(id,fn)=>$(id).addEventListener('pointerdown',e=>{ e.stopPropagation(); fn(); const d=$(id); d.classList.add('on'); setTimeout(()=>d.classList.remove('on'),120); });
  tap('tDash',tryDash); tap('tSP',trySpecial); tap('tG1',()=>useGadget(0)); tap('tG2',()=>useGadget(1)); tap('tPause',togglePause);
}
function resetTouch(){ for(const s of [tc.move,tc.aim]){ s.id=null; s.x=s.y=0; s.el.hidden=true; } tc.shield=false; $('tHex').classList.remove('on'); }
