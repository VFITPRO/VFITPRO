// Regression tests for the eight-week, five-day VFIT PRO mobile routine.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');

const html=fs.readFileSync(path.join(__dirname,'../overrides/rutina5/index.html'),'utf8');
const KEY='vfit-rutina-5dias-v1';
const errors=[];
function boot(data){
  const consoleEvents=new VirtualConsole();
  consoleEvents.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{
    url:'https://vfitpro.github.io/VFITPRO/rutina5/',
    runScripts:'dangerously',
    pretendToBeVisual:true,
    virtualConsole:consoleEvents,
    beforeParse(win){
      win.scrollTo=()=>{};
      if(data)win.localStorage.setItem(KEY,JSON.stringify(data));
    }
  });
  return {dom,w:dom.window,d:dom.window.document};
}
function click(element){assert(element,'Required button missing');element.click();}
const previous={week:1,day:0,data:{'upperA|w1|0':{kg:'60-60-55',reps:'8-8-7'}}};
const a=boot(previous);
const card=a.d.querySelector('.exercise');
assert(card,'First exercise missing');
assert.equal(card.querySelector('[data-f="kg"]').value,'60-60-55');
assert.equal(card.querySelector('[data-f="kg"]').getAttribute('inputmode'),'text');
assert.equal(card.querySelectorAll('.serieDone').length,3);
assert.equal(card.querySelector('.serieCount').textContent,'0 / 3 hechas');
assert.equal(card.querySelector('.restStart').getAttribute('aria-pressed'),'false');
// Direct countdown start is visible in the exercise and in the fixed timer.
click(card.querySelector('.restStart'));
assert.equal(a.d.getElementById('restTimer').hidden,false);
assert.equal(a.d.getElementById('restClock').textContent,'03:00');
assert.equal(card.querySelector('.restStart').textContent,'⏱ 03:00');
a.w.eval('restDeadline=Date.now()+1700;updateRestTimer()');
assert.equal(a.d.getElementById('restClock').textContent,'00:02');
a.w.eval('restDeadline=Date.now()-100;updateRestTimer()');
assert.equal(a.d.getElementById('restClock').textContent,'¡Listo!');
click(a.d.getElementById('restExtend'));
assert.equal(a.d.getElementById('restClock').textContent,'00:30');
// First completion persists and restarts appropriate countdown.
click(card.querySelectorAll('.serieDone')[0]);
assert.equal(card.querySelector('.serieCount').textContent,'1 / 3 hechas');
assert.equal(card.querySelectorAll('.serieDone')[0].getAttribute('aria-pressed'),'true');
assert.equal(a.d.getElementById('restClock').textContent,'03:00');
let saved=JSON.parse(a.w.localStorage.getItem(KEY));
assert.equal(saved.data['upperA|w1|0'].kg,'60-60-55');
assert.equal(saved.data['upperA|w1|0'].reps,'8-8-7');
assert.equal(saved.data['upperA|w1|0'].done[0],true);
click(card.querySelectorAll('.serieDone')[1]);
click(card.querySelectorAll('.serieDone')[2]);
assert.equal(card.querySelector('.serieCount').textContent,'3 / 3 hechas');
click(card.querySelectorAll('.serieDone')[1]);
assert.equal(card.querySelector('.serieCount').textContent,'2 / 3 hechas');
saved=JSON.parse(a.w.localStorage.getItem(KEY));
assert.equal(saved.data['upperA|w1|0'].done[1],false);
// Changing weeks does not leak set status or erase first week's data.
a.d.getElementById('week').value='2';
a.d.getElementById('week').dispatchEvent(new a.w.Event('change'));
assert.equal(a.d.querySelector('.serieCount').textContent,'0 / 3 hechas');
assert.equal(a.d.querySelector('[data-f="kg"]').value,'');
assert.equal(JSON.parse(a.w.localStorage.getItem(KEY)).data['upperA|w1|0'].done[0],true);
a.dom.window.close();
// Loading again restores the flags without modifying the old kg/reps fields.
const b=boot(saved);
assert.equal(b.d.querySelector('.serieCount').textContent,'2 / 3 hechas');
assert.equal(b.d.querySelector('[data-f="kg"]').value,'60-60-55');
click(b.d.querySelector('#days button:nth-child(2)'));
assert.equal(b.d.querySelector('.exercise').querySelectorAll('.serieDone').length,3);
assert.equal(b.d.querySelector('.serieCount').textContent,'0 / 3 hechas');
b.dom.window.close();
assert.deepEqual(errors,[]);
console.log('VFIT rutina5 PASS: countdown start/finish/extend, inline timing, per-set completion persistence, keyboard, and week separation.');
