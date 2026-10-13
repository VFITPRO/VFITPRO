from pathlib import Path

# Load V30 after live workout mode. No account schema change: V30 is derived from saved history.
p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v29.js?v=29"></script>\n<noscript>'
new='<script src="v29.js?v=29"></script>\n<script src="v30.js?v=30"></script>\n<noscript>'
if old not in s: raise SystemExit('V30 script insertion target not found')
p.write_text(s.replace(old,new,1))

# Offline cache revision.
p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v29';" not in s: raise SystemExit('cache V29 target not found')
s=s.replace("const CACHE = 'vfit-pro-v29';","const CACHE = 'vfit-pro-v30';",1)
old="'./accounts.css?v=23', './accounts.js?v=29', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=29', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V30 target not found')
p.write_text(s.replace(old,new,1))

# Version-label assertions in earlier tests should permit later UI layers.
p=Path('scripts/test-v29.cjs')
s=p.read_text()
old="assert.equal(el('profile').lastElementChild.querySelector('h3').textContent,'Versión Premium V29');"
new="assert(Number(el('profile').lastElementChild.querySelector('h3').textContent.match(/V(\\d+)/)?.[1])>=29);"
if old not in s: raise SystemExit('V29 version regression target not found')
p.write_text(s.replace(old,new,1))
