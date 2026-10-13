from pathlib import Path

p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v44.js?v=44"></script>\n<noscript>'
new='<script src="v44.js?v=44"></script>\n<script src="v45.js?v=45"></script>\n<noscript>'
if old not in s: raise SystemExit('V45 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v44';" not in s: raise SystemExit('cache V44 target not found')
s=s.replace("const CACHE = 'vfit-pro-v44';","const CACHE = 'vfit-pro-v45';",1)
old="'./v43.js?v=43', './v44.js?v=44', './assets/custom-exercise.svg',"
new="'./v43.js?v=43', './v44.js?v=44', './v45.js?v=45', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V45 target not found')
p.write_text(s.replace(old,new,1))
