// Seraph Breaker · ui-warmap.js: Arena select, plus the armory, skill tree, frames and system panels.
/* ================= ARENA SELECT ================= */
function renderMap(){
  const sel=openSel(P.selArena); P.selArena=sel;
  $('mapProg').textContent=t('ARENAS · {0}/{1} OPEN',openArenaCount(),shownArenas().length);
  const inner=$('mapInner'); inner.innerHTML='';
  ARENAS.forEach((A,i)=>{ if(!arenaShown(i)) return; const locked=!arenaOpen(i), best=P.bestRoom[i]||0, done=best>=A.rooms;
    const b=document.createElement('button'); b.className='arena'+(locked?' lock':'')+(i===sel?' sel':'')+(done?' done':''); b.id='ar'+i; b.style.setProperty('--c',A.colorCss);
    b.innerHTML=`<span class="n"></span><b></b><span class="r"></span><span class="bp"></span><span class="pr"><i style="width:${Math.min(100,best/A.rooms*100)}%"></i></span>`;
    b.querySelector('.n').textContent=`0${i+1} · ${A.phase.toLocaleUpperCase(LANG)} · ${roomsLabel(A)}`+(locked?' · '+t('LOCKED'):done?' · '+t('CLEARED'):'');
    b.querySelector('b').textContent=A.name; b.querySelector('.r').textContent=locked?t('Clear {0} to unlock',ARENAS[i-1].name):t('Best room {0}/{1}',best,A.rooms)+' · '+A.ruleTxt;
    const bp=b.querySelector('.bp'); arenaBossPool(i).slice(0,i===3?7:3).forEach(k=>{ const img=document.createElement('img'); img.src=PORTRAIT[k]||''; img.alt=BOSSES[k].name; img.title=BOSSES[k].name; bp.appendChild(img); });
    b.onclick=()=>{ if(locked) return; P.selArena=i; sfx('click'); delete $('launchBtn').dataset.arm; renderMap(); };
    inner.appendChild(b); });
  const A=ARENAS[sel], first=(P.bestRoom[sel]||0)<A.rooms, fm=farmMul(sel);
  $('shEye').textContent=t('ARENA {0}','0'+(sel+1))+' · '+A.phase.toLocaleUpperCase(LANG)+' · '+roomsLabel(A)+(fm<1?' · '+t('REWARDS {0}%',Math.round(fm*100)):''); $('shEye').style.color=A.colorCss; $('shName').textContent=A.name;
  $('shReward').innerHTML=`<i></i>+${first?ECON.firstClear(sel):Math.round(ECON.repeatClear(sel)*fm)}${first?' '+t('first clear'):''}`;
  const rooms=$('shRooms'); rooms.innerHTML=''; const rt=document.createElement('span'); rt.textContent=A.stage?t('WAVE ROOMS 1-{0}',A.rooms-1):t('ROOMS 1-10'); rooms.appendChild(rt);
  // Main Stage: S sound check rooms, M rooms with Moshpit waves, E rooms that end in an Encore, then the boss
  if(A.stage){ for(let n=1;n<=A.rooms;n++){ const i=document.createElement('i'), boss=n===A.rooms, enc=n>=STAGE.encore.from, mo=n>=STAGE.mosh.from;
    i.textContent=boss?'B':enc?'E':mo?'M':'S'; i.className=boss?'b':enc?'e':mo?'s':''; i.title=boss?'High-Co':t('{0} waves',STAGE.waves[n-1])+' · '+t(enc?'ends in an Encore':mo?'Sound check + Moshpit':'Sound check'); rooms.appendChild(i); } }
  // other arenas: one 10-room block of PACING: C combat, ! a special room (ambush, waves, survive, hunt, traps, dark), T the next boss's teaching room
  else for(let n=1;n<=10;n++){ const c=PACING[n], i=document.createElement('i'), sp=c.kinds&&c.kinds.some(k=>k!=='normal'&&k!=='teach');
    i.textContent=c.boss?'B':c.angel?'A':c.elite?'E':c.kinds.includes('teach')?'T':sp?'!':'C'; i.className=c.boss?'b':c.angel?'a':c.elite?'e':sp?'s':''; i.title=c.kinds?c.kinds.map(k=>ROOM_KINDS[k].name).join(' / '):''; rooms.appendChild(i); }
  const tags=$('shTags'); tags.innerHTML='';
  A.mobs.filter(e=>ENEMY[e]).forEach(e=>{ const s=document.createElement('span'); s.textContent=ENEMY[e].name; tags.appendChild(s); });
  const r=document.createElement('span'); r.style.borderColor=A.colorCss; r.style.color=A.colorCss; r.textContent=A.ruleTxt; tags.appendChild(r);
  if(!$('launchBtn').dataset.arm) $('launchBtn').textContent=t('Launch {0} ▸',A.name);
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
      c.querySelector('.n').textContent=d.name; c.querySelector('.tag').textContent=d.tag+(kind==='g'?' · '+t('{0}s cooldown',d.cd):''); c.querySelector('p').textContent=d.d;
      const ft=c.querySelector('.ft');
      if(!owned){
        const pr=document.createElement('span'); pr.className='cur gem'; pr.innerHTML=`<i></i>${d.price}`; ft.appendChild(pr);
        const bt=document.createElement('button'); bt.className='btn sm'; bt.id='buy_'+id;
        const key=kind+id; bt.textContent=armed===key?t('Confirm · {0}',d.price):t('Buy'); bt.disabled=P.gems<d.price;
        bt.onclick=()=>{ if(armed!==key){ armed=key; sfx('click'); renderArmory(); return; } armed=null; if(P.gems<d.price) return; P.gems-=d.price; P.owned[id]=true; if(kind==='w') P.weapon=id; else { const s=P.gadgets.indexOf(''); if(s>=0) P.gadgets[s]=id; } sfx('gem'); persist(); renderMenu(); };
        ft.appendChild(bt);
        if(P.gems<d.price){ const n=document.createElement('span'); n.className='tag'; n.textContent=t('Need {0} more',d.price-P.gems); ft.appendChild(n); }
      } else if(kind==='w'){
        const bt=document.createElement('button'); bt.className='btn sm'+(eq?' ghost':''); bt.id='eq_'+id; bt.textContent=eq?t('Equipped'):t('Equip'); bt.disabled=eq;
        bt.onclick=()=>{ P.weapon=id; sfx('click'); persist(); renderMenu(); }; ft.appendChild(bt);
      } else {
        [0,1].forEach(s=>{ const on=P.gadgets[s]===id; const bt=document.createElement('button'); bt.className='btn sm'+(on?'':' ghost'); bt.id=`sl_${id}_${s}`; bt.textContent=on?t('Slot {0}',s+1)+' ✕':t('Slot {0}',s+1);
          bt.onclick=()=>{ if(on) P.gadgets[s]=''; else { const o=P.gadgets.indexOf(id); if(o>=0) P.gadgets[o]=''; P.gadgets[s]=id; } sfx('click'); persist(); renderMenu(); }; ft.appendChild(bt); });
      }
      grid.appendChild(c);
    }); };
  mk($('gridW'),WEAPONS,'w'); mk($('gridG'),GADGETS,'g');
  // cosmetics shop: gold, looks only; teasers until the shop opens
  $('aGold').textContent=P.gold.toLocaleString(); const gc=$('gridC'); gc.innerHTML='';
  COSMETICS_SOON.forEach(x=>{ const c=document.createElement('div'); c.className='card soon'; c.innerHTML=`<div class="top"><div class="ic">${svg(x.ic)}</div><div><div class="n"></div><div class="tag"></div></div></div><div class="ft"><span class="soonTag">${t('Coming soon')}</span></div>`;
    c.querySelector('.n').textContent=x.n; c.querySelector('.tag').textContent=x.t; gc.appendChild(c); });
}
function renderCore(){
  const el=$('coreHangar'); el.innerHTML='';
  const cap=coreCap();
  Object.entries(CORE).forEach(([k,d])=>{ const lv=P.core[k], on=Math.min(lv,cap), max=lv>=cap, cost=coreCost(lv);
    const b=document.createElement('button'); b.className='coreRow'+(max?' max':'')+(!max&&P.gold<cost?' poor':''); b.id='core_'+k;
    b.innerHTML=`<span class="ic">${svg(d.icon)}</span><span class="t"><b></b><small></small></span><span class="lv"></span><span class="cost"></span>`;
    b.querySelector('b').textContent=d.name; b.querySelector('small').textContent=d.d+' · '+t('now +{0}',Math.round((Math.pow(d.k,on)-1)*100)+'%');
    b.querySelector('.lv').textContent=`${on}/${cap}`;
    b.querySelector('.cost').innerHTML=max?t('Next arena'):`<span class="cur gold"><i></i>${cost.toLocaleString()}</span>`;
    b.disabled=max; b.onclick=()=>{ if(max||P.gold<cost) return; P.gold-=cost; P.core[k]=lv+1; sfx('gem'); persist(); renderMenu(); };
    el.appendChild(b); });
}
function renderTree(container){
  renderCore();
  $('sGold').textContent=P.gold.toLocaleString(); $('sGems').textContent=P.gems.toLocaleString(); container.innerHTML=''; const wrap=document.createElement('div'); wrap.className='tree';
  TREE.forEach(br=>{ const col=document.createElement('div'); col.className='branch'; col.style.setProperty('--c',br.c); const h=document.createElement('h3'); h.textContent=br.branch; col.appendChild(h);
    br.nodes.forEach((n,i)=>{ const rk=P.skills[n.id]||0, unlocked=i===0||(P.skills[br.nodes[i-1].id]||0)>0, on=Math.min(rk,treeRankAt(n,P.arenas)), max=rk>=n.max, gate=on<rk||!max&&rk>=treeRankAt(n,P.arenas), cost=max?0:n.cost[rk];
      const b=document.createElement('button'); b.className='node'+(rk>0?' on':'')+(unlocked?'':' lock')+(max?' max':'')+(!max&&P.gems<cost?' poor':''); b.id='sk_'+n.id;
      b.innerHTML=`<span class="t"><b></b><span class="npips">${Array.from({length:n.max},(_,j)=>`<i class="${j<on?'f':''}"></i>`).join('')}</span></span><small></small><span class="cost"></span>`;
      b.querySelector('b').textContent=n.name; b.querySelector('small').textContent=n.d;
      b.querySelector('.cost').innerHTML=max&&!gate?t('MAXED'):!unlocked?'<span class="tag">'+t('Locked')+'</span>':gate?'<span class="tag">'+t('Arena {0}',treeOpenAt(n,on+1))+'</span>':`<span class="cur gem"><i></i>${cost.toLocaleString()}</span>`;
      if(!unlocked||max||gate) b.disabled=true;
      b.onclick=()=>{ if(!unlocked||max||gate||P.gems<cost) return; P.gems-=cost; P.skills[n.id]=rk+1; sfx('gem'); persist(); renderMenu(); };
      col.appendChild(b); });
    wrap.appendChild(col); });
  container.appendChild(wrap);
}
function renderFrames(){
  const u=UNITS[P.unit],c=paint();
  $('pilotIn').value=P.pilot; $('pvUnit').textContent=u.name; $('pvSp').textContent=`SP · ${SPECIALS[P.unit].name} · ${SPECIALS[P.unit].cd} s`;
  const fr=$('frames'); fr.innerHTML='';
  Object.values(UNITS).forEach(x=>{ const bt=document.createElement('button'); bt.className='frame'; bt.id='fr_'+x.key; bt.style.setProperty('--c',CSS(x.key==='verdant'?x.c2:x.c1)); bt.setAttribute('aria-pressed',x.key===P.unit);
    const own=!!P.units[x.key], key='u'+x.key; if(!own) bt.classList.add('lock');
    bt.innerHTML=`<span class="n">${x.name}</span><span class="r">${x.role}</span><span class="r">SP · ${SPECIALS[x.key].name}</span>`+(own?'':`<span class="r price"><span class="cur gem"><i></i>${x.price}</span> ${armed===key?'· '+t('tap again to buy'):P.gems<x.price?'· '+t('need {0} more',x.price-P.gems):'· '+t('buy')}</span>`);
    bt.onclick=()=>{ if(!own){ if(P.gems<x.price) return; if(armed!==key){ armed=key; sfx('click'); renderFrames(); return; } armed=null; P.gems-=x.price; P.units[x.key]=true; sfx('gem'); }
      paintTry=null; P.unit=x.key; P.c1=null; P.c2=null; sfx('click'); rebuildPreview(); renderMenu(); persist(); }; fr.appendChild(bt); });
  // paint: the frame's own two colors are free, any other costs PAINT_PRICE gold once and then works in both slots. A tap only tries the color on
  // the hangar mech (paintTry): a try without new colors is kept at once, one with new colors waits for the Buy button (patch.md 24)
  const ownPaint=col=>col===u.c1||col===u.c2||P.paints.includes(col), cur=Object.assign({},c,paintTry), fresh=[...new Set([cur.c1,cur.c2])].filter(x=>!ownPaint(x)), cost=fresh.length*PAINT_PRICE;
  // only the slots that differ from the saved colors are written (an untouched slot stays null: the frame's own color)
  const keep=T=>{ ['c1','c2'].forEach(k=>{ if(T[k]!==c[k]) P[k]=T[k]; }); paintTry=null; };
  const sw=(el,list,key)=>{ el.innerHTML=''; list.forEach((col,i)=>{ const bt=document.createElement('button'), own=ownPaint(col), on=col===cur[key]; bt.id=key+'_'+i; bt.style.setProperty('--c',CSS(col));
    if(!own) bt.classList.add('lock'); if(on&&!own) bt.classList.add('try'); bt.setAttribute('aria-label',t('Paint {0}',CSS(col))+(own?'':' · '+t('{0} gold',PAINT_PRICE))); bt.setAttribute('aria-pressed',on);
    bt.onclick=()=>{ const T={c1:cur.c1,c2:cur.c2}; T[key]=col; sfx('click'); if(ownPaint(T.c1)&&ownPaint(T.c2)){ keep(T); persist(); } else paintTry=T; rebuildPreview(); renderMenu(); }; el.appendChild(bt); }); };
  sw($('sw1'),PAINT1,'c1'); sw($('sw2'),PAINT2,'c2');
  const pb=$('paintBuyBt'), pc=$('paintCancel'); $('paintBuy').hidden=!fresh.length; pb.textContent=t('Buy · {0} gold',cost.toLocaleString()); pb.disabled=P.gold<cost; pc.textContent=t('Cancel');
  pb.onclick=()=>{ if(!paintTry||P.gold<cost) return; P.gold-=cost; P.paints.push(...fresh); keep(paintTry); sfx('coin'); rebuildPreview(); renderMenu(); persist(); };
  pc.onclick=()=>{ paintTry=null; sfx('click'); rebuildPreview(); renderMenu(); };
  $('paintNote').textContent=!fresh.length?t("Your frame's own colors are free. A new color costs {0} gold, once, and works in both slots.",PAINT_PRICE):P.gold<cost?t('Need {0} more gold.',(cost-P.gold).toLocaleString()):t('Trying it on. Buy to keep these colors, or cancel.');
  const lo=$('loadout'); lo.innerHTML='';
  const item=(icon,label,name,go)=>{ const bt=document.createElement('button'); bt.className='lo'; bt.innerHTML=`${svg(icon)}<span><small>${label}</small><b></b></span>`; bt.querySelector('b').textContent=name; bt.onclick=go; lo.appendChild(bt); };
  const w=P.weapon; item(w,t('Weapon'),w==='sig'?t({azure:'Rapid rifle',crimson:'Scatter cannon',verdant:'Pierce lance'}[P.unit]):WEAPONS[w].name,()=>openView('armory'));
  item('sp',t('Special'),SPECIALS[P.unit].name,()=>{});
  [0,1].forEach(i=>{ const g=P.gadgets[i]; item(g||'hook',t('Gadget {0}',i+1),g?GADGETS[g].name:t('Empty slot'),()=>openView('armory')); });
}
function renderSystem(){ $('buildTxt').textContent=t('Build {0}.',BUILD); renderTester(); $('volM').value=Math.round(P.music*100); $('volMo').textContent=Math.round(P.music*100); $('volS').value=Math.round(P.sfx*100); $('volSo').textContent=Math.round(P.sfx*100);
  document.querySelectorAll('#ctrlSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===P.ctrl)); document.querySelectorAll('#shSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.s===P.mshield)); document.querySelectorAll('#langSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===LANG)); $('autoG').checked=P.autoGadget; }
// language buttons in their own language; a change reloads the page (i18n.js)
$('langSeg').innerHTML=Object.keys(LANGS).map(k=>`<button data-l="${k}" lang="${k}">${LANGS[k]}</button>`).join('');
document.querySelectorAll('#langSeg button').forEach(b=>b.onclick=()=>{ if(b.dataset.l===LANG) return; sfx('click'); langSet(b.dataset.l); });
document.querySelectorAll('#ctrlSeg button').forEach(b=>b.onclick=()=>{ P.ctrl=b.dataset.c; sfx('click'); persist(); setMode(); renderSystem(); });
document.querySelectorAll('#shSeg button').forEach(b=>b.onclick=()=>{ P.mshield=b.dataset.s; sfx('click'); persist(); renderSystem(); refreshControls(); });
$('autoG').onchange=e=>{ P.autoGadget=e.target.checked; persist(); };
$('pilotIn').addEventListener('input',e=>{ const v=e.target.value.replace(/[^\p{L}\p{N} _\-.]/gu,'').slice(0,14); if(v!==e.target.value) e.target.value=v; P.pilot=v.trim(); $('whoName').textContent=P.pilot||t('[CALLSIGN]'); });
$('pilotIn').addEventListener('change',()=>persist());
$('volM').oninput=e=>{ P.music=e.target.value/100; $('volMo').textContent=e.target.value; setVolumes(); };
$('volS').oninput=e=>{ P.sfx=e.target.value/100; $('volSo').textContent=e.target.value; setVolumes(); };
$('volM').onchange=$('volS').onchange=()=>persist();
$('fsBtn').onclick=()=>{ try{ const r=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen(); r&&r.catch&&r.catch(()=>{}); }catch(e){} };
// Reset my progress: a fresh pilot, but the beta badge, the tester code (and its flag) and the Main Stage access code stay
let resetArm=false;
$('resetBtn').onclick=()=>{ if(!resetArm){ resetArm=true; $('resetBtn').textContent=t('Tap again to erase your progress'); setTimeout(()=>{ resetArm=false; $('resetBtn').textContent=t('Reset my progress'); },4000); return; }
  const keep={rev:P.rev,beta:P.beta,betaCode:P.betaCode,testerCode:P.testerCode,testerSave:P.testerSave,testerTools:P.testerTools,stageCode:P.stageCode}; P=freshP(); Object.assign(P,keep); resetArm=false; $('resetBtn').textContent=t('Reset my progress'); clearRun(); persist(); rebuildPreview(); renderMenu(); };
/* tester code: only its SHA-256 is in the code (tester.js). Unlocked: a toggle for the in-game tester tools (reloads the page). */
function renderTester(){ const ok=testerOK(), n=$('testerNote'); $('testerToolsL').hidden=!ok; $('testerTools').checked=P.testerTools; $('testerBtn').textContent=ok?t('Lock'):t('Unlock');
  $('testerIn').hidden=ok; n.className='note'+(ok?' ok':''); n.textContent=ok?t('Tester mode unlocked. Runs with tester tools are flagged and never count for rankings.'):t('For testers only. Tester runs are flagged and never count for rankings.'); }
$('testerBtn').onclick=()=>{ if(testerOK()){ lockTester(); renderTester(); if(DEBUG) location.reload(); return; }
  const ok=unlockTester($('testerIn').value); $('testerIn').value=''; renderTester(); if(!ok){ const n=$('testerNote'); n.className='note bad'; n.textContent=t('That code is not valid.'); } sfx('click'); };
$('testerIn').addEventListener('keydown',e=>{ if(e.code==='Enter') $('testerBtn').click(); });
$('testerTools').onchange=e=>{ P.testerTools=e.target.checked; persist(); location.reload(); };
function renderAbilityIcons(){
  $('abQ').querySelector('span').innerHTML=svg('sp');
  [0,1].forEach(i=>{ const g=P.gadgets[i], el=$(i?'abR':'abE'); el.querySelector('span').innerHTML=g?svg(g):''; el.classList.toggle('empty',!g); const t=$(i?'tG2':'tG1'); t.classList.toggle('off',!g); t.innerHTML=g?svg(g):''; });
  $('abS').querySelector('span').innerHTML=svg('dash');
}
