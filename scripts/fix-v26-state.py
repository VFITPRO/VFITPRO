from pathlib import Path
p=Path('overrides/v26.js')
s=p.read_text()
old="function dayId(index=activeDay){return syncDayMeta().days[index]?.id||`base-${index+1}`;}"
new="function dayId(index=activeDay){const live=bridge.getProfile()?.v26?.days?.[index]?.id;return live||syncDayMeta().days[index]?.id||`base-${index+1}`;}"
if old not in s:
    raise SystemExit('V26 dayId target not found')
p.write_text(s.replace(old,new,1))
