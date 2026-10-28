// Seraph Breaker · ui-hangar.js: Hangar menu: views and bottom navigation.
/* ================= HANGAR UI (A) ================= */
let view='home';
document.querySelectorAll('.bnav button').forEach(b=>b.onclick=()=>{ sfx('click'); openView(b.dataset.v); });
function openView(v){
  if(paintTry){ paintTry=null; rebuildPreview(); } // leaving Frames (or any view change) drops a paint that was only tried on
  view=v;
  ['home','map','armory','skills','frames','system'].forEach(x=>$('v-'+x).hidden=x!==v);
  document.querySelectorAll('.bnav button').forEach(b=>{ if(b.dataset.v===(v==='map'?'home':v)) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  placePreview();
  renderMenu();
}
// the mech preview: a full-screen hangar behind the menu, laid out wide (nav rail + side panel) or as the single column
function placePreview(){ const wide=hangarWide();
  if(!HANGAR.on||wide!==HANGAR.wide){ HANGAR.on=true; HANGAR.wide=wide; HANGAR.g.visible=true; document.body.classList.toggle('hangar',wide); document.body.classList.toggle('hangarTall',!wide);
    pv.scene.background=new THREE.Color(0x0e0a13); pv.scene.fog=new THREE.Fog(0x0e0a13,24,70); pv.r.setPixelRatio(Math.min(devicePixelRatio,wide?1.5:mobileMode?1.25:1.5)); pv.w=0; }
  if($('pvWrap').parentNode!==$('hangarBg')){ $('hangarBg').appendChild($('pvWrap')); pv.w=0; }
  hangarFocus(); }
// single column: frame the mech in Home's or Frames' free slot (the list views cover it with a panel); the frame tag sits at the slot's top
function hangarFocus(){ if(HANGAR.wide) return; const s=view==='home'?$('slotHome'):view==='frames'?$('slotFrames'):null, r=s&&s.getBoundingClientRect();
  HANGAR.focus=r&&r.height>60?{x:r.left+r.width/2,y:r.top+r.height/2,h:r.height}:{x:innerWidth/2,y:innerHeight*.36,h:innerHeight*.36};
  $('hangarBg').style.setProperty('--tagY',(r&&r.height>60?r.top+6:96)+'px'); }
addEventListener('resize',()=>{ if(!$('menu').hidden) placePreview(); });
// menu cards tilt toward a mouse pointer (CSS: --rx/--ry, the gloss at --mx/--my); touch screens keep them flat
const TILT='.stageCard,.card,.frame,.node,.arena,.coreRow,.lo';
if(matchMedia('(hover:hover) and (pointer:fine)').matches){ let cur=null; const flat=c=>['--rx','--ry','--mx','--my'].forEach(k=>c.style.removeProperty(k));
  $('menu').addEventListener('pointermove',e=>{ const c=e.target.closest&&e.target.closest(TILT); if(cur&&cur!==c) flat(cur); cur=c; if(!c) return;
    const r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
    c.style.setProperty('--ry',((x-.5)*9).toFixed(2)+'deg'); c.style.setProperty('--rx',((.5-y)*9).toFixed(2)+'deg'); c.style.setProperty('--mx',Math.round(x*100)+'%'); c.style.setProperty('--my',Math.round(y*100)+'%'); });
  $('menu').addEventListener('pointerleave',()=>{ if(cur) flat(cur); cur=null; }); }
// the intro story: cards with Next / Skip (any key or tap goes on), shown once on the first boot; System > Replay story shows it again
const STORYUI={i:0};
function storyShow(){ STORYUI.i=0; $('story').hidden=false; storyCard(); }
function storyCard(){ if(STORYUI.i>=STORY.intro.length){ $('story').hidden=true; P.lore.intro=true; persist(); return; }
  $('stNum').textContent=`${STORYUI.i+1} / ${STORY.intro.length}`; $('stTxt').textContent=STORY.intro[STORYUI.i]; $('stNext').textContent=STORYUI.i===STORY.intro.length-1?t('Fight ▸'):t('Next ▸');
  const tx=$('stTxt'); tx.classList.remove('in'); void tx.offsetWidth; tx.classList.add('in'); }
$('stNext').onclick=e=>{ e.stopPropagation(); sfx('click'); STORYUI.i++; storyCard(); };
$('stSkip').onclick=e=>{ e.stopPropagation(); sfx('click'); STORYUI.i=STORY.intro.length; storyCard(); };
$('story').addEventListener('pointerdown',e=>{ if(e.target.closest('button')) return; STORYUI.i++; storyCard(); });
addEventListener('keydown',e=>{ if($('story').hidden||e.repeat) return; e.preventDefault(); if(e.code==='Escape'){ STORYUI.i=STORY.intro.length; } else STORYUI.i++; storyCard(); });
$('storyBtn').onclick=()=>{ sfx('click'); storyShow(); };
// patch notes: the newest NEWS entry once after an update; a new pilot (intro story not seen yet) has nothing to compare, so it is marked seen
function newsShow(n=NEWS[0]){ if(!n) return; const tags={nerf:'NERF',buff:'BUFF',new:'NEW',change:'CHANGE',fix:'FIX'}; $('nwT').textContent=t(n.title); const ul=$('nwList'); ul.innerHTML='';
  n.items.forEach(x=>{ const li=document.createElement('li'), s=document.createElement('span'), p=document.createElement('span'); s.className='nwTag '+x.k; s.textContent=t(tags[x.k]); p.textContent=t(x.t); li.append(s,p); ul.appendChild(li); });
  $('news').hidden=false; P.news=n.id; persist(); }
function newsBoot(){ const n=NEWS[0]; if(!n||P.news===n.id) return; if(!P.lore.intro){ P.news=n.id; persist(); return; } newsShow(n); }
$('nwOk').onclick=()=>{ sfx('click'); $('news').hidden=true; };
$('newsBtn').onclick=()=>{ sfx('click'); newsShow(); };
function renderMenu(){
  document.documentElement.style.setProperty('--unit',unitCss());
  $('wGold').textContent=P.gold.toLocaleString(); $('wGems').textContent=P.gems.toLocaleString();
  $('whoName').textContent=P.pilot||t('[CALLSIGN]'); $('avatar').textContent=String(P.arenas).padStart(2,'0'); $('betaBadge').hidden=!(P.beta||betaOK());
  if(view==='home'){ renderHome(); hangarFocus(); } if(view==='map') renderMap(); if(view==='armory') renderArmory(); if(view==='skills') renderTree($('treeHangar')); if(view==='frames') renderFrames(); if(view==='system') renderSystem();
}
// holo map (wide hangar, right panel): a route from Arena 1 (bottom) up through the arenas this pilot can see; a node picks the arena, the hangar lights follow
const HOLO=[[18,86],[70,68],[22,50],[72,32],[26,13]];
function renderHolo(sel){ const box=$('holoNodes'); if(!box) return; box.innerHTML=''; const sh=shownArenas(), pts=sh.map((i,k)=>(HOLO[k]||[50,50]).join(',')).join(' ');
  $('holoPath').setAttribute('points',pts); $('holoGlow').setAttribute('points',pts);
  sh.forEach((i,k)=>{ const A=ARENAS[i], [x,y]=HOLO[k]||[50,50], open=arenaOpen(i), best=P.bestRoom[i]||0, done=best>=A.rooms, b=document.createElement('button');
    b.className='hn'+(x>50?' r':'')+(i===sel?' sel':'')+(open?'':' lock')+(done?' done':''); b.style.left=x+'%'; b.style.top=y+'%'; b.style.setProperty('--c',CSS(A.theme.edge)); b.disabled=!open;
    const st=!open?t('Locked'):done?t('Cleared'):best?t('Best room {0}/{1}',best,A.rooms):t('{0} rooms',A.rooms);
    b.setAttribute('aria-label',t('Arena {0}: {1}, {2}',i+1,A.name,st));
    b.innerHTML=`<span class="hd">${String(i+1).padStart(2,'0')}</span><span class="tx"><b></b><small></small></span>`; b.querySelector('b').textContent=A.name; b.querySelector('small').textContent=st;
    b.onclick=()=>{ if(!open||i===sel) return; P.selArena=i; sfx('click'); persist(); renderMenu(); }; box.appendChild(b); }); }
function renderHome(){
  const a=openSel(P.selArena), A=ARENAS[a];
  $('hEye').textContent=t('ARENA {0}','0'+(a+1))+' · '+A.phase.toLocaleUpperCase(LANG)+' · '+roomsLabel(A)+((P.bestRoom[a]||0)>=A.rooms?' · '+t('CLEARED'):'');
  $('hStage').textContent=A.name; hangarTheme(a); renderHolo(a);
  const pips=$('hPips'); pips.innerHTML=''; shownArenas().forEach(i=>{ const x=ARENAS[i], p=document.createElement('i'); if((P.bestRoom[i]||0)>=x.rooms) p.className='f'; else if(arenaOpen(i)) p.className='c'; pips.appendChild(p); });
  const hb=$('hBosses'); hb.innerHTML=''; arenaBossPool(a).slice(0,3).forEach(k=>{ const img=document.createElement('img'); img.src=PORTRAIT[k]||''; img.alt=BOSSES[k].name; img.title=BOSSES[k].name; hb.appendChild(img); }); const bl=document.createElement('span'); bl.textContent=t('BOSSES'); hb.appendChild(bl);
  $('pvUnit').textContent=UNITS[P.unit].name; $('pvSp').textContent=`SP · ${SPECIALS[P.unit].name} · ${SPECIALS[P.unit].cd} s`;
  const run=loadRun(), cb=$('contBtn'); cb.hidden=!run; if(run) cb.textContent=t('Continue · {0} · room {1}/{2}',ARENAS[run.a].name,run.ri+1,ARENAS[run.a].rooms);
  // personal record: the furthest arena you reached and your best room there
  let ra=-1; P.bestRoom.forEach((r,i)=>{ if(r>0&&arenaShown(i)) ra=i; });
  $('bestTxt').textContent=(ra<0?t('Record: no runs yet'):t('Record: Arena {0} · Room {1}/{2}',ra+1,P.bestRoom[ra],ARENAS[ra].rooms))+' · '+t('{0}/{1} arenas open',openArenaCount(),shownArenas().length);
}
$('sortieBtn').onclick=()=>{ sfx('click'); openView('map'); };
$('contBtn').onclick=()=>{ const r=loadRun(); if(r){ sfx('click'); launchArena(r.a,r); } else renderHome(); };
$('mapBack').onclick=()=>openView('home');
$('launchBtn').onclick=()=>{ const a=openSel(P.selArena); if(!arenaOpen(a)) return; if(loadRun()&&!$('launchBtn').dataset.arm){ $('launchBtn').dataset.arm='1'; $('launchBtn').textContent=t('Start over? Your saved run ends'); return; } delete $('launchBtn').dataset.arm; clearRun(); launchArena(a); };
// beta program (tester.js): tap the pilot card for the code box; a ranked pilot gets the report download instead
function renderBeta(){ const on=betaOK(); $('betaJoin').hidden=on; $('betaRep').hidden=!on;
  const n=$('betaNote'); n.className='note'; n.textContent=on?t('Beta tester: thank you! Your runs are logged on this device; download the report when asked.'):t('Got a beta code? Enter it to join the beta.'); }
const betaToggle=()=>{ const p=$('betaPop'); p.hidden=!p.hidden; $('whoBox').setAttribute('aria-expanded',String(!p.hidden)); if(!p.hidden) renderBeta(); sfx('click'); };
$('whoBox').onclick=betaToggle; $('whoBox').addEventListener('keydown',e=>{ if(e.code==='Enter'||e.code==='Space'){ e.preventDefault(); betaToggle(); } });
$('betaBtn').onclick=()=>{ const ok=unlockBeta($('betaIn').value); $('betaIn').value=''; if(ok){ renderBeta(); renderMenu(); sfx('lvup'); } else { const n=$('betaNote'); n.className='note bad'; n.textContent=t('That code is not valid.'); sfx('click'); } };
$('betaIn').addEventListener('keydown',e=>{ if(e.code==='Enter') $('betaBtn').click(); });
$('betaRep').onclick=()=>{ betaReport(); sfx('click'); };
