// Seraph Breaker · ui-warmap.js: Arena select, plus the armory, skill tree, frames and system panels.
/* ================= ARENA SELECT ================= */
function renderMap(){
  const sel=openSel(P.selArena); P.selArena=sel;
  $('mapProg').textContent=`ARENAS · ${openArenaCount()}/${ARENAS.length} OPEN`;
  const inner=$('mapInner'); inner.innerHTML='';
  // beta: the Main Stage shows locked with a beta tag until its access code is entered in System (tester.js)
  ARENAS.forEach((A,i)=>{ const locked=!arenaOpen(i), beta=!!A.stage&&!stageOK(), best=P.bestRoom[i]||0, done=best>=A.rooms;
    const b=document.createElement('button'); b.className='arena'+(locked?' lock':'')+(i===sel?' sel':'')+(done?' done':''); b.id='ar'+i; b.style.setProperty('--c',A.colorCss);
    b.innerHTML=`<span class="n"></span><b></b><span class="r"></span><span class="bp"></span><span class="pr"><i style="width:${Math.min(100,best/A.rooms*100)}%"></i></span>`;
    b.querySelector('.n').textContent=`0${i+1} · ${roomsLabel(A)}`+(locked?' · LOCKED':done?' · CLEARED':'')+(A.stage?' · BETA':'');
    b.querySelector('b').textContent=A.name; b.querySelector('.r').textContent=beta?'Beta: enter the access code in System to open it':locked?`Clear ${ARENAS[i-1].name} to unlock`:`Best room ${best}/${A.rooms} · ${A.ruleTxt}`;
    const bp=b.querySelector('.bp'); arenaBossPool(i).slice(0,i===3?7:3).forEach(k=>{ const img=document.createElement('img'); img.src=PORTRAIT[k]||''; img.alt=BOSSES[k].name; img.title=BOSSES[k].name; bp.appendChild(img); });
    b.onclick=()=>{ if(locked) return; P.selArena=i; sfx('click'); delete $('launchBtn').dataset.arm; renderMap(); };
    inner.appendChild(b); });
  const A=ARENAS[sel], first=(P.bestRoom[sel]||0)<A.rooms, fm=farmMul(sel);
  $('shEye').textContent=`ARENA 0${sel+1} · ${roomsLabel(A)}`+(fm<1?` · REWARDS ${Math.round(fm*100)}%`:''); $('shEye').style.color=A.colorCss; $('shName').textContent=A.name;
  $('shReward').innerHTML=`<i></i>+${first?ECON.firstClear(sel):Math.round(ECON.repeatClear(sel)*fm)}${first?' first clear':''}`;
  const rooms=$('shRooms'); rooms.innerHTML=''; const t=document.createElement('span'); t.textContent=A.stage?`WAVE ROOMS 1-${A.rooms-1}`:'ROOMS 1-10'; rooms.appendChild(t);
  // Main Stage: S sound check rooms, M rooms with Moshpit waves, E rooms that end in an Encore, then the boss
  if(A.stage){ for(let n=1;n<=A.rooms;n++){ const i=document.createElement('i'), boss=n===A.rooms, enc=n>=STAGE.encore.from, mo=n>=STAGE.mosh.from;
    i.textContent=boss?'B':enc?'E':mo?'M':'S'; i.className=boss?'b':enc?'e':mo?'s':''; i.title=boss?'High-Co':`${STAGE.waves[n-1]} waves · `+(enc?'ends in an Encore':mo?'Sound check + Moshpit':'Sound check'); rooms.appendChild(i); } }
  // other arenas: one 10-room block of PACING: C combat, ! a special room (ambush, waves, survive, hunt, traps, dark), T the next boss's teaching room
  else for(let n=1;n<=10;n++){ const c=PACING[n], i=document.createElement('i'), sp=c.kinds&&c.kinds.some(k=>k!=='normal'&&k!=='teach');
    i.textContent=c.boss?'B':c.angel?'A':c.elite?'E':c.kinds.includes('teach')?'T':sp?'!':'C'; i.className=c.boss?'b':c.angel?'a':c.elite?'e':sp?'s':''; i.title=c.kinds?c.kinds.map(k=>ROOM_KINDS[k].name).join(' / '):''; rooms.appendChild(i); }
  const tags=$('shTags'); tags.innerHTML='';
  A.mobs.filter(e=>ENEMY[e]).forEach(e=>{ const s=document.createElement('span'); s.textContent=ENEMY[e].name; tags.appendChild(s); });
  const r=document.createElement('span'); r.style.borderColor=A.colorCss; r.style.color=A.colorCss; r.textContent=A.ruleTxt; tags.appendChild(r);
  if(!$('launchBtn').dataset.arm) $('launchBtn').textContent=`Launch ${A.name} ▸`;
}

/* armory / skills / frames / system */
let armed=null;
function renderArmory(){
  $('aGems').textContent=P.gems;
  const mk=(grid,defs,kind)=>{ grid.innerHTML='';
    Object.entries(defs).forEach(([id,d])=>{
      const owned=id==='sig'||P.owned[id], eq=kind==='w'?P.weapon===id:P.gadgets.includes(id);
      const c=document.createElement('div'); c.className='card'+(eq?' eq':'');
      c.innerHTML=`<div class="top"><div class="ic">${svg(id)}</div><div><div class="n"></div><div class="tag"></div></div></div><p></p><div class="ft"></div>`;
      c.querySelector('.n').textContent=d.name; c.querySelector('.tag').textContent=d.tag+(kind==='g'?` · ${d.cd}s cooldown`:''); c.querySelector('p').textContent=d.d;
      const ft=c.querySelector('.ft');
      if(!owned){
        const pr=document.createElement('span'); pr.className='cur gem'; pr.innerHTML=`<i></i>${d.price}`; ft.appendChild(pr);
        const bt=document.createElement('button'); bt.className='btn sm'; bt.id='buy_'+id;
        const key=kind+id; bt.textContent=armed===key?`Confirm · ${d.price}`:'Buy'; bt.disabled=P.gems<d.price;
        bt.onclick=()=>{ if(armed!==key){ armed=key; sfx('click'); renderArmory(); return; } armed=null; if(P.gems<d.price) return; P.gems-=d.price; P.owned[id]=true; if(kind==='w') P.weapon=id; else { const s=P.gadgets.indexOf(''); if(s>=0) P.gadgets[s]=id; } sfx('gem'); persist(); renderMenu(); };
        ft.appendChild(bt);
        if(P.gems<d.price){ const n=document.createElement('span'); n.className='tag'; n.textContent=`Need ${d.price-P.gems} more`; ft.appendChild(n); }
      } else if(kind==='w'){
        const bt=document.createElement('button'); bt.className='btn sm'+(eq?' ghost':''); bt.id='eq_'+id; bt.textContent=eq?'Equipped':'Equip'; bt.disabled=eq;
        bt.onclick=()=>{ P.weapon=id; sfx('click'); persist(); renderMenu(); }; ft.appendChild(bt);
      } else {
        [0,1].forEach(s=>{ const on=P.gadgets[s]===id; const bt=document.createElement('button'); bt.className='btn sm'+(on?'':' ghost'); bt.id=`sl_${id}_${s}`; bt.textContent=on?`Slot ${s+1} ✕`:`Slot ${s+1}`;
          bt.onclick=()=>{ if(on) P.gadgets[s]=''; else { const o=P.gadgets.indexOf(id); if(o>=0) P.gadgets[o]=''; P.gadgets[s]=id; } sfx('click'); persist(); renderMenu(); }; ft.appendChild(bt); });
      }
      grid.appendChild(c);
    }); };
  mk($('gridW'),WEAPONS,'w'); mk($('gridG'),GADGETS,'g');
}
function renderCore(){
  const el=$('coreHangar'); el.innerHTML='';
  Object.entries(CORE).forEach(([k,d])=>{ const lv=P.core[k], max=lv>=CORE_MAX, cost=coreCost(lv);
    const b=document.createElement('button'); b.className='coreRow'+(max?' max':'')+(!max&&P.gold<cost?' poor':''); b.id='core_'+k;
    b.innerHTML=`<span class="ic">${svg(d.icon)}</span><span class="t"><b></b><small></small></span><span class="lv"></span><span class="cost"></span>`;
    b.querySelector('b').textContent=d.name; b.querySelector('small').textContent=`${d.d} · now +${lv*d.per}${d.unit}`;
    b.querySelector('.lv').textContent=`${lv}/${CORE_MAX}`;
    b.querySelector('.cost').innerHTML=max?'MAXED':`<span class="cur gold"><i></i>${cost.toLocaleString()}</span>`;
    b.disabled=max; b.onclick=()=>{ if(max||P.gold<cost) return; P.gold-=cost; P.core[k]=lv+1; sfx('gem'); persist(); renderMenu(); };
    el.appendChild(b); });
}
function renderTree(container){
  renderCore();
  $('sGold').textContent=P.gold.toLocaleString(); container.innerHTML=''; const wrap=document.createElement('div'); wrap.className='tree';
  TREE.forEach(br=>{ const col=document.createElement('div'); col.className='branch'; col.style.setProperty('--c',br.c); const h=document.createElement('h3'); h.textContent=br.branch; col.appendChild(h);
    br.nodes.forEach((n,i)=>{ const rk=P.skills[n.id]||0, unlocked=i===0||(P.skills[br.nodes[i-1].id]||0)>0, max=rk>=n.max, cost=max?0:n.cost[rk];
      const b=document.createElement('button'); b.className='node'+(rk>0?' on':'')+(unlocked?'':' lock')+(max?' max':'')+(!max&&P.gold<cost?' poor':''); b.id='sk_'+n.id;
      b.innerHTML=`<span class="t"><b></b><span class="npips">${Array.from({length:n.max},(_,j)=>`<i class="${j<rk?'f':''}"></i>`).join('')}</span></span><small></small><span class="cost"></span>`;
      b.querySelector('b').textContent=n.name; b.querySelector('small').textContent=n.d;
      b.querySelector('.cost').innerHTML=max?'MAXED':!unlocked?'<span class="tag">Locked</span>':`<span class="cur gold"><i></i>${cost.toLocaleString()}</span>`;
      if(!unlocked||max) b.disabled=true;
      b.onclick=()=>{ if(!unlocked||max||P.gold<cost) return; P.gold-=cost; P.skills[n.id]=rk+1; sfx('gem'); persist(); renderMenu(); };
      col.appendChild(b); });
    wrap.appendChild(col); });
  container.appendChild(wrap);
}
function renderFrames(){
  const u=UNITS[P.unit],c=paint();
  $('pilotIn').value=P.pilot; $('pvUnit').textContent=u.name; $('pvSp').textContent='SP · '+SPECIALS[P.unit].name;
  const fr=$('frames'); fr.innerHTML='';
  Object.values(UNITS).forEach(x=>{ const bt=document.createElement('button'); bt.className='frame'; bt.id='fr_'+x.key; bt.style.setProperty('--c',CSS(x.key==='verdant'?x.c2:x.c1)); bt.setAttribute('aria-pressed',x.key===P.unit);
    bt.innerHTML=`<span class="n">${x.name}</span><span class="r">${x.role}</span><span class="r">SP · ${SPECIALS[x.key].name}</span>`;
    bt.onclick=()=>{ P.unit=x.key; P.c1=null; P.c2=null; sfx('click'); rebuildPreview(); renderMenu(); persist(); }; fr.appendChild(bt); });
  const sw=(el,list,cur,key)=>{ el.innerHTML=''; list.forEach((col,i)=>{ const bt=document.createElement('button'); bt.id=key+'_'+i; bt.style.setProperty('--c',CSS(col)); bt.setAttribute('aria-label','Paint '+CSS(col)); bt.setAttribute('aria-pressed',col===cur); bt.onclick=()=>{ P[key]=col; sfx('click'); rebuildPreview(); renderMenu(); persist(); }; el.appendChild(bt); }); };
  sw($('sw1'),PAINT1,c.c1,'c1'); sw($('sw2'),PAINT2,c.c2,'c2');
  const lo=$('loadout'); lo.innerHTML='';
  const item=(icon,label,name,go)=>{ const bt=document.createElement('button'); bt.className='lo'; bt.innerHTML=`${svg(icon)}<span><small>${label}</small><b></b></span>`; bt.querySelector('b').textContent=name; bt.onclick=go; lo.appendChild(bt); };
  const w=P.weapon; item(w,'Weapon',w==='sig'?{azure:'Rapid rifle',crimson:'Scatter cannon',verdant:'Pierce lance'}[P.unit]:WEAPONS[w].name,()=>openView('armory'));
  item('sp','Special',SPECIALS[P.unit].name,()=>{});
  [0,1].forEach(i=>{ const g=P.gadgets[i]; item(g||'hook','Gadget '+(i+1),g?GADGETS[g].name:'Empty slot',()=>openView('armory')); });
}
function renderSystem(){ $('buildTxt').textContent='Build '+BUILD+'.'; renderTester(); renderStageCode(); $('volM').value=Math.round(P.music*100); $('volMo').textContent=Math.round(P.music*100); $('volS').value=Math.round(P.sfx*100); $('volSo').textContent=Math.round(P.sfx*100);
  document.querySelectorAll('#ctrlSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===P.ctrl)); document.querySelectorAll('#shSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===P.mshield)); $('autoG').checked=P.autoGadget; }
document.querySelectorAll('#ctrlSeg button').forEach(b=>b.onclick=()=>{ P.ctrl=b.dataset.c; sfx('click'); persist(); setMode(); renderSystem(); });
document.querySelectorAll('#shSeg button').forEach(b=>b.onclick=()=>{ P.mshield=b.dataset.s; sfx('click'); persist(); renderSystem(); refreshControls(); });
$('autoG').onchange=e=>{ P.autoGadget=e.target.checked; persist(); };
$('pilotIn').addEventListener('input',e=>{ const v=e.target.value.replace(/[^\p{L}\p{N} _\-.]/gu,'').slice(0,14); if(v!==e.target.value) e.target.value=v; P.pilot=v.trim(); $('whoName').textContent=P.pilot||'[CALLSIGN]'; });
$('pilotIn').addEventListener('change',()=>persist());
$('volM').oninput=e=>{ P.music=e.target.value/100; $('volMo').textContent=e.target.value; setVolumes(); };
$('volS').oninput=e=>{ P.sfx=e.target.value/100; $('volSo').textContent=e.target.value; setVolumes(); };
$('volM').onchange=$('volS').onchange=()=>persist();
$('fsBtn').onclick=()=>{ try{ const r=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen(); r&&r.catch&&r.catch(()=>{}); }catch(e){} };
// Reset my progress: a fresh pilot, but the beta badge, the tester code (and its flag) and the Main Stage access code stay
let resetArm=false;
$('resetBtn').onclick=()=>{ if(!resetArm){ resetArm=true; $('resetBtn').textContent='Tap again to erase your progress'; setTimeout(()=>{ resetArm=false; $('resetBtn').textContent='Reset my progress'; },4000); return; }
  const keep={rev:P.rev,beta:P.beta,testerCode:P.testerCode,testerSave:P.testerSave,testerTools:P.testerTools,stageCode:P.stageCode}; P=freshP(); Object.assign(P,keep); resetArm=false; $('resetBtn').textContent='Reset my progress'; clearRun(); persist(); rebuildPreview(); renderMenu(); };
/* tester code: only its SHA-256 is in the code (tester.js). Unlocked: a toggle for the in-game tester tools (reloads the page). */
function renderTester(){ const ok=testerOK(), n=$('testerNote'); $('testerToolsL').hidden=!ok; $('testerTools').checked=P.testerTools; $('testerBtn').textContent=ok?'Lock':'Unlock';
  $('testerIn').hidden=ok; n.className='note'+(ok?' ok':''); n.textContent=ok?'Tester mode unlocked. Runs with tester tools are flagged and never count for rankings.':'For testers only. Tester runs are flagged and never count for rankings.'; }
$('testerBtn').onclick=()=>{ if(testerOK()){ lockTester(); renderTester(); if(DEBUG) location.reload(); return; }
  const ok=unlockTester($('testerIn').value); $('testerIn').value=''; renderTester(); if(!ok){ const n=$('testerNote'); n.className='note bad'; n.textContent='That code is not valid.'; } sfx('click'); };
$('testerIn').addEventListener('keydown',e=>{ if(e.code==='Enter') $('testerBtn').click(); });
$('testerTools').onchange=e=>{ P.testerTools=e.target.checked; persist(); location.reload(); };
/* Main Stage access code (tester.js): only its SHA-256 is in the code. Unlocked: the stage opens on the warmap; Lock closes it again. */
function renderStageCode(){ const ok=stageOK(), n=$('stageNote'); $('stageBtn').textContent=ok?'Lock':'Unlock'; $('stageIn').hidden=ok; n.className='note'+(ok?' ok':'');
  n.textContent=ok?'Main Stage unlocked. It is open on the arena map.':'The Main Stage is in beta. Enter the access code to open it.'; }
$('stageBtn').onclick=()=>{ if(stageOK()){ lockStage(); renderStageCode(); renderMenu(); return; }
  const ok=unlockStage($('stageIn').value); $('stageIn').value=''; renderStageCode(); if(ok) renderMenu(); else { const n=$('stageNote'); n.className='note bad'; n.textContent='That code is not valid.'; } sfx('click'); };
$('stageIn').addEventListener('keydown',e=>{ if(e.code==='Enter') $('stageBtn').click(); });
function renderAbilityIcons(){
  $('abQ').querySelector('span').innerHTML=svg('sp');
  [0,1].forEach(i=>{ const g=P.gadgets[i], el=$(i?'abR':'abE'); el.querySelector('span').innerHTML=g?svg(g):''; el.classList.toggle('empty',!g); const t=$(i?'tG2':'tG1'); t.classList.toggle('off',!g); t.innerHTML=g?svg(g):''; });
  $('abS').querySelector('span').innerHTML=svg('dash');
}
