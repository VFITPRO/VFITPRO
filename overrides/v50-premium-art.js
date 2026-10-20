/* VFIT PRO V50 premium artwork. Visual fields only; stable V49 exercise identity keys remain untouched. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;

  const ROOT = 'assets/exercises/premium/';
  const ANATOMY_ROOT = 'assets/anatomy/premium/';
  const VERSION = '?v=509';
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
    cableNeutral: M('muscle-remo-sentado-en-polea-agarre-neutro.webp'),
    lat: M('muscle-dorsal-ancho.webp')
  });
  const C = Object.freeze({
    lateralDeltoid: M('muscle-deltoides-lateral.webp'),
    deltoidGeneral: M('muscle-deltoides-general.webp'),
    deltoidAnterior: M('muscle-deltoides-anterior.webp'),
    deltoidPosterior: M('muscle-deltoides-posterior.webp'),
    deltoidTrap: M('muscle-deltoides-trapecio.webp'),
    bicepsShort: M('muscle-biceps-cabeza-corta.webp'),
    biceps: M('muscle-biceps-braquial.webp'),
    triceps: M('muscle-triceps.webp'),
    tricepsLateral: M('muscle-triceps-lateral.webp'),
    tricepsLong: M('muscle-triceps-largo.webp'),
    tricepsMedial: M('muscle-triceps-medial.webp'),
    quads: M('muscle-cuadriceps.webp'),
    hamstrings: M('muscle-isquiotibiales.webp'),
    gluteMed: M('muscle-gluteo-medio.webp')
  });

  const PREMIUM = Object.freeze({
    // Pecho. V511 reutiliza la anatomía inferior también para el press declinado
    // con mancuernas; la foto continúa pendiente de una versión visual aprobada.
    'Press de banca con barra': {thumb: P('press-de-banca-con-barra.webp'), anatomy: A.medio},
    'Press inclinado con barra': {thumb: P('press-inclinado-con-barra.webp'), anatomy: A.superior},
    'Press declinado con barra': {thumb: P('press-declinado-con-barra.webp'), anatomy: A.inferior},
    'Press plano con mancuernas': {thumb: P('press-plano-con-mancuernas.webp'), anatomy: A.medio},
    'Press inclinado con mancuernas': {thumb: P('press-inclinado-con-mancuernas.webp'), anatomy: A.superior},
    'Press declinado con mancuernas': {anatomy: A.inferior},
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

    // Espalda. Los patrones de remo comparten el mapa posterior de dorsal/espalda
    // media; los patrones verticales y pullovers reutilizan dorsal ancho.
    'Remo curvado con barra': {thumb: P('remo-curvado-con-barra.webp'), anatomy: B.row},
    'Remo Pendlay': {anatomy: B.row},
    'Remo T': {anatomy: B.row},
    'Remo con pecho apoyado y mancuernas': {anatomy: B.row},
    'Remo en máquina convergente': {thumb: P('remo-en-maquina-convergente.webp'), anatomy: B.row},
    'Remo sentado en polea agarre neutro': {thumb: P('remo-sentado-en-polea-agarre-neutro.webp'), anatomy: B.cableNeutral},
    'Remo sentado en polea agarre ancho': {thumb: P('remo-sentado-en-polea-agarre-ancho.webp'), anatomy: B.row},
    'Remo unilateral con mancuerna': {thumb: P('remo-unilateral-con-mancuerna.webp'), anatomy: B.unilateral},
    'Remo unilateral en polea': {thumb: P('remo-unilateral-en-polea.webp'), anatomy: B.unilateral},
    'Remo Seal': {thumb: P('remo-seal.webp'), anatomy: B.row},
    'Remo alto en máquina': {anatomy: B.row},
    'Jalón al pecho agarre ancho': {thumb: P('jalon-al-pecho-agarre-ancho.webp'), anatomy: B.lat},
    'Jalón al pecho agarre neutro': {thumb: P('jalon-al-pecho-agarre-neutro.webp'), anatomy: B.lat},
    'Jalón al pecho agarre supino': {anatomy: B.lat},
    'Jalón unilateral': {anatomy: B.lat},
    'Dominadas pronas': {anatomy: B.lat},
    'Dominadas supinas': {anatomy: B.lat},
    'Dominadas asistidas': {anatomy: B.lat},
    'Pullover en polea con brazos rectos': {anatomy: B.lat},
    'Pullover en máquina': {anatomy: B.lat},
    'Pullover con mancuerna': {anatomy: B.lat},
    'Remo invertido': {anatomy: B.row},
    // Rack pull y peso muerto convencional quedan pendientes de una anatomía
    // específica de erectores/trapecio/cadena posterior.

    // Hombro. Reutiliza anatomías sólo cuando el patrón muscular principal coincide.
    'Press militar con barra': {thumb: P('press-militar-con-barra.webp'), anatomy: C.deltoidGeneral},
    'Press militar sentado con barra': {thumb: P('press-militar-sentado-con-barra.webp'), anatomy: C.deltoidGeneral},
    'Press de hombro con mancuernas': {thumb: P('press-de-hombro-con-mancuernas.webp'), anatomy: C.deltoidGeneral},
    'Press Arnold': {thumb: P('press-arnold.webp'), anatomy: C.deltoidGeneral},
    'Press de hombro en máquina': {thumb: P('press-de-hombro-en-maquina.webp'), anatomy: C.deltoidGeneral},
    'Press de hombro en Smith': {thumb: P('press-de-hombro-en-smith.webp'), anatomy: C.deltoidGeneral},
    'Elevación lateral con mancuernas': {thumb: P('elevacion-lateral-con-mancuernas.webp'), anatomy: C.lateralDeltoid},
    'Elevación lateral en polea': {thumb: P('elevacion-lateral-en-polea.webp'), anatomy: C.lateralDeltoid},
    'Elevación lateral en máquina': {anatomy: C.lateralDeltoid},
    'Elevación lateral inclinada en polea': {anatomy: C.lateralDeltoid},
    'Elevación frontal con mancuernas': {thumb: P('elevacion-frontal-con-mancuernas.webp'), anatomy: C.deltoidAnterior},
    'Elevación frontal con disco': {anatomy: C.deltoidAnterior},
    'Elevación frontal en polea': {anatomy: C.deltoidAnterior},
    'Pec deck inverso': {thumb: P('pec-deck-inverso.webp'), anatomy: C.deltoidPosterior},
    'Pájaros con mancuernas': {thumb: P('pajaros-con-mancuernas.webp'), anatomy: C.deltoidPosterior},
    'Apertura posterior en polea': {anatomy: C.deltoidPosterior},
    'Face pull': {thumb: P('face-pull.webp'), anatomy: C.deltoidPosterior},
    'Remo al mentón': {anatomy: C.deltoidTrap},
    // Elevación Y queda pendiente: necesita trapecio bajo/manguito rotador específico.

    // Bíceps. No se reutiliza el bíceps general en martillos, curl inverso ni
    // variantes de cabeza larga cuando el catálogo pide una activación distinta.
    'Curl con barra recta': {thumb: P('curl-con-barra-recta.webp'), anatomy: C.biceps},
    'Curl con barra EZ': {anatomy: C.biceps},
    'Curl alterno con mancuernas': {thumb: P('curl-alterno-con-mancuernas.webp'), anatomy: C.biceps},
    'Curl de concentración': {anatomy: C.biceps},
    'Curl Scott con barra EZ': {thumb: P('curl-scott-con-barra-ez.webp'), anatomy: C.bicepsShort},
    'Curl Scott en máquina': {anatomy: C.bicepsShort},
    'Curl en polea con barra recta': {anatomy: C.biceps},
    'Curl araña': {anatomy: C.biceps},
    'Drag curl': {anatomy: C.biceps},

    // Tríceps. Las variantes sobre cabeza usan cabeza larga; empujes y fondos
    // reutilizan el mapa general o lateral/medial según el patrón.
    'Extensión de tríceps con cuerda': {thumb: P('extension-de-triceps-con-cuerda.webp'), anatomy: C.tricepsLateral},
    'Extensión de tríceps con barra recta': {thumb: P('extension-de-triceps-con-barra-recta.webp'), anatomy: C.tricepsLateral},
    'Extensión de tríceps con barra V': {anatomy: C.tricepsLateral},
    'Extensión de tríceps sobre cabeza con cuerda': {anatomy: C.tricepsLong},
    'Extensión sobre cabeza con mancuerna': {thumb: P('extension-sobre-cabeza-con-mancuerna.webp'), anatomy: C.tricepsLong},
    'Extensión unilateral sobre cabeza': {anatomy: C.tricepsLong},
    'Press francés con barra EZ': {thumb: P('press-frances-con-barra-ez.webp'), anatomy: C.triceps},
    'Press de banca agarre cerrado': {anatomy: C.triceps},
    'Fondos enfocados a tríceps': {anatomy: C.triceps},
    'Fondos en máquina': {anatomy: C.triceps},
    'Extensión unilateral en polea': {anatomy: C.triceps},
    'Extensión cruzada en polea': {anatomy: C.triceps},
    'Patada de tríceps con mancuerna': {anatomy: C.triceps},
    'Patada de tríceps en polea': {anatomy: C.triceps},
    'JM press': {anatomy: C.triceps},

    // Cuádriceps. Todos comparten cuádriceps como objetivo primario del catálogo.
    'Sentadilla trasera high bar': {anatomy: C.quads},
    'Sentadilla frontal': {anatomy: C.quads},
    'Sentadilla hack': {thumb: P('sentadilla-hack.webp'), anatomy: C.quads},
    'Sentadilla pendular': {anatomy: C.quads},
    'Sentadilla en Smith': {anatomy: C.quads},
    'Prensa inclinada 45°': {thumb: P('prensa-inclinada-45.webp'), anatomy: C.quads},
    'Prensa horizontal': {anatomy: C.quads},
    'Extensión de cuádriceps': {thumb: P('extension-de-cuadriceps.webp'), anatomy: C.quads},
    'Extensión unilateral de cuádriceps': {anatomy: C.quads},
    'Sentadilla búlgara enfoque cuádriceps': {anatomy: C.quads},
    'Zancada hacia atrás': {anatomy: C.quads},
    'Zancadas caminando': {anatomy: C.quads},
    'Step-up': {anatomy: C.quads},
    'Sissy squat': {anatomy: C.quads},
    'Sentadilla goblet': {anatomy: C.quads},
    'Belt squat': {anatomy: C.quads},

    // Cadena posterior: sólo se reutiliza isquiotibial/glúteo medio cuando el
    // objetivo primario coincide. Glúteo mayor, aductores y erectores quedan
    // pendientes de anatomías propias para no marcar músculos incorrectos.
    'Peso muerto rumano con barra': {anatomy: C.hamstrings},
    'Peso muerto rumano con mancuernas': {anatomy: C.hamstrings},
    'Buenos días': {anatomy: C.hamstrings},
    'Curl femoral sentado': {anatomy: C.hamstrings},
    'Curl femoral tumbado': {thumb: P('curl-femoral-tumbado.webp'), anatomy: C.hamstrings},
    'Curl femoral de pie': {anatomy: C.hamstrings},
    'Curl nórdico': {anatomy: C.hamstrings},
    'Abducción de cadera en máquina': {thumb: P('abduccion-de-cadera-en-maquina.webp'), anatomy: C.gluteMed},
    'Abducción de cadera en polea': {anatomy: C.gluteMed},
    'Peso muerto rumano unilateral': {anatomy: C.hamstrings}
  });

  // Nombres antiguos de las rutinas: sólo resuelven arte visual; no cambian ex.name ni ex.image.
  const ALIASES = Object.freeze({
    'Press de banca': 'Press de banca con barra',
    'Aperturas en polea': 'Cruce de poleas medio',
    'Extensión de tríceps en polea': 'Extensión de tríceps con cuerda',
    'Extensión de tríceps sobre la cabeza': 'Extensión sobre cabeza con mancuerna',
    'Press francés': 'Press francés con barra EZ',
    'Remo curvado': 'Remo curvado con barra',
    'Remo en polea': 'Remo sentado en polea agarre neutro',
    'Jalón al pecho': 'Jalón al pecho agarre ancho',
    'Curl Scott': 'Curl Scott con barra EZ',
    'Curl con mancuernas': 'Curl alterno con mancuernas',
    'Abducción de cadera': 'Abducción de cadera en máquina',
    'Curl femoral': 'Curl femoral tumbado',
    'Prensa de piernas': 'Prensa inclinada 45°',
    'Crucifijo invertido': 'Pájaros con mancuernas',
    'Elevación frontal': 'Elevación frontal con mancuernas',
    'Elevación lateral': 'Elevación lateral con mancuernas',
    'Desarrollo de hombro': 'Press de hombro con mancuernas',
    'Curl en banco Scott': 'Curl Scott con barra EZ'
  });

  // Ejercicios antiguos que sólo existen en las rutinas históricas.
  const ROUTINE_ONLY = Object.freeze({
    'Extensión de tríceps al frente': {
      thumb: P('extension-de-triceps-al-frente.webp'),
      anatomy: C.tricepsMedial
    }
  });

  const resolve = name => {
    const key = String(name || '');
    if (ROUTINE_ONLY[key]) return ROUTINE_ONLY[key];
    const canonical = ALIASES[key] || key;
    return PREMIUM[canonical] || null;
  };

  let applied = 0;
  for (const [, ex] of exerciseCatalog) {
    // Catalog remains exact: aliases are only for legacy routines.
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
    aliases: () => ({...ALIASES}),
    has: name => !!resolve(name),
    thumb: name => resolve(name)?.thumb || null,
    anatomy: name => resolve(name)?.anatomy || null
  });
})();