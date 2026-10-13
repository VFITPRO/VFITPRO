from pathlib import Path

p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v38.js?v=38"></script>\n<noscript>'
new='<script src="v38.js?v=38"></script>\n<script src="v39.js?v=39"></script>\n<noscript>'
if old not in s: raise SystemExit('V39 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v38';" not in s: raise SystemExit('cache V38 target not found')
s=s.replace("const CACHE = 'vfit-pro-v38';","const CACHE = 'vfit-pro-v39';",1)
old="'./accounts.css?v=23', './accounts.js?v=32', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './v33.js?v=33', './v34.js?v=34', './v35.js?v=35', './v36.js?v=36', './v37.js?v=37', './v38.js?v=38', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=32', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './v33.js?v=33', './v34.js?v=34', './v35.js?v=35', './v36.js?v=36', './v37.js?v=37', './v38.js?v=38', './v39.js?v=39', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V39 target not found')
p.write_text(s.replace(old,new,1))
