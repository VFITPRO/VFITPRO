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

  // Routine-only legacy visual: this exercise is not part of the V49 catalog.
  const legacyRoutineVisuals=Object.freeze({
    'Flexión de cadera':{
      thumb:'assets/exercises/premium/flexion-de-cadera.webp?v=510',
      anatomy:'assets/anatomy/premium/muscle-flexores-de-cadera.webp?v=510'
    }
  });

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
            const legacy=legacyRoutineVisuals[String(ex?.name||'')];
            if(legacy){
              ex.thumb=legacy.thumb;
              ex.anatomy=legacy.anatomy;
              ex.premiumArt=true;
              ex.premiumAnatomy=true;
              continue;
            }
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