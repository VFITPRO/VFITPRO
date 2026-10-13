from pathlib import Path

p=Path('overrides/accounts.js')
s=p.read_text()
needle="    if (rawProfile.v28 && typeof rawProfile.v28 === 'object') profile.v28 = clone(rawProfile.v28);\n"
insert=needle+"    if (rawProfile.v40 && typeof rawProfile.v40 === 'object') profile.v40 = clone(rawProfile.v40);\n"
if needle not in s: raise SystemExit('accounts V40 profile preservation target not found')
s=s.replace(needle,insert,1)
p.write_text(s)

p=Path('overrides/index.html')
s=p.read_text()
if 'accounts.js?v=32' not in s: raise SystemExit('accounts query target not found')
s=s.replace('accounts.js?v=32','accounts.js?v=40')
old='<script src="v39.js?v=39"></script>\n<noscript>'
new='<script src="v39.js?v=39"></script>\n<script src="v40.js?v=40"></script>\n<noscript>'
if old not in s: raise SystemExit('V40 script insertion target not found')
s=s.replace(old,new,1)
p.write_text(s)

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v39';" not in s: raise SystemExit('cache V39 target not found')
s=s.replace("const CACHE = 'vfit-pro-v39';","const CACHE = 'vfit-pro-v40';",1)
if "'./accounts.js?v=32'" not in s: raise SystemExit('sw accounts query target not found')
s=s.replace("'./accounts.js?v=32'","'./accounts.js?v=40'",1)
old="'./v38.js?v=38', './v39.js?v=39', './assets/custom-exercise.svg',"
new="'./v38.js?v=38', './v39.js?v=39', './v40.js?v=40', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V40 target not found')
s=s.replace(old,new,1)
p.write_text(s)
