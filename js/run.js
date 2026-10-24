// Seraph Breaker · run.js: Arena runs: room schedule, boss picks, Arena 4 modifiers, run save / continue and unlocks.
/* ================= ARENA RUNS ================= */
const RUN_KEY='seraph-breaker-run-v1';
// '30 ROOMS', or the arena's own label ('15 ROOMS + BOSS' on the Main Stage)
const roomsLabel=A=>A.roomsTxt||A.rooms+' ROOMS';
// room n (1-based): from the run plan when there is one, else the PACING slot (boss, angel, elite or combat)
const arenaRoomType=n=>{ const p=sortie&&sortie.plan&&sortie.plan[n-1]; if(p) return p.type; const c=PACING[((n-1)%10)+1]; return c.boss?'boss':c.angel?'angel':c.elite?'elite':'combat'; };
// 'all' (Arena 4) is every boss and corrupted variant except an arena's own headliner (stageOnly: High-Co belongs to the Main Stage)
function arenaBossPool(a){ const A=ARENAS[a]; return (A.bosses==='all'?Object.keys(BOSSES).filter(k=>!BOSSES[k].stageOnly):A.bosses).filter(k=>BOSSES[k]); }
// seeded random: the same run seed always gives the same plan, so a continued run keeps its rooms and bosses
function seeded(seed){ let t=seed>>>0; return ()=>{ t=(t+0x6D2B79F5)>>>0; let r=Math.imul(t^t>>>15,1|t); r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; }
/* the arena plan, one entry per room: {type:'combat'|'elite'|'angel'|'boss', kind (ROOM_KINDS), k (budget multiplier from PACING), boss (the boss
   that ends this 10-room block, planned ahead), teach (that boss, on its teaching room)}. Bosses never repeat back to back. Pure: the debug
   simulation and the arena preview use it too. */
function arenaPlan(a,seed,lastBoss=''){
  const A=ARENAS[a], N=A.rooms, rnd=seeded((seed|0)*7919+a*104729+1), pool=arenaBossPool(a), plan=[]; let last=lastBoss, bb='';
  // Main Stage: every room is a wave room (STAGE), the boss comes after the last one
  if(A.stage){ for(let n=1;n<=N;n++) plan.push(n===N?{n,boss:pool[0],k:1,type:'boss',kind:'boss'}:{n,boss:pool[0],k:1,type:'combat',kind:'stage'}); return plan; }
  for(let n=1;n<=N;n++){ const pos=n===N?10:((n-1)%10)+1, pc=PACING[pos];
    if((n-1)%10===0||!bb){ const c=pool.filter(k=>k!==last); bb=c.length?c[(rnd()*c.length)|0]:pool[0]; last=bb; }
    const r={n,boss:bb,k:pc.k||1};
    if(pc.boss){ r.type='boss'; r.kind='boss'; }
    else if(pc.angel){ r.type='angel'; r.kind='angel'; }
    else { const ok=pc.kinds.filter(k=>{ const K=ROOM_KINDS[k]; return n>=(K.minRoom||0)&&a>=(K.minArena||0); }); r.kind=ok.length?ok[(rnd()*ok.length)|0]:'normal';
      r.type=pc.elite&&r.kind!=='hunt'?'elite':'combat'; if(r.kind==='teach') r.teach=bb; }
    plan.push(r); }
  return plan;
}
// the boss of a boss room comes from the plan (so the rooms before it could teach it); never the same boss twice in a row
function pickBoss(){ const p=sortie.plan&&sortie.plan[sortie.ri]; let k=p&&p.boss&&BOSSES[p.boss]?p.boss:null;
  if(!k){ const pool=arenaBossPool(sortie.a), c=pool.filter(x=>x!==sortie.lastBoss); k=pickOne(c.length?c:pool); } sortie.lastBoss=k; return k; }
function rollMods(){ const ks=Object.keys(MODS), out=[]; while(out.length<Math.min(2,ks.length)){ const k=pickOne(ks); if(!out.includes(k)) out.push(k); } return out; }
// arena rule + Arena 4 modifiers + devil curses, merged into one object the game reads (sortie.rule)
function buildRule(){
  const r=Object.assign({},ARENAS[sortie.a].rule);
  const merge=mr=>{ if(!mr) return; for(const k in mr){ if(typeof mr[k]==='number'&&typeof r[k]==='number'&&k!=='hazards') r[k]*=mr[k]; else r[k]=mr[k]; } };
  sortie.mods.forEach(m=>merge(MODS[m]&&MODS[m].rule)); sortie.curses.forEach(c=>merge(typeof CURSES!=='undefined'&&CURSES[c]&&CURSES[c].rule));
  sortie.rule=r;
}
function launchArena(a,saved,retry){
  if(!retry) bossSnap=null;
  audioInit(); clearWorld(); hideOverlays(); paused=false; $('vign').style.opacity=0;
  if(saved) restoreLoadout(saved);
  stage=a; applyTheme(a);
  const A=ARENAS[a], N=A.rooms;
  sortie={a,N,tester:!!(DEBUG||saved&&saved.tester),farm:farmMul(a),seed:saved&&Number.isFinite(+saved.seed)?saved.seed|0:(Math.random()*2e9)|0,ri:saved?clamp(saved.ri|0,0,N-1):0,xp:0,lv:1,pendingLv:0,gold:0,gems:0,start:performance.now(),rerolls:1,curses:[],items:[],lastBoss:'',mods:saved?(saved.mods||[]).filter(m=>MODS[m]):(A.mixed?rollMods():[]),rule:{},dmgTaken:0,log:[]};
  choiceQ.length=0; makePlayer();
  $('uName').innerHTML=''; const nm=document.createElement('span'); nm.textContent=P.pilot||'Pilot'; const sm=document.createElement('small'); sm.textContent=' · '+unit.name; const lv=document.createElement('em'); lv.id='lvTxt'; lv.textContent='LV 1'; $('uName').append(nm,sm,lv);
  buildRule(); score=0; kills=0; playTime=0;
  if(saved) restoreRun(saved);
  sortie.plan=arenaPlan(a,sortie.seed,saved&&!saved.seed?sortie.lastBoss:'');
  buildRoom(roomHalfX(),ROOM_Z,SANCTUM,true); player.pos.set(0,0,AZ-1.5); camTarget.copy(player.pos);
  $('cardNum').textContent=`ARENA 0${a+1} · `+(retry?`RETRY BOSS · ROOM ${sortie.ri+1}/${N}`:saved?`CONTINUE · ROOM ${sortie.ri+1}/${N}`:roomsLabel(A)); $('cardT').textContent=A.name;
  $('cardS').textContent=[A.ruleTxt,...sortie.mods.map(m=>MODS[m].name)].join(' · ');
  const c=$('card'); c.hidden=false; const inner=c.firstElementChild; inner.style.animation='none'; void inner.offsetWidth; inner.style.animation='';
  setState('card',true); stateT=2; refreshControls(); playTrack(fightTrack());
}
/* run save: written after every cleared room so a closed tab or app can continue from the next room */
function saveRun(nextRi){
  if(!sortie||!player||player.dead||nextRi>=sortie.N) return;
  const r=runSnap(nextRi);
  try{ localStorage.setItem(RUN_KEY,JSON.stringify(r)); }catch(e){}
  if(sortie.ri+1>(P.bestRoom[sortie.a]||0)) P.bestRoom[sortie.a]=sortie.ri+1;
  persist();
}
// everything a run needs to continue at room ri (the run save, and the Retry boss snapshot)
function runSnap(ri){
  return {v:1,a:sortie.a,seed:sortie.seed,tester:!!sortie.tester,ri,hp:Math.max(1,Math.round(player.hp)),sp:Math.floor(player.sp),rs:player.rs,lv:sortie.lv,xp:sortie.xp,pendingLv:sortie.pendingLv,rerolls:sortie.rerolls,
    curses:sortie.curses,items:sortie.items.map(i=>i.id||i),lastBoss:sortie.lastBoss,mods:sortie.mods,score,kills,playTime,gold:sortie.gold,gems:sortie.gems,dmgTaken:Math.round(sortie.dmgTaken||0),extra:player.extra,unit:P.unit,weapon:P.weapon,gadgets:P.gadgets.slice(),t:Date.now()};
}
/* Retry boss: entering a boss room (any arena) snapshots the run (runSnap: armor, build, skills, items, curses, run gold and diamonds, room)
   plus the first-clear state. If the pilot goes down in that room, the result screen offers Retry boss: the run is rebuilt from the snapshot and
   starts again at the boss, who starts over from his first form with full armor. Gold and diamonds picked up during the failed attempt are taken
   back (never below zero), so rewards and the first-clear bonus are only paid once, on the kill and the clear. Each retry goes into the run log
   (sortie.retries, and RUNLOG in tester mode). The snapshot is dropped when you leave the result screen. */
let bossSnap=null;
function snapBoss(){ if(!sortie||!player||player.dead) return; const s=JSON.parse(JSON.stringify(runSnap(sortie.ri))); s.first=sortie.firstClear!=null?sortie.firstClear:(P.bestRoom[sortie.a]||0)<sortie.N; s.retries=sortie.retries||0; s.boss=room&&room.boss; bossSnap=s; }
const canRetryBoss=()=>!!(bossSnap&&sortie&&room&&room.type==='boss'&&bossSnap.a===sortie.a&&bossSnap.ri===sortie.ri);
function retryBoss(){
  const s=bossSnap; if(!s||!canRetryBoss()) return;
  P.gold=Math.max(0,P.gold-Math.max(0,sortie.gold-s.gold)); P.gems=Math.max(0,P.gems-Math.max(0,sortie.gems-s.gems));
  s.retries++; const log=(sortie.log||[]).concat([{room:s.ri+1,type:'boss',result:'retry',retry:s.retries,t:Math.round(playTime)}]);
  if(typeof RUNLOG!=='undefined'&&DEBUG) RUNLOG.rooms.push({arena:s.a+1,room:s.ri+1,type:'boss',result:'retry',retry:s.retries});
  launchArena(s.a,s,true); sortie.retries=s.retries; sortie.firstClear=s.first; sortie.log=log; sortie.force={type:'boss',boss:s.boss}; bossSnap=s;
}
function loadRun(){ try{ const s=localStorage.getItem(RUN_KEY); if(!s) return null; const r=JSON.parse(s); return r&&r.v===1&&ARENAS[r.a]&&arenaOpen(r.a)?r:null; }catch(e){ return null; } }
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
  if(!player||player.dead||state==='dying'||state==='result') return;
  // after Retry boss the first-clear state is the one from the boss room's entry (a death in the last room counts it as reached)
  const a=sortie.a, N=sortie.N, first=sortie.firstClear!=null?sortie.firstClear:(P.bestRoom[a]||0)<N;
  const bonus=first?ECON.firstClear(a):Math.round(ECON.repeatClear(a)*sortie.farm); P.gems+=bonus; sortie.gems+=bonus; logEarn('gems','clear',bonus); logRoomEnd('complete');
  // the Main Stage (opened by its access code) unlocks nothing after it
  P.bestRoom[a]=N; if(!ARENAS[a].stage) P.arenas=Math.max(P.arenas,Math.min(ARENAS.length,a+2)); P.clears++;
  clearRun(); persist(); showResult(true,bonus,first);
}
