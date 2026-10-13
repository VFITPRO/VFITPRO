/* VFIT PRO V24: exercise analytics, estimated 1RM, PRs, previous-session comparison and history filters. */
(() => {
  'use strict';
  if (!window.VFITAccountBridge) return;
  const $id = id => document.getElementById(id);
  let selectedExercise = '';
  let selectedMetric = 'e1rm';
  let historyExercise = 'all';
  let historyRange = 'all';

  function sessionDate(session) {
    if (Number(session?.timestamp) > 0) {
      const d = new Date(Number(session.timestamp));
      if (!Number.isNaN(d.getTime())) return d;
    }
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(session?.date || ''));
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12) : null;
  }
  function estimated1RM(set) {
    const kg = Math.max(0, Number(set?.kg) || 0), reps = Math.max(0, Math.round(Number(set?.reps) || 0));
    if (!kg || !reps) return 0;
    return kg * (1 + Math.min(reps, 30) / 30);
  }
  function metrics(exercise) {
    const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];
    let maxKg = 0, e1rm = 0, volume = 0, reps = 0;
    for (const set of sets) {
      const kg = Math.max(0, Number(set?.kg) || 0), r = Math.max(0, Math.round(Number(set?.reps) || 0));
      maxKg = Math.max(maxKg, kg); e1rm = Math.max(e1rm, estimated1RM(set)); volume += kg * r; reps += r;
    }
    return {maxKg, e1rm, volume, reps, sets:sets.length};
  }
  function exerciseMap() {
    const map = new Map();
    for (const day of routines) for (const ex of day.ex) if (ex?.image) map.set(ex.image, ex.name || 'Ejercicio');
    for (const session of progress.history) for (const ex of session.exercises || []) if (ex?.key) map.set(ex.key, ex.name || map.get(ex.key) || 'Ejercicio');
    return map;
  }
  function occurrences(key) {
    return progress.history.map((session,index) => {
      const exercise = (session.exercises || []).find(ex => ex.key === key);
      if (!exercise) return null;
      const date = sessionDate(session);
      return {session,index,exercise,date,time:date?.getTime() || Number(session.timestamp) || 0,m:metrics(exercise)};
    }).filter(Boolean).sort((a,b) => b.time - a.time || a.index - b.index);
  }
  function n(value, digits=1) {
    const num = Number(value) || 0;
    return num.toLocaleString('es-ES',{maximumFractionDigits:digits,minimumFractionDigits:0});
  }
  function signed(value, suffix='') {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    if (Math.abs(rounded) < 0.05) return '0' + suffix;
    return (rounded > 0 ? '+' : '') + n(rounded) + suffix;
  }
  function create(tag, cls='', text='') {
    const el = document.createElement(tag); if (cls) el.className = cls; if (text !== '') el.textContent = text; return el;
  }
  function addStat(parent, value, label) {
    const box=create('div','v24Stat'), strong=create('b','',value), small=create('small','',label);box.append(strong,small);parent.appendChild(box);
  }
  function injectStyles() {
    if ($id('v24Styles')) return;
    const style=create('style');style.id='v24Styles';style.textContent=`
      .v24Controls{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.v24Controls label{font-size:10px;color:var(--muted);font-weight:800}.v24Controls select{width:100%;margin-top:5px;padding:10px;border:1px solid var(--line2);border-radius:10px;background:#08111b;color:#fff}.v24Stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v24Stat{border:1px solid var(--line2);background:#0d1722;border-radius:14px;padding:11px}.v24Stat b{display:block;font-size:18px}.v24Stat small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.v24Compare{margin:10px 0 0;padding:10px;border:1px solid var(--line);border-radius:12px;background:#081018;font-size:12px;line-height:1.5}.v24Badges{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.v24Badge{display:inline-flex;padding:5px 8px;border-radius:999px;border:1px solid #8e5516;background:#1a1209;color:#ffb65c;font-size:10px;font-weight:900}.v24Trend{display:flex;align-items:end;gap:6px;height:132px;margin-top:12px;padding-top:8px;border-top:1px solid var(--line)}.v24TrendCol{flex:1;min-width:0;text-align:center}.v24TrendBar{min-height:4px;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--orange2),var(--orange))}.v24TrendCol small{display:block;color:var(--muted);font-size:8px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v24SummaryRow{border-top:1px solid var(--line);padding:9px 0;font-size:12px;line-height:1.45}.v24SummaryRow:first-of-type{border-top:0}.v24SummaryRow b{display:block}.v24SummaryRow span{color:var(--muted)}.v24FilterCount{font-size:11px;color:var(--muted);margin-top:7px}@media(max-width:380px){.v24Controls{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }
  function panel(id,title) {
    const p=create('div','panel');p.id=id;p.appendChild(create('h2','',title));return p;
  }
  function insertPanels() {
    if ($id('v24Analytics')) return;
    injectStyles();
    const progressScreen=$id('progress'); if (!progressScreen) return;
    const anchor=$id('v23Weekly') || progressScreen.querySelector('.panel');
    const summary=panel('v24Summary','Resumen de tu última sesión');summary.appendChild(create('div','','Sin sesiones detalladas todavía.'));progressScreen.insertBefore(summary,anchor);
    const analytics=panel('v24Analytics','Progreso por ejercicio');analytics.appendChild(create('div','','Guarda una sesión para empezar a ver tendencias.'));progressScreen.insertBefore(analytics,anchor);
    const historyPanel=$id('history')?.closest('.panel');
    if (historyPanel) {
      const filters=panel('v24HistoryFilters','Filtrar historial');filters.appendChild(create('div','','Puedes filtrar por ejercicio y periodo.'));progressScreen.insertBefore(filters,historyPanel);
    }
    updateVersion();
  }
  function updateVersion() {
    const version=$id('profile')?.lastElementChild;
    if (!version) return;
    const h=version.querySelector('h3'), p=version.querySelector('p');
    if (h) h.textContent='Versión Premium V24';
    if (p) p.textContent='Analítica por ejercicio, 1RM estimado, récords, comparación entre sesiones, filtros de historial y todas las funciones de V23.';
  }
  function bestOf(list,key) { return Math.max(0,...list.map(x => Number(x.m?.[key]) || 0)); }
  function metricLabel(metric) { return metric==='maxKg'?'Carga máxima':metric==='volume'?'Volumen':'1RM estimado'; }
  function metricValue(item,metric) { return Number(item?.m?.[metric]) || 0; }

  function renderSummary() {
    const host=$id('v24Summary'); if (!host) return;
    const title=host.querySelector('h2');host.replaceChildren(title);
    const latest=progress.history.find(h => Array.isArray(h.exercises) && h.exercises.length);
    if (!latest) {host.appendChild(create('p','','Cuando guardes una sesión, aquí verás qué mejoró respecto a tus registros anteriores.'));return;}
    const sub=create('p');const date=sessionDate(latest);sub.textContent=(latest.title || 'Última sesión')+(date?' · '+date.toLocaleDateString('es-ES'):'');sub.style.color='var(--muted)';host.appendChild(sub);
    const latestIndex=progress.history.indexOf(latest);
    for (const ex of (latest.exercises || []).slice(0,6)) {
      const current=metrics(ex), prior=progress.history.slice(latestIndex+1).flatMap(h => h.exercises || []).filter(x => x.key===ex.key).map(metrics);
      const row=create('div','v24SummaryRow'), name=create('b','',ex.name || 'Ejercicio'), detail=create('span');row.append(name,detail);
      if (!prior.length) detail.textContent=`Primer registro · ${n(current.maxKg)} kg máx. · ${n(current.e1rm)} kg 1RM est.`;
      else {
        const priorBest={maxKg:Math.max(...prior.map(x=>x.maxKg)),e1rm:Math.max(...prior.map(x=>x.e1rm)),volume:Math.max(...prior.map(x=>x.volume))};
        const prs=[];if(current.maxKg>priorBest.maxKg+0.001)prs.push('PR carga');if(current.e1rm>priorBest.e1rm+0.05)prs.push('PR 1RM est.');if(current.volume>priorBest.volume+0.5)prs.push('PR volumen');
        const previous=prior[0], changes=[];if(Math.abs(current.maxKg-previous.maxKg)>0.001)changes.push(`${signed(current.maxKg-previous.maxKg,' kg')} carga`);if(Math.abs(current.volume-previous.volume)>0.5)changes.push(`${signed(current.volume-previous.volume,' kg')} volumen`);
        detail.textContent=(prs.length?prs.join(' · '):'Sin nuevo récord')+(changes.length?' · vs. anterior: '+changes.join(', '):' · marcas estables vs. anterior');
      }
      host.appendChild(row);
    }
  }

  function renderAnalytics() {
    const host=$id('v24Analytics');if(!host)return;const title=host.querySelector('h2');host.replaceChildren(title);
    const map=exerciseMap(), withHistory=[...map.entries()].filter(([key])=>occurrences(key).length).sort((a,b)=>a[1].localeCompare(b[1],'es'));
    if (!withHistory.length) {host.appendChild(create('p','','Todavía no hay ejercicios con historial detallado. Guarda una sesión para activar esta sección.'));return;}
    if (!selectedExercise || !withHistory.some(([key])=>key===selectedExercise)) selectedExercise=withHistory[0][0];
    const controls=create('div','v24Controls');
    const exLabel=create('label','','Ejercicio'),exSelect=create('select');exSelect.id='v24ExerciseSelect';
    for(const [key,name] of withHistory){const o=create('option','',name);o.value=key;o.selected=key===selectedExercise;exSelect.appendChild(o);}exLabel.appendChild(exSelect);
    const metricLabelEl=create('label','','Gráfica'),metricSelect=create('select');metricSelect.id='v24MetricSelect';
    for(const key of ['e1rm','maxKg','volume']){const o=create('option','',metricLabel(key));o.value=key;o.selected=key===selectedMetric;metricSelect.appendChild(o);}metricLabelEl.appendChild(metricSelect);controls.append(exLabel,metricLabelEl);host.appendChild(controls);
    exSelect.onchange=()=>{selectedExercise=exSelect.value;renderAnalytics();};metricSelect.onchange=()=>{selectedMetric=metricSelect.value;renderAnalytics();};
    const list=occurrences(selectedExercise),latest=list[0],previous=list[1],all=list.map(x=>x.m);
    const stats=create('div','v24Stats');addStat(stats,n(bestOf(list,'maxKg'))+' kg','mejor carga');addStat(stats,n(bestOf(list,'e1rm'))+' kg','mejor 1RM estimado');addStat(stats,n(bestOf(list,'volume'),0)+' kg','mejor volumen de sesión');addStat(stats,String(list.length),list.length===1?'sesión registrada':'sesiones registradas');host.appendChild(stats);
    const badges=create('div','v24Badges');
    if(list.length===1)badges.appendChild(create('span','v24Badge','PR INICIAL'));
    else {const older=list.slice(1);if(latest.m.maxKg>bestOf(older,'maxKg')+0.001)badges.appendChild(create('span','v24Badge','NUEVO PR · CARGA'));if(latest.m.e1rm>bestOf(older,'e1rm')+0.05)badges.appendChild(create('span','v24Badge','NUEVO PR · 1RM'));if(latest.m.volume>bestOf(older,'volume')+0.5)badges.appendChild(create('span','v24Badge','NUEVO PR · VOLUMEN'));}
    if(badges.childElementCount)host.appendChild(badges);
    const compare=create('div','v24Compare');
    if(previous) compare.textContent=`Última vs. anterior: ${signed(latest.m.maxKg-previous.m.maxKg,' kg')} en carga máxima · ${signed(latest.m.e1rm-previous.m.e1rm,' kg')} en 1RM estimado · ${signed(latest.m.volume-previous.m.volume,' kg')} en volumen.`;
    else compare.textContent='Este es tu primer registro detallado de este ejercicio.';host.appendChild(compare);
    const explanation=create('p','','1RM estimado usa la fórmula de Epley: peso × (1 + reps/30). Es una referencia de tendencia, no un levantamiento máximo medido.');explanation.style.cssText='color:var(--muted);font-size:11px;line-height:1.45';host.appendChild(explanation);
    const trend=create('div','v24Trend');trend.setAttribute('aria-label','Tendencia de '+metricLabel(selectedMetric));const points=list.slice(0,8).reverse(),max=Math.max(1,...points.map(x=>metricValue(x,selectedMetric)));
    for(const point of points){const col=create('div','v24TrendCol'),bar=create('div','v24TrendBar');bar.style.height=Math.max(4,Math.round(metricValue(point,selectedMetric)/max*96))+'px';bar.title=metricLabel(selectedMetric)+': '+n(metricValue(point,selectedMetric));const label=create('small','',point.date?point.date.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'}):'—');col.append(bar,label);trend.appendChild(col);}host.appendChild(trend);
  }

  function renderHistoryFilters() {
    const host=$id('v24HistoryFilters');if(!host)return;const title=host.querySelector('h2');host.replaceChildren(title);
    const controls=create('div','v24Controls');const exLabel=create('label','','Ejercicio'),exSelect=create('select');exSelect.id='v24HistoryExercise';
    let option=create('option','','Todos los ejercicios');option.value='all';exSelect.appendChild(option);
    for(const [key,name] of [...exerciseMap().entries()].filter(([key])=>progress.history.some(h=>(h.exercises||[]).some(ex=>ex.key===key))).sort((a,b)=>a[1].localeCompare(b[1],'es'))){option=create('option','',name);option.value=key;option.selected=historyExercise===key;exSelect.appendChild(option);}exSelect.value=[...exSelect.options].some(o=>o.value===historyExercise)?historyExercise:'all';historyExercise=exSelect.value;exLabel.appendChild(exSelect);
    const rangeLabel=create('label','','Periodo'),rangeSelect=create('select');rangeSelect.id='v24HistoryRange';for(const [value,label] of [['all','Todo'],['30','Últimos 30 días'],['90','Últimos 90 días'],['365','Último año']]){option=create('option','',label);option.value=value;option.selected=historyRange===value;rangeSelect.appendChild(option);}rangeLabel.appendChild(rangeSelect);controls.append(exLabel,rangeLabel);host.appendChild(controls);
    const count=create('div','v24FilterCount');count.id='v24FilterCount';host.appendChild(count);exSelect.onchange=()=>{historyExercise=exSelect.value;applyHistoryFilter();};rangeSelect.onchange=()=>{historyRange=rangeSelect.value;applyHistoryFilter();};
  }
  function applyHistoryFilter() {
    const items=[...document.querySelectorAll('#history .historyItem')];let visible=0;const now=Date.now(),days=historyRange==='all'?null:Number(historyRange);
    items.forEach((item,index)=>{const session=progress.history[index];let ok=Boolean(session);if(ok&&historyExercise!=='all')ok=(session.exercises||[]).some(ex=>ex.key===historyExercise);if(ok&&days){const d=sessionDate(session);ok=Boolean(d)&&d.getTime()>=now-days*86400000;}item.hidden=!ok;if(ok)visible++;});
    const count=$id('v24FilterCount');if(count)count.textContent=`${visible} ${visible===1?'sesión visible':'sesiones visibles'} de ${progress.history.length}.`;
  }
  function renderV24(){renderSummary();renderAnalytics();renderHistoryFilters();applyHistoryFilter();updateVersion();}

  const baseRenderProgressV24=renderProgress;
  renderProgress=function(){baseRenderProgressV24();if($id('v24Analytics'))renderV24();};
  insertPanels();renderV24();
})();
