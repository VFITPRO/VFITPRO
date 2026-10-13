/* VFIT PRO V34: accessibility, keyboard and mobile touch polish. */
(() => {
  'use strict';
  const $id=id=>document.getElementById(id),create=(tag,cls='',text='')=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=='')e.textContent=text;return e;};
  let lastDialogTrigger=null;
  function injectStyles(){if($id('v34Styles'))return;const s=create('style');s.id='v34Styles';s.textContent=`
    :where(button,a,input,select,textarea,[tabindex]):focus-visible{outline:3px solid var(--orange)!important;outline-offset:2px!important}.iconBtn{width:44px!important;height:44px!important;min-width:44px}.bottomNav button{min-height:44px;touch-action:manipulation}.v28TypeBtn{min-height:28px!important;min-width:32px!important}.setRow input[type=checkbox]{width:26px!important;height:26px!important}.optionAction,.v23Tiny,.v26InlineBtn,.v27InlineBtn{min-height:44px}button{touch-action:manipulation}.v34SrOnly{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;transition-delay:0s!important}}
  `;document.head.appendChild(s);}
  function updateVersion(){const v=$id('profile')?.lastElementChild;if(!v)return;const h=v.querySelector('h3'),p=v.querySelector('p');if(h)h.textContent='Versión Premium V34';if(p)p.textContent='Accesibilidad móvil mejorada: zoom permitido, foco visible, navegación por teclado, objetivos táctiles y etiquetas claras, además de todas las funciones V33.';}
  function annotateStatic(){
    const toast=$id('toast');if(toast){toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true');}
    document.querySelectorAll('.iconBtn').forEach(btn=>{if(btn.hasAttribute('aria-label'))return;const screen=btn.closest('.screen')?.id;const map={day:'Volver a rutinas',exercise:'Volver al día de entrenamiento',register:'Volver al ejercicio'};btn.setAttribute('aria-label',map[screen]||'Volver');});
    document.querySelectorAll('img:not([alt])').forEach(img=>{img.alt=img.closest('.anatomyImg')?'Ilustración anatómica del ejercicio':'';});
    const notes=$id('notes');if(notes&&!notes.hasAttribute('aria-label'))notes.setAttribute('aria-label','Notas del ejercicio');
    updateNavA11y();
  }
  function annotateSets(){document.querySelectorAll('#setRows .setRow').forEach((row,i)=>{const index=i+1;row.querySelectorAll('input').forEach(input=>{if(input.hasAttribute('aria-label'))return;const key=input.dataset.k;const labels={kg:`Serie ${index}: peso en kilogramos`,reps:`Serie ${index}: repeticiones`,rir:`Serie ${index}: RIR`,done:`Serie ${index}: completada`};if(labels[key])input.setAttribute('aria-label',labels[key]);});});}
  function updateNavA11y(){const active=document.querySelector('.screen.active')?.id;document.querySelectorAll('.bottomNav button[data-s]').forEach(btn=>{const selected=btn.dataset.s===active;btn.setAttribute('aria-current',selected?'page':'false');btn.setAttribute('aria-pressed',String(selected));});}
  function focusables(overlay){return [...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true');}
  function rememberFocusedTrigger(){const active=document.activeElement;if(active&&active!==document.body&&active.isConnected&&!active.closest?.('#editorOverlay'))lastDialogTrigger=active;}
  document.addEventListener('click',event=>{
    const overlay=$id('editorOverlay');
    if(!overlay){const trigger=event.target.closest?.('button,a[href],[role=button]');if(trigger)lastDialogTrigger=trigger;return;}
    if(overlay.contains(event.target))queueMicrotask(()=>{if(!$id('editorOverlay')&&lastDialogTrigger?.isConnected)lastDialogTrigger.focus();});
  },true);
  document.addEventListener('keydown',event=>{
    const overlay=$id('editorOverlay');if(!overlay)return;
    if(event.key==='Escape'){event.preventDefault();overlay.remove();if(lastDialogTrigger?.isConnected)lastDialogTrigger.focus();return;}
    if(event.key!=='Tab')return;const list=focusables(overlay);if(!list.length){event.preventDefault();return;}const first=list[0],last=list.at(-1),active=document.activeElement;if(event.shiftKey&&(active===first||!overlay.contains(active))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(active===last||!overlay.contains(active))){event.preventDefault();first.focus();}
  },true);
  const baseShow=show;show=function(id){baseShow(id);annotateStatic();updateNavA11y();if(id==='profile')updateVersion();};
  const baseSets=renderSets;renderSets=function(){baseSets();annotateSets();annotateStatic();};
  const baseProgress=renderProgress;renderProgress=function(){baseProgress();annotateStatic();updateVersion();};
  if(typeof openRoutineEditor==='function'){
    const baseOpenRoutineEditor=openRoutineEditor;
    openRoutineEditor=function(){rememberFocusedTrigger();return baseOpenRoutineEditor.apply(this,arguments);};
  }
  injectStyles();annotateStatic();annotateSets();updateVersion();
})();
