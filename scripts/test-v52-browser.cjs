const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-browser-'));
 const root=path.resolve(__dirname,'..');
 execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(build,pathname==='/'?'index.html':pathname);if(!file.startsWith(build+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));server.unref();
 const browser=await chromium.launch({headless:true,executablePath:process.env.VFIT_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let row;const uid='11111111-1111-4111-8111-111111111111';
 await page.route('https://*.supabase.co/**',async route=>{
  const req=route.request(),url=req.url();let data={};
  if(url.includes('/token'))data={access_token:Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature',refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user:{id:uid,email:'qa@example.com',user_metadata:{name:'Víctor'}}};
  else if(url.includes('vfit_user_data')){if(req.method()==='GET')data=row?[row]:[];else {row=req.postDataJSON();data=[{updated_at:row.updated_at}];}}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('#accountEmail').fill('qa@example.com');await page.locator('#accountPassword').fill('test-password');await page.locator('#accountForm button[type=submit]').click();await page.waitForFunction(()=>document.body.classList.contains('account-ready'));
 if(process.env.VFIT_QA_OUTPUT)await page.screenshot({path:path.join(process.env.VFIT_QA_OUTPUT,'home.png'),fullPage:true});
 await page.locator('.bottomNav [data-s=routines]').click();if(process.env.VFIT_QA_OUTPUT)await page.screenshot({path:path.join(process.env.VFIT_QA_OUTPUT,'days.png'),fullPage:true});
 await page.locator('#routineDays .dayCard').last().click();
 await page.locator('#uxMore-day').click();await page.getByRole('button',{name:'Personalizar esta rutina',exact:true}).click();
 const editor=page.locator('#editorOverlay .uxRoutineEditor');assert(await editor.isVisible());
 assert.equal((await editor.locator(':scope > button').last().textContent()).trim(),'Cerrar');
 assert(await editor.getByRole('button',{name:'Quitar ejercicio',exact:true}).first().evaluate(el=>el.classList.contains('uxDanger')));
 await editor.getByRole('button',{name:'Cerrar',exact:true}).click();
 await page.locator('#uxStartDay').click();if(process.env.VFIT_QA_OUTPUT)await page.screenshot({path:path.join(process.env.VFIT_QA_OUTPUT,'register.png'),fullPage:true});
 assert(await page.locator('#setRows').isVisible());assert(!await page.locator('#workoutClock').isVisible());
 assert.equal(await page.locator('#setRows [data-k=kg]').first().getAttribute('aria-label'),'Serie 1: Peso en kilogramos');
 await page.locator('#uxMore-register').click();assert(await page.locator('#workoutClock').isVisible());
 await page.locator('#uxMore-register').click();
 await page.locator('#setRows [data-k=kg]').first().fill('20');await page.locator('#setRows [data-k=reps]').first().fill('10');await page.locator('#setRows [data-k=done]').first().check();
 assert(await page.locator('#setRows .setRow').first().evaluate(el=>el.classList.contains('uxSetDone')));
 await page.locator('#vfitSessionPause').click();assert.equal(await page.locator('#vfitSessionPause').textContent(),'Continuar');
 await page.locator('#vfitSessionClose').click();assert(await page.locator('#vfitFinishOverlay').isVisible());
 await page.getByRole('button',{name:'Seguir entrenando',exact:true}).click();
 for(const width of [320,390,768]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 await page.locator('#vfitSessionClose').click();await page.getByRole('button',{name:'Guardar y terminar',exact:true}).click();assert.equal(await page.evaluate(()=>currentWorkout),null);assert.equal(await page.evaluate(()=>progress.history.length),1);
 assert.deepEqual(errors,[]);console.log('Mobile browser PASS: routine editor hierarchy, accessible set fields, Day 5, series editing, pause, finish dialog, tools, no overflow at 320/390/768px.');await browser.close();server.close();fs.rmSync(build,{recursive:true,force:true});
})().catch(e=>{console.error(e);process.exit(1)});
