// Seraph Breaker · flow.js: Level flow: launching a level, room transitions, results, pause.
/* ================= LEVEL FLOW ================= */
function clearWorld(){
  clearEnemiesAndShots(); if(!BEAT.force) AU.tempoK=1; clearRoom(); clearJuice(); clearDust(); clearTraps();
  fx.forEach(f=>{ scene.remove(f.obj); fxDispose(f); }); fx.length=0;
  if(buddy){ scene.remove(buddy.g); buddy=null; } if(wingman){ scene.remove(wingman.g); wingman=null; } chrono=0; clearBlasts();
  if(player){ scene.remove(player.model.g,player.model.shadow); player=null; }
  orbitG.children.slice().forEach(c=>orbitG.remove(c));
  shieldG.visible=false; pBeamO.visible=pBeamC.visible=false; chargeOrb.visible=false; odRing.visible=false; hookLine.visible=hookHead.visible=false; dashArrow.visible=barRing.visible=false; setCrosshair(false);
  HC_CAM.t=0; camZoom=1; cam.zoom=1; cam.updateProjectionMatrix(); AX=roomHalfX(); AZ=ROOM_Z; room=null;
}
function refreshControls(){
  const on=playing()&&state!=='cine'&&state!=='choice';
  ['hudL','hudR','xpTrack','rsBar'].forEach(id=>$(id).hidden=!on);
  $('abBar').hidden=!on||mobileMode; $('touch').hidden=!on||!mobileMode; $('tSH').hidden=P.mshield!=='manual';
  $('bossHud').hidden=!(on&&(boss||room&&room.timer)&&state!=='bossdeath'); $('bossHud').classList.toggle('timer',!boss&&!!(room&&room.timer));
  if(on) renderAbilityIcons();
}
function hideOverlays(){ ['menu','result','pause','card','warn','cine','choice'].forEach(id=>$(id).hidden=true); $('cine').classList.remove('on'); }
function goNextRoom(){ if(state!=='fight') return; logRoomEnd('exit'); saveRun(sortie.ri+1); setState('trans'); stateT=.45; sortie.swapped=false; $('fade').classList.add('on'); resetTouch(); }
function showResult(win,bonusG=0,first=false){
  setState('result'); refreshControls(); resetTouch(); playTrack('menu');
  const A=ARENAS[sortie.a], reached=Math.min(sortie.ri+1,sortie.N);
  if(!win){ logRoomEnd('death'); clearRun(); if(reached>(P.bestRoom[sortie.a]||0)) P.bestRoom[sortie.a]=reached; }
  $('resEye').textContent=t('Arena {0}','0'+(sortie.a+1))+' · '+A.phase+' · '+A.name+(win?' · '+t('clear'):'');
  $('resTitle').innerHTML=win?t('Arena <em>Clear</em>'):t('Signal <em>Lost</em>');
  $('resEarn').innerHTML=`<span class="cur gold"><i></i>+${sortie.gold}</span><span class="cur gem"><i></i>+${sortie.gems}</span>`+(win&&bonusG?`<small>${t(first?'First clear bonus: {0} diamonds':'Clear bonus: {0} diamonds',bonusG)}</small>`:'')+(!win?'<small>'+t('Gold and diamonds you picked up are kept.')+'</small>':'')
    +(sortie.farm<1?`<small>${t('Replay below your highest arena: rewards {0}%',Math.round(sortie.farm*100))}</small>`:'')+(sortie.tester?'<small>'+t('Tester run: flagged, never ranked')+'</small>':'')+(sortie.retries?`<small>${t('Boss retries: {0}',sortie.retries)}</small>`:'');
  const mm=Math.floor(playTime/60),ss=Math.floor(playTime%60).toString().padStart(2,'0');
  const rs=runScore(win);
  const st=$('resStats'); st.innerHTML=''; [[t('Pilot'),P.pilot||t('Pilot')],[t('Frame'),unit.name],[t('Rooms cleared'),`${rs.rooms} / ${sortie.N}`],[t('Best room'),`${P.bestRoom[sortie.a]||0} / ${sortie.N}`],[t('Pilot level'),sortie.lv],[t('Kills'),kills],[t('Time'),`${mm}:${ss}`],[t('Damage taken'),rs.taken],
    [t('Run score'),rs.total.toLocaleString()],['',t(rs.rooms===1?'{0} room × {1} · speed +{2} · damage −{3}':'{0} rooms × {1} · speed +{2} · damage −{3}',rs.rooms,RUN_SCORE.room,rs.speed,rs.dmg)]].forEach(([a,b],i,arr)=>{ const s=document.createElement('span'); s.textContent=a; const v=document.createElement('b'); v.textContent=b; if(i>=arr.length-2){ s.className=v.className='rsc'; } st.append(s,v); });
  const kit=$('resKit'); kit.innerHTML=''; kit.append(...runIcons());
  const nb=$('resNext'), a=sortie.a, retry=!win&&canRetryBoss();
  if(win&&a+1<ARENAS.length){ nb.textContent=t('Next arena ▸'); nb.onclick=()=>launchArena(a+1); }
  else { nb.textContent=t(win?'Run it again':'Retry arena'); nb.onclick=()=>launchArena(a); }
  // down in a boss room: Retry boss (run.js retryBoss) or Return to base
  $('resRetry').hidden=!retry; nb.hidden=retry; $('resHome').textContent=t(retry?'Return to base':'Hangar');
  persist();
  $('result').hidden=false;
}
/* run score (result screen only): RUN_SCORE.room per cleared room, plus RUN_SCORE.speed per second under par (RUN_SCORE.par seconds a room, or the arena's par),
   minus RUN_SCORE.dmg per armor point lost */
const RUN_SCORE={room:1000,par:40,speed:10,dmg:2};
function runScore(win){ const rooms=win?sortie.N:sortie.ri+(room&&room.cleared?1:0), taken=Math.round(sortie.dmgTaken||0), par=ARENAS[sortie.a].par||RUN_SCORE.par;
  const speed=Math.round(Math.max(0,rooms*par-playTime)*RUN_SCORE.speed), dmg=taken*RUN_SCORE.dmg;
  return {rooms,taken,speed,dmg,total:Math.max(0,rooms*RUN_SCORE.room+speed-dmg)}; }
function togglePause(){ if(!playing()||state==='cine'||state==='choice') return; paused=!paused; $('pause').hidden=!paused; resetTouch(); hideRsPop(); for(const k in keys)keys[k]=false; mouseDown=rightDown=false; if(paused){ renderPauseBuild(); persist(); } }
function toMenu(view){ bossSnap=null; $('hubris').style.opacity=0; $('hubRow').hidden=$('hubBar').hidden=true; persist(); hideOverlays(); clearWorld(); setState('menu'); paused=false; refreshControls(); applyTheme(0); playTrack('menu'); openView(view||'home'); $('menu').hidden=false; }
$('resumeBtn').onclick=togglePause;
// Save & exit keeps the run at the last cleared room; Abandon ends it (loot already picked up is kept)
$('quitBtn').onclick=()=>toMenu('home');
$('abandonBtn').onclick=()=>{ clearRun(); togglePause(); showResult(false); };
$('resRetry').onclick=retryBoss; $('resMap').onclick=()=>toMenu('map'); $('resHome').onclick=()=>toMenu('home');
$('cineSkip').onclick=endCine;
$('muteBtn').onclick=()=>{ AU.muted=!AU.muted; setVolumes(); $('muteBtn').textContent=t(AU.muted?'Music: off':'Music: on'); };
