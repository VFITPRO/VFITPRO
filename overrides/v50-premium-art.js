/* VFIT PRO V50 premium artwork. Visual fields only; stable V49 exercise identity keys remain untouched. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const ROOT = 'assets/exercises/premium/';
  const ANATOMY_ROOT = 'assets/anatomy/premium/';
  const PREMIUM = Object.freeze({
    // Chest assets physically present in the repository.
    'Press inclinado con barra': {
      thumb: ROOT + 'press-inclinado-con-barra.webp',
      anatomy: ANATOMY_ROOT + 'muscle-pectoral-superior.webp'
    },
    'Press de pecho en máquina': {
      thumb: ROOT + 'press-de-pecho-en-maquina.webp',
      anatomy: ANATOMY_ROOT + 'muscle-pectoral-medio.webp'
    },
    'Press convergente de pecho': {
      thumb: ROOT + 'press-convergente-de-pecho.webp',
      anatomy: ANATOMY_ROOT + 'muscle-pectoral-mayor.webp'
    },

    // Back rollout: premium exercise photo only. Keep the existing V49 anatomy until
    // a verified premium anatomical asset for the corresponding movement is available.
    'Remo Seal': {thumb: ROOT + 'remo-seal.webp'},
    'Jalón al pecho agarre neutro': {thumb: ROOT + 'jalon-al-pecho-agarre-neutro.webp'},
    'Jalón al pecho agarre ancho': {thumb: ROOT + 'jalon-al-pecho-agarre-ancho.webp'},
    'Remo sentado en polea agarre neutro': {thumb: ROOT + 'remo-sentado-en-polea-agarre-neutro.webp'},
    'Remo sentado en polea agarre ancho': {thumb: ROOT + 'remo-sentado-en-polea-agarre-ancho.webp'},
    'Remo en máquina convergente': {thumb: ROOT + 'remo-en-maquina-convergente.webp'},
    'Remo unilateral en polea': {thumb: ROOT + 'remo-unilateral-en-polea.webp'}
  });

  let applied = 0;
  for (const [, ex] of exerciseCatalog) {
    const art = PREMIUM[String(ex?.name || '')];
    if (!art) continue;
    if (art.thumb) ex.thumb = art.thumb;
    if (art.anatomy) ex.anatomy = art.anatomy;
    ex.premiumArt = !!art.thumb;
    ex.premiumAnatomy = !!art.anatomy;
    applied++;
  }

  window.VFITPremiumArtV50 = {
    applied,
    names: () => Object.keys(PREMIUM),
    has: name => Object.prototype.hasOwnProperty.call(PREMIUM, String(name || '')),
    thumb: name => PREMIUM[String(name || '')]?.thumb || null,
    anatomy: name => PREMIUM[String(name || '')]?.anatomy || null
  };
})();
