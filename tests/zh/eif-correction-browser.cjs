const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const nativeScroll=require('./browser-scroll.cjs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const {readRhc}=await import('../../shared/js/rhc.js'),rows=readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8'));
 const expected={initial:{emp:.00346913930676823,model:0,theta:.08649885590233014},aipw:{emp:0,model:-.0034691393067671932,theta:.08996799520909782},half:{emp:.0017347710288478776,model:0,theta:.08823908791909243},tmle:{emp:0,model:0,theta:.08997972473530423}};
 const b=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1360,375]){
  const p=await b.newPage({viewport:{width,height:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const url=r.request().url();if(url.startsWith(new URL(base).origin+'/')||url.startsWith('data:'))return r.continue();external.push(url);return r.abort();});
  await p.goto(base+'/chapter-0-details.html?edition=correction-centres#chapter-0');const ch=p.locator('#chapter-0'),fig=ch.locator('[data-eif-correction][data-ec-mounted=true]');await fig.waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'initial document boundary');
  let originalG,originalQ,originalAY;
  for(const [key,oracle]of Object.entries(expected)){
   await fig.locator(`[data-ec-choice=${key}]`).focus();await p.keyboard.press('Enter');
   assert.equal(await fig.getAttribute('data-ec-stage'),key);assert.equal(await fig.locator('[data-ec-panel]:visible').count(),1);
   assert.equal(await fig.locator(`[data-ec-choice=${key}]`).getAttribute('aria-pressed'),'true');
   const panel=fig.locator(`[data-ec-panel=${key}]`);
   for(const [selector,value]of [['data-ec-empirical',oracle.emp],['data-ec-model',oracle.model],['data-ec-theta',oracle.theta]]){
    assert(Math.abs(Number(await panel.locator(`[${selector}]`).getAttribute(selector))-value)<1e-11,`${key} ${selector}`);
   }
   const patients=panel.locator('.ec-patients tbody tr');assert.equal(await patients.count(),6);
   const g=await patients.locator('[data-ec-cell=g]').evaluateAll(es=>es.map(e=>+e.dataset.value)),q=await patients.locator('[data-ec-cell=qa]').evaluateAll(es=>es.map(e=>+e.dataset.value));
   const ay=await patients.evaluateAll(es=>es.map(e=>e.children[1].textContent));
   assert.deepEqual(ay,rows.slice(0,6).map(r=>`${r.a} / ${r.y}`));
   for(let i=0;i<6;i++){
    const cells=await patients.nth(i).locator('[data-value]').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.dataset.ecCell,+e.dataset.value])));
    assert(Math.abs(cells.value-(cells.correction+cells.contrast-cells.theta))<1e-12);
   }
   if(key==='initial'){originalG=g;originalQ=q;originalAY=ay;}
   else {assert.deepEqual(g,originalG);assert.deepEqual(ay,originalAY);if(key==='aipw')assert.deepEqual(q,originalQ);else assert.notDeepEqual(q,originalQ);}
   const detail=panel.locator('details');await detail.locator('summary').focus();await p.keyboard.press('Enter');assert(await detail.evaluate(e=>e.open));assert.equal(await detail.locator('tbody tr').count(),4);
   const explanation=await detail.innerText();assert(explanation.includes('四项概率和为1.000000'));assert(explanation.includes('原第1人的实际A、Y'));
   for(const area of await panel.locator('.table-wrap,.diagram-scroll').all())await nativeScroll(p,area);
   assert.equal(await panel.locator('.ec-equation').evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${key} document boundary`);
   await panel.locator('h4').scrollIntoViewIfNeeded();await p.screenshot({path:`output/zh/playwright/correction-${key}-${width}.png`});
   await panel.locator('.ec-comparison').screenshot({path:`output/zh/playwright/correction-averages-${key}-${width}.png`});
   await panel.locator('.ec-versions').screenshot({path:`output/zh/playwright/correction-versions-${key}-${width}.png`});
  }
  const section=ch.getByRole('heading',{name:'5.4 为什么IF平均有时为零，有时能作为修正量？',exact:true});
  const counts=await section.evaluate(e=>{let equations=0,recalls=0;for(let n=e.nextElementSibling;n&&!n.matches('h3');n=n.nextElementSibling){if(n.classList.contains('equation'))equations++;if(n.classList.contains('formula-recall'))recalls++;}return {equations,recalls};});assert.deepEqual(counts,{equations:9,recalls:9});
  const recall=section.locator('xpath=following-sibling::*[contains(@class,"formula-recall")]').first();await recall.locator('.recall-trigger').focus();await p.keyboard.press('Enter');assert(await recall.locator('.recall-popover').isVisible());assert((await recall.innerText()).includes('初始'));await p.keyboard.press('Escape');
  await fig.locator('[data-ec-reset]').focus();await p.keyboard.press('Enter');assert.equal(await fig.getAttribute('data-ec-stage'),'initial');assert.equal(await fig.locator('details[open]').count(),0);
  assert((await fig.locator('.table-wrap,.diagram-scroll').evaluateAll(es=>es.map(e=>e.scrollLeft))).every(x=>x===0));
  await ch.locator('[data-lesson-language]').selectOption('r');assert.equal(await fig.locator('pre,code').count(),0);assert.equal(await fig.getAttribute('data-ec-stage'),'initial');
  await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 [data-eif-correction]').count(),0);await p.locator('nav [href="#chapter-0"]').click();assert.equal(await fig.getAttribute('data-ec-stage'),'initial');
  assert.equal(await fig.locator('.katex-error,[role=alert]').count(),0);assert(await fig.locator('math').count()>0);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await p.close();console.log(`PASS EIF correction ${width}px: four Q/centre versions, independently checked real RHC scalars, two averaging laws, unchanged A/Y/g, AIPW unchanged Q and TMLE changed Q, four-outcome law check, nine formula recalls, keyboard/reset/scrolling, maths-only, no overflow/errors/external requests`);
 }}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
