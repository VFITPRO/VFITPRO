const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-v54-'));
 const root=path.resolve(__dirname,'..');
 execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(build,pathname==='/'?'index.html':pathname);if(!file.startsWith(build+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));server.unref();
 const browser=await chromium.launch({headless:true,executablePath:process.env.VFIT_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let row;const uid='22222222-2222-4222-8222-222222222222';
 await page.route('https://*.supabase.co/**',async route=>{
  const req=route.request(),url=req.url();let data={};
  if(url.includes('/token'))data={access_token:Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature',refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user:{id:uid,email:'qa@example.com',user_metadata:{name:'Víctor'}}};
  else if(url.includes('vfit_user_data')){if(req.method()==='GET')data=row?[row]:[];else{row=req.postDataJSON();data=[{updated_at:row.updated_at}];}}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#accountEmail').fill('qa@example.com');await page.locator('#accountPassword').fill('test-password');await page.locator('#accountForm button[type=submit]').click();
 await page.waitForFunction(()=>document.body.classList.contains('account-ready'));
 await page.waitForFunction(()=>!!window.VFITEasyV54);
 /* historial de ejemplo: la sesión anterior de Press de banca */
 await page.evaluate(()=>{const ex=routines[0].ex[0];progress.history.unshift({title:'Día 1 · Pecho y Tríceps',timestamp:Date.now()-86400000,date:'17/11/2026',volume:1800,sets:3,duration:3000,exercises:[{name:ex.name,key:ex.image,sets:[{kg:60,reps:10,rir:2,done:true,type:'normal'},{kg:60,reps:10,rir:2,done:true,type:'normal'},{kg:55,reps:9,rir:2,done:true,type:'normal'}]}]});persist();});
 await page.locator('.bottomNav [data-s=routines]').click();await page.locator('#routineDays .dayCard').first().click();await page.locator('#uxStartDay').click();
 await page.waitForSelector('#setRows .setRow');

 /* 1. Guía de tres pasos visible y recordada */
 assert(await page.locator('#easyGuide').isVisible());assert.equal(await page.locator('#easyGuide li').count(),3);
 await page.locator('#easyGuideOk').click();assert(!await page.locator('#easyGuide').isVisible());
 assert.equal(await page.evaluate(()=>localStorage.getItem('vfit-easy-guide-hidden')),'1');
 await page.locator('#easyToggle').scrollIntoViewIfNeeded();await page.locator('#easyHelp').click();assert(await page.locator('#easyGuide').isVisible());await page.locator('#easyGuideOk').click();

 /* 2. Modo fácil: sin RIR, sin tipo de serie, sin teclado de guiones; casilla grande; encabezados claros */
 assert(await page.evaluate(()=>document.body.classList.contains('easyMode')));
 assert(!await page.locator('#setRows [data-k=rir]').first().isVisible());
 assert(!await page.locator('#uxBatchSeries').isVisible());
 const box=await page.locator('#setRows [data-k=done]').first().boundingBox();assert(box.width>=44&&box.height>=44,'casilla ✓ demasiado pequeña');
 assert.deepEqual(await page.locator('#register .setHead > div:visible').allTextContents(),['Serie','Kilos','Repeticiones','Hecha']);

 /* 3. «Última vez»: un toque rellena kilos y repeticiones */
 assert.equal(await page.locator('.easyPrev').count(),3);
 await page.locator('.easyPrev').nth(2).click();
 assert.equal(await page.locator('#setRows [data-k=kg]').nth(2).inputValue(),'55');assert.equal(await page.locator('#setRows [data-k=reps]').nth(2).inputValue(),'9');
 assert.equal(await page.evaluate(()=>state[activeDay][activeEx][2].kg),55);

 /* 4. Al enfocar una casilla numérica no hay errores (la selección del contenido no es comprobable en inputs numéricos) */
 await page.locator('#setRows [data-k=kg]').nth(1).focus();await page.waitForTimeout(60);

 /* 5. Series con kilos sin ✓: pregunta antes de guardar y no pierde datos */
 await page.locator('#setRows [data-k=kg]').nth(1).fill('62');
 await page.locator('#setRows [data-k=done]').first().check();
 await page.locator('#register > .cta').click();
 assert(await page.locator('#easyConfirm').isVisible());
 assert.match(await page.locator('#easyConfirmTitle').textContent(),/2 series sin marcar/);
 await page.keyboard.press('Escape');assert(!await page.locator('#easyConfirm').isVisible());
 assert.equal(await page.evaluate(()=>activeEx),0);
 await page.locator('#register > .cta').click();await page.locator('#easyConfirmNo').click();
 assert.equal(await page.evaluate(()=>activeEx),1);
 assert.equal(await page.evaluate(()=>state[0][0].map(s=>s.done).join()),'true,false,false');
 await page.evaluate(()=>openExercise(0));await page.evaluate(()=>openRegister());await page.waitForSelector('#setRows .setRow');
 await page.locator('#register > .cta').click();await page.locator('#easyConfirmYes').click();
 assert.equal(await page.evaluate(()=>state[0][0].map(s=>s.done).join()),'true,true,true');
 assert.equal(await page.evaluate(()=>activeEx),1);

 /* 6. Series sin kilos (por ejemplo peso corporal) no generan pregunta */
 await page.evaluate(()=>openRegister());await page.waitForSelector('#setRows .setRow');
 await page.locator('#register > .cta').click();assert(!await page.locator('#easyConfirm').isVisible());

 /* 7. Opciones avanzadas disponibles y reversibles */
 await page.evaluate(()=>{openExercise(0);openRegister();});await page.waitForSelector('#setRows .setRow');
 await page.locator('#easyToggle').scrollIntoViewIfNeeded();await page.locator('#easyToggle').click();
 assert(await page.locator('#setRows [data-k=rir]').first().isVisible());assert(await page.locator('#uxBatchSeries').isVisible());
 assert.equal(await page.evaluate(()=>localStorage.getItem('vfit-easy-mode')),'0');
 await page.locator('#easyToggle').click();assert(!await page.locator('#setRows [data-k=rir]').first().isVisible());

 /* 8. Sin desbordes horizontales */
 for(const width of [320,390,768]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 assert.deepEqual(errors,[]);
 console.log('V54 PASS: guía, modo fácil, casilla grande, «última vez» con un toque, aviso de series sin ✓, opciones avanzadas y sin desbordes.');
 await browser.close();server.close();fs.rmSync(build,{recursive:true,force:true});
})().catch(e=>{console.error(e);process.exit(1)});
