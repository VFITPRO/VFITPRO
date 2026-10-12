// DOM integration tests use the real vendored Supabase SDK and a mock server.
// Set VFIT_JSDOM_PATH to the installed jsdom package when running outside QA.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.VFIT_JSDOM_PATH || '/tmp/vfit-account-qa-runtime/node_modules/jsdom');
const root=path.resolve(__dirname,'..'),build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-dom-qa-'));
execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
const cloud=new Map(),users=new Map([['a@example.com','11111111-1111-4111-8111-111111111111'],['b@example.com','22222222-2222-4222-8222-222222222222']]);
const token=id=>Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
let failCloud=false,dom,window,doc;const errors=[],checks=[];
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
    if(failCloud)return reply({message:'Offline test'},503);
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
const wait=async fn=>{for(let i=0;i<160;i++){if(fn())return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Timeout: '+fn.toString());};
const el=id=>doc.getElementById(id),click=selector=>doc.querySelector(selector).click();
function boot(seed={}){
  const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
  dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'https://vfit.test/',runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
    w.fetch=mockFetch;w.Headers=Headers;w.Request=Request;w.Response=Response;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.confirm=()=>true;
    for(const [key,value]of Object.entries(seed))w.localStorage.setItem(key,value);
  }});window=dom.window;doc=window.document;
  for(const file of ['vendor/supabase-2.57.4.js','accounts.js']){const script=doc.createElement('script');script.textContent=fs.readFileSync(path.join(build,file),'utf8');doc.body.appendChild(script);}
}
const ready=()=>doc.body.classList.contains('account-ready');
const login=async email=>{el('loginTab').click();el('accountEmail').value=email;el('accountPassword').value='test-password';el('accountForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await wait(ready);};
const logout=async()=>{window.eval("show('profile')");el('signOutAccount').click();await wait(()=>!ready() && el('signOutAccount').disabled===false);};
(async()=>{
  boot({'vfit12-progress':JSON.stringify({sessions:9,volume:1234,records:{},history:[]})});
  await wait(()=>el('accountMessage')?.textContent.includes('Entra o crea'));assert(!ready());checks.push('Inicio de sesión obligatorio; ningún progreso visible antes de entrar');
  await login('a@example.com');assert.equal(el('homeSessions').textContent,'0');checks.push('No se importa el progreso antiguo a una cuenta arbitraria');assert(window.eval('state.flat(2).every(s=>s.kg===0)'));
  assert.equal(doc.querySelectorAll('#homeDays .dayCard').length,5);assert.equal(doc.querySelectorAll('#routineDays .dayCard').length,5);
  const assets=window.eval('routines.flatMap(r=>[r.hero,...r.ex.flatMap(e=>[e.image,e.thumb,e.anatomy])])');assets.forEach(asset=>assert(fs.existsSync(path.join(build,asset)),asset));
  for(let i=0;i<5;i++){
    window.eval('currentWorkout=null');
    click('.bottomNav [data-s=routines]');doc.querySelectorAll('#routineDays .dayCard')[i].click();assert.equal(el('dayTitle').textContent,'Día '+(i+1));
    click('#exerciseList .exerciseCard');click('#exercise .cta');assert.equal(doc.querySelectorAll('#setRows .setRow').length,3);
    assert(doc.querySelector('#register').classList.contains('active'));
  }
  checks.push('Los cinco días, todos sus assets, ejercicios y botones de registro funcionan');
  window.eval("state[4][0][0]={kg:42,reps:10,rir:1,done:true,note:'Solo A'};finishDay()");
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));
  assert.equal(cloud.get(users.get('a@example.com')).data.progress.sessions,1);assert.equal(cloud.get(users.get('a@example.com')).data.progress.volume,420);
  checks.push('La cuenta A guarda sesión, cargas, volumen y notas');
  assert.equal(cloud.get(users.get('a@example.com')).data.progress.history[0].exercises[0].sets[0].kg,42);
  window.eval("openDay(4);openRoutineEditor()");
  const originalFirst=window.eval('routines[4].ex[0].image');
  const beforeCount=window.eval('routines[4].ex.length');
  Array.from(doc.querySelectorAll('#editorOverlay button')).find(b=>b.textContent==='+ Añadir ejercicio').click();assert.equal(window.eval('routines[4].ex.length'),beforeCount+1);
  Array.from(doc.querySelectorAll('#editorOverlay button')).filter(b=>b.textContent==='Quitar ejercicio').at(-1).click();assert.equal(window.eval('routines[4].ex.length'),beforeCount);
  window.eval('moveExercise(0,1)');assert.equal(window.eval('routines[4].ex[1].image'),originalFirst);assert.equal(window.eval('state[4][1][0].kg'),42);
  doc.querySelector('#editorOverlay input[type=number]').value='4';doc.querySelector('#editorOverlay input[type=number]').dispatchEvent(new window.Event('change'));
  assert.equal(window.eval('state[4][0].length'),4);
  window.eval("$('editorOverlay').remove();openExercise(1);openRegister();currentWorkout.runningSince=Date.now()-65000;renderWorkoutClock()");
  assert.equal(el('workoutElapsed').textContent,'01:05');window.eval('toggleWorkoutClock();adjustWorkoutClock(-60)');assert.equal(el('workoutElapsed').textContent,'00:05');
  window.eval('changeSetCount(1)');assert.equal(window.eval('state[4][1].length'),4);window.eval('changeSetCount(-1)');assert.equal(window.eval('state[4][1].length'),3);
  el('notes').value='Nota persistente';el('notes').dispatchEvent(new window.Event('input'));
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));
  assert.equal(cloud.get(users.get('a@example.com')).data.currentWorkout.elapsed,5);
  assert.equal(cloud.get(users.get('a@example.com')).data.program[4][1].key,originalFirst);
  checks.push('Rutinas reordenadas conservan cargas; series editables, reloj separado y notas guardadas');

  await logout();assert.equal(el('notes').value,'');assert.equal(el('setRows').children.length,0);
  el('signupTab').click();el('accountName').value='Cuenta B';el('accountEmail').value='b@example.com';el('accountPassword').value='test-password';
  el('accountForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await wait(ready);
  assert.equal(el('homeSessions').textContent,'0');assert.equal(window.eval('state[4][0][0].note'),'');assert.equal(window.eval('favorites.length'),0);
  checks.push('Registro y cambio a B no mezclan sesiones, cargas, notas ni favoritos');
  await logout();await login('a@example.com');assert.equal(el('homeSessions').textContent,'1');
  assert.equal(window.eval('routines[4].ex[1].image'),originalFirst);assert.equal(window.eval('state[4][0].length'),4);
  assert.equal(window.eval('currentWorkout.elapsed'),5);assert.equal(window.eval('state[4][1][0].note'),'Nota persistente');
  assert.equal(window.eval('progress.history[0].exercises[0].sets[0].kg'),42);
  window.eval('openSessionDetail(progress.history[0])');assert(el('editorOverlay').textContent.includes('42 kg'));
  checks.push('Programa personalizado, tiempo de sesión e historial detallado sobreviven al cambio de cuenta');

  const saved={};for(let i=0;i<window.localStorage.length;i++){const k=window.localStorage.key(i);saved[k]=window.localStorage.getItem(k);}dom.window.close();boot(saved);await wait(ready);
  assert.equal(el('homeSessions').textContent,'1');checks.push('Entrar de nuevo y recargar recuperan la cuenta y el progreso');
  failCloud=true;window.eval('progress.sessions=2;persist()');await wait(()=>el('cloudStatus').dataset.state==='error');
  assert.equal(JSON.parse(window.localStorage.getItem('vfit-account-data:'+users.get('a@example.com'))).dirty,true);
  failCloud=false;el('syncAccount').click();await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));
  assert.equal(cloud.get(users.get('a@example.com')).data.progress.sessions,2);checks.push('Los fallos de conexión conservan cambios y permiten reintentar');
  cloud.get(users.get('a@example.com')).updated_at='2099-01-01T00:00:00.000Z';window.eval('progress.sessions=3;persist()');
  await wait(()=>!el('useCloud').hidden);assert.equal(cloud.get(users.get('a@example.com')).data.progress.sessions,2);checks.push('El conflicto entre dispositivos no sobrescribe datos');
  const conflictSeed={};for(let i=0;i<window.localStorage.length;i++){const k=window.localStorage.key(i);conflictSeed[k]=window.localStorage.getItem(k);}dom.window.close();boot(conflictSeed);await wait(ready);assert.equal(el('useCloud').hidden,false);assert.equal(cloud.get(users.get('a@example.com')).data.progress.sessions,2);
  el('useCloud').click();await wait(()=>el('cloudStatus').textContent==='Versión de la nube cargada.');assert.equal(el('pSessions').textContent,'2');
  assert(window.localStorage.getItem('vfit-account-data:'+users.get('a@example.com')+':conflict-backup'));checks.push('Resolución de conflicto con copia recuperable');
  await logout();await login('b@example.com');window.eval("show('profile')");assert.equal(el('importLegacy').hidden,false);el('importLegacy').click();
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));assert.equal(el('pSessions').textContent,'9');
  assert.equal(JSON.parse(window.localStorage.getItem('vfit12-progress')).sessions,9);checks.push('Importación explícita preserva la copia original del teléfono');
  window.eval("progress.history=[{title:'<img src=x onerror=alert(1)>',date:'11/10/2026',volume:0,sets:0}];renderProgress()");assert.equal(doc.querySelector('#history img'),null);checks.push('Los datos de historial se muestran como texto, no código HTML');
  assert.deepEqual(errors,[]);checks.push('Sin errores JavaScript');console.log(JSON.stringify({checks,build},null,2));dom.window.close();
})().catch(error=>{console.error(error);if(dom)dom.window.close();process.exit(1);});
