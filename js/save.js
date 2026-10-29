// Seraph Breaker · save.js: Save/load of player progress in localStorage (key and fields must stay compatible with existing saves).
/* ================= SAVE ================= */
const SAVE_KEY='seraph-breaker-save-v2';
// v4: the AI / level design update. beta: the save existed before it (badge). testerCode / testerSave / testerTools: tester mode (tester.js).
// v5: the Main Stage (a 5th arena): bestRoom gets a 5th slot, and a save that already cleared Arena 4 opens it.
// stageCode: the old Main Stage beta access code; unused since the stage opens with Arena 4's first clear (patch.md 31), kept so saves keep their fields.
// v6: frames are bought with diamonds (units: owned frames, Azure free). Saves from before v6 are beta saves and keep every frame.
// v7: paint colors are bought with gold (paints: owned colors). Saves from before v7 keep the colors their frame wears.
// v11: Hex Breach takes arena slot 4, the Main Stage moves to 5: its best room and story flag move with it (normP).
// v10: news: the id of the last patch notes the pilot has seen (ui-hangar.js newsBoot).
// v9: betaCode: the beta program code (tester.js); a valid one gives the BETA TESTER rank and keeps a local run log for the beta report.
// imported: the save came in through Import save (#55); sticky, so rankings can tell it apart later, like testerSave.
const DEF_P={v:11,beta:false,betaCode:'',news:'',testerCode:'',testerSave:false,testerTools:false,imported:false,stageCode:'',rev:0,pilot:'',unit:'azure',units:{azure:true},paints:[],lore:{intro:false,arenas:[]},c1:null,c2:null,gold:0,gems:0,skills:{},owned:{},weapon:'sig',gadgets:['',''],music:.55,sfx:.7,best:0,clears:0,progress:0,ctrl:'auto',autoGadget:false,mshield:'auto',shake:'auto',flashes:'auto',warnHi:false,arenas:1,bestRoom:[0,0,0,0,0],selArena:0,core:{armor:0,dmg:0,regen:0}};
const freshP = () => JSON.parse(JSON.stringify(DEF_P));
function normP(d){
  const p=freshP();
  if(d&&typeof d==='object') for(const k in p) if(d[k]!==undefined&&d[k]!==null) p[k]=d[k];
  // every field from a save is checked (#55: an imported file is hand-editable): only known ids, numbers finite and in range
  const has=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
  const own=(o,ids)=>{ const r={}; if(o&&typeof o==='object') for(const k in o) if(o[k]&&has(ids,k)) r[k]=true; return r; };
  const col=c=>Number.isInteger(c)&&c>=0&&c<=0xffffff;
  p.units=own(p.units,UNITS);
  if(d&&typeof d==='object'&&(+d.v||0)<6) for(const k in UNITS) p.units[k]=true;
  p.units.azure=true;
  if(!has(UNITS,p.unit)||!p.units[p.unit]) p.unit='azure';
  p.lore=p.lore&&typeof p.lore==='object'?{intro:!!p.lore.intro,arenas:Array.isArray(p.lore.arenas)?p.lore.arenas.map(Boolean):[]}:{intro:false,arenas:[]};
  p.c1=p.c1!=null&&col(+p.c1)?+p.c1:null; p.c2=p.c2!=null&&col(+p.c2)?+p.c2:null;
  p.paints=Array.isArray(p.paints)?[...new Set(p.paints.map(Number).filter(col))]:[];
  if(d&&typeof d==='object'&&(+d.v||0)<7) [p.c1,p.c2].forEach(c=>{ if(c!=null&&!p.paints.includes(c)) p.paints.push(c); });
  // a color is worn only if it is bought or one of the frame's own two
  const U=UNITS[p.unit]; ['c1','c2'].forEach(k=>{ if(p[k]!=null&&p[k]!==U.c1&&p[k]!==U.c2&&!p.paints.includes(p[k])) p[k]=null; });
  const sk=p.skills&&typeof p.skills==='object'?p.skills:{}; p.skills={};
  TREE.forEach(b=>b.nodes.forEach(n=>{ const r=clamp(Math.floor(+sk[n.id]||0),0,n.max); if(r) p.skills[n.id]=r; }));
  p.owned=own(p.owned,Object.assign({},WEAPONS,GADGETS));
  if(!has(WEAPONS,p.weapon)||(p.weapon!=='sig'&&!p.owned[p.weapon])) p.weapon='sig';
  p.gadgets=Array.isArray(p.gadgets)?[0,1].map(i=>has(GADGETS,p.gadgets[i])&&p.owned[p.gadgets[i]]?p.gadgets[i]:''):['',''];
  const num=(x,max)=>clamp(Math.floor(Number.isFinite(+x)?+x:0),0,max);
  p.gold=num(p.gold,1e9); p.gems=num(p.gems,1e9); p.best=num(p.best,1e12); p.clears=num(p.clears,1e6); p.rev=num(p.rev,1e12);
  p.music=clamp(Number.isFinite(+p.music)?+p.music:DEF_P.music,0,1); p.sfx=clamp(Number.isFinite(+p.sfx)?+p.sfx:DEF_P.sfx,0,1);
  p.progress=clamp(Math.floor(+p.progress||0),0,12);
  // saves from the 12-level campaign: progress 4/8/12 unlock arenas 2/3/4
  if(!d||typeof d.arenas!=='number') p.arenas=p.progress>=12?4:p.progress>=8?3:p.progress>=4?2:1;
  // v8: the Core caps at CORE_MAX (was 20, then 30; patch.md 27). Since the tier gate (patch.md 38) levels above the arena's cap stay saved and
  // count again when the next arena opens; CORE_MAX (40) is only a sanity cap
  const c=p.core&&typeof p.core==='object'?p.core:{}; p.core={}; for(const k of ['armor','dmg','regen']) p.core[k]=clamp(Math.floor(+c[k]||0),0,CORE_MAX);
  if(d&&typeof d==='object'&&(+d.v||0)<11){ if(Array.isArray(p.bestRoom)&&p.bestRoom.length>4) p.bestRoom.splice(4,0,0); if(p.lore.arenas.length>4) p.lore.arenas.splice(4,0,false); }
  p.bestRoom=ARENAS.map((A,i)=>clamp(Math.floor(+(Array.isArray(p.bestRoom)&&p.bestRoom[i])||0),0,A.rooms));
  // 4-arena saves: the last arena's clear used to cap the unlocks at 4, so a cleared Arena 4 opens the next arena now
  p.arenas=clamp(Math.floor(+p.arenas||1),1,ARENAS.length);
  for(let i=0;i<ARENAS.length-1;i++) if(p.bestRoom[i]>=ARENAS[i].rooms) p.arenas=Math.max(p.arenas,i+2);
  p.selArena=clamp(Math.floor(+p.selArena||0),0,ARENAS.length-1); // the menus move it onto an open arena (tester.js openSel)
  p.pilot=String(p.pilot||'').slice(0,14);
  p.beta=!!p.beta; p.betaCode=String(p.betaCode||'').slice(0,60); p.news=String(p.news||'').slice(0,40); p.testerCode=String(p.testerCode||'').slice(0,60); p.testerSave=!!p.testerSave; p.imported=!!p.imported; p.testerTools=!!p.testerTools; p.stageCode=String(p.stageCode||'').slice(0,60);
  if(!['auto','mobile','desktop'].includes(p.ctrl)) p.ctrl='auto'; p.autoGadget=!!p.autoGadget; if(!['auto','manual'].includes(p.mshield)) p.mshield='auto';
  // accessibility (#56): screen shake auto/full/low/off, flashes auto/full/reduced (auto follows the system's reduce-motion setting), high-contrast warnings
  if(!['auto','full','low','off'].includes(p.shake)) p.shake='auto'; if(!['auto','full','reduced'].includes(p.flashes)) p.flashes='auto'; p.warnHi=!!p.warnHi;
  return p;
}
let P=freshP();
// a save from before v4 earns the beta tester badge
try{ const s=localStorage.getItem(SAVE_KEY); if(s){ const d=JSON.parse(s); P=normP(d); if(!(d&&d.v>=4)) P.beta=true; P.v=DEF_P.v; } }catch(e){}
function saveLocal(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(P)); }catch(e){} }
// P.rev only mattered for the removed cloud sync; it is still bumped so the saved format stays the same for older saves
function persist(){ P.rev=(P.rev||0)+1; saveLocal(); }
