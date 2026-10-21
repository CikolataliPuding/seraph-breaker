// Seraph Breaker · core.js: Shared helpers used by every other file. Loaded first, right after Three.js.
const $ = id => document.getElementById(id);
// build number from the ?v= cache-busting query in index.html (bump it on every release, see CONTRIBUTING.md)
const BUILD=(()=>{ try{ return new URL(document.currentScript.src).searchParams.get('v')||'dev'; }catch(e){ return 'dev'; } })();
const V3 = THREE.Vector3;
const rand = (a,b) => a + Math.random()*(b-a);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const pickOne = a => a[(Math.random()*a.length)|0];
const lerpAngle = (a,b,t) => { const d = ((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI; return a+d*t; };
const CSS = c => '#'+c.toString(16).padStart(6,'0');
let mobileMode=false; // set by mobile.js: Archero-style portrait controls + axis-aligned camera
let isTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && !matchMedia('(pointer: fine)').matches);
document.body.classList.toggle('touch', isTouch);
const buzz = ms => { try{ if(isTouch && navigator.userActivation && navigator.userActivation.hasBeenActive && navigator.vibrate) navigator.vibrate(ms); }catch(e){} };
