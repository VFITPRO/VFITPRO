/* VFIT accounts. Public browser key only; ownership is enforced by database RLS. */
(() => {
  'use strict';
  const URL = 'https://aevotmatwxbrkzhubcfm.supabase.co';
  const KEY = 'sb_publishable_7NuaSbd-xtodzDwws9zJxw_rHp2idDr';
  const clone = value => JSON.parse(JSON.stringify(value));
  const legacy = {
    state: readSaved('vfit12-state', null),
    progress: readSaved('vfit12-progress', null),
    favorites: readSaved('vfit-favorites', []),
    currentWorkout: readSaved('vfit-current-workout', null)
  };
  let uid = null, ready = false, revision = 0, generation = 0;
  let stamp = null, dirty = false, conflicted = false, syncTimer = null;
  let syncPromise = null, profile = {}, mode = 'login', busy = false;
  const gate = document.createElement('main');
  gate.className = 'accountGate';
  gate.innerHTML = `<h1>VFIT<span>PRO</span></h1>
    <p>Tu cuenta. Tu entrenamiento. Tu progreso.</p>
    <div class="accountCard">
      <div class="accountTabs" role="tablist" aria-label="Acceso">
        <button type="button" id="loginTab" role="tab" aria-selected="true">Entrar</button>
        <button type="button" id="signupTab" role="tab" aria-selected="false">Crear cuenta</button>
      </div>
      <form id="accountForm">
        <div id="accountNameField" hidden><label for="accountName">Tu nombre</label><input id="accountName" maxlength="60" autocomplete="name"></div>
        <label for="accountEmail">Correo electrónico</label>
        <input id="accountEmail" type="email" required autocomplete="username" autocapitalize="none" spellcheck="false">
        <label for="accountPassword">Contraseña</label>
        <input id="accountPassword" type="password" required autocomplete="current-password">
        <p id="signupHelp" hidden>Usa al menos 10 caracteres. Guarda tu contraseña: la recuperación por correo aún no está configurada. Por ahora el correo no se verifica.</p>
        <button class="cta" id="accountSubmit" type="submit">Entrar</button>
      </form>
      <p class="accountMessage" id="accountMessage" role="status" aria-live="polite">Comprobando tu sesión…</p>
      <button class="accountRecovery" id="recoveryHelp" type="button">¿Olvidaste tu contraseña?</button>
      <p>Las cuentas guardan sus datos por separado. No compartas tu contraseña. Se necesita internet para entrar por primera vez.</p>
    </div>`;
  document.body.appendChild(gate);
  const panel = document.createElement('div');
  panel.className = 'profileBlock';
  panel.innerHTML = `<h3>Mi cuenta</h3><p class="accountName" id="signedInName"></p>
    <p class="accountName" id="signedInEmail"></p>
    <div class="accountStatus" id="cloudStatus" role="status" aria-live="polite"></div>
    <p>Tu cuenta tiene sus propias cargas, series, notas, favoritos e historial. El programa inicial conserva los cinco días de VFIT PRO.</p>
    <div class="accountActions">
      <button type="button" id="syncAccount">Sincronizar ahora</button>
      <button type="button" id="useCloud" hidden>Cargar la versión guardada en la nube</button>
      <button type="button" id="useLocal" hidden>Conservar esta versión del dispositivo</button>
      <button type="button" id="importLegacy" hidden>Importar mi progreso anterior de este teléfono</button>
      <button type="button" id="signOutAccount">Cerrar sesión</button>
    </div>`;
  $('profile').insertBefore(panel, $('profile').children[1]);
  const oldBlock = $('profile').children[2];
  oldBlock.querySelector('h3').textContent = 'Guardado privado por cuenta';
  oldBlock.querySelector('p').textContent = 'Tu progreso se guarda en Supabase y en una copia local de esta cuenta. Si no hay conexión, verás cuándo quedan cambios pendientes. No entrenes simultáneamente en varios dispositivos; si hay versiones distintas, podrás elegir cuál conservar.';
  const versionBlock = $('profile').lastElementChild;
  versionBlock.querySelector('h3').textContent = 'Versión Premium V23';
  const el = id => document.getElementById(id);
  const cacheKey = id => 'vfit-account-data:' + id;
  function store(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { status('No se pudo guardar la copia local. Mantén la conexión y no cierres la app hasta sincronizar.', true); return false; }
  }
  function snapshot() { return clone({schemaVersion:3, program:programSnapshot(), state, progress, favorites, currentWorkout, profile}); }
  function cache() { if (uid) store(cacheKey(uid), {data:snapshot(), dirty, stamp}); }
  function status(message, error = false) {
    el('cloudStatus').textContent = message;
    el('cloudStatus').dataset.state = error ? 'error' : 'ok';
    el('useCloud').hidden = el('useLocal').hidden = !conflicted;
  }
  function resetData(data = {}) {
    loadProgram(data.program);
    $("editorOverlay")?.remove();
    const num = (n, fallback = 0) => Number.isFinite(Number(n)) && Number(n) >= 0 ? Number(n) : fallback;
    state = routines.map((r,i) => r.ex.map((ex,j) => {
      const saved = data.state?.[i]?.[j];
      return Array.isArray(saved) && saved.length ? saved.slice(0,20).map(s => ({kg:num(s.kg), reps:num(s.reps), rir:num(s.rir), done:s.done === true, note:typeof s.note === 'string' ? s.note.slice(0,4000) : ''})) : blankSets(ex);
    }));
    const p = data.progress || {};
    progress = {streak:0, sessions:num(p.sessions), volume:num(p.volume), records:{}, history:[], nextDay:num(p.nextDay)%routines.length};
    if (p.records && typeof p.records === 'object') for (const ex of routines.flatMap(r=>r.ex)) if (p.records[ex.name] !== undefined) progress.records[ex.name] = num(p.records[ex.name]);
    if (Array.isArray(p.history)) progress.history = p.history.slice(0,10000).filter(h=>h && typeof h === 'object').map(h=>({title:String(h.title || 'Entrenamiento').slice(0,200),date:String(h.date || '').replace(/[^0-9/]/g,''),timestamp:num(h.timestamp),volume:num(h.volume),sets:num(h.sets),...safeHistoryDetails(h)}));
    favorites = Array.isArray(data.favorites) ? data.favorites.filter(k=>typeof k === 'string' && /^\d+:\d+$/.test(k) && routines[k.split(':')[0]]?.ex[k.split(':')[1]]) : [];
    const w = data.currentWorkout;
    currentWorkout = safeWorkout(w);
    const rawProfile = data.profile && typeof data.profile === 'object' ? data.profile : {};
    profile = {name:String(rawProfile.name || '').slice(0,60)};
    if (rawProfile.v23 && typeof rawProfile.v23 === 'object') profile.v23 = clone(rawProfile.v23);
    activeDay = activeEx = 0;
    if (timerInt) {clearInterval(timerInt); timerInt = null;}
    restDeadline=null;restDuration=90;renderWorkoutClock();
    rest = 90; $('timer').textContent = fmt(rest); $('timerToggle').textContent = '▶';
    $('notes').value = ''; $('setRows').innerHTML = ''; $('exerciseList').innerHTML = '';
    closeDayOptions(); renderDays(); renderProgress(); updateResume(); renderFavorites();
  }
  // Stop all legacy writes. Existing anonymous storage remains untouched for optional import.
  writeSaved = () => {
    if (!uid || !ready) return;
    dirty = true; revision++; cache();
    status('Cambios guardados en este dispositivo · pendientes de sincronizar');
    clearTimeout(syncTimer); syncTimer = setTimeout(()=>sync(), 600);
  };
  function refreshIdentity(user) {
    el('signedInName').textContent = profile.name || user.user_metadata?.name || 'Mi cuenta';
    el('signedInEmail').textContent = user.email || '';
    const hasLegacy = legacy.progress?.sessions > 0 || legacy.progress?.history?.length > 0 || legacy.currentWorkout || legacy.favorites?.length;
    el('importLegacy').hidden = !hasLegacy || Boolean(readSaved('vfit-legacy-imported-by', null)) || progress.sessions > 0;
  }
  function reveal(user) {
    ready = true; refreshIdentity(user); gate.hidden = true;
    document.body.classList.add('account-ready'); show('home');
  }
  function showGate(message = '') {
    document.body.classList.remove('account-ready'); gate.hidden = false;
    el('accountMessage').textContent = message;
  }
  function errorText(error) {
    if (error?.message?.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (error?.message?.includes('Email not confirmed')) return 'El correo requiere confirmación. Revisa la configuración de Supabase.';
    if (/already registered|already been registered/i.test(error?.message || '')) return 'Ese correo ya tiene una cuenta. Pulsa Entrar.';
    if (/rate limit|too many/i.test(error?.message || '')) return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
    return 'No se pudo completar la operación. Comprueba la conexión y vuelve a intentarlo.';
  }
  if (!window.supabase?.createClient) {
    showGate('No se pudo cargar el sistema de cuentas. Comprueba la conexión y recarga.');
    el('accountSubmit').disabled = true; return;
  }
  const client = window.supabase.createClient(URL, KEY, {
    auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:false, storageKey:'vfit-auth-session'}
  });
  function setMode(value) {
    mode = value; el('accountNameField').hidden = el('signupHelp').hidden = mode !== 'signup';
    el('accountName').required = mode === 'signup';
    el('accountPassword').minLength = mode === 'signup' ? 10 : 1;
    el('accountPassword').autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    el('accountSubmit').textContent = mode === 'signup' ? 'Crear mi cuenta' : 'Entrar';
    el('loginTab').setAttribute('aria-selected', String(mode === 'login'));
    el('signupTab').setAttribute('aria-selected', String(mode === 'signup'));
    el('accountMessage').textContent = '';
  }
  el('loginTab').onclick = ()=>{if (!busy) setMode('login');};
  el('signupTab').onclick = ()=>{if (!busy) setMode('signup');};
  el('recoveryHelp').onclick = ()=>{el('accountMessage').textContent = 'La recuperación por correo todavía no está configurada. No crees otra cuenta si quieres conservar el progreso: solicita ayuda al administrador de VFIT PRO.';};
  async function loadSession(session) {
    const nextUid = session?.user?.id || null;
    if (uid === nextUid && ready) return;
    const gen = ++generation;
    clearTimeout(syncTimer); ready = false; uid = nextUid; dirty = false; conflicted = false; stamp = null;
    resetData(); showGate(nextUid ? 'Cargando únicamente los datos de tu cuenta…' : 'Entra o crea tu cuenta para empezar.');
    if (!nextUid) return;
    const local = readSaved(cacheKey(nextUid), null);
    try {
      const {data:row, error} = await client.from('vfit_user_data').select('data,updated_at').eq('user_id', nextUid).maybeSingle();
      if (gen !== generation) return;
      if (error) throw error;
      stamp = row?.updated_at || null;
      if (local?.dirty) {
        resetData(local.data); dirty = true; conflicted = (local.stamp || null) !== stamp;
        // Keep the original base version until the user resolves the conflict.
        // Otherwise a reload could accidentally approve overwriting cloud data.
        stamp = local.stamp || null;
      } else resetData(row?.data || {});
      profile.name ||= session.user.user_metadata?.name || '';
      reveal(session.user); cache();
      if (conflicted) status('Hay cambios en otro dispositivo. Elige cuál conservar; no se ha sobrescrito nada.', true);
      else if (dirty) sync();
      else status('Tu progreso está sincronizado con tu cuenta.');
    } catch {
      if (gen !== generation) return;
      if (local?.data) {
        resetData(local.data); stamp = local.stamp || null; dirty = Boolean(local.dirty);
        reveal(session.user); status('Sin conexión a la nube. Usando solo la copia local de esta cuenta.', true);
      } else showGate('No se pudo cargar tu progreso. Comprueba la conexión y pulsa Entrar otra vez. No se ha sobrescrito ningún dato.');
    }
  }
  async function doSync() {
    if (!uid || !ready || conflicted) return false;
    const gen = generation, owner = uid;
    if (!navigator.onLine) {status('Sin conexión · cambios pendientes en este dispositivo', true); return false;}
    if (!dirty) {
      // A clean refresh loads the newest cloud version instead of overwriting it.
      ready = false; await loadSession((await client.auth.getSession()).data.session); return ready;
    }
    const rev = revision, data = snapshot(), base = stamp;
    status('Sincronizando…');
    try {
      const changedAt = new Date().toISOString();
      const query = base
        ? client.from('vfit_user_data').update({data, updated_at:changedAt}).eq('user_id', owner).eq('updated_at', base).select('updated_at')
        : client.from('vfit_user_data').insert({user_id:owner, data, updated_at:changedAt}).select('updated_at');
      const {data:rows, error} = await query;
      if (gen !== generation) return false;
      if ((error && error.code === '23505') || (!error && !rows?.length)) {
        conflicted = true; status('Hay otra versión en la nube. Elige cuál conservar; tus cambios siguen en este dispositivo.', true); return false;
      }
      if (error) throw error;
      stamp = rows[0].updated_at; dirty = revision !== rev; cache();
      status(dirty ? 'Quedan cambios pendientes de sincronizar.' : 'Sincronizado · ' + new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}));
      return !dirty;
    } catch {
      if (gen === generation) status('No se pudo sincronizar. Tus cambios siguen en este dispositivo. Pulsa «Sincronizar ahora» para reintentar.', true);
      return false;
    }
  }
  async function sync() {
    if (syncPromise) return syncPromise;
    syncPromise = doSync();
    try {return await syncPromise;} finally {
      syncPromise = null;
      if (dirty && ready && !conflicted && navigator.onLine && el('cloudStatus').dataset.state !== 'error') {
        clearTimeout(syncTimer); syncTimer = setTimeout(()=>sync(),600);
      }
    }
  }
  el('accountForm').onsubmit = async event => {
    event.preventDefault(); if (busy) return;
    busy = true; el('accountSubmit').disabled = true;
    el('accountMessage').textContent = mode === 'signup' ? 'Creando tu cuenta…' : 'Entrando…';
    const credentials = {email:el('accountEmail').value.trim(),password:el('accountPassword').value};
    try {
      const result = mode === 'signup'
        ? await client.auth.signUp({...credentials,options:{data:{name:el('accountName').value.trim()}}})
        : await client.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      el('accountPassword').value = '';
      if (result.data.session) await loadSession(result.data.session);
      else el('accountMessage').textContent = 'La cuenta requiere confirmar el correo. Revisa «Confirm email» en Supabase antes de continuar.';
    } catch (error) {el('accountMessage').textContent = errorText(error);}
    finally {busy = false; el('accountSubmit').disabled = false;}
  };
  el('syncAccount').onclick = ()=>sync();
  async function resolveConflict(useLocal) {
    if (!uid || !ready) return;
    if (!window.confirm(useLocal ? '¿Guardar la versión de este dispositivo en lugar de la de la nube? La otra versión será reemplazada.' : '¿Cargar la versión de la nube? Los cambios pendientes de este dispositivo serán reemplazados.')) return;
    const gen = generation;
    const {data:row,error} = await client.from('vfit_user_data').select('data,updated_at').eq('user_id',uid).maybeSingle();
    if (gen !== generation) return;
    if (error) {status('No se pudo cargar la versión de la nube. No se ha cambiado nada.',true); return;}
    // Recoverable backup before an explicit conflict resolution.
    store(cacheKey(uid)+':conflict-backup', {local:snapshot(), cloud:row?.data || {},savedAt:Date.now()});
    stamp = row?.updated_at || null; conflicted = false;
    if (useLocal) {dirty = true; cache(); await sync();}
    else {resetData(row?.data || {});dirty = false;cache();refreshIdentity((await client.auth.getSession()).data.session?.user || {});show('profile');status('Versión de la nube cargada.');}
  }
  el('useCloud').onclick = ()=>resolveConflict(false);
  el('useLocal').onclick = ()=>resolveConflict(true);
  el('importLegacy').onclick = async ()=>{
    if (!uid || !ready || conflicted) return;
    if (!window.confirm('¿El progreso anterior de este teléfono es tuyo? Se copiará solo a esta cuenta. Hazlo únicamente en tu propia cuenta.')) return;
    const currentProfile = profile;
    store(cacheKey(uid)+':before-import', snapshot());
    resetData({...legacy,profile:currentProfile});
    store('vfit-legacy-imported-by',uid); dirty = true; revision++;cache();
    el('importLegacy').hidden = true; show('profile');await sync();
  };
  el('signOutAccount').onclick = async ()=>{
    el('signOutAccount').disabled = true;
    clearTimeout(syncTimer);
    if (dirty) {
      await sync();
      if (dirty && !window.confirm('Hay cambios pendientes. La copia de esta cuenta quedará en este dispositivo, pero no estará disponible en otro hasta sincronizar. ¿Cerrar sesión?')) {el('signOutAccount').disabled=false;return;}
    }
    cache();
    const {error} = await client.auth.signOut({scope:'local'});
    if (error) status('No se pudo cerrar sesión. Reintenta con conexión.',true);
    else {await loadSession(null);el('accountEmail').value='';el('accountName').value='';el('accountPassword').value='';}
    el('signOutAccount').disabled = false;
  };
  // Never await SDK methods inside its auth callback (avoids SDK lock deadlocks).
  client.auth.onAuthStateChange((event, session)=>{
    if (event === 'TOKEN_REFRESHED') return;
    if (busy && event === 'SIGNED_IN') return;
    setTimeout(()=>{if (!busy) loadSession(session);},0);
  });
  window.addEventListener('online',()=>sync());
  window.addEventListener('pagehide',()=>{if (ready) cache();});
  document.addEventListener('visibilitychange',()=>{if (document.visibilityState === 'visible' && ready) sync();else if (ready) cache();});
  client.auth.getSession().then(({data,error})=>{if(error)showGate('No se pudo recuperar la sesión. Vuelve a entrar.');else loadSession(data.session);});
  window.VFITAccountBridge = Object.freeze({
    getProfile: () => profile,
    getUid: () => uid,
    snapshot: () => clone(snapshot()),
    markDirty: () => writeSaved('vfit-v23', Date.now()),
    restore: data => {
      if (!uid || !ready || !data || typeof data !== 'object') return false;
      store(cacheKey(uid)+':before-v23-restore', snapshot());
      resetData(clone(data)); dirty = true; revision++; cache();
      status('Copia restaurada · pendiente de sincronizar'); sync(); return true;
    }
  });
})();
