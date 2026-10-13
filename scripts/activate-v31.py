from pathlib import Path

# Keep the Supabase client private; expose only a constrained authenticated password-change operation.
p=Path('overrides/accounts.js')
s=p.read_text()
old="""    markDirty: () => writeSaved('vfit-v23', Date.now()),
    restore: data => {"""
new="""    markDirty: () => writeSaved('vfit-v23', Date.now()),
    changePassword: async password => {
      if (!uid || !ready) return {ok:false,message:'Inicia sesión antes de cambiar la contraseña.'};
      const value = String(password ?? '');
      if (value.length < 10) return {ok:false,message:'Usa al menos 10 caracteres.'};
      try {
        const {error} = await client.auth.updateUser({password:value});
        if (error) {
          if (/password|weak|characters|length/i.test(error.message || '')) return {ok:false,message:'Supabase rechazó esa contraseña. Prueba una contraseña más larga y difícil de adivinar.'};
          return {ok:false,message:errorText(error)};
        }
        return {ok:true,message:'Contraseña actualizada correctamente.'};
      } catch (error) {
        return {ok:false,message:errorText(error)};
      }
    },
    restore: data => {"""
if old not in s: raise SystemExit('V31 bridge target not found')
s=s.replace(old,new,1)
p.write_text(s)

# Load V31 after V30. No account-data schema change is needed.
p=Path('overrides/index.html')
s=p.read_text()
old='<script src="v30.js?v=30"></script>\n<noscript>'
new='<script src="v30.js?v=30"></script>\n<script src="v31.js?v=31"></script>\n<noscript>'
if old not in s: raise SystemExit('V31 script insertion target not found')
p.write_text(s.replace(old,new,1))

# Offline cache revision.
p=Path('overrides/sw.js')
s=p.read_text()
if "const CACHE = 'vfit-pro-v30';" not in s: raise SystemExit('cache V30 target not found')
s=s.replace("const CACHE = 'vfit-pro-v30';","const CACHE = 'vfit-pro-v31';",1)
old="'./accounts.css?v=23', './accounts.js?v=29', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './assets/custom-exercise.svg',"
new="'./accounts.css?v=23', './accounts.js?v=29', './v23.js?v=23', './v24.js?v=24', './v25.js?v=25', './v26.js?v=26', './v27.js?v=27', './v28.js?v=28', './v29.js?v=29', './v30.js?v=30', './v31.js?v=31', './assets/custom-exercise.svg',"
if old not in s: raise SystemExit('service worker V31 target not found')
p.write_text(s.replace(old,new,1))

# Earlier UI-layer tests accept later version labels while retaining their behavior checks.
p=Path('scripts/test-v30.cjs')
s=p.read_text()
old="assert.equal(el('profile').lastElementChild.querySelector('h3').textContent,'Versión Premium V30');"
new="assert(Number(el('profile').lastElementChild.querySelector('h3').textContent.match(/V(\\d+)/)?.[1])>=30);"
if old not in s: raise SystemExit('V30 version regression target not found')
p.write_text(s.replace(old,new,1))
