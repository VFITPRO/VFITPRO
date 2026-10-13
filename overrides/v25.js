/* VFIT PRO V25: smart home, preferred training days and searchable exercise library. */
(() => {
  'use strict';
  const bridge = window.VFITAccountBridge;
  if (!bridge) return;
  const $id = id => document.getElementById(id);
  const ISO_DAYS = [
    {n:1,short:'L',name:'Lunes'}, {n:2,short:'M',name:'Martes'}, {n:3,short:'X',name:'Miércoles'},
    {n:4,short:'J',name:'Jueves'}, {n:5,short:'V',name:'Viernes'}, {n:6,short:'S',name:'Sábado'}, {n:7,short:'D',name:'Domingo'}
  ];
  let libraryQuery = '';
  let libraryEquipment = 'all';
  let libraryMuscle = 'all';

  function defaults(){return {trainingDays:[1,2,3,4,5],onboardingDone:false};}
  function sanitize(raw){
    const base=defaults();if(!raw||typeof raw!=='object')return base;
    if(Array.isArray(raw.trainingDays)){
      const days=[...new Set(raw.trainingDays.map(Number).filter(x=>Number.isInteger(x)&&x>=1&&x<=7))].sort((a,b)=>a-b);
      if(days.length)base.trainingDays=days;
    }
    base.onboardingDone=raw.onboardingDone===true;
    return base;
  }
  function cfg(){const p=bridge.getProfile();const clean=sanitize(p.v25);p.v25=clean;return clean;}
  function dirty(message){bridge.markDirty();if(message&&typeof toast==='function')toast(message);}
  function isoToday(){const d=new Date().getDay();return d===0?7:d;}
  function uniqueExercises(){
    const out=[];for(const [dayIndex,r] of routines.entries())for(const [exerciseIndex,ex] of r.ex.entries())out.push({dayIndex,exerciseIndex,ex});return out;
  }
  function equipment(ex){return String(ex?.equipment||'').split('·')[0].trim()||'Otro';}
  function muscle(ex){
    const p=String(ex?.primary||'').toLowerCase();
    if(/pectoral/.test(p))return'Pecho';if(/tríceps/.test(p))return'Tríceps';if(/bíceps|braquial/.test(p))return'Bíceps';if(/dorsal|espalda|rombo/.test(p))return'Espalda';
    if(/cuádriceps/.test(p))return'Cuádriceps';if(/glúteo|abdu/.test(p))return'Glúteo';if(/isquio|femoral/.test(p))return'Femoral';if(/deltoides|hombro|supraespinoso/.test(p))return'Hombro';return'Otros';
  }
  function create(tag,cls='',text=''){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=='')e.textContent=text;return e;}
  function injectStyles(){
    if($id('v25Styles'))return;const s=create('style');s.id='v25Styles';s.textContent=`
      .v25Smart{position:relative;overflow:hidden}.v25Smart:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 90% 0,rgba(255,134,16,.13),transparent 42%);pointer-events:none}.v25Smart>*{position:relative}.v25Eyebrow{font-size:10px;letter-spacing:.12em;color:var(--orange);font-weight:1000}.v25Smart h2{margin:5px 0 6px;font-size:21px}.v25Smart p{margin:5px 0;color:#cbd4dd;font-size:12px;line-height:1.45}.v25Actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.v25Actions button,.v25SearchButton{border:1px solid var(--line2);background:#101a25;color:#fff;border-radius:12px;padding:11px;font-weight:800}.v25Actions button:first-child{border-color:#8e5516;background:#1a1209}.v25Week{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:10px}.v25DayToggle{border:1px solid var(--line2);background:#081018;color:var(--muted);border-radius:10px;min-height:40px;font-weight:900}.v25DayToggle.active{border-color:#8e5516;background:#1a1209;color:var(--orange)}.v25PrefHelp{color:var(--muted);font-size:11px;line-height:1.45;margin-top:8px}.v25LibraryControls{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v25LibraryControls input{grid-column:1/-1}.v25LibraryControls input,.v25LibraryControls select{width:100%;min-height:44px;border:1px solid var(--line2);border-radius:10px;background:#08111b;color:#fff;padding:10px;font-size:15px}.v25LibraryList{display:grid;gap:7px;margin-top:10px}.v25ExerciseResult{width:100%;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;text-align:left;border:1px solid var(--line);background:#081018;color:white;border-radius:13px;padding:10px}.v25ExerciseResult b{display:block;font-size:12px}.v25ExerciseResult small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.v25ExerciseResult span{color:var(--orange);font-weight:1000}.v25Empty{color:var(--muted);font-size:12px;padding:8px 0}@media(max-width:380px){.v25Actions,.v25LibraryControls{grid-template-columns:1fr}.v25LibraryControls input{grid-column:auto}}
    `;document.head.appendChild(s);
  }
  function updateVersion(){
    const version=$id('profile')?.lastElementChild;if(!version)return;const h=version.querySelector('h3'),p=version.querySelector('p');
    if(h)h.textContent='Versión Premium V25';if(p)p.textContent='Inicio inteligente, días habituales de entrenamiento, biblioteca con búsqueda y filtros, analítica V24 y todas las funciones anteriores.';
  }
  function buildSmartHome(){
    if($id('v25Smart'))return;const home=$id('home');if(!home)return;
    const panel=create('div','panel v25Smart');panel.id='v25Smart';panel.innerHTML='<div class="v25Eyebrow">PLAN DE HOY</div><h2 id="v25SmartTitle"></h2><p id="v25SmartText"></p><div class="v25Actions"><button id="v25Primary"></button><button id="v25Secondary">Ver progreso</button></div>';
    const programTitle=home.querySelector('.sectionTitle');home.insertBefore(panel,programTitle);
    $id('v25Secondary').onclick=()=>show('progress');
  }
  function renderSmartHome(){
    const panel=$id('v25Smart');if(!panel)return;const c=cfg(),today=isoToday(),planned=c.trainingDays.includes(today),next=((progress.nextDay||0)%routines.length),r=routines[next];
    const title=$id('v25SmartTitle'),text=$id('v25SmartText'),primary=$id('v25Primary');
    if(currentWorkout){const wr=routines[currentWorkout.day];title.textContent='Tienes una sesión en curso';text.textContent=`Día ${wr.day} · ${wr.title}. Continúa desde el ejercicio donde la dejaste; el tiempo registrado se conserva.`;primary.textContent='Retomar entrenamiento';primary.onclick=()=>{openDay(currentWorkout.day);openExercise(currentWorkout.exercise);};return;}
    const goal=Number(bridge.getProfile()?.v23?.weeklyGoal)||5;let weekDone=0;
    const now=new Date();now.setHours(0,0,0,0);const monday=new Date(now);monday.setDate(now.getDate()-((now.getDay()+6)%7));const end=new Date(monday);end.setDate(monday.getDate()+7);
    for(const h of progress.history){const d=Number(h.timestamp)>0?new Date(Number(h.timestamp)):null;if(d&&d>=monday&&d<end)weekDone++;}
    if(!planned){title.textContent='Descanso planificado';text.textContent=`Hoy no está marcado como día habitual de entrenamiento. Llevas ${weekDone}/${goal} sesiones de tu objetivo semanal. Si te apetece entrenar, tu siguiente sesión es Día ${r.day} · ${r.title}.`;primary.textContent='Entrenar igualmente';}
    else if(weekDone>=goal){title.textContent='Objetivo semanal completado';text.textContent=`Ya llevas ${weekDone}/${goal} sesiones esta semana. Puedes descansar o continuar con Día ${r.day} · ${r.title}.`;primary.textContent='Abrir siguiente sesión';}
    else {title.textContent=`Hoy: Día ${r.day} · ${r.title}`;text.textContent=`Es uno de tus días habituales. Llevas ${weekDone}/${goal} sesiones esta semana y te faltan ${Math.max(0,goal-weekDone)} para el objetivo.`;primary.textContent='Abrir entrenamiento';}
    primary.onclick=()=>openDay(next);
  }
  function buildPreferences(){
    if($id('v25Preferences'))return;const profile=$id('profile');if(!profile)return;const version=profile.lastElementChild;
    const block=create('div','profileBlock');block.id='v25Preferences';block.innerHTML='<h3>Mis días de entrenamiento</h3><p>Marca los días en los que normalmente entrenas. VFIT los usa para la recomendación de Inicio; nunca te impide entrenar otro día.</p><div class="v25Week" id="v25Week"></div><div class="v25PrefHelp" id="v25PrefHelp"></div>';
    profile.insertBefore(block,version);renderPreferences();
  }
  function renderPreferences(){
    const host=$id('v25Week');if(!host)return;host.replaceChildren();const c=cfg();
    for(const d of ISO_DAYS){const b=create('button','v25DayToggle'+(c.trainingDays.includes(d.n)?' active':''),d.short);b.type='button';b.title=d.name;b.setAttribute('aria-label',d.name);b.setAttribute('aria-pressed',String(c.trainingDays.includes(d.n)));b.onclick=()=>toggleTrainingDay(d.n);host.appendChild(b);}
    const names=ISO_DAYS.filter(d=>c.trainingDays.includes(d.n)).map(d=>d.name.toLowerCase());$id('v25PrefHelp').textContent='Días habituales: '+names.join(', ')+'.';
  }
  function toggleTrainingDay(day){
    const c=cfg(),has=c.trainingDays.includes(day);if(has&&c.trainingDays.length===1){toast('Conserva al menos un día de entrenamiento');return;}
    c.trainingDays=has?c.trainingDays.filter(x=>x!==day):[...c.trainingDays,day].sort((a,b)=>a-b);c.onboardingDone=true;dirty('Días de entrenamiento actualizados');renderPreferences();renderSmartHome();
  }
  function buildLibrary(){
    if($id('v25Library'))return;const screen=$id('routines');if(!screen)return;const panel=create('div','panel');panel.id='v25Library';panel.innerHTML='<h2>Buscar ejercicios</h2><div class="v25LibraryControls"><input id="v25Search" type="search" placeholder="Buscar por nombre o músculo" autocomplete="off"><select id="v25Muscle" aria-label="Filtrar por músculo"></select><select id="v25Equipment" aria-label="Filtrar por material"></select></div><div class="v25LibraryList" id="v25LibraryList"></div>';
    screen.insertBefore(panel,$id('routineDays'));
    const entries=uniqueExercises(),muscles=['all',...new Set(entries.map(x=>muscle(x.ex)))],equipments=['all',...new Set(entries.map(x=>equipment(x.ex)))];
    const fill=(select,values,allLabel)=>{select.replaceChildren();for(const value of values){const o=create('option','',value==='all'?allLabel:value);o.value=value;select.appendChild(o);}};
    fill($id('v25Muscle'),muscles,'Todos los músculos');fill($id('v25Equipment'),equipments,'Todo el material');
    $id('v25Search').oninput=()=>{libraryQuery=$id('v25Search').value.trim().toLowerCase();renderLibrary();};$id('v25Muscle').onchange=()=>{libraryMuscle=$id('v25Muscle').value;renderLibrary();};$id('v25Equipment').onchange=()=>{libraryEquipment=$id('v25Equipment').value;renderLibrary();};renderLibrary();
  }
  function renderLibrary(){
    const host=$id('v25LibraryList');if(!host)return;host.replaceChildren();const seen=new Set();const rows=uniqueExercises().filter(row=>{
      const ex=row.ex,key=ex.image;if(seen.has(key))return false;seen.add(key);const hay=(ex.name+' '+ex.primary+' '+ex.secondary+' '+equipment(ex)).toLowerCase();return(!libraryQuery||hay.includes(libraryQuery))&&(libraryMuscle==='all'||muscle(ex)===libraryMuscle)&&(libraryEquipment==='all'||equipment(ex)===libraryEquipment);
    });
    if(!rows.length){host.appendChild(create('div','v25Empty','No hay ejercicios que coincidan con esos filtros.'));return;}
    for(const row of rows.slice(0,30)){const b=create('button','v25ExerciseResult');b.type='button';const left=create('div'),name=create('b','',row.ex.name),meta=create('small','',`${muscle(row.ex)} · ${equipment(row.ex)} · Día ${row.dayIndex+1}`),arrow=create('span','','›');left.append(name,meta);b.append(left,arrow);b.onclick=()=>{openDay(row.dayIndex);openExercise(row.exerciseIndex);};host.appendChild(b);}
  }
  function renderV25(){renderSmartHome();renderPreferences();renderLibrary();updateVersion();}

  injectStyles();buildSmartHome();buildPreferences();buildLibrary();
  const baseShow=show;show=function(id){baseShow(id);if(id==='home')renderSmartHome();if(id==='profile'){renderPreferences();updateVersion();}if(id==='routines')renderLibrary();};
  const baseRenderProgress=renderProgress;renderProgress=function(){baseRenderProgress();renderSmartHome();updateVersion();};
  renderV25();
})();
