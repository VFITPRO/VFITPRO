/* VFIT PRO V50 premium artwork — chest rollout. Keep stable V49 exercise keys intact. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const ROOT = 'assets/exercises/premium/';
  const ANATOMY_ROOT = 'assets/anatomy/premium/';
  const A = {
    medio: ANATOMY_ROOT + 'muscle-pectoral-medio.webp',
    superior: ANATOMY_ROOT + 'muscle-pectoral-superior.webp',
    inferior: ANATOMY_ROOT + 'muscle-pectoral-inferior.webp',
    mayor: ANATOMY_ROOT + 'muscle-pectoral-mayor.webp'
  };
  const PREMIUM = Object.freeze({
    'Press de banca con barra': {thumb: ROOT + 'press-de-banca-con-barra.webp', anatomy: A.medio},
    'Press inclinado con barra': {thumb: ROOT + 'press-inclinado-con-barra.webp', anatomy: A.superior},
    'Press declinado con barra': {thumb: ROOT + 'press-declinado-con-barra.webp', anatomy: A.inferior},
    'Press plano con mancuernas': {thumb: ROOT + 'press-plano-con-mancuernas.webp', anatomy: A.medio},
    'Press inclinado con mancuernas': {thumb: ROOT + 'press-inclinado-con-mancuernas.webp', anatomy: A.superior},
    'Press de pecho en máquina': {thumb: ROOT + 'press-de-pecho-en-maquina.webp', anatomy: A.medio},
    'Press convergente de pecho': {thumb: ROOT + 'press-convergente-de-pecho.webp', anatomy: A.mayor},
    'Press de banca en Smith': {thumb: ROOT + 'press-de-banca-en-smith.webp', anatomy: A.medio},
    'Press inclinado en Smith': {thumb: ROOT + 'press-inclinado-en-smith.webp', anatomy: A.superior},
    'Aperturas con mancuernas': {thumb: ROOT + 'aperturas-con-mancuernas.webp', anatomy: A.mayor},
    'Aperturas inclinadas con mancuernas': {thumb: ROOT + 'aperturas-inclinadas-con-mancuernas.webp', anatomy: A.superior},
    'Cruce de poleas medio': {thumb: ROOT + 'cruce-de-poleas-medio.webp', anatomy: A.medio},
    'Cruce de poleas de abajo arriba': {thumb: ROOT + 'cruce-de-poleas-de-abajo-arriba.webp', anatomy: A.superior},
    'Cruce de poleas de arriba abajo': {thumb: ROOT + 'cruce-de-poleas-de-arriba-abajo.webp', anatomy: A.inferior},
    'Pec deck': {thumb: ROOT + 'pec-deck.webp', anatomy: A.mayor},
    'Fondos enfocados a pecho': {thumb: ROOT + 'fondos-enfocados-a-pecho.webp', anatomy: A.inferior},
    'Flexiones': {thumb: ROOT + 'flexiones.webp', anatomy: A.mayor},
    'Flexiones lastradas': {thumb: ROOT + 'flexiones-lastradas.webp', anatomy: A.mayor}
  });

  let applied=0;
  for(const [,ex] of exerciseCatalog){
    const art=PREMIUM[String(ex?.name||'')];
    if(!art)continue;
    // Never change ex.image: it is the stable V49 identity used by history/favorites/programs.
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
