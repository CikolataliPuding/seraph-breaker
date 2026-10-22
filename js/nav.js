// Seraph Breaker · nav.js: Enemy navigation: the room nav grid, a flow field toward the target, the line-of-sight map, A* paths, angle slots and attack tokens.
/* ================= NAV GRID ================= */
/* one nav cell is about 1 × 1 unit (half a room cell). blk: 1 = block (or its margin). trap: >0 while a trap tile is armed: you can walk on it,
   enemies route around it (knockback can still throw them in). dist: flow field, path length from each cell to the target. los: the cell sees the target.
   Everything is rebuilt with the room (buildNav) and refreshed NAV_HZ times a second (navUpdate), so it stays cheap on phones. */
const NAV={w:0,h:0,cx:1,cz:1,blk:new Uint8Array(0),trap:new Uint8Array(0),dist:new Float32Array(0),los:new Uint8Array(0),hk:new Float32Array(0),hv:new Int32Array(0),t:0,ok:false};
const NAV_HZ=4;
function buildNav(w,h){
  w=w||Math.max(4,Math.round(2*AX)); h=h||Math.max(4,Math.round(2*AZ));
  const n=w*h; Object.assign(NAV,{w,h,cx:2*AX/w,cz:2*AZ/h,blk:new Uint8Array(n),trap:new Uint8Array(n),dist:new Float32Array(n),los:new Uint8Array(n),hk:new Float32Array(n*8+8),hv:new Int32Array(n*8+8),t:0,ok:true});
  for(let i=0;i<n;i++){ if(inBlock(navX(i),navZ(i),.35)) NAV.blk[i]=1; }
}
const navX=i=>-AX+NAV.cx*((i%NAV.w)+.5), navZ=i=>-AZ+NAV.cz*(((i/NAV.w)|0)+.5);
function navCell(x,z){ const c=Math.floor((x+AX)/NAV.cx), r=Math.floor((z+AZ)/NAV.cz); if(c<0||r<0||c>=NAV.w||r>=NAV.h) return -1; return r*NAV.w+c; }
const navFree=i=>i>=0&&!NAV.blk[i]&&!NAV.trap[i];
// 8 neighbours: dc, dr, cost. Diagonals never cut a corner (both side cells must be free).
const NB8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[-1,1,1.414],[1,-1,1.414],[-1,-1,1.414]];
function navNb(i,k){ const c=i%NAV.w+NB8[k][0], r=((i/NAV.w)|0)+NB8[k][1]; if(c<0||r<0||c>=NAV.w||r>=NAV.h) return -1; const j=r*NAV.w+c;
  if(k>=4&&(!navFree(r*NAV.w+(i%NAV.w))||!navFree(((i/NAV.w)|0)*NAV.w+c))) return -1; return j; }

/* ================= FLOW FIELD + LOS MAP ================= */
// Dijkstra from the target. When the target stands on a trap or on a block edge, the free cells around it are the seeds instead,
// so enemies stop at the edge (and shoot) rather than walking in.
function navField(T){
  const {w,h,dist,hk,hv}=NAV, n=w*h; dist.fill(Infinity); let hn=0;
  const push=(i,d)=>{ let k=hn++; while(k>0){ const p=(k-1)>>1; if(hk[p]<=d) break; hk[k]=hk[p]; hv[k]=hv[p]; k=p; } hk[k]=d; hv[k]=i; };
  const pop=()=>{ const top=hv[0], d=hk[--hn], v=hv[hn]; let k=0; for(;;){ let c=2*k+1; if(c>=hn) break; if(c+1<hn&&hk[c+1]<hk[c]) c++; if(hk[c]>=d) break; hk[k]=hk[c]; hv[k]=hv[c]; k=c; } hk[k]=d; hv[k]=v; return top; };
  const ti=navCell(clamp(T.x,-AX+.01,AX-.01),clamp(T.z,-AZ+.01,AZ-.01));
  if(navFree(ti)){ dist[ti]=0; push(ti,0); }
  else { const c0=ti%w, r0=(ti/w)|0; for(let r=r0-3;r<=r0+3;r++) for(let c=c0-3;c<=c0+3;c++){ if(c<0||r<0||c>=w||r>=h) continue; const j=r*w+c; if(!navFree(j)) continue; const d=Math.hypot(navX(j)-T.x,navZ(j)-T.z); if(d<dist[j]){ dist[j]=d; push(j,d); } } }
  while(hn>0){ const d0=hk[0], i=pop(); if(d0>dist[i]) continue;
    for(let k=0;k<8;k++){ const j=navNb(i,k); if(j<0||!navFree(j)) continue; const nd=d0+NB8[k][2]; if(nd<dist[j]){ dist[j]=nd; if(hn<hk.length) push(j,nd); } } }
  // line of sight from every walkable cell to the target (blocks stop shots, traps do not)
  for(let i=0;i<n;i++) NAV.los[i]=NAV.blk[i]?0:losClear(navX(i),navZ(i),T.x,T.z)?1:0;
}
function navUpdate(dt){ if(!NAV.ok||!player) return; NAV.t-=dt; if(NAV.t>0) return; NAV.t=1/NAV_HZ; navField(tgt()); }
// flow direction at a point: the field's downhill gradient over the free neighbours. null at the target or when nothing is reachable.
function flowDir(x,z,out){
  const i=navCell(x,z); if(i<0) return null; const d0=NAV.dist[i]; let gx=0,gz=0,best=Infinity,bj=-1;
  for(let k=0;k<8;k++){ const j=navNb(i,k); if(j<0||!navFree(j)) continue; const dj=NAV.dist[j]; if(dj<best){ best=dj; bj=j; } if(isFinite(d0)&&dj<d0){ const l=NB8[k][2]; gx+=(d0-dj)/l*NB8[k][0]/l; gz+=(d0-dj)/l*NB8[k][1]/l; } }
  // the gradient can point into a block corner: then take the best neighbour instead
  if(gx*gx+gz*gz>1e-6){ out.set(gx,0,gz).normalize(); if(navFree(navCell(x+out.x*.8,z+out.z*.8))) return out; }
  // standing on a blocked or trap cell (pushed onto a block margin, thrown onto a trap): step to the best free neighbour
  if(bj>=0&&isFinite(best)&&best<(isFinite(d0)?d0:Infinity)) return out.set(navX(bj)-x,0,navZ(bj)-z).normalize();
  return null;
}
// flee direction: uphill on the flow field, i.e. away from the target along real paths (the hunted elite). null in a dead end.
function fleeDir(x,z,out){ const i=navCell(x,z); if(i<0) return null; let best=isFinite(NAV.dist[i])?NAV.dist[i]:-1, bj=-1;
  for(let k=0;k<8;k++){ const j=navNb(i,k); if(j<0||!navFree(j)||!isFinite(NAV.dist[j])) continue; if(NAV.dist[j]>best){ best=NAV.dist[j]; bj=j; } }
  return bj<0?null:out.set(navX(bj)-x,0,navZ(bj)-z).normalize(); }
// can a walker of radius r go straight from a to b? (every sampled cell free along the line and its two edges: no blocks, no armed traps)
function walkClear(ax,az,bx,bz,r=0){ const l=Math.hypot(bx-ax,bz-az); if(l<1e-3) return true; const n=Math.ceil(l/.45), px=-(bz-az)/l*r, pz=(bx-ax)/l*r;
  for(let s=1;s<=n;s++){ const k=s/n, x=ax+(bx-ax)*k, z=az+(bz-az)*k; let i=navCell(x,z); if(i>=0&&!navFree(i)) return false;
    if(r>0){ i=navCell(x+px,z+pz); if(i>=0&&!navFree(i)) return false; i=navCell(x-px,z-pz); if(i>=0&&!navFree(i)) return false; } } return true; }

/* ================= A* PATHS ================= */
// path from a to b over free cells as waypoints [x,z,...], string-pulled so it only bends at corners. null when b cannot be reached.
function navPath(ax,az,bx,bz,rad=0){
  const {w,h}=NAV, n=w*h, s=navCell(ax,az), g=navCell(bx,bz); if(s<0||g<0||!navFree(g)) return null;
  const G_=navPath.g||(navPath.g=new Float32Array(0)); let gs=G_.length===n?G_:(navPath.g=new Float32Array(n)), from=navPath.f&&navPath.f.length===n?navPath.f:(navPath.f=new Int32Array(n));
  gs.fill(Infinity); from.fill(-1); const hk=NAV.hk, hv=NAV.hv; let hn=0;
  const H=i=>{ const dc=Math.abs(i%w-g%w), dr=Math.abs(((i/w)|0)-((g/w)|0)); return Math.max(dc,dr)+.414*Math.min(dc,dr); };
  const push=(i,d)=>{ let k=hn++; while(k>0){ const p=(k-1)>>1; if(hk[p]<=d) break; hk[k]=hk[p]; hv[k]=hv[p]; k=p; } hk[k]=d; hv[k]=i; };
  const pop=()=>{ const top=hv[0], d=hk[--hn], v=hv[hn]; let k=0; for(;;){ let c=2*k+1; if(c>=hn) break; if(c+1<hn&&hk[c+1]<hk[c]) c++; if(hk[c]>=d) break; hk[k]=hk[c]; hv[k]=hv[c]; k=c; } hk[k]=d; hv[k]=v; return top; };
  gs[s]=0; push(s,H(s)); let found=false, guard=0;
  while(hn>0&&guard++<n*8){ const i=pop(); if(i===g){ found=true; break; }
    for(let k=0;k<8;k++){ const j=navNb(i,k); if(j<0||!navFree(j)) continue; const nd=gs[i]+NB8[k][2]; if(nd<gs[j]){ gs[j]=nd; from[j]=i; if(hn<hk.length) push(j,nd+H(j)); } } }
  if(!found) return null;
  const cells=[]; for(let i=g;i!==s&&i>=0;i=from[i]) cells.push(i); cells.reverse();
  // string pulling: keep a waypoint only when the next one cannot be reached in a straight line
  const out=[]; let px=ax,pz=az;
  for(let k=0;k<cells.length;k++){ const nx=k+1<cells.length?navX(cells[k+1]):bx, nz=k+1<cells.length?navZ(cells[k+1]):bz;
    if(k===cells.length-1||!walkClear(px,pz,nx,nz,rad)){ const x=k===cells.length-1?bx:navX(cells[k]), z=k===cells.length-1?bz:navZ(cells[k]); out.push(x,z); px=x; pz=z; } }
  return out;
}

/* ================= SLOTS, SPOTS, TOKENS ================= */
// enemies around the target spread over SLOT_N angle slots, so they surround you instead of queueing in one line
const SLOT_N=12, angOf=(x,z,T)=>Math.atan2(x-T.x,z-T.z), angDiff=(a,b)=>Math.abs(((a-b+Math.PI*3)%(Math.PI*2))-Math.PI);
function claimSlot(e,want){
  let best=0,bs=1e9; for(let k=0;k<SLOT_N;k++){ const a=k/SLOT_N*Math.PI*2-Math.PI; let s=angDiff(a,want);
    for(const o of enemies) if(o!==e&&!o.dead&&o.slot===k) s+=1.1; if(s<bs){ bs=s; best=k; } }
  e.slot=best; return best/SLOT_N*Math.PI*2-Math.PI;
}
/* a place to stand: on a free slot around the target at range [near,far]. Walkers pick the nearest walkable cell there that can see the target
   (snipers also prefer cells away from blocks: open lanes). o.want: preferred angle, o.lane: sniper scoring, o.noLos: line of sight not needed. */
function planSpot(e,near,far,o={}){
  const T=tgt(), a0=o.want!=null?o.want:angOf(e.pos.x,e.pos.z,T), sa=claimSlot(e,a0), mid=(near+far)/2;
  const ix=clamp(T.x+Math.sin(sa)*mid,-AX+1.5,AX-1.5), iz=clamp(T.z+Math.cos(sa)*mid,-AZ+1.5,AZ-1.5);
  if(e.fly||!NAV.ok){ e.goal={x:ix,z:iz}; return e.goal; }
  let best=-1,bs=1e9; const n=NAV.w*NAV.h;
  for(let i=0;i<n;i++){ if(!navFree(i)||!isFinite(NAV.dist[i])&&!o.noLos) continue; if(!o.noLos&&!NAV.los[i]) continue;
    const x=navX(i), z=navZ(i); if(Math.abs(x)>AX-1.2||Math.abs(z)>AZ-1.2) continue;
    const dt=Math.hypot(x-T.x,z-T.z); if(dt<near*.8||dt>far*1.15) continue;
    let s=Math.hypot(x-ix,z-iz)+.35*Math.hypot(x-e.pos.x,z-e.pos.z);
    if(o.lane) for(let k=0;k<8;k++){ const j=navNb(i,k); if(j<0||NAV.blk[j]) s+=.8; }
    for(const q of enemies) if(q!==e&&!q.dead&&q.goal&&Math.abs(q.goal.x-x)+Math.abs(q.goal.z-z)<2.4) s+=3;
    if(s<bs){ bs=s; best=i; } }
  e.goal=best>=0?{x:navX(best),z:navZ(best)}:{x:ix,z:iz}; return e.goal;
}
// cover: the nearest reachable cell within rad that the target cannot see (Crawlers hide there between bursts)
function coverSpot(e,rad){ if(!NAV.ok) return null; const c0=navCell(e.pos.x,e.pos.z); if(c0<0) return null; const w=NAV.w, R=Math.ceil(rad/NAV.cx); let best=-1,bs=1e9;
  for(let r=((c0/w)|0)-R;r<=((c0/w)|0)+R;r++) for(let c=c0%w-R;c<=c0%w+R;c++){ if(c<0||r<0||c>=w||r>=NAV.h) continue; const i=r*w+c; if(!navFree(i)||NAV.los[i]||!isFinite(NAV.dist[i])) continue;
    const s=Math.hypot(navX(i)-e.pos.x,navZ(i)-e.pos.z); if(s<rad&&s<bs){ bs=s; best=i; } }
  return best>=0?{x:navX(best),z:navZ(best)}:null; }
/* attack tokens: only AI_LV[arena].tokens enemies may run an attack (wind-up to recovery) at the same time; the rest keep repositioning */
// waiting enemies queue up in request order, so a free token goes to whoever asked first (not to whoever updates first)
const AIR={tok:new Set(),q:[],pv:new V3(),still:0,ready:true};
const AIL=()=>AI_LV[clamp(stage|0,0,AI_LV.length-1)];
function takeToken(e){ if(e.tok) return true;
  for(const x of AIR.tok) if(x.dead||!enemies.includes(x)){ AIR.tok.delete(x); x.tok=false; }
  AIR.q=AIR.q.filter(x=>!x.dead&&x.tokReq>playTime-.3); if(!AIR.q.includes(e)) AIR.q.push(e); e.tokReq=playTime;
  const free=AIL().tokens+(e.elite?1:0)-AIR.tok.size; if(free<=0||AIR.q.indexOf(e)>=free) return false;
  AIR.q.splice(AIR.q.indexOf(e),1); AIR.tok.add(e); e.tok=true; return true; }
function dropToken(e){ if(e.tok){ AIR.tok.delete(e); e.tok=false; } }
function resetAI(){ AIR.tok.clear(); AIR.q.length=0; AIR.pv.set(0,0,0); AIR.still=0; NAV.t=0; }
// the player's smoothed velocity (dashes left out) and how long they have been standing still: enemy aim leads with it, artillery punishes stillness
function senseUpdate(dt){ const p=player; if(!p||p.dead) return;
  if(p.dashT<=0&&!p.leap&&!p.jump) AIR.pv.lerp(p.vel,Math.min(1,dt*6)); AIR.still=Math.hypot(p.vel.x,p.vel.z)<1.2?AIR.still+dt:0;
  // arena 3+ enemies read you: they press the attack while your dash is recharging
  AIR.ready=mobileMode?p.dashCh>=1:p.dashCd<=0&&p.en>=35&&p.overheat<=0; }
// where to shoot: the target's position, led by its velocity (lead 0 = naive, 1 = perfect intercept for a shot of speed spd), capped at maxLead units
function leadPoint(fx,fz,spd,lead,out,maxLead=6){ const T=tgt(); out.set(T.x,0,T.z); if(!lead||decoy) return out;
  let t=Math.hypot(T.x-fx,T.z-fz)/Math.max(1,spd); for(let k=0;k<2;k++){ out.set(T.x+AIR.pv.x*t*lead,0,T.z+AIR.pv.z*t*lead); t=Math.hypot(out.x-fx,out.z-fz)/Math.max(1,spd); }
  const ox=out.x-T.x, oz=out.z-T.z, ol=Math.hypot(ox,oz); if(ol>maxLead){ out.x=T.x+ox/ol*maxLead; out.z=T.z+oz/ol*maxLead; }
  out.x=clamp(out.x,-AX,AX); out.z=clamp(out.z,-AZ,AZ); return out; }
