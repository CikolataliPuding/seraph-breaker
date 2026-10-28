// Seraph Breaker · balance.js: Balance system: stat buckets with soft and hard caps, proc limits, enemy scaling curve, the player power estimate and economy helpers. Numbers live in data.js (BAL, SCALE, XP_NEED, ECON).
/* ================= STAT BUCKETS ================= */
// every run bonus (skills, items, curses, angel blessings) adds into one bucket per stat; buckets multiply with each other and with Core + tree
const BUCKET_KEYS=['dmg','rate','hp','hpFlat','regen','spd','crit','dodge','gold','sp','spPow','taken','magnet','gcd','en'];
// bucket bonus above +100% only counts at 50%
const softCap=x=>x<=BAL.soft?x:BAL.soft+(x-BAL.soft)*BAL.softRate;
// permanent layer: skill tree + Core stats (prof = the save object P)
function metaStats(prof,unitKey){
  const r=id=>prof.skills[id]||0, c=prof.core;
  return {dmg:(1+.1*r('dmg'))*(1+.04*c.dmg),rate:1-.08*r('rate'),crit:.07*r('crit'),sp:1+.25*r('sp'),boss:1+.3*r('exec'),heal:1+.4*r('repair'),hexDrain:1-.2*r('hex'),armor:1-.08*r('plate'),second:r('second')>0,spd:1+.06*r('spd'),regen:(1+.15*r('regen'))*(1+.03*c.regen),dashCd:1-.15*r('dashcd'),magnet:3.2*(1+.6*r('magnet')),goldMul:1+.1*r('magnet'),gadgetCd:1-.12*r('gadget'),maxHp:UNITS[unitKey].hp+15*r('hp')+20*c.armor};
}
// sum of all run bonuses: skills count per rank, then items, curses and extra (angel blessings)
function sumBonus(rs,items,curses,extra){
  const b={}; BUCKET_KEYS.forEach(k=>b[k]=0);
  const add=(o,n=1)=>{ if(o) for(const k in o) b[k]=(b[k]||0)+o[k]*n; };
  for(const id in rs){ const s=RSK[id]; if(s) add(s.bonus,Math.min(rs[id],s.max)); }
  (items||[]).forEach(id=>{ const d=ITEMS[id.id||id]; if(d) add(d.bonus); });
  (curses||[]).forEach(id=>{ if(CURSES[id]) add(CURSES[id].bonus); });
  add(extra); return b;
}
// final stats: soft cap inside each bucket, then the buckets multiply with the meta layer, hard caps last
function deriveStats(m,b){
  const C=BAL.cap;
  return {dmg:m.dmg*(1+softCap(b.dmg)), rate:m.rate/(1+Math.min(C.rate,softCap(b.rate))), crit:Math.min(C.crit,m.crit+b.crit), dodge:Math.min(C.dodge,b.dodge),
    spd:m.spd*(1+Math.min(C.spd,b.spd)), regen:m.regen*(1+softCap(b.regen)), goldMul:m.goldMul*(1+softCap(b.gold)), sp:m.sp*(1+softCap(b.sp)), spPow:1+softCap(b.spPow),
    armor:m.armor*(1+b.taken), magnet:m.magnet*(1+b.magnet), gadgetCd:m.gadgetCd/(1+b.gcd), maxHp:Math.max(30,Math.round((m.maxHp+b.hpFlat)*(1+softCap(b.hp)))), enMax:100+b.en,
    boss:m.boss, heal:m.heal, hexDrain:m.hexDrain, second:m.second, dashCd:m.dashCd, noHex:false};
}
// rebuilds player.st from scratch; max armor changes move current armor by the same amount (gains heal, losses only clamp)
function recalcStats(){
  const p=player; if(!p) return;
  const items=sortie?sortie.items:[], curses=sortie?sortie.curses:[];
  const b=sumBonus(p.rs,items,curses,p.extra), st=deriveStats(metaStats(P,P.unit),b);
  st.noHex=curses.some(c=>CURSES[c]&&CURSES[c].noHex);
  const oldMax=p.maxHp; p.bonus=b; p.st=st; p.maxHp=st.maxHp; p.enMax=st.enMax;
  if(oldMax){ if(p.maxHp>oldMax) p.hp+=p.maxHp-oldMax; p.hp=Math.min(p.hp,p.maxHp); } else p.hp=p.maxHp;
  p.en=Math.min(p.en,p.enMax);
}
// extra projectiles and orbiting hitters (both hard capped; normal skills stop being offered at the cap, evolutions are trimmed in pshot/buildOrbit)
const extraProj=rs=>{ let n=0; for(const id in rs){ const s=RSK[id]; if(s&&s.proj) n+=s.proj*Math.min(rs[id],s.max); } return n; };
const orbCount=rs=>{ let n=0; for(const id in rs){ const s=RSK[id]; if(s&&s.orb) n+=s.orb*Math.min(rs[id],s.max); } return n; };
// labels and effective values for the value preview on skill cards and the build panel
const BUCKET_TXT={dmg:'Damage',rate:'Fire rate',hp:'Max armor',hpFlat:'Max armor',regen:'Power regen',spd:'Move speed',crit:'Crit chance',dodge:'Dodge',gold:'Gold',sp:'Special recharge',spPow:'Special power',taken:'Damage taken',magnet:'Pickup reach',gcd:'Gadget speed',en:'Power'};
if(LANG!=='en') langData(BUCKET_TXT,true); // stat names in the active language (i18n.js)
function bucketVal(k,b){ const C=BAL.cap, pc=v=>Math.round(v*100)+'%', sg=v=>(v>=0?'+':'-')+pc(Math.abs(v));
  if(k==='hpFlat') return '+'+Math.round(b.hpFlat); if(k==='en') return '+'+Math.round(b.en);
  if(k==='crit'){ const m=player?metaStats(P,P.unit).crit:0; return pc(Math.min(C.crit,m+b.crit)); }
  if(k==='dodge') return pc(Math.min(C.dodge,b.dodge));
  if(k==='rate') return sg(Math.min(C.rate,softCap(b.rate))); if(k==='spd') return sg(Math.min(C.spd,b.spd));
  if(k==='taken'||k==='magnet'||k==='gcd') return sg(b[k]);
  return sg(softCap(b[k])); }
// "Damage +18% → +36%" lines for a skill (or item) that adds a bonus
function bonusPreview(bonus){ if(!bonus||!player) return []; const b0=player.bonus||sumBonus(player.rs,sortie&&sortie.items,sortie&&sortie.curses,player.extra), b1=Object.assign({},b0);
  for(const k in bonus) b1[k]=(b1[k]||0)+bonus[k];
  return Object.keys(bonus).map(k=>({k,label:BUCKET_TXT[k]||k,from:bucketVal(k,b0),to:bucketVal(k,b1)})); }

/* ================= PROC LIMITS ================= */
// token bucket per proc: refills BAL.proc[id].rate per second of play, holds up to burst. Returns false while the proc is on cooldown.
function procOk(id){
  const c=BAL.proc[id], p=player; if(!c||!c.rate||!p) return true;
  const pr=p.procs||(p.procs={}), burst=c.burst||1, s=pr[id]||(pr[id]={tok:burst,t:playTime});
  s.tok=Math.min(burst,s.tok+Math.max(0,playTime-s.t)*c.rate); s.t=playTime;
  if(s.tok<1) return false; s.tok--; return true;
}

/* ================= ENEMY SCALING ================= */
const growth=(g,ri)=>Math.pow(1+g,ri);
/* armor (hp) and damage multipliers for room index ri (0-based) of arena a; boss rooms use the same curve divided by its room 10 value.
   An arena with roomK (Main Stage) runs the curve roomK rooms per room, and wf (0..1, the wave inside the room) climbs within a room.
   mobCurve (Main Stage): the room mobs follow their own curve instead, [start, growth per room up to the knee, growth after it] for armor and
   damage (ri + wf rooms in), so the stage climbs steadily from room 1; past the knee (the pilot hits the level cap there) it climbs slower.
   The boss keeps the roomK curve. */
const kneeCurve=(c,xr,knee)=>c[0]*Math.pow(c[1],Math.min(xr,knee))*Math.pow(c[2],Math.max(0,xr-knee));
/* the reference pilot of arena a (CURVE): tree ranks open at tier a+1, Core half way into tier a+1; no tier gate (prof has no arenas) */
const treeRankAt=(n,t)=>{ let k=0; while(k<n.max&&Math.ceil((k+1)*CURVE.treeFull/n.max)<=t) k++; return k; };
function refMeta(a){ const sk={}, lv=CURVE.tier*a+CURVE.tier/2; TREE.forEach(b=>b.nodes.forEach(n=>sk[n.id]=treeRankAt(n,a+1))); return {skills:sk,core:{armor:lv,dmg:lv,regen:lv}}; }
function refPower(a){ const m=metaStats(refMeta(a),'azure'); return {dps:m.dmg/m.rate*(1+m.crit),ehp:m.maxHp/m.armor}; }
// arena multipliers: enemy armor follows the reference dps, damage the reference ehp, both × √pressure; crowd growth comes off the armor
const _curve=[];
function arenaCurve(a){ if(_curve[a]) return _curve[a]; const A=ARENAS[a]||{}, r0=refPower(0), r=refPower(a), z=Math.sqrt(1+CURVE.press*Math.log(1+a)), crowd=roomBudget(a,0,false)/roomBudget(0,0,false), own=(k,v)=>A[k]!=null?A[k]:v;
  return _curve[a]={hp:own('hpMul',r.dps/r0.dps*z/crowd),dmg:own('dmgMul',r.ehp/r0.ehp*z),boss:own('bossMul',r.dps/r0.dps*Math.pow(CURVE.bossT,a)),tempo:own('tempo',Math.min(CURVE.tempoMax,1+CURVE.tempo*a))}; }
function enemyScale(a,ri,rule,wf){ const A=ARENAS[a], K=arenaCurve(a), hm=rule&&rule.hpMul||1, dm=K.dmg, fin=ri>=A.rooms-1, x=A.roomK?(ri+(wf||0))*A.roomK:ri, mc=A.mobCurve, xr=ri+(wf||0);
  return {hp:(mc?kneeCurve(mc.hp,xr,mc.knee):K.hp*growth(SCALE.hp,x))*hm, dmg:mc?kneeCurve(mc.dmg,xr,mc.knee):dm*growth(SCALE.dmg,x),
    boss:K.boss*growth(SCALE.hp,x)/growth(SCALE.hp,SCALE.bossRef)*hm*(fin?SCALE.finalHp:1), bossDmg:dm*growth(SCALE.dmg,x)/growth(SCALE.dmg,SCALE.bossRef)*(fin?SCALE.finalDmg:1)*SCALE.bossDmgK}; }
// enemy budget for a room (sum of ENEMY cost); grows slowly next to the exponential armor curve, the arena part stops at cap (readability)
function roomBudget(a,ri,elite){ const B=SCALE.budget; return (Math.min(B.cap,B.base+a*B.arena)+(ri+1)*B.room)*(elite?B.elite:1); }
const xpNeedAt=lv=>XP_NEED.base+Math.floor(lv*XP_NEED.per*10)/10;

/* ================= POWER ESTIMATE ================= */
/* rough player power next to a fresh pilot with no Core, tree, skills or items (= 1). dps: damage per second on a typical room, as a multiple
   of the base gun (≈10 dps): the gun chain (damage × fire rate × crit × projectiles × Rage) times its on-hit procs, plus hitters that do not
   depend on the gun (orbits, wingman, Storm Halo, Dash Trail). ehp: armor you can lose before dying, with dodge, damage taken and sustain.
   Debug output and DBG.sim() compare it with the enemy curve. It is never used to change the game while you play (no rubber-banding). */
function powerEstimate(st,rs,o={}){
  const r=id=>Math.min(rs[id]||0,RSK[id]?RSK[id].max:0), base=metaStats({skills:{},core:{armor:0,dmg:0,regen:0}},o.unit||P.unit);
  const critMul=o.critMul||2, crit=1+st.crit*(critMul-1), dm=st.dmg/base.dmg;
  // projectiles: twin hits the same target, spread shots only sometimes find one; trimmed at the projectile cap like pshot
  const tw=r('twin'); let proj=(1+tw)*BAL.twin[tw], extra=tw; const room=BAL.cap.proj;
  const add=(n,val)=>{ const k=Math.max(0,Math.min(n,room-extra)); extra+=k; proj+=k*val; };
  if(r('storm')) add(2,.6*.5); if(r('diag')) add(2,.7*.3); if(r('side')) add(2,.7*.2); if(r('rear')) add(1,.7*.15);
  proj*=1+.2*r('pierce')+.1*r('ricochet')+.06*r('wall');
  const rage=1+.25*r('rage')*(r('blood')?2.5:1)*.35;
  const gun=dm*(base.rate/st.rate)*crit*proj*rage;
  // on-hit procs scale with the gun (their own rate caps keep them in check)
  const onHit=1+.15*r('torch')+.1*r('poison')+.08*r('arc')+.12*r('meteor')+.06*r('nova')+.05*r('shard')+.04*r('cryo')+.02*r('freeze');
  // independent hitters, in base-gun units: orbits, wingman, Storm Halo, Dash Trail
  const orb=Math.min(BAL.cap.orbit,orbCount(rs)), indep=orb*.15+(r('inferno')?.6:0)+.25*r('wing')+(r('halo')?.4:0)+.05*r('trail');
  const dps=gun*onHit+dm*crit*indep;
  const sustain=1+.05*r('vamp')+(r('blood')?.12:0)+.08*r('sorb')+(r('reflect')?.05:0)+.4*(o.lives||r('life'))+(o.aegis?.08:0)+(st.second?.15:0);
  const ehp=st.maxHp/base.maxHp/(st.armor/base.armor)/(1-st.dodge)*sustain;
  return {dps,ehp,power:Math.sqrt(dps*ehp)};
}
// power of the live player (debug overlay, run log)
function playerPower(){ const p=player; if(!p) return {dps:1,ehp:1,power:1}; return powerEstimate(p.st,p.rs,{critMul:p.critMul,lives:p.lives,aegis:p.aegisN>0}); }

/* ================= ECONOMY ================= */
// every gold and diamond gain goes through here, so the debug run log can split earnings by source (kill, boss, clear, pickup)
function logEarn(cur,src,v){ if(!sortie||!v) return; const L=sortie.earn||(sortie.earn={}), k=cur+':'+src; L[k]=(L[k]||0)+v; }
/* ECON's per-arena tables (killGold, bossGold, bossGems, clearGold, healChance): an arena past the table end takes the last value,
   grown with the gold target. goldTarget: ECON.target when listed, else the gold that pays the arena's new Core tier in CURVE.runs runs. */
function goldTarget(a){ const g=ECON.target.gold; if(a<g.length) return g[a]; let s=0; for(let lv=CURVE.tier*a;lv<CURVE.tier*(a+1);lv++) s+=3*coreCost(lv); return s/CURVE.runs; }
function econAt(k,a){ const v=ECON[k], n=v.length-1; return a<=n?v[a]:v[n]*(k==='healChance'?1:goldTarget(a)/goldTarget(n)); }
// flat gold for every cleared combat or elite room (Gold Rush, Greed and the tree's magnet bonus apply)
function clearBonus(){ if(!sortie||!room||room.type==='angel'||room.type==='boss') return; const v=Math.round(econAt('clearGold',sortie.a)*player.st.goldMul*(sortie.farm||1)); P.gold+=v; sortie.gold+=v; logEarn('gold','clear',v); }
