from pathlib import Path
idx=Path('overrides/index.html')
s=idx.read_text()
if 'v49-catalog.js?v=49' not in s:
    s=s.replace('<script src="accounts.js?v=47"></script>','<script src="v49-catalog.js?v=49"></script>\n<script src="accounts.js?v=47"></script>')
if 'v49.js?v=49' not in s:
    s=s.replace('<script src="v48.js?v=48"></script>','<script src="v48.js?v=48"></script>\n<script src="v49.js?v=49"></script>\n<script src="v49-compat.js?v=49"></script>')
elif 'v49-compat.js?v=49' not in s:
    s=s.replace('<script src="v49.js?v=49"></script>','<script src="v49.js?v=49"></script>\n<script src="v49-compat.js?v=49"></script>')
idx.write_text(s)
sw=Path('overrides/sw.js')
w=sw.read_text()
w=w.replace("const CACHE = 'vfit-pro-v48';","const CACHE = 'vfit-pro-v49';")
if "./v49-catalog.js?v=49" not in w:
    w=w.replace("'./accounts.css?v=23', './accounts.js?v=47'","'./accounts.css?v=23', './v49-catalog.js?v=49', './accounts.js?v=47'")
if "./v49.js?v=49" not in w:
    w=w.replace("'./v48.js?v=48', './assets/custom-exercise.svg'","'./v48.js?v=48', './v49.js?v=49', './v49-compat.js?v=49', './assets/custom-exercise.svg'")
elif "./v49-compat.js?v=49" not in w:
    w=w.replace("'./v49.js?v=49', './assets/custom-exercise.svg'","'./v49.js?v=49', './v49-compat.js?v=49', './assets/custom-exercise.svg'")
sw.write_text(w)
