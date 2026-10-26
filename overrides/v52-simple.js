/* Presentation only: keep existing controls, identities, persistence and renderers. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const choices = {routines:'days',progress:'summary',profile:'account'};
  const expanded = new Set();
  let queued = false;
  function button(label, action) {
    const b=document.createElement('button'); b.type='button'; b.textContent=label; b.onclick=action; return b;
  }
  function tabs(id, items) {
    const screen=$(id), bar=document.createElement('div');
    bar.className='uxTabs'; bar.id='uxTabs-'+id; bar.setAttribute('role','group');
    bar.setAttribute('aria-label', id==='routines'?'Explorar entrenamiento':id==='progress'?'Ver progreso':'Opciones de perfil');
    items.forEach(([key,label])=>{const b=button(label,()=>{choices[id]=key;layout();});b.dataset.choice=key;bar.append(b);});
    screen.querySelector('.topbar').after(bar);
  }
  function group(node, key, selected) { if(node)node.classList.toggle('uxInactive',key!==selected); }
  function fold(screenId, label) {
    const b=button(label,()=>{expanded.has(screenId)?expanded.delete(screenId):expanded.add(screenId);layout();});
    b.id='uxMore-'+screenId; b.className='uxMore'; b.setAttribute('aria-controls',screenId); $(screenId).append(b);
  }
  function optional(node, screenId) {
    if(!node)return;
    node.classList.add('uxOptional');node.classList.toggle('uxFolded',!expanded.has(screenId));
  }
  function enhanceRegisterRows() {
    const names={kg:'Peso en kilogramos',reps:'Repeticiones',rir:'RIR',done:'Serie completada'};
    const rows=[...document.querySelectorAll('#setRows .setRow')];
    rows.forEach((row,i)=>{
      const done=row.querySelector('input[data-k="done"]');
      row.classList.toggle('uxSetDone',!!done?.checked);
      row.querySelectorAll('input[data-k]').forEach(inp=>{
        const key=inp.dataset.k;
        inp.setAttribute('aria-label',`Serie ${i+1}: ${names[key]||key}`);
        inp.setAttribute('autocomplete','off');
        if(key==='kg')inp.setAttribute('inputmode','decimal');
        else if(key==='reps'||key==='rir')inp.setAttribute('inputmode','numeric');
        if(inp.dataset.uxV52==='1')return;
        inp.dataset.uxV52='1';
        if(key==='done')inp.addEventListener('change',()=>row.classList.toggle('uxSetDone',inp.checked));
        else inp.addEventListener('keydown',e=>{
          if(e.key!=='Enter')return;
          e.preventDefault();
          const fields=[...document.querySelectorAll('#setRows input[type="number"]')];
          const next=fields[fields.indexOf(inp)+1];
          if(next){next.focus();if(typeof next.select==='function')next.select();}
          else inp.blur();
        });
      });
    });
  }
  function updatePrimarySaveLabel() {
    const save=$('register')?.querySelector(':scope > .cta');
    if(!save)return;
    const adapted=currentWorkout?.adaptation?.items;
    const order=Array.isArray(adapted)&&adapted.length?adapted.map(x=>x.index):(routines?.[activeDay]?.ex||[]).map((_,i)=>i);
    const position=order.indexOf(activeEx);
    save.textContent=position>=0&&position===order.length-1?'Guardar ejercicio y terminar':'Guardar y siguiente';
  }
  function decorateRoutineEditorUX() {
    const panel=$('editorOverlay')?.querySelector('.optionsPanel');
    if(!panel)return;
    panel.classList.add('uxRoutineEditor');
    if(panel.dataset.uxV52!=='1'){
      panel.dataset.uxV52='1';
      const select=[...panel.querySelectorAll(':scope > select')].at(-1);
      if(select){
        select.classList.add('uxRoutineAddSelect');
        if(!select.previousElementSibling?.classList.contains('uxAddLabel')){
          const label=document.createElement('label');
          label.className='uxAddLabel';label.textContent='Añadir otro ejercicio';
          if(!select.id)select.id='uxRoutineAddSelect';label.htmlFor=select.id;
          panel.insertBefore(label,select);
        }
      }
      for(const row of panel.querySelectorAll(':scope > .profileBlock')){
        row.classList.add('uxEditorExercise');
        row.querySelectorAll('button').forEach(b=>{
          const text=b.textContent.trim();
          if(text==='Quitar ejercicio')b.classList.add('uxDanger');
          else if(text.includes('Subir')||text.includes('Bajar'))b.classList.add('uxSecondary');
        });
      }
      [...panel.children].filter(n=>n.tagName==='BUTTON').forEach(b=>{
        const text=b.textContent.trim();
        if(text==='+ Añadir ejercicio')b.classList.add('uxEditorAdd');
        if(text==='+ Crear ejercicio personalizado')b.classList.add('uxEditorCustom');
      });
    }
    const close=[...panel.children].find(n=>n.tagName==='BUTTON'&&n.textContent.trim()==='Cerrar');
    if(close){close.classList.add('uxEditorClose');panel.append(close);}
  }
  function layout() {
    for(const id of Object.keys(choices)) {
      document.querySelectorAll('#uxTabs-'+id+' button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===choices[id])));
    }
    for(const id of ['home','day','exercise','register']) {
      $('uxMore-'+id)?.setAttribute('aria-expanded',String(expanded.has(id)));
    }
    document.querySelectorAll('#home > .homeHelp,#home > .sectionTitle,#homeDays,#v25Smart').forEach(n=>optional(n,'home'));
    const r=choices.routines;
    ['v49Library','v25Library'].forEach(id=>group($(id),'library',r));
    ['v26Program','v49Hub','v45CustomManager'].forEach(id=>group($(id),'edit',r));
    group($('routineDays'),'days',r);
    for(const n of [...$('progress').children]) {
      if(n.matches('.topbar,.uxTabs'))continue;
      let key=n.matches('.progressGrid,#v24Summary,#v23Weekly')?'summary':'history';
      if(['v33BodyTrends','v23Measurements'].includes(n.id))key='body';
      else if(['v24Analytics','v44LoadPanel','v27Muscles','v32EffortPanel'].includes(n.id)||n.contains($('chart')))key='analysis';
      group(n,key,choices.progress);
    }
    for(const n of [...$('profile').children]) {
      if(n.matches('.topbar,.uxTabs'))continue;
      const training=['v23Equipment','v25Preferences','v27Settings','v28BarSettings','v40Templates','v41Settings','v47Schedule'];
      const data=['v23Backups','v27DataTools'];
      let key=training.includes(n.id)?'training':data.includes(n.id)?'data':'account';
      group(n,key,choices.profile);
    }
    document.querySelectorAll('#day > .cta:not(#uxStartDay)').forEach(n=>optional(n,'day'));
    for(const n of [...$('exercise').children]) {
      if(n.matches('.topbar,.detailCard,.cta,.uxMore'))continue;
      optional(n,'exercise');
    }
    const register=$('register');
    for(const n of [...register.children]) {
      if(n.matches('.topbar,.rest,.cta,.uxMore,#v29SessionNav,#v38Super,#v26Warmups') || n.contains($('setRows')))continue;
      optional(n,'register');
    }
    ['v35Quick','v28Legend','v42RegisterGoal'].forEach(id=>optional($(id),'register'));
    optional(register.querySelector('.timerEdit'),'register');
    enhanceRegisterRows();updatePrimarySaveLabel();decorateRoutineEditorUX();
    const active=document.querySelector('.screen.active')?.id;
    const section=['day','exercise','register'].includes(active)?'routines':active;
    document.querySelectorAll('.bottomNav button').forEach(b=>{
      b.classList.toggle('active',b.dataset.s===section);
      if(b.dataset.s===section)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    const start=$('uxStartDay');
    if(start)start.textContent=currentWorkout?'Continuar entrenamiento':'Empezar entrenamiento';
  }
  function schedule() {if(queued)return;queued=true;queueMicrotask(()=>{queued=false;layout();});}
  tabs('routines',[['days','Mis días'],['library','Biblioteca'],['edit','Organizar']]);
  tabs('progress',[['summary','Resumen'],['history','Historial'],['analysis','Análisis'],['body','Medidas']]);
  tabs('profile',[['account','Cuenta'],['training','Entrenamiento'],['data','Mis datos']]);
  fold('home','Plan de hoy y todos mis días');
  fold('day','Ajustar o personalizar rutina');
  fold('exercise','Técnica, músculos y alternativas');
  fold('register','Herramientas, notas y ajustes');
  const start=button('Empezar entrenamiento',()=>{
    const day=currentWorkout?.day??activeDay;
    const ex=currentWorkout?.exercise??0;
    if(!routines[day]?.ex?.length){toast('Añade un ejercicio a esta rutina para empezar');return;}
    openDay(day);openExercise(routines[day].ex[ex]?ex:0);openRegister();
  });
  start.id='uxStartDay';start.className='cta';$('day').querySelector('.chips').after(start);
  $('register').querySelector('h1').textContent='Registrar series';
  document.querySelectorAll('.topbar > .iconBtn').forEach(b=>{if(!b.hasAttribute('aria-label'))b.setAttribute('aria-label',b.textContent.trim()==='×'?'Volver al ejercicio':'Volver');});
  const nav=document.querySelector('.bottomNav');
  ['home','routines','progress','profile'].forEach(id=>nav.append(nav.querySelector(`[data-s="${id}"]`)));
  const beforeShow=show;show=function(id){const result=beforeShow(id);layout();return result;};
  const beforeSets=renderSets;renderSets=function(){const result=beforeSets();enhanceRegisterRows();updatePrimarySaveLabel();schedule();return result;};
  const beforeProgress=renderProgress;renderProgress=function(){const result=beforeProgress();schedule();return result;};
  const beforeDays=renderDays;renderDays=function(){const result=beforeDays();schedule();return result;};
  const beforeRoutineEditor=openRoutineEditor;openRoutineEditor=function(){const result=beforeRoutineEditor();queueMicrotask(decorateRoutineEditorUX);return result;};
  const observer=new MutationObserver(schedule);
  document.querySelectorAll('.screen').forEach(s=>observer.observe(s,{childList:true}));
  window.VFITSimpleUX={refresh:layout,enhanceRegisterRows,decorateRoutineEditor:decorateRoutineEditorUX};
  layout();
})();
