/* V55: interfaz moderna. Solo presentación: reutiliza las funciones y datos existentes. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const home = $('home'), profile = $('profile');
  if (!home) return;

  /* ---------- Semana actual (lunes a domingo) ---------- */
  function weekProgress() {
    const now = new Date(), start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const days = new Set((progress?.history || []).filter(h => Number(h.timestamp) >= start.getTime()).map(h => h.date));
    const goalRaw = Number(window.VFITAccountBridge?.getProfile?.()?.v23?.weeklyGoal);
    const goal = Number.isInteger(goalRaw) && goalRaw >= 1 && goalRaw <= 7 ? goalRaw : 5;
    const done = (progress?.history || []).filter(h => Number(h.timestamp) >= start.getTime()).length;
    return { done, goal, pct: Math.min(100, Math.round(done / goal * 100)), days: days.size };
  }

  /* ---------- Inicio ---------- */
  const C = 2 * Math.PI * 40;
  function buildHome() {
    if ($('uiHome')) return;
    const greet = mk('div', 'uiGreet');
    greet.innerHTML = '<h1 id="uiHello"></h1><p>Hipertrofia 5 días</p>';
    home.querySelector('.topbar .title').replaceChildren(greet);

    const box = mk('div'); box.id = 'uiHome';
    box.innerHTML =
      '<div class="uiCard uiRing"><div class="uiRingBox" role="img" id="uiRingBox">' +
        `<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="40" fill="none" stroke-width="10"/><circle class="bar" id="uiRingBar" cx="50" cy="50" r="40" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"/></svg>` +
        '<div class="pct" id="uiRingPct">0%</div></div>' +
        '<div class="uiRingText"><h2>Tu progreso semanal</h2><b id="uiRingTitle"></b><small id="uiRingSub"></small></div></div>' +
      '<button type="button" class="uiNext" id="uiNext"><div><small id="uiNextLabel">Próximo entrenamiento</small><b id="uiNextTitle"></b></div><span class="play" aria-hidden="true">▶</span></button>' +
      '<h3>Accesos rápidos</h3>' +
      '<div class="uiQuick"><button type="button" data-go="routines"><span>▣</span>Rutinas</button><button type="button" data-go="library"><span>＋</span>Biblioteca</button><button type="button" data-go="progress"><span>▥</span>Progreso</button><button type="button" data-go="profile"><span>◉</span>Perfil</button></div>';
    home.querySelector('.topbar').after(box);

    $('uiNext').addEventListener('click', () => $('resumeBtn')?.click());
    box.querySelectorAll('.uiQuick button').forEach(b => b.addEventListener('click', () => {
      const go = b.dataset.go;
      if (go === 'library') { show('routines'); document.querySelector('#uxTabs-routines [data-choice="library"]')?.click(); }
      else show(go);
    }));
  }
  function refreshHome() {
    const hello = $('uiHello'); if (hello) hello.textContent = '¡Hola, a entrenar! 👋';
    const w = weekProgress();
    $('uiRingPct').textContent = w.pct + '%';
    $('uiRingBar').setAttribute('stroke-dashoffset', (C * (1 - w.pct / 100)).toFixed(2));
    $('uiRingBox').setAttribute('aria-label', `${w.pct}% del objetivo semanal`);
    $('uiRingTitle').textContent = `${w.done} de ${w.goal} sesiones`;
    $('uiRingSub').textContent = w.done >= w.goal ? '¡Objetivo de la semana cumplido!' : (w.done === 0 ? 'Empieza tu primera sesión de la semana.' : `Te faltan ${w.goal - w.done} para el objetivo.`);
    const label = $('resumeLabel')?.textContent || '', title = $('resumeTitle')?.textContent || '';
    $('uiNextLabel').textContent = /retomar/i.test(label) ? 'Retomar entrenamiento' : 'Próximo entrenamiento';
    $('uiNextTitle').textContent = title;
  }

  /* ---------- Rutinas: título del día y detalles ---------- */
  function restyleDayCards() {
    document.querySelectorAll('.dayCard').forEach(card => {
      if (card.dataset.ui55 === '1') return;
      const title = card.querySelector('.cardTitle'), sub = card.querySelector('.cardSub');
      const m = /^Día\s+(\d+)\s*·\s*(.+)$/.exec(title?.textContent || '');
      if (!m || !sub) return;
      card.dataset.ui55 = '1';
      title.textContent = m[2];
      sub.textContent = `Día ${m[1]} · ${sub.textContent}`;
    });
  }

  /* ---------- Perfil: tarjeta de cuenta ---------- */
  function buildProfileCard() {
    if (!profile || $('uiProfileCard')) return;
    const card = mk('div', 'uiProfileCard'); card.id = 'uiProfileCard';
    card.innerHTML = '<div class="uiAvatar" id="uiAvatar" aria-hidden="true">V</div><div><b id="uiProfileName"></b><small id="uiProfileEmail"></small></div>';
    const tabs = $('uxTabs-profile'); (tabs || profile.querySelector('.topbar')).after(card);
  }
  function refreshProfileCard() {
    if (!$('uiProfileCard')) return;
    const name = String(window.VFITAccountBridge?.getProfile?.()?.name || '').trim();
    const email = ($('signedInEmail')?.textContent || '').trim();
    $('uiProfileName').textContent = name || 'Mi cuenta';
    $('uiProfileEmail').textContent = email;
    $('uiAvatar').textContent = (name || email || 'V').charAt(0).toUpperCase();
  }

  /* ---------- Enganches con el código existente ---------- */
  const baseDays = renderDays;
  renderDays = function () { const r = baseDays.apply(this, arguments); restyleDayCards(); return r; };
  const baseOpenDay = openDay;
  openDay = function (i) {
    const r = baseOpenDay.apply(this, arguments);
    const day = routines?.[i];
    if (day) { $('dayTitle').textContent = day.title; $('daySub').textContent = `Día ${day.day} · ${day.time}`; }
    return r;
  };
  const baseOpenExercise = openExercise;
  openExercise = function () {
    const r = baseOpenExercise.apply(this, arguments);
    const more = $('uxMore-exercise');
    if (more && more.getAttribute('aria-expanded') === 'false') more.click();
    const h = document.querySelector('#exercise #tech')?.closest('.panel')?.querySelector('h2'); if (h) h.textContent = 'Indicaciones';
    return r;
  };
  const baseShow = show;
  show = function (id) {
    const r = baseShow.apply(this, arguments);
    if (id === 'home') refreshHome();
    if (id === 'profile') refreshProfileCard();
    return r;
  };

  buildHome(); buildProfileCard(); restyleDayCards(); refreshHome(); refreshProfileCard();
  window.VFITUiV55 = { refreshHome, refreshProfileCard };
})();
