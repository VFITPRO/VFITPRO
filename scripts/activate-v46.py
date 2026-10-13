from pathlib import Path

p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v45.js?v=45"></script>\n<noscript>'
new='<script src="v45.js?v=45"></script>\n<script src="v46.js?v=46"></script>\n<noscript>'
if old not in s: raise SystemExit('V46 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v45';" not in s: raise SystemExit('cache V45 target not found')
s=s.replace("const CACHE = 'vfit-pro-v45';","const CACHE = 'vfit-pro-v46';",1)
old="'./v44.js?v=44', './v45.js?v=45', './assets/custom-exercise.svg',"
new="'./v44.js?v=44', './v45.js?v=45', './v46.js?v=46', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V46 target not found')
p.write_text(s.replace(old,new,1))
