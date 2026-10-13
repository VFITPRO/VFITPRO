// VFIT PRO V23 DOM integration tests using the real vendored Supabase SDK and a mock server.
// Set VFIT_JSDOM_PATH to the installed jsdom package when running outside QA.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.VFIT_JSDOM_PATH || '/tmp/vfit-account-qa-runtime/node_modules/jsdom');
const root=path.resolve(__dirname,'..'),build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-v23-qa-'));
execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
const cloud=new Map(),users=new Map([['a@example.com','11111111-1111-4111-8111-111111111111'],['b@example.com','22222222-2222-4222-8222-222222222222']]);
const token=id=>Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
let dom,window,doc;const errors=[],checks=[];
async function mockFetch(input,options){
  const req=new Request(input,options),url=new URL(req.url);
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(url.pathname.includes('/token') || url.pathname.includes('/signup')){
    const body=await req.json(),id=users.get(body.email);
    if(!id || body.password==='wrong')return reply({message:'Invalid login credentials'},400);
    return reply({access_token:token(id),refresh_token:'refresh-'+id,expires_in:3600,token_type:'bearer',user:{id,email:body.email,user_metadata:{name:id.startsWith('1')?'Cuenta A':'Cuenta B'}}});
  }
  if(url.pathname.includes('/logout'))return reply({});
  if(url.pathname.includes('/user'))return reply({});
  if(url.pathname.includes('/rest/v1/vfit_user_data')){
    const jwt=req.headers.get('authorization')?.split(' ')[1];
    const id=jwt?JSON.parse(Buffer.from(jwt.split('.')[1],'base64url')).sub:null;
    if(!id)return reply({message:'denied'},401);
    if(req.method==='GET')return reply(cloud.has(id)?[cloud.get(id)]:[]);
    const body=await req.json();
    if(req.method==='POST'){
      if(cloud.has(id))return reply({code:'23505'},409);
      cloud.set(id,body);return reply([{updated_at:body.updated_at}],201);
    }
    if(req.method==='PATCH'){
      const row=cloud.get(id);if(!row || url.searchParams.get('updated_at')!=='eq.'+row.updated_at)return reply([]);
      cloud.set(id,{...row,...body});return reply([{updated_at:body.updated_at}]);
    }
  }
  throw new Error('Unexpected mock request '+url.pathname);
}
const wait=async fn=>{for(let i=0;i<180;i++){if(fn())return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Timeout: '+fn.toString());};
const el=id=>doc.getElementById(id);
function boot(seed={}){
  const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
  dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'https://vfit.test/',runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
    w.fetch=mockFetch;w.Headers=Headers;w.Request=Request;w.Response=Response;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.confirm=()=>true;
    w.URL.createObjectURL=()=> 'blob:vfit-test';w.URL.revokeObjectURL=()=>{};
    for(const [key,value]of Object.entries(seed))w.localStorage.setItem(key,value);
  }});window=dom.window;doc=window.document;
  for(const file of ['vendor/supabase-2.57.4.js','accounts.js','v23.js']){const script=doc.createElement('script');script.textContent=fs.readFileSync(path.join(build,file),'utf8');doc.body.appendChild(script);}
}
const ready=()=>doc.body.classList.contains('account-ready');
const login=async email=>{el('loginTab').click();el('accountEmail').value=email;el('accountPassword').value='test-password';el('accountForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await wait(ready);};
const logout=async()=>{window.eval("show('profile')");el('signOutAccount').click();await wait(()=>!ready() && el('signOutAccount').disabled===false);};
function chooseFirstSubstitution(){
  const start=[...doc.querySelectorAll('#v23Substitution button')].find(b=>b.textContent.includes('Sustituir solo hoy'));
  assert(start,'Debe existir el botón de sustitución');start.click();
  const buttons=[...doc.querySelectorAll('#editorOverlay button.optionAction')].filter(b=>b.textContent!=='Cerrar');
  assert(buttons.length,'Debe haber al menos una alternativa');buttons[0].click();
}
(async()=>{
  boot();await wait(()=>el('accountMessage')?.textContent.includes('Entra o crea'));await login('a@example.com');
  assert(el('v23Weekly'));assert(el('v23CalendarPanel'));assert(el('v23Measurements'));assert(el('v23Equipment'));assert(el('v23Backups'));
  assert.equal(doc.querySelectorAll('#homeDays .dayCard').length,5);checks.push('V23 carga sin ocultar ninguno de los cinco días y monta todos sus paneles');

  window.eval("show('progress')");el('v23Goal').value='4';el('v23Goal').dispatchEvent(new window.Event('change'));
  window.eval("show('profile')");const firstEquip=doc.querySelector('#v23EquipmentBody input[type=checkbox]');firstEquip.checked=false;firstEquip.dispatchEvent(new window.Event('change'));
  el('v23CreateBackup').click();const backupKey='vfit-account-backups:'+users.get('a@example.com');assert.equal(JSON.parse(window.localStorage.getItem(backupKey)).length,1);
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));
  assert.equal(cloud.get(users.get('a@example.com')).data.profile.v23.weeklyGoal,4);checks.push('Objetivo semanal, material y copia local se guardan en la cuenta correcta');

  // Keep Barra available for the substitution catalogue used below.
  firstEquip.checked=true;firstEquip.dispatchEvent(new window.Event('change'));await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));
  window.eval("progress.history=[{title:'Historial antiguo',date:'01/01/2026',timestamp:1,volume:100,sets:1}];progress.sessions=1;progress.volume=100;openDay(0);openExercise(0)");
  const originalName=el('exTitle').textContent,originalKey=window.eval('routines[0].ex[0].image');window.eval(`progress.records[${JSON.stringify(originalName)}]=50`);
  chooseFirstSubstitution();const replacementName=el('exTitle').textContent;assert.notEqual(replacementName,originalName);
  assert.equal(doc.querySelectorAll('.v23SubBadge').length,1);
  window.eval('openExercise(0)');assert.equal(doc.querySelectorAll('.v23SubBadge').length,1,'No debe duplicarse la insignia al reabrir el ejercicio');
  window.eval('openExercise(1)');assert.equal(doc.querySelectorAll('.v23SubBadge').length,0,'No debe quedar una insignia vieja al cambiar de ejercicio');
  window.eval('openExercise(0)');assert.equal(doc.querySelectorAll('.v23SubBadge').length,1);
  const replacementKey=window.VFITAccountBridge.getProfile().v23.substitutions['0:0'].replacementKey;
  window.eval('state[0][0][0].kg=123;state[0][0][0].reps=8;state[0][0][0].rir=2;state[0][0][0].done=true;finishDay()');
  assert.equal(window.eval('currentWorkout'),null);assert.equal(Object.keys(window.VFITAccountBridge.getProfile().v23.substitutions).length,0);
  assert.equal(window.eval('progress.history[0].exercises[0].key'),replacementKey);assert.notEqual(window.eval('progress.history[0].exercises[0].key'),originalKey);
  assert.equal(window.eval(`progress.records[${JSON.stringify(originalName)}]`),50,'La sustitución no debe crear un récord falso para el ejercicio original');
  assert.equal(window.eval(`progress.records[${JSON.stringify(replacementName)}]`),123);
  assert.equal(window.eval('state[0][0][0].kg'),0);checks.push('Sustitución temporal: interfaz limpia, historial correcto, cargas separadas y récords atribuidos al ejercicio real');

  window.eval('openDay(1);openExercise(0)');chooseFirstSubstitution();assert(Object.keys(window.VFITAccountBridge.getProfile().v23.substitutions).length);window.eval('discardWorkout()');assert.equal(Object.keys(window.VFITAccountBridge.getProfile().v23.substitutions).length,0);checks.push('Descartar una sesión restaura el ejercicio original y elimina la sustitución temporal');

  window.eval("show('progress')");const edit=[...doc.querySelectorAll('#history .v23EditHistory')][0];assert(edit);edit.click();
  el('v23HistDuration').value='42';const firstKg=doc.querySelector('#editorOverlay input[aria-label="kg"]');firstKg.value='124';firstKg.dispatchEvent(new window.Event('change'));
  [...doc.querySelectorAll('#editorOverlay button.optionAction')].find(b=>b.textContent==='Guardar cambios').click();
  assert.equal(window.eval('progress.history[0].duration'),42*60);assert.equal(window.eval('progress.history[0].exercises[0].sets[0].kg'),124);
  assert.equal(window.eval(`progress.records[${JSON.stringify(replacementName)}]`),124);checks.push('Editar historial recalcula duración, series, volumen y récords');

  el('v23MeasurementsBody').querySelector('button').click();const measurePanel=el('editorOverlay');measurePanel.querySelector('[name=weight]').value='86.5';measurePanel.querySelector('[name=waist]').value='88';
  [...measurePanel.querySelectorAll('button.optionAction')].find(b=>b.textContent==='Guardar medidas').click();assert.equal(window.VFITAccountBridge.getProfile().v23.measurements[0].weight,86.5);checks.push('Las medidas corporales se crean y quedan dentro del perfil V23');
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));

  await logout();await login('b@example.com');assert.equal(window.VFITAccountBridge.getProfile().v23?.weeklyGoal??5,5);assert.equal(window.VFITAccountBridge.getProfile().v23?.measurements?.length??0,0);
  await logout();await login('a@example.com');assert.equal(window.VFITAccountBridge.getProfile().v23.weeklyGoal,4);assert.equal(window.VFITAccountBridge.getProfile().v23.measurements.length,1);checks.push('Los datos V23 permanecen aislados entre cuentas y sobreviven al cambio de sesión');

  assert.deepEqual(errors,[]);checks.push('Sin errores JavaScript detectados en V23');console.log(JSON.stringify({checks},null,2));dom.window.close();
})().catch(error=>{console.error(error);if(dom)dom.window.close();process.exit(1);});
