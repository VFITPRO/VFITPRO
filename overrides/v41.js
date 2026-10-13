/* VFIT PRO V41: bulk previous-session prefill with conservative optional automation. */
(() => {
  'use strict';
  const bridge=window.VFITAccountBridge;if(!bridge)return;
  const $id=id=>document.getElementById(id),create=(tag,cls='',text='')=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=='')e.textContent=text;return e;};
  let cachedProfile=null,cachedConfig=null,lastAutoToken='';
  function defaults(){return{autoPrefill:false};}
  function sanitize(raw){return{autoPrefill:raw?.autoPrefill===true};}
  function cfg(){const p=bridge.getProfile();if(p!==cachedProfile||p.v41!==cachedConfig){cachedProfile=p;cachedConfig=sanitize(p.v41);p.v41=cachedConfig;}return cachedConfig;}
  function dirty(message){bridge.markDirty();if(message&&typeof toast==='function')toast(message);}
  function displayExercise(){const raw=String($id('regTitle')?.textContent||'').replace(/ · sustitución de hoy$/,'').trim();if(raw&&typeof exerciseCatalog!=='undefined'){const found=[...exerciseCatalog.values()].find(x=>x.name===raw);if(found)return found;}return routines?.[activeDay]?.ex?.[activeEx]||null;}
  function historyEntry(){const ex=displayExercise();if(!ex)return null;for(const h of progress.history||[]){const found=(h.exercises||[]).find(x=>x.key===ex.image||x.name===ex.name);if(found?.sets?.length)return found;}return null;}
  function workSets(){return state?.[activeDay]?.[activeEx]||[];}
  function defaultRir(){const n=Number(bridge.getProfile()?.v27?.defaultRir);return Number.isFinite(n)?Math.max(0,Math.min(10,Math.round(n))):2;}
  function pristine(){const sets=workSets();return sets.length>0&&sets.every(s=>!s.done&&(Number(s.kg)||0)===0&&([0,10].includes(Number(s.reps)||0))&&!String(s.note||'').trim());}
  function copySafe(from,to){if(!from||!to||to.done)return;to.kg=Math.max(0,Number(from.kg)||0);to.reps=Math.max(0,Math.min(100,Math.round(Number(from.reps)||0)));const special=from.type==='failure';to.rir=special?defaultRir():Math.max(0,Math.min(10,Math.round(Number(from.rir)||0)));to.type='normal';}
  function fillAll({automatic=false}={}){const last=historyEntry(),sets=workSets();if(!last||!sets.length)return false;if(automatic&&!pristine())return false;if(!automatic&&sets.some(s=>!s.done&&((Number(s.kg)||0)>0||![0,10].includes(Number(s.reps)||0)))&&!confirm('Hay series pendientes con valores modificados. ¿Rellenarlas con la última sesión?'))return false;let changed=0;sets.forEach((s,i)=>{if(s.done)return;copySafe(last.sets[Math.min(i,last.sets.length-1)],s);changed++;});if(!changed)return false;persist();bridge.markDirty();renderSets();if(!automatic)toast('Series pendientes rellenadas desde la última sesión');return true;}
  function autoToken(){return `${currentWorkout?.day??'x'}:${activeEx}:${currentWorkout?.runningSince||currentWorkout?.elapsed||'session'}`;}
  function maybeAuto(){if(!cfg().autoPrefill||!currentWorkout||currentWorkout.day!==activeDay||!historyEntry()||!pristine())return;const token=autoToken();if(token===lastAutoToken)return;lastAutoToken=token;if(fillAll({automatic:true}))toast('Series prellenadas desde tu última sesión');}
  function injectStyles(){if($id('v41Styles'))return;const s=create('style');s.id='v41Styles';s.textContent=`
    .v41Prefill{margin:0 0 10px;border:1px solid #31506b;background:#09141e;border-radius:14px;padding:10px}.v41Prefill p{font-size:10px;line-height:1.4;color:var(--muted);margin:0 0 7px}.v41Prefill button{width:100%;min-height:44px;border:1px solid #31506b;border-radius:10px;background:#102234;color:#fff;font-weight:900}.v41Prefill button:disabled{opacity:.45}.v41Toggle{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:10px}.v41Toggle b{display:block;font-size:12px}.v41Toggle small{display:block;color:var(--muted);font-size:10px;line-height:1.4;margin-top:3px}.v41Toggle input{width:24px;height:24px;accent-color:var(--orange)}
  `;document.head.appendChild(s);}
  function buildRegister(){if($id('v41Prefill'))return;const rows=$id('setRows');if(!rows)return;const panel=create('div','v41Prefill');panel.id='v41Prefill';panel.innerHTML='<p>Rellena de una vez peso, repeticiones y RIR de las series pendientes usando el último entrenamiento de este ejercicio. Las técnicas Drop/Fallo vuelven a Normal por seguridad.</p><button id="v41FillAll" type="button">Copiar todas desde última sesión</button>';const quick=$id('v35Quick');if(quick)quick.after(panel);else rows.before(panel);$id('v41FillAll').onclick=()=>fillAll();}
  function renderRegister(){buildRegister();const panel=$id('v41Prefill'),btn=$id('v41FillAll');if(!panel||!btn)return;const last=historyEntry();panel.hidden=!currentWorkout;btn.disabled=!last;btn.textContent=last?'Copiar todas desde última sesión':'Sin sesión anterior para copiar';}
  function buildSettings(){if($id('v41Settings'))return;const profile=$id('profile');if(!profile)return;const version=profile.lastElementChild,block=create('div','profileBlock');block.id='v41Settings';block.innerHTML='<h3>Registro automático</h3><label class="v41Toggle"><span><b>Prellenar desde la última sesión</b><small>Solo cuando el ejercicio está completamente vacío. Nunca activa automáticamente Drop o Fallo.</small></span><input id="v41AutoPrefill" type="checkbox"></label>';profile.insertBefore(block,version);$id('v41AutoPrefill').onchange=()=>{cfg().autoPrefill=$id('v41AutoPrefill').checked;dirty(`Prellenado automático ${cfg().autoPrefill?'activado':'desactivado'}`);};}
  function renderSettings(){buildSettings();const input=$id('v41AutoPrefill');if(input)input.checked=cfg().autoPrefill;}
  function updateVersion(){const v=$id('profile')?.lastElementChild;if(!v)return;const h=v.querySelector('h3'),p=v.querySelector('p');if(h)h.textContent='Versión Premium V41';if(p)p.textContent='Relleno masivo desde la última sesión y prellenado automático opcional y seguro, además de plantillas de programas V40 y todas las funciones anteriores.';}
  function renderV41(){renderRegister();if($id('profile')?.classList.contains('active'))renderSettings();updateVersion();}
  const baseRenderSets=renderSets;renderSets=function(){baseRenderSets();renderRegister();};
  const baseOpenRegister=openRegister;openRegister=function(){baseOpenRegister();if($id('register')?.classList.contains('active')){renderRegister();queueMicrotask(maybeAuto);}};
  const baseShow=show;show=function(id){baseShow(id);if(id==='profile')renderSettings();if(id==='register'){renderRegister();queueMicrotask(maybeAuto);}updateVersion();};
  const baseProgress=renderProgress;renderProgress=function(){baseProgress();updateVersion();};
  injectStyles();buildRegister();buildSettings();renderV41();
})();
