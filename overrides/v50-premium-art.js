/* VFIT PRO V50 premium artwork. Visual fields only; stable V49 exercise identity keys remain untouched. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const ROOT = 'assets/exercises/premium/';
  const ANATOMY_ROOT = 'assets/anatomy/premium/';
  const VERSION = '?v=505';
  const P = file => ROOT + file + VERSION;
  const M = file => ANATOMY_ROOT + file + VERSION;
  const A = Object.freeze({
    medio: M('muscle-pectoral-medio.webp'),
    superior: M('muscle-pectoral-superior.webp'),
    inferior: M('muscle-pectoral-inferior.webp'),
    mayor: M('muscle-pectoral-mayor.webp'),
    landmine: M('muscle-press-landmine-unilateral.webp')
  });
  const B = Object.freeze({
    row: M('muscle-remo-curvado-con-barra.webp'),
    unilateral: M('muscle-remo-unilateral-con-mancuerna.webp'),
    cableNeutral: M('muscle-remo-sentado-en-polea-agarre-neutro.webp')
  });

  const PREMIUM = Object.freeze({
    // Pecho. Press declinado con mancuernas continúa fuera por revisión visual.
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
    'Press landmine unilateral': {thumb: P('press-landmine-unilateral.webp'), anatomy: A.landmine},

    // Espalda. Una misma anatomía puede reutilizarse cuando el patrón muscular es equivalente.
    'Remo curvado con barra': {thumb: P('remo-curvado-con-barra.webp'), anatomy: B.row},
    'Remo unilateral con mancuerna': {thumb: P('remo-unilateral-con-mancuerna.webp'), anatomy: B.unilateral},
    'Remo Seal': {thumb: P('remo-seal.webp'), anatomy: B.row},
    'Jalón al pecho agarre neutro': {thumb: P('jalon-al-pecho-agarre-neutro.webp')},
    'Jalón al pecho agarre ancho': {thumb: P('jalon-al-pecho-agarre-ancho.webp')},
    'Remo sentado en polea agarre neutro': {thumb: P('remo-sentado-en-polea-agarre-neutro.webp'), anatomy: B.cableNeutral},
    'Remo sentado en polea agarre ancho': {thumb: P('remo-sentado-en-polea-agarre-ancho.webp'), anatomy: B.row},
    'Remo en máquina convergente': {thumb: P('remo-en-maquina-convergente.webp'), anatomy: B.row},
    'Remo unilateral en polea': {thumb: P('remo-unilateral-en-polea.webp'), anatomy: B.unilateral}
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