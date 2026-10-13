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
})();