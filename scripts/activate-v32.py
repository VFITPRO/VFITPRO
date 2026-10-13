from pathlib import Path

# Preserve session-level RPE and notes in history sanitization.
p=Path('overrides/index.html')
s=p.read_text()
needle="return {duration:num(h.duration),"
insert="return {duration:num(h.duration),...(Number(h.sessionRpe)>=1&&Number(h.sessionRpe)<=10?{sessionRpe:Math.round(Number(h.sessionRpe))}:{}),...(String(h.sessionNote||'').trim()?{sessionNote:String(h.sessionNote).trim().slice(0,1000)}:{}),"
if needle not in s: raise SystemExit('V32 safeHistoryDetails target not found')
s=s.replace(needle,insert,1)
# Accounts changed in V31; force a fresh URL now as well as loading V32.
if '<script src="accounts.js?v=29"></script>' not in s: raise SystemExit('accounts cache-bust target not found')
s=s.replace('<script src="accounts.js?v=29"></script>','<script src="accounts.js?v=32"></script>',1)
old='<script src="v31.js?v=31"></script>\n<noscript>'
new='<script src="v31.js?v=31"></script>\n<script src="v32.js?v=32"></script>\n<noscript>'
if old not in s: raise SystemExit('V32 script insertion target not found')
p.write_text(s.replace(old,new,1))

# Extend editable history with session RPE and note.
p=Path('overrides/v23.js')
s=p.read_text()
needle="insertBeforeClose(panel,dur);"
addition="""insertBeforeClose(panel,dur);const rpe=field('RPE global de sesión (1–10)','number',draft.sessionRpe||'','min=\"1\" max=\"10\" step=\"1\"');rpe.querySelector('input').id='v32HistRpe';insertBeforeClose(panel,rpe);const sessionNote=document.createElement('label');sessionNote.className='v23Field';sessionNote.textContent='Nota de sesión';const sessionNoteInput=document.createElement('textarea');sessionNoteInput.id='v32HistNote';sessionNoteInput.maxLength=1000;sessionNoteInput.value=draft.sessionNote||'';sessionNoteInput.style.cssText='display:block;width:100%;min-height:74px;margin-top:5px;padding:10px;border:1px solid var(--line2);border-radius:10px;background:#08111b;color:#fff;font-size:15px;resize:vertical';sessionNote.appendChild(sessionNoteInput);insertBeforeClose(panel,sessionNote);"""
if needle not in s: raise SystemExit('V32 history fields insertion target not found')
s=s.replace(needle,addition,1)
needle="draft.duration=Math.round(mins*60);"
addition="""draft.duration=Math.round(mins*60);const sessionRpe=Math.round(Number($id('v32HistRpe')?.value)||0);if(sessionRpe>=1&&sessionRpe<=10)draft.sessionRpe=sessionRpe;else delete draft.sessionRpe;const sessionNoteValue=String($id('v32HistNote')?.value||'').trim().slice(0,1000);if(sessionNoteValue)draft.sessionNote=sessionNoteValue;else delete draft.sessionNote;"""
if needle not in s: raise SystemExit('V32 history save target not found')
s=s.replace(needle,addition,1)
p.write_text(s)

# Account snapshot schema changes because history has new session-level fields.
p=Path('overrides/accounts.js')
s=p.read_text()
if 'schemaVersion:8' not in s: raise SystemExit('schema V8 target not found')
s=s.replace('schemaVersion:8','schemaVersion:9',1)
p.write_text(s)

# Offline package: fresh accounts.js URL fixes the stale-query risk found during V31 audit.
p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v31';" not in s: raise SystemExit('cache V31 target not found')
s=s.replace("const CACHE = 'vfit-pro-v31';","const CACHE = 'vfit-pro-v32';",1)
old="'./accounts.css?v=23', './accounts.js?v=29', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=32', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V32 target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Earlier schema assertions accept later compatible revisions.
for name in ['scripts/test-v29.cjs','scripts/test-v30.cjs']:
    p=Path(name);s=p.read_text();old="assert.equal(row.data.schemaVersion,8);";new="assert(row.data.schemaVersion>=8);"
    if old not in s: raise SystemExit(f'{name} schema assertion target not found')
    p.write_text(s.replace(old,new,1))

# V31 UI label assertion accepts later layers.
p=Path('scripts/test-v31.cjs');s=p.read_text();old="assert.equal(el('profile').lastElementChild.querySelector('h3').textContent,'Versión Premium V31');";new="assert(Number(el('profile').lastElementChild.querySelector('h3').textContent.match(/V(\\d+)/)?.[1])>=31);"
if old not in s: raise SystemExit('V31 version assertion target not found')
p.write_text(s.replace(old,new,1))
