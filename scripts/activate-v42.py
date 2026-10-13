from pathlib import Path

p=Path('overrides/accounts.js')
s=p.read_text()
needle="    if (rawProfile.v41 && typeof rawProfile.v41 === 'object') profile.v41 = clone(rawProfile.v41);\n"
insert=needle+"    if (rawProfile.v42 && typeof rawProfile.v42 === 'object') profile.v42 = clone(rawProfile.v42);\n"
if needle not in s: raise SystemExit('accounts V42 profile preservation target not found')
s=s.replace(needle,insert,1)
p.write_text(s)

p=Path('overrides/index.html')
s=p.read_text()
if 'accounts.js?v=41' not in s: raise SystemExit('accounts V41 query target not found')
s=s.replace('accounts.js?v=41','accounts.js?v=42')
old='<script src="v41.js?v=41"></script>\n<noscript>'
new='<script src="v41.js?v=41"></script>\n<script src="v42.js?v=42"></script>\n<noscript>'
if old not in s: raise SystemExit('V42 script insertion target not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v41';" not in s: raise SystemExit('cache V41 target not found')
s=s.replace("const CACHE = 'vfit-pro-v41';","const CACHE = 'vfit-pro-v42';",1)
if "'./accounts.js?v=41'" not in s: raise SystemExit('sw accounts V41 query target not found')
s=s.replace("'./accounts.js?v=41'","'./accounts.js?v=42'",1)
old="'./v40.js?v=40', './v41.js?v=41', './assets/custom-exercise.svg',"
new="'./v40.js?v=40', './v41.js?v=41', './v42.js?v=42', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V42 target not found')
s=s.replace(old,new,1)
p.write_text(s)
