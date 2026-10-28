// Seraph Breaker · debug.js: Debug tools, only active with ?debug=1 (add &mobile=1 to force mobile mode on desktop): panel, run log overlay (L) with JSON export, and DBG.sim() balance simulation.
/* ================= DEBUG ================= */
// tester tools: only with a valid tester code (tester.js), then via ?debug=1 or the System toggle. Everything here flags the run and the save.
const QS=new URLSearchParams(location.search), DEBUG=testerOK()&&(QS.get('debug')==='1'||P.testerTools);
if(DEBUG){ P.testerSave=true; persist(); }
const flagRun=()=>{ if(sortie) sortie.tester=true; P.testerSave=true; };
let godMode=false;
const DBG={
  turbo:1,noRender:false, // fast-forward for headless measurement runs (main.js frame)
  layout:null, // ROOMS index to force for the next rooms (testing a layout)
  god(on=!godMode){ godMode=on; toast(godMode?'God mode on':'God mode off'); return godMode; },
  killAll(){ for(let k=0;k<5;k++) enemies.slice().forEach(e=>{ if(!e.dead&&e!==boss) killEnemy(e); }); spawnQ=[]; },
  skipCard(){ if(state==='card'){ stateT=0; } if(state==='warn'){ stateT=0; } if(state==='cine') endCine(); },
  spawn(type,elite=false){ if(!player) return; const p=freeSpot(3); return !!spawnEnemy(type,p,elite); },
  start(a=0){ launchArena(a); setTimeout(()=>DBG.skipCard(),50); },
  next(){ if(state!=='fight'||!room) return;
    if(boss&&!boss.dead){ boss.atk='idle'; killEnemy(boss); return; }
    DBG.killAll(); roomCleared(); room.doorPending=false; openDoor(); goNextRoom(); },
  // tester: start arena a (0-based) at room n
  go(a,n=1){ launchArena(clamp(a|0,0,ARENAS.length-1)); setTimeout(()=>{ DBG.skipCard(); if(n>1) setTimeout(()=>DBG.jump(n),400); },60); },
  // jump to room n (1-based) of the current arena
  jump(n,force){ if(!sortie||!player) return; n=clamp(n|0,1,sortie.N); clearEnemiesAndShots(); hideOverlays(); $('result').hidden=true; paused=false; sortie.ri=n-2; sortie.force=force||null; sortie.swapped=false; setState('trans',true); stateT=.3; $('fade').classList.add('on'); },
  boss(kind){ if(!sortie) return; DBG.jump(sortie.ri+2>sortie.N?sortie.N:sortie.ri+2,{type:'boss',boss:kind}); },
  skill(id){ if(player&&RSK[id]) applySkill(id); },
  item(id){ if(player&&ITEMS[id]) takeItem(id); },
  drop(id){ if(player) dropItem(player.pos.clone().add(new V3(0,0,-2.5)),id); },
  mode(){ P.ctrl=mobileMode?'desktop':'mobile'; persist(); setMode(); },
  gold(n=5000){ P.gold+=n; persist(); renderMenu&&renderMenu(); },
  state(){ return {state,room:room&&room.type,ri:sortie&&sortie.ri,a:sortie&&sortie.a,lv:sortie&&sortie.lv,boss:boss&&boss.kind,enemies:enemies.length,hp:player&&Math.round(player.hp),mobile:mobileMode,rs:player&&player.rs}; },
  // run log of this session (one entry per room) and the numeric room-schedule simulation
  log(){ return runLogJson(); },
  sim(o){ return simulate(o); },
  bot(on=!BOT.on){ BOT.on=on; toast(on?'Autopilot on':'Autopilot off'); return on; },
  measure(o){ return measureRun(o); },
  immortal:false,
  // Main Stage: start it at room n · jump to wave n of the current wave room · force the BPM (0 = back to the music's own) · the wave/room curve
  stage(n=1){ DBG.go(ARENAS.findIndex(A=>A.stage),n); },
  wave(n){ if(!room||!room.stage||state!=='fight') return false; const W=composeStage(sortie.ri), S=room.stage; n=clamp(n|0,1,W.length);
    for(const e of enemies.slice()) if(!e.dead&&e!==boss){ e.noLoot=true; killEnemy(e,true); } S.n=W.length; S.w=n-1; S.breath=null; room.timer=null; room.waveF=S.w/S.n; spawnQ=W.slice(n); spawnWave(W[n-1],'gate'); refreshControls(); return true; },
  // High-Co: jump to form n (its entrance plays) · set the current form's armor to a share f (0..1)
  hcForm(n){ if(!boss||!boss.formN||boss.dead) return false; n=clamp(n|0,1,3); while(boss.formN<n) highcoFormDown(boss); return boss.formN; },
  hcRegen(on=!HC_REGEN_ON){ HC_REGEN_ON=!!on; toast(on?'High-Co regen on':'High-Co regen off'); return HC_REGEN_ON; },
  // High-Co music: play form track slot i (0-2); with src (and bpm) it fills the slot for this page load first, e.g. DBG.hcTrack(1,'assets/audio/highco-2.mp3',140)
  hcTrack(i=0,src,bpm){ const T=(BOSSES.highco.tracks||[])[i|0]; if(!T) return false; if(src!=null){ T.src=String(src); T.bpm=+bpm||0; } hcMusic(i|0); return {slot:i|0,src:T.src,bpm:T.bpm}; },
  // the pilot goes down where he stands (result screen, Retry boss)
  die(){ if(!player||player.dead) return false; godMode=false; DBG.immortal=false; player.inv=0; player.lives=0; player.secondUsed=true; player.hp=0; zeroHp(); return true; },
  hcSim(o){ return hcSim(o); },
  // Main Stage tester: one mob alone (the wave and everything else on the mat goes, no loot), so its attack can be checked by itself
  solo(type,elite=false){ if(!player||!ENEMY[type]) return false; for(const e of enemies.slice()) if(!e.dead&&e!==boss){ e.noLoot=true; killEnemy(e,true); } spawnQ=[];
    return !!spawnEnemy(type,ENEMY[type].seat?seatSpot():freeSpot(3),elite,{noDrop:true}); },
  // tester: set the pilot level (capped like the run; the levels gained queue their cards) · level, xp and armor lost per room as a live overlay (O)
  level(n){ if(!sortie) return false; const c=lvCap(sortie.a), to=clamp(n|0,1,c||99); if(to>sortie.lv) sortie.pendingLv+=to-sortie.lv; sortie.lv=to; sortie.xp=0; return sortie.lv; },
  overlay(on=!DBG.ov){ DBG.ov=on; let el=$('dbgOv'); if(!el){ el=document.createElement('pre'); el.id='dbgOv'; el.style.cssText='position:fixed;left:8px;bottom:8px;z-index:60;margin:0;padding:6px 8px;background:#000a;color:#ffd36a;font:11px/1.35 monospace;pointer-events:none;white-space:pre'; document.body.appendChild(el); }
    el.hidden=!on; if(!DBG.ovT) DBG.ovT=setInterval(ovTick,250); return on; },
  hcHp(f){ if(!boss||!boss.formN||boss.dead||boss.immune) return false; boss.hp=Math.max(1,boss.maxHp*clamp(+f,0,1)); return Math.round(boss.hp); },
  bpm(n=0){ BEAT.force=Math.max(0,+n||0); if(!BEAT.force) AU.tempoK=1; toast(BEAT.force?`BPM ${BEAT.force}`:'BPM: music'); return BEAT.force; },
  stageCurve(print=true){ const a=ARENAS.findIndex(A=>A.stage), rows=[]; for(let ri=0;ri<STAGE.waves.length;ri++){ const W=composeStage(ri,false), sc=enemyScale(a,ri,null,0), sc1=enemyScale(a,ri,null,(W.length-1)/W.length);
      rows.push({room:ri+1,waves:W.length,enemies:W.map(w=>w.length).join(' '),total:W.flat().length,budget:W.map((w,i)=>r2(STAGE.budget.base+STAGE.budget.room*ri+STAGE.budget.wave*i)).join(' '),hp:`${r2(sc.hp)}→${r2(sc1.hp)}`,dmg:`${r2(sc.dmg)}→${r2(sc1.dmg)}`,mix:W.map(w=>w.some(t=>t.startsWith('mosher'))?'M':w.filter(t=>STAGE.band.includes(t.replace('*',''))).length>=4?'E':'S').join('')}); }
    if(print) console.table(rows); return rows; },
};
window.DBG=DBG;
// live overlay rows (DBG.overlay): one per room of this run, armor lost as a share of max armor, level and xp when the room ended
const OV={rows:[],key:null,t0:0,lv0:1};
function ovTick(){ const el=$('dbgOv'); if(!el||el.hidden||!sortie||!player) return; const key=sortie.a+':'+sortie.ri, taken=sortie.dmgTaken||0;
  if(key!==OV.key){ if(OV.key&&OV.cur) OV.rows.push(OV.cur); if(OV.rows.length>16) OV.rows.shift(); OV.key=key; OV.t0=taken; OV.lv0=sortie.lv; }
  OV.cur={room:sortie.ri+1,lost:Math.round((taken-OV.t0)/player.maxHp*100),lv:sortie.lv,lvUp:sortie.lv-OV.lv0};
  const cap=atCap(), xp=cap?'MAX LVL':`LV ${sortie.lv} · xp ${sortie.xp.toFixed(1)}/${xpNeed().toFixed(1)}`;
  el.textContent=`${xp}${sortie.pendingLv?' · '+sortie.pendingLv+' queued':''} · armor ${Math.round(player.hp)}/${player.maxHp}\nroom  lost%  lv(+)\n`+OV.rows.concat([OV.cur]).map(r=>`${String(r.room).padStart(4)}  ${String(r.lost).padStart(5)}  ${r.lv}(+${r.lvUp})`).join('\n'); }
const r2=v=>Math.round(v*100)/100;

/* ================= RUN LOG ================= */
// debug mode only: per room time, damage taken/dealt, kills, gold and diamonds by source, power estimate and enemy scale
const RUNLOG={rooms:[],cur:null};
function logRoomStart(type){ if(!DEBUG||!sortie) return; RUNLOG.cur={a:sortie.a,room:sortie.ri+1,type,deaths:0,t0:playTime,taken0:sortie.dmgTaken||0,dealt0:sortie.dmgDealt||0,kills0:kills,earn0:Object.assign({},sortie.earn||{})}; }
// 'clear' only stamps the clear time; the entry closes when you leave the room (exit), die or finish the arena, so pickups collected after the clear still count
function logRoomEnd(result){
  if(!DEBUG||!RUNLOG.cur||!sortie) return; const c=RUNLOG.cur;
  if(result==='clear'){ if(c.clearT==null) c.clearT=playTime-c.t0; return; }
  RUNLOG.cur=null; if(c.clearT!=null&&result!=='death') result='clear';
  const e=sortie.earn||{}, gold={}, gems={};
  for(const k in e){ const d=Math.round(e[k]-(c.earn0[k]||0)); if(!d) continue; const [cur,src]=k.split(':'); (cur==='gold'?gold:gems)[src]=d; }
  const pw=playerPower(), sc=enemyScale(sortie.a,sortie.ri,sortie.rule);
  RUNLOG.rooms.push({arena:c.a+1,room:c.room,type:c.type,result,deaths:c.deaths,time:r2(c.clearT!=null?c.clearT:playTime-c.t0),dmgTaken:Math.round((sortie.dmgTaken||0)-c.taken0),dmgDealt:Math.round((sortie.dmgDealt||0)-c.dealt0),kills:kills-c.kills0,
    gold,gems,lv:sortie.lv,power:{dps:r2(pw.dps),ehp:r2(pw.ehp),total:r2(pw.power)},enemy:{hp:r2(sc.hp),dmg:r2(sc.dmg),boss:r2(sc.boss)}});
  renderRunLog();
}
function runLogJson(){ return JSON.stringify({build:BUILD,tester:true,unit:P.unit,weapon:P.weapon,core:P.core,tree:P.skills,arena:sortie&&sortie.a+1,earnTotal:sortie&&sortie.earn,rooms:RUNLOG.rooms},null,1); }
const sumObj=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
function renderRunLog(){
  const el=$('dbgLog'); if(!el||el.hidden) return;
  const live=$('dbgLive'); if(live){ const c=RUNLOG.cur, pw=playerPower(), sc=sortie?enemyScale(sortie.a,sortie.ri,sortie.rule):{hp:1,dmg:1};
    live.textContent=c&&sortie?`R${c.room} ${c.type} · ${(playTime-c.t0).toFixed(1)}s · taken ${Math.round(sortie.dmgTaken-c.taken0)} · dealt ${Math.round(sortie.dmgDealt-c.dealt0)} · kills ${kills-c.kills0}\n`+
      `power dps ×${pw.dps.toFixed(2)} ehp ×${pw.ehp.toFixed(2)} · enemy hp ×${sc.hp.toFixed(2)} dmg ×${sc.dmg.toFixed(2)} · lv ${sortie.lv}`:'no room running'; }
  const sm=$('dbgSum'); if(sm) sm.textContent=summarizeLog(RUNLOG.rooms).map(A=>`arena ${A.arena}: no-damage ${Math.round(A.noDamageShare*100)}% of ${A.combatRooms} combat rooms · avg ${A.avgDmgPerCombat} dmg · ${A.avgRoomTime}s/room · ${A.goldPerMin} gold/min`).join('\n')||'';
  const t=$('dbgRows'); if(!t) return;
  t.textContent=RUNLOG.rooms.slice(-8).map(r=>`${String(r.room).padStart(2)} ${r.type.padEnd(6)} ${String(r.time).padStart(5)}s -${String(r.dmgTaken).padStart(4)} +${String(r.dmgDealt).padStart(5)} k${String(r.kills).padStart(2)} g${String(sumObj(r.gold)).padStart(4)} d${sumObj(r.gems)} P${r.power?r.power.total:'-'} E${r.enemy?r.enemy.hp:'-'}/${r.enemy.dmg}`).join('\n')||'(no rooms yet)';
}
// copy the log: clipboard first, a selectable textarea as fallback
function exportRunLog(text){
  const box=$('dbgExport'), ta=$('dbgExportTxt'); ta.value=text||runLogJson(); box.hidden=false; ta.focus(); ta.select();
  const done=ok=>{ $('dbgCopyMsg').textContent=ok?'Copied to clipboard':'Select the text and copy it (Ctrl+C / long press)'; };
  const legacy=()=>{ try{ return document.execCommand('copy'); }catch(e){ return false; } };
  if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(ta.value).then(()=>done(true),()=>done(legacy())); else done(legacy());
}

/* ================= SIMULATION ================= */
/* runs an arena's room schedule numerically (no rendering): rooms, xp and level-ups, skill offers, items and the economy.
   Builds differ only in how they pick: weak takes the option with the smallest power gain, average picks at random, strong the biggest gain.
   Prints power vs the enemy curve per room. enemy = sqrt(armor × damage scale) × crowd size; pressure = enemy / player power
   (1 = room 1 with a fresh pilot). meta: 'fresh' | 'mid' | 'max' Core + tree, or {skills,core}. Devils and curses are left out. */
const SIM_META={
  fresh:{skills:{},core:{armor:0,dmg:0,regen:0}},
  mid:{skills:{dmg:2,rate:1,crit:1,hp:2,repair:1,plate:1,spd:1,regen:1,magnet:1},core:{armor:6,dmg:6,regen:4}},
  max:{skills:Object.fromEntries(TREE.flatMap(b=>b.nodes.map(n=>[n.id,n.max]))),core:{armor:15,dmg:15,regen:10}},
};
function simulate(o={}){
  const a=o.arena!=null?o.arena:(sortie?sortie.a:0), A=ARENAS[a], N=A.rooms, trials=o.trials||40, meta=typeof o.meta==='object'?o.meta:SIM_META[o.meta||'mid'], uk=o.unit||'azure';
  const builds=o.builds||['weak','average','strong'], rule=Object.assign({},A.rule), base0=roomBudget(a,0,false);
  const m=metaStats(meta,uk), out={arena:a+1,meta:typeof o.meta==='string'?o.meta:'mid',rooms:[],econ:{}};
  const avgBoss=k=>{ const pool=arenaBossPool(a); return pool.reduce((s,b)=>s+BOSSES[b][k],0)/pool.length; };
  for(const bd of builds){
    const acc=[]; let goldT=0,gemT=0; const src={kill:0,boss:0,clear:0,gemKill:0,gemBoss:0,gemClear:0};
    for(let t=0;t<trials;t++){
      const ctx={rs:{},luck:0,items:[]}; let xp=0,lv=1;
      const statsOf=c=>deriveStats(m,sumBonus(c.rs,c.items,[],{}));
      const est=c=>powerEstimate(statsOf(c),c.rs,{unit:uk,critMul:c.items.includes('scope')?2.5:2,aegis:c.items.includes('aegis')});
      const pick=ids=>{ if(!ids.length) return; let id;
        if(bd==='average') id=pickOne(ids);
        else { let bv=bd==='strong'?-1e9:1e9; for(const k of ids){ ctx.rs[k]=(ctx.rs[k]||0)+1; const v=est(ctx).power; ctx.rs[k]--; if(!ctx.rs[k]) delete ctx.rs[k]; if(bd==='strong'?v>bv:v<bv){ bv=v; id=k; } } }
        ctx.rs[id]=(ctx.rs[id]||0)+1; };
      const item=()=>{ if(ctx.items.length>=ITEM_SLOTS) return; const ids=Object.keys(ITEMS).filter(i=>!ctx.items.includes(i)); ctx.items.push(pickOne(ids)); ctx.luck=ctx.items.includes('lucky')?1:0; };
      const cap=lvCap(a), gain=v=>{ if(cap&&lv>=cap) return; xp+=v; while(xp>=xpNeedAt(lv)){ xp-=xpNeedAt(lv); lv++; pick(skillOptions(3,null,ctx)); if(cap&&lv>=cap) break; } };
      const plan=arenaPlan(a,(Math.random()*2e9)|0);
      for(let ri=0;ri<N;ri++){
        const spec=plan[ri], type=spec.type, sc=enemyScale(a,ri,rule); let count=0,g=0,gm=0;
        if(type==='combat'||type==='elite'){
          const list=(spec.kind==='stage'?composeStage(ri,false):composeRoom(spec,a,ri,rule,11)).flat(), K=ROOM_KINDS.survive;
          // Survive: about one extra spawn every 1.3 s, paying K.reward of a normal kill
          if(spec.kind==='survive') for(let i=0;i<Math.round(K.time/1.3);i++) list.push(pickOne(arenaPool(a,ri))+'~');
          for(const t0 of list){ const W=waveType(t0), tg=W.tg, el=W.elite, k=W.k, d=ENEMY[k], fam=(k==='shardling'?1+6*SPLIT_REWARD:1)*(tg==='~'?K.reward:1), mul=el?3:1;
            count++; g+=d.gold*ECON.killGold[a]*mul*fam; gm+=(el?ECON.gemChance.elite:d.cost>=2.5?ECON.gemChance.big:ECON.gemChance.small)*fam;
            gain(d.xp*mul*(1+a*.12)*fam); if(el&&Math.random()<.25) item(); }
          src.kill+=g; src.gemKill+=gm; g+=ECON.clearGold[a]; src.clear+=ECON.clearGold[a];
        } else if(type==='boss'){ count=1; g=avgBoss('gold')*ECON.bossGold[a]; gm=Math.round(avgBoss('gems')*ECON.bossGems[a]); src.boss+=g; src.gemBoss+=gm; gain(XP_BOSS); item(); }
        else pick(skillOptions(2,null,ctx));
        if(ri===N-1){ gm+=ECON.repeatClear(a); src.gemClear+=ECON.repeatClear(a); }
        goldT+=g; gemT+=gm;
        // mob strength at this room index (combat room curve × crowd) and the boss strength, whatever the room type
        // Main Stage: the crowd is the room's wave budget against Arena 1's room budget, and the curve is taken at the room's middle wave
        const scm=A.stage?enemyScale(a,ri,rule,.5):sc, crowd=A.stage&&ri<STAGE.waves.length?(STAGE.budget.base+STAGE.budget.room*ri+STAGE.budget.wave*(STAGE.waves[ri]-1)/2)/base0:roomBudget(a,ri,false)/base0;
        const pw=est(ctx), enemy=Math.sqrt(scm.hp*scm.dmg)*Math.sqrt(crowd), bossE=Math.sqrt(sc.boss*sc.bossDmg);
        const r=acc[ri]||(acc[ri]={room:ri+1,type,lv:0,dps:0,ehp:0,power:0,enemyHp:sc.hp,enemyDmg:sc.dmg,enemy,boss:bossE,pressure:0,bossPressure:0,count:0});
        r.lv+=lv/trials; r.dps+=pw.dps/trials; r.ehp+=pw.ehp/trials; r.power+=pw.power/trials; r.pressure+=enemy/pw.power/trials; r.bossPressure+=bossE/pw.power/trials; r.count+=count/trials;
      }
    }
    acc.forEach(r=>{ for(const k in r) if(typeof r[k]==='number') r[k]=r2(r[k]); r.build=bd; out.rooms.push(r); });
    out.econ[bd]={gold:Math.round(goldT/trials),gems:Math.round(gemT/trials),goldBy:{kill:Math.round(src.kill/trials),boss:Math.round(src.boss/trials),clear:Math.round(src.clear/trials)},gemsBy:{kill:r2(src.gemKill/trials),boss:r2(src.gemBoss/trials),clear:r2(src.gemClear/trials)},target:{gold:ECON.target.gold[a],gems:ECON.target.gems[a]}};
  }
  const pts=(A.stage?[1,4,8,12,15,16]:[1,10,20,30,40,50]).filter(n=>n<=N);
  out.table=pts.map(n=>{ const r0=out.rooms.find(x=>x.room===n), row={room:n,'enemy mob':r0.enemy,'enemy boss':n%10&&!(A.stage&&n===N)?'':r0.boss};
    builds.forEach(bd=>{ const r=out.rooms.find(x=>x.build===bd&&x.room===n); row[bd+' lv']=r.lv; row[bd+' power']=r.power; row[bd+' mob pressure']=r.pressure; if(!(n%10)||A.stage&&n===N) row[bd+' boss pressure']=r.bossPressure; }); return row; });
  if(o.print!==false){ console.log(`Seraph Breaker sim · arena ${a+1} (${A.name}) · meta ${out.meta} · ${trials} trials`); console.table(out.table); console.table(out.econ); }
  return out;
}
/* High-Co crowd regen check: fight length per form for a pilot who deals dps (share of the form's armor per second) all the time, with every
   crowd channel he can start (as soon as it is off cooldown, no attack in between: the worst case). Damage during a channel cuts streams
   (regen.cut each). The stagger bonus is left out. healed never passes regen.cap, so a form never takes more than (1 + cap) × its armor. */
function hcSim(o={}){
  const D=BOSSES.highco, R=D.regen, rows=[], dt=.05;
  for(const dps of o.dps||[.01,.015,.02,.03,.05]) for(let f=0;f<3;f++){
    const F=D.forms[f]; let hp=1,t=0,healed=0,cd=R.cd[f]*.6,ch=null,cuts=0,chans=0;
    while(hp>0&&t<900){ t+=dt; hp-=dps*dt; if(!F.regen) continue;
      if(!ch){ cd-=dt; if(cd<=0&&R.cap-healed>.02&&hp<.92){ ch={t:0,live:R.streams,acc:0}; cd=R.cd[f]; chans++; } continue; }
      ch.t+=dt; if(ch.t>=R.tele){ ch.acc+=dps*dt; while(ch.acc>=R.cut&&ch.live>0){ ch.acc-=R.cut; ch.live--; cuts++; }
        const h=Math.max(0,Math.min(R.rate*ch.live*dt,R.cap-healed,1-hp)); hp+=h; healed+=h; }
      if(ch.t>=R.tele+R.dur||!ch.live) ch=null; }
    rows.push({'dps %/s':r2(dps*100),form:f+1,'time s':r2(t),'no-regen s':r2(1/dps),'healed %':r2(healed*100),channels:chans,'streams cut':cuts,'cap holds':healed<=R.cap+1e-9,won:hp<=0}); }
  // strength against the old single-bar High-Co (armor 1, damage 1): armor to remove with the healing above, damage weighted by fight time,
  // and their geometric mean, the factor on DBG.sim()'s boss pressure
  const sum=[]; for(const dps of o.dps||[.01,.015,.02,.03,.05]){ const rs=rows.filter(r=>r['dps %/s']===r2(dps*100)); let arm=0,dm=0,tt=0;
    rs.forEach((r,i)=>{ const F=D.forms[i]; arm+=F.hp*(1+r['healed %']/100); dm+=F.dmg*F.hp*r['time s']; tt+=F.hp*r['time s']; });
    sum.push({'dps %/s':r2(dps*100),armor:r2(arm),damage:r2(dm/tt),pressure:r2(Math.sqrt(arm*dm/tt))}); }
  if(o.print!==false){ console.table(rows); console.table(sum); } return {rows,sum};
}
/* ================= AUTOPILOT + MEASUREMENT ================= */
/* a scripted "average player" for headless measurement runs: keeps 6-10 units from the nearest enemy and circles it, sidesteps shots on a
   collision course (dashes when one is about to land), steps out of telegraphed rings (slams, shells, blasts, Spark fuses, mines, traps),
   fires at the nearest visible enemy without leading, uses the special when ready and picks skill cards at random.
   Like a person it only reacts react seconds after a shot or a telegraph appears, and reacts in time skill of the time. */
const BOT={on:false,mv:new V3(),fire:false,side:1,sideT:0,skill:.7,react:.3};
function botTick(dt){
  if(!BOT.on||!player||player.dead) return; const p=player, mv=BOT.mv.set(0,0,0); BOT.fire=false;
  if(state==='choice'){ if((!spin||spin.left<=0)&&chCfg&&performance.now()>ignoreClickUntil){ const n=chCfg.options.length; pickChoice((Math.random()*n)|0); } return; }
  if(state!=='fight') return;
  const add=(x,z,w)=>{ const l=Math.hypot(x,z)||1; mv.x+=x/l*w; mv.z+=z/l*w; };
  const tgtE=autoTarget()||nearestFoe(p.pos,40); let dashDir=null;
  // shots on a collision course: sidestep, dash when one is about to land (skill = how often the bot reacts in time)
  for(const b of bullets){ if(b.from!=='e'||b.air&&b.m.position.y>2.4||playTime-b.t0<BOT.react) continue; const rx=p.pos.x-b.m.position.x, rz=p.pos.z-b.m.position.z, vx=b.vel.x, vz=b.vel.z, vv=vx*vx+vz*vz; if(vv<1) continue;
    const t=(rx*vx+rz*vz)/vv; if(t<0||t>.8) continue; const mx=rx-vx*t, mz=rz-vz*t, miss=Math.hypot(mx,mz); if(miss>1.6) continue;
    const sx=miss>.05?mx:-vz, sz=miss>.05?mz:vx; add(sx,sz,(1.7-miss)*2.2*(1-t/.8)*BOT.skill); if(t<.2&&miss<1&&Math.random()<BOT.skill) dashDir=new V3(sx,0,sz).normalize(); }
  const flee=(x,z,r,w)=>{ const dx=p.pos.x-x, dz=p.pos.z-z, d=Math.hypot(dx,dz); if(d<r) add(dx||rand(-1,1),dz||rand(-1,1),w*(1-d/r)+.4); };
  for(const b of blasts) if(b.hurtP) flee(b.x,b.z,b.rad+1.4,3);
  for(const e of enemies){ if(e.dead) continue; if(e.shell&&e.shell.t<1.2-BOT.react) flee(e.shell.x,e.shell.z,3,3); if(e.atk===ATK.slam&&e.ph==='tele'&&e.phMax-e.phT>BOT.react) flee(e.pos.x,e.pos.z,e.def.slam+1.3,4); if(e.st==='blink') flee(e.pos.x,e.pos.z,3.4,4); if(e.ph==='charge'||e.st==='roll') flee(e.pos.x,e.pos.z,4,2); }
  // Main Stage telegraphs: the Bass Brute cone, the Drummer kick ring and sky drop markers, the Stage Diver landing ring, a burning follow spot
  if(ARENAS[stage]&&ARENAS[stage].stage){ for(const e of enemies){ if(e.dead) continue;
      if(e.type==='bass'&&e.ph==='tele'&&e.aim&&e.phMax-e.phT>BOT.react&&Math.random()<BOT.skill*1.5){ const dx=p.pos.x-e.pos.x, dz=p.pos.z-e.pos.z; if(Math.hypot(dx,dz)<e.def.cone[0]+1) add(-e.aim.z*Math.sign(dx*-e.aim.z+dz*e.aim.x||1),e.aim.x*Math.sign(dx*-e.aim.z+dz*e.aim.x||1),3); }
      if(e.type==='drummer'&&e.kickArm) flee(e.pos.x,e.pos.z,e.def.slam+1.3,3);
      if(e.type==='diver'&&e.st==='leap'&&e.leap&&e.leap.t>BOT.react) flee(e.leap.to.x,e.leap.to.z,4.4,3.5);
      if(e.type==='spot'&&e.sp&&spotLit) flee(e.sp.x,e.sp.z,e.def.spot[0]+1,2.5); }
    for(const M of stageMeteors) if(!M.done&&M.t>BOT.react) flee(M.x,M.z,M.R+1.2,3);
    // High-Co: dash through the Metal Scream (once per scream, skill of the time), step out of his slam ring, pillar marks and pole rings
    const b=boss; if(b&&!b.dead&&b.formN){ if(b.atk==='scream'){ if(b.atkT>.86&&b.atkT<.97&&BOT.scr!==b.t0s){ BOT.scr=b.t0s; if(Math.random()<BOT.skill) dashDir=new V3(p.pos.z-b.pos.z,0,b.pos.x-p.pos.x).normalize(); } } else b.t0s=playTime;
      if(b.atk==='hcslam'&&b.stomp&&b.atkT>BOT.react) flee(b.stomp.to.x,b.stomp.to.z,HC_SLAM_R+1.5,4);
      if(b.atk==='pillars'&&b.pq) for(const q of b.pq) if(!q.done) flee(q.x,q.z,2.6,3);
      if(b.poles) for(const P of b.poles) flee(P.x,P.z,HC_POLE_R+1,3);
      // his beam: once it stops tracking, step off its line; a sweeping beam is dashed through as it reaches you
      const bm=b.beam; if(bm&&(b.atk==='beam'||b.atk==='sweep')){ const rx=p.pos.x-b.pos.x, rz=p.pos.z-b.pos.z, side=Math.sign(rx*bm.dir.z-rz*bm.dir.x)||1;
        if(!bm.fire&&!bm.sweep&&bm.t>bm.tele*.7+BOT.react*.5) add(bm.dir.z*side,-bm.dir.x*side,4*BOT.skill+1);
        if(bm.fire&&bm.sweep){ const off=((Math.atan2(rx,rz)-Math.atan2(bm.dir.x,bm.dir.z))+Math.PI*3)%(Math.PI*2)-Math.PI; if(Math.sign(off)===Math.sign(bm.sweep)&&Math.abs(off)<.35&&Math.random()<BOT.skill*.25) dashDir=new V3(bm.dir.z*side,0,-bm.dir.x*side); } } } }
  for(const s of shocks){ if(s.hit||s.friendly) continue; const df=Math.hypot(p.pos.x-s.x,p.pos.z-s.z)-s.r; if(df>0&&df<1.6&&Math.random()<BOT.skill) dashDir=new V3(s.x-p.pos.x,0,s.z-p.pos.z).normalize(); else if(df>0&&df<s.max-s.r+1) flee(s.x,s.z,s.max+1.5,2.5); }
  for(const m of emines) flee(m.x,m.z,2.4,2);
  for(const t of traps){ if(room&&room.cleared||!trapDanger(t)) continue; /* traps are off once the room is clear (a stopped saw would pin the bot) */ if(t.kind==='saw') flee(t.x,t.z,t.r+1.7,3); else for(const c of t.cells) flee(c.x,c.z,t.cw*.75+.9,3); }
  for(const h of hazards) if(h.ph>=1||h.t<.3&&h.ph===0) flee(h.x,h.z,2.4,2.5);
  // spacing: circle the nearest enemy at 6-10 units, switch direction now and then
  BOT.sideT-=dt; if(BOT.sideT<=0){ BOT.sideT=rand(1.4,3); BOT.side=Math.random()<.5?-1:1; }
  const seen=autoTarget();
  if(tgtE&&!seen&&mv.lengthSq()<.3) botGo(tgtE.pos.x,tgtE.pos.z,add); // nothing in sight: walk around the blocks toward the nearest enemy
  else if(tgtE){ const dx=tgtE.pos.x-p.pos.x, dz=tgtE.pos.z-p.pos.z, d=Math.hypot(dx,dz)||1; if(d<5.5) add(-dx,-dz,1); else if(d>10) add(dx,dz,.8); add(-dz*BOT.side,dx*BOT.side,.55); }
  if(seen){ const dx=seen.pos.x-p.pos.x, dz=seen.pos.z-p.pos.z, d=Math.hypot(dx,dz)||1; p.aim.set(dx/d,0,dz/d); BOT.fire=true; }
  else if(door&&door.open) botGo(0,-AZ-1,add);
  else if(npc&&!npc.used&&npc.kind==='angel') botGo(npc.pos.x,npc.pos.z,add);
  // stuck on a block while circling: turn the other way
  if(tgtE&&p.vel.lengthSq()<2&&mv.lengthSq()>.2){ BOT.stuck=(BOT.stuck||0)+dt; if(BOT.stuck>.35){ BOT.stuck=0; BOT.side*=-1; BOT.sideT=rand(1,2); } } else BOT.stuck=0;
  // keep off the mat edge
  if(!(door&&door.open)){ if(p.pos.x>AX-2.2) add(-1,0,1.5); if(p.pos.x<-AX+2.2) add(1,0,1.5); if(p.pos.z>AZ-2.2) add(0,-1,1.5); if(p.pos.z<-AZ+2.2) add(0,1,1.5); }
  const l=mv.length(); if(l>1) mv.divideScalar(l); else if(l<.15) mv.set(0,0,0);
  if(dashDir) tryDash(dashDir);
  // the special: on a crowd of 3+, or whenever a boss is up (a boss alone would never see it)
  if(p.sp>=100&&(enemies.length>=3||boss&&!boss.dead)) trySpecial();
}
// walk to a point around blocks (A* on the nav grid, replanned twice a second)
function botGo(x,z,add){ const p=player; BOT.pT=(BOT.pT||0)-1/30;
  if(walkClear(p.pos.x,p.pos.z,clamp(x,-AX+.5,AX-.5),clamp(z,-AZ+.5,AZ-.5),.7)){ add(x-p.pos.x,z-p.pos.z,1); return; }
  if(!BOT.path||BOT.pT<=0){ BOT.pT=.5; BOT.path=navPath(p.pos.x,p.pos.z,clamp(x,-AX+.5,AX-.5),clamp(z,-AZ+.5,AZ-.5),.7); BOT.pi=0; }
  const P=BOT.path; if(!P||!P.length){ add(x-p.pos.x,z-p.pos.z,1); return; }
  while(BOT.pi<P.length-2&&(Math.hypot(P[BOT.pi]-p.pos.x,P[BOT.pi+1]-p.pos.z)<.6||walkClear(p.pos.x,p.pos.z,P[BOT.pi+2],P[BOT.pi+3],.7))) BOT.pi+=2;
  // a waypoint right under the bot (the path's last cell is the one it stands on) would leave it standing still: head for the target instead
  const wx=P[BOT.pi]-p.pos.x, wz=P[BOT.pi+1]-p.pos.z; if(Math.hypot(wx,wz)<.3){ BOT.path=null; add(x-p.pos.x,z-p.pos.z,1); } else add(wx,wz,1); }
// measurement run: the bot plays an arena with a given meta (Core + tree), fast-forwarded and without rendering. Damage is real, death is not:
// at zero armor the pilot is refilled and the room counts a death. Returns a per-arena summary (no-damage share, time per room, gold per minute).
async function measureRun(o={}){
  const a=o.arena||0, saveP=JSON.stringify(P), meta=typeof o.meta==='object'?o.meta:SIM_META[o.meta||'mid'];
  P.skills=JSON.parse(JSON.stringify(meta.skills)); P.core=Object.assign({armor:0,dmg:0,regen:0},meta.core); P.unit=o.unit||'azure'; P.weapon='sig'; P.gadgets=['',''];
  if(o.best!=null) P.arenas=Math.max(P.arenas,o.best+1);
  RUNLOG.rooms.length=0; DBG.immortal=true; BOT.on=true; P.testerSave=true; DBG.turbo=o.turbo||16; DBG.noRender=!o.render;
  launchArena(a); flagRun(); const rooms=o.rooms||ARENAS[a].rooms, t0=performance.now();
  await new Promise(res=>{ const iv=setInterval(()=>{ if(state==='card'||state==='warn') stateT=0; if(state==='cine') endCine();
    if(state==='result'||RUNLOG.rooms.length>=rooms||performance.now()-t0>(o.maxMs||600000)){ clearInterval(iv); res(); } },50); });
  BOT.on=false; DBG.immortal=false; DBG.turbo=1; DBG.noRender=false;
  const out=summarizeLog(RUNLOG.rooms); P=normP(JSON.parse(saveP)); persist(); toMenu('home'); return out;
}
/* ================= MAIN STAGE DIFFICULTY ================= */
/* Main Stage difficulty check (the Part 4 table of the balance PR). Profiles model a pilot by how often and how late the autopilot reacts to
   telegraphs (BOT.skill, BOT.react) and how it picks cards: average {skill:.7,react:.3, random cards}, skilled {skill:.92,react:.18, best card}.
   The game is stepped by hand (1/60 s ticks like a 60 Hz screen, no rendering). Max Core + tree by default. Measure at a desktop size (1280x800: tall phone rooms
   throw the autopilot off) and reload the page every ~8 runs: after that the autopilot starts to lose whole rooms (its state drifts). */
const STAGE_PRO={avg:{skill:.7,react:.3},pro:{skill:.92,react:.18,smart:true}};
function stepGame(sec){ paused=false; DBG.noRender=true; let t=performance.now(); for(let i=0;i<sec*60;i++){ t+=16.7;
    if(state==='card'||state==='warn') stateT=0; if(state==='cine') endCine(); if(state==='choice') botPick();
    // an error in a tick is kept (DBG.tickErr, with its stack) instead of ending the measurement
    try{ tick(1/60,t); }catch(e){ if(!DBG.tickErr) DBG.tickErr=e.stack; } }
  DBG.noRender=false; }
// a level-up card for the autopilot: at random, or (smart) the one with the biggest power gain
function botPick(){ if(state!=='choice'||!chCfg) return; if(spin) spin.left=0; ignoreClickUntil=0; const O=chCfg.options; let best=(Math.random()*O.length)|0;
  if(BOT.smart){ let bv=-1; O.forEach((o,i)=>{ if(!o.id||!RSK[o.id]) return; const rs=player.rs; rs[o.id]=(rs[o.id]||0)+1; const v=powerEstimate(deriveStats(metaStats(P,P.unit),sumBonus(rs,sortie.items,[],player.extra)),rs).power; rs[o.id]--; if(!rs[o.id]) delete rs[o.id]; if(v>bv){ bv=v; best=i; } }); }
  pickChoice(best); }
const pause0=()=>new Promise(r=>setTimeout(r,0));
async function withMeta(meta,fn){ const save=JSON.stringify(P), M=typeof meta==='object'?meta:SIM_META[meta||'max']; P.skills=JSON.parse(JSON.stringify(M.skills)); P.core=Object.assign({armor:0,dmg:0,regen:0},M.core); P.unit='azure'; P.weapon='sig';
  try{ return await fn(); } finally { BOT.on=false; DBG.immortal=false; BOT.smart=false; P=normP(JSON.parse(save)); persist(); } }
async function stageTo(n){ DBG.immortal=true; DBG.stage(n); for(let i=0;i<120&&!(state==='fight'&&sortie&&sortie.ri===n-1);i++){ await new Promise(r=>setTimeout(r,60)); DBG.skipCard(); stepGame(.3); } }
/* one autopilot run of rooms 1-15 (immortal: a death refills the pilot and counts). Per room: lost = armor taken (% of max), net = what is
   missing at the end + 100 per death (the heals in the room taken off), deaths, t = seconds, lv at the end. */
async function stageRun(o={}){ const pf=STAGE_PRO[o.profile||'avg']; return withMeta(o.meta,async()=>{ BOT.skill=pf.skill; BOT.react=pf.react; BOT.smart=!!pf.smart; await stageTo(1);
  BOT.on=true; godMode=false; RUNLOG.cur={deaths:0}; const rows=[]; let ri=sortie.ri, t0=playTime, tk0=sortie.dmgTaken||0, d0=0, hp0=player.hp;
  for(let g=0;g<6000;g++){ if(state==='result') break; stepGame(1); if(g%3===0) await pause0();
    // an autopilot stuck behind a block for 400 s: the room is cut
    if(state==='fight'&&playTime-t0>400&&!boss){ for(const e of enemies.slice()) if(!e.dead){ e.noLoot=true; killEnemy(e,true); } spawnQ=[]; }
    if(sortie.ri!==ri){ const dd=RUNLOG.cur.deaths-d0; rows.push({room:ri+1,lost:Math.round(((sortie.dmgTaken||0)-tk0)/player.maxHp*100),net:Math.round((hp0-player.hp)/player.maxHp*100+dd*100),deaths:dd,t:Math.round(playTime-t0),lv:sortie.lv});
      ri=sortie.ri; t0=playTime; tk0=sortie.dmgTaken||0; d0=RUNLOG.cur.deaths; hp0=player.hp; if(ri>14) break; } }
  return rows; }); }
// one High-Co fight at the level cap (29 cards, random or smart), from full armor, immortal: seconds per form, deaths, net armor needed (%)
async function hcFight(o={}){ const pf=STAGE_PRO[o.profile||'avg']; return withMeta(o.meta,async()=>{ BOT.skill=pf.skill; BOT.react=pf.react; BOT.smart=!!pf.smart; await stageTo(16);
  for(let i=0;i<STAGE.lvCap-1;i++){ const O=skillOptions(3); if(!O.length) break; let id=pickOne(O);
    if(pf.smart){ let bv=-1; for(const k of O){ player.rs[k]=(player.rs[k]||0)+1; const v=powerEstimate(deriveStats(metaStats(P,P.unit),sumBonus(player.rs,[],[],{})),player.rs).power; player.rs[k]--; if(!player.rs[k]) delete player.rs[k]; if(v>bv){ bv=v; id=k; } } }
    applySkill(id); }
  sortie.pendingLv=0; sortie.lv=STAGE.lvCap; recalcStats(); player.hp=player.maxHp; BOT.on=true; godMode=false; RUNLOG.cur={deaths:0};
  const forms=[]; let f=1,ft=0,t=0; while(t<(o.max||900)&&boss&&!boss.dead){ stepGame(5); t+=5; ft+=5; await pause0(); const nf=boss&&!boss.dead?boss.formN:4; if(nf!==f){ forms.push(ft); f=nf; ft=0; } }
  return {forms,deaths:RUNLOG.cur.deaths,net:Math.round(RUNLOG.cur.deaths*100+(1-player.hp/player.maxHp)*100)}; }); }
/* odds of whole attempts from measured runs: armor carries from room to room (net loss of a random measured run of that room, ±15%), one
   Second Wind at 30% (max tree), STAGE.bossRepair before High-Co, then a measured High-Co fight × hcK. hcK: the share of the autopilot's boss
   damage a human pilot of the profile takes (the autopilot does not use the amps or read the beam lock; the PR uses 0.5 for average).
   score = 10 × (1 - share of average attempts that beat High-Co): 7.5 = one attempt in four wins. */
function stageOdds(runs,fights,o={}){ const N=o.n||20000, k=o.hcK==null?1:o.hcK, pool=[]; for(let i=1;i<=15;i++) pool[i]=runs.map(r=>r.find(x=>x.room===i)).filter(Boolean).map(x=>x.net);
  const nets=fights.map(f=>f.net); let reach=0,win=0; const died=new Array(17).fill(0);
  for(let n=0;n<N;n++){ let hp=100,sw=true,dead=0; const hit=L=>{ hp-=L; if(hp<=0){ if(!sw) return true; sw=false; hp+=30; if(hp<=0) return true; } hp=Math.min(100,hp); return false; };
    for(let i=1;i<=15&&!dead;i++) if(pool[i].length&&hit(pickOne(pool[i])*rand(.85,1.15))) dead=i;
    if(dead){ died[dead]++; continue; } reach++; hp=Math.min(100,hp+STAGE.bossRepair*100); if(nets.length&&hit(pickOne(nets)*k*rand(.85,1.15))) died[16]++; else win++; }
  const pc=v=>Math.round(v/N*1000)/10;
  return {reach:pc(reach),win:pc(win),score:Math.round(10*(1-win/N)*10)/10,deathByRoom:died.map((d,i)=>i?pc(d):null).slice(1)}; }
Object.assign(DBG,{stageRun,hcFight,stageOdds,
  // n autopilot runs per profile (and fights), then the per-room table and the odds; e.g. await DBG.stageCheck({runs:8,fights:6})
  async stageCheck(o={}){ const out={}; for(const pf of o.profiles||['avg','pro']){ const runs=[], fights=[]; for(let i=0;i<(o.runs||6);i++) runs.push(await stageRun({profile:pf,meta:o.meta}));
      for(let i=0;i<(o.fights||4);i++) fights.push(await hcFight({profile:pf,meta:o.meta}));
      const rows=[]; for(let r=1;r<=15;r++){ const rs=runs.map(x=>x.find(y=>y.room===r)).filter(Boolean), av=key=>r2(rs.reduce((a,b)=>a+b[key],0)/Math.max(1,rs.length)); rows.push({room:r,lost:av('lost'),net:av('net'),deaths:av('deaths'),t:av('t'),lv:av('lv')}); }
      out[pf]={rows,runs,fights,odds:stageOdds(runs,fights,{hcK:pf==='avg'?.5:1})}; if(o.print!==false){ console.log('Main Stage · '+pf); console.table(rows); console.log(out[pf].odds); } }
    return out; }});
// per-arena summary of the run log: share of combat rooms cleared without damage, damage and time per room, gold per minute
function summarizeLog(rows){ const by={};
  for(const r of rows){ const A=by[r.arena]||(by[r.arena]={arena:r.arena,rooms:0,combat:0,noDmg:0,time:0,gold:0,deaths:0,dmg:0,bossT:0,bosses:0});
    A.rooms++; A.time+=r.time; A.gold+=sumObj(r.gold); A.deaths+=r.deaths||0;
    if(r.type==='boss'){ A.bosses++; A.bossT+=r.time; } else if(r.type!=='angel'){ A.combat++; A.dmg+=r.dmgTaken; if(r.dmgTaken<=0) A.noDmg++; } }
  return Object.values(by).map(A=>({arena:A.arena,rooms:A.rooms,combatRooms:A.combat,noDamageShare:r2(A.noDmg/Math.max(1,A.combat)),avgDmgPerCombat:Math.round(A.dmg/Math.max(1,A.combat)),avgRoomTime:r2(A.time/Math.max(1,A.rooms)),avgBossTime:r2(A.bossT/Math.max(1,A.bosses)),goldPerMin:Math.round(A.gold/Math.max(.01,A.time/60)),deaths:A.deaths}));
}
function initDebug(){
  if(!DEBUG) return;
  const d=document.createElement('div'); d.id='dbg';
  d.innerHTML=`<b>DEBUG</b><button data-a="next">Next room</button><button data-a="kill">Kill all</button><button data-a="god">God</button><button data-a="gold">+5000 gold</button>
  <label>Room <input id="dbgRoom" type="number" min="1" max="50" value="10"><button data-a="jump">Go</button></label>
  <label>Skill <select id="dbgSkill"></select><button data-a="skill">Grant</button></label>
  <label>Item <select id="dbgItem"></select><button data-a="item">Grant</button></label>
  <label>Enemy <select id="dbgEnemy"></select><button data-a="spawn">Spawn</button><button data-a="spawnE">Elite</button></label>
  <label>Boss <select id="dbgBoss"></select><button data-a="boss">Spawn</button></label>
  <label>Arena <select id="dbgArena" class="w"></select> room <input id="dbgARoom" class="w" type="number" min="1" max="50" value="1"><button data-a="go">Start</button></label>
  <label>Stage room <input id="dbgSRoom" class="w" type="number" min="1" max="16" value="1"><button data-a="stage">Go</button> wave <input id="dbgWave" class="w" type="number" min="1" max="7" value="1"><button data-a="wave">Go</button></label>
  <label>BPM <input id="dbgBpm" class="w" type="number" min="0" max="300" value="0"><button data-a="bpm">Set</button> High-Co form <input id="dbgHc" class="w" type="number" min="1" max="3" value="2"><button data-a="hc">Go</button> HP <input id="dbgHcHp" class="w" type="number" min="0" max="100" value="10">%<button data-a="hchp">Set</button> <button data-a="hcregen">Regen on/off</button> Track <input id="dbgHcT" class="w" type="number" min="1" max="3" value="1"><button data-a="hctrack">Play</button> <button data-a="die">Die</button></label>
  <label>Core A/D/R <input id="dbgCA" class="w" type="number" min="0" max="30"><input id="dbgCD" class="w" type="number" min="0" max="30"><input id="dbgCR" class="w" type="number" min="0" max="30"><button data-a="core">Set</button></label>
  <button data-a="treeMax">Tree max</button><button data-a="treeClr">Tree clear</button><button data-a="gems">+500 gems</button>
  <button data-a="mode">Toggle mobile</button><button data-a="log">Run log (L)</button><button data-a="sim">Sim</button><button data-a="measure">Measure arena</button><button data-a="hide">Hide</button>`;
  document.body.appendChild(d);
  // live overlay (toggle: L) and the export box
  const lg=document.createElement('div'); lg.id='dbgLog'; lg.hidden=true;
  lg.innerHTML=`<div class="h"><b>RUN LOG</b><button data-l="export">Export JSON</button><button data-l="sim">Sim arena</button><button data-l="close">✕</button></div><pre id="dbgLive"></pre><pre id="dbgSum"></pre><pre id="dbgRows"></pre>`;
  document.body.appendChild(lg);
  const ex=document.createElement('div'); ex.id='dbgExport'; ex.hidden=true;
  ex.innerHTML=`<div class="h"><b>EXPORT</b><span id="dbgCopyMsg"></span><button data-l="copy">Copy</button><button data-l="xclose">✕</button></div><textarea id="dbgExportTxt" readonly spellcheck="false"></textarea>`;
  document.body.appendChild(ex);
  const toggleLog=()=>{ lg.hidden=!lg.hidden; renderRunLog(); };
  const simText=()=>{ const r=simulate(); const head=Object.keys(r.table[0]); return `Sim arena ${r.arena} · meta ${r.meta}\n`+head.join('\t')+'\n'+r.table.map(x=>head.map(h=>x[h]).join('\t')).join('\n')+'\n\n'+JSON.stringify(r.econ,null,1); };
  [lg,ex].forEach(el=>{ el.addEventListener('pointerdown',e=>e.stopPropagation()); el.addEventListener('click',e=>{ const a=e.target.dataset&&e.target.dataset.l; if(!a) return;
    if(a==='close') toggleLog(); if(a==='export') exportRunLog(); if(a==='sim') exportRunLog(simText()); if(a==='xclose') ex.hidden=true; if(a==='copy') exportRunLog($('dbgExportTxt').value); }); });
  setInterval(()=>{ if(!lg.hidden) renderRunLog(); },250);
  const fill=(id,obj)=>{ const s=$(id); if(!s||!obj) return; s.innerHTML=Object.keys(obj).map(k=>`<option>${k}</option>`).join(''); };
  $('dbgArena').innerHTML=ARENAS.map((A,i)=>`<option value="${i}">${i+1} ${A.name}</option>`).join(''); ['A','D','R'].forEach((k,i)=>$('dbgC'+k).value=P.core[['armor','dmg','regen'][i]]);
  fill('dbgSkill',typeof RSK!=='undefined'?RSK:null); fill('dbgItem',typeof ITEMS!=='undefined'?ITEMS:null); fill('dbgEnemy',typeof ENEMY!=='undefined'?ENEMY:{drone:1,seraph:1,heavy:1,warden:1}); fill('dbgBoss',BOSSES);
  d.addEventListener('pointerdown',e=>e.stopPropagation());
  d.addEventListener('click',e=>{ const a=e.target.dataset&&e.target.dataset.a; if(!a) return; const v=id=>$(id).value; if(a!=='hide'&&a!=='log') flagRun();
    if(a==='go') DBG.go(+v('dbgArena'),+v('dbgARoom'));
    if(a==='stage') DBG.stage(+v('dbgSRoom')); if(a==='wave') DBG.wave(+v('dbgWave')); if(a==='bpm') DBG.bpm(+v('dbgBpm')); if(a==='hc') DBG.hcForm(+v('dbgHc')); if(a==='hchp') DBG.hcHp(+v('dbgHcHp')/100); if(a==='hcregen') DBG.hcRegen(); if(a==='hctrack') DBG.hcTrack(+v('dbgHcT')-1); if(a==='die') DBG.die();
    if(a==='core'){ ['armor','dmg','regen'].forEach((k,i)=>P.core[k]=clamp(+v('dbgC'+'ADR'[i])|0,0,CORE_MAX)); persist(); if(player) recalcStats(); toast('Core set'); }
    if(a==='treeMax'||a==='treeClr'){ TREE.forEach(b=>b.nodes.forEach(n=>P.skills[n.id]=a==='treeMax'?n.max:0)); persist(); if(player) recalcStats(); toast(a==='treeMax'?'Tree maxed':'Tree cleared'); }
    if(a==='gems'){ P.gems+=500; persist(); }
    if(a==='measure'){ const ar=+v('dbgArena'); toast('Measuring',`Arena ${ar+1}: the bot plays it fast-forwarded`); measureRun({arena:ar,best:ar}).then(r=>exportRunLog(JSON.stringify(r,null,1)+'\n\n'+runLogJson())); }
    if(a==='next'&&DBG.next) DBG.next(); if(a==='kill') DBG.killAll(); if(a==='god') DBG.god(); if(a==='gold') DBG.gold();
    if(a==='jump'&&DBG.jump) DBG.jump(+v('dbgRoom')); if(a==='skill'&&DBG.skill) DBG.skill(v('dbgSkill')); if(a==='item'&&DBG.item) DBG.item(v('dbgItem'));
    if(a==='spawn') DBG.spawn(v('dbgEnemy')); if(a==='spawnE') DBG.spawn(v('dbgEnemy'),true); if(a==='boss'&&DBG.boss) DBG.boss(v('dbgBoss'));
    if(a==='mode'&&DBG.mode) DBG.mode(); if(a==='hide') d.classList.toggle('min'); if(a==='log') toggleLog(); if(a==='sim') exportRunLog(simText()); });
  addEventListener('keydown',e=>{ if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return; if(['KeyN','KeyK','KeyG'].includes(e.code)) flagRun(); if(e.code==='KeyN'&&DBG.next) DBG.next(); if(e.code==='KeyK') DBG.killAll(); if(e.code==='KeyG') DBG.god(); if(e.code==='KeyL'&&!e.repeat) toggleLog(); if(e.code==='KeyO'&&!e.repeat) DBG.overlay(); });
}
