// Seraph Breaker · audio.js: Synthesized soundtrack (TRACKS), the beat clock the Main Stage syncs to (BEAT), sound effects (sfx) and the slots for High-Co's form tracks (hcMusic; empty until files are added to assets/audio/).
/* ================= AUDIO (synthesized) ================= */
const AU={ctx:null,want:'menu',muted:false,tempoK:1,beatQ:[],ext:null,hcWant:-1};
const TRACKS={
  menu:{bpm:96,song:[0,1],bars:[
    {g:'0-------3---1---',k:'k.......k.k.....',s:'........s.......',h:'c...h...h...h...'},
    {g:'0-------6---5-3-',k:'k.......k.k.....',s:'........s.......',h:'h...h...h...h...'}]},
  battle:{bpm:168,song:[0,1,0,2,0,1,3,2],bars:[
    {g:'x.xxx.xxx.xx3-5-',k:'k.kkk.kkk.kkk.k.',s:'....s.......s...',h:'c.h.h.h.h.h.h.h.'},
    {g:'x.xxx.xxx.xx6-5-',k:'k.kkk.kkk.kkk.k.',s:'....s.......s...',h:'h.h.h.h.h.h.h.h.'},
    {g:'0---x.x.3---x.x.',k:'k...k.k.k...k.k.',s:'....s.......s...',h:'c...h.h.h.h.h.h.'},
    {g:'xx6-xx5-xx3-2-1-',k:'kkkkkkkkkkkkkkkk',s:'....s.......s...',h:'h.h.h.h.h.h.h.h.'}]},
  // Main Stage: a slower festival groove (kick on every beat), so the beat the mobs lock to is easy to hear and dash on
  stage:{bpm:128,song:[0,1,0,2,0,1,3,2],bars:[
    {g:'0-x.0-x.3-x.5-x.',k:'k...k...k...k...',s:'....s.......s...',h:'c.h.o.h.h.h.o.h.'},
    {g:'0-x.0-x.6-x.5-3-',k:'k...k...k...k.k.',s:'....s.......s...',h:'h.h.o.h.h.h.o.h.'},
    {g:'3---x.x.5---x.x.',k:'k...k...k...k...',s:'....s.......s.s.',h:'c...h.h.o...h.h.'},
    {g:'0.0.3.3.5.5.6-5-',k:'k.k.k.k.k.k.k.k.',s:'....s.......s...',h:'o.h.o.h.o.h.o.h.'}]},
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
  // the live band plays into AU.live, so a High-Co form track (hcMusic) can crossfade with it under the same music volume
  AU.live=ctx.createGain(); AU.live.connect(AU.music);
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
  if(pl&&pr){ pl.pan.value=-.6; pr.pan.value=.6; gOut.connect(pl); pl.connect(AU.live); gOut.connect(dl); dl.connect(pr); pr.connect(AU.live); } else gOut.connect(AU.live);
  AU.gtr=hp;
  const bl=ctx.createBiquadFilter(); bl.type='lowpass'; bl.frequency.value=700; const bg=ctx.createGain(); bg.gain.value=.55; bl.connect(bg); bg.connect(AU.live); AU.bass=bl;
  AU.drums=ctx.createGain(); AU.drums.gain.value=.8; AU.drums.connect(AU.live);
  const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; AU.noise=nb;
  AU.mus={name:null};
  playTrack(AU.want); if(AU.hcWant>=0) hcMusic(AU.hcWant);
  setInterval(tickMusic,30);
}
// ?mute=1 silences music and sound effects for this page load (local test sessions), without touching the saved volumes
AU.qmute=new URLSearchParams(location.search).get('mute')==='1';
function setVolumes(){ if(!AU.ctx)return; AU.music.gain.value=AU.muted||AU.qmute?0:P.music*.9; AU.sfx.gain.value=AU.qmute?0:P.sfx; }
function playTrack(name){ if(name!=='boss'&&!(name==='stage'&&stageFile())) hcMusicStop(); AU.want=name; if(name==='stage') stageMusic(); if(!AU.ctx||AU.mus.name===name) return; AU.mus={name,t:TRACKS[name],bar:0,step:0,next:AU.ctx.currentTime+.06}; AU.beatQ.length=0; }
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
  // tempoK: the Main Stage drummer (and the debug BPM override) speeds the live band up; read every step, so a change lands mid-bar
  const spb=60/(m.t.bpm*(AU.tempoK||1))/4;
  while(m.next<now+.15){
    const bar=m.t.bars[m.t.song[m.bar]], i=m.step, t=m.next;
    if(i%4===0){ AU.beatQ.push(t); if(AU.beatQ.length>16) AU.beatQ.shift(); }
    const ev=bar.ev[i]; if(ev) gtrNote(t,ev.n,ev.len*spb,ev.mute);
    if(bar.k[i]==='k') kick(t); if(bar.s[i]==='s') snare(t);
    const h=bar.h[i]; if(h==='h') hat(t,false); else if(h==='o') hat(t,true); else if(h==='c') crash(t);
    m.step++; if(m.step>=16){ m.step=0; m.bar=(m.bar+1)%m.t.song.length; }
    m.next+=spb;
  }
}
/* ================= BEAT CLOCK ================= */
/* The Main Stage's rule (Ritim senkronu): mob attacks land on the beat of the live music. BEAT follows the quarter notes tickMusic schedules,
   so it is exactly on the audible beat; with no running audio context (muted tab, suspended context, headless measurement) it falls back
   to its own clock at the same tempo (game time, so fast-forwarded measurement runs keep the beat too). idx counts beats, ph is 0..1 inside the current beat, hit is true on the tick a new beat starts.
   force: debug BPM override (also retunes the music through AU.tempoK). */
const BEAT={idx:0,ph:0,bpm:120,spb:.5,hit:false,force:0,src:'clock',lastT:0};
function beatTick(dt){
  const tr=TRACKS[AU.mus&&AU.mus.name||AU.want]||TRACKS.battle, live=!!(AU.ctx&&AU.ctx.state==='running'&&AU.mus&&AU.mus.t&&!(typeof DBG!=='undefined'&&(DBG.turbo>1||DBG.noRender)));
  if(extBeat()) return;
  if(BEAT.force) AU.tempoK=BEAT.force/tr.bpm;
  BEAT.bpm=tr.bpm*(AU.tempoK||1); BEAT.spb=60/BEAT.bpm; BEAT.hit=false;
  if(live){ const now=AU.ctx.currentTime; if(BEAT.src!=='audio'){ BEAT.src='audio'; BEAT.lastT=now-BEAT.ph*BEAT.spb; }
    while(AU.beatQ.length&&AU.beatQ[0]<=now){ BEAT.lastT=AU.beatQ.shift(); BEAT.idx++; BEAT.hit=true; }
    // the queue only runs ~0.15 s ahead: if it ever runs dry (tab hidden), keep counting at the tempo
    if(now-BEAT.lastT>=BEAT.spb*1.5&&!AU.beatQ.length){ BEAT.lastT+=BEAT.spb; BEAT.idx++; BEAT.hit=true; }
    BEAT.ph=clamp((now-BEAT.lastT)/BEAT.spb,0,.999); return; }
  BEAT.src='clock'; BEAT.ph+=dt/BEAT.spb; while(BEAT.ph>=1){ BEAT.ph-=1; BEAT.idx++; BEAT.hit=true; }
}
// seconds until the first beat at least minT away whose index is a multiple of every (attacks wind up for at least minT, then land on it)
BEAT.until=(minT=0,every=1)=>{ let t=(1-BEAT.ph)*BEAT.spb, i=BEAT.idx+1; for(let k=0;k<64&&(t<minT||i%every);k++){ t+=BEAT.spb; i++; } return t; };
// how close (seconds) the nearest beat is
BEAT.dist=()=>Math.min(BEAT.ph,1-BEAT.ph)*BEAT.spb;
/* ================= HIGH-CO FORM TRACKS ================= */
/* Music files: High-Co has one track per form (BOSSES.highco.tracks), the Main Stage rooms one looping part (STAGE.music), both in data.js.
   The files sit in assets/audio/ (git ignores it) and are only requested when the game runs on this computer (MUSIC_LOCAL): the published
   game never asks for them and keeps the live synthesized music. Each slot: src (the path), bpm (the track's tempo), offset (seconds from the
   file start to the first downbeat), start (where it starts; 0 = offset) and end (where it loops back to start; 0 = the whole file loops).
   An empty src keeps the live synthesized music and its BPM, and no file is requested.
   A file is fetched once a session (the compressed bytes are kept), decoded when it plays and played by Web Audio into AU.music, so the music
   volume, the Music on/off button and ?mute=1 apply, the loop part is sample-exact and the local server needs no range support. extPlay
   crossfades from what is playing (the live band or the previous file) and, given landIn seconds, starts the file a bar earlier so a downbeat
   falls exactly then (the next form's landing). While a file with a bpm plays, the beat clock (BEAT) follows the file's own position, so Main
   Stage beat sync and High-Co's attack timing follow that track. */
const HC_FADE=1.2, MUSIC_LOCAL=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname), MUSIC_BYTES=new Map();
function hcMusic(slot,landIn){
  AU.hcWant=slot; if(!AU.ctx) return; // no audio yet (no input so far): audioInit plays it
  extPlay((BOSSES.highco.tracks||[])[slot]||{},landIn,1); }
// a music file slot (src bpm offset start end) at gain vol: crossfades from what is playing; a missing file falls back to the live music
function extPlay(T,landIn,vol){
  const src=MUSIC_LOCAL?String(T.src||''):'', now=AU.ctx.currentTime, old=AU.ext;
  if(old&&old.src===src&&src){ extVol(vol); return; }
  if(old){ extFade(old); AU.ext=null; }
  if(!src){ AU.live.gain.setTargetAtTime(1,now,HC_FADE/3); return; }
  const g=AU.ctx.createGain(); g.gain.value=0; g.connect(AU.music);
  const off=+T.offset||0, x={src,g,node:null,bpm:+T.bpm||0,offset:off,start:+T.start||off,end:+T.end||0,vol,on:false,t0:0,ls:0,le:0,base:0,last:-1,asked:now}; AU.ext=x;
  if(!MUSIC_BYTES.has(src)) MUSIC_BYTES.set(src,fetch(src).then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); }));
  MUSIC_BYTES.get(src).then(b=>AU.ctx.decodeAudioData(b.slice(0))).then(buf=>{ if(AU.ext!==x) return; const n=AU.ctx.createBufferSource(), t=AU.ctx.currentTime;
    x.ls=x.end>x.start?x.start:0; x.le=x.end>x.start?Math.min(x.end,buf.duration):buf.duration;
    // from start, or (with a bpm and landIn) a bar earlier so a downbeat falls exactly landIn seconds after the call (decoding time included)
    let s=x.start; if(x.bpm>0&&landIn>0){ const bar=240/x.bpm, left=Math.max(0,landIn-(t-x.asked)); s=x.start+bar-(left%bar); while(s>=x.le-.5&&s>bar) s-=bar; }
    s=clamp(s,0,buf.duration-.05); n.buffer=buf; n.loop=true; n.loopStart=x.ls; n.loopEnd=x.le; n.connect(g); n.start(t,s); x.node=n; x.t0=t-s; x.on=true;
    g.gain.setTargetAtTime(x.vol,t,HC_FADE/3); AU.live.gain.setTargetAtTime(0,t,HC_FADE/3); })
  // a missing or broken file falls back to the live music (and is not asked for again this session)
  .catch(()=>{ if(AU.ext===x){ AU.ext=null; AU.live.gain.setTargetAtTime(1,AU.ctx.currentTime,.3); } });
}
// where the playing file is (seconds): straight on from where it started, then around the loop part
function extPos(X){ const p=AU.ctx.currentTime-X.t0; return p<X.le?p:X.ls+(p-X.ls)%(X.le-X.ls); }
function extFade(x){ if(!AU.ctx) return; x.g.gain.setTargetAtTime(0,AU.ctx.currentTime,HC_FADE/3); setTimeout(()=>{ try{ if(x.node) x.node.stop(); x.g.disconnect(); }catch(e){} },HC_FADE*1000+300); }
// the playing file's gain (the Main Stage rooms get louder room by room)
function extVol(v){ const X=AU.ext; if(!X||!AU.ctx) return; X.vol=v; if(X.on) X.g.gain.setTargetAtTime(v,AU.ctx.currentTime,.8); }
// Main Stage rooms: the looping part from STAGE.music, from vol[0] in the first room to vol[1] in the last room before the boss
const stageFile=()=>MUSIC_LOCAL&&!!(STAGE.music&&STAGE.music.src);
function stageMusic(){ if(!stageFile()||!AU.ctx) return; const M=STAGE.music, last=sortie?Math.max(1,sortie.N-2):1, k=sortie?clamp(sortie.ri/last,0,1):0;
  extPlay(M,0,M.vol[0]+(M.vol[1]-M.vol[0])*k); }
function hcMusicStop(){ AU.hcWant=-1; if(!AU.ctx) return; if(AU.ext){ extFade(AU.ext); AU.ext=null; } AU.live.gain.setTargetAtTime(1,AU.ctx.currentTime,.15); }
// beat clock from the playing file: absolute beats since the track's offset; a loop back keeps idx counting up in whole bars
function extBeat(){
  const X=AU.ext; if(!X||!X.on||!(X.bpm>0)||AU.ctx.state!=='running') return false;
  BEAT.bpm=X.bpm; BEAT.spb=60/X.bpm; BEAT.hit=false; BEAT.src='file';
  const pos=Math.max(0,(extPos(X)-X.offset)/BEAT.spb), i=Math.floor(pos);
  if(i<X.last) X.base+=Math.ceil((X.last+1)/4)*4;
  if(i!==X.last){ X.last=i; BEAT.idx=X.base+i; BEAT.hit=true; }
  BEAT.ph=clamp(pos-i,0,.999); return true;
}
const sfxLast={};
function sfx(kind){
  if(!AU.ctx||AU.ctx.state!=='running'||P.sfx<=0) return;
  const ctx=AU.ctx,t=ctx.currentTime;
  const gap={shot:.05,hit:.04,coin:.03,torch:.09,zap:.08,tick:.05,step:.07}[kind]||0;
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
    case 'step': osc('sine',95,38,.14,.2); nz('lowpass',320,.1,.12); break;
    case 'door': osc('triangle',440,880,.25,.12); osc('sine',660,1320,.3,.08); break;
    case 'perfect': [1568,2093,2637].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f; const g=env(t+i*.04,.11,.002,.35); o.connect(g); g.connect(AU.sfx); o.start(t+i*.04); o.stop(t+i*.04+.4); }); nz('highpass',5000,.25,.08); break;
    // crowd noise for High-Co's room: a swell of voices (crowd) and the final form's roar
    case 'crowd': case 'roar':{ const big=kind==='roar', dur=big?2.6:1.4; for(const f of [450,1000,2200]){ const n=noiseSrc(t,dur), fl=ctx.createBiquadFilter(); n.loop=true; fl.type='bandpass'; fl.frequency.value=f*(.9+Math.random()*.2); fl.Q.value=.9; const g=env(t,(big?.34:.2)*(f<600?1:.6),dur*.35,dur*.65); n.connect(fl); fl.connect(g); g.connect(AU.sfx); } break; }
    case 'tick': osc('square',1400+Math.random()*400,900,.025,.03); break;
    case 'r_common': osc('triangle',660,700,.12,.08); break;
    case 'r_rare': [660,990].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; const g=env(t+i*.05,.09,.003,.16); o.connect(g); g.connect(AU.sfx); o.start(t+i*.05); o.stop(t+i*.05+.2); }); break;
    case 'r_epic': [523,784,1046].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='sawtooth'; o.frequency.value=f; const g=env(t+i*.06,.06,.003,.22); o.connect(g); g.connect(AU.sfx); o.start(t+i*.06); o.stop(t+i*.06+.26); }); nz('highpass',4000,.3,.06); break;
    case 'r_legendary': [523,659,784,1046,1318].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='square'; o.frequency.value=f; const g=env(t+i*.07,.07,.003,.35); o.connect(g); g.connect(AU.sfx); o.start(t+i*.07); o.stop(t+i*.07+.4); }); osc('sine',80,40,.8,.3); nz('highpass',3000,.6,.1); break;
    case 'lvup': [523,659,784,1046].forEach((f,i)=>{ const o=ctx.createOscillator(); o.type='square'; o.frequency.value=f; const g=env(t+i*.07,.07,.003,.16); o.connect(g); g.connect(AU.sfx); o.start(t+i*.07); o.stop(t+i*.07+.2); }); break;
  }
}
const unlock=()=>{ audioInit(); };
addEventListener('pointerdown',unlock); addEventListener('keydown',unlock);
