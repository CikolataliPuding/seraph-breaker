// Seraph Breaker · traps.js: Trap tiles ('~' in ROOMS): saw rails, spike tiles and holy light pillars. They hurt you and the enemies; the nav grid keeps enemies off armed traps.
/* ================= TRAPS ================= */
/* A '~' run of cells (horizontal, else vertical) becomes one trap group, themed by the arena (ARENAS[].trap, numbers in TRAPS):
   saw: a thin rail with a spinning saw that runs back and forth along it (always armed around the saw).
   spike / pillar: tiles that cycle idle → warn (telegraph) → active; a group shares one cycle, groups are staggered.
   While a trap is armed its nav cells are marked (NAV.trap), so enemies route around it; knockback and crowd pushing can still throw them in. */
const traps=[];
let trapMats=null;
function trapKind(a){ const k=ARENAS[a].trap||'spike'; return k==='mix'?pickOne(['saw','spike','pillar']):k; }
// mark (v=1) or unmark (v=-1) the nav cells inside a rectangle
function navMarkRect(x0,z0,x1,z1,v){ if(!NAV.ok) return; const c0=Math.max(0,Math.floor((x0+AX)/NAV.cx)), c1=Math.min(NAV.w-1,Math.floor((x1+AX)/NAV.cx)), r0=Math.max(0,Math.floor((z0+AZ)/NAV.cz)), r1=Math.min(NAV.h-1,Math.floor((z1+AZ)/NAV.cz));
  for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++){ const i=r*NAV.w+c; NAV.trap[i]=Math.max(0,NAV.trap[i]+v); } }
function trapMaterials(){ if(trapMats) return trapMats; trapMats={plate:toon(0x2a2632),metal:toon(0xc8c4cc),blade:toon(0xe8e8ee),rail:toon(0x1c1a22),warn:addMat(0xff3a2a,.45),gold:addMat(0xffd36a,.6),glow:addMat(0xffd36a,.22),core:addMat(0xfff4d0,.5),edge:basic(0x7a1a26,false)}; return trapMats; }
// cells: [{x,z}] of one '~' run; cw/cz: cell size
function addTrapGroup(kind,cells,cw,cz,idx){
  const M=trapMaterials(), T=TRAPS[kind], g=new THREE.Group(); roomGroup.add(g);
  const t={kind,cells,g,cw,cz,t:0,ph:0,x:0,z:0,r:0,hitCd:0,armed:false};
  if(kind==='saw'){
    const a=cells[0], b=cells[cells.length-1], horiz=cells.length>1?Math.abs(b.x-a.x)>Math.abs(b.z-a.z):Math.random()<.5;
    // a single cell gets a short rail across it
    const ax=cells.length>1?a.x:a.x-(horiz?cw*.45:0), az=cells.length>1?a.z:a.z-(horiz?0:cz*.45), bx=cells.length>1?b.x:b.x+(horiz?cw*.45:0), bz=cells.length>1?b.z:b.z+(horiz?0:cz*.45);
    const len=Math.hypot(bx-ax,bz-az)+1.2, rail=part(box(horiz?len:.34,.08,horiz?.34:len),M.rail,g,(ax+bx)/2,.04,(az+bz)/2,.05);
    [-1,1].forEach(s=>{ const st=part(box(.5,.3,.5),M.plate,g,s<0?ax-(horiz?.6:0):bx+(horiz?.6:0),.15,s<0?az-(horiz?0:.6):bz+(horiz?0:.6),.05); });
    const saw=new THREE.Group(); saw.position.y=.62; g.add(saw); const disc=part(new THREE.CylinderGeometry(.62,.62,.1,16),M.blade,saw,0,0,0,.04);
    for(let i=0;i<8;i++){ const a2=i/8*Math.PI*2, tooth=part(new THREE.ConeGeometry(.12,.3,4),M.metal,disc,Math.cos(a2)*.68,0,Math.sin(a2)*.68,0); tooth.rotation.z=-Math.PI/2; tooth.rotation.y=-a2; }
    part(new THREE.CylinderGeometry(.16,.16,.16,8),M.rail,saw,0,0,0,.03);
    saw.rotation.x=horiz?Math.PI/2:0; saw.rotation.z=horiz?0:Math.PI/2;
    Object.assign(t,{ax,az,bx,bz,saw,disc,horiz,u:Math.random(),dir:Math.random()<.5?1:-1,r:T.r,mark:null});
  } else {
    t.ph=0; t.t=T.idle*(.35+((idx*.37)%1)*.65); // staggered cycles
    t.tiles=cells.map(c=>{ const tg=new THREE.Group(); tg.position.set(c.x,0,c.z); g.add(tg);
      const ed=new THREE.Mesh(box(cw*.98,.04,cz*.98),M.edge); ed.position.y=.02; tg.add(ed); part(box(cw*.84,.06,cz*.84),M.plate,tg,0,.04,0,.04);
      const warn=new THREE.Mesh(box(cw*.9,.02,cz*.9),kind==='pillar'?M.gold:M.warn); warn.position.y=.07; warn.visible=false; tg.add(warn);
      let act;
      if(kind==='spike'){ act=new THREE.Group(); act.position.y=-.55; tg.add(act); for(let i=0;i<9;i++){ const sp=part(new THREE.ConeGeometry(.16,.7,4),M.metal,act,((i%3)-1)*cw*.28,.35,(((i/3)|0)-1)*cz*.28,.03); } }
      else { act=new THREE.Group(); tg.add(act); const col=new THREE.Mesh(new THREE.CylinderGeometry(cw*.4,cw*.4,5,12,1,true),M.glow); col.position.y=2.5; act.add(col); const core=new THREE.Mesh(new THREE.CylinderGeometry(cw*.12,cw*.12,5,8,1,true),M.core); core.position.y=2.5; act.add(core); act.visible=false;
        const rune=new THREE.Mesh(new THREE.RingGeometry(cw*.3,cw*.38,6),M.gold); rune.rotation.x=-Math.PI/2; rune.position.y=.08; tg.add(rune); }
      return {g:tg,warn,act,x:c.x,z:c.z}; });
  }
  traps.push(t); return t;
}
// parse the '~' cells of a room grid into runs (horizontal first, then vertical) and build them
function buildTraps(cells,cw,cz){
  traps.length=0; const left=new Set(cells.map((c,i)=>i)), key=(x,z)=>cells.findIndex(c=>Math.abs(c.x-x)<.01&&Math.abs(c.z-z)<.01); let idx=0;
  const kind=trapKind(stage);
  for(let i=0;i<cells.length;i++){ if(!left.has(i)) continue; const c=cells[i]; let run=[i];
    for(let k=1;;k++){ const j=key(c.x+cw*k,c.z); if(j<0||!left.has(j)) break; run.push(j); }
    if(run.length===1) for(let k=1;;k++){ const j=key(c.x,c.z+cz*k); if(j<0||!left.has(j)) break; run.push(j); }
    run.forEach(j=>left.delete(j)); addTrapGroup(kind,run.map(j=>cells[j]),cw,cz,idx++); }
}
// Trap gauntlet rooms (and rooms without '~'): extra strips on free cells away from the entry
function addRandomTraps(n,cw,cz){ const cols=Math.round(2*AX/cw), kind=trapKind(stage); let made=0,guard=0;
  while(made<n&&guard++<80){ const len=1+((Math.random()*3)|0), horiz=Math.random()<.6, c0=(Math.random()*(cols-(horiz?len:0)))|0, r0=2+((Math.random()*(10-(horiz?0:len)))|0), cells=[];
    for(let k=0;k<len;k++){ const x=-AX+cw*(c0+(horiz?k:0)+.5), z=-AZ+cz*(r0+(horiz?0:k)+.5); if(inBlock(x,z,.2)||Math.abs(x)<cw&&z<-AZ+cz*2) { cells.length=0; break; } cells.push({x,z}); }
    if(!cells.length||traps.some(t=>(t.cells||[]).some(a=>cells.some(b=>Math.hypot(a.x-b.x,a.z-b.z)<cw*1.6)))) continue;
    addTrapGroup(kind,cells,cw,cz,traps.length); made++; } }
const TRAP_PH=['idle','warn','act'];
function trapArmed(t){ return t.kind==='saw'||t.ph>=1; }
// for the debug autopilot: is this trap dangerous right now (or about to be)?
function trapDanger(t){ return t.kind==='saw'||t.ph>=1||t.t<.35; }
function updateTraps(dt){
  if(!traps.length||!room) return; const T_=TRAPS, off=room.cleared;
  for(const t of traps){ const T=T_[t.kind];
    if(t.kind==='saw'){ if(off) continue;
      t.u+=t.dir*T.speed*dt/Math.max(1,Math.hypot(t.bx-t.ax,t.bz-t.az)); if(t.u>1){ t.u=1; t.dir=-1; } if(t.u<0){ t.u=0; t.dir=1; }
      t.x=t.ax+(t.bx-t.ax)*t.u; t.z=t.az+(t.bz-t.az)*t.u; t.saw.position.x=t.x; t.saw.position.z=t.z; t.disc.rotation.y+=dt*22*t.dir;
      if(Math.random()<dt*10) sparks(new V3(t.x,.25,t.z),0xffc070,1,3);
      // the nav cells around the saw are armed
      if(t.mark) navMarkRect(t.mark[0],t.mark[1],t.mark[2],t.mark[3],-1); const R=t.r+.6; t.mark=[t.x-R,t.z-R,t.x+R,t.z+R]; navMarkRect(t.mark[0],t.mark[1],t.mark[2],t.mark[3],1);
      trapHits(t,(x,z,r)=>Math.hypot(x-t.x,z-t.z)<t.r+r*.6?t:null,T,dt); continue; }
    t.t-=dt; const was=t.ph;
    if(t.t<=0&&!off){ t.ph=(t.ph+1)%3; t.t=T[TRAP_PH[t.ph]]; if(t.ph===2){ t.tiles.forEach(s=>sparks(new V3(s.x,.4,s.z),t.kind==='pillar'?0xffe9a0:0xc8c4cc,3,4)); sfx(t.kind==='pillar'?'zap':'slash'); } }
    if(off&&t.ph){ t.ph=0; }
    // armed (warn + active): enemies route around it
    if((was>=1)!==(t.ph>=1)) for(const c of t.cells) navMarkRect(c.x-t.cw/2,c.z-t.cz/2,c.x+t.cw/2,c.z+t.cz/2,t.ph>=1?1:-1);
    const k=t.ph===1?1-t.t/T.warn:0;
    for(const s of t.tiles){ s.warn.visible=t.ph===1; if(t.ph===1) s.warn.material.opacity=.2+.4*Math.abs(Math.sin(k*k*26));
      if(t.kind==='spike') s.act.position.y+=((t.ph===2?.05:t.ph===1?-.38:-.6)-s.act.position.y)*Math.min(1,dt*(t.ph===2?30:8));
      else { s.act.visible=t.ph===2; if(t.ph===2) s.act.children[0].scale.set(.9+Math.random()*.2,1,.9+Math.random()*.2); } }
    if(t.ph===2) trapHits(t,(x,z,r)=>t.cells.find(c=>Math.abs(x-c.x)<t.cw/2+r*.3&&Math.abs(z-c.z)<t.cz/2+r*.3)||null,T,dt);
  }
}
// damage to you (through hurt, cooldown per trap) and to every enemy standing in it (no procs, cooldown per enemy)
function trapHits(t,hitAt,T,dt){
  t.hitCd-=dt; const p=player;
  if(p&&!p.dead&&t.hitCd<=0&&!p.jump&&!p.leap){ const h=hitAt(p.pos.x,p.pos.z,.6); if(h){ t.hitCd=T.cd; hurt(T.dmg); _tmp.set(p.pos.x-h.x,0,p.pos.z-h.z); if(t.kind==='saw'&&_tmp.lengthSq()>1e-4) p.kick.addScaledVector(_tmp.normalize(),9); } }
  // enemies: the hit comes from the trap's center, so the hit reaction knocks them back out of it
  for(const e of enemies){ if(e.dead||e===boss||e.fly||e.dropY>0) continue; e.trapCd=(e.trapCd||0)-dt; if(e.trapCd>0) continue; const h=hitAt(e.pos.x,e.pos.z,e.r); if(!h) continue;
    e.trapCd=T.cd; hitEnemy(e,T.edmg*roomHpScale()*SCALE.mob,new V3(h.x,1,h.z),false,true,true); }
}
function clearTraps(){ traps.length=0; }
