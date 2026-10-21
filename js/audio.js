// Seraph Breaker · audio.js: Synthesized soundtrack (TRACKS) and sound effects (sfx). No audio files.
/* ================= AUDIO (synthesized) ================= */
const AU={ctx:null,want:'menu',muted:false};
const TRACKS={
  menu:{bpm:96,song:[0,1],bars:[
    {g:'0-------3---1---',k:'k.......k.k.....',s:'........s.......',h:'c...h...h...h...'},
    {g:'0-------6---5-3-',k:'k.......k.k.....',s:'........s.......',h:'h...h...h...h...'}]},
  battle:{bpm:168,song:[0,1,0,2,0,1,3,2],bars:[
    {g:'x.xxx.xxx.xx3-5-',k:'k.kkk.kkk.kkk.k.',s:'....s.......s...',h:'c.h.h.h.h.h.h.h.'},
    {g:'x.xxx.xxx.xx6-5-',k:'k.kkk.kkk.kkk.k.',s:'....s.......s...',h:'h.h.h.h.h.h.h.h.'},
    {g:'0---x.x.3---x.x.',k:'k...k.k.k...k.k.',s:'....s.......s...',h:'c...h.h.h.h.h.h.'},
    {g:'xx6-xx5-xx3-2-1-',k:'kkkkkkkkkkkkkkkk',s:'....s.......s...',h:'h.h.h.h.h.h.h.h.'}]},
  boss:{bpm:186,song:[0,1,0,1,2,2,3,1],bars:[
    {g:'xxxxxxxx1-xx1-xx',k:'kkkkkkkkkkkkkkkk',s:'....s.......s...',h:'c.h.h.h.h.h.h.h.'},
    {g:'xxxxxxxx6-xx5-3-',k:'kkkkkkkkkkkkkkkk',s:'....s.......s...',h:'h.h.h.h.h.h.h.h.'},
    {g:'0-----x.x.x.1---',k:'k.....k.k.k.k...',s:'........s.......',h:'c.......h.h.h.h.'},
    {g:'x.x.x.x.6.6.6.6.',k:'k.k.k.k.k.k.k.k.',s:'.s.s.s.s.s.s.s.s',h:'hhhhhhhhhhhhhhhh'}]},
};
for(const t of Object.values(TRACKS)) t.bars.forEach(b=>{ b.ev=[]; for(let i=0;i<16;i++){ const ch=b.g[i]; if(ch==='.'||ch==='-') continue; let len=1; while(i+len<16&&b.g[i+len]==='-') len++; b.ev[i]={n:ch==='x'?0:parseInt(ch,10),mute:ch==='x',len}; } });
function distCurve(k){ const n=2048,c=new Float32Array(n); for(let i=0;i<n;i++){ const x=i*2/n-1; c[i]=Math.tanh(k*x)/Math.tanh(k); } return c; }
function audioInit(){
  if(AU.ctx){ if(AU.ctx.state==='suspended') AU.ctx.resume(); return; }
  const C=window.AudioContext||window.webkitAudioContext; if(!C) return;
  let ctx; try{ ctx=new C(); }catch(e){ return; }
  AU.ctx=ctx;
  const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-12; comp.ratio.value=4; comp.connect(ctx.destination);
  AU.master=ctx.createGain(); AU.master.gain.value=.9; AU.master.connect(comp);
  AU.music=ctx.createGain(); AU.music.connect(AU.master);
  AU.sfx=ctx.createGain(); AU.sfx.connect(AU.master);
  setVolumes();
  const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=75;
  const pre=ctx.createGain(); pre.gain.value=2.2;
  const sh=ctx.createWaveShaper(); sh.curve=distCurve(9); sh.oversample='2x';
  const mid=ctx.createBiquadFilter(); mid.type='peaking'; mid.frequency.value=750; mid.gain.value=-7; mid.Q.value=.9;
  const pres=ctx.createBiquadFilter(); pres.type='peaking'; pres.frequency.value=2600; pres.gain.value=5; pres.Q.value=1;
  const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=5200;
  const gOut=ctx.createGain(); gOut.gain.value=.17;
  hp.connect(pre); pre.connect(sh); sh.connect(mid); mid.connect(pres); pres.connect(lp); lp.connect(gOut);
  const pl=ctx.createStereoPanner?ctx.createStereoPanner():null, pr=ctx.createStereoPanner?ctx.createStereoPanner():null, dl=ctx.createDelay(); dl.delayTime.value=.014;
  if(pl&&pr){ pl.pan.value=-.6; pr.pan.value=.6; gOut.connect(pl); pl.connect(AU.music); gOut.connect(dl); dl.connect(pr); pr.connect(AU.music); } else gOut.connect(AU.music);
  AU.gtr=hp;
  const bl=ctx.createBiquadFilter(); bl.type='lowpass'; bl.frequency.value=700; const bg=ctx.createGain(); bg.gain.value=.55; bl.connect(bg); bg.connect(AU.music); AU.bass=bl;
  AU.drums=ctx.createGain(); AU.drums.gain.value=.8; AU.drums.connect(AU.music);
  const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; AU.noise=nb;
  AU.mus={name:null};
  playTrack(AU.want);
  setInterval(tickMusic,30);
}
function setVolumes(){ if(!AU.ctx)return; AU.music.gain.value=AU.muted?0:P.music*.9; AU.sfx.gain.value=P.sfx; }
function playTrack(name){ AU.want=name; if(!AU.ctx||AU.mus.name===name) return; AU.mus={name,t:TRACKS[name],bar:0,step:0,next:AU.ctx.currentTime+.06}; }
function noiseSrc(t,dur){ const s=AU.ctx.createBufferSource(); s.buffer=AU.noise; s.start(t,Math.random()*.5,dur+.05); return s; }
function env(t,peak,att,dec){ const g=AU.ctx.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+att); g.gain.exponentialRampToValueAtTime(.0008,t+att+dec); return g; }
function gtrNote(t,n,len,mute){
  const ctx=AU.ctx, root=82.41*Math.pow(2,n/12), dur=mute?.1:Math.max(.08,len-.02);
  const e=ctx.createGain(); const pk=mute?.5:.38; e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(pk,t+.004);
  if(mute) e.gain.exponentialRampToValueAtTime(.001,t+dur); else { e.gain.setValueAtTime(pk*.8,t+dur-.03); e.gain.exponentialRampToValueAtTime(.001,t+dur+.06); }
  e.connect(AU.gtr);
  let dest=e;
  if(mute){ const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(1500,t); f.frequency.exponentialRampToValueAtTime(350,t+.08); f.connect(e); dest=f; }
  for(const iv of (mute?[0,7]:[0,7,12])) for(const dt of [-9,9]){ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=root*Math.pow(2,iv/12); o.detune.value=dt; o.connect(dest); o.start(t); o.stop(t+dur+.1); }
  const b=ctx.createOscillator(); b.type='sawtooth'; b.frequency.value=root/2; const bge=env(t,.6,.005,dur+.04); b.connect(bge); bge.connect(AU.bass); b.start(t); b.stop(t+dur+.1);
}
function kick(t){ const ctx=AU.ctx,o=ctx.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(155,t); o.frequency.exponentialRampToValueAtTime(42,t+.09); const g=env(t,1,.002,.22); o.connect(g); g.connect(AU.drums); o.start(t); o.stop(t+.3);
  const n=noiseSrc(t,.02), f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=2500; const ng=env(t,.25,.001,.015); n.connect(f); f.connect(ng); ng.connect(AU.drums); }
function snare(t){ const ctx=AU.ctx,n=noiseSrc(t,.2),f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1900; f.Q.value=.7; const g=env(t,.75,.001,.17); n.connect(f); f.connect(g); g.connect(AU.drums);
  const o=ctx.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(160,t+.08); const og=env(t,.45,.001,.09); o.connect(og); og.connect(AU.drums); o.start(t); o.stop(t+.15); }
function hat(t,open){ const n=noiseSrc(t,open?.3:.05),f=AU.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=7500; const g=env(t,open?.22:.16,.001,open?.25:.035); n.connect(f); f.connect(g); g.connect(AU.drums); }
function crash(t){ const n=noiseSrc(t,1.3),f=AU.ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=4200; const g=env(t,.3,.002,1.2); n.connect(f); f.connect(g); g.connect(AU.drums); }
function tickMusic(){
  const m=AU.mus; if(!AU.ctx||!m||!m.t||AU.ctx.state!=='running') return;
  const now=AU.ctx.currentTime; if(m.next<now-.25) m.next=now+.05;
  const spb=60/m.t.bpm/4;
  while(m.next<now+.15){
    const bar=m.t.bars[m.t.song[m.bar]], i=m.step, t=m.next;
    const ev=bar.ev[i]; if(ev) gtrNote(t,ev.n,ev.len*spb,ev.mute);
    if(bar.k[i]==='k') kick(t); if(bar.s[i]==='s') snare(t);
    const h=bar.h[i]; if(h==='h') hat(t,false); else if(h==='o') hat(t,true); else if(h==='c') crash(t);
    m.step++; if(m.step>=16){ m.step=0; m.bar=(m.bar+1)%m.t.song.length; }
    m.next+=spb;
  }
}
const sfxLast={};
function sfx(kind){
  if(!AU.ctx||AU.ctx.state!=='running'||P.sfx<=0) return;
  const ctx=AU.ctx,t=ctx.currentTime;
  const gap={shot:.05,hit:.04,coin:.03,torch:.09,zap:.08}[kind]||0;
  if(gap&&sfxLast[kind]&&t-sfxLast[kind]<gap) return; sfxLast[kind]=t;
  const osc=(type,f0,f1,dur,peak)=>{ const o=ctx.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur); const g=env(t,peak,.002,dur); o.connect(g); g.connect(AU.sfx); o.start(t); o.stop(t+dur+.05); };
  const nz=(type,f,dur,peak,q=1)=>{ const n=noiseSrc(t,dur),fl=ctx.createBiquadFilter(); fl.type=type; fl.frequency.value=f; fl.Q.value=q; const g=env(t,peak,.002,dur); n.connect(fl); fl.connect(g); g.connect(AU.sfx); };
  switch(kind){
    case 'shot': osc('square',900,180,.06,.05); break;
    case 'heavy': osc('sawtooth',300,60,.18,.12); nz('lowpass',1200,.12,.2); break;
    case 'boom': nz('lowpass',700,.45,.55); osc('sine',90,35,.35,.5); break;
    case 'bigboom': nz('lowpass',500,1.1,.8); osc('sine',70,25,.9,.8); break;
    case 'hit': nz('bandpass',2400,.05,.12,2); break;
    case 'hurt': osc('square',150,60,.18,.22); break;
    case 'coin': osc('sine',1320,1760,.07,.08); break;
    case 'gem': [880,1320,1760].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; const g=env(t+i*.06,.12,.003,.15); o.connect(g); g.connect(AU.sfx); o.start(t+i*.06); o.stop(t+i*.06+.2); }); break;
    case 'dash': nz('bandpass',1400,.18,.3,1.5); break;
    case 'shield': nz('bandpass',900,.06,.12,4); break;
    case 'special': osc('sawtooth',120,900,.5,.18); nz('lowpass',900,.6,.35); break;
    case 'beam': osc('sawtooth',80,60,.9,.25); nz('bandpass',600,.9,.25,.8); break;
    case 'torch': nz('bandpass',800,.1,.07,.7); break;
    case 'zap': osc('square',1800,400,.08,.06); nz('highpass',3000,.06,.1); break;
    case 'slash': nz('bandpass',3000,.12,.22,1.2); osc('triangle',700,200,.1,.08); break;
    case 'click': osc('square',600,600,.03,.04); break;
    case 'door': osc('triangle',440,880,.25,.12); osc('sine',660,1320,.3,.08); break;
    case 'perfect': [1568,2093,2637].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f; const g=env(t+i*.04,.11,.002,.35); o.connect(g); g.connect(AU.sfx); o.start(t+i*.04); o.stop(t+i*.04+.4); }); nz('highpass',5000,.25,.08); break;
    case 'lvup': [523,659,784,1046].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='square'; o.frequency.value=f; const g=env(t+i*.07,.07,.003,.16); o.connect(g); g.connect(AU.sfx); o.start(t+i*.07); o.stop(t+i*.07+.2); }); break;
  }
}
const unlock=()=>{ audioInit(); };
addEventListener('pointerdown',unlock); addEventListener('keydown',unlock);
