// Seraph Breaker · ui-warmap.js: War Map level select, plus the armory, skill tree, frames and system panels.
/* ================= WAR MAP (C) ================= */
const MAP_H=740;
const nodePos=i=>({x:[22,50,78,50][i%4], y:MAP_H-70-i*55});
function renderMap(){
  if(selLevel>Math.min(P.progress,11)) selLevel=Math.min(P.progress,11);
  $('mapProg').textContent=`CAMPAIGN · ${P.progress}/12 CLEAR`;
  const inner=$('mapInner'); inner.innerHTML='';
  ARENAS.forEach((S,s)=>{ const top=nodePos(s*4+3).y-46, bot=s===0?MAP_H:nodePos(s*4-1).y-46; const b=document.createElement('div'); b.className='band'; b.style.top=top+'px'; b.style.height=(bot-top)+'px'; b.style.background=`linear-gradient(180deg,${S.colorCss}26,${S.colorCss}08)`; const l=document.createElement('span'); l.style.color=S.colorCss; l.textContent=`0${s+1} · ${S.name.toUpperCase()}`; b.appendChild(l); inner.appendChild(b); });
  const pts=Array.from({length:12},(_,i)=>nodePos(i)), pstr=pts.map(p=>`${p.x},${p.y}`).join(' '), done=pts.slice(0,Math.min(P.progress+1,12)).map(p=>`${p.x},${p.y}`).join(' ');
  inner.insertAdjacentHTML('beforeend',`<svg class="mapPath" viewBox="0 0 100 ${MAP_H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pstr}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="3" stroke-dasharray="2 7" vector-effect="non-scaling-stroke"/><polyline points="${done}" fill="none" stroke="#ff6a1a" stroke-width="4" vector-effect="non-scaling-stroke"/></svg>`);
  for(let i=0;i<12;i++){
    const inf=levelInfo(i), p=pts[i], b=document.createElement('button');
    const isDone=i<P.progress, isOpen=i===P.progress, locked=i>P.progress;
    b.className='mnode'+(inf.boss?' boss':'')+(isDone?' done':isOpen?' open':' lock')+(i===selLevel?' sel':'');
    b.id='mn'+i; b.style.left=p.x+'%'; b.style.top=p.y+'px';
    b.setAttribute('aria-label',`Level ${i+1}: ${inf.name}${locked?' (locked)':isDone?' (cleared)':''}`);
    if(inf.boss){ const img=document.createElement('img'); img.src=PORTRAIT[inf.stage.boss]||''; img.alt=''; b.appendChild(img); } else b.textContent=i+1;
    b.onclick=()=>{ if(locked) return; selLevel=i; sfx('click'); renderMap(); };
    inner.appendChild(b);
    if(isOpen){ const y=document.createElement('div'); y.className='youAre'; y.style.left=p.x+'%'; y.style.top=(p.y-(inf.boss?36:26))+'px'; y.textContent='NEXT'; inner.appendChild(y); }
  }
  const inf=levelInfo(selLevel), first=selLevel===P.progress;
  $('shEye').textContent=`LEVEL ${String(selLevel+1).padStart(2,'0')} · ${inf.stage.name.toUpperCase()}`; $('shEye').style.color=inf.stage.colorCss;
  $('shName').textContent=inf.name;
  const rw=inf.boss?(first?BOSSES[inf.stage.boss].gems:8):(first?5+inf.s*2:1);
  $('shReward').innerHTML=`<i></i>+${rw}${first?' first clear':''}`;
  const rooms=$('shRooms'); rooms.innerHTML=''; const lab={combat:['C',''],angel:['A','a'],elite:['E','e'],boss:['B','b']};
  const t=document.createElement('span'); t.textContent='ROOMS'; rooms.appendChild(t);
  inf.rooms.forEach(r=>{ const i=document.createElement('i'); i.textContent=lab[r][0]; if(lab[r][1]) i.className=lab[r][1]; rooms.appendChild(i); });
  const tags=$('shTags'); tags.innerHTML=''; const names={drone:'Drone',seraph:'Seraph',heavy:'Heavy',warden:'Warden'};
  [...new Set(inf.pool)].forEach(e=>{ const s=document.createElement('span'); s.textContent=names[e]; tags.appendChild(s); });
  if(inf.boss){ const s=document.createElement('span'); s.style.borderColor='var(--alert)'; s.style.color='var(--alert)'; s.textContent='Boss · '+inf.name; tags.appendChild(s); }
  $('launchBtn').textContent=`Launch level ${selLevel+1} ▸`;
}
function scrollMapToSel(){ const sc=$('mapScroll'), p=nodePos(selLevel); sc.scrollTop=Math.max(0,p.y-sc.clientHeight/2); }

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
function renderTree(container){
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
function renderSystem(){ $('volM').value=Math.round(P.music*100); $('volMo').textContent=Math.round(P.music*100); $('volS').value=Math.round(P.sfx*100); $('volSo').textContent=Math.round(P.sfx*100);
  document.querySelectorAll('#ctrlSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===P.ctrl)); $('autoG').checked=P.autoGadget; }
document.querySelectorAll('#ctrlSeg button').forEach(b=>b.onclick=()=>{ P.ctrl=b.dataset.c; sfx('click'); persist(); setMode(); renderSystem(); });
$('autoG').onchange=e=>{ P.autoGadget=e.target.checked; persist(); };
$('pilotIn').addEventListener('input',e=>{ const v=e.target.value.replace(/[^\p{L}\p{N} _\-.]/gu,'').slice(0,14); if(v!==e.target.value) e.target.value=v; P.pilot=v.trim(); $('whoName').textContent=P.pilot||'[CALLSIGN]'; });
$('pilotIn').addEventListener('change',()=>persist());
$('volM').oninput=e=>{ P.music=e.target.value/100; $('volMo').textContent=e.target.value; setVolumes(); };
$('volS').oninput=e=>{ P.sfx=e.target.value/100; $('volSo').textContent=e.target.value; setVolumes(); };
$('volM').onchange=$('volS').onchange=()=>persist();
$('fsBtn').onclick=()=>{ try{ const r=document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen(); r&&r.catch&&r.catch(()=>{}); }catch(e){} };
let resetArm=false;
$('resetBtn').onclick=()=>{ if(!resetArm){ resetArm=true; $('resetBtn').textContent='Tap again to erase everything'; setTimeout(()=>{ resetArm=false; $('resetBtn').textContent='Reset all progress'; },4000); return; }
  const rev=P.rev; P=freshP(); P.rev=rev; resetArm=false; $('resetBtn').textContent='Reset all progress'; persist(); rebuildPreview(); renderMenu(); };
function renderAbilityIcons(){
  $('abQ').querySelector('span').innerHTML=svg('sp');
  [0,1].forEach(i=>{ const g=P.gadgets[i], el=$(i?'abR':'abE'); el.querySelector('span').innerHTML=g?svg(g):''; el.classList.toggle('empty',!g); const t=$(i?'tG2':'tG1'); t.classList.toggle('off',!g); t.innerHTML=g?svg(g):''; });
  $('abS').querySelector('span').innerHTML=svg('dash');
}
