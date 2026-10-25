// Seraph Breaker · i18n.js: Game text languages. English is the source text and the lookup key; t() gives the active language.
/* The language is picked once per page load (changing it in System reloads the page): data tables are translated in place at the
   end of data.js (langData), the static markup right here (langDom), and code that writes text calls t(). A missing entry shows English.
   The choice lives in its own key, not in the save: data.js already needs it, and the save loads after data.js. LANG_AUTO follows the
   browser language; it stays off until the Turkish text is complete (patch.md 22). */
const LANGS={en:'English',tr:'Türkçe · beta'}, DICT={tr:DICT_TR}, LANG_KEY='seraph-breaker-lang', LANG_AUTO=false;
const LANG=(()=>{ let s=''; try{ s=localStorage.getItem(LANG_KEY)||''; }catch(e){} return LANGS[s]?s:LANG_AUTO&&/^tr\b/i.test(navigator.language||'')?'tr':'en'; })();
const LANG_MISS=new Set(); // English texts the active language has no entry for yet, as they show up: [...LANG_MISS] is the translator's to-do list
// t('Best room {0}/{1}',best,rooms): {n} are filled in after the lookup, so numbers never sit inside a key. Keep it out of per-frame code.
function t(s,...a){ let r=s; if(LANG!=='en'){ const d=DICT[LANG][s]; if(d) r=d; else LANG_MISS.add(s); } return a.length?r.replace(/\{(\d)\}/g,(m,i)=>a[i]!==undefined?a[i]:m):r; }
function langSet(k){ try{ localStorage.setItem(LANG_KEY,k); }catch(e){} location.reload(); }
// data tables: every string under a text key at any depth; all=true takes every string (plain lists of lines, like STORY)
const LANG_KEYS=new Set(['name','d','role','tag','n','t','branch','cls','epi','warn','roomsTxt','ruleTxt','cost','sub','passive']);
function langData(o,all){ for(const k in o){ const v=o[k];
  if(typeof v==='string'){ if(all||LANG_KEYS.has(k)) o[k]=t(v); }
  else if(v&&(Array.isArray(v)||Object.getPrototypeOf(v)===Object.prototype)) langData(v,all); } }
// static markup: text nodes and the aria-label / placeholder / title attributes, keyed by their trimmed English text
function langDom(root){ const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('script,style,svg')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  for(let n;(n=w.nextNode());){ const s=n.nodeValue, k=s.trim(); if(/[A-Za-z]/.test(k)) n.nodeValue=s.replace(k,()=>t(k)); }
  root.querySelectorAll('[aria-label],[placeholder],[title]').forEach(e=>['aria-label','placeholder','title'].forEach(a=>{ const k=e.getAttribute(a); if(k) e.setAttribute(a,t(k)); })); }
// the page language also makes CSS uppercase right for Turkish (i → İ)
document.documentElement.lang=LANG;
if(LANG!=='en') langDom(document.body);
