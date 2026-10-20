// Seraph Breaker · save.js: Save/load of player progress in localStorage (key and fields must stay compatible with existing saves).
/* ================= SAVE ================= */
const SAVE_KEY='seraph-breaker-save-v2';
const DEF_P={v:3,rev:0,pilot:'',unit:'azure',c1:null,c2:null,gold:0,gems:0,skills:{},owned:{},weapon:'sig',gadgets:['',''],music:.55,sfx:.7,best:0,clears:0,progress:0};
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
  p.pilot=String(p.pilot||'').slice(0,14);
  return p;
}
let P=freshP();
try{ const s=localStorage.getItem(SAVE_KEY); if(s) P=normP(JSON.parse(s)); }catch(e){}
function saveLocal(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(P)); }catch(e){} }
// P.rev only mattered for the removed cloud sync; it is still bumped so the saved format stays the same for older saves
function persist(){ P.rev=(P.rev||0)+1; saveLocal(); }
