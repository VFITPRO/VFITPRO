from pathlib import Path

p=Path('overrides/accounts.js')
s=p.read_text()
needle="    if (rawProfile.v40 && typeof rawProfile.v40 === 'object') profile.v40 = clone(rawProfile.v40);\n"
insert=needle+"    if (rawProfile.v41 && typeof rawProfile.v41 === 'object') profile.v41 = clone(rawProfile.v41);\n"
if needle not in s: raise SystemExit('accounts V41 profile preservation target not found')
s=s.replace(needle,insert,1)
p.write_text(s)

p=Path('overrides/index.html')
s=p.read_text()
if 'accounts.js?v=40' not in s: raise SystemExit('accounts V40 query target not found')
s=s.replace('accounts.js?v=40','accounts.js?v=41')
old='<script src="v40.js?v=40"></script>\n<noscript>'
new='<script src="v40.js?v=40"></script>\n<script src="v41.js?v=41"></script>\n<noscript>'
if old not in s: raise SystemExit('V41 script insertion target not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v40';" not in s: raise SystemExit('cache V40 target not found')
s=s.replace("const CACHE = 'vfit-pro-v40';","const CACHE = 'vfit-pro-v41';",1)
if "'./accounts.js?v=40'" not in s: raise SystemExit('sw accounts V40 query target not found')
s=s.replace("'./accounts.js?v=40'","'./accounts.js?v=41'",1)
old="'./v39.js?v=39', './v40.js?v=40', './assets/custom-exercise.svg',"
new="'./v39.js?v=39', './v40.js?v=40', './v41.js?v=41', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V41 target not found')
s=s.replace(old,new,1)
p.write_text(s)
