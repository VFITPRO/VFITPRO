from pathlib import Path

# Core history: preserve set type and show it in detailed session view.
p=Path('overrides/index.html')
s=p.read_text()
old="sets:Array.isArray(ex.sets)?ex.sets.slice(0,20).map(s=>({kg:num(s.kg),reps:num(s.reps),rir:num(s.rir),done:true,note:String(s.note||'').slice(0,4000)})):[],"
new="sets:Array.isArray(ex.sets)?ex.sets.slice(0,20).map(s=>({kg:num(s.kg),reps:num(s.reps),rir:num(s.rir),done:true,note:String(s.note||'').slice(0,4000),type:s.type==='drop'?'drop':s.type==='failure'?'failure':'normal'})):[],"
if old not in s: raise SystemExit('safeHistoryDetails set target not found')
s=s.replace(old,new,1)
old="const line=document.createElement('p');line.textContent=`Serie ${i+1}: ${s.kg} kg × ${s.reps} rep · RIR ${s.rir}`;"
new="const line=document.createElement('p');const technique=s.type==='drop'?' · DROP SET':s.type==='failure'?' · AL FALLO':'';line.textContent=`Serie ${i+1}: ${s.kg} kg × ${s.reps} rep · RIR ${s.rir}`+technique;"
if old not in s: raise SystemExit('session detail type target not found')
s=s.replace(old,new,1)
if '<script src="accounts.js?v=27"></script>' not in s: raise SystemExit('accounts V27 target not found')
s=s.replace('<script src="accounts.js?v=27"></script>','<script src="accounts.js?v=28"></script>',1)
old='<script src="v27.js?v=27"></script>\n<noscript>'
new='<script src="v27.js?v=27"></script>\n<script src="v28.js?v=28"></script>\n<noscript>'
if old not in s: raise SystemExit('V28 insertion target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Account sanitizer: preserve types in active state and V28 preferences.
p=Path('overrides/accounts.js')
s=p.read_text()
if 'schemaVersion:6' not in s: raise SystemExit('schema V6 target not found')
s=s.replace('schemaVersion:6','schemaVersion:7',1)
old="saved.slice(0,20).map(s => ({kg:num(s.kg), reps:num(s.reps), rir:num(s.rir), done:s.done === true, note:typeof s.note === 'string' ? s.note.slice(0,4000) : ''}))"
new="saved.slice(0,20).map(s => ({kg:num(s.kg), reps:num(s.reps), rir:num(s.rir), done:s.done === true, note:typeof s.note === 'string' ? s.note.slice(0,4000) : '', type:s.type==='drop'?'drop':s.type==='failure'?'failure':'normal'}))"
if old not in s: raise SystemExit('active state type target not found')
s=s.replace(old,new,1)
old="if (rawProfile.v27 && typeof rawProfile.v27 === 'object') profile.v27 = clone(rawProfile.v27);"
new=old+"\n    if (rawProfile.v28 && typeof rawProfile.v28 === 'object') profile.v28 = clone(rawProfile.v28);"
if old not in s: raise SystemExit('profile V28 target not found')
s=s.replace(old,new,1)
p.write_text(s)

# V23 substitutions also retain series technique metadata.
p=Path('overrides/v23.js')
s=p.read_text()
old="kg: Math.max(0, Number(s.kg)||0), reps: Math.max(0, Math.round(Number(s.reps)||0)), rir: Math.max(0, Math.min(10, Math.round(Number(s.rir)||0))), done:false, note:String(s.note||'').slice(0,4000)"
new=old+", type:s.type==='drop'?'drop':s.type==='failure'?'failure':'normal'"
if old not in s: raise SystemExit('V23 substitute load type target not found')
s=s.replace(old,new,1)
old="slotBackup:Array.isArray(sub.slotBackup)?sub.slotBackup.slice(0,20).map(s=>({kg:Math.max(0,Number(s.kg)||0),reps:Math.max(0,Math.round(Number(s.reps)||0)),rir:Math.max(0,Math.min(10,Math.round(Number(s.rir)||0))),done:s.done===true,note:String(s.note||'').slice(0,4000)})):[]"
new="slotBackup:Array.isArray(sub.slotBackup)?sub.slotBackup.slice(0,20).map(s=>({kg:Math.max(0,Number(s.kg)||0),reps:Math.max(0,Math.round(Number(s.reps)||0)),rir:Math.max(0,Math.min(10,Math.round(Number(s.rir)||0))),done:s.done===true,note:String(s.note||'').slice(0,4000),type:s.type==='drop'?'drop':s.type==='failure'?'failure':'normal'})):[]"
if old not in s: raise SystemExit('V23 slot backup type target not found')
s=s.replace(old,new,1)
old="saved[i]?{...saved[i],done:false}:{kg:0,reps:10,rir:2,done:false,note:''}"
new="saved[i]?{...saved[i],done:false,type:saved[i].type==='drop'?'drop':saved[i].type==='failure'?'failure':'normal'}:{kg:0,reps:10,rir:2,done:false,note:'',type:'normal'}"
if old not in s: raise SystemExit('V23 substitution fallback target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Offline package.
p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v27';" not in s: raise SystemExit('cache V27 target not found')
s=s.replace("const CACHE = 'vfit-pro-v27';","const CACHE = 'vfit-pro-v28';",1)
old="'./accounts.css?v=23', './accounts.js?v=27', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=28', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V28 target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Regression tests for earlier versions must accept later snapshot schema revisions.
p=Path('scripts/test-v27.cjs')
s=p.read_text()
old="assert.equal(row.data.schemaVersion,6);"
new="assert(row.data.schemaVersion>=6);"
if old not in s: raise SystemExit('V27 schema regression target not found')
p.write_text(s.replace(old,new,1))
