// Seraph Breaker · ui-hangar.js: Hangar menu: views and bottom navigation.
/* ================= HANGAR UI (A) ================= */
let view='home';
document.querySelectorAll('.bnav button').forEach(b=>b.onclick=()=>{ sfx('click'); openView(b.dataset.v); });
function openView(v){
  view=v;
  ['home','map','armory','skills','frames','system'].forEach(x=>$('v-'+x).hidden=x!==v);
  document.querySelectorAll('.bnav button').forEach(b=>{ if(b.dataset.v===(v==='map'?'home':v)) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  placePreview();
  renderMenu();
}
// the mech preview: a full-screen hangar behind the panels on a wide desktop screen, else the card in Home / Frames
function placePreview(){ const wide=hangarWide();
  if(wide!==HANGAR.wide){ HANGAR.wide=wide; HANGAR.g.visible=wide; document.body.classList.toggle('hangar',wide);
    pv.scene.background=wide?new THREE.Color(0x0e0a13):null; pv.scene.fog=wide?new THREE.Fog(0x0e0a13,24,62):null; pv.r.setPixelRatio(Math.min(devicePixelRatio,wide?1.5:2)); pv.w=0; }
  const slot=wide?$('hangarBg'):view==='home'?$('slotHome'):view==='frames'?$('slotFrames'):null;
  if(slot&&$('pvWrap').parentNode!==slot){ slot.appendChild($('pvWrap')); pv.w=0; } }
addEventListener('resize',()=>{ if(!$('menu').hidden) placePreview(); });
function renderMenu(){
  document.documentElement.style.setProperty('--unit',unitCss());
  $('wGold').textContent=P.gold.toLocaleString(); $('wGems').textContent=P.gems.toLocaleString();
  $('whoName').textContent=P.pilot||'[CALLSIGN]'; $('avatar').textContent=String(P.arenas).padStart(2,'0'); $('betaBadge').hidden=!P.beta;
  if(view==='home') renderHome(); if(view==='map') renderMap(); if(view==='armory') renderArmory(); if(view==='skills') renderTree($('treeHangar')); if(view==='frames') renderFrames(); if(view==='system') renderSystem();
}
function renderHome(){
  const a=openSel(P.selArena), A=ARENAS[a];
  $('hEye').textContent=`ARENA 0${a+1} · ${roomsLabel(A)}`+((P.bestRoom[a]||0)>=A.rooms?' · CLEARED':'');
  $('hStage').textContent=A.name; hangarTheme(a);
  const pips=$('hPips'); pips.innerHTML=''; ARENAS.forEach((x,i)=>{ const p=document.createElement('i'); if((P.bestRoom[i]||0)>=x.rooms) p.className='f'; else if(arenaOpen(i)) p.className='c'; pips.appendChild(p); });
  const hb=$('hBosses'); hb.innerHTML=''; arenaBossPool(a).slice(0,3).forEach(k=>{ const img=document.createElement('img'); img.src=PORTRAIT[k]||''; img.alt=BOSSES[k].name; img.title=BOSSES[k].name; hb.appendChild(img); }); const bl=document.createElement('span'); bl.textContent='BOSSES'; hb.appendChild(bl);
  $('pvUnit').textContent=UNITS[P.unit].name; $('pvSp').textContent='SP · '+SPECIALS[P.unit].name;
  const run=loadRun(), cb=$('contBtn'); cb.hidden=!run; if(run) cb.textContent=`Continue · ${ARENAS[run.a].name} · room ${run.ri+1}/${ARENAS[run.a].rooms}`;
  // personal record: the furthest arena you reached and your best room there
  let ra=-1; P.bestRoom.forEach((r,i)=>{ if(r>0&&i<ARENAS.length) ra=i; });
  $('bestTxt').textContent=(ra<0?'Record: no runs yet':`Record: Arena ${ra+1} · Room ${P.bestRoom[ra]}/${ARENAS[ra].rooms}`)+` · ${openArenaCount()}/${ARENAS.length} arenas open`;
}
$('sortieBtn').onclick=()=>{ sfx('click'); openView('map'); };
$('contBtn').onclick=()=>{ const r=loadRun(); if(r){ sfx('click'); launchArena(r.a,r); } else renderHome(); };
$('mapBack').onclick=()=>openView('home');
$('launchBtn').onclick=()=>{ const a=openSel(P.selArena); if(!arenaOpen(a)) return; if(loadRun()&&!$('launchBtn').dataset.arm){ $('launchBtn').dataset.arm='1'; $('launchBtn').textContent='Start over? Your saved run ends'; return; } delete $('launchBtn').dataset.arm; clearRun(); launchArena(a); };
