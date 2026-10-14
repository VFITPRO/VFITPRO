/* VFIT PRO V50 premium artwork. Visual fields only; stable V49 exercise identity keys remain untouched. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const ROOT = 'assets/exercises/premium/';
  const ANATOMY_ROOT = 'assets/anatomy/premium/';
  const VERSION = '?v=503';
  const P = file => ROOT + file + VERSION;
  const M = file => ANATOMY_ROOT + file + VERSION;
  const A = Object.freeze({
    medio: M('muscle-pectoral-medio.webp'),
    superior: M('muscle-pectoral-superior.webp'),
    inferior: M('muscle-pectoral-inferior.webp'),
    mayor: M('muscle-pectoral-mayor.webp')
  });

  const PREMIUM = Object.freeze({
    // Pecho: 18 fotografías verificadas. Press declinado con mancuernas queda
    // fuera por revisión visual y Press landmine unilateral sigue pendiente.
    'Press de banca con barra': {thumb: P('press-de-banca-con-barra.webp'), anatomy: A.medio},
    'Press inclinado con barra': {thumb: P('press-inclinado-con-barra.webp'), anatomy: A.superior},
    'Press declinado con barra': {thumb: P('press-declinado-con-barra.webp'), anatomy: A.inferior},
    'Press plano con mancuernas': {thumb: P('press-plano-con-mancuernas.webp'), anatomy: A.medio},
    'Press inclinado con mancuernas': {thumb: P('press-inclinado-con-mancuernas.webp'), anatomy: A.superior},
    'Press de pecho en máquina': {thumb: P('press-de-pecho-en-maquina.webp'), anatomy: A.medio},
    'Press convergente de pecho': {thumb: P('press-convergente-de-pecho.webp'), anatomy: A.mayor},
    'Press de banca en Smith': {thumb: P('press-de-banca-en-smith.webp'), anatomy: A.medio},
    'Press inclinado en Smith': {thumb: P('press-inclinado-en-smith.webp'), anatomy: A.superior},
    'Aperturas con mancuernas': {thumb: P('aperturas-con-mancuernas.webp'), anatomy: A.mayor},
    'Aperturas inclinadas con mancuernas': {thumb: P('aperturas-inclinadas-con-mancuernas.webp'), anatomy: A.superior},
    'Cruce de poleas medio': {thumb: P('cruce-de-poleas-medio.webp'), anatomy: A.medio},
    'Cruce de poleas de abajo arriba': {thumb: P('cruce-de-poleas-de-abajo-arriba.webp'), anatomy: A.superior},
    'Cruce de poleas de arriba abajo': {thumb: P('cruce-de-poleas-de-arriba-abajo.webp'), anatomy: A.inferior},
    'Pec deck': {thumb: P('pec-deck.webp'), anatomy: A.mayor},
    'Fondos enfocados a pecho': {thumb: P('fondos-enfocados-a-pecho.webp'), anatomy: A.inferior},
    'Flexiones': {thumb: P('flexiones.webp'), anatomy: A.mayor},
    'Flexiones lastradas': {thumb: P('flexiones-lastradas.webp'), anatomy: A.mayor},

    // Espalda: fotografías verificadas. Se conserva la anatomía V49 hasta que
    // exista una anatomía premium independiente y revisada para cada movimiento.
    'Remo Seal': {thumb: P('remo-seal.webp')},
    'Jalón al pecho agarre neutro': {thumb: P('jalon-al-pecho-agarre-neutro.webp')},
    'Jalón al pecho agarre ancho': {thumb: P('jalon-al-pecho-agarre-ancho.webp')},
    'Remo sentado en polea agarre neutro': {thumb: P('remo-sentado-en-polea-agarre-neutro.webp')},
    'Remo sentado en polea agarre ancho': {thumb: P('remo-sentado-en-polea-agarre-ancho.webp')},
    'Remo en máquina convergente': {thumb: P('remo-en-maquina-convergente.webp')},
    'Remo unilateral en polea': {thumb: P('remo-unilateral-en-polea.webp')}
  });

  let applied = 0;
  for (const [, ex] of exerciseCatalog) {
    const art = PREMIUM[String(ex?.name || '')];
    if (!art) continue;
    // Never mutate ex.image: V49 uses it as the stable identity for history,
    // favourites, saved programs and synchronization.
    if (art.thumb) ex.thumb = art.thumb;
    if (art.anatomy) ex.anatomy = art.anatomy;
    ex.premiumArt = !!art.thumb;
    ex.premiumAnatomy = !!art.anatomy;
    applied++;
  }

  window.VFITPremiumArtV50 = Object.freeze({
    applied,
    names: () => Object.keys(PREMIUM),
    has: name => Object.prototype.hasOwnProperty.call(PREMIUM, String(name || '')),
    thumb: name => PREMIUM[String(name || '')]?.thumb || null,
    anatomy: name => PREMIUM[String(name || '')]?.anatomy || null
  });
})();