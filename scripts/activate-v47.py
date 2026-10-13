from pathlib import Path

p=Path('overrides/index.html')
s=p.read_text()
if '<script src="accounts.js?v=42"></script>' not in s: raise SystemExit('accounts cache target not found')
s=s.replace('<script src="accounts.js?v=42"></script>','<script src="accounts.js?v=47"></script>',1)
old='<script src="v46.js?v=46"></script>\n<noscript>'
new='<script src="v46.js?v=46"></script>\n<script src="v47.js?v=47"></script>\n<noscript>'
if old not in s: raise SystemExit('V47 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/accounts.js')
s=p.read_text()
old="    if (rawProfile.v42 && typeof rawProfile.v42 === 'object') profile.v42 = clone(rawProfile.v42);\n"
new=old+"    if (rawProfile.v47 && typeof rawProfile.v47 === 'object') profile.v47 = clone(rawProfile.v47);\n"
if old not in s: raise SystemExit('V47 profile restoration target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v46';" not in s: raise SystemExit('cache V46 target not found')
s=s.replace("const CACHE = 'vfit-pro-v46';","const CACHE = 'vfit-pro-v47';",1)
if "'./accounts.js?v=42'" not in s: raise SystemExit('accounts SW target not found')
s=s.replace("'./accounts.js?v=42'","'./accounts.js?v=47'",1)
old="'./v45.js?v=45', './v46.js?v=46', './assets/custom-exercise.svg',"
new="'./v45.js?v=45', './v46.js?v=46', './v47.js?v=47', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('V47 SW asset target not found')
p.write_text(s.replace(old,new,1))
