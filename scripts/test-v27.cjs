// VFIT PRO V27 DOM integration tests.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.VFIT_JSDOM_PATH || '/tmp/vfit-account-qa-runtime/node_modules/jsdom');
const root=path.resolve(__dirname,'..'),build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-v27-qa-'));
execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
const cloud=new Map(),users=new Map([['a@example.com','11111111-1111-4111-8111-111111111111'],['b@example.com','22222222-2222-4222-8222-222222222222']]);
const token=id=>Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
let dom,window,doc,vibrations=0;const errors=[],checks=[];
async function mockFetch(input,options){
  const req=new Request(input,options),url=new URL(req.url),reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(url.pathname.includes('/token')||url.pathname.includes('/signup')){const body=await req.json(),id=users.get(body.email);if(!id)return reply({message:'Invalid login credentials'},400);return reply({access_token:token(id),refresh_token:'refresh-'+id,expires_in:3600,token_type:'bearer',user:{id,email:body.email,user_metadata:{name:id.startsWith('1')?'Cuenta A':'Cuenta B'}}});}
  if(url.pathname.includes('/logout'))return reply({});if(url.pathname.includes('/user'))return reply({});
  if(url.pathname.includes('/rest/v1/vfit_user_data')){const jwt=req.headers.get('authorization')?.split(' ')[1],id=jwt?JSON.parse(Buffer.from(jwt.split('.')[1],'base64url')).sub:null;if(!id)return reply({message:'denied'},401);if(req.method==='GET')return reply(cloud.has(id)?[cloud.get(id)]:[]);const body=await req.json();if(req.method==='POST'){if(cloud.has(id))return reply({code:'23505'},409);cloud.set(id,body);return reply([{updated_at:body.updated_at}],201);}if(req.method==='PATCH'){const row=cloud.get(id);if(!row||url.searchParams.get('updated_at')!=='eq.'+row.updated_at)return reply([]);cloud.set(id,{...row,...body});return reply([{updated_at:body.updated_at}]);}}
  throw new Error('Unexpected mock request '+url.pathname);
}
const wait=async fn=>{for(let i=0;i<220;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Timeout')};
const el=id=>doc.getElementById(id),ready=()=>doc.body.classList.contains('account-ready');
function boot(seed={}){const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'https://vfit.test/',runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=mockFetch;w.Headers=Headers;w.Request=Request;w.Response=Response;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.navigator.vibrate=()=>{vibrations++;return true};w.URL.createObjectURL=()=> 'blob:vfit';w.URL.revokeObjectURL=()=>{};for(const[k,v]of Object.entries(seed))w.localStorage.setItem(k,v);}});window=dom.window;doc=window.document;window.HTMLAnchorElement.prototype.click=function(){};for(const file of ['vendor/supabase-2.57.4.js','accounts.js','v23.js','v24.js','v25.js','v26.js','v27.js']){const s=doc.createElement('script');s.textContent=fs.readFileSync(path.join(build,file),'utf8');doc.body.appendChild(s);}}
const login=async email=>{el('loginTab').click();el('accountEmail').value=email;el('accountPassword').value='test-password';el('accountForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await wait(ready);};
const logout=async()=>{window.eval("show('profile')");el('signOutAccount').click();await wait(()=>!ready()&&el('signOutAccount').disabled===false);};
(async()=>{
  boot();await wait(()=>el('accountMessage')?.textContent.includes('Entra o crea'));await login('a@example.com');
  assert(el('v27Settings'));assert(el('v27Muscles'));assert(el('v27DataTools'));assert(el('v27Install'));assert.equal(el('profile').lastElementChild.querySelector('h3').textContent,'Versión Premium V27');
  assert.equal(window.VFITAccountBridge.getProfile().v27.defaultRest,90);checks.push('V27 monta ajustes, analítica, herramientas de datos e instalación desde una cuenta nueva');

  window.eval("show('profile')");el('v27DefaultRest').value='75';el('v27DefaultRest').dispatchEvent(new window.Event('change'));el('v27DefaultRir').value='0';el('v27DefaultRir').dispatchEvent(new window.Event('change'));el('v27Sound').checked=false;el('v27Sound').dispatchEvent(new window.Event('change'));
  assert.equal(window.VFITAccountBridge.getProfile().v27.defaultRest,75);assert.equal(window.VFITAccountBridge.getProfile().v27.defaultRir,0);assert.equal(window.eval('blankSets(routines[0].ex[0])[0].rir'),0);checks.push('Descanso y RIR predeterminados se editan; RIR 0 se conserva correctamente');

  window.eval('openDay(0);openExercise(0);openRegister()');assert(el('v27RestHint'));el('v27ExerciseRest').value='45';el('v27ExerciseRest').dispatchEvent(new window.Event('change'));
  const done=doc.querySelector('#setRows input[data-k="done"]');done.checked=true;done.dispatchEvent(new window.Event('change',{bubbles:true}));assert(window.eval('restDeadline!==null'));assert.equal(window.eval('restDuration'),45);assert.equal(window.VFITAccountBridge.getProfile().v27.exerciseRest[window.eval('routines[0].ex[0].image')],45);
  window.eval('restDeadline=Date.now()-10;syncRestTimer()');assert(vibrations>0);checks.push('Marcar una serie inicia automáticamente el descanso específico y dispara aviso háptico al terminar');

  const now=Date.now(),weekAgo=now-7*86400000;window.eval(`progress.history=[{title:'Actual',timestamp:${now},date:'13/10/2026',volume:1500,sets:3,exercises:[{name:routines[0].ex[0].name,key:routines[0].ex[0].image,sets:[{kg:50,reps:10,rir:2,done:true},{kg:50,reps:10,rir:2,done:true},{kg:50,reps:10,rir:2,done:true}],warmups:[{kg:20,reps:12,done:true}]}]},{title:'Anterior',timestamp:${weekAgo},date:'06/10/2026',volume:800,sets:2,exercises:[{name:routines[0].ex[0].name,key:routines[0].ex[0].image,sets:[{kg:40,reps:10,rir:2,done:true},{kg:40,reps:10,rir:2,done:true}],warmups:[{kg:10,reps:15,done:true}]}]}];renderProgress()`);
  const pecho=[...doc.querySelectorAll('.v27Muscle')].find(x=>x.querySelector('b')?.textContent==='Pecho');assert(pecho);assert(pecho.textContent.includes('3 series'));assert(pecho.textContent.includes('Promedio 4 semanas: 0.5'));checks.push('Analítica muscular cuenta solo series de trabajo y compara con promedio de cuatro semanas');

  el('v27ExportAll').click();assert(el('toast').textContent.includes('Copia completa'));checks.push('La cuenta puede exportar una copia JSON completa desde Perfil');
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));let row=cloud.get(users.get('a@example.com'));assert.equal(row.data.schemaVersion,6);assert.equal(row.data.profile.v27.defaultRest,75);assert.equal(row.data.profile.v27.defaultRir,0);assert.equal(row.data.profile.v27.exerciseRest[window.eval('routines[0].ex[0].image')],45);

  await logout();await login('b@example.com');assert.equal(window.VFITAccountBridge.getProfile().v27.defaultRest,90);assert.equal(window.VFITAccountBridge.getProfile().v27.defaultRir,2);assert.equal(Object.keys(window.VFITAccountBridge.getProfile().v27.exerciseRest).length,0);checks.push('Ajustes V27 permanecen aislados entre cuentas');
  await logout();await login('a@example.com');assert.equal(window.VFITAccountBridge.getProfile().v27.defaultRest,75);assert.equal(window.VFITAccountBridge.getProfile().v27.defaultRir,0);assert.equal(window.VFITAccountBridge.getProfile().v27.exerciseRest[window.eval('routines[0].ex[0].image')],45);checks.push('Ajustes V27 sobreviven al cambio de sesión y sincronización');

  assert.deepEqual(errors,[]);checks.push('Sin errores JavaScript detectados en V27');console.log(JSON.stringify({checks},null,2));dom.window.close();
})().catch(err=>{console.error(err);if(dom)dom.window.close();process.exit(1)});
