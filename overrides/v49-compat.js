/* VFIT PRO V49 compatibility guard for dynamic program structures. */
(() => {
  'use strict';
  function clampActiveSelection(){
    if(!Array.isArray(routines)||!routines.length){activeDay=0;activeEx=0;return;}
    if(!Number.isInteger(activeDay)||!routines[activeDay])activeDay=0;
    const list=routines[activeDay]?.ex;
    if(!Array.isArray(list)||!list.length){activeEx=0;return;}
    if(!Number.isInteger(activeEx)||!list[activeEx])activeEx=0;
  }
  const beforeDays=renderDays;
  renderDays=function(){clampActiveSelection();return beforeDays();};
  const beforeShow=show;
  show=function(id){clampActiveSelection();return beforeShow(id);};
  const beforeProgress=renderProgress;
  renderProgress=function(){clampActiveSelection();return beforeProgress();};
  window.VFITNavGuardV49={clamp:clampActiveSelection};

  // V511: persistent active-workout controls with an in-app finish dialog.
  // This avoids relying on window.confirm(), which can be unreliable in an
  // installed iPhone PWA. Existing workout/history identity remains untouched.
  const sessionStyle=document.createElement('style');
  sessionStyle.textContent=`
    #vfitSessionBar{position:fixed;left:50%;bottom:calc(72px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(540px,calc(100% - 20px));z-index:46;border:1px solid #31465b;background:rgba(8,17,27,.97);backdrop-filter:blur(18px);border-radius:18px;padding:10px;box-shadow:0 16px 36px rgba(0,0,0,.5)}
    #vfitSessionBar[hidden]{display:none!important}
    .vfitSessionInfo{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px}
    .vfitSessionCopy{min-width:0}.vfitSessionEyebrow{display:block;color:#ffad2e;font-size:9px;font-weight:900;letter-spacing:.09em}.vfitSessionTitle{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:900;margin-top:2px}.vfitSessionTime{flex:0 0 auto;font-size:18px;font-weight:1000;font-variant-numeric:tabular-nums}
    .vfitSessionActions{display:grid;grid-template-columns:1.05fr 1fr .9fr;gap:7px}.vfitSessionActions button{min-height:42px;border-radius:11px;font-weight:900;font-size:12px;color:#fff;border:1px solid #31465b;background:#101c29}.vfitSessionActions .vfitResume{border:0;background:linear-gradient(135deg,#ffad2e,#ff8610);color:#111}.vfitSessionActions .vfitClose{border-color:rgba(255,82,88,.55);color:#ff9a9d;background:rgba(255,82,88,.09)}
    #vfitFinishOverlay{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:22px}
    #vfitFinishPanel{width:min(430px,100%);border:1px solid #31465b;background:#101a25;border-radius:22px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.6)}
    #vfitFinishPanel h2{margin:0 0 8px;font-size:21px}#vfitFinishPanel p{margin:0 0 15px;color:#c6d0da;font-size:13px;line-height:1.45}
    .vfitFinishAction{display:block;width:100%;min-height:48px;margin:8px 0;border-radius:13px;border:1px solid #31465b;background:#182737;color:#fff;padding:12px 14px;text-align:left;font-weight:900}.vfitFinishAction.primary{border:0;background:linear-gradient(135deg,#ffad2e,#ff8610);color:#111}.vfitFinishAction.danger{border-color:rgba(255,82,88,.6);color:#ff9a9d;background:rgba(255,82,88,.09)}.vfitFinishAction:disabled{opacity:.45}
    @media(min-width:700px){#vfitSessionBar{bottom:96px}}
  `;
  document.head.appendChild(sessionStyle);

  const sessionBar=document.createElement('div');
  sessionBar.id='vfitSessionBar';
  sessionBar.hidden=true;
  sessionBar.setAttribute('role','region');
  sessionBar.setAttribute('aria-label','Controles del entrenamiento en curso');
  sessionBar.innerHTML='<div class="vfitSessionInfo"><div class="vfitSessionCopy"><span class="vfitSessionEyebrow">ENTRENAMIENTO EN CURSO</span><span class="vfitSessionTitle" id="vfitSessionTitle">Sesión activa</span></div><span class="vfitSessionTime" id="vfitSessionTime">00:00</span></div><div class="vfitSessionActions"><button class="vfitResume" id="vfitSessionResume" type="button">Volver</button><button id="vfitSessionPause" type="button">Pausar</button><button class="vfitClose" id="vfitSessionClose" type="button">Terminar</button></div>';
  document.body.appendChild(sessionBar);

  const sessionTitle=sessionBar.querySelector('#vfitSessionTitle');
  const sessionTime=sessionBar.querySelector('#vfitSessionTime');
  const sessionResume=sessionBar.querySelector('#vfitSessionResume');
  const sessionPause=sessionBar.querySelector('#vfitSessionPause');
  const sessionClose=sessionBar.querySelector('#vfitSessionClose');

  function refreshSessionBar(){
    const active=!!currentWorkout;
    sessionBar.hidden=!active;
    if(!active)return;
    const r=routines?.[currentWorkout.day];
    sessionTitle.textContent=r?`Día ${r.day} · ${r.title}`:'Sesión activa';
    sessionTime.textContent=typeof workoutSeconds==='function'&&typeof fmt==='function'?fmt(workoutSeconds()):'00:00';
    sessionPause.textContent=currentWorkout.runningSince?'Pausar':'Continuar';
    sessionPause.setAttribute('aria-label',currentWorkout.runningSince?'Pausar entrenamiento':'Continuar entrenamiento');
  }

  function removeFinishDialog(){document.getElementById('vfitFinishOverlay')?.remove();}

  function forceEndWorkout(){
    if(!currentWorkout){removeFinishDialog();refreshSessionBar();return;}
    const day=currentWorkout.day;
    if(Array.isArray(state?.[day])){
      state[day].forEach(sets=>{
        if(Array.isArray(sets))sets.forEach(s=>{if(s&&typeof s==='object')s.done=false;});
      });
    }
    currentWorkout=null;
    if(typeof stopRestTimer==='function')stopRestTimer();
    persist();
    updateResume();
    removeFinishDialog();
    refreshSessionBar();
    show('home');
    toast('Entrenamiento terminado');
  }

  function openFinishDialog(){
    if(!currentWorkout)return;
    removeFinishDialog();
    const day=currentWorkout.day;
    const hasCompleted=Array.isArray(state?.[day])&&state[day].some(sets=>Array.isArray(sets)&&sets.some(s=>s?.done===true));
    const overlay=document.createElement('div');
    overlay.id='vfitFinishOverlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Terminar entrenamiento');
    const panel=document.createElement('div');
    panel.id='vfitFinishPanel';
    panel.innerHTML='<h2>Terminar entrenamiento</h2><p>Elige qué quieres hacer con la sesión que está en curso.</p>';
    const save=document.createElement('button');
    save.type='button';save.className='vfitFinishAction primary';save.textContent='Guardar y terminar';save.disabled=!hasCompleted;
    if(!hasCompleted)save.title='Marca al menos una serie como completada para guardarla';
    save.onclick=()=>{
      if(!currentWorkout||!hasCompleted)return;
      activeDay=currentWorkout.day;
      removeFinishDialog();
      finishDay();
      refreshSessionBar();
    };
    const discard=document.createElement('button');
    discard.type='button';discard.className='vfitFinishAction danger';discard.textContent='Terminar sin guardar';discard.onclick=forceEndWorkout;
    const cancel=document.createElement('button');
    cancel.type='button';cancel.className='vfitFinishAction';cancel.textContent='Seguir entrenando';cancel.onclick=removeFinishDialog;
    panel.append(save,discard,cancel);overlay.appendChild(panel);document.body.appendChild(overlay);
    overlay.onclick=e=>{if(e.target===overlay)removeFinishDialog();};
    discard.focus();
  }

  sessionResume.onclick=()=>{
    if(!currentWorkout)return;
    const day=currentWorkout.day;
    const ex=currentWorkout.exercise;
    if(routines?.[day]){
      openDay(day);
      if(routines[day]?.ex?.[ex])openExercise(ex);
    }
  };
  sessionPause.onclick=()=>{
    if(!currentWorkout)return;
    toggleWorkoutClock();
    refreshSessionBar();
    toast(currentWorkout?.runningSince?'Entrenamiento reanudado':'Entrenamiento pausado');
  };
  sessionClose.onclick=openFinishDialog;

  // Replace the older native-confirm discard path everywhere in the app.
  // The register screen's existing «Descartar sesión» button now uses the
  // same reliable in-app dialog as the persistent Terminar button.
  discardWorkout=openFinishDialog;

  const beforePersist=persist;
  persist=function(){
    const result=beforePersist();
    refreshSessionBar();
    return result;
  };
  const beforeUpdateResume=updateResume;
  updateResume=function(){
    const result=beforeUpdateResume();
    refreshSessionBar();
    return result;
  };
  setInterval(refreshSessionBar,1000);
  refreshSessionBar();
  window.VFITWorkoutControlsV511={refresh:refreshSessionBar,finish:openFinishDialog,forceEnd:forceEndWorkout};

  // V50 premium artwork loader. Only visual fields change; V49 identity keys remain intact.
  const premium=document.createElement('script');
  premium.src='v50-premium-art.js?v=509';
  premium.async=false;
  premium.onload=()=>{
    try{
      const map=window.VFITPremiumArtV50;
      if(!map)return;
      if(Array.isArray(routines)){
        for(const day of routines){
          for(const ex of (day?.ex||[])){
            if(!map.has(ex?.name))continue;
            const thumb=map.thumb(ex.name),anatomy=map.anatomy(ex.name);
            if(thumb)ex.thumb=thumb;
            if(anatomy)ex.anatomy=anatomy;
            ex.premiumArt=!!thumb;
            ex.premiumAnatomy=!!anatomy;
          }
        }
      }
      if(typeof renderDays==='function')renderDays();
      if(document.getElementById('routines')?.classList.contains('active')&&window.VFITLibraryV49?.renderCatalog)window.VFITLibraryV49.renderCatalog();
    }catch(e){console.warn('V50 premium artwork load skipped',e);}
  };
  document.head.appendChild(premium);
})();