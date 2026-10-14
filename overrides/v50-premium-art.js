/* VFIT PRO V50: premium per-exercise artwork mapping. Loaded after v49-catalog.js and before accounts.js. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const PREMIUM = Object.freeze({
    'Press inclinado con barra': 'assets/exercises/premium/press-inclinado-con-barra.webp',
    'Press convergente de pecho': 'assets/exercises/premium/press-convergente-de-pecho.webp',
    'Press de pecho en máquina': 'assets/exercises/premium/press-de-pecho-en-maquina.webp'
  });

  let applied = 0;
  for (const [, ex] of exerciseCatalog) {
    const src = PREMIUM[String(ex?.name || '')];
    if (!src) continue;
    ex.image = src;
    ex.thumb = src;
    ex.premiumArt = true;
    applied += 1;
  }

  window.VFITPremiumArtV50 = {
    version: 50,
    applied,
    names: () => Object.keys(PREMIUM),
    has: name => Object.prototype.hasOwnProperty.call(PREMIUM, String(name || '')),
    src: name => PREMIUM[String(name || '')] || null
  };
})();
