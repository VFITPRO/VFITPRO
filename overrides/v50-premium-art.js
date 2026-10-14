/* VFIT PRO V50: premium per-exercise artwork mapping. Loaded after v49-catalog.js and before accounts.js. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const ROOT = 'assets/exercises/premium/';
  const ANATOMY_ROOT = 'assets/anatomy/premium/';
  const ANATOMY = Object.freeze({
    'Pectoral medio': ANATOMY_ROOT + 'muscle-pectoral-medio.webp',
    'Pectoral superior': ANATOMY_ROOT + 'muscle-pectoral-superior.webp',
    'Pectoral inferior': ANATOMY_ROOT + 'muscle-pectoral-inferior.webp',
    'Pectoral mayor': ANATOMY_ROOT + 'muscle-pectoral-mayor.webp'
  });

  const PREMIUM = Object.freeze({
    'Press de banca con barra': { image: ROOT + 'press-de-banca-con-barra.webp', anatomy: ANATOMY['Pectoral medio'] },
    'Press inclinado con barra': { image: ROOT + 'press-inclinado-con-barra.webp', anatomy: ANATOMY['Pectoral superior'] },
    'Press declinado con barra': { image: ROOT + 'press-declinado-con-barra.webp', anatomy: ANATOMY['Pectoral inferior'] },
    'Press plano con mancuernas': { image: ROOT + 'press-plano-con-mancuernas.webp', anatomy: ANATOMY['Pectoral medio'] },
    'Press inclinado con mancuernas': { image: ROOT + 'press-inclinado-con-mancuernas.webp', anatomy: ANATOMY['Pectoral superior'] },
    'Press declinado con mancuernas': { image: ROOT + 'press-declinado-con-mancuernas.webp', anatomy: ANATOMY['Pectoral inferior'] },
    'Press de pecho en máquina': { image: ROOT + 'press-de-pecho-en-maquina.webp', anatomy: ANATOMY['Pectoral medio'] },
    'Press convergente de pecho': { image: ROOT + 'press-convergente-de-pecho.webp', anatomy: ANATOMY['Pectoral mayor'] },
    'Press de banca en Smith': { image: ROOT + 'press-de-banca-en-smith.webp', anatomy: ANATOMY['Pectoral medio'] },
    'Press inclinado en Smith': { image: ROOT + 'press-inclinado-en-smith.webp', anatomy: ANATOMY['Pectoral superior'] },
    'Aperturas con mancuernas': { image: ROOT + 'aperturas-con-mancuernas.webp', anatomy: ANATOMY['Pectoral mayor'] },
    'Aperturas inclinadas con mancuernas': { image: ROOT + 'aperturas-inclinadas-con-mancuernas.webp', anatomy: ANATOMY['Pectoral superior'] },
    'Cruce de poleas medio': { image: ROOT + 'cruce-de-poleas-medio.webp', anatomy: ANATOMY['Pectoral medio'] },
    'Cruce de poleas de abajo arriba': { image: ROOT + 'cruce-de-poleas-de-abajo-arriba.webp', anatomy: ANATOMY['Pectoral superior'] },
    'Cruce de poleas de arriba abajo': { image: ROOT + 'cruce-de-poleas-de-arriba-abajo.webp', anatomy: ANATOMY['Pectoral inferior'] },
    'Pec deck': { image: ROOT + 'pec-deck.webp', anatomy: ANATOMY['Pectoral mayor'] },
    'Fondos enfocados a pecho': { image: ROOT + 'fondos-enfocados-a-pecho.webp', anatomy: ANATOMY['Pectoral inferior'] },
    'Flexiones': { image: ROOT + 'flexiones.webp', anatomy: ANATOMY['Pectoral mayor'] },
    'Flexiones lastradas': { image: ROOT + 'flexiones-lastradas.webp', anatomy: ANATOMY['Pectoral mayor'] }
  });

  let applied = 0;
  for (const [, ex] of exerciseCatalog) {
    const art = PREMIUM[String(ex?.name || '')];
    if (!art) continue;
    ex.image = art.image;
    ex.thumb = art.image;
    ex.anatomy = art.anatomy;
    ex.premiumArt = true;
    ex.premiumAnatomy = true;
    applied += 1;
  }

  window.VFITPremiumArtV50 = {
    version: 50,
    applied,
    names: () => Object.keys(PREMIUM),
    has: name => Object.prototype.hasOwnProperty.call(PREMIUM, String(name || '')),
    src: name => PREMIUM[String(name || '')]?.image || null,
    anatomy: name => PREMIUM[String(name || '')]?.anatomy || null
  };
})();
