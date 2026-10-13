/* VFIT PRO V23 enhancements: calendar, weekly goal, editable history, equipment,
   temporary substitutions, backups, CSV export and body measurements. */
(() => {
  'use strict';
  const bridge = window.VFITAccountBridge;
  if (!bridge) return;
  const clone = value => JSON.parse(JSON.stringify(value));
  const $id = id => document.getElementById(id);
  const DAY = 86400000;
  const EQUIPMENT = ['Barra','Barra EZ','Mancuernas','Polea','Máquina'];
  let calendarOffset = 0;

  function defaults() {
    return {
      weeklyGoal: 5,
      measurements: [],
      equipment: Object.fromEntries(EQUIPMENT.map(x => [x, true])),
      substituteLoads: {},
      substitutions: {},
      lastDeletedSession: null
    };
  }
  function cleanNumber(value, min, max, nullable = true) {
    if (value === '' || value === null || value === undefined) return nullable ? null : min;
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) return nullable ? null : Math.max(min, Math.min(max, n || min));
    return Math.round(n * 100) / 100;
  }
  function sanitizeV23(raw) {
    const base = defaults();
    if (!raw || typeof raw !== 'object') return base;
    base.weeklyGoal = Number.isInteger(Number(raw.weeklyGoal)) ? Math.max(1, Math.min(7, Number(raw.weeklyGoal))) : 5;
    if (raw.equipment && typeof raw.equipment === 'object') {
      for (const name of EQUIPMENT) base.equipment[name] = raw.equipment[name] !== false;
    }
    if (Array.isArray(raw.measurements)) {
      base.measurements = raw.measurements.slice(0, 500).filter(x => x && typeof x === 'object').map(x => ({
        id: String(x.id || (Date.now() + Math.random())).slice(0, 80),
        timestamp: Number.isFinite(Number(x.timestamp)) ? Number(x.timestamp) : Date.now(),
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date || '')) ? String(x.date) : new Date().toISOString().slice(0,10),
        weight: cleanNumber(x.weight, 20, 400), waist: cleanNumber(x.waist, 20, 250), chest: cleanNumber(x.chest, 20, 250),
        arm: cleanNumber(x.arm, 10, 100), thigh: cleanNumber(x.thigh, 20, 150), bodyFat: cleanNumber(x.bodyFat, 2, 70)
      })).sort((a,b) => b.timestamp - a.timestamp);
    }
    if (raw.substituteLoads && typeof raw.substituteLoads === 'object') {
      for (const [key, list] of Object.entries(raw.substituteLoads).slice(0, 100)) {
        if (!Array.isArray(list)) continue;
        base.substituteLoads[String(key).slice(0,220)] = list.slice(0,20).map(s => ({
          kg: Math.max(0, Number(s.kg)||0), reps: Math.max(0, Math.round(Number(s.reps)||0)), rir: Math.max(0, Math.min(10, Math.round(Number(s.rir)||0))), done:false, note:String(s.note||'').slice(0,4000)
        }));
      }
    }
    if (raw.substitutions && typeof raw.substitutions === 'object') {
      for (const [slot, sub] of Object.entries(raw.substitutions).slice(0, 20)) {
        if (!/^\d+:\d+$/.test(slot) || !sub || typeof sub !== 'object') continue;
        base.substitutions[slot] = {
          originalKey:String(sub.originalKey||'').slice(0,220), replacementKey:String(sub.replacementKey||'').slice(0,220),
          slotBackup:Array.isArray(sub.slotBackup)?sub.slotBackup.slice(0,20).map(s=>({kg:Math.max(0,Number(s.kg)||0),reps:Math.max(0,Math.round(Number(s.reps)||0)),rir:Math.max(0,Math.min(10,Math.round(Number(s.rir)||0))),done:s.done===true,note:String(s.note||'').slice(0,4000)})):[]
        };
      }
    }
    if (raw.lastDeletedSession && raw.lastDeletedSession.session) base.lastDeletedSession = clone(raw.lastDeletedSession);
    return base;
  }
  function cfg() {
    const profile = bridge.getProfile();
    const clean = sanitizeV23(profile.v23);
    profile.v23 = clean;
    return clean;
  }
  function markDirty(message) {
    bridge.markDirty();
    if (message && typeof toast === 'function') toast(message);
  }
  function escCsv(value) {
    const s = String(value ?? '');
    return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  }
  function downloadText(name, text, type='text/plain;charset=utf-8') {
    const blob = new Blob(['\ufeff', text], {type});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function sessionDate(session) {
    if (Number(session?.timestamp) > 0) { const d = new Date(Number(session.timestamp)); if (!Number.isNaN(d.getTime())) return d; }
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(session?.date||''));
    return m ? new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), 12) : null;
  }
  function isoLocal(date) {
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function formatDateInput(iso) {
    const [y,m,d]=iso.split('-').map(Number); return new Date(y,m-1,d,12);
  }
  function weekBounds() {
    const now = new Date(); now.setHours(0,0,0,0); const day = (now.getDay()+6)%7;
    const start = new Date(now); start.setDate(start.getDate()-day); const end = new Date(start); end.setDate(end.getDate()+7);
    return [start,end];
  }
  function currentWeekSessions() {
    const [start,end] = weekBounds();
    return progress.history.filter(h => { const d=sessionDate(h); return d && d>=start && d<end; }).length;
  }
  function equipmentType(ex) { return String(ex?.equipment||'').split('·')[0].trim(); }
  function muscleFamily(ex) {
    const p=String(ex?.primary||'').toLowerCase();
    if(/pectoral/.test(p))return'pecho'; if(/tríceps/.test(p))return'triceps'; if(/bíceps|braquial/.test(p))return'biceps';
    if(/dorsal|espalda|rombo/.test(p))return'espalda'; if(/cuádriceps/.test(p))return'cuadriceps'; if(/glúteo|abdu/.test(p))return'gluteo';
    if(/isquio|femoral/.test(p))return'femoral'; if(/flexor|cadera/.test(p))return'cadera'; if(/deltoides|hombro|supraespinoso/.test(p))return'hombro';
    return p.split(/[/(]/)[0].trim();
  }
  function catalogValues() {
    const seen=new Set(), out=[];
    for (const ex of exerciseCatalog.values()) { if (!seen.has(ex.image)) {seen.add(ex.image);out.push(ex);} }
    return out;
  }
  function subSlot(day=activeDay,index=activeEx){return `${day}:${index}`;}
  function activeSub(day=activeDay,index=activeEx){return cfg().substitutions[subSlot(day,index)] || null;}
  function subExercise(day=activeDay,index=activeEx){const sub=activeSub(day,index);return sub?exerciseCatalog.get(sub.replacementKey)||null:null;}

  function injectStyles() {
    if ($id('v23Styles')) return;
    const style=document.createElement('style');style.id='v23Styles';style.textContent=`
      .v23Grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v23Metric{border:1px solid var(--line2);background:#0d1722;border-radius:14px;padding:11px}.v23Metric b{display:block;font-size:18px}.v23Metric small{color:var(--muted);font-size:10px}.v23Progress{height:10px;border-radius:999px;background:#172433;overflow:hidden;margin:10px 0}.v23Progress>i{display:block;height:100%;background:linear-gradient(90deg,var(--orange),var(--orange2));border-radius:inherit}.v23Calendar{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.v23Dow{text-align:center;color:var(--muted);font-size:10px;padding:4px}.v23Day{min-height:43px;border:1px solid var(--line);background:#081018;color:#fff;border-radius:10px;padding:5px;font-size:12px;position:relative}.v23Day.other{opacity:.34}.v23Day.trained{border-color:#8e5516;background:#1a1209}.v23Day.today{outline:1px solid var(--orange)}.v23Day em{position:absolute;right:4px;bottom:3px;font-size:9px;color:var(--orange);font-style:normal;font-weight:900}.v23Row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.v23Row>*{min-width:0}.v23Field{display:block;margin:9px 0;color:#cbd4dd;font-size:12px}.v23Field input,.v23Field select{display:block;width:100%;margin-top:5px;padding:10px;border:1px solid var(--line2);border-radius:10px;background:#08111b;color:#fff;font-size:16px}.v23Measure{border:1px solid var(--line);border-radius:14px;padding:10px;margin:8px 0;background:#081018}.v23Measure strong{display:block}.v23Measure small{display:block;color:var(--muted);margin:3px 0 8px}.v23Tiny{border:1px solid var(--line2);background:#101a25;color:#fff;border-radius:9px;padding:8px 10px}.v23Danger{border-color:#66333a!important;color:#ff8e94!important}.v23SetEdit{display:grid;grid-template-columns:36px 1fr 1fr 1fr;gap:6px;align-items:center;margin:6px 0}.v23SetEdit input{width:100%;padding:8px 4px;border:1px solid var(--line2);border-radius:8px;background:#08111b;color:#fff;text-align:center}.v23Equip{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}.v23Equip:last-child{border-bottom:0}.v23Equip input{width:22px;height:22px;accent-color:var(--orange)}.v23SubBadge{color:var(--orange);font-size:11px;font-weight:900;margin-top:4px}.v23CalendarHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.v23CalendarHead strong{text-transform:capitalize}.v23Backup{border:1px solid var(--line);border-radius:12px;padding:10px;margin:8px 0}.v23Backup small{color:var(--muted);display:block;margin:3px 0 8px}@media(max-width:380px){.v23Grid{grid-template-columns:1fr}.v23Day{min-height:38px;padding:4px}}
    `;document.head.appendChild(style);
  }
  function addPanel(parent,id,title,before=null){
    let panel=$id(id); if(panel)return panel; panel=document.createElement('div');panel.id=id;panel.className='panel';const h=document.createElement('h2');h.textContent=title;panel.appendChild(h);parent.insertBefore(panel,before);return panel;
  }
  function insertBeforeClose(panel,node){const close=panel.querySelector(':scope > button:last-child');if(close)panel.insertBefore(node,close);else panel.appendChild(node);return node;}
  function action(label,fn,cls='') {const b=document.createElement('button');b.className='optionAction '+cls;b.textContent=label;b.onclick=fn;return b;}

  function buildUi(){
    injectStyles();if($id('v23Equipment')){renderV23();return;}
    const prog=$id('progress');
    const histPanel=$id('history')?.closest('.panel');
    const weekly=addPanel(prog,'v23Weekly','Objetivo semanal',histPanel); weekly.innerHTML='<h2>Objetivo semanal</h2><div id="v23WeeklyBody"></div>';
    const calendar=addPanel(prog,'v23CalendarPanel','Calendario',histPanel); calendar.innerHTML='<h2>Calendario</h2><div id="v23CalendarBody"></div>';
    const measurements=addPanel(prog,'v23Measurements','Medidas corporales',null); measurements.innerHTML='<h2>Medidas corporales</h2><div id="v23MeasurementsBody"></div>';
    const tools=addPanel(prog,'v23Tools','Herramientas',null);tools.innerHTML='<h2>Herramientas</h2><button class="optionAction" id="v23Csv">Exportar entrenamientos y medidas a CSV</button><button class="optionAction" id="v23Undo" hidden>Deshacer última eliminación del historial</button>';
    $id('v23Csv').onclick=exportCsv;$id('v23Undo').onclick=undoDeletedSession;

    const profile=$id('profile'), version=profile.lastElementChild;
    const equip=document.createElement('div');equip.className='profileBlock';equip.id='v23Equipment';equip.innerHTML='<h3>Mi material disponible</h3><p>Marca el material que tienes. VFIT lo usa para ofrecer sustituciones temporales que encajen mejor con tu gimnasio.</p><div id="v23EquipmentBody"></div>';profile.insertBefore(equip,version);
    const backups=document.createElement('div');backups.className='profileBlock';backups.id='v23Backups';backups.innerHTML='<h3>Copias restaurables</h3><p>Guarda hasta 5 copias locales de tu cuenta antes de hacer cambios grandes.</p><button class="optionAction" id="v23CreateBackup">Crear copia ahora</button><div id="v23BackupList"></div>';profile.insertBefore(backups,version);
    $id('v23CreateBackup').onclick=createBackup;
    version.querySelector('h3').textContent='Versión Premium V23';
    version.querySelector('p').textContent='Calendario, objetivo semanal, historial editable, sustituciones temporales, material, copias restaurables, CSV y medidas corporales.';
    renderV23();
  }

  function renderWeekly(){
    const c=cfg(), done=currentWeekSessions(), goal=c.weeklyGoal, pct=Math.min(100,Math.round(done/goal*100));
    const [start,end]=weekBounds(),endDay=new Date(end.getTime()-DAY);
    $id('v23WeeklyBody').innerHTML=`<div class="v23Grid"><div class="v23Metric"><b>${done}/${goal}</b><small>sesiones esta semana</small></div><div class="v23Metric"><b>${Math.max(0,goal-done)}</b><small>faltan para el objetivo</small></div></div><div class="v23Progress"><i style="width:${pct}%"></i></div><p style="font-size:12px;color:var(--muted)">${start.toLocaleDateString('es-ES',{day:'numeric',month:'short'})} – ${endDay.toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</p><label class="v23Field">Objetivo semanal<select id="v23Goal">${Array.from({length:7},(_,i)=>`<option value="${i+1}" ${goal===i+1?'selected':''}>${i+1} ${i?'sesiones':'sesión'}</option>`).join('')}</select></label>`;
    $id('v23Goal').onchange=()=>{cfg().weeklyGoal=Number($id('v23Goal').value);markDirty('Objetivo semanal guardado');renderWeekly();};
  }
  function sessionsOn(iso){return progress.history.map((h,i)=>({h,i,d:sessionDate(h)})).filter(x=>x.d&&isoLocal(x.d)===iso);}
  function openCalendarDay(iso){
    const matches=sessionsOn(iso);if(!matches.length)return;
    const d=formatDateInput(iso),panel=panelDialog(d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}));
    matches.forEach(({h,i})=>{const box=document.createElement('div');box.className='v23Measure';const strong=document.createElement('strong');strong.textContent=h.title;const small=document.createElement('small');small.textContent=`${Math.round(h.volume||0).toLocaleString('es-ES')} kg · ${h.sets||0} series · ${fmt(h.duration||0)}`;box.append(strong,small,action('Ver series',()=>openSessionDetail(h)),action('Editar',()=>{panel.parentElement.remove();editHistorySession(i);}));insertBeforeClose(panel,box);});
  }
  function renderCalendar(){
    const now=new Date(),month=new Date(now.getFullYear(),now.getMonth()+calendarOffset,1), first=new Date(month), start=new Date(first);start.setDate(1-((first.getDay()+6)%7));
    const title=month.toLocaleDateString('es-ES',{month:'long',year:'numeric'});let html=`<div class="v23CalendarHead"><button class="v23Tiny" id="v23PrevMonth">‹</button><strong>${title}</strong><button class="v23Tiny" id="v23NextMonth">›</button></div><div class="v23Calendar">${['L','M','X','J','V','S','D'].map(x=>`<div class="v23Dow">${x}</div>`).join('')}`;
    for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const iso=isoLocal(d),count=sessionsOn(iso).length;const classes=['v23Day'];if(d.getMonth()!==month.getMonth())classes.push('other');if(count)classes.push('trained');if(iso===isoLocal(now))classes.push('today');html+=`<button class="${classes.join(' ')}" data-iso="${iso}">${d.getDate()}${count?`<em>${count}</em>`:''}</button>`;}html+='</div><button class="optionAction" id="v23ThisMonth">Volver a este mes</button>';
    $id('v23CalendarBody').innerHTML=html;$id('v23PrevMonth').onclick=()=>{calendarOffset--;renderCalendar();};$id('v23NextMonth').onclick=()=>{calendarOffset++;renderCalendar();};$id('v23ThisMonth').onclick=()=>{calendarOffset=0;renderCalendar();};
    $id('v23CalendarBody').querySelectorAll('.v23Day.trained').forEach(b=>b.onclick=()=>openCalendarDay(b.dataset.iso));
  }
  function renderMeasurements(){
    const list=cfg().measurements,body=$id('v23MeasurementsBody');body.replaceChildren();
    const add=action('+ Añadir medida',()=>editMeasurement());body.appendChild(add);
    if(!list.length){const p=document.createElement('p');p.style.cssText='color:var(--muted);font-size:12px';p.textContent='Aún no has guardado medidas corporales.';body.appendChild(p);return;}
    const latest=list[0],prev=list[1];if(latest.weight){const grid=document.createElement('div');grid.className='v23Grid';const change=prev?.weight?Math.round((latest.weight-prev.weight)*10)/10:null;grid.innerHTML=`<div class="v23Metric"><b>${latest.weight} kg</b><small>peso más reciente</small></div><div class="v23Metric"><b>${change===null?'—':(change>0?'+':'')+change+' kg'}</b><small>cambio vs. registro anterior</small></div>`;body.appendChild(grid);}
    list.slice(0,8).forEach((m,i)=>{const box=document.createElement('div');box.className='v23Measure';const vals=[m.weight&&`${m.weight} kg`,m.waist&&`cintura ${m.waist} cm`,m.chest&&`pecho ${m.chest} cm`,m.arm&&`brazo ${m.arm} cm`,m.thigh&&`muslo ${m.thigh} cm`,m.bodyFat&&`grasa ${m.bodyFat}%`].filter(Boolean);box.innerHTML=`<strong>${formatDateInput(m.date).toLocaleDateString('es-ES')}</strong><small>${vals.join(' · ')||'Registro sin valores'}</small>`;box.append(action('Editar',()=>editMeasurement(i)),action('Eliminar',()=>deleteMeasurement(i),'v23Danger'));body.appendChild(box);});
  }
  function field(label,type='number',value='',attrs=''){const wrap=document.createElement('label');wrap.className='v23Field';wrap.innerHTML=`${label}<input type="${type}" value="${value??''}" ${attrs}>`;return wrap;}
  function editMeasurement(index=null){
    const current=index===null?{date:isoLocal(new Date()),weight:'',waist:'',chest:'',arm:'',thigh:'',bodyFat:''}:cfg().measurements[index];const panel=panelDialog(index===null?'Añadir medidas':'Editar medidas');
    const defs=[['Fecha','date','date',current.date],['Peso (kg)','weight','number',current.weight],['Cintura (cm)','waist','number',current.waist],['Pecho (cm)','chest','number',current.chest],['Brazo (cm)','arm','number',current.arm],['Muslo (cm)','thigh','number',current.thigh],['Grasa corporal (%)','bodyFat','number',current.bodyFat]];
    for(const [label,name,type,val] of defs){const f=field(label,type,val,type==='number'?'step="0.1" inputmode="decimal"':'');f.querySelector('input').name=name;insertBeforeClose(panel,f);}
    insertBeforeClose(panel,action('Guardar medidas',()=>{const get=n=>panel.querySelector(`[name="${n}"]`).value;const item={id:current.id||String(Date.now()),date:get('date'),timestamp:formatDateInput(get('date')).getTime(),weight:cleanNumber(get('weight'),20,400),waist:cleanNumber(get('waist'),20,250),chest:cleanNumber(get('chest'),20,250),arm:cleanNumber(get('arm'),10,100),thigh:cleanNumber(get('thigh'),20,150),bodyFat:cleanNumber(get('bodyFat'),2,70)};if(!item.date){toast('Elige una fecha');return}const list=cfg().measurements;if(index===null)list.push(item);else list[index]=item;list.sort((a,b)=>b.timestamp-a.timestamp);markDirty('Medidas guardadas');panel.parentElement.remove();renderMeasurements();}));
  }
  function deleteMeasurement(index){if(!confirm('¿Eliminar este registro de medidas?'))return;cfg().measurements.splice(index,1);markDirty('Registro eliminado');renderMeasurements();}

  function renderEquipment(){
    const body=$id('v23EquipmentBody');body.replaceChildren();const c=cfg();
    EQUIPMENT.forEach(name=>{const row=document.createElement('label');row.className='v23Equip';const span=document.createElement('span');span.textContent=name;const input=document.createElement('input');input.type='checkbox';input.checked=c.equipment[name]!==false;input.onchange=()=>{cfg().equipment[name]=input.checked;markDirty('Material actualizado');renderSubstitutionPanel();};row.append(span,input);body.appendChild(row);});
  }
  function alternativesFor(ex){const c=cfg(),family=muscleFamily(ex);return catalogValues().filter(x=>x.image!==ex.image&&muscleFamily(x)===family&&c.equipment[equipmentType(x)]!==false);}
  function renderSubstitutionPanel(){
    const screen=$id('exercise');if(!screen)return;$id('v23Substitution')?.remove();const panel=document.createElement('div');panel.id='v23Substitution';panel.className='panel';const sub=activeSub(),replacement=subExercise(),original=routines[activeDay]?.ex[activeEx];
    const h=document.createElement('h2');h.textContent='Sustitución de hoy';panel.appendChild(h);
    if(replacement){const p=document.createElement('p');p.textContent=`Estás usando ${replacement.name} solo en esta sesión, en lugar de ${original.name}. Sus cargas se guardan por separado.`;panel.appendChild(p);panel.append(action('Cambiar sustitución',()=>chooseSubstitution(original)),action('Volver al ejercicio original',removeSubstitution));}
    else {const p=document.createElement('p');p.textContent='Si hoy una máquina o material no está disponible, cambia este ejercicio solo para la sesión actual. Tu rutina permanente no se modifica.';panel.appendChild(p);const alts=alternativesFor(original);const b=action(alts.length?'Sustituir solo hoy':'No hay alternativas con tu material',()=>chooseSubstitution(original));b.disabled=!alts.length;panel.appendChild(b);}
    const firstCta=screen.querySelector('.cta');screen.insertBefore(panel,firstCta);
  }
  function chooseSubstitution(original){
    if(currentWorkout&&currentWorkout.day!==activeDay){toast('Retoma o termina primero la sesión que ya tienes en curso.');return}
    const alts=alternativesFor(original);if(!alts.length){toast('No hay alternativas disponibles con el material marcado.');return}
    const panel=panelDialog('Sustituir solo hoy');const p=document.createElement('p');p.textContent=`Ejercicio actual: ${original.name}. La sustitución desaparecerá al guardar o descartar la sesión.`;insertBeforeClose(panel,p);
    alts.forEach(ex=>{const b=action(`${ex.name} · ${equipmentType(ex)}`,()=>{panel.parentElement.remove();applySubstitution(ex);});insertBeforeClose(panel,b);});
  }
  function applySubstitution(replacement){
    if(!ensureWorkout()){toast('Tienes otra sesión en curso.');return}
    if(currentWorkout.adaptation&&!currentWorkout.adaptation.items.some(x=>x.index===activeEx)){toast('Este ejercicio está fuera de la sesión adaptada de hoy.');return}
    if(state[activeDay][activeEx].some(s=>s.done)){toast('Ya hay series completadas. Guarda o descarta antes de sustituir.');return}
    let c=cfg();const slot=subSlot(),existing=c.substitutions[slot];if(existing){restoreSubSlot(slot,false);c=cfg();}
    const backup=clone(state[activeDay][activeEx]),saved=c.substituteLoads[replacement.image]||[];const count=backup.length;
    state[activeDay][activeEx]=Array.from({length:count},(_,i)=>saved[i]?{...saved[i],done:false}:{kg:0,reps:10,rir:2,done:false,note:''});
    c.substitutions[slot]={originalKey:routines[activeDay].ex[activeEx].image,replacementKey:replacement.image,slotBackup:backup};currentWorkout.exercise=activeEx;markDirty('Sustitución preparada para esta sesión');persist();openExercise(activeEx);
  }
  function restoreSubSlot(slot,notify=true){const c=cfg(),sub=c.substitutions[slot];if(!sub)return;const [d,e]=slot.split(':').map(Number);if(state[d]?.[e]&&Array.isArray(sub.slotBackup)&&sub.slotBackup.length)state[d][e]=clone(sub.slotBackup);delete c.substitutions[slot];markDirty(notify?'Ejercicio original restaurado':null);}
  function removeSubstitution(){restoreSubSlot(subSlot());persist();openExercise(activeEx);}
  function decorateExerciseForSub(){
    document.querySelectorAll('.v23SubBadge').forEach(x=>x.remove());
    const replacement=subExercise();renderSubstitutionPanel();if(!replacement)return;
    $id('exTitle').textContent=replacement.name;$id('exMeta').textContent=replacement.equipment;$id('exImage').src=replacement.image;$id('exPrimary').textContent=replacement.primary;$id('exAnatomy').src=replacement.anatomy;$id('musclePrimary').textContent=replacement.primary;$id('musclePrincipalText').textContent=replacement.primary;$id('muscleSecondary').textContent=replacement.secondary;$id('tech').innerHTML=(techMap[replacement.name]||[]).map((x,i)=>`<div class="techRow"><div class="step">${i+1}</div><div>${x}</div></div>`).join('');
    const badge=document.createElement('div');badge.className='v23SubBadge';badge.textContent='SUSTITUCIÓN SOLO PARA HOY';$id('exMeta').after(badge);$id('progression-exercise')?.remove();
  }
  function renderSubLastExercise(){
    const replacement=subExercise();if(!replacement)return;$id('progression-register')?.remove();$id('lastExercise')?.remove();const last=progress.history.flatMap(h=>h.exercises||[]).find(x=>x.key===replacement.image);if(!last)return;
    const panel=document.createElement('div');panel.id='lastExercise';panel.className='panel';panel.innerHTML='<h2>Tu última sesión con esta sustitución</h2>';const p=document.createElement('p');p.textContent=last.sets.map(s=>`${s.kg} kg × ${s.reps}`).join(' · ');panel.appendChild(p);panel.append(action('Usar estas cargas y repeticiones',()=>{const item=sessionItem();const n=item?.count||state[activeDay][activeEx].length;for(let i=0;i<n;i++)state[activeDay][activeEx][i]={...last.sets[Math.min(i,last.sets.length-1)],done:false};persist();renderSets();}));$id('setRows').parentElement.before(panel);
  }
  function finalizeSubstitutions(day,historySession){
    const c=cfg();for(const [slot,sub] of Object.entries({...c.substitutions})){const [d,e]=slot.split(':').map(Number);if(d!==day)continue;const replacement=exerciseCatalog.get(sub.replacementKey);if(!replacement)continue;
      const captured=clone(state[d][e]);c.substituteLoads[sub.replacementKey]=captured.map(s=>({...s,done:false}));
      if(historySession?.exercises){const entry=historySession.exercises.find(x=>x.key===sub.originalKey);if(entry){entry.name=replacement.name;entry.key=replacement.image;}}
      if(Array.isArray(sub.slotBackup)&&sub.slotBackup.length)state[d][e]=clone(sub.slotBackup).map(s=>({...s,done:false}));delete c.substitutions[slot];
    }
  }

  function recalcProgress(){
    progress.sessions=progress.history.length;progress.volume=Math.round(progress.history.reduce((sum,h)=>sum+(Number(h.volume)||0),0)*100)/100;
    const allDetailed=progress.history.every(h=>Array.isArray(h.exercises));const records=allDetailed?{}:{...progress.records};
    for(const h of progress.history)for(const ex of h.exercises||[])for(const s of ex.sets||[]){const kg=Number(s.kg)||0;if(kg>(records[ex.name]||0))records[ex.name]=kg;}progress.records=records;
  }
  function decorateHistory(){
    const items=[...document.querySelectorAll('#history .historyItem')];items.forEach((item,i)=>{if(item.querySelector('.v23EditHistory'))return;const b=document.createElement('button');b.className='optionAction v23EditHistory';b.textContent='Editar sesión';b.onclick=()=>editHistorySession(i);item.querySelector('div:last-child')?.appendChild(b);});
    const undo=$id('v23Undo');if(undo)undo.hidden=!cfg().lastDeletedSession;
  }
  function editHistorySession(index){
    const session=progress.history[index];if(!session)return;const draft=clone(session);const panel=panelDialog('Editar sesión');const date=sessionDate(draft)||new Date();const dateField=field('Fecha','date',isoLocal(date));dateField.querySelector('input').id='v23HistDate';insertBeforeClose(panel,dateField);const dur=field('Duración (minutos)','number',Math.round((session.duration||0)/60),'min="0" max="600" step="1"');dur.querySelector('input').id='v23HistDuration';insertBeforeClose(panel,dur);
    (draft.exercises||[]).forEach((ex,ei)=>{const box=document.createElement('div');box.className='v23Measure';const h=document.createElement('strong');h.textContent=ex.name;box.appendChild(h);(ex.sets||[]).forEach((s,si)=>{const row=document.createElement('div');row.className='v23SetEdit';row.innerHTML=`<span>${si+1}</span><input aria-label="kg" type="number" step="0.5" min="0" value="${s.kg}"><input aria-label="repeticiones" type="number" min="0" value="${s.reps}"><input aria-label="RIR" type="number" min="0" max="10" value="${s.rir}">`;const inputs=row.querySelectorAll('input');inputs[0].onchange=()=>s.kg=Math.max(0,Number(inputs[0].value)||0);inputs[1].onchange=()=>s.reps=Math.max(0,Math.round(Number(inputs[1].value)||0));inputs[2].onchange=()=>s.rir=Math.max(0,Math.min(10,Math.round(Number(inputs[2].value)||0)));box.appendChild(row);});insertBeforeClose(panel,box);});
    insertBeforeClose(panel,action('Guardar cambios',()=>{const iso=$id('v23HistDate').value;if(!iso){toast('Elige una fecha');return}const d=formatDateInput(iso),mins=Math.max(0,Math.min(600,Number($id('v23HistDuration').value)||0));draft.timestamp=d.getTime();draft.date=d.toLocaleDateString('es-ES');draft.duration=Math.round(mins*60);if(Array.isArray(draft.exercises)){draft.sets=draft.exercises.reduce((n,e)=>n+(e.sets?.length||0),0);draft.volume=draft.exercises.reduce((v,e)=>v+(e.sets||[]).reduce((x,s)=>x+(Number(s.kg)||0)*(Number(s.reps)||0),0),0);}progress.history[index]=draft;recalcProgress();markDirty('Historial actualizado');panel.parentElement.remove();renderProgress();}));
    insertBeforeClose(panel,action('Eliminar sesión',()=>{if(!confirm('¿Eliminar esta sesión del historial? Podrás deshacer la última eliminación.'))return;cfg().lastDeletedSession={session:clone(session),index,deletedAt:Date.now()};progress.history.splice(index,1);recalcProgress();markDirty('Sesión eliminada');panel.parentElement.remove();renderProgress();},'v23Danger'));
  }
  function undoDeletedSession(){const item=cfg().lastDeletedSession;if(!item?.session)return;const at=Math.max(0,Math.min(progress.history.length,Number(item.index)||0));progress.history.splice(at,0,clone(item.session));cfg().lastDeletedSession=null;recalcProgress();markDirty('Sesión restaurada');renderProgress();}

  function exportCsv(){
    const head=['tipo','fecha','sesion','duracion_min','ejercicio','serie','kg','reps','rir','volumen_sesion','peso_kg','cintura_cm','pecho_cm','brazo_cm','muslo_cm','grasa_pct'];const rows=[head];
    progress.history.forEach(h=>{const date=sessionDate(h);const iso=date?isoLocal(date):h.date;if(h.exercises?.length){h.exercises.forEach(ex=>(ex.sets||[]).forEach((s,i)=>rows.push(['entrenamiento',iso,h.title,Math.round((h.duration||0)/60),ex.name,i+1,s.kg,s.reps,s.rir,h.volume,'','','','','',''])));}else rows.push(['entrenamiento',iso,h.title,Math.round((h.duration||0)/60),'','','','','',h.volume,'','','','','','']);});
    cfg().measurements.forEach(m=>rows.push(['medida',m.date,'','','','','','','','',m.weight??'',m.waist??'',m.chest??'',m.arm??'',m.thigh??'',m.bodyFat??'']));downloadText('VFIT-PRO-datos.csv',rows.map(r=>r.map(escCsv).join(';')).join('\r\n'),'text/csv;charset=utf-8');
  }

  function backupKey(){const uid=bridge.getUid();return uid?`vfit-account-backups:${uid}`:null;}
  function readBackups(){const key=backupKey();if(!key)return[];try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[];}catch{return[];}}
  function writeBackups(list){const key=backupKey();if(!key)return false;try{localStorage.setItem(key,JSON.stringify(list.slice(0,5)));return true;}catch{toast('No hay espacio suficiente para guardar la copia local');return false;}}
  function createBackup(){if(!bridge.getUid()){toast('Entra en tu cuenta primero');return}const list=readBackups();list.unshift({id:String(Date.now()),createdAt:Date.now(),data:bridge.snapshot()});if(writeBackups(list)){toast('Copia creada');renderBackups();}}
  function renderBackups(){const body=$id('v23BackupList');if(!body)return;body.replaceChildren();const list=readBackups();if(!list.length){const p=document.createElement('p');p.textContent='Todavía no hay copias locales.';p.style.color='var(--muted)';body.appendChild(p);return}list.forEach((b,i)=>{const box=document.createElement('div');box.className='v23Backup';const strong=document.createElement('strong');strong.textContent=new Date(b.createdAt).toLocaleString('es-ES');const small=document.createElement('small');small.textContent=`${b.data?.progress?.sessions||0} sesiones guardadas`;box.append(strong,small,action('Restaurar esta copia',()=>restoreBackup(i)),action('Eliminar copia',()=>{const all=readBackups();all.splice(i,1);writeBackups(all);renderBackups();},'v23Danger'));body.appendChild(box);});}
  function restoreBackup(index){const b=readBackups()[index];if(!b?.data)return;if(!confirm('¿Restaurar esta copia? La versión actual se reemplazará y se sincronizará con tu cuenta.'))return;bridge.restore(b.data);toast('Copia restaurada');setTimeout(()=>{renderV23();show('profile');},0);}

  function renderV23(){if(!$id('v23Weekly'))return;renderWeekly();renderCalendar();renderMeasurements();renderEquipment();renderBackups();decorateHistory();renderSubstitutionPanel();}

  const baseRenderProgress=renderProgress;
  renderProgress=function(){baseRenderProgress();if($id('v23Weekly')){renderWeekly();renderCalendar();renderMeasurements();decorateHistory();}};
  const baseOpenExercise=openExercise;
  openExercise=function(j){baseOpenExercise(j);decorateExerciseForSub();};
  const baseOpenRegisterV23=openRegister;
  openRegister=function(){baseOpenRegisterV23();const replacement=subExercise();if(replacement&&$id('register').classList.contains('active')){$id('regTitle').textContent=replacement.name+' · sustitución de hoy';$id('progression-register')?.remove();renderSubLastExercise();}};
  const baseRenderSetsV23=renderSets;
  renderSets=function(){baseRenderSetsV23();if(subExercise())renderSubLastExercise();};
  const baseFinishDayV23=finishDay;
  finishDay=function(){const day=activeDay,before=progress.sessions,recordsBefore={...progress.records};baseFinishDayV23();if(progress.sessions>before){finalizeSubstitutions(day,progress.history[0]);progress.records=recordsBefore;recalcProgress();markDirty();persist();renderProgress();}};
  const baseDiscardV23=discardWorkout;
  discardWorkout=function(){const before=currentWorkout,day=before?.day;const slots=day===undefined?[]:Object.keys(cfg().substitutions).filter(x=>Number(x.split(':')[0])===day);baseDiscardV23();if(before&&currentWorkout===null){for(const slot of slots)restoreSubSlot(slot,false);if(slots.length){markDirty();persist();renderV23();}}};
  const baseShowV23=show;
  show=function(id){baseShowV23(id);if(id==='progress'||id==='profile')renderV23();};

  buildUi();
})();
