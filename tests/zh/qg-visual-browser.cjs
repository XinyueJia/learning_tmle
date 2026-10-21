const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const {readRhc,prepareRhc,HISTORY}=await import('../../shared/js/rhc.js');
 const rows=readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows);
 const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const width of [1360,375]){
  const p=await browser.newPage({viewport:{width,height:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/chapter-0-details.html?edition=qg-patients#chapter-0');const fig=p.locator('[data-qg-visual][data-qg-mounted=true]');await fig.waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'initial page boundary');
  assert.equal(await p.locator('article').count(),9);assert.equal(await p.locator('#chapter-0 [data-object-stage]').count(),5);
  const source=fig.locator('[data-qg-source]');const initial=await source.innerText();
  for(let i=0;i<6;i++){
   for(const key of ['a','y'])assert.equal(Number(await source.locator(`[data-qg-column=${key}] [data-qg-row="${i+1}"]`).getAttribute('data-qg-value')),rows[i][key]);
   const w=await source.locator(`[data-qg-column=w] [data-qg-row="${i+1}"]`).innerText();assert(w.includes(rows[i].age.toFixed(1)));assert(w.includes(rows[i].race));
   for(const key of ['q1','q0','g']){
    const cell=fig.locator(`[data-qg-compare] [data-qg-column=${key}] [data-qg-row="${i+1}"]`);
    assert(Math.abs(Number(await cell.getAttribute('data-qg-value'))-fit[key][i])<1e-14);
   }
  }
  for(const key of ['q1','q0','g']){
   await fig.locator('[data-qg-mode]').selectOption(key);const panel=fig.locator(`[data-qg-call=${key}]`);assert(await panel.isVisible());
   assert.equal(await panel.locator('[data-qg-column=w]').count(),1);
   assert.equal(await panel.locator('[data-qg-column=a],[data-qg-column=y]').count(),0);
   assert.equal(await panel.locator('[data-qg-column=prediction-a]').count(),key==='g'?0:1);
   if(key!=='g')for(const cell of await panel.locator('[data-qg-column=prediction-a] [data-qg-value]').all())assert.equal(Number(await cell.getAttribute('data-qg-value')),key==='q1'?1:0);
   assert.equal(await source.innerText(),initial,'fixed original observations');
   assert.equal(await fig.locator(`[data-qg-comparison=${key}].qg-active-output`).count(),1);
   const strip=panel.locator('.qg-strip');assert.equal(await strip.evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
   for(let i=1;i<=6;i++){
    const tops=await panel.locator(`[data-qg-row="${i}"]`).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert(Math.max(...tops)-Math.min(...tops)<1,'same patient row alignment');
   }
   const geometry=await panel.evaluate(el=>{const first=el.querySelector('[data-qg-column=w] .qg-row').getBoundingClientRect(),all=[...el.querySelectorAll('[data-qg-column=w] .qg-row')],last=all.at(-1).getBoundingClientRect(),model=el.querySelector('.qg-model').getBoundingClientRect();return{modelHeight:model.height,modelCentre:(model.top+model.bottom)/2,rowCentre:(first.top+last.bottom)/2};});
   assert.equal(geometry.modelHeight,150);assert(Math.abs(geometry.modelCentre-geometry.rowCentre)<2,'function box centred on patient rows');
   const area=panel.locator('.diagram-scroll');await nativeScroll(p,area);
   await panel.screenshot({path:`output/zh/playwright/qg-call-${key}-${width}.png`});
  }
  await fig.locator('[data-qg-select-row]').selectOption('4');
  assert(await source.locator('[data-qg-row="4"]').first().evaluate(e=>e.classList.contains('qg-selected-row')));
  assert(await fig.locator('[data-qg-compare] [data-qg-row="4"]').evaluateAll(es=>es.every(e=>e.classList.contains('qg-selected-row'))));
  const history=fig.locator('.qg-history');await history.locator('summary').focus();await p.keyboard.press('Enter');assert(await history.evaluate(e=>e.open));
  const detail=await history.locator('[data-qg-row="4"]').innerText();for(let j=0;j<12;j++)assert(detail.includes(HISTORY[j]+'='+rows[3].history[j]));
  await history.locator('summary').focus();await p.keyboard.press('Enter');
  const fitDetail=fig.locator('.qg-fit-context');await fitDetail.locator('summary').focus();await p.keyboard.press('Enter');assert((await fitDetail.innerText()).includes('5735'));await fitDetail.locator('summary').focus();await p.keyboard.press('Enter');
  await fig.locator('[data-qg-reset]').focus();await p.keyboard.press('Enter');assert.equal(await fig.locator('[data-qg-mode]').inputValue(),'q1');assert.equal(await fig.locator('[data-qg-select-row]').inputValue(),'1');
  await fig.screenshot({path:`output/zh/playwright/qg-full-${width}.png`});
  assert(await fig.locator('math').count()>0);assert.equal(await fig.locator('pre,code').count(),0);
  await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 [data-qg-visual]').count(),0);await p.locator('nav [href="#chapter-0"]').click();assert.equal(await fig.locator('[data-qg-mode]').inputValue(),'q1');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await p.close();console.log(`PASS Q/g real patients ${width}px: preserved W/A/Y, fixed calls, all 18 fitted values, input column roles, row alignment/highlighting, history, reset, MathML, local keyboard scrolling and no overflow/errors/external requests`);
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
