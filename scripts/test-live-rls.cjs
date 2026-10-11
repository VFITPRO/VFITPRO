// Creates two synthetic QA accounts (no emails are sent when autoconfirm is enabled).
// Never logs passwords or tokens; removes only the progress rows created by this test.
const {execFileSync} = require('node:child_process');
const {randomUUID} = require('node:crypto');
const assert = require('node:assert/strict');
const base = 'https://aevotmatwxbrkzhubcfm.supabase.co';
const key = 'sb_publishable_7NuaSbd-xtodzDwws9zJxw_rHp2idDr';
function request(endpoint, method='GET', body, token, prefer){
  const args=['--max-time','30','-sS','-X',method,base+endpoint,'-H','apikey: '+key,'-H','Content-Type: application/json','-w','\n%{http_code}'];
  if(token)args.push('-H','Authorization: Bearer '+token);
  if(prefer)args.push('-H','Prefer: '+prefer);
  if(body!==undefined)args.push('--data-binary','@-');
  const raw=execFileSync('curl',args,{input:body===undefined?undefined:JSON.stringify(body),encoding:'utf8',maxBuffer:1024*1024});
  const split=raw.lastIndexOf('\n'),status=Number(raw.slice(split+1)),text=raw.slice(0,split);
  return {status,data:text?JSON.parse(text):null};
}
const tag=Date.now().toString(36),accounts=[];
try{
  const settings=request('/auth/v1/settings');assert.equal(settings.data.mailer_autoconfirm,true);assert.equal(settings.data.external.email,true);
  const anonymous=request('/rest/v1/vfit_user_data?select=user_id');assert([401,403].includes(anonymous.status));
  for(const label of ['a','b']){
    const email=`vfit-qa-${tag}-${label}@example.com`,password=randomUUID()+'!Aa9';
    const result=request('/auth/v1/signup','POST',{email,password,data:{name:'VFIT prueba técnica '+label.toUpperCase()}});
    assert.equal(result.status,200,'Signup failed, HTTP '+result.status);assert(result.data.access_token,'No session returned');
    accounts.push({id:result.data.user.id,token:result.data.access_token,email,password});
  }
  const [a,b]=accounts;
  for(const [index,account] of accounts.entries()){
    const result=request('/rest/v1/vfit_user_data','POST',{user_id:account.id,data:{qa:true,progress:{sessions:index+1}},updated_at:new Date().toISOString()},account.token,'return=representation');
    assert.equal(result.status,201,'Own insert HTTP '+result.status);
  }
  const own=request('/rest/v1/vfit_user_data?select=user_id,data','GET',undefined,a.token);assert.equal(own.data.length,1);assert.equal(own.data[0].user_id,a.id);
  const other=request('/rest/v1/vfit_user_data?user_id=eq.'+a.id+'&select=user_id,data','GET',undefined,b.token);assert.deepEqual(other.data,[]);
  const update=request('/rest/v1/vfit_user_data?user_id=eq.'+a.id,'PATCH',{data:{qa:'unauthorized'}},b.token,'return=representation');assert.deepEqual(update.data,[]);
  const insert=request('/rest/v1/vfit_user_data','POST',{user_id:a.id,data:{qa:'unauthorized'}},b.token);assert([401,403].includes(insert.status));
  const deletion=request('/rest/v1/vfit_user_data?user_id=eq.'+a.id,'DELETE',undefined,b.token,'return=representation');assert.deepEqual(deletion.data,[]);
  const preserved=request('/rest/v1/vfit_user_data?user_id=eq.'+a.id+'&select=data','GET',undefined,a.token);assert.equal(preserved.data[0].data.progress.sessions,1);
  const signIn=request('/auth/v1/token?grant_type=password','POST',{email:a.email,password:a.password});assert.equal(signIn.status,200);assert.equal(signIn.data.user.id,a.id);
  console.log(JSON.stringify({passed:['Email y registro habilitados sin confirmación','Sin lectura anónima','Cada cuenta puede crear y leer su progreso','B no puede leer, modificar, crear ni borrar datos de A','Inicio de sesión con contraseña funciona'],qaAccounts:accounts.map(a=>a.email)},null,2));
}finally{
  for(const account of accounts){
    const cleaned=request('/rest/v1/vfit_user_data?user_id=eq.'+account.id,'DELETE',undefined,account.token);
    assert([200,204].includes(cleaned.status));
    request('/auth/v1/logout?scope=local','POST',{},account.token);
  }
}
