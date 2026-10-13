from pathlib import Path

# Fix barbell rounding so the warm-up planner respects the user's real smallest plate.
p=Path('overrides/v36.js')
s=p.read_text()
old='small=Math.min(...plates,1.25),step=Math.max(.5,small*2);'
new='small=plates.length?Math.min(...plates):1.25,step=Math.max(.5,small*2);'
if old not in s: raise SystemExit('V36 plate rounding target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v35.js?v=35"></script>\n<noscript>'
new='<script src="v35.js?v=35"></script>\n<script src="v36.js?v=36"></script>\n<noscript>'
if old not in s: raise SystemExit('V36 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v35';" not in s: raise SystemExit('cache V35 target not found')
s=s.replace("const CACHE = 'vfit-pro-v35';","const CACHE = 'vfit-pro-v36';",1)
old="'./accounts.css?v=23', './accounts.js?v=32', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './v33.js?v=33', './v34.js?v=34', './v35.js?v=35', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=32', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './v32.js?v=32', './v33.js?v=33', './v34.js?v=34', './v35.js?v=35', './v36.js?v=36', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V36 target not found')
p.write_text(s.replace(old,new,1))
