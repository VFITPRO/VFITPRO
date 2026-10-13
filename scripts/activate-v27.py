from pathlib import Path

# Fix V27 pre-QA edge cases: RIR 0 must stay 0 and fresh accounts initialize on first Home.
p=Path('overrides/v27.js')
s=p.read_text()
old="out.defaultRir=Math.max(0,Math.min(10,Math.round(Number(raw.defaultRir)||2)));"
new="const rir=Number(raw.defaultRir);out.defaultRir=Math.max(0,Math.min(10,Math.round(Number.isFinite(rir)?rir:2)));"
if old not in s:
    raise SystemExit('V27 RIR target not found')
s=s.replace(old,new,1)
old="show=function(id){baseShow(id);if(id==='profile'){bindSettings();renderInstallState();updateVersion();}if(id==='progress')renderMuscles();if(id==='register')renderExerciseRestHint();};"
new="show=function(id){cfg();baseShow(id);if(id==='profile'){bindSettings();renderInstallState();updateVersion();}if(id==='progress')renderMuscles();if(id==='register')renderExerciseRestHint();};"
if old not in s:
    raise SystemExit('V27 fresh-account show target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Load V27 after all prior compatibility layers.
p=Path('overrides/index.html')
s=p.read_text()
if '<script src="accounts.js?v=26"></script>' not in s:
    raise SystemExit('accounts V26 script target not found')
s=s.replace('<script src="accounts.js?v=26"></script>','<script src="accounts.js?v=27"></script>',1)
old='<script src="v26.js?v=26"></script>\n<noscript>'
new='<script src="v26.js?v=26"></script>\n<script src="v27.js?v=27"></script>\n<noscript>'
if old not in s:
    raise SystemExit('V27 script insertion target not found')
p.write_text(s.replace(old,new,1))

# Preserve V27 settings per account and advance snapshot schema.
p=Path('overrides/accounts.js')
s=p.read_text()
if 'schemaVersion:5' not in s:
    raise SystemExit('account schema V5 target not found')
s=s.replace('schemaVersion:5','schemaVersion:6',1)
old="if (rawProfile.v26 && typeof rawProfile.v26 === 'object') profile.v26 = clone(rawProfile.v26);"
new=old+"\n    if (rawProfile.v27 && typeof rawProfile.v27 === 'object') profile.v27 = clone(rawProfile.v27);"
if old not in s:
    raise SystemExit('profile V27 target not found')
p.write_text(s.replace(old,new,1))

# Offline package and cache busting.
p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v26';" not in s:
    raise SystemExit('cache V26 target not found')
s=s.replace("const CACHE = 'vfit-pro-v26';","const CACHE = 'vfit-pro-v27';",1)
old="'./accounts.css?v=23', './accounts.js?v=26', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=27', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './assets/custom-exercise.svg',"
if old not in s:
    raise SystemExit('service worker V27 asset target not found')
p.write_text(s.replace(old,new,1))
