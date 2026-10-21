// Seraph Breaker · ui-hangar.js: Hangar menu: views and bottom navigation.
/* ================= HANGAR UI (A) ================= */
let view='home';
document.querySelectorAll('.bnav button').forEach(b=>b.onclick=()=>{ sfx('click'); openView(b.dataset.v); });
function openView(v){
  view=v;
  ['home','map','armory','skills','frames','system'].forEach(x=>$('v-'+x).hidden=x!==v);
  document.querySelectorAll('.bnav button').forEach(b=>{ if(b.dataset.v===(v==='map'?'home':v)) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  if(v==='home'||v==='frames'){ $(v==='home'?'slotHome':'slotFrames').appendChild($('pvWrap')); pv.w=0; }
  renderMenu();
}
function renderMenu(){
  document.documentElement.style.setProperty('--unit',unitCss());
  $('wGold').textContent=P.gold.toLocaleString(); $('wGems').textContent=P.gems.toLocaleString();
  $('whoName').textContent=P.pilot||'[CALLSIGN]'; $('avatar').textContent=String(P.arenas).padStart(2,'0');
  if(view==='home') renderHome(); if(view==='map') renderMap(); if(view==='armory') renderArmory(); if(view==='skills') renderTree($('treeHangar')); if(view==='frames') renderFrames(); if(view==='system') renderSystem();
}
function renderHome(){
  const a=clamp(P.selArena,0,P.arenas-1), A=ARENAS[a];
  $('hEye').textContent=`ARENA 0${a+1} · ${A.rooms} ROOMS`+((P.bestRoom[a]||0)>=A.rooms?' · CLEARED':'');
  $('hStage').textContent=A.name;
  const pips=$('hPips'); pips.innerHTML=''; ARENAS.forEach((x,i)=>{ const p=document.createElement('i'); if((P.bestRoom[i]||0)>=x.rooms) p.className='f'; else if(i<P.arenas) p.className='c'; pips.appendChild(p); });
  const hb=$('hBosses'); hb.innerHTML=''; arenaBossPool(a).slice(0,3).forEach(k=>{ const img=document.createElement('img'); img.src=PORTRAIT[k]||''; img.alt=BOSSES[k].name; img.title=BOSSES[k].name; hb.appendChild(img); }); const bl=document.createElement('span'); bl.textContent='BOSSES'; hb.appendChild(bl);
  $('pvUnit').textContent=UNITS[P.unit].name; $('pvSp').textContent='SP · '+SPECIALS[P.unit].name;
  const run=loadRun(), cb=$('contBtn'); cb.hidden=!run; if(run) cb.textContent=`Continue · ${ARENAS[run.a].name} · room ${run.ri+1}/${ARENAS[run.a].rooms}`;
  $('bestTxt').textContent=`BEST ${String(P.best).padStart(6,'0')} · ${P.arenas}/${ARENAS.length} ARENAS OPEN`;
}
$('sortieBtn').onclick=()=>{ sfx('click'); openView('map'); };
$('contBtn').onclick=()=>{ const r=loadRun(); if(r){ sfx('click'); launchArena(r.a,r); } else renderHome(); };
$('mapBack').onclick=()=>openView('home');
$('launchBtn').onclick=()=>{ const a=P.selArena; if(a>=P.arenas) return; if(loadRun()&&!$('launchBtn').dataset.arm){ $('launchBtn').dataset.arm='1'; $('launchBtn').textContent='Start over? Your saved run ends'; return; } delete $('launchBtn').dataset.arm; clearRun(); launchArena(a); };
