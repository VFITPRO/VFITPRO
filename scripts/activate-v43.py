from pathlib import Path

p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v42.js?v=42"></script>\n<noscript>'
new='<script src="v42.js?v=42"></script>\n<script src="v43.js?v=43"></script>\n<noscript>'
if old not in s: raise SystemExit('V43 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v42';" not in s: raise SystemExit('cache V42 target not found')
s=s.replace("const CACHE = 'vfit-pro-v42';","const CACHE = 'vfit-pro-v43';",1)
old="'./v41.js?v=41', './v42.js?v=42', './assets/custom-exercise.svg',"
new="'./v41.js?v=41', './v42.js?v=42', './v43.js?v=43', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V43 target not found')
p.write_text(s.replace(old,new,1))
