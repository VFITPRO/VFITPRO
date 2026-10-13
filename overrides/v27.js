/* VFIT PRO V27: daily-use polish, automatic rest, muscle analytics, PWA help and full backup export. */
(() => {
  'use strict';
  const bridge = window.VFITAccountBridge;
  if (!bridge) return;
  const $id = id => document.getElementById(id);
  const create = (tag, cls='', text='') => { const e=document.createElement(tag); if(cls)e.className=cls; if(text!=='')e.textContent=text; return e; };
  let cachedProfile=null, cachedConfig=null, installPrompt=null, audioCtx=null;

  function defaults(){
    return {defaultRest:90,autoRest:true,sound:true,haptics:true,defaultRir:2,exerciseRest:{}};
  }
  function sanitize(raw){
    const out=defaults(); if(!raw||typeof raw!=='object')return out;
    out.defaultRest=Math.max(30,Math.min(600,Math.round(Number(raw.defaultRest)||90)));
    out.autoRest=raw.autoRest!==false; out.sound=raw.sound!==false; out.haptics=raw.haptics!==false;
    out.defaultRir=Math.max(0,Math.min(10,Math.round(Number(raw.defaultRir)||2)));
    if(raw.exerciseRest&&typeof raw.exerciseRest==='object')for(const [key,val] of Object.entries(raw.exerciseRest).slice(0,250)){
      const n=Math.round(Number(val)||0);if(n>=30&&n<=600)out.exerciseRest[String(key).slice(0,240)]=n;
    }
    return out;
  }
  function cfg(){
    const p=bridge.getProfile();
    if(p!==cachedProfile||p.v27!==cachedConfig){cachedProfile=p;cachedConfig=sanitize(p.v27);p.v27=cachedConfig;}
    return cachedConfig;
  }
  function dirty(message){bridge.markDirty();if(message&&typeof toast==='function')toast(message);}
  function exerciseKey(){return routines?.[activeDay]?.ex?.[activeEx]?.image||'';}
  function restForCurrent(){const c=cfg(),key=exerciseKey();return c.exerciseRest[key]||c.defaultRest;}
  function fmtSec(n){const m=Math.floor(n/60),s=n%60;return m?`${m}:${String(s).padStart(2,'0')} min`:`${s} s`;}

  function injectStyles(){
    if($id('v27Styles'))return;const s=create('style');s.id='v27Styles';s.textContent=`
      .v27Settings{display:grid;gap:10px}.v27Toggle{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}.v27Toggle:last-child{border-bottom:0}.v27Toggle b{display:block;font-size:13px}.v27Toggle small{display:block;color:var(--muted);font-size:10px;margin-top:3px;line-height:1.35}.v27Toggle input[type=checkbox]{width:24px;height:24px;accent-color:var(--orange)}.v27Field{display:block;color:#cbd4dd;font-size:12px}.v27Field input,.v27Field select{width:100%;margin-top:5px;min-height:42px;border:1px solid var(--line2);border-radius:10px;background:#08111b;color:#fff;padding:9px;font-size:15px}.v27MuscleList{display:grid;gap:7px}.v27Muscle{border:1px solid var(--line);background:#081018;border-radius:13px;padding:10px}.v27MuscleTop{display:flex;justify-content:space-between;gap:8px;align-items:center}.v27MuscleTop b{font-size:12px}.v27MuscleTop span{font-weight:1000;color:var(--orange)}.v27Muscle small{display:block;color:var(--muted);font-size:10px;margin-top:4px}.v27Bar{height:7px;border-radius:999px;background:#15202d;overflow:hidden;margin-top:8px}.v27Bar i{display:block;height:100%;background:linear-gradient(90deg,var(--orange),var(--orange2));border-radius:inherit}.v27RestHint{margin:0 14px 12px;border:1px solid #6f531d;background:#151008;border-radius:16px;padding:10px;font-size:11px;color:#f0d0a2}.v27RestHint b{color:var(--orange)}.v27Tools{display:grid;gap:8px}.v27Tools button{border:1px solid var(--line2);background:#101a25;color:#fff;border-radius:11px;padding:11px;font-weight:800}.v27InstallState{color:var(--muted);font-size:11px;line-height:1.45;margin-top:7px}.v27Delta.up{color:#78e68a}.v27Delta.down{color:#ff9e68}.v27Delta.flat{color:var(--muted)}
    `;document.head.appendChild(s);
  }
  function updateVersion(){const version=$id('profile')?.lastElementChild;if(!version)return;const h=version.querySelector('h3'),p=version.querySelector('p');if(h)h.textContent='Versión Premium V27';if(p)p.textContent='Analítica semanal por músculo, descanso automático configurable, avisos hápticos/sonoros, ajustes personales, instalación PWA y copia completa de datos.';}

  function buildSettings(){
    if($id('v27Settings'))return;const profile=$id('profile');if(!profile)return;const version=profile.lastElementChild;
    const block=create('div','profileBlock');block.id='v27Settings';block.innerHTML=`<h3>Ajustes de entrenamiento</h3><div class="v27Settings">
      <label class="v27Field">Descanso predeterminado (segundos)<input id="v27DefaultRest" type="number" min="30" max="600" step="15"></label>
      <label class="v27Field">RIR inicial para series nuevas<input id="v27DefaultRir" type="number" min="0" max="10" step="1"></label>
      <label class="v27Toggle"><span><b>Iniciar descanso automáticamente</b><small>Al marcar una serie de trabajo como completada.</small></span><input id="v27AutoRest" type="checkbox"></label>
      <label class="v27Toggle"><span><b>Aviso sonoro</b><small>Emite un tono breve cuando termina el descanso, si el navegador lo permite.</small></span><input id="v27Sound" type="checkbox"></label>
      <label class="v27Toggle"><span><b>Vibración</b><small>Usa respuesta háptica en dispositivos compatibles.</small></span><input id="v27Haptics" type="checkbox"></label>
    </div>`;
    profile.insertBefore(block,version);bindSettings();
  }
  function bindSettings(){
    const c=cfg(),rest=$id('v27DefaultRest'),rir=$id('v27DefaultRir'),auto=$id('v27AutoRest'),sound=$id('v27Sound'),hap=$id('v27Haptics');if(!rest)return;
    rest.value=c.defaultRest;rir.value=c.defaultRir;auto.checked=c.autoRest;sound.checked=c.sound;hap.checked=c.haptics;
    rest.onchange=()=>{const n=Math.round(Number(rest.value)||90);c.defaultRest=Math.max(30,Math.min(600,n));rest.value=c.defaultRest;dirty('Descanso predeterminado actualizado');renderExerciseRestHint();};
    rir.onchange=()=>{const n=Math.round(Number(rir.value)||0);c.defaultRir=Math.max(0,Math.min(10,n));rir.value=c.defaultRir;dirty('RIR inicial actualizado');};
    auto.onchange=()=>{c.autoRest=auto.checked;dirty('Descanso automático '+(c.autoRest?'activado':'desactivado'));};
    sound.onchange=()=>{c.sound=sound.checked;if(c.sound)armAudio();dirty('Aviso sonoro '+(c.sound?'activado':'desactivado'));};
    hap.onchange=()=>{c.haptics=hap.checked;dirty('Vibración '+(c.haptics?'activada':'desactivada'));};
  }

  function buildDataTools(){
    if($id('v27DataTools'))return;const profile=$id('profile');if(!profile)return;const version=profile.lastElementChild;
    const block=create('div','profileBlock');block.id='v27DataTools';block.innerHTML='<h3>Mis datos</h3><p>Descarga una copia completa de tu cuenta VFIT: programa, series, historial, medidas y ajustes.</p><div class="v27Tools"><button id="v27ExportAll">Descargar copia completa</button><button id="v27ImportAll">Restaurar una copia</button><input id="v27ImportFile" type="file" accept="application/json,.json" hidden></div>';
    profile.insertBefore(block,version);$id('v27ExportAll').onclick=exportFull;$id('v27ImportAll').onclick=()=>$id('v27ImportFile').click();$id('v27ImportFile').onchange=importFull;
  }
  function exportFull(){
    try{const data=bridge.snapshot();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=create('a');a.href=url;a.download='VFIT-PRO-copia-completa.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);toast('Copia completa preparada');}catch{toast('No se pudo crear la copia');}
  }
  async function importFull(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{const data=JSON.parse(await file.text());if(!data||typeof data!=='object'||!Array.isArray(data.program)||!data.progress){toast('Ese archivo no parece una copia VFIT válida');return;}if(!confirm('¿Restaurar esta copia? Se sustituirá el estado actual de esta cuenta y después se sincronizará.'))return;bridge.restore(data);toast('Copia restaurada');renderV27();}catch{toast('No se pudo leer esa copia');}
  }

  function buildInstall(){
    if($id('v27Install'))return;const profile=$id('profile');if(!profile)return;const version=profile.lastElementChild;
    const block=create('div','profileBlock');block.id='v27Install';block.innerHTML='<h3>Instalar VFIT PRO</h3><p>Úsala como una app desde tu pantalla de inicio.</p><div class="v27Tools"><button id="v27InstallBtn">Cómo instalar</button></div><div class="v27InstallState" id="v27InstallState"></div>';profile.insertBefore(block,version);$id('v27InstallBtn').onclick=installApp;renderInstallState();
  }
  function installed(){return window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;}
  function renderInstallState(){const out=$id('v27InstallState'),btn=$id('v27InstallBtn');if(!out||!btn)return;if(installed()){out.textContent='VFIT PRO ya está abierta como aplicación instalada.';btn.hidden=true;}else if(installPrompt){out.textContent='Este dispositivo permite instalar VFIT PRO directamente.';btn.textContent='Instalar VFIT PRO';btn.hidden=false;}else{const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);out.textContent=ios?'En iPhone/iPad: abre VFIT en Safari, toca Compartir y luego «Añadir a pantalla de inicio».':'Puedes instalarla desde el menú del navegador cuando aparezca la opción de instalar o añadir a pantalla de inicio.';btn.textContent='Cómo instalar';btn.hidden=false;}}
  async function installApp(){if(installed()){renderInstallState();return;}if(installPrompt){const p=installPrompt;installPrompt=null;await p.prompt();try{await p.userChoice;}catch{}renderInstallState();return;}const panel=panelDialog('Instalar VFIT PRO');const p=create('p','',/iphone|ipad|ipod/i.test(navigator.userAgent)?'En Safari: toca el botón Compartir, elige «Añadir a pantalla de inicio» y confirma «Añadir».':'Abre el menú de tu navegador y busca «Instalar aplicación» o «Añadir a pantalla de inicio».');panel.appendChild(p);}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;renderInstallState();});window.addEventListener('appinstalled',()=>{installPrompt=null;renderInstallState();toast('VFIT PRO instalada');});

  function muscleName(primary=''){
    const p=String(primary).toLowerCase();
    if(/pectoral|pecho/.test(p))return'Pecho';if(/tr[ií]ceps/.test(p))return'Tríceps';if(/b[ií]ceps|braquial/.test(p))return'Bíceps';if(/dorsal|espalda|rombo|trapecio/.test(p))return'Espalda';
    if(/cu[aá]driceps/.test(p))return'Cuádriceps';if(/gl[uú]teo|abdu/.test(p))return'Glúteo';if(/isquio|femoral/.test(p))return'Femoral';if(/deltoides|hombro|supraespinoso/.test(p))return'Hombro';if(/pantorr|gemelo|gastrocnemio/.test(p))return'Pantorrilla';if(/flexor.*cadera|cadera/.test(p))return'Cadera';return primary?String(primary).split(/[/(]/)[0].trim().slice(0,28):'Otros';
  }
  function metaForHistory(ex){return exerciseCatalog?.get(ex.key)||routines.flatMap(r=>r.ex).find(x=>x.image===ex.key||x.name===ex.name)||null;}
  function monday(date=new Date()){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
  function collectMuscles(){
    const start=monday(),prevStart=new Date(start);prevStart.setDate(prevStart.getDate()-28);const nowEnd=new Date(start);nowEnd.setDate(nowEnd.getDate()+7);const current=new Map(),previous=new Map();
    const add=(map,name,sets,vol,stamp)=>{let x=map.get(name);if(!x){x={sets:0,volume:0,sessions:new Set()};map.set(name,x);}x.sets+=sets;x.volume+=vol;x.sessions.add(stamp);};
    for(const h of progress.history||[]){const t=Number(h.timestamp)||0;if(!t||t<prevStart.getTime()||t>=nowEnd.getTime())continue;for(const ex of h.exercises||[]){const meta=metaForHistory(ex),name=muscleName(meta?.primary||ex.name),sets=(ex.sets||[]).length,vol=(ex.sets||[]).reduce((v,s)=>v+(Number(s.kg)||0)*(Number(s.reps)||0),0);if(!sets)continue;(t>=start.getTime()?add(current,name,sets,vol,t):add(previous,name,sets,vol,t));}}
    return {current,previous};
  }
  function buildMusclePanel(){if($id('v27Muscles'))return;const progressScreen=$id('progress');if(!progressScreen)return;const history=$id('history')?.closest('.panel');const p=create('div','panel');p.id='v27Muscles';p.innerHTML='<h2>Carga semanal por músculo</h2><p style="font-size:11px;color:var(--muted);line-height:1.45">Cuenta solo series de trabajo y las atribuye al músculo principal. Los calentamientos no se incluyen. La comparación usa el promedio de las cuatro semanas anteriores.</p><div class="v27MuscleList" id="v27MuscleList"></div>';progressScreen.insertBefore(p,history);}
  function renderMuscles(){
    const host=$id('v27MuscleList');if(!host)return;host.replaceChildren();const {current,previous}=collectMuscles(),names=[...new Set([...current.keys(),...previous.keys()])].sort((a,b)=>(current.get(b)?.sets||0)-(current.get(a)?.sets||0)||(previous.get(b)?.sets||0)-(previous.get(a)?.sets||0));
    if(!names.length){host.appendChild(create('div','v25Empty','Guarda entrenamientos con detalle para ver la distribución semanal por músculo.'));return;}
    const max=Math.max(1,...names.map(n=>Math.max(current.get(n)?.sets||0,(previous.get(n)?.sets||0)/4)));
    for(const name of names.slice(0,14)){const cur=current.get(name)||{sets:0,volume:0,sessions:new Set()},avg=(previous.get(name)?.sets||0)/4,delta=cur.sets-avg,row=create('div','v27Muscle'),top=create('div','v27MuscleTop'),label=create('b','',name),value=create('span','',`${cur.sets} series`);top.append(label,value);const comp=create('small');const cls=delta>0.49?'up':delta<-0.49?'down':'flat';comp.className='v27Delta '+cls;comp.textContent=`Promedio 4 semanas: ${avg.toFixed(avg%1?1:0)} · ${delta>0?'+':''}${delta.toFixed(delta%1?1:0)} esta semana · ${cur.sessions.size} sesión${cur.sessions.size===1?'':'es'}`;const bar=create('div','v27Bar'),fill=create('i');fill.style.width=Math.min(100,Math.round(cur.sets/max*100))+'%';bar.appendChild(fill);row.append(top,comp,bar);host.appendChild(row);}
  }

  function buildExerciseRestHint(){if($id('v27RestHint'))return;const register=$id('register');if(!register)return;const restBox=register.querySelector('.rest');const hint=create('div','v27RestHint');hint.id='v27RestHint';hint.innerHTML='<b>Descanso automático</b><div id="v27RestHintText"></div><label class="v27Field">Descanso para este ejercicio (segundos)<input id="v27ExerciseRest" type="number" min="30" max="600" step="15"></label><button class="v27InlineBtn" id="v27UseDefaultRest" type="button">Usar valor predeterminado</button>';register.insertBefore(hint,restBox);$id('v27ExerciseRest').onchange=saveExerciseRest;$id('v27UseDefaultRest').onclick=()=>{const c=cfg();delete c.exerciseRest[exerciseKey()];dirty('Este ejercicio vuelve a usar el descanso predeterminado');renderExerciseRestHint();};}
  function renderExerciseRestHint(){const text=$id('v27RestHintText'),input=$id('v27ExerciseRest');if(!text||!input)return;const c=cfg(),specific=c.exerciseRest[exerciseKey()],seconds=specific||c.defaultRest;input.value=seconds;text.textContent=c.autoRest?`Al marcar una serie completada, VFIT iniciará ${fmtSec(seconds)}${specific?' para este ejercicio':' (valor predeterminado)'}.`:'El inicio automático está desactivado. Puedes seguir usando el temporizador manual.';}
  function saveExerciseRest(){const input=$id('v27ExerciseRest'),c=cfg(),key=exerciseKey();if(!input||!key)return;const n=Math.max(30,Math.min(600,Math.round(Number(input.value)||c.defaultRest)));input.value=n;if(n===c.defaultRest)delete c.exerciseRest[key];else c.exerciseRest[key]=n;dirty('Descanso del ejercicio actualizado');renderExerciseRestHint();}

  function armAudio(){if(audioCtx)return audioCtx;try{const Ctx=window.AudioContext||window.webkitAudioContext;if(Ctx)audioCtx=new Ctx();}catch{}return audioCtx;}
  function alertRestDone(){const c=cfg();if(c.haptics&&navigator.vibrate)try{navigator.vibrate([160,80,160]);}catch{}if(c.sound){try{const ctx=armAudio();if(ctx){ctx.resume?.();const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=880;g.gain.value=.05;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.14);}}catch{}}}
  function startAutoRest(){const seconds=restForCurrent();armAudio();stopRestTimer();restDuration=seconds;rest=seconds;restDeadline=Date.now()+seconds*1000;renderRestTimer();timerInt=setInterval(syncRestTimer,250);}
  function bindAutoRestCheckboxes(){document.querySelectorAll('#setRows input[data-k="done"]').forEach(box=>{if(box.dataset.v27Bound)return;box.dataset.v27Bound='1';box.addEventListener('change',()=>{if(box.checked&&cfg().autoRest)startAutoRest();});});}

  const baseSyncRest=syncRestTimer;
  syncRestTimer=function(){const wasRunning=restDeadline!==null;baseSyncRest();if(wasRunning&&rest===0&&restDeadline===null)alertRestDone();};
  $id('timerToggle')?.addEventListener('click',()=>armAudio());
  const baseBlankSets=blankSets;
  blankSets=function(ex){return baseBlankSets(ex).map(s=>({...s,rir:cfg().defaultRir}));};
  const baseRenderSets=renderSets;
  renderSets=function(){baseRenderSets();bindAutoRestCheckboxes();renderExerciseRestHint();};
  const baseOpenExercise=openExercise;
  openExercise=function(j){baseOpenExercise(j);renderExerciseRestHint();};
  const baseShow=show;
  show=function(id){baseShow(id);if(id==='profile'){bindSettings();renderInstallState();updateVersion();}if(id==='progress')renderMuscles();if(id==='register')renderExerciseRestHint();};
  const baseRenderProgress=renderProgress;
  renderProgress=function(){baseRenderProgress();renderMuscles();updateVersion();};

  function renderV27(){cfg();injectStyles();buildSettings();buildDataTools();buildInstall();buildMusclePanel();buildExerciseRestHint();bindSettings();renderMuscles();renderExerciseRestHint();updateVersion();}
  renderV27();
})();
