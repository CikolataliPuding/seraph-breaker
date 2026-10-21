// Seraph Breaker · items.js: Run-only items: drops from elites and bosses, 4 slots with a swap choice, pickup models and room hooks.
/* ================= ITEMS ================= */
const ITEM_SLOTS=4;
// rarity roll for a drop (owned items are not offered again)
function rollItem(){
  const owned=sortie.items, w={common:RARITY.common.drop,rare:RARITY.rare.drop,epic:RARITY.epic.drop}, ids=Object.keys(ITEMS).filter(id=>!owned.includes(id));
  if(!ids.length) return null; let t=0; ids.forEach(id=>t+=w[ITEMS[id].rarity]||10); let x=Math.random()*t;
  for(const id of ids){ x-=w[ITEMS[id].rarity]||10; if(x<=0) return id; } return ids[0];
}
function itemModel(id){
  const d=ITEMS[id], col=RARITY[d.rarity].c, g=new THREE.Group(), M=toon(d.color), rc=new THREE.Color(col).getHex();
  const geo={box:()=>box(.55,.55,.55),oct:()=>new THREE.OctahedronGeometry(.42,0),torus:()=>new THREE.TorusGeometry(.32,.12,8,20),cyl:()=>new THREE.CylinderGeometry(.3,.3,.5,8),cone:()=>new THREE.ConeGeometry(.35,.7,6),sphere:()=>new THREE.SphereGeometry(.34,12,8)}[d.shape||'box']();
  const core=part(geo,M,g,0,0,0,.06); core.userData.spin=1;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.62,.72,6),addMat(rc,.9)); ring.rotation.x=-Math.PI/2; ring.position.y=-.55; g.add(ring);
  const glow=new THREE.Mesh(G.puff,addMat(rc,.25)); glow.scale.setScalar(2.2); g.add(glow);
  const beam=new THREE.Mesh(box(.5,6,.5),addMat(rc,.22)); beam.position.y=2.6; g.add(beam);
  return g;
}
function dropItem(pos,id){ id=id||rollItem(); if(!id) return; const m=itemModel(id); m.position.set(pos.x,1,pos.z); scene.add(m);
  const a=rand(0,Math.PI*2); pickups.push({m,kind:'item',id,v:0,t:0,life:1e9,vel:new V3(Math.cos(a)*2,rand(6,8),Math.sin(a)*2)}); sfx('gem'); groundRing(pos,new THREE.Color(RARITY[ITEMS[id].rarity].c).getHex(),2.5,.6); }
function addItem(id,silent){ const d=ITEMS[id]; if(!d||sortie.items.includes(id)) return; sortie.items.push(id); if(d.add) d.add(player); if(!silent){ renderRunSkills(); sfx('lvup'); popText(d.name.toUpperCase()); } }
function removeItem(id){ const i=sortie.items.indexOf(id); if(i<0) return; sortie.items.splice(i,1); const d=ITEMS[id]; if(d&&d.rem) d.rem(player); renderRunSkills(); }
// picking up a 5th item asks which one to drop
function takeItem(id){
  if(sortie.items.length<ITEM_SLOTS){ addItem(id); return; }
  const n=ITEMS[id], card=(x,act,tag)=>({icon:ITEMS[x].icon,name:ITEMS[x].name,desc:ITEMS[x].d,rarity:ITEMS[x].rarity,tag,act});
  const opts=sortie.items.map(x=>card(x,()=>{ removeItem(x); addItem(id); },'Drop this one'));
  opts.push({icon:'rear',name:'Leave '+n.name,desc:'Keep your four items. The new one is scrapped.',tag:'Discard new',color:'#a79fae',act:()=>{ sparks(player.pos.clone().setY(2),0xa79fae,6,4); }});
  openChoice({eyebrow:'Item slots full',title:`${n.name} found`,note:`${n.d} Pick an item to drop for it.`,options:opts});
}
// room hooks (called from rooms.js and main.js)
function onRoomStart(){ const p=player; if(!p) return; p.aegis=p.aegisN>0; if(p.reactor) p.sp=Math.min(100,p.sp+30*p.reactor); }
function onRoomClear(){ const p=player; if(!p) return; if(p.haloFrag) p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.05*p.haloFrag); }
// Mine Layer: dashing drops a proximity mine
function placeMine(pos){ if(mines.length>=10) return; const g=new THREE.Group(); part(new THREE.CylinderGeometry(.45,.5,.18,8),toon(0x2a2632),g,0,.09,0,.06); const l=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),basic(0x7dff9a,false)); l.position.y=.22; g.add(l); g.position.set(pos.x,0,pos.z); scene.add(g); mines.push({g,l,pos:pos.clone().setY(0),arm:.4,life:12}); }
