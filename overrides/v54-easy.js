/* V54: registro fácil. Presentación y ayudas; no cambia el formato de los datos guardados. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY_MODE = 'vfit-easy-mode', KEY_GUIDE = 'vfit-easy-guide-hidden';
  const read = (key, fallback) => { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* solo preferencia visual */ } };
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  let easy = read(KEY_MODE, '1') !== '0';
  let guideHidden = read(KEY_GUIDE, '0') === '1';
  const register = $('register');
  if (!register) return;

  /* ---------- Guía de tres pasos ---------- */
  function buildGuide() {
    if ($('easyGuide')) return;
    const guide = mk('section', 'easyGuide easyKeep');
    guide.id = 'easyGuide';
    guide.setAttribute('aria-label', 'Cómo registrar una serie');
    guide.innerHTML = '<b>Así de fácil</b><ol>' +
      '<li>Escribe los <strong>kilos</strong> y las <strong>repeticiones</strong>.</li>' +
      '<li>Cuando termines la serie, toca el círculo <strong>✓</strong>.</li>' +
      '<li>Al acabar el ejercicio, pulsa <strong>Guardar y siguiente</strong>.</li></ol>' +
      '<button type="button" id="easyGuideOk">Entendido</button>';
    register.querySelector('.topbar').after(guide);
    $('easyGuideOk').addEventListener('click', () => { guideHidden = true; write(KEY_GUIDE, '1'); apply(); });
  }

  /* ---------- Botones de ayuda y modo ---------- */
  function buildExtras() {
    if ($('easyExtras')) return;
    const box = mk('div', 'easyExtras easyKeep');
    box.id = 'easyExtras';
    const toggle = mk('button'); toggle.type = 'button'; toggle.id = 'easyToggle';
    const help = mk('button', '', 'Ver la ayuda otra vez'); help.type = 'button'; help.id = 'easyHelp';
    toggle.addEventListener('click', () => { easy = !easy; write(KEY_MODE, easy ? '1' : '0'); apply(); });
    help.addEventListener('click', () => { guideHidden = false; write(KEY_GUIDE, '0'); apply(); register.scrollIntoView({ block: 'start' }); window.scrollTo(0, 0); });
    box.append(toggle, help);
    register.append(box);
  }

  function relabelHead() {
    const names = ['Serie', 'Kilos', 'Repeticiones', 'RIR', 'Hecha'];
    const cells = register.querySelectorAll('.setHead > div');
    cells.forEach((cell, i) => { if (names[i] && cell.textContent !== names[i]) cell.textContent = names[i]; });
  }

  function apply() {
    document.body.classList.toggle('easyMode', easy);
    const guide = $('easyGuide'); if (guide) guide.hidden = guideHidden;
    const toggle = $('easyToggle');
    if (toggle) {
      toggle.textContent = easy ? 'Mostrar opciones avanzadas (RIR, tipo de serie…)' : 'Volver al modo fácil';
      toggle.setAttribute('aria-pressed', String(!easy));
    }
    relabelHead();
  }

  /* ---------- «Última vez»: un toque para usar esos valores ---------- */
  function decoratePrevious() {
    const rows = $('setRows'); if (!rows) return;
    const setRows = [...rows.querySelectorAll('.setRow')];
    rows.querySelectorAll('.v37Previous').forEach(line => {
      if (line.classList.contains('easyPrev') || line.classList.contains('easyNoPrev')) return;
      const m = /(\d+(?:[.,]\d+)?)\s*kg\s*×\s*(\d+)\s*rep(?:\s*·\s*RIR\s*(\d+))?/i.exec(line.textContent || '');
      if (!m) { line.classList.add('easyNoPrev'); return; }
      const index = setRows.indexOf(line.previousElementSibling);
      if (index < 0) return;
      const kg = Number(m[1].replace(',', '.')), reps = Number(m[2]);
      line.classList.add('easyPrev');
      line.dataset.kg = String(kg); line.dataset.reps = String(reps); line.dataset.index = String(index);
      line.setAttribute('role', 'button'); line.tabIndex = 0;
      line.setAttribute('aria-label', `Usar ${kg} kilos y ${reps} repeticiones de la última vez en la serie ${index + 1}`);
      line.replaceChildren();
      line.append(mk('b', '', 'Última vez:'), document.createTextNode(` ${kg} kg × ${reps}`));
      if (m[3] !== undefined) line.append(mk('span', 'easyRir', ` · RIR ${Number(m[3])}`));
      line.append(mk('u', '', 'Toca para usar'));
    });
  }
  function usePrevious(line) {
    const sets = state?.[activeDay]?.[activeEx], i = Number(line.dataset.index);
    if (!Array.isArray(sets) || !sets[i]) return;
    sets[i].kg = Number(line.dataset.kg); sets[i].reps = Number(line.dataset.reps);
    persist(); renderSets();
    toast(`Serie ${i + 1}: ${line.dataset.kg} kg × ${line.dataset.reps}`);
  }
  const rowsBox = $('setRows');
  rowsBox?.addEventListener('click', e => { const line = e.target.closest?.('.easyPrev'); if (line) usePrevious(line); });
  rowsBox?.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.easyPrev')) { e.preventDefault(); usePrevious(e.target); }
  });

  /* Al tocar una casilla numérica se selecciona todo: se escribe encima del 0. */
  document.addEventListener('focusin', e => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.type === 'number' && t.closest('#setRows')) setTimeout(() => { try { t.select(); } catch { /* nada */ } }, 0);
  });

  /* ---------- «¿Hiciste estas series?»: evita perder series sin ✓ ---------- */
  let confirmBox = null, lastFocus = null;
  function ensureConfirm() {
    if (confirmBox) return confirmBox;
    confirmBox = mk('div', 'easyConfirm'); confirmBox.id = 'easyConfirm'; confirmBox.hidden = true;
    confirmBox.setAttribute('role', 'dialog'); confirmBox.setAttribute('aria-modal', 'true'); confirmBox.setAttribute('aria-labelledby', 'easyConfirmTitle');
    confirmBox.innerHTML = '<div class="easyConfirmBox"><h2 id="easyConfirmTitle"></h2><p id="easyConfirmText"></p>' +
      '<button type="button" class="easyYes" id="easyConfirmYes">Sí, las hice</button>' +
      '<button type="button" id="easyConfirmNo">No, no las hice</button>' +
      '<button type="button" id="easyConfirmBack">Volver a revisar</button></div>';
    document.body.appendChild(confirmBox);
    confirmBox.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); $('easyConfirmBack').click(); return; }
      if (e.key !== 'Tab') return;
      const buttons = [...confirmBox.querySelectorAll('button')], first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return confirmBox;
  }
  function closeConfirm() { if (confirmBox) confirmBox.hidden = true; try { lastFocus?.focus(); } catch { /* nada */ } }
  function askPending(count, onYes, onNo) {
    const box = ensureConfirm();
    $('easyConfirmTitle').textContent = count === 1 ? 'Tienes 1 serie sin marcar ✓' : `Tienes ${count} series sin marcar ✓`;
    $('easyConfirmText').textContent = count === 1
      ? 'Tiene kilos escritos pero no está marcada como hecha. ¿La hiciste?'
      : 'Tienen kilos escritos pero no están marcadas como hechas. ¿Las hiciste?';
    $('easyConfirmYes').textContent = count === 1 ? 'Sí, la hice' : 'Sí, las hice';
    $('easyConfirmNo').textContent = count === 1 ? 'No, no la hice' : 'No, no las hice';
    $('easyConfirmYes').onclick = () => { closeConfirm(); onYes(); };
    $('easyConfirmNo').onclick = () => { closeConfirm(); onNo(); };
    $('easyConfirmBack').onclick = () => closeConfirm();
    lastFocus = document.activeElement; box.hidden = false; $('easyConfirmYes').focus();
  }
  function pendingSets() {
    const sets = (typeof visibleSets === 'function' ? visibleSets() : state?.[activeDay]?.[activeEx]) || [];
    return sets.filter(s => s && !s.done && Number(s.kg) > 0 && Number(s.reps) > 0);
  }
  const baseSave = saveExercise;
  saveExercise = function () {
    const pending = pendingSets();
    if (!pending.length) return baseSave.apply(this, arguments);
    askPending(pending.length,
      () => { pending.forEach(s => { s.done = true; }); persist(); renderSets(); baseSave(); },
      () => baseSave());
  };

  /* ---------- Enganche con el renderizado existente ---------- */
  const baseRender = renderSets;
  renderSets = function () { const result = baseRender.apply(this, arguments); decoratePrevious(); relabelHead(); return result; };
  const baseShow = show;
  show = function (id) { const result = baseShow.apply(this, arguments); if (id === 'register') apply(); return result; };

  /* Otras capas (v37) recrean las líneas «Anterior» al abrir el registro: se vuelven a preparar. */
  if (rowsBox && typeof MutationObserver === 'function') new MutationObserver(() => decoratePrevious()).observe(rowsBox, { childList: true });

  buildGuide(); buildExtras(); apply();
  if ($('setRows')?.children.length) decoratePrevious();
  window.VFITEasyV54 = { apply, setEasy(v) { easy = !!v; write(KEY_MODE, easy ? '1' : '0'); apply(); }, isEasy: () => easy };
})();
