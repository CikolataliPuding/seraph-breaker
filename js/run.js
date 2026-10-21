// Seraph Breaker · run.js: Arena runs: room schedule, boss picks, Arena 4 modifiers, run save / continue and unlocks.
/* ================= ARENA RUNS ================= */
const RUN_KEY='seraph-breaker-run-v1';
// room n (1-based): boss every 10th, angel on the other 5ths, elite around every 7th, combat otherwise
const arenaRoomType=n=>n%10===0?'boss':n%5===0?'angel':n%7===0?'elite':'combat';
function arenaBossPool(a){ const A=ARENAS[a]; return (A.bosses==='all'?Object.keys(BOSSES):A.bosses).filter(k=>BOSSES[k]); }
// never the same boss twice in a row; a one-boss pool simply repeats
function pickBoss(){ const pool=arenaBossPool(sortie.a), c=pool.filter(k=>k!==sortie.lastBoss), k=pickOne(c.length?c:pool); sortie.lastBoss=k; return k; }
function rollMods(){ const ks=Object.keys(MODS), out=[]; while(out.length<Math.min(2,ks.length)){ const k=pickOne(ks); if(!out.includes(k)) out.push(k); } return out; }
// arena rule + Arena 4 modifiers + devil curses, merged into one object the game reads (sortie.rule)
function buildRule(){
  const r=Object.assign({},ARENAS[sortie.a].rule);
  const merge=mr=>{ if(!mr) return; for(const k in mr){ if(typeof mr[k]==='number'&&typeof r[k]==='number'&&k!=='hazards') r[k]*=mr[k]; else r[k]=mr[k]; } };
  sortie.mods.forEach(m=>merge(MODS[m]&&MODS[m].rule)); sortie.curses.forEach(c=>merge(typeof CURSES!=='undefined'&&CURSES[c]&&CURSES[c].rule));
  sortie.rule=r;
}
function launchArena(a,saved){
  audioInit(); clearWorld(); hideOverlays(); paused=false; $('vign').style.opacity=0;
  if(saved) restoreLoadout(saved);
  stage=a; applyTheme(a);
  const A=ARENAS[a], N=A.rooms;
  sortie={a,N,ri:saved?clamp(saved.ri|0,0,N-1):0,xp:0,lv:1,pendingLv:0,gold:0,gems:0,start:performance.now(),rerolls:1,curses:[],items:[],lastBoss:'',mods:saved?(saved.mods||[]).filter(m=>MODS[m]):(A.mixed?rollMods():[]),rule:{},dmgTaken:0,log:[]};
  makePlayer();
  $('uName').innerHTML=''; const nm=document.createElement('span'); nm.textContent=P.pilot||'Pilot'; const sm=document.createElement('small'); sm.textContent=' · '+unit.name; const lv=document.createElement('em'); lv.id='lvTxt'; lv.textContent='LV 1'; $('uName').append(nm,sm,lv);
  buildRule(); score=0; kills=0; playTime=0;
  if(saved) restoreRun(saved);
  buildRoom(ROOM_X,ROOM_Z,SANCTUM,true); player.pos.set(0,0,AZ-1.5); camTarget.copy(player.pos);
  $('cardNum').textContent=`ARENA 0${a+1} · `+(saved?`CONTINUE · ROOM ${sortie.ri+1}/${N}`:`${N} ROOMS`); $('cardT').textContent=A.name;
  $('cardS').textContent=[A.ruleTxt,...sortie.mods.map(m=>MODS[m].name)].join(' · ');
  const c=$('card'); c.hidden=false; const inner=c.firstElementChild; inner.style.animation='none'; void inner.offsetWidth; inner.style.animation='';
  state='card'; stateT=2; refreshControls(); playTrack('battle');
}
/* run save: written after every cleared room so a closed tab or app can continue from the next room */
function saveRun(nextRi){
  if(!sortie||!player||player.dead||nextRi>=sortie.N) return;
  const r={v:1,a:sortie.a,ri:nextRi,hp:Math.max(1,Math.round(player.hp)),sp:Math.floor(player.sp),rs:player.rs,lv:sortie.lv,xp:sortie.xp,pendingLv:sortie.pendingLv,rerolls:sortie.rerolls,
    curses:sortie.curses,items:sortie.items.map(i=>i.id||i),lastBoss:sortie.lastBoss,mods:sortie.mods,score,kills,playTime,gold:sortie.gold,gems:sortie.gems,dmgTaken:Math.round(sortie.dmgTaken||0),extra:player.extra,unit:P.unit,weapon:P.weapon,gadgets:P.gadgets,t:Date.now()};
  try{ localStorage.setItem(RUN_KEY,JSON.stringify(r)); }catch(e){}
  if(sortie.ri+1>(P.bestRoom[sortie.a]||0)) P.bestRoom[sortie.a]=sortie.ri+1;
  persist();
}
function loadRun(){ try{ const s=localStorage.getItem(RUN_KEY); if(!s) return null; const r=JSON.parse(s); return r&&r.v===1&&ARENAS[r.a]&&r.a<P.arenas?r:null; }catch(e){ return null; } }
function clearRun(){ try{ localStorage.removeItem(RUN_KEY); }catch(e){} }
// the run keeps the frame and loadout it started with
function restoreLoadout(r){
  if(UNITS[r.unit]&&r.unit!==P.unit){ P.unit=r.unit; P.c1=P.c2=null; }
  if(r.weapon&&WEAPONS[r.weapon]&&(r.weapon==='sig'||P.owned[r.weapon])) P.weapon=r.weapon;
  if(Array.isArray(r.gadgets)) P.gadgets=[0,1].map(i=>GADGETS[r.gadgets[i]]&&P.owned[r.gadgets[i]]?r.gadgets[i]:'');
}
// rebuild the run from a save: unknown skill/item/curse ids (removed by an update) are dropped safely
function restoreRun(r){
  const num=(v,d=0)=>Number.isFinite(+v)?+v:d;
  sortie.xp=num(r.xp); sortie.lv=Math.max(1,num(r.lv,1)); sortie.pendingLv=clamp(num(r.pendingLv),0,5); sortie.rerolls=clamp(num(r.rerolls,1),0,9); sortie.lastBoss=BOSSES[r.lastBoss]?r.lastBoss:'';
  sortie.gold=num(r.gold); sortie.gems=num(r.gems); sortie.dmgTaken=num(r.dmgTaken); score=num(r.score); kills=num(r.kills); playTime=num(r.playTime);
  if(r.extra&&typeof r.extra==='object') for(const k in r.extra) if(BUCKET_KEYS.includes(k)&&Number.isFinite(+r.extra[k])) player.extra[k]=+r.extra[k];
  (Array.isArray(r.curses)?r.curses:[]).forEach(c=>{ if(typeof CURSES!=='undefined'&&CURSES[c]&&!sortie.curses.includes(c)) applyCurse(c,true); });
  if(r.rs&&typeof r.rs==='object') for(const id in r.rs){ if(!RSK[id]) continue; const n=Math.min(num(r.rs[id]),RSK[id].max); for(let k=0;k<n;k++) applySkill(id,true); }
  (Array.isArray(r.items)?r.items:[]).forEach(id=>{ if(typeof ITEMS!=='undefined'&&ITEMS[id]&&sortie.items.length<4) addItem(id,true); });
  buildRule(); recalcStats(); renderRunSkills();
  player.hp=clamp(num(r.hp,player.maxHp),1,player.maxHp); player.sp=clamp(num(r.sp),0,100);
}
function arenaComplete(){
  const a=sortie.a, N=sortie.N, first=(P.bestRoom[a]||0)<N;
  const bonus=first?ECON.firstClear(a):ECON.repeatClear(a); P.gems+=bonus; sortie.gems+=bonus; logEarn('gems','clear',bonus); logRoomEnd('complete');
  P.bestRoom[a]=N; P.arenas=Math.max(P.arenas,Math.min(ARENAS.length,a+2)); P.clears++;
  if(score>P.best) P.best=score;
  clearRun(); persist(); showResult(true,bonus,first);
}
