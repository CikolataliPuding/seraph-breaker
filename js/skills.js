// Seraph Breaker · skills.js: Run XP, skill roulette (rarity, synergy, reels, reroll), angel and devil offers, orbits and skill effects.
/* ================= RUN SKILLS / XP ================= */
// tuned for 30-50 room runs: frequent level-ups early, without maxing everything by mid-run
const xpNeed=()=>xpNeedAt(sortie.lv);
// the run's level cap (Main Stage: STAGE.lvCap, 0 = none); at the cap xp is dropped, so no more level-ups or cards
const lvCap=a=>ARENAS[a]&&ARENAS[a].stage?STAGE.lvCap:0, atCap=()=>{ const c=lvCap(sortie.a); return !!c&&sortie.lv>=c; };
function gainXp(v){ if(!sortie) return; if(atCap()){ sortie.xp=0; return; } sortie.xp+=v;
  while(sortie.xp>=xpNeed()){ sortie.xp-=xpNeed(); sortie.lv++; sortie.pendingLv++; if(atCap()){ sortie.xp=0; break; } } }
// a skill is offered while it can rank up; projectile and orbit skills stop at the hard cap (evolutions are trimmed instead, see pshot/buildOrbit)
// a card that does nothing with the equipped weapon (data.js WEAPON_DEAD); Crimson's Diagonal / Side / Rear fan out from its Twin / Storm slug
function deadCard(id,rs){ const w=P.weapon||'sig', d=WEAPON_DEAD[w]||[], list=w==='sig'?d[P.unit]||[]:d; if(list.includes(id)) return true;
  return w==='sig'&&P.unit==='crimson'&&['diag','side','rear'].includes(id)&&!(rs.twin||rs.storm); }
// ...it is still offered as an evolution parent when that evolution works with the weapon and its other parent is owned
const evoParent=(id,rs)=>Object.keys(RSK).some(e=>{ const v=RSK[e].evo; return v&&v.includes(id)&&!deadCard(e,rs)&&v.every(x=>x===id||rs[x]); });
const skillOk=(id,rs=player.rs)=>{ const s=RSK[id]; if((rs[id]||0)>=s.max||(s.req&&!s.req(rs))||deadCard(id,rs)&&!evoParent(id,rs)) return false;
  if(s.rarity!=='legendary'&&(s.proj&&extraProj(rs)+s.proj>BAL.cap.proj||s.orb&&orbCount(rs)+s.orb>BAL.cap.orbit)) return false; return true; };
// Lucky Coin pushes every roll one tier up
function rarityWeights(l=player.luck||0){ return l?{common:Math.max(20,60-15*l),rare:28+5*l,epic:10+6*l,legendary:2+4*l}:{common:60,rare:28,epic:10,legendary:2}; }
/* weighted pick: rarity weights 60/28/10/2 are shared by the skills of that rarity that can still be offered;
   skills you own get x1.3 and unlocked evolutions x2.5. No card is forced to be an upgrade any more (patch.md 34: a card you
   own used to come back almost every level, so Vampiric Core or Attack Boost maxed in the first rooms) */
// ctx defaults to the live player; the debug simulation passes its own {rs,luck}; only: limit the pool to these ids
function skillOptions(n,rarity,ctx=player,only){
  const prs=ctx.rs, rw=rarityWeights(ctx.luck||0), ids=Object.keys(RSK).filter(id=>skillOk(id,prs)&&(!rarity||RSK[id].rarity===rarity)&&(!only||only.includes(id)));
  const cnt={}; ids.forEach(id=>cnt[RSK[id].rarity]=(cnt[RSK[id].rarity]||0)+1);
  const w=id=>{ const r=RSK[id].rarity; return rw[r]/cnt[r]*(RSK[id].evo?2.5:prs[id]?1.3:1); };
  const pick=list=>{ let t=0; list.forEach(id=>t+=w(id)); let x=Math.random()*t; for(const id of list){ x-=w(id); if(x<=0) return id; } return list[list.length-1]; };
  const out=[], pool=ids.slice();
  while(out.length<n&&pool.length){ const id=pick(pool); out.push(id); pool.splice(pool.indexOf(id),1); }
  for(let i=out.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [out[i],out[j]]=[out[j],out[i]]; }
  return out;
}
function applySkill(id,silent){
  const s=RSK[id]; if(!s) return; const rs=player.rs; rs[id]=(rs[id]||0)+1;
  recalcStats(); if(s.apply) s.apply(player,rs[id]);
  if(!silent){ betaLog({k:'card',id,rank:rs[id],lv:sortie&&sortie.lv}); renderRunSkills(); sfx('lvup'); if(s.rarity==='legendary'){ popText(t('EVOLVED')); crossBlast(player.pos.clone(),0xffc83a,1); } }
}
function applyCurse(id,silent){ const c=CURSES[id]; if(!c||sortie.curses.includes(id)) return; sortie.curses.push(id); recalcStats(); if(c.apply) c.apply(player,silent); buildRule(); if(!silent) renderRunSkills(); }
// skill + curse + item icons (HUD row and result screen)
function runIcons(){ return buildEntries().map((en,i)=>{ const s=document.createElement('span'); s.className=en.cls; s.dataset.i=i; s.setAttribute('aria-label',en.name); s.innerHTML=svg(en.icon);
  const n=en.kind==='skill'?player.rs[en.id]:0; if(n>1){ const b=document.createElement('b'); b.textContent=n; s.appendChild(b); } return s; }); }
function renderRunSkills(){ const bar=$('rsBar'); bar.innerHTML=''; bar.append(...runIcons()); }
// roulette card for a run skill: rank pips and a value preview for stat skills ("Damage +18% → +36%")
function skillCard(id,extra){ const s=RSK[id], rk=player.rs[id]||0; return {id,icon:s.icon,name:s.name,desc:s.d+(extra||'')+(deadCard(id,player.rs)?' '+t('No effect with this weapon: it counts toward its evolution.'):''),rarity:s.rarity,tag:`${RARITY[s.rarity].n} · `+(rk?t('Rank {0}/{1}',rk+1,s.max):t('New')),pips:{rank:rk,max:s.max},pv:bonusPreview(s.bonus)}; }

/* ================= ORBITS + WINGMAN ================= */
function buildOrbit(){
  orbitG.children.slice().forEach(c=>orbitG.remove(c)); if(!player) return; const rs=player.rs, inf=rs.inferno>0;
  // orbiting hitters are hard capped (BAL.cap.orbit): blades first, then fire, ice and bolt orbs
  let room=BAL.cap.orbit; const take=n=>{ const k=Math.max(0,Math.min(n,room)); room-=k; return k; };
  const nb=take((rs.orbit||0)*2+(inf?2:0));
  for(let i=0;i<nb;i++){ const b=new THREE.Mesh(G.blade,addMat(inf?0xff7a2a:unit.shot,.9)); if(inf) b.scale.set(1.5,1.4,1.8); b.userData={k:'blade'}; orbitG.add(b); }
  const orb=(k,c,n)=>{ for(let i=0;i<n;i++){ const m=new THREE.Mesh(G.orb,addMat(c,.95)); m.scale.setScalar(1.25); m.add(new THREE.Mesh(G.puff,addMat(c,.3))); m.userData={k,zap:0}; orbitG.add(m); } };
  orb('fire',0xff7a2a,take(rs.forb||0)); orb('ice',0x9fe8ff,take(rs.iorb||0)); orb('bolt',0xd8f4ff,take(rs.borb||0));
  for(let i=0;i<(rs.sorb||0)*2;i++){ const m=new THREE.Mesh(box(1,1.3,.14),addMat(0xffa04a,.75)); m.userData={k:'shield'}; orbitG.add(m); }
}
function buildWingman(){
  if(wingman) scene.remove(wingman.g);
  const g=new THREE.Group(); part(box(.7,.28,.7),toon(0x3a3d48),g,0,0,0,.05); part(box(1.4,.08,.3),toon(unit.c1),g,0,.05,0,.04); const e=new THREE.Mesh(box(.3,.08,.06),basic(unit.shot,false)); e.position.set(0,.05,.36); g.add(e);
  scene.add(g); wingman={g,a:Math.PI,cd:0};
}
function updateOrbits(dt,canAct){
  const p=player; if(!orbitG.children.length) return; p.orbA+=dt;
  const ch=orbitG.children, inf=p.rs.inferno>0; let nb=0,no=0,ns=0; ch.forEach(c=>{ const k=c.userData.k; if(k==='blade') nb++; else if(k==='shield') ns++; else no++; });
  let ib=0,io=0,is=0;
  for(const b of ch){ const k=b.userData.k; let a,r,y=1.4;
    if(k==='blade'){ a=p.orbA*4+ib++/nb*Math.PI*2; r=inf?3.4:2.6; b.rotation.y=-a; }
    else if(k==='shield'){ a=-p.orbA*3+is++/ns*Math.PI*2; r=1.9; y=1.7; b.rotation.y=Math.PI/2-a; }
    else { a=p.orbA*2.6+io++/no*Math.PI*2; r=3.6; y=1.8; }
    b.position.set(p.pos.x+Math.cos(a)*r,y,p.pos.z+Math.sin(a)*r); }
  if(!canAct) return;
  for(const b of ch){ const k=b.userData.k; if(k==='shield') continue;
    if(k==='bolt'){ b.userData.zap-=dt; if(b.userData.zap<=0){ const t=nearestFoe(b.position,5.5); if(t){ b.userData.zap=.7; bolt(b.position.clone(),t.pos.clone().setY(2),0xd8f4ff); hitEnemy(t,5*p.st.dmg,t.pos.clone().setY(2),false,true); } } continue; }
    const rad=k==='blade'?(inf?.9:.4):.55;
    for(const e of enemies){ if(e.dead||e.dropY>0) continue; if(Math.hypot(e.pos.x-b.position.x,e.pos.z-b.position.z)<e.r*.7+rad){
      if(k==='blade'){ hitEnemy(e,(inf?40:16)*p.st.dmg*dt,e.pos,true); if(inf) e.burn=Math.max(e.burn,2.5); }
      else if(k==='fire'){ hitEnemy(e,10*p.st.dmg*dt,e.pos,true); e.burn=Math.max(e.burn,2); }
      else { hitEnemy(e,8*p.st.dmg*dt,e.pos,true); e.slow=Math.max(e.slow,1.2); }
      if(Math.random()<dt*10) sparks(b.position,k==='ice'?0x9fe8ff:k==='blade'&&!inf?unit.shot:0xff7a2a,1,3); break; } } }
  // Storm Halo: lightning strikes the 2 nearest enemies every 1.25 s (was 3 every second: worth 3× its parents, patch.md 34)
  if(p.rs.halo){ p.haloT=(p.haloT||0)-dt; if(p.haloT<=0){ p.haloT=1.25; const hit=new Set(); for(let i=0;i<2;i++){ const t=nearestFoe(p.pos,12,null,hit); if(!t) break; hit.add(t); const top=t.pos.clone().setY(9); bolt(top,t.pos.clone().setY(1.5),0xd8f4ff); bolt(top.clone().setX(top.x+.4),t.pos.clone().setY(1.5),0xffffff); hitEnemy(t,6*p.st.dmg,t.pos.clone().setY(2),false,true); if(t!==boss) t.stun=Math.max(t.stun,.25); } if(hit.size) sfx('zap'); } }
}
// Shield Orbit: plates eat enemy shots
function orbitBlocks(b){ for(const c of orbitG.children){ if(c.userData.k!=='shield') continue; if(Math.hypot(b.m.position.x-c.position.x,b.m.position.z-c.position.z)<.95){ sparks(b.m.position,0xffa04a,3,4); return true; } } return false; }

/* ================= SKILL EFFECTS ================= */
// Reflect Hex: a blocked shot flies back as your own (beams cannot be reflected)
function reflectShot(b){ const v=b.vel.clone().setY(0); if(v.lengthSq()<.01) return; v.negate().normalize(); shoot('p',b.m.position.clone().setY(1.8),v,24,Math.max(2,b.dmg*.5)*player.st.dmg,0xffa04a,{life:1.2}); }
// Hex Nova: overheating the hex shield or breaking the phone barrier blasts everything nearby
function hexNova(){ const p=player; aoe(p.pos,6,(14+6*(p.rs.hexnova||1))*p.st.dmg,.6,2.5); clearEnemyShots(p.pos,6); crossBlast(p.pos.clone(),0xffa04a,1.1); }
// delayed blasts: meteors, Death Nova, Spark explosions. Queued so chain reactions spread over frames and stay capped.
// every blast is a proc: it hits with noProc, so its kills never chain into more on-kill procs. flat blasts skip crit and Rage too.
function queueBlast(x,z,o){ if(blasts.length>=40) return; if(o.hurtP&&aiSrc&&aiSrc.def.dmgK&&!o.boss) o={...o,hurtP:o.hurtP*aiSrc.def.dmgK}; const ring=new THREE.Mesh(G.ring,addMat(o.color||0xff6a1a,.9)); ring.rotation.x=-Math.PI/2; ring.position.set(x,.07,z); ring.scale.setScalar(o.rad); scene.add(ring); blasts.push({x,z,t:o.t||.15,max:o.t||.15,rad:o.rad,dmg:o.dmg,color:o.color||0xff6a1a,hurtP:o.hurtP||0,hurtE:o.hurtE!==false,size:o.size||.8,ring,skip:o.skip||null,flat:!!o.flat,boss:!!o.boss}); }
function updateBlasts(dt){
  // a blast's hit can clear the list (High-Co's form change), so an index past the end is skipped
  for(let i=blasts.length-1;i>=0;i--){ const b=blasts[i]; if(!b) continue; b.t-=dt; const k=1-b.t/b.max; b.ring.material.opacity=.4+Math.sin(k*30)*.3; b.ring.scale.setScalar(b.rad*(1.15-k*.15));
    if(b.t>0) continue;
    scene.remove(b.ring); blasts.splice(i,1); const pos=new V3(b.x,0,b.z);
    crossBlast(pos,b.color,b.size);
    if(b.hurtE) for(const e of enemies.slice()){ if(e.dead||e===b.skip) continue; if(Math.hypot(e.pos.x-b.x,e.pos.z-b.z)<b.rad+e.r*.5) hitEnemy(e,b.dmg,e.pos.clone().setY(2),false,true,b.flat); }
    if(b.hurtP&&player&&!player.dead&&Math.hypot(player.pos.x-b.x,player.pos.z-b.z)<b.rad+.5) hurt(b.hurtP); }
}
function clearBlasts(){ blasts.forEach(b=>scene.remove(b.ring)); blasts.length=0; trails.forEach(t=>scene.remove(t.m)); trails.length=0; }
// Dash Trail: fire patches that burn enemies
function dropTrail(pos){ if(trails.length>=40){ scene.remove(trails[0].m); trails.shift(); } const m=new THREE.Mesh(new THREE.CircleGeometry(1.1,10),addMat(0xff7a2a,.55)); m.rotation.x=-Math.PI/2; m.position.set(pos.x,.06,pos.z); scene.add(m); trails.push({m,x:pos.x,z:pos.z,t:2}); }
function updateTrails(dt){ for(let i=trails.length-1;i>=0;i--){ const t=trails[i]; t.t-=dt; t.m.material.opacity=Math.min(.55,t.t*.5)*(.8+Math.random()*.2);
  for(const e of enemies){ if(e.dead||e.fly&&e!==boss) continue; if(Math.hypot(e.pos.x-t.x,e.pos.z-t.z)<1.1+e.r*.5){ hitEnemy(e,7*(player.rs.trail||1)*player.st.dmg*dt,e.pos,true); e.burn=Math.max(e.burn,1); } }
  if(t.t<=0){ scene.remove(t.m); t.m.geometry.dispose(); trails.splice(i,1); } } }

/* ================= CHOICE SCREEN + ROULETTE ================= */
/* minimal choice screen: the world stays visible (darkened, slowed) and compact cards slide up from the bottom.
   Each card: rarity edge, icon slot reel (the result is decided before the spin), name, one-line effect, value preview and rank pips.
   Only a fresh press that starts after the screen opened (plus a short grace) skips the spin: held keys auto-repeat and held mouse buttons are ignored.
   Desktop: 1/2/3 pick a card, R rerolls. */
let spin=null, ignoreClickUntil=0, choiceOpenT=0, chCfg=null;
const REEL_H=44, SKIP_GRACE=250;
function openChoice(cfg){
  if(state==='dying'||state==='result'||player&&player.dead) return; if(state!=='choice') choiceBack=state; setState('choice'); choiceOpenT=performance.now(); chCfg=cfg; resetTouch(); for(const k in keys)keys[k]=false; mouseDown=rightDown=false;
  hideRsPop();
  $('chEye').textContent=cfg.eyebrow; $('chTitle').textContent=cfg.title; $('chNote').textContent=cfg.note||'';
  const rr=$('chReroll'); rr.hidden=!cfg.reroll;
  if(cfg.reroll){ rr.innerHTML=`<kbd>R</kbd>${t('Reroll')} · ${sortie.rerolls}`; rr.disabled=sortie.rerolls<1; rr.onclick=rerollChoice; }
  const list=$('chList'); list.innerHTML=''; list.classList.toggle('many',cfg.options.length>3);
  const icons=Object.keys(RSK).map(id=>RSK[id].icon);
  spin={cards:[],left:0,tick:0};
  cfg.options.forEach((o,i)=>{ const b=document.createElement('button'); b.className='rcard'+(o.rarity?' rr-'+o.rarity:''); b.id='ch'+i; b.type='button';
    b.style.setProperty('--c',o.rarity?RARITY[o.rarity].c:(o.color||'var(--signal)')); b.style.setProperty('--i',i);
    b.innerHTML=`<span class="ic"><span class="reel"></span></span><span class="body"><span class="top"><b class="n"></b><span class="tag"></span></span><span class="d"></span><span class="pv"></span></span><span class="pips"></span><kbd class="key">${i+1}</kbd>`;
    const reel=b.querySelector('.reel'), doSpin=cfg.spin&&!o.static, n=doSpin?10+i*3:0;
    const ent=icon=>{ const d=document.createElement('i'); d.innerHTML=svg(icon); reel.appendChild(d); };
    for(let k=0;k<n;k++) ent(pickOne(icons)); ent(o.icon);
    b.querySelector('.n').textContent=o.name; b.querySelector('.tag').textContent=o.tag||''; b.querySelector('.d').textContent=o.desc;
    const pv=b.querySelector('.pv'); (o.pv||[]).forEach(l=>{ const r=document.createElement('span'); r.innerHTML=`<em></em> <s></s> → <b></b>`; r.querySelector('em').textContent=l.label; r.querySelector('s').textContent=l.from; r.querySelector('b').textContent=l.to; pv.appendChild(r); });
    if(o.pips){ const pp=b.querySelector('.pips'); for(let k=0;k<o.pips.max;k++){ const q=document.createElement('i'); q.className=k<o.pips.rank?'f':k===o.pips.rank?'nx':''; pp.appendChild(q); } }
    b.onclick=()=>pickChoice(i);
    list.appendChild(b);
    if(doSpin){ spin.left++; const dur=.5+i*.17; spin.cards.push({b,reel,n,dur,rarity:o.rarity}); reel.style.transform='translateY(0)'; }
    else b.classList.add('stop');
  });
  $('choice').hidden=false; refreshControls();
  if(spin.left){ requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(!spin) return; spin.cards.forEach(c=>{ c.reel.style.transition=`transform ${c.dur}s cubic-bezier(.12,.8,.22,1)`; c.reel.style.transform=`translateY(${-c.n*REEL_H}px)`; c.timer=setTimeout(()=>stopReel(c),c.dur*1000); }); }));
    const tick=()=>{ if(!spin||spin.left<=0) return; sfx('tick'); spin.tick=setTimeout(tick,70); }; tick(); }
  else spin=null;
}
function pickChoice(i){
  const o=chCfg&&chCfg.options[i]; if(!o||state!=='choice') return;
  if(spin&&spin.left>0) return; if(performance.now()<ignoreClickUntil) return;
  spin=null; chCfg=null; $('choice').hidden=true; setState(choiceBack); o.act(); refreshControls();
}
function rerollChoice(){ if(!chCfg||!chCfg.reroll||spin&&spin.left>0||sortie.rerolls<1) return; sortie.rerolls--; sfx('click'); chCfg.reroll(); }
function stopReel(c){ if(!spin||c.done) return; c.done=true; clearTimeout(c.timer); c.reel.style.transition='none'; c.reel.style.transform=`translateY(${-c.n*REEL_H}px)`; c.b.classList.add('stop'); sfx('r_'+(c.rarity||'common')); spin.left--; if(c.rarity==='legendary') buzz(60); }
function skipSpin(){ if(!spin||spin.left<=0) return false; spin.cards.forEach(stopReel); ignoreClickUntil=performance.now()+350; return true; }
const freshPress=e=>performance.now()-choiceOpenT>=SKIP_GRACE&&!e.repeat;
const MOD_KEYS=['ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','MetaRight'];
$('choice').addEventListener('pointerdown',e=>{ if(freshPress(e)&&skipSpin()){ e.preventDefault(); e.stopPropagation(); } },true);
addEventListener('keydown',e=>{
  if(state!=='choice'||MOD_KEYS.includes(e.code)) return;
  // a press during the spin only skips it (number keys and R included); after the spin 1/2/3 pick and R rerolls
  if(spin&&spin.left>0){ if(freshPress(e)&&skipSpin()){ e.preventDefault(); e.stopPropagation(); } return; }
  if(e.repeat||performance.now()<ignoreClickUntil) return;
  const m=/^(?:Digit|Numpad)([1-9])$/.exec(e.code); if(m){ e.preventDefault(); e.stopPropagation(); pickChoice(+m[1]-1); return; }
  if(e.code==='KeyR'&&chCfg&&chCfg.reroll){ e.preventDefault(); e.stopPropagation(); rerollChoice(); }
},true);

/* ================= LEVEL-UP QUEUE ================= */
// level-ups and item swaps wait for the room to be clear (after the boss dies in boss rooms); never mid-fight. They open one after another
// before the door opens. choiceQ holds other queued choices (item swaps) as functions that open them.
const choiceQ=[];
function pumpChoices(){ if(state!=='fight'&&state!=='prep') return false;
  if(sortie.pendingLv>0){ showLevelUp(); return true; }
  if(choiceQ.length){ choiceQ.shift()(); return true; }
  return false; }
function showLevelUp(){
  sortie.pendingLv--;
  const roll=()=>skillOptions(3).map(id=>({...skillCard(id),act:()=>applySkill(id)}));
  const opts=roll();
  if(!opts.length){ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.2); return; }
  const more=sortie.pendingLv;
  const cfg={eyebrow:t('Pilot level {0}',Math.max(2,sortie.lv-more))+(more?' · '+t('{0} more queued',more):''),title:t('Skill roulette'),note:t('Skills last for the whole run.'),options:opts,spin:true};
  cfg.reroll=()=>{ cfg.options=roll(); openChoice(cfg); };
  openChoice(cfg);
}
function angelChoice(){
  const grace=player.rs.grace>0;
  if(grace){ player.hp=player.maxHp; sparks(player.pos.clone().setY(2),0x7dff9a,14,6); }
  const heal=Math.round(40*player.st.heal);
  const opts=[{icon:'heal',name:t('Repair'),desc:grace?t('Grace already repaired you. Take 15 extra max armor instead.'):t('Restore {0}% of your armor.',heal),tag:t('{0}/{1} now',Math.ceil(player.hp),player.maxHp),color:'#7dff9a',static:true,
    act:()=>{ if(grace){ player.extra.hpFlat=(player.extra.hpFlat||0)+15; recalcStats(); } else player.hp=Math.min(player.maxHp,player.hp+player.maxHp*heal/100); sparks(player.pos.clone().setY(2),0x7dff9a,12,6); npcGone(); }}];
  // Repair or one aggressive card (patch.md 34); Grace adds a second card from the whole pool
  const ag=skillOptions(1,null,player,RSK_AGGRO), more=grace?skillOptions(2).filter(id=>!ag.includes(id)).slice(0,1):[];
  [...ag,...more].forEach(id=>opts.push({...skillCard(id),act:()=>{ applySkill(id); npcGone(); }}));
  openChoice({eyebrow:t('Sanctuary'),title:t('The angel offers a blessing'),note:t('Pick one.'),options:opts,spin:true});
}
function devilChoice(){
  const free=Object.keys(CURSES).filter(c=>!sortie.curses.includes(c)), opts=[];
  while(opts.length<2&&free.length){ const id=free.splice((Math.random()*free.length)|0,1)[0], c=CURSES[id];
    opts.push({icon:c.icon,name:c.name,desc:c.d,tag:t('Curse · whole run'),color:'#e8243c',pv:bonusPreview(c.bonus),act:()=>{ applyCurse(id); sfx('lvup'); crossBlast(player.pos.clone(),0xe8243c,.8); npcGone(); }}); }
  opts.push({icon:'rear',name:t('Walk away'),desc:t('Keep things as they are. The offer is gone for good.'),tag:t('Decline'),color:'#a79fae',act:()=>npcGone()});
  openChoice({eyebrow:t('A flawless room draws attention'),title:t('The devil makes an offer'),note:t('Power now, at a price you pay until the run ends.'),options:opts});
}

/* ================= BUILD PANEL ================= */
// the skill / curse / item boxes: a small popover with details (hover on desktop, tap on phone; never click on desktop, left click fires)
function buildEntries(){ const out=[]; if(!player) return out;
  Object.entries(player.rs).forEach(([id,n])=>{ const d=RSK[id]; if(!d) return; const rk=Math.min(n,d.max);
    out.push({kind:'skill',id,icon:d.icon,name:d.name,cls:'r-'+d.rarity,sub:RARITY[d.rarity].n+' · '+t('Rank {0}/{1}',rk,d.max),effect:effectText(d.bonus,rk)||d.d,desc:d.bonus?t('{0} per rank.',d.d.replace(/\.$/,'')):''}); });
  if(sortie) sortie.curses.forEach(id=>{ const d=CURSES[id]; if(!d) return; out.push({kind:'curse',id,icon:d.icon,name:d.name,cls:'curse',sub:t('Devil curse · whole run'),effect:effectText(d.bonus,1,true)||d.d,cost:d.cost}); });
  if(sortie&&sortie.items) sortie.items.forEach(it=>{ const id=it.id||it, d=ITEMS[id]; if(!d) return; out.push({kind:'item',id,icon:d.icon,name:d.name,cls:'it r-'+d.rarity,sub:t('{0} item',RARITY[d.rarity].n),effect:d.d}); });
  return out; }
// "Damage +36% · Fire rate +13%" for a bonus at a rank (gains only for curses: the cost is listed on its own)
function effectText(bonus,rank,gainsOnly){ if(!bonus) return ''; const pc=v=>(v>=0?'+':'-')+Math.round(Math.abs(v)*100)+'%';
  return Object.entries(bonus).filter(([k,v])=>!gainsOnly||(k!=='taken'&&v>0)).map(([k,v])=>`${BUCKET_TXT[k]||k} ${k==='hpFlat'||k==='en'?'+'+Math.round(v*rank):k==='taken'?t('{0} taken',pc(v*rank)):pc(v*rank)}`).join(' · '); }
function hideRsPop(){ const p=$('rsPop'); if(p) p.hidden=true; }
function showRsPop(el){
  const en=buildEntries()[+el.dataset.i], p=$('rsPop'); if(!en||!p) return;
  p.innerHTML=`<b></b><small></small><span class="ef"></span>`; p.className='hud '+en.cls;
  p.querySelector('b').textContent=en.name; p.querySelector('small').textContent=en.sub; p.querySelector('.ef').textContent=en.effect;
  if(en.cost){ const c=document.createElement('span'); c.className='cost'; c.textContent=t('Cost: {0}',en.cost); p.appendChild(c); }
  p.hidden=false; const r=el.getBoundingClientRect(), w=p.offsetWidth, h=p.offsetHeight;
  p.style.left=clamp(r.right-w,8,innerWidth-w-8)+'px'; p.style.top=clamp(r.bottom+6,8,innerHeight-h-8)+'px';
}
(()=>{ const bar=$('rsBar');
  bar.addEventListener('pointerover',e=>{ if(e.pointerType!=='mouse') return; const s=e.target.closest('span[data-i]'); if(s) showRsPop(s); });
  bar.addEventListener('pointerout',e=>{ if(e.pointerType==='mouse'&&!bar.contains(e.relatedTarget)) hideRsPop(); });
  bar.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse') return; const s=e.target.closest('span[data-i]'); if(!s) return; e.stopPropagation(); const p=$('rsPop'); if(!p.hidden&&p.dataset.for===s.dataset.i){ hideRsPop(); return; } p.dataset.for=s.dataset.i; showRsPop(s); });
  addEventListener('pointerdown',e=>{ if(!e.target.closest||!e.target.closest('#rsBar')) hideRsPop(); },true);
})();
// pause screen: the whole build with details, plus the stat buckets it adds up to
function renderPauseBuild(){
  const el=$('pauseBuild'); if(!el) return; el.innerHTML=''; if(!player) return;
  const b=player.bonus||{}, st=document.createElement('div'); st.className='bStats';
  st.textContent=['dmg','rate','crit','hp','spd','dodge'].map(k=>`${BUCKET_TXT[k]} ${bucketVal(k,b)}`).join(' · ');
  el.appendChild(st);
  const list=buildEntries(); if(!list.length){ const n=document.createElement('p'); n.className='note'; n.textContent=t('No run skills yet. Level up by clearing rooms.'); el.appendChild(n); return; }
  list.forEach(en=>{ const r=document.createElement('div'); r.className='bRow '+en.cls; r.innerHTML=`<span class="bi">${svg(en.icon)}</span><span class="bt"><b></b><small></small><span></span></span>`;
    r.querySelector('b').textContent=en.name; r.querySelector('small').textContent=en.sub; r.querySelector('.bt span').textContent=en.effect+(en.cost?' · '+t('Cost: {0}',en.cost):''); el.appendChild(r); });
}
