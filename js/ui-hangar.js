// Seraph Breaker · ui-hangar.js: Hangar menu: views and bottom navigation.
/* ================= HANGAR UI (A) ================= */
let view='home', selLevel=0;
document.querySelectorAll('.bnav button').forEach(b=>b.onclick=()=>{ sfx('click'); openView(b.dataset.v); });
function openView(v){
  view=v;
  ['home','map','armory','skills','frames','system'].forEach(x=>$('v-'+x).hidden=x!==v);
  document.querySelectorAll('.bnav button').forEach(b=>{ if(b.dataset.v===(v==='map'?'home':v)) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  if(v==='home'||v==='frames'){ $(v==='home'?'slotHome':'slotFrames').appendChild($('pvWrap')); pv.w=0; }
  renderMenu();
  if(v==='map') requestAnimationFrame(scrollMapToSel);
}
function renderMenu(){
  document.documentElement.style.setProperty('--unit',unitCss());
  $('wGold').textContent=P.gold.toLocaleString(); $('wGems').textContent=P.gems.toLocaleString();
  $('whoName').textContent=P.pilot||'[CALLSIGN]'; $('avatar').textContent=String(Math.min(P.progress+1,12)).padStart(2,'0');
  if(view==='home') renderHome(); if(view==='map') renderMap(); if(view==='armory') renderArmory(); if(view==='skills') renderTree($('treeHangar')); if(view==='frames') renderFrames(); if(view==='system') renderSystem();
}
function renderHome(){
  const n=Math.min(P.progress,11), inf=levelInfo(n);
  $('hEye').textContent=P.progress>=12?'CAMPAIGN COMPLETE · REPLAY ANY LEVEL':`STAGE 0${inf.s+1} · LEVEL ${String(n+1).padStart(2,'0')}/12`;
  $('hStage').textContent=inf.stage.name;
  const pips=$('hPips'); pips.innerHTML=''; for(let k=0;k<4;k++){ const i=document.createElement('i'); const idx=inf.s*4+k; if(idx<P.progress) i.className='f'; else if(idx===P.progress) i.className='c'; pips.appendChild(i); }
  $('hBoss').src=PORTRAIT[inf.stage.boss]||''; $('hBoss').alt=BOSSES[inf.stage.boss].name;
  $('pvUnit').textContent=UNITS[P.unit].name; $('pvSp').textContent='SP · '+SPECIALS[P.unit].name;
  $('bestTxt').textContent=`BEST ${String(P.best).padStart(6,'0')} · ${P.progress}/12 LEVELS CLEAR`;
}
$('sortieBtn').onclick=()=>{ sfx('click'); selLevel=Math.min(P.progress,11); openView('map'); };
$('mapBack').onclick=()=>openView('home');
$('launchBtn').onclick=()=>{ if(selLevel<=P.progress) launchLevel(selLevel); };
