// VFIT PRO V24 DOM integration tests.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.VFIT_JSDOM_PATH || '/tmp/vfit-account-qa-runtime/node_modules/jsdom');
const root=path.resolve(__dirname,'..'),build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-v24-qa-'));
execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
const cloud=new Map(),users=new Map([['a@example.com','11111111-1111-4111-8111-111111111111']]);
const token=id=>Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
let dom,window,doc;const errors=[],checks=[];
async function mockFetch(input,options){
  const req=new Request(input,options),url=new URL(req.url);const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(url.pathname.includes('/token')||url.pathname.includes('/signup')){const body=await req.json(),id=users.get(body.email);if(!id)return reply({message:'Invalid login credentials'},400);return reply({access_token:token(id),refresh_token:'refresh-'+id,expires_in:3600,token_type:'bearer',user:{id,email:body.email,user_metadata:{name:'Cuenta A'}}});}
  if(url.pathname.includes('/logout'))return reply({});if(url.pathname.includes('/user'))return reply({});
  if(url.pathname.includes('/rest/v1/vfit_user_data')){const jwt=req.headers.get('authorization')?.split(' ')[1],id=jwt?JSON.parse(Buffer.from(jwt.split('.')[1],'base64url')).sub:null;if(!id)return reply({message:'denied'},401);if(req.method==='GET')return reply(cloud.has(id)?[cloud.get(id)]:[]);const body=await req.json();if(req.method==='POST'){cloud.set(id,body);return reply([{updated_at:body.updated_at}],201);}if(req.method==='PATCH'){const row=cloud.get(id);cloud.set(id,{...row,...body});return reply([{updated_at:body.updated_at}]);}}
  throw new Error('Unexpected mock request '+url.pathname);
}
const wait=async fn=>{for(let i=0;i<160;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Timeout')};
const el=id=>doc.getElementById(id);
function boot(){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'https://vfit.test/',runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=mockFetch;w.Headers=Headers;w.Request=Request;w.Response=Response;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.confirm=()=>true;w.URL.createObjectURL=()=> 'blob:vfit';w.URL.revokeObjectURL=()=>{};}});window=dom.window;doc=window.document;
  for(const file of ['vendor/supabase-2.57.4.js','accounts.js','v23.js','v24.js']){const s=doc.createElement('script');s.textContent=fs.readFileSync(path.join(build,file),'utf8');doc.body.appendChild(s);}
}
const login=async()=>{el('loginTab').click();el('accountEmail').value='a@example.com';el('accountPassword').value='test-password';el('accountForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await wait(()=>doc.body.classList.contains('account-ready'));};
(async()=>{
  boot();await wait(()=>el('accountMessage')?.textContent.includes('Entra o crea'));await login();
  const key1=window.eval('routines[0].ex[0].image'),name1=window.eval('routines[0].ex[0].name'),key2=window.eval('routines[0].ex[1].image'),name2=window.eval('routines[0].ex[1].name');
  const now=Date.now(),day=86400000;
  const mk=(title,age,key,name,kg,reps,sets=3)=>({title,timestamp:now-age*day,date:new Date(now-age*day).toLocaleDateString('es-ES'),volume:kg*reps*sets,sets,duration:3600,exercises:[{key,name,sets:Array.from({length:sets},()=>({kg,reps,rir:2,done:true,note:''}))}]});
  const history=[mk('Última',1,key1,name1,60,10),mk('Anterior',8,key1,name1,55,10),mk('Otra',20,key2,name2,30,12),mk('Antigua',400,key1,name1,50,10)];
  window.eval(`progress.history=${JSON.stringify(history)};progress.sessions=4;progress.volume=progress.history.reduce((s,h)=>s+h.volume,0);progress.records={};renderProgress()`);
  assert(el('v24Analytics'));assert(el('v24Summary'));assert(el('v24HistoryFilters'));assert.equal(el('profile').lastElementChild.querySelector('h3').textContent,'Versión Premium V24');checks.push('V24 monta analítica, resumen, filtros y etiqueta de versión sin alterar las pantallas existentes');
  const select=el('v24ExerciseSelect');select.value=key1;select.dispatchEvent(new window.Event('change'));
  const analytics=el('v24Analytics').textContent;assert(analytics.includes('60 kg'));assert(analytics.includes('80 kg'));assert(analytics.includes('NUEVO PR · CARGA'));assert(analytics.includes('NUEVO PR · 1RM'));assert(analytics.includes('+5 kg en carga máxima'));assert.equal(el('v24Analytics').querySelectorAll('.v24TrendBar').length,3);checks.push('Carga máxima, 1RM estimado, comparación, PRs y tendencia usan el historial real del ejercicio');
  const summary=el('v24Summary').textContent;assert(summary.includes(name1));assert(summary.includes('PR carga'));checks.push('El resumen de la última sesión identifica mejoras frente a registros anteriores');
  const histSelect=el('v24HistoryExercise');histSelect.value=key1;histSelect.dispatchEvent(new window.Event('change'));assert.equal([...doc.querySelectorAll('#history .historyItem')].filter(x=>!x.hidden).length,3);assert(el('v24FilterCount').textContent.includes('3 sesiones visibles'));
  el('v24HistoryRange').value='365';el('v24HistoryRange').dispatchEvent(new window.Event('change'));assert.equal([...doc.querySelectorAll('#history .historyItem')].filter(x=>!x.hidden).length,2);checks.push('El historial se filtra por ejercicio y periodo sin borrar ni modificar sesiones');
  el('v24MetricSelect').value='volume';el('v24MetricSelect').dispatchEvent(new window.Event('change'));assert(el('v24Analytics').textContent.includes('Volumen'));assert.equal(el('v24Analytics').querySelectorAll('.v24TrendBar').length,3);checks.push('La gráfica cambia entre 1RM estimado, carga máxima y volumen');
  assert.equal(doc.querySelectorAll('#homeDays .dayCard').length,5);assert.deepEqual(errors,[]);checks.push('Los cinco días siguen presentes y no aparecen errores JavaScript');
  console.log(JSON.stringify({checks},null,2));dom.window.close();
})().catch(err=>{console.error(err);if(dom)dom.window.close();process.exit(1)});
