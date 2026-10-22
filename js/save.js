// Seraph Breaker · save.js: Save/load of player progress in localStorage (key and fields must stay compatible with existing saves).
/* ================= SAVE ================= */
const SAVE_KEY='seraph-breaker-save-v2';
// v4: the AI / level design update. beta: the save existed before it (badge). testerCode / testerSave / testerTools: tester mode (tester.js).
const DEF_P={v:4,beta:false,testerCode:'',testerSave:false,testerTools:false,rev:0,pilot:'',unit:'azure',c1:null,c2:null,gold:0,gems:0,skills:{},owned:{},weapon:'sig',gadgets:['',''],music:.55,sfx:.7,best:0,clears:0,progress:0,ctrl:'auto',autoGadget:false,mshield:'auto',arenas:1,bestRoom:[0,0,0,0],selArena:0,core:{armor:0,dmg:0,regen:0}};
const freshP = () => JSON.parse(JSON.stringify(DEF_P));
function normP(d){
  const p=freshP();
  if(d&&typeof d==='object') for(const k in p) if(d[k]!==undefined&&d[k]!==null) p[k]=d[k];
  if(!UNITS[p.unit]) p.unit='azure';
  if(typeof p.skills!=='object'||!p.skills) p.skills={};
  if(typeof p.owned!=='object'||!p.owned) p.owned={};
  if(!WEAPONS[p.weapon]||(p.weapon!=='sig'&&!p.owned[p.weapon])) p.weapon='sig';
  p.gadgets=Array.isArray(p.gadgets)?[0,1].map(i=>GADGETS[p.gadgets[i]]&&p.owned[p.gadgets[i]]?p.gadgets[i]:''):['',''];
  p.gold=Math.max(0,Math.floor(+p.gold||0)); p.gems=Math.max(0,Math.floor(+p.gems||0));
  p.progress=clamp(Math.floor(+p.progress||0),0,12);
  // saves from the 12-level campaign: progress 4/8/12 unlock arenas 2/3/4
  if(!d||typeof d.arenas!=='number') p.arenas=p.progress>=12?4:p.progress>=8?3:p.progress>=4?2:1;
  p.arenas=clamp(Math.floor(+p.arenas||1),1,4); p.selArena=clamp(Math.floor(+p.selArena||0),0,p.arenas-1);
  const c=p.core&&typeof p.core==='object'?p.core:{}; p.core={}; for(const k of ['armor','dmg','regen']) p.core[k]=clamp(Math.floor(+c[k]||0),0,30);
  p.bestRoom=[0,1,2,3].map(i=>Math.max(0,Math.floor(+(Array.isArray(p.bestRoom)&&p.bestRoom[i])||0)));
  p.pilot=String(p.pilot||'').slice(0,14);
  p.beta=!!p.beta; p.testerCode=String(p.testerCode||'').slice(0,60); p.testerSave=!!p.testerSave; p.testerTools=!!p.testerTools;
  if(!['auto','mobile','desktop'].includes(p.ctrl)) p.ctrl='auto'; p.autoGadget=!!p.autoGadget; if(!['auto','manual'].includes(p.mshield)) p.mshield='auto';
  return p;
}
let P=freshP();
// a save from before v4 earns the beta tester badge
try{ const s=localStorage.getItem(SAVE_KEY); if(s){ const d=JSON.parse(s); P=normP(d); if(!(d&&d.v>=4)) P.beta=true; P.v=4; } }catch(e){}
function saveLocal(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(P)); }catch(e){} }
// P.rev only mattered for the removed cloud sync; it is still bumped so the saved format stays the same for older saves
function persist(){ P.rev=(P.rev||0)+1; saveLocal(); }
