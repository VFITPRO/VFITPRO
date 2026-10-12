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
  boot();await wait(()=>el('accountMessage')?.textContent.includes('Entra o crea'));await login('a@example.com');
  const programBefore=window.eval('JSON.stringify(programSnapshot())');
  for(const energy of ['normal','low'])for(const minutes of [15,20,30,45,60,180])for(const rest of [30,90,180,300]){
    const p=window.eval(`makeAdaptation(0,${minutes},'${energy}',${rest})`);
    assert(p.items.length>0);assert(window.eval(`estimateSession(${JSON.stringify(p.items)},${rest})`)<=minutes);
    assert(p.items.every((item,i)=>item.count>=1 && item.count<=3 && item.index===i));
    if(energy==='low')assert(p.items.every(x=>x.count<=2));
  }
  checks.push('48 combinaciones de tiempo, descanso y energía caben en la estimación y conservan orden');
  window.eval('openDay(0);openAdaptation()');el('availableMinutes').value='4';el('availableMinutes').dispatchEvent(new window.Event('input'));
  assert(el('adaptationPreview').textContent.includes('entre 15 y 180'));assert.equal(window.eval('currentWorkout'),null);
  el('availableMinutes').value='20';el('todayEnergy').value='low';el('availableMinutes').dispatchEvent(new window.Event('input'));
  Array.from(doc.querySelectorAll('#editorOverlay button')).find(b=>b.textContent==='Aceptar y empezar esta sesión').click();
  const plan=window.eval('JSON.stringify(currentWorkout.adaptation)');
  assert.equal(window.eval('JSON.stringify(programSnapshot())'),programBefore);
  window.eval('openRegister()');assert.equal(doc.querySelectorAll('#setRows .setRow').length,window.eval('sessionItem().count'));
  assert(el('progression-register').textContent.includes('poca energía'));
  window.eval('state[0][0][0].kg=40;state[0][0][0].reps=10;state[0][0][0].done=true;persist()');
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));await logout();await login('b@example.com');assert.equal(window.eval('currentWorkout'),null);
  await logout();await login('a@example.com');assert.equal(window.eval('JSON.stringify(currentWorkout.adaptation)'),plan);
  window.eval('openDay(0);openExercise(currentWorkout.exercise);openRegister()');assert.equal(doc.querySelectorAll('#setRows .setRow').length,2);
  window.eval('saveExercise()');assert.equal(window.eval('activeEx'),1);
  window.eval('finishDay()');assert.equal(window.eval('currentWorkout'),null);assert.equal(window.eval('progress.history[0].adaptation.minutes'),20);assert.equal(window.eval('progress.history[0].exercises[0].sets.length'),1);
  assert.equal(window.eval('JSON.stringify(programSnapshot())'),programBefore);assert.equal(window.eval('state[0][0].length'),3);
  checks.push('Aceptar sesión, siguiente ejercicio, guardado, restauración por cuenta y programa original intacto');
  window.eval('openDay(0);openAdaptation()');Array.from(doc.querySelectorAll('#editorOverlay button')).find(b=>b.textContent==='Aceptar y empezar esta sesión').click();window.eval('openDay(0)');
  Array.from(doc.querySelectorAll('#adaptationSummary button')).find(b=>b.textContent==='Volver a la rutina completa').click();assert.equal(window.eval('currentWorkout.adaptation'),undefined);assert(Array.from(doc.querySelectorAll('#exerciseList .exerciseCard')).every(x=>x.style.opacity!=='.5'));window.eval('discardWorkout()');
  window.eval('progress.history=[]');assert.equal(window.eval("progressionProposal(0,0).type"),'hold');
  window.eval(`progress.history=[1,3].map(days=>({title:'Prueba',timestamp:Date.now()-days*86400000,date:'10/10/2026',volume:2340,sets:3,exercises:[{key:routines[0].ex[0].image,name:routines[0].ex[0].name,sets:Array.from({length:3},()=>({kg:60,reps:13,rir:2,done:true,note:''}))}]}))`);
  assert.equal(window.eval('progressionProposal(0,0).type'),'increase');assert.equal(window.eval('progressionProposal(0,0).sets[0].kg'),62.5);
  window.eval('routines[0].ex[0].stepKg=10');assert.equal(window.eval('progressionProposal(0,0).type'),'hold');window.eval('routines[0].ex[0].stepKg=2.5');
  window.eval('progress.history[0].exercises[0].sets[0].rir=0');assert.equal(window.eval('progressionProposal(0,0).type'),'hold');window.eval('progress.history[0].exercises[0].sets[0].rir=2');
  window.eval('progress.history[0].adaptation={minutes:20,energy:"normal"}');assert.equal(window.eval('progressionProposal(0,0).type'),'hold');window.eval('delete progress.history[0].adaptation');
  window.eval('progress.history[1].timestamp=Date.now()-40*86400000');assert.equal(window.eval('progressionProposal(0,0).type'),'hold');window.eval('progress.history[1].timestamp=Date.now()-3*86400000');
  window.eval('openDay(0);openExercise(0)');const button=Array.from(doc.querySelectorAll('#progression-exercise button')).find(b=>b.textContent==='Aplicar propuesta a esta sesión');assert(button.disabled);
  const checkbox=doc.querySelector('#progression-exercise input[type=checkbox]');checkbox.click();assert(!button.disabled);button.click();assert.equal(window.eval('state[0][0][0].kg'),62.5);assert.equal(window.eval('state[0][0][0].reps'),10);assert.equal(window.eval('state[0][0][0].done'),false);
  await wait(()=>el('cloudStatus').textContent.startsWith('Sincronizado'));await logout();await login('a@example.com');assert.equal(window.eval('state[0][0][0].kg'),62.5);assert.equal(window.eval('routines[0].ex[0].stepKg'),2.5);
  checks.push('Progresión requiere historial comparable, incremento limitado y aceptación; sobrevive a recarga');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({checks},null,2));dom.window.close();
})().catch(error=>{console.error(error);if(dom)dom.window.close();process.exit(1);});
