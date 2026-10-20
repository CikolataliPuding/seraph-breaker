// Seraph Breaker · skills.js: In-level XP, run skills (level-up, angel and devil choices).
/* ================= RUN SKILLS / XP ================= */
const xpNeed=()=>4+sortie.lv*3;
function gainXp(v){ if(!sortie) return; sortie.xp+=v; while(sortie.xp>=xpNeed()){ sortie.xp-=xpNeed(); sortie.lv++; sortie.pendingLv++; } }
function skillOptions(n){ const ids=Object.keys(RSK).filter(id=>(player.rs[id]||0)<RSK[id].max); const out=[]; while(out.length<n&&ids.length){ out.push(ids.splice((Math.random()*ids.length)|0,1)[0]); } return out; }
function applySkill(id){
  const rs=player.rs; rs[id]=(rs[id]||0)+1; const p=player;
  if(id==='atk') p.st.dmg*=1.18;
  if(id==='sig') p.st.rate*=.87;
  if(id==='armor'){ p.maxHp=Math.round(p.maxHp*1.2); p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.2*p.st.heal); }
  if(id==='regen') p.st.regen*=1.4;
  if(id==='dash') p.st.spd*=1.12;
  if(id==='crit') p.st.crit+=.1;
  if(id==='orbit') buildOrbit();
  renderRunSkills(); sfx('lvup');
}
function renderRunSkills(){ const bar=$('rsBar'); bar.innerHTML=''; if(!player) return; Object.entries(player.rs).forEach(([id,n])=>{ const s=document.createElement('span'); s.title=RSK[id].name; s.innerHTML=svg(RSK_IC[id]); if(n>1){ const b=document.createElement('b'); b.textContent=n; s.appendChild(b); } bar.appendChild(s); }); }
function buildOrbit(){ orbitG.children.slice().forEach(c=>orbitG.remove(c)); const n=(player.rs.orbit||0)*2; for(let i=0;i<n;i++){ const b=new THREE.Mesh(G.blade,addMat(unit.shot,.9)); orbitG.add(b); } }
function skillCard(id,extra){ return {id,icon:RSK_IC[id],name:RSK[id].name,desc:RSK[id].d+(extra||''),tag:(player.rs[id]?`Rank ${player.rs[id]+1}/${RSK[id].max}`:'New')}; }
function openChoice(cfg){
  choiceBack=state; state='choice'; resetTouch(); for(const k in keys)keys[k]=false; mouseDown=rightDown=false;
  $('chEye').textContent=cfg.eyebrow; $('chTitle').textContent=cfg.title; $('chNote').textContent=cfg.note||'';
  const list=$('chList'); list.innerHTML='';
  cfg.options.forEach((o,i)=>{ const b=document.createElement('button'); b.className='card'; b.id='ch'+i; if(o.color) b.style.setProperty('--c',o.color);
    b.innerHTML=`<div class="top"><div class="ic">${svg(o.icon)}</div><div><div class="n"></div><div class="tag"></div></div></div><p></p>`;
    b.querySelector('.n').textContent=o.name; b.querySelector('.tag').textContent=o.tag||''; b.querySelector('p').textContent=o.desc;
    b.onclick=()=>{ $('choice').hidden=true; state=choiceBack; o.act(); refreshControls(); };
    list.appendChild(b); });
  $('choice').hidden=false; refreshControls();
  setTimeout(()=>{ const f=$('ch0'); if(f&&!isTouch) f.focus(); },50);
}
function showLevelUp(){
  sortie.pendingLv--;
  const opts=skillOptions(3).map(id=>({...skillCard(id),color:'#7dff9a',act:()=>applySkill(id)}));
  if(!opts.length){ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.2); return; }
  openChoice({eyebrow:`Pilot level ${sortie.lv}`,title:'Choose a skill',note:'Skills last until this level ends.',options:opts});
}
function angelChoice(){
  const heal=Math.round(40*player.st.heal);
  const opts=[{icon:'heal',name:'Repair',desc:`Restore ${heal}% of your armor.`,tag:`${Math.ceil(player.hp)}/${player.maxHp} now`,color:'#7dff9a',act:()=>{ player.hp=Math.min(player.maxHp,player.hp+player.maxHp*heal/100); sparks(player.pos.clone().setY(2),0x7dff9a,12,6); npcGone(); }}];
  skillOptions(2).forEach(id=>opts.push({...skillCard(id),color:'#ffe14a',act:()=>{ applySkill(id); npcGone(); }}));
  openChoice({eyebrow:'Sanctuary',title:'The angel offers a blessing',note:'Pick one.',options:opts});
}
function devilChoice(){
  const opts=skillOptions(2).map(id=>({...skillCard(id,' Costs 20% max armor.'),color:'#e8243c',act:()=>{ player.maxHp=Math.max(30,Math.round(player.maxHp*.8)); player.hp=Math.min(player.hp,player.maxHp); applySkill(id); npcGone(); }}));
  opts.push({icon:'rear',name:'Walk away',desc:'Keep your armor. The offer is gone for good.',tag:'Decline',color:'#a79fae',act:()=>npcGone()});
  openChoice({eyebrow:'A flawless room draws attention',title:'The devil makes an offer',note:'Power now, at the cost of max armor.',options:opts});
}
