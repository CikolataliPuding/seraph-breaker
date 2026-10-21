// Seraph Breaker · flow.js: Level flow: launching a level, room transitions, results, pause.
/* ================= LEVEL FLOW ================= */
function clearWorld(){
  clearEnemiesAndShots(); clearRoom(); clearJuice();
  fx.forEach(f=>{ scene.remove(f.obj); if(f.dispose&&f.obj.geometry) f.obj.geometry.dispose(); }); fx.length=0;
  if(buddy){ scene.remove(buddy.g); buddy=null; } chrono=0;
  if(player){ scene.remove(player.model.g,player.model.shadow); player=null; }
  orbitG.children.slice().forEach(c=>orbitG.remove(c));
  shieldG.visible=false; pBeamO.visible=pBeamC.visible=false; chargeOrb.visible=false; odRing.visible=false; hookLine.visible=hookHead.visible=false;
  camZoom=1; cam.zoom=1; cam.updateProjectionMatrix(); AX=9; AZ=15; room=null;
}
function refreshControls(){
  const on=playing()&&state!=='cine'&&state!=='choice';
  ['hudL','hudR','xpTrack','rsBar'].forEach(id=>$(id).hidden=!on);
  $('abBar').hidden=!on||mobileMode; $('touch').hidden=!on||!mobileMode;
  $('bossHud').hidden=!(on&&boss&&state!=='bossdeath');
  if(on) renderAbilityIcons();
}
function hideOverlays(){ ['menu','result','pause','card','warn','cine','choice'].forEach(id=>$(id).hidden=true); $('cine').classList.remove('on'); }
function goNextRoom(){ if(state!=='fight') return; if(room&&room.type==='angel') saveRun(sortie.ri+1); state='trans'; stateT=.45; sortie.swapped=false; $('fade').classList.add('on'); resetTouch(); }
function showResult(win,bonusG=0,first=false){
  state='result'; refreshControls(); resetTouch(); playTrack('menu');
  const A=ARENAS[sortie.a], reached=Math.min(sortie.ri+1,sortie.N);
  if(!win){ clearRun(); if(reached>(P.bestRoom[sortie.a]||0)) P.bestRoom[sortie.a]=reached; if(score>P.best) P.best=score; }
  $('resEye').textContent=`Arena 0${sortie.a+1} · ${A.name}`+(win?' · clear':'');
  $('resTitle').innerHTML=win?'Arena <em>Clear</em>':'Signal <em>Lost</em>';
  $('resEarn').innerHTML=`<span class="cur gold"><i></i>+${sortie.gold}</span><span class="cur gem"><i></i>+${sortie.gems}</span>`+(win&&bonusG?`<small>${first?'First clear bonus':'Clear bonus'}: ${bonusG} diamonds</small>`:'')+(!win?'<small>Gold and diamonds you picked up are kept.</small>':'');
  const mm=Math.floor(playTime/60),ss=Math.floor(playTime%60).toString().padStart(2,'0');
  const st=$('resStats'); st.innerHTML=''; [['Pilot',P.pilot||'Pilot'],['Frame',unit.name],['Rooms',`${reached} / ${sortie.N}`],['Best',`${P.bestRoom[sortie.a]||0} / ${sortie.N}`],['Pilot level',sortie.lv],['Kills',kills],['Score',String(score).padStart(6,'0')],['Time',`${mm}:${ss}`]].forEach(([a,b])=>{ const s=document.createElement('span'); s.textContent=a; const v=document.createElement('b'); v.textContent=b; st.append(s,v); });
  const kit=$('resKit'); kit.innerHTML=''; kit.append(...runIcons());
  const nb=$('resNext'), a=sortie.a;
  if(win&&a+1<ARENAS.length){ nb.textContent='Next arena ▸'; nb.onclick=()=>launchArena(a+1); }
  else { nb.textContent=win?'Run it again':'Retry arena'; nb.onclick=()=>launchArena(a); }
  persist();
  $('result').hidden=false;
}
function togglePause(){ if(!playing()||state==='cine'||state==='choice') return; paused=!paused; $('pause').hidden=!paused; resetTouch(); for(const k in keys)keys[k]=false; mouseDown=rightDown=false; if(paused) persist(); }
function toMenu(view){ persist(); hideOverlays(); clearWorld(); state='menu'; paused=false; refreshControls(); applyTheme(0); playTrack('menu'); openView(view||'home'); $('menu').hidden=false; }
$('resumeBtn').onclick=togglePause;
// Save & exit keeps the run at the last cleared room; Abandon ends it (loot already picked up is kept)
$('quitBtn').onclick=()=>toMenu('home');
$('abandonBtn').onclick=()=>{ clearRun(); togglePause(); showResult(false); };
$('resMap').onclick=()=>toMenu('map'); $('resHome').onclick=()=>toMenu('home');
$('cineSkip').onclick=endCine;
$('muteBtn').onclick=()=>{ AU.muted=!AU.muted; setVolumes(); $('muteBtn').textContent='Music: '+(AU.muted?'off':'on'); };
