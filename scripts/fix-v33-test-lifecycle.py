from pathlib import Path
p=Path('scripts/test-v33.cjs')
s=p.read_text()
old="dom.window.close();boot(saved);await wait(ready);"
new="dom.window.dispatchEvent(new dom.window.Event('pagehide'));await new Promise(r=>setTimeout(r,0));dom.window.close();boot(saved);await wait(ready);"
if old not in s: raise SystemExit('V33 reload lifecycle target not found')
s=s.replace(old,new,1)
old="console.log(JSON.stringify({checks},null,2));dom.window.close();"
new="console.log(JSON.stringify({checks},null,2));dom.window.dispatchEvent(new dom.window.Event('pagehide'));await new Promise(r=>setTimeout(r,0));dom.window.close();"
if old not in s: raise SystemExit('V33 final lifecycle target not found')
p.write_text(s.replace(old,new,1))
