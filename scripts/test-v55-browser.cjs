const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const build=fs.mkdtempSync(path.join(os.tmpdir(),'vfit-v55-'));
 const root=path.resolve(__dirname,'..');
 execFileSync('unzip',['-q',path.join(root,'VFIT_PRO_PREMIUM_V14.zip'),'-d',build]);fs.cpSync(path.join(root,'overrides'),build,{recursive:true});
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(build,pathname==='/'?'index.html':pathname);if(!file.startsWith(build+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));server.unref();
 const browser=await chromium.launch({headless:true,executablePath:process.env.VFIT_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let row;const uid='33333333-3333-4333-8333-333333333333';
 await page.route('https://*.supabase.co/**',async route=>{
  const req=route.request(),url=req.url();let data={};
  if(url.includes('/token'))data={access_token:Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:uid,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature',refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user:{id:uid,email:'qa@example.com',user_metadata:{name:'Víctor Pineda'}}};
  else if(url.includes('vfit_user_data')){if(req.method()==='GET')data=row?[row]:[];else{row=req.postDataJSON();data=[{updated_at:row.updated_at}];}}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('#accountEmail').fill('qa@example.com');await page.locator('#accountPassword').fill('test-password');await page.locator('#accountForm button[type=submit]').click();
 await page.waitForFunction(()=>document.body.classList.contains('account-ready'));await page.waitForFunction(()=>!!window.VFITUiV55);
 await page.evaluate(()=>{progress.history.unshift({title:'Día 1',timestamp:Date.now(),date:new Date().toLocaleDateString('es-ES'),volume:100,sets:3,duration:600,exercises:[]});persist();show('home');});

 /* Inicio */
 assert(await page.locator('#uiHome').isVisible());
 assert.equal((await page.locator('#uiHello').textContent()).trim(),'Hola, Víctor 👋');
 assert.match(await page.locator('#uiRingTitle').textContent(),/^1 de \d sesiones$/);
 assert(!await page.locator('#home .hero').isVisible());
 assert.match(await page.locator('#uiNextTitle').textContent(),/^Día 1 · /);
 /* Accesos rápidos */
 await page.locator('.uiQuick [data-go=progress]').click();assert.equal(await page.evaluate(()=>document.querySelector('.screen.active').id),'progress');
 await page.evaluate(()=>show('home'));await page.locator('.uiQuick [data-go=library]').click();
 assert.equal(await page.evaluate(()=>document.querySelector('.screen.active').id),'routines');
 assert.equal(await page.locator('#uxTabs-routines [data-choice=library]').getAttribute('aria-pressed'),'true');
 /* Rutinas y día */
 await page.locator('#uxTabs-routines [data-choice=days]').click();
 assert.equal((await page.locator('#routineDays .dayCard .cardTitle').first().textContent()).trim(),'Pecho y Tríceps');
 assert.match(await page.locator('#routineDays .dayCard .cardSub').first().textContent(),/^Día 1 · /);
 await page.locator('#routineDays .dayCard').first().click();
 assert.equal((await page.locator('#dayTitle').textContent()).trim(),'Pecho y Tríceps');assert(!await page.locator('#day .dayHero').isVisible());
 /* Ejercicio: indicaciones visibles sin desplegar nada */
 await page.locator('#exerciseList .exerciseCard').first().click();
 assert(await page.locator('#tech').isVisible());assert.equal((await page.locator('#tech').locator('xpath=ancestor::div[contains(@class,"panel")][1]/h2').textContent()).trim(),'Indicaciones');
 /* Perfil */
 await page.locator('.bottomNav [data-s=profile]').click();
 assert.equal((await page.locator('#uiProfileName').textContent()).trim(),'Víctor Pineda');assert.equal((await page.locator('#uiAvatar').textContent()).trim(),'V');
 for(const width of [320,390,768]){await page.setViewportSize({width,height:900});for(const id of ['home','routines','day','exercise','progress','profile']){await page.evaluate(i=>show(i),id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${id} ${width}`);}}
 assert.deepEqual(errors,[]);
 console.log('V55 PASS: inicio con saludo, anillo semanal y acceso al próximo entrenamiento, accesos rápidos, rutinas, detalle, indicaciones, perfil y sin desbordes.');
 await browser.close();server.close();fs.rmSync(build,{recursive:true,force:true});
})().catch(e=>{console.error(e);process.exit(1)});
