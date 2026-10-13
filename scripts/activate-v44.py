from pathlib import Path

p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v43.js?v=43"></script>\n<noscript>'
new='<script src="v43.js?v=43"></script>\n<script src="v44.js?v=44"></script>\n<noscript>'
if old not in s: raise SystemExit('V44 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v43';" not in s: raise SystemExit('cache V43 target not found')
s=s.replace("const CACHE = 'vfit-pro-v43';","const CACHE = 'vfit-pro-v44';",1)
old="'./v42.js?v=42', './v43.js?v=43', './assets/custom-exercise.svg',"
new="'./v42.js?v=42', './v43.js?v=43', './v44.js?v=44', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V44 target not found')
p.write_text(s.replace(old,new,1))
