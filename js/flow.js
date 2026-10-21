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
function launchLevel(n){
  audioInit(); clearWorld(); hideOverlays(); paused=false; $('vign').style.opacity=0;
  const inf=levelInfo(n); stage=inf.s; applyTheme(stage);
  makePlayer();
  $('uName').innerHTML=''; const nm=document.createElement('span'); nm.textContent=P.pilot||'Pilot'; const sm=document.createElement('small'); sm.textContent=' · '+unit.name; const lv=document.createElement('em'); lv.id='lvTxt'; lv.textContent='LV 1'; $('uName').append(nm,sm,lv);
  sortie={n,rooms:inf.rooms,ri:0,xp:0,lv:1,pendingLv:0,gold:0,gems:0,start:performance.now()};
  score=0; kills=0; playTime=0;
  buildRoom(ROOM_X,ROOM_Z,SANCTUM,true); player.pos.set(0,0,AZ-1.5); camTarget.copy(player.pos);
  $('cardNum').textContent=`STAGE 0${stage+1} · LEVEL ${String(n+1).padStart(2,'0')}/12`; $('cardT').textContent=inf.name; $('cardS').textContent=`${inf.stage.name} · ${inf.rooms.length} rooms`;
  const c=$('card'); c.hidden=false; const inner=c.firstElementChild; inner.style.animation='none'; void inner.offsetWidth; inner.style.animation='';
  state='card'; stateT=2; refreshControls(); playTrack('battle');
}
function goNextRoom(){ if(state!=='fight') return; state='trans'; stateT=.45; sortie.swapped=false; $('fade').classList.add('on'); resetTouch(); }
function levelComplete(){
  const inf=levelInfo(sortie.n), first=sortie.n===P.progress;
  let bonusG=0;
  if(inf.boss) bonusG=first?BOSSES[inf.stage.boss].gems:8; else bonusG=first?5+stage*2:1;
  P.gems+=bonusG; sortie.gems+=bonusG;
  if(first) P.progress=Math.min(12,P.progress+1);
  if(inf.boss&&inf.s===2&&first) P.clears++;
  if(score>P.best) P.best=score;
  persist();
  showResult(true,bonusG,first);
}
function showResult(win,bonusG=0,first=false){
  state='result'; refreshControls(); resetTouch(); playTrack('menu');
  const n=sortie.n, inf=levelInfo(n);
  $('resEye').textContent=win?`${inf.stage.name} · Level ${String(n+1).padStart(2,'0')} clear`:`${inf.stage.name} · Level ${String(n+1).padStart(2,'0')}`;
  $('resTitle').innerHTML=win?(n===11?'Seraph <em>Down</em>':'Level <em>Clear</em>'):'Signal <em>Lost</em>';
  $('resEarn').innerHTML=`<span class="cur gold"><i></i>+${sortie.gold}</span><span class="cur gem"><i></i>+${sortie.gems}</span>`+(win&&bonusG?`<small>${first?'First clear bonus':'Clear bonus'}: ${bonusG} diamonds</small>`:'');
  const mm=Math.floor(playTime/60),ss=Math.floor(playTime%60).toString().padStart(2,'0');
  const st=$('resStats'); st.innerHTML=''; [['Pilot',P.pilot||'Pilot'],['Frame',unit.name],['Rooms',`${Math.min(sortie.ri+1,sortie.rooms.length)} / ${sortie.rooms.length}`],['Pilot level',sortie.lv],['Kills',kills],['Score',String(score).padStart(6,'0')],['Time',`${mm}:${ss}`]].forEach(([a,b])=>{ const s=document.createElement('span'); s.textContent=a; const v=document.createElement('b'); v.textContent=b; st.append(s,v); });
  const nb=$('resNext');
  if(win&&n<11){ nb.textContent='Next level ▸'; nb.onclick=()=>launchLevel(n+1); }
  else if(win){ nb.textContent='Replay finale'; nb.onclick=()=>launchLevel(n); }
  else { nb.textContent='Retry level'; nb.onclick=()=>launchLevel(n); }
  if(!win) persist();
  $('result').hidden=false;
}
function togglePause(){ if(!playing()||state==='cine'||state==='choice') return; paused=!paused; $('pause').hidden=!paused; resetTouch(); for(const k in keys)keys[k]=false; mouseDown=rightDown=false; if(paused) persist(); }
function toMenu(view){ persist(); hideOverlays(); clearWorld(); state='menu'; paused=false; refreshControls(); applyTheme(0); playTrack('menu'); openView(view||'home'); $('menu').hidden=false; }
$('resumeBtn').onclick=togglePause; $('quitBtn').onclick=()=>toMenu('map');
$('resMap').onclick=()=>toMenu('map'); $('resHome').onclick=()=>toMenu('home');
$('cineSkip').onclick=endCine;
$('muteBtn').onclick=()=>{ AU.muted=!AU.muted; setVolumes(); $('muteBtn').textContent='Music: '+(AU.muted?'off':'on'); };
