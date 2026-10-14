/* VFIT PRO V50 premium artwork preview. Keep stable V49 exercise keys intact. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const ROOT = 'assets/exercises/premium/';
  const ANATOMY_ROOT = 'assets/anatomy/premium/';
  const PREMIUM = Object.freeze({
    'Press inclinado con barra': {thumb: ROOT + 'press-inclinado-con-barra.webp', anatomy: ANATOMY_ROOT + 'muscle-pectoral-superior.webp'},
    'Press de pecho en máquina': {thumb: ROOT + 'press-de-pecho-en-maquina.webp', anatomy: ANATOMY_ROOT + 'muscle-pectoral-medio.webp'},
    'Press convergente de pecho': {thumb: ROOT + 'press-convergente-de-pecho.webp', anatomy: ANATOMY_ROOT + 'muscle-pectoral-mayor.webp'}
  });
  let applied=0;
  for(const [key,ex] of exerciseCatalog){
    const art=PREMIUM[String(ex?.name||'')];
    if(!art)continue;
    ex.thumb=art.thumb;
    ex.anatomy=art.anatomy;
    ex.premiumArt=true;
    ex.premiumAnatomy=true;
    applied++;
  }
  window.VFITPremiumArtV50={
    applied,
    names:()=>Object.keys(PREMIUM),
    has:name=>Object.prototype.hasOwnProperty.call(PREMIUM,String(name||'')),
    thumb:name=>PREMIUM[String(name||'')]?.thumb||null,
    anatomy:name=>PREMIUM[String(name||'')]?.anatomy||null
  };
})();
