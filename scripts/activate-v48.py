from pathlib import Path

p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v47.js?v=47"></script>\n<noscript>'
new='<script src="v47.js?v=47"></script>\n<script src="v48.js?v=48"></script>\n<noscript>'
if old not in s: raise SystemExit('V48 script insertion target not found')
p.write_text(s.replace(old,new,1))

p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v47';" not in s: raise SystemExit('cache V47 target not found')
s=s.replace("const CACHE = 'vfit-pro-v47';","const CACHE = 'vfit-pro-v48';",1)
old="'./v46.js?v=46', './v47.js?v=47', './assets/custom-exercise.svg',"
new="'./v46.js?v=46', './v47.js?v=47', './v48.js?v=48', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('V48 SW asset target not found')
p.write_text(s.replace(old,new,1))
