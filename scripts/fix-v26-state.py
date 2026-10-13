from pathlib import Path
p=Path('overrides/v26.js')
s=p.read_text()
old="function cfg(){const p=bridge.getProfile();const clean=sanitize(p.v26);p.v26=clean;syncCatalog(clean);return clean;}"
new="let cachedProfile=null,cachedConfig=null;\n  function cfg(){const p=bridge.getProfile();if(p!==cachedProfile||p.v26!==cachedConfig){cachedProfile=p;cachedConfig=sanitize(p.v26);p.v26=cachedConfig;syncCatalog(cachedConfig);}return cachedConfig;}"
if old not in s:
    raise SystemExit('V26 cfg target not found')
s=s.replace(old,new,1)
old="function dayId(index=activeDay){return syncDayMeta().days[index]?.id||`base-${index+1}`;}"
new="function dayId(index=activeDay){const live=bridge.getProfile()?.v26?.days?.[index]?.id;return live||syncDayMeta().days[index]?.id||`base-${index+1}`;}"
if old not in s:
    raise SystemExit('V26 dayId target not found')
p.write_text(s.replace(old,new,1))
