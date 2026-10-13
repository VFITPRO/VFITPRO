// VFIT PRO V31 authenticated password-change integration tests.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require(process.env.VFIT_JSDOM_PATH || '/tmp/vfit-account-qa-runtime/node_modules/jsdom');
const root=path.resolve(__dirname,'..'),build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-v31-qa-'));
execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
const userId='11111111-1111-4111-8111-111111111111',email='a@example.com',cloud=new Map();let passwordRequests=0,lastPassword='',rejectPassword=false;
const token=id=>Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
let dom,window,doc;const errors=[],checks=[];
const user=()=>({id:userId,email,user_metadata:{name:'Cuenta A'},aud:'authenticated',role:'authenticated'});
async function mockFetch(input,options){
  const req=new Request(input,options),url=new URL(req.url),reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  if(url.pathname.includes('/token')||url.pathname.includes('/signup')){const body=await req.json();if(body.email!==email)return reply({message:'Invalid login credentials'},400);return reply({access_token:token(userId),refresh_token:'refresh-'+userId,expires_in:3600,token_type:'bearer',user:user()});}
  if(url.pathname.includes('/logout'))return reply({});
  if(url.pathname.endsWith('/user')){
    if(req.method==='GET')return reply(user());
    const body=await req.json();if(Object.prototype.hasOwnProperty.call(body,'password')){passwordRequests++;lastPassword=body.password;if(rejectPassword)return reply({message:'Password is known to be weak and easy to guess'},422);return reply(user());}
    return reply(user());
  }
  if(url.pathname.includes('/rest/v1/vfit_user_data')){const jwt=req.headers.get('authorization')?.split(' ')[1],id=jwt?JSON.parse(Buffer.from(jwt.split('.')[1],'base64url')).sub:null;if(!id)return reply({message:'denied'},401);if(req.method==='GET')return reply(cloud.has(id)?[cloud.get(id)]:[]);const body=await req.json();if(req.method==='POST'){if(cloud.has(id))return reply({code:'23505'},409);cloud.set(id,body);return reply([{updated_at:body.updated_at}],201);}if(req.method==='PATCH'){const row=cloud.get(id);if(!row||url.searchParams.get('updated_at')!=='eq.'+row.updated_at)return reply([]);cloud.set(id,{...row,...body});return reply([{updated_at:body.updated_at}]);}}
  throw new Error('Unexpected request '+req.method+' '+url.pathname);
}
const wait=async fn=>{for(let i=0;i<240;i++){if(fn())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Timeout')},el=id=>doc.getElementById(id),ready=()=>doc.body.classList.contains('account-ready');
function boot(){const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'https://vfit.test/',runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=mockFetch;w.Headers=Headers;w.Request=Request;w.Response=Response;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.navigator.vibrate=()=>true;w.URL.createObjectURL=()=> 'blob:vfit';w.URL.revokeObjectURL=()=>{};}});window=dom.window;doc=window.document;window.HTMLAnchorElement.prototype.click=function(){};for(const file of ['vendor/supabase-2.57.4.js','accounts.js','v23.js','v24.js','v25.js','v26.js','v27.js','v28.js','v29.js','v30.js','v31.js']){const s=doc.createElement('script');s.textContent=fs.readFileSync(path.join(build,file),'utf8');doc.body.appendChild(s);}}
const login=async()=>{el('loginTab').click();el('accountEmail').value=email;el('accountPassword').value='test-password';el('accountForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await wait(ready);};
function openDialog(){window.eval("show('profile')");el('v31ChangePassword').click();return el('editorOverlay');}
function setPasswords(a,b=a){el('v31Password').value=a;el('v31PasswordConfirm').value=b;}
(async()=>{
  boot();await wait(()=>el('accountMessage')?.textContent.includes('Entra o crea'));await login();assert(el('v31Security'));assert.equal(el('profile').lastElementChild.querySelector('h3').textContent,'Versión Premium V31');assert.equal(typeof window.VFITAccountBridge.changePassword,'function');checks.push('V31 monta Seguridad de cuenta y expone solo una operación limitada de cambio de contraseña');
  const uid=window.VFITAccountBridge.getUid(),snapshot=JSON.stringify(window.VFITAccountBridge.snapshot());

  openDialog();setPasswords('corta123','corta123');el('v31PasswordSubmit').click();assert(el('v31PasswordStatus').textContent.includes('10 caracteres'));assert.equal(passwordRequests,0);checks.push('Contraseña corta se bloquea localmente sin hacer ninguna petición');
  setPasswords('UnaClaveNuevaSegura1!','OtraClaveDistinta2!');el('v31PasswordSubmit').click();assert(el('v31PasswordStatus').textContent.includes('no coinciden'));assert.equal(passwordRequests,0);checks.push('Confirmación distinta se bloquea sin enviar credenciales');

  const good='UnaClaveNuevaSegura1!';setPasswords(good);el('v31PasswordSubmit').click();await wait(()=>passwordRequests===1);assert.equal(lastPassword,good);await wait(()=>el('editorOverlay')===null);assert(ready());assert.equal(window.VFITAccountBridge.getUid(),uid);assert.equal(JSON.stringify(window.VFITAccountBridge.snapshot()),snapshot);let storage='';for(let i=0;i<window.localStorage.length;i++)storage+=window.localStorage.getItem(window.localStorage.key(i))||'';assert(!storage.includes(good));checks.push('Cambio correcto mantiene sesión y datos intactos; la contraseña no entra en snapshot ni localStorage');

  rejectPassword=true;openDialog();const weak='aaaaaaaaaa';setPasswords(weak);el('v31PasswordSubmit').click();await wait(()=>passwordRequests===2);await wait(()=>el('v31PasswordStatus').textContent.includes('rechazó'));assert(el('editorOverlay'));assert(ready());assert.equal(window.VFITAccountBridge.getUid(),uid);checks.push('Si Supabase rechaza una contraseña, VFIT mantiene la sesión y muestra un error seguro');
  el('editorOverlay').remove();

  assert(el('recoveryHelp'));el('recoveryHelp').click();assert(el('accountMessage').textContent.includes('todavía no está configurada'));checks.push('La recuperación por correo sigue desactivada y no promete un flujo no verificado');
  assert.deepEqual(errors,[]);checks.push('Sin errores JavaScript detectados en V31');console.log(JSON.stringify({checks},null,2));dom.window.close();
})().catch(err=>{console.error(err);if(dom)dom.window.close();process.exit(1)});
