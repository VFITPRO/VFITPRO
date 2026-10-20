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

  // V510: persistent controls for an active workout. Reuses the existing
  // workout timer and discard logic so no workout/history identity changes.
  const sessionStyle=document.createElement('style');
  sessionStyle.textContent=`
    #vfitSessionBar{position:fixed;left:50%;bottom:calc(72px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(540px,calc(100% - 20px));z-index:46;border:1px solid #31465b;background:rgba(8,17,27,.97);backdrop-filter:blur(18px);border-radius:18px;padding:10px;box-shadow:0 16px 36px rgba(0,0,0,.5)}
    #vfitSessionBar[hidden]{display:none!important}
    .vfitSessionInfo{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px}
    .vfitSessionCopy{min-width:0}.vfitSessionEyebrow{display:block;color:#ffad2e;font-size:9px;font-weight:900;letter-spacing:.09em}.vfitSessionTitle{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:900;margin-top:2px}.vfitSessionTime{flex:0 0 auto;font-size:18px;font-weight:1000;font-variant-numeric:tabular-nums}
    .vfitSessionActions{display:grid;grid-template-columns:1.05fr 1fr .8fr;gap:7px}.vfitSessionActions button{min-height:42px;border-radius:11px;font-weight:900;font-size:12px;color:#fff;border:1px solid #31465b;background:#101c29}.vfitSessionActions .vfitResume{border:0;background:linear-gradient(135deg,#ffad2e,#ff8610);color:#111}.vfitSessionActions .vfitClose{border-color:rgba(255,82,88,.55);color:#ff8a8e;background:rgba(255,82,88,.08)}
    @media(min-width:700px){#vfitSessionBar{bottom:96px}}
  `;
  document.head.appendChild(sessionStyle);

  const sessionBar=document.createElement('div');
  sessionBar.id='vfitSessionBar';
  sessionBar.hidden=true;
  sessionBar.setAttribute('role','region');
  sessionBar.setAttribute('aria-label','Controles del entrenamiento en curso');
  sessionBar.innerHTML='<div class="vfitSessionInfo"><div class="vfitSessionCopy"><span class="vfitSessionEyebrow">ENTRENAMIENTO EN CURSO</span><span class="vfitSessionTitle" id="vfitSessionTitle">Sesión activa</span></div><span class="vfitSessionTime" id="vfitSessionTime">00:00</span></div><div class="vfitSessionActions"><button class="vfitResume" id="vfitSessionResume" type="button">Volver</button><button id="vfitSessionPause" type="button">Pausar</button><button class="vfitClose" id="vfitSessionClose" type="button">Cerrar</button></div>';
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
  sessionClose.onclick=()=>{
    if(!currentWorkout)return;
    discardWorkout();
    refreshSessionBar();
  };

  // Refresh the persistent controls whenever the existing app persists a
  // workout change. This catches start, pause/resume, exercise changes,
  // completion and discard without duplicating session state.
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
  window.VFITWorkoutControlsV510={refresh:refreshSessionBar};

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