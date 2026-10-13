from pathlib import Path

# Persist an active rest countdown inside the recoverable workout snapshot.
p=Path('overrides/index.html')
s=p.read_text()
old="return {day:w.day,exercise:w.exercise,elapsed:Math.max(0,Number(w.elapsed)||0),runningSince:Number.isFinite(w.runningSince)&&w.runningSince>0?w.runningSince:null,...(cleanAdaptation(w.adaptation,w.day)?{adaptation:cleanAdaptation(w.adaptation,w.day)}:{})};"
new="return {day:w.day,exercise:w.exercise,elapsed:Math.max(0,Number(w.elapsed)||0),runningSince:Number.isFinite(w.runningSince)&&w.runningSince>0?w.runningSince:null,...(Number.isFinite(Number(w.restDeadline))&&Number(w.restDeadline)>Date.now()?{restDeadline:Number(w.restDeadline),restDuration:Math.max(1,Math.min(600,Number(w.restDuration)||90))}:{}),...(cleanAdaptation(w.adaptation,w.day)?{adaptation:cleanAdaptation(w.adaptation,w.day)}:{})};"
if old not in s: raise SystemExit('safeWorkout V29 target not found')
s=s.replace(old,new,1)
if '<script src="accounts.js?v=28"></script>' not in s: raise SystemExit('accounts V28 target not found')
s=s.replace('<script src="accounts.js?v=28"></script>','<script src="accounts.js?v=29"></script>',1)
old='<script src="v28.js?v=28"></script>\n<noscript>'
new='<script src="v28.js?v=28"></script>\n<script src="v29.js?v=29"></script>\n<noscript>'
if old not in s: raise SystemExit('V29 script insertion target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Snapshot schema advances because currentWorkout now persists restDeadline/restDuration.
p=Path('overrides/accounts.js')
s=p.read_text()
if 'schemaVersion:7' not in s: raise SystemExit('schema V7 target not found')
s=s.replace('schemaVersion:7','schemaVersion:8',1)
p.write_text(s)

# Offline package.
p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v28';" not in s: raise SystemExit('cache V28 target not found')
s=s.replace("const CACHE = 'vfit-pro-v28';","const CACHE = 'vfit-pro-v29';",1)
old="'./accounts.css?v=23', './accounts.js?v=28', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=29', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V29 target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Earlier integration suites accept newer snapshot revisions while preserving their data checks.
p=Path('scripts/test-v28.cjs')
s=p.read_text()
old="assert.equal(row.data.schemaVersion,7);"
new="assert(row.data.schemaVersion>=7);"
if old not in s: raise SystemExit('V28 schema regression target not found')
p.write_text(s.replace(old,new,1))
