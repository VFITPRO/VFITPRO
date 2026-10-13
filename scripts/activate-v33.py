from pathlib import Path

# Load V33 after V32. No schema change: it derives from existing profile.v23.measurements.
p=Path('overrides/index.html')
s=p.read_text();old='<script src="v32.js?v=32"></script>\n<noscript>';new='<script src="v32.js?v=32"></script>\n<script src="v33.js?v=33"></script>\n<noscript>'
if old not in s: raise SystemExit('V33 script insertion target not found')
p.write_text(s.replace(old,new,1))

# Offline cache revision.
p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v32';" not in s: raise SystemExit('cache V32 target not found')
s=s.replace("const CACHE = 'vfit-pro-v32';","const CACHE = 'vfit-pro-v33';",1)
old="'./accounts.css?v=23', './accounts.js?v=32', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=32', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './v33.js?v=33', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V33 target not found')
p.write_text(s.replace(old,new,1))

# Earlier UI test accepts later visible version labels.
p=Path('scripts/test-v32.cjs');s=p.read_text();old="assert.equal(el('profile').lastElementChild.querySelector('h3').textContent,'Versión Premium V32');";new="assert(Number(el('profile').lastElementChild.querySelector('h3').textContent.match(/V(\\d+)/)?.[1])>=32);"
if old not in s: raise SystemExit('V32 version assertion target not found')
p.write_text(s.replace(old,new,1))
