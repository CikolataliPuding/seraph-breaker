// Seraph Breaker · debug.js: Debug tools, only active with ?debug=1 (add &mobile=1 to force mobile mode on desktop): panel, run log overlay (L) with JSON export, and DBG.sim() balance simulation.
/* ================= DEBUG ================= */
const QS=new URLSearchParams(location.search), DEBUG=QS.get('debug')==='1';
let godMode=false;
const DBG={
  god(on=!godMode){ godMode=on; toast(godMode?'God mode on':'God mode off'); return godMode; },
  killAll(){ for(let k=0;k<5;k++) enemies.slice().forEach(e=>{ if(!e.dead&&e!==boss) killEnemy(e); }); spawnQ=[]; },
  skipCard(){ if(state==='card'){ stateT=0; } if(state==='warn'){ stateT=0; } if(state==='cine') endCine(); },
  spawn(type,elite=false){ if(!player) return; const p=freeSpot(3); return !!spawnEnemy(type,p,elite); },
  start(a=0){ launchArena(a); setTimeout(()=>DBG.skipCard(),50); },
  next(){ if(state!=='fight'||!room) return;
    if(boss&&!boss.dead){ boss.atk='idle'; killEnemy(boss); return; }
    DBG.killAll(); if(!room.cleared){ room.cleared=true; if(typeof onRoomClear==='function') onRoomClear(); openDoor(); saveRun(sortie.ri+1); } goNextRoom(); },
  // jump to room n (1-based) of the current arena
  jump(n,force){ if(!sortie||!player) return; n=clamp(n|0,1,sortie.N); clearEnemiesAndShots(); hideOverlays(); $('result').hidden=true; paused=false; sortie.ri=n-2; sortie.force=force||null; sortie.swapped=false; state='trans'; stateT=.3; $('fade').classList.add('on'); },
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
};
window.DBG=DBG;
const r2=v=>Math.round(v*100)/100;

/* ================= RUN LOG ================= */
// debug mode only: per room time, damage taken/dealt, kills, gold and diamonds by source, power estimate and enemy scale
const RUNLOG={rooms:[],cur:null};
function logRoomStart(type){ if(!DEBUG||!sortie) return; RUNLOG.cur={a:sortie.a,room:sortie.ri+1,type,t0:playTime,taken0:sortie.dmgTaken||0,dealt0:sortie.dmgDealt||0,kills0:kills,earn0:Object.assign({},sortie.earn||{})}; }
// 'clear' only stamps the clear time; the entry closes when you leave the room (exit), die or finish the arena, so pickups collected after the clear still count
function logRoomEnd(result){
  if(!DEBUG||!RUNLOG.cur||!sortie) return; const c=RUNLOG.cur;
  if(result==='clear'){ if(c.clearT==null) c.clearT=playTime-c.t0; return; }
  RUNLOG.cur=null; if(c.clearT!=null&&result!=='death') result='clear';
  const e=sortie.earn||{}, gold={}, gems={};
  for(const k in e){ const d=Math.round(e[k]-(c.earn0[k]||0)); if(!d) continue; const [cur,src]=k.split(':'); (cur==='gold'?gold:gems)[src]=d; }
  const pw=playerPower(), sc=enemyScale(sortie.a,sortie.ri,sortie.rule);
  RUNLOG.rooms.push({arena:c.a+1,room:c.room,type:c.type,result,time:r2(c.clearT!=null?c.clearT:playTime-c.t0),dmgTaken:Math.round((sortie.dmgTaken||0)-c.taken0),dmgDealt:Math.round((sortie.dmgDealt||0)-c.dealt0),kills:kills-c.kills0,
    gold,gems,lv:sortie.lv,power:{dps:r2(pw.dps),ehp:r2(pw.ehp),total:r2(pw.power)},enemy:{hp:r2(sc.hp),dmg:r2(sc.dmg),boss:r2(sc.boss)}});
  renderRunLog();
}
function runLogJson(){ return JSON.stringify({build:BUILD,unit:P.unit,weapon:P.weapon,core:P.core,tree:P.skills,arena:sortie&&sortie.a+1,earnTotal:sortie&&sortie.earn,rooms:RUNLOG.rooms},null,1); }
const sumObj=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
function renderRunLog(){
  const el=$('dbgLog'); if(!el||el.hidden) return;
  const live=$('dbgLive'); if(live){ const c=RUNLOG.cur, pw=playerPower(), sc=sortie?enemyScale(sortie.a,sortie.ri,sortie.rule):{hp:1,dmg:1};
    live.textContent=c&&sortie?`R${c.room} ${c.type} · ${(playTime-c.t0).toFixed(1)}s · taken ${Math.round(sortie.dmgTaken-c.taken0)} · dealt ${Math.round(sortie.dmgDealt-c.dealt0)} · kills ${kills-c.kills0}\n`+
      `power dps ×${pw.dps.toFixed(2)} ehp ×${pw.ehp.toFixed(2)} · enemy hp ×${sc.hp.toFixed(2)} dmg ×${sc.dmg.toFixed(2)} · lv ${sortie.lv}`:'no room running'; }
  const t=$('dbgRows'); if(!t) return;
  t.textContent=RUNLOG.rooms.slice(-8).map(r=>`${String(r.room).padStart(2)} ${r.type.padEnd(6)} ${String(r.time).padStart(5)}s -${String(r.dmgTaken).padStart(4)} +${String(r.dmgDealt).padStart(5)} k${String(r.kills).padStart(2)} g${String(sumObj(r.gold)).padStart(4)} d${sumObj(r.gems)} P${r.power.total} E${r.enemy.hp}/${r.enemy.dmg}`).join('\n')||'(no rooms yet)';
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
      const gain=v=>{ xp+=v; while(xp>=xpNeedAt(lv)){ xp-=xpNeedAt(lv); lv++; pick(skillOptions(3,null,ctx)); } };
      for(let ri=0;ri<N;ri++){
        const type=arenaRoomType(ri+1), sc=enemyScale(a,ri,rule); let count=0,g=0,gm=0;
        if(type==='combat'||type==='elite'){
          const list=composeRoom(type==='elite',a,ri,rule,11).flat();
          for(const t0 of list){ const el=t0.endsWith('*'), k=el?t0.slice(0,-1):t0, d=ENEMY[k], fam=k==='shardling'?1+6*SPLIT_REWARD:1, mul=el?3:1;
            count++; g+=d.gold*ECON.killGold[a]*mul*fam; gm+=(el?ECON.gemChance.elite:d.cost>=2.5?ECON.gemChance.big:ECON.gemChance.small)*fam;
            gain(d.xp*mul*(1+a*.12)*fam); if(el&&Math.random()<.25) item(); }
          src.kill+=g; src.gemKill+=gm; g+=ECON.clearGold[a]; src.clear+=ECON.clearGold[a];
        } else if(type==='boss'){ count=1; g=avgBoss('gold')*ECON.bossGold[a]; gm=Math.round(avgBoss('gems')*ECON.bossGems[a]); src.boss+=g; src.gemBoss+=gm; gain(XP_BOSS); item(); }
        else pick(skillOptions(2,null,ctx));
        if(ri===N-1){ gm+=ECON.repeatClear(a); src.gemClear+=ECON.repeatClear(a); }
        goldT+=g; gemT+=gm;
        // mob strength at this room index (combat room curve × crowd) and the boss strength, whatever the room type
        const pw=est(ctx), enemy=Math.sqrt(sc.hp*sc.dmg)*Math.sqrt(roomBudget(a,ri,false)/base0), bossE=Math.sqrt(sc.boss*sc.bossDmg);
        const r=acc[ri]||(acc[ri]={room:ri+1,type,lv:0,dps:0,ehp:0,power:0,enemyHp:sc.hp,enemyDmg:sc.dmg,enemy,boss:bossE,pressure:0,bossPressure:0,count:0});
        r.lv+=lv/trials; r.dps+=pw.dps/trials; r.ehp+=pw.ehp/trials; r.power+=pw.power/trials; r.pressure+=enemy/pw.power/trials; r.bossPressure+=bossE/pw.power/trials; r.count+=count/trials;
      }
    }
    acc.forEach(r=>{ for(const k in r) if(typeof r[k]==='number') r[k]=r2(r[k]); r.build=bd; out.rooms.push(r); });
    out.econ[bd]={gold:Math.round(goldT/trials),gems:Math.round(gemT/trials),goldBy:{kill:Math.round(src.kill/trials),boss:Math.round(src.boss/trials),clear:Math.round(src.clear/trials)},gemsBy:{kill:r2(src.gemKill/trials),boss:r2(src.gemBoss/trials),clear:r2(src.gemClear/trials)},target:{gold:ECON.target.gold[a],gems:ECON.target.gems[a]}};
  }
  const pts=[1,10,20,30,40,50].filter(n=>n<=N);
  out.table=pts.map(n=>{ const r0=out.rooms.find(x=>x.room===n), row={room:n,'enemy mob':r0.enemy,'enemy boss':n%10?'':r0.boss};
    builds.forEach(bd=>{ const r=out.rooms.find(x=>x.build===bd&&x.room===n); row[bd+' lv']=r.lv; row[bd+' power']=r.power; row[bd+' mob pressure']=r.pressure; if(!(n%10)) row[bd+' boss pressure']=r.bossPressure; }); return row; });
  if(o.print!==false){ console.log(`Seraph Breaker sim · arena ${a+1} (${A.name}) · meta ${out.meta} · ${trials} trials`); console.table(out.table); console.table(out.econ); }
  return out;
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
  <button data-a="mode">Toggle mobile</button><button data-a="log">Run log (L)</button><button data-a="sim">Sim</button><button data-a="hide">Hide</button>`;
  document.body.appendChild(d);
  // live overlay (toggle: L) and the export box
  const lg=document.createElement('div'); lg.id='dbgLog'; lg.hidden=true;
  lg.innerHTML=`<div class="h"><b>RUN LOG</b><button data-l="export">Export JSON</button><button data-l="sim">Sim arena</button><button data-l="close">✕</button></div><pre id="dbgLive"></pre><pre id="dbgRows"></pre>`;
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
  fill('dbgSkill',typeof RSK!=='undefined'?RSK:null); fill('dbgItem',typeof ITEMS!=='undefined'?ITEMS:null); fill('dbgEnemy',typeof ENEMY!=='undefined'?ENEMY:{drone:1,seraph:1,heavy:1,warden:1}); fill('dbgBoss',BOSSES);
  d.addEventListener('pointerdown',e=>e.stopPropagation());
  d.addEventListener('click',e=>{ const a=e.target.dataset&&e.target.dataset.a; if(!a) return; const v=id=>$(id).value;
    if(a==='next'&&DBG.next) DBG.next(); if(a==='kill') DBG.killAll(); if(a==='god') DBG.god(); if(a==='gold') DBG.gold();
    if(a==='jump'&&DBG.jump) DBG.jump(+v('dbgRoom')); if(a==='skill'&&DBG.skill) DBG.skill(v('dbgSkill')); if(a==='item'&&DBG.item) DBG.item(v('dbgItem'));
    if(a==='spawn') DBG.spawn(v('dbgEnemy')); if(a==='spawnE') DBG.spawn(v('dbgEnemy'),true); if(a==='boss'&&DBG.boss) DBG.boss(v('dbgBoss'));
    if(a==='mode'&&DBG.mode) DBG.mode(); if(a==='hide') d.classList.toggle('min'); if(a==='log') toggleLog(); if(a==='sim') exportRunLog(simText()); });
  addEventListener('keydown',e=>{ if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return; if(e.code==='KeyN'&&DBG.next) DBG.next(); if(e.code==='KeyK') DBG.killAll(); if(e.code==='KeyG') DBG.god(); if(e.code==='KeyL'&&!e.repeat) toggleLog(); });
}
