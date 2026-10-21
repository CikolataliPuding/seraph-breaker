// Seraph Breaker · skills.js: Run XP, skill roulette (rarity, synergy, reels, reroll), angel and devil offers, orbits and skill effects.
/* ================= RUN SKILLS / XP ================= */
// tuned for 30-50 room runs: frequent level-ups early, without maxing everything by mid-run
const xpNeed=()=>5+Math.floor(sortie.lv*2.6);
function gainXp(v){ if(!sortie) return; sortie.xp+=v; while(sortie.xp>=xpNeed()){ sortie.xp-=xpNeed(); sortie.lv++; sortie.pendingLv++; } }
const skillOk=id=>{ const s=RSK[id]; return (player.rs[id]||0)<s.max&&(!s.req||s.req(player.rs)); };
// Lucky Coin pushes every roll one tier up
function rarityWeights(){ const l=player.luck||0; return l?{common:Math.max(20,60-15*l),rare:28+5*l,epic:10+6*l,legendary:2+4*l}:{common:60,rare:28,epic:10,legendary:2}; }
/* weighted pick: rarity weights 60/28/10/2 are shared by the skills of that rarity that can still be offered;
   skills you own (and evolutions you unlocked) get x2.5; if any owned skill can rank up, one of the cards is always such an upgrade */
function skillOptions(n,rarity){
  const rw=rarityWeights(), ids=Object.keys(RSK).filter(id=>skillOk(id)&&(!rarity||RSK[id].rarity===rarity));
  const cnt={}; ids.forEach(id=>cnt[RSK[id].rarity]=(cnt[RSK[id].rarity]||0)+1);
  const w=id=>{ const r=RSK[id].rarity; return rw[r]/cnt[r]*((player.rs[id]||RSK[id].evo)?2.5:1); };
  const pick=list=>{ let t=0; list.forEach(id=>t+=w(id)); let x=Math.random()*t; for(const id of list){ x-=w(id); if(x<=0) return id; } return list[list.length-1]; };
  const out=[], pool=ids.slice(), ups=pool.filter(id=>player.rs[id]);
  if(ups.length&&n>1&&!rarity){ const id=pick(ups); out.push(id); pool.splice(pool.indexOf(id),1); }
  while(out.length<n&&pool.length){ const id=pick(pool); out.push(id); pool.splice(pool.indexOf(id),1); }
  for(let i=out.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [out[i],out[j]]=[out[j],out[i]]; }
  return out;
}
function applySkill(id,silent){
  const s=RSK[id]; if(!s) return; const rs=player.rs; rs[id]=(rs[id]||0)+1;
  if(s.apply) s.apply(player,rs[id]);
  if(!silent){ renderRunSkills(); sfx('lvup'); if(s.rarity==='legendary'){ popText('EVOLVED'); crossBlast(player.pos.clone(),0xffc83a,1); } }
}
function applyCurse(id,silent){ const c=CURSES[id]; if(!c||sortie.curses.includes(id)) return; sortie.curses.push(id); if(c.apply) c.apply(player,silent); buildRule(); if(!silent) renderRunSkills(); }
// skill + curse + item icons (HUD row and result screen)
function runIcons(){ const out=[]; if(!player) return out;
  Object.entries(player.rs).forEach(([id,n])=>{ const d=RSK[id]; if(!d) return; const s=document.createElement('span'); s.className='r-'+d.rarity; s.title=d.name; s.innerHTML=svg(d.icon); if(n>1){ const b=document.createElement('b'); b.textContent=n; s.appendChild(b); } out.push(s); });
  if(sortie) sortie.curses.forEach(id=>{ const d=CURSES[id]; if(!d) return; const s=document.createElement('span'); s.className='curse'; s.title=d.name; s.innerHTML=svg(d.icon); out.push(s); });
  if(sortie&&sortie.items) sortie.items.forEach(it=>{ const d=typeof ITEMS!=='undefined'&&ITEMS[it.id||it]; if(!d) return; const s=document.createElement('span'); s.className='it r-'+d.rarity; s.title=d.name; s.innerHTML=svg(d.icon); out.push(s); });
  return out; }
function renderRunSkills(){ const bar=$('rsBar'); bar.innerHTML=''; bar.append(...runIcons()); }
function skillCard(id,extra){ const s=RSK[id], rk=player.rs[id]||0; return {id,icon:s.icon,name:s.name,desc:s.d+(extra||''),rarity:s.rarity,tag:`${RARITY[s.rarity].n} · `+(rk?`Rank ${rk+1}/${s.max}`:'New')}; }

/* ================= ORBITS + WINGMAN ================= */
function buildOrbit(){
  orbitG.children.slice().forEach(c=>orbitG.remove(c)); if(!player) return; const rs=player.rs, inf=rs.inferno>0;
  const nb=(rs.orbit||0)*2+(inf?2:0);
  for(let i=0;i<nb;i++){ const b=new THREE.Mesh(G.blade,addMat(inf?0xff7a2a:unit.shot,.9)); if(inf) b.scale.set(1.5,1.4,1.8); b.userData={k:'blade'}; orbitG.add(b); }
  const orb=(k,c,n)=>{ for(let i=0;i<n;i++){ const m=new THREE.Mesh(G.orb,addMat(c,.95)); m.scale.setScalar(1.25); m.add(new THREE.Mesh(G.puff,addMat(c,.3))); m.userData={k,zap:0}; orbitG.add(m); } };
  orb('fire',0xff7a2a,rs.forb||0); orb('ice',0x9fe8ff,rs.iorb||0); orb('bolt',0xd8f4ff,rs.borb||0);
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
    const rad=k==='blade'?(inf?.75:.4):.55;
    for(const e of enemies){ if(e.dead||e.dropY>0) continue; if(Math.hypot(e.pos.x-b.position.x,e.pos.z-b.position.z)<e.r*.7+rad){
      if(k==='blade'){ hitEnemy(e,(inf?28:16)*p.st.dmg*dt,e.pos,true); if(inf) e.burn=Math.max(e.burn,1.5); }
      else if(k==='fire'){ hitEnemy(e,10*p.st.dmg*dt,e.pos,true); e.burn=Math.max(e.burn,2); }
      else { hitEnemy(e,8*p.st.dmg*dt,e.pos,true); e.slow=Math.max(e.slow,1.2); }
      if(Math.random()<dt*10) sparks(b.position,k==='ice'?0x9fe8ff:k==='blade'&&!inf?unit.shot:0xff7a2a,1,3); break; } } }
  // Storm Halo: lightning strikes the 3 nearest enemies every second
  if(p.rs.halo){ p.haloT=(p.haloT||0)-dt; if(p.haloT<=0){ p.haloT=1; const hit=new Set(); for(let i=0;i<3;i++){ const t=nearestFoe(p.pos,12,null,hit); if(!t) break; hit.add(t); const top=t.pos.clone().setY(9); bolt(top,t.pos.clone().setY(1.5),0xd8f4ff); bolt(top.clone().setX(top.x+.4),t.pos.clone().setY(1.5),0xffffff); hitEnemy(t,8*p.st.dmg,t.pos.clone().setY(2),false,true); if(t!==boss) t.stun=Math.max(t.stun,.25); } if(hit.size) sfx('zap'); } }
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
function queueBlast(x,z,o){ if(blasts.length>=40) return; const ring=new THREE.Mesh(G.ring,addMat(o.color||0xff6a1a,.9)); ring.rotation.x=-Math.PI/2; ring.position.set(x,.07,z); ring.scale.setScalar(o.rad); scene.add(ring); blasts.push({x,z,t:o.t||.15,max:o.t||.15,rad:o.rad,dmg:o.dmg,color:o.color||0xff6a1a,hurtP:o.hurtP||0,hurtE:o.hurtE!==false,size:o.size||.8,ring,skip:o.skip||null,flat:!!o.flat}); }
function updateBlasts(dt){
  for(let i=blasts.length-1;i>=0;i--){ const b=blasts[i]; b.t-=dt; const k=1-b.t/b.max; b.ring.material.opacity=.4+Math.sin(k*30)*.3; b.ring.scale.setScalar(b.rad*(1.15-k*.15));
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
// cards spin like slot reels (result is decided before the spin); a tap, click or key skips the spin.
// Only a fresh press that starts after the screen opened (plus a short grace) counts: held keys auto-repeat and held mouse buttons are ignored.
let spin=null, ignoreClickUntil=0, choiceOpenT=0;
const REEL_H=46, SKIP_GRACE=250;
function openChoice(cfg){
  if(state!=='choice') choiceBack=state; state='choice'; choiceOpenT=performance.now(); resetTouch(); for(const k in keys)keys[k]=false; mouseDown=rightDown=false;
  $('chEye').textContent=cfg.eyebrow; $('chTitle').textContent=cfg.title; $('chNote').textContent=cfg.note||'';
  const rr=$('chReroll'); rr.hidden=!cfg.reroll; if(cfg.reroll){ rr.textContent=`Reroll · ${sortie.rerolls} left`; rr.disabled=sortie.rerolls<1; rr.onclick=()=>{ if(spin&&spin.left>0||sortie.rerolls<1) return; sortie.rerolls--; sfx('click'); cfg.reroll(); }; }
  const list=$('chList'); list.innerHTML='';
  const ids=Object.keys(RSK);
  spin={cards:[],left:0,tick:0};
  cfg.options.forEach((o,i)=>{ const b=document.createElement('button'); b.className='card rcard'+(o.rarity?' rr-'+o.rarity:''); b.id='ch'+i;
    b.style.setProperty('--c',o.rarity?RARITY[o.rarity].c:(o.color||'var(--signal)'));
    b.innerHTML=`<div class="reelWin"><div class="reel"></div></div><div class="tag"></div><p></p>`;
    const reel=b.querySelector('.reel'), doSpin=cfg.spin&&!o.static;
    const ent=(icon,name)=>{ const d=document.createElement('div'); d.className='ent'; d.innerHTML=`<div class="ic">${svg(icon)}</div><div class="n"></div>`; d.querySelector('.n').textContent=name; reel.appendChild(d); };
    const n=doSpin?10+i*3:0; for(let k=0;k<n;k++){ const f=RSK[pickOne(ids)]; ent(f.icon,f.name); } ent(o.icon,o.name);
    b.querySelector('.tag').textContent=o.tag||''; b.querySelector('p').textContent=o.desc;
    b.onclick=()=>{ if(spin&&spin.left>0) return; if(performance.now()<ignoreClickUntil) return; spin=null; $('choice').hidden=true; state=choiceBack; o.act(); refreshControls(); };
    list.appendChild(b);
    if(doSpin){ spin.left++; const dur=.5+i*.17; spin.cards.push({b,reel,n,dur,rarity:o.rarity}); reel.style.transform='translateY(0)'; }
    else b.classList.add('stop');
  });
  $('choice').hidden=false; refreshControls();
  if(spin.left){ requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(!spin) return; spin.cards.forEach(c=>{ c.reel.style.transition=`transform ${c.dur}s cubic-bezier(.12,.8,.22,1)`; c.reel.style.transform=`translateY(${-c.n*REEL_H}px)`; c.timer=setTimeout(()=>stopReel(c),c.dur*1000); }); }));
    const tick=()=>{ if(!spin||spin.left<=0) return; sfx('tick'); spin.tick=setTimeout(tick,70); }; tick(); }
  else spin=null;
  setTimeout(()=>{ const f=$('ch0'); if(f&&!mobileMode) f.focus(); },50);
}
function stopReel(c){ if(!spin||c.done) return; c.done=true; clearTimeout(c.timer); c.reel.style.transition='none'; c.reel.style.transform=`translateY(${-c.n*REEL_H}px)`; c.b.classList.add('stop'); sfx('r_'+(c.rarity||'common')); spin.left--; if(c.rarity==='legendary') buzz(60); }
function skipSpin(){ if(!spin||spin.left<=0) return false; spin.cards.forEach(stopReel); ignoreClickUntil=performance.now()+350; return true; }
const freshPress=e=>performance.now()-choiceOpenT>=SKIP_GRACE&&!e.repeat;
$('choice').addEventListener('pointerdown',e=>{ if(freshPress(e)&&skipSpin()){ e.preventDefault(); e.stopPropagation(); } },true);
addEventListener('keydown',e=>{ if(state!=='choice'||!spin) return; if(['ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','MetaRight'].includes(e.code)) return; if(freshPress(e)&&skipSpin()){ e.preventDefault(); e.stopPropagation(); } },true);

function showLevelUp(){
  sortie.pendingLv--;
  const roll=()=>{ const opts=skillOptions(3).map(id=>({...skillCard(id),act:()=>applySkill(id)})); return opts; };
  const opts=roll();
  if(!opts.length){ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.2); return; }
  const cfg={eyebrow:`Pilot level ${Math.max(2,sortie.lv-sortie.pendingLv)}`,title:'Skill roulette',note:'Skills last for the whole run.',options:opts,spin:true};
  cfg.reroll=()=>{ cfg.options=roll(); openChoice(cfg); };
  openChoice(cfg);
}
function angelChoice(){
  const grace=player.rs.grace>0;
  if(grace){ player.hp=player.maxHp; sparks(player.pos.clone().setY(2),0x7dff9a,14,6); }
  const heal=Math.round(40*player.st.heal);
  const opts=[{icon:'heal',name:'Repair',desc:grace?'Grace already repaired you. Take 15 extra max armor instead.':`Restore ${heal}% of your armor.`,tag:`${Math.ceil(player.hp)}/${player.maxHp} now`,color:'#7dff9a',static:true,
    act:()=>{ if(grace){ player.maxHp+=15; player.hp+=15; } else player.hp=Math.min(player.maxHp,player.hp+player.maxHp*heal/100); sparks(player.pos.clone().setY(2),0x7dff9a,12,6); npcGone(); }}];
  skillOptions(grace?3:2).forEach(id=>opts.push({...skillCard(id),act:()=>{ applySkill(id); npcGone(); }}));
  openChoice({eyebrow:'Sanctuary',title:'The angel offers a blessing',note:'Pick one.',options:opts,spin:true});
}
function devilChoice(){
  const free=Object.keys(CURSES).filter(c=>!sortie.curses.includes(c)), opts=[];
  while(opts.length<2&&free.length){ const id=free.splice((Math.random()*free.length)|0,1)[0], c=CURSES[id]; opts.push({icon:c.icon,name:c.name,desc:c.d,tag:'Curse · lasts the whole run',color:'#e8243c',act:()=>{ applyCurse(id); sfx('lvup'); crossBlast(player.pos.clone(),0xe8243c,.8); npcGone(); }}); }
  opts.push({icon:'rear',name:'Walk away',desc:'Keep things as they are. The offer is gone for good.',tag:'Decline',color:'#a79fae',act:()=>npcGone()});
  openChoice({eyebrow:'A flawless room draws attention',title:'The devil makes an offer',note:'Power now, at a price you pay until the run ends.',options:opts});
}
