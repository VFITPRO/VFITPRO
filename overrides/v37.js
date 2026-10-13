/* VFIT PRO V37: inline previous performance and live personal-record notifications. */
(() => {
  'use strict';
  const bridge=window.VFITAccountBridge;if(!bridge)return;
  const $id=id=>document.getElementById(id),create=(tag,cls='',text='')=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=='')e.textContent=text;return e;};
  let lastWorkoutRef=null,liveBest=new Map(),bannerTimer=null;

  function injectStyles(){if($id('v37Styles'))return;const s=create('style');s.id='v37Styles';s.textContent=`
    .v37Previous{margin:-2px 0 7px 40px;padding:5px 7px;border-left:2px solid #31465b;color:var(--muted);font-size:9px;line-height:1.35}.v37Previous b{color:#cbd5df}.v37Previous.special b{color:var(--orange)}.v37PrBanner{position:fixed;z-index:140;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);width:min(520px,calc(100% - 24px));border:1px solid #8e5516;background:linear-gradient(135deg,#201307,#101a25);box-shadow:0 18px 50px rgba(0,0,0,.6);border-radius:16px;padding:12px 14px;color:#fff;font-size:13px;font-weight:1000;text-align:center;opacity:0;pointer-events:none;transition:.18s}.v37PrBanner.show{opacity:1;transform:translateX(-50%) translateY(4px)}.v37PrBanner small{display:block;margin-top:3px;color:#ffbd73;font-size:10px;font-weight:700}
  `;document.head.appendChild(s);}
  function updateVersion(){const v=$id('profile')?.lastElementChild;if(!v)return;const h=v.querySelector('h3'),p=v.querySelector('p');if(h)h.textContent='Versión Premium V37';if(p)p.textContent='Valores de la sesión anterior junto a cada serie y avisos de récord en vivo, además del calentamiento guiado V36, registro rápido y todas las funciones anteriores.';}
  function displayExercise(){const raw=String($id('regTitle')?.textContent||'').replace(/ · sustitución de hoy$/,'').trim();if(raw&&typeof exerciseCatalog!=='undefined'){const found=[...exerciseCatalog.values()].find(x=>x.name===raw);if(found)return found;}return routines?.[activeDay]?.ex?.[activeEx]||null;}
  function historyExercise(ex=displayExercise()){if(!ex)return null;for(const h of progress.history||[]){const found=(h.exercises||[]).find(x=>x.key===ex.image||x.name===ex.name);if(found?.sets?.length)return found;}return null;}
  function typeLabel(type){return type==='drop'?' · DROP':type==='failure'?' · FALLO':'';}
  function decoratePrevious(){const rows=$id('setRows');if(!rows)return;rows.querySelectorAll('.v37Previous').forEach(x=>x.remove());const last=historyExercise();[...rows.querySelectorAll('.setRow')].forEach((row,i)=>{const line=create('div','v37Previous');line.setAttribute('aria-label',`Serie ${i+1}, valores de la sesión anterior`);const s=last?.sets?.[i];if(s){if(s.type&&s.type!=='normal')line.classList.add('special');line.innerHTML=`<b>Anterior:</b> ${Number(s.kg)||0} kg × ${Number(s.reps)||0} rep · RIR ${Number(s.rir)||0}${typeLabel(s.type)}`;}else line.innerHTML='<b>Anterior:</b> —';row.after(line);});}
  function e1rm(set){const kg=Math.max(0,Number(set?.kg)||0),reps=Math.max(0,Math.min(30,Number(set?.reps)||0));return kg*(1+reps/30);}
  function resetWorkoutCache(){if(currentWorkout!==lastWorkoutRef){lastWorkoutRef=currentWorkout;liveBest.clear();}}
  function historyBest(ex){let load=0,oneRm=0,hasHistory=false;for(const h of progress.history||[]){const found=(h.exercises||[]).find(x=>x.key===ex?.image||x.name===ex?.name);if(!found)continue;for(const s of found.sets||[]){hasHistory=true;load=Math.max(load,Number(s.kg)||0);oneRm=Math.max(oneRm,e1rm(s));}}return{load,oneRm,hasHistory};}
  function bestState(ex){resetWorkoutCache();const key=ex?.image||ex?.name||'';if(!liveBest.has(key))liveBest.set(key,historyBest(ex));return liveBest.get(key);}
  function ensureBanner(){if($id('v37PrBanner'))return $id('v37PrBanner');const b=create('div','v37PrBanner');b.id='v37PrBanner';b.setAttribute('role','status');b.setAttribute('aria-live','polite');document.body.appendChild(b);return b;}
  function announce(title,detail){const b=ensureBanner();b.replaceChildren(create('div','',title),create('small','',detail));b.classList.add('show');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>b.classList.remove('show'),3200);if(bridge.getProfile()?.v27?.haptics!==false&&navigator.vibrate)try{navigator.vibrate([50,35,80]);}catch{}}
  function checkPr(index){const ex=displayExercise(),set=state?.[activeDay]?.[activeEx]?.[index];if(!ex||!set?.done)return;const best=bestState(ex),kg=Number(set.kg)||0,rm=e1rm(set),had=best.hasHistory;let title='',detail='';if(had&&kg>best.load+1e-9){title='🔥 Nuevo récord de carga';detail=`${ex.name} · ${kg} kg`;}
    else if(had&&rm>best.oneRm+.05){title='🔥 Nuevo récord estimado';detail=`${ex.name} · 1RM ${rm.toFixed(1)} kg`;}
    best.load=Math.max(best.load,kg);best.oneRm=Math.max(best.oneRm,rm);best.hasHistory=best.hasHistory||kg>0||Number(set.reps)>0;if(title)announce(title,detail);
  }
  function bindPr(){resetWorkoutCache();[...document.querySelectorAll('#setRows .setRow')].forEach((row,i)=>{const box=row.querySelector('input[data-k="done"]');if(!box||box.dataset.v37Pr)return;box.dataset.v37Pr='1';box.addEventListener('change',()=>queueMicrotask(()=>checkPr(i)));});}
  function renderV37(){decoratePrevious();bindPr();ensureBanner();}

  const baseRenderSets=renderSets;renderSets=function(){baseRenderSets();renderV37();};
  const baseOpenRegister=openRegister;openRegister=function(){baseOpenRegister();if($id('register')?.classList.contains('active'))renderV37();};
  const baseShow=show;show=function(id){baseShow(id);if(id==='register')renderV37();if(id==='profile')updateVersion();};
  const baseProgress=renderProgress;renderProgress=function(){baseProgress();updateVersion();};
  const baseFinish=finishDay;finishDay=function(){baseFinish();resetWorkoutCache();};
  const baseDiscard=discardWorkout;discardWorkout=function(){baseDiscard();resetWorkoutCache();};
  injectStyles();if($id('setRows')?.children.length)renderV37();ensureBanner();updateVersion();
})();
