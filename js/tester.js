// Seraph Breaker · tester.js: Tester mode (unlocked with a code in System), the beta tester badge and the farm check (reward share by arena).
/* ================= TESTER MODE ================= */
/* The repo only keeps the SHA-256 of the tester code; the code itself is handed to testers. A pilot who enters it in System keeps it in
   their save (P.testerCode) and it is checked against TESTER_HASH on every boot. Tester tools (the debug panel, ?debug=1, measurement)
   only work while the code checks out. Leaderboard rule for later: never submit a run with run.tester / sortie.tester set or from a save
   with P.testerSave set (both are set as soon as tester tools touch a run or a save). */
const TESTER_HASH='3755d91554327015459c109d2b4e24471b2dc069ce6132b6ec1798fd603c4d43';
// SHA-256 of a UTF-8 string, as hex. Plain JS so it also works where crypto.subtle is missing (file://, old browsers).
function sha256(str){
  const K=[], H0=[]; for(let p=2;K.length<64;p++){ let pr=true; for(let d=2;d*d<=p;d++) if(p%d===0){ pr=false; break; } if(!pr) continue; if(H0.length<8) H0.push((Math.sqrt(p)%1)*4294967296|0); K.push((Math.cbrt(p)%1)*4294967296|0); }
  const b=new TextEncoder().encode(str), l=b.length, n=((l+9+63)>>6)<<6, m=new Uint8Array(n); m.set(b); m[l]=0x80;
  const dv=new DataView(m.buffer); dv.setUint32(n-4,(l*8)>>>0); dv.setUint32(n-8,Math.floor(l*8/4294967296));
  const h=H0.slice(), w=new Int32Array(64), r=(x,k)=>x>>>k|x<<(32-k);
  for(let o=0;o<n;o+=64){
    for(let i=0;i<16;i++) w[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){ const a=w[i-15],c=w[i-2]; w[i]=(w[i-16]+(r(a,7)^r(a,18)^a>>>3)+w[i-7]+(r(c,17)^r(c,19)^c>>>10))|0; }
    let [A,B,C,D,E,F,G,Hh]=h;
    for(let i=0;i<64;i++){ const t1=(Hh+(r(E,6)^r(E,11)^r(E,25))+((E&F)^(~E&G))+K[i]+w[i])|0, t2=((r(A,2)^r(A,13)^r(A,22))+((A&B)^(A&C)^(B&C)))|0; Hh=G; G=F; F=E; E=(D+t1)|0; D=C; C=B; B=A; A=(t1+t2)|0; }
    h[0]=(h[0]+A)|0; h[1]=(h[1]+B)|0; h[2]=(h[2]+C)|0; h[3]=(h[3]+D)|0; h[4]=(h[4]+E)|0; h[5]=(h[5]+F)|0; h[6]=(h[6]+G)|0; h[7]=(h[7]+Hh)|0; }
  return h.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
}
// codes are typed loosely: case, spaces and dashes do not matter
const normCode=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/(.{5})(?=.)/g,'$1-');
const testerOK=()=>!!P.testerCode&&sha256(normCode(P.testerCode))===TESTER_HASH;
function unlockTester(code){ if(sha256(normCode(code))!==TESTER_HASH) return false; P.testerCode=normCode(code); P.testerSave=true; persist(); return true; }
function lockTester(){ P.testerCode=''; P.testerTools=false; persist(); }

/* ================= FARM CHECK ================= */
/* replaying an arena below your highest unlocked one pays less (gold and diamonds; ECON.farm by how many arenas below). The highest arena always
   pays in full, and the big diamond bonus is only paid on a first clear. sortie.farm is fixed when the run starts. */
const farmMul=a=>ECON.farm[clamp((P.arenas-1)-a,0,ECON.farm.length-1)];
