// Seraph Breaker · debug.js: Debug tools, only active with ?debug=1 (add &mobile=1 to force mobile mode on desktop).
/* ================= DEBUG ================= */
const QS=new URLSearchParams(location.search), DEBUG=QS.get('debug')==='1';
let godMode=false;
const DBG={
  god(on=!godMode){ godMode=on; toast(godMode?'God mode on':'God mode off'); return godMode; },
  killAll(){ enemies.slice().forEach(e=>{ if(!e.dead&&e!==boss) killEnemy(e); }); spawnQ=[]; },
  skipCard(){ if(state==='card'){ stateT=0; } if(state==='warn'){ stateT=0; } if(state==='cine') endCine(); },
  spawn(type,elite=false){ if(!player) return; const p=freeSpot(3); return !!spawnEnemy(type,p,elite); },
  next(){ if(state!=='fight'||!room) return; DBG.killAll(); room.cleared=true; enemies.length=0; if(door) openDoor(); goNextRoom(); },
  gold(n=5000){ P.gold+=n; persist(); renderMenu&&renderMenu(); },
  state(){ return {state,room:room&&room.type,ri:sortie&&sortie.ri,enemies:enemies.length,hp:player&&Math.round(player.hp),mobile:mobileMode,rs:player&&player.rs}; },
};
window.DBG=DBG;
function initDebug(){
  if(!DEBUG) return;
  const d=document.createElement('div'); d.id='dbg';
  d.innerHTML=`<b>DEBUG</b><button data-a="next">Next room</button><button data-a="kill">Kill all</button><button data-a="god">God</button><button data-a="gold">+5000 gold</button>
  <label>Room <input id="dbgRoom" type="number" min="1" max="50" value="10"><button data-a="jump">Go</button></label>
  <label>Skill <select id="dbgSkill"></select><button data-a="skill">Grant</button></label>
  <label>Item <select id="dbgItem"></select><button data-a="item">Grant</button></label>
  <label>Enemy <select id="dbgEnemy"></select><button data-a="spawn">Spawn</button><button data-a="spawnE">Elite</button></label>
  <label>Boss <select id="dbgBoss"></select><button data-a="boss">Spawn</button></label>
  <button data-a="mode">Toggle mobile</button><button data-a="hide">Hide</button>`;
  document.body.appendChild(d);
  const fill=(id,obj)=>{ const s=$(id); if(!s||!obj) return; s.innerHTML=Object.keys(obj).map(k=>`<option>${k}</option>`).join(''); };
  fill('dbgSkill',typeof RSK!=='undefined'?RSK:null); fill('dbgItem',typeof ITEMS!=='undefined'?ITEMS:null); fill('dbgEnemy',typeof ENEMY!=='undefined'?ENEMY:{drone:1,seraph:1,heavy:1,warden:1}); fill('dbgBoss',BOSSES);
  d.addEventListener('pointerdown',e=>e.stopPropagation());
  d.addEventListener('click',e=>{ const a=e.target.dataset&&e.target.dataset.a; if(!a) return; const v=id=>$(id).value;
    if(a==='next'&&DBG.next) DBG.next(); if(a==='kill') DBG.killAll(); if(a==='god') DBG.god(); if(a==='gold') DBG.gold();
    if(a==='jump'&&DBG.jump) DBG.jump(+v('dbgRoom')); if(a==='skill'&&DBG.skill) DBG.skill(v('dbgSkill')); if(a==='item'&&DBG.item) DBG.item(v('dbgItem'));
    if(a==='spawn') DBG.spawn(v('dbgEnemy')); if(a==='spawnE') DBG.spawn(v('dbgEnemy'),true); if(a==='boss'&&DBG.boss) DBG.boss(v('dbgBoss'));
    if(a==='mode'&&DBG.mode) DBG.mode(); if(a==='hide') d.classList.toggle('min'); });
  addEventListener('keydown',e=>{ if(e.target&&e.target.tagName==='INPUT') return; if(e.code==='KeyN'&&DBG.next) DBG.next(); if(e.code==='KeyK') DBG.killAll(); if(e.code==='KeyG') DBG.god(); });
}
