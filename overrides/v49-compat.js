/* VFIT PRO V49 compatibility guard for dynamic program structures. */
(() => {
  'use strict';
  function clampActiveSelection(){
    if(!Array.isArray(routines)||!routines.length){activeDay=0;activeEx=0;return;}
    if(!Number.isInteger(activeDay)||!routines[activeDay])activeDay=0;
    const list=routines[activeDay]?.ex;
    if(!Array.isArray(list)||!list.length){activeEx=0;return;}
    if(!Number.isInteger(activeDay)||!routines[activeDay])activeDay=0;
    if(!Number.isInteger(activeEx)||!list[activeEx])activeEx=0;
  }
  const beforeDays=renderDays;
  renderDays=function(){clampActiveSelection();return beforeDays();};
  const beforeShow=show;
  show=function(id){clampActiveSelection();return beforeShow(id);};
  const beforeProgress=renderProgress;
  renderProgress=function(){clampActiveSelection();return beforeProgress();};
  window.VFITNavGuardV49={clamp:clampActiveSelection};

  // V50 premium artwork loader. Only visual fields change; V49 identity keys remain intact.
  const premium=document.createElement('script');
  premium.src='v50-premium-art.js?v=506';
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