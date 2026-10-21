const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.EIF_URL||'http://127.0.0.1:4174';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 fs.mkdirSync('output/zh/playwright',{recursive:true});
 for(const width of [1360,790,375]){
  const p=await browser.newPage({viewport:{width,height:950}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto(base+'/zh/?edition=concise-dr#chapter-0');
  const ch=p.locator('#chapter-0');await ch.waitFor({state:'visible'});
  assert.equal(await p.locator('.course-intro .reader-note').count(),0);
  assert.equal(await p.locator('.course-intro > p').first().innerText(),'EIF如何帮助我们估计处理效应？');
  await p.locator('.course-intro').screenshot({path:`output/zh/playwright/reading-cleanup-opening-${width}.png`});
  assert.equal(await ch.locator('h2').count(),5);assert.equal(await ch.locator('[data-dr-models],[data-dr-correction],[data-dr-routes]').count(),3);
  assert.equal(await ch.locator('pre,[data-lab],.lesson-language-control,.katex-error').count(),0);
  const q=await ch.locator('[data-dr-q-row]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
  const g=await ch.locator('[data-dr-g-row]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
  q.forEach((v,i)=>assert(Math.abs(v-g[i])<1,'Q and g preview rows align'));
  for(const [key,want] of [['initial',.08649885590233014],['correction-value',.00346913930676768],['aipw',.089967995209098],['tmle',.08997972473530443]])assert(Math.abs(Number(await ch.locator(`[data-dr-${key}]`).getAttribute(`data-dr-${key}`))-want)<1e-10);
  for(const area of await ch.locator('.dr-scroll').all()){
   if(await area.evaluate(e=>e.scrollWidth>e.clientWidth+1)){
    await area.scrollIntoViewIfNeeded();await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);
    assert(await area.evaluate(e=>e.scrollLeft>0),'keyboard scroll');await area.evaluate(e=>e.scrollLeft=0);
   }
  }
  const recall=ch.locator('.recall-trigger').first();await recall.focus();await p.keyboard.press('Enter');assert(await ch.locator('.recall-popover').first().isVisible());await p.keyboard.press('Escape');
  for(const key of ['models','correction','routes'])await ch.locator(`[data-dr-${key}]`).screenshot({path:`output/zh/playwright/concise-dr-${key}-${width}.png`});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');
  await ch.locator('h1').scrollIntoViewIfNeeded();await p.screenshot({path:`output/zh/playwright/concise-dr-top-${width}.png`});
  assert.equal(await ch.getByRole('link',{name:/补充阅读/}).count(),0);
  await p.goto(base+'/zh/chapter-0-details.html#chapter-0');
  await p.locator('#chapter-0[data-objects-mounted=true]').waitFor({state:'attached'});
  await p.locator('#chapter-0').waitFor({state:'visible'});
  assert.equal(await p.locator('#chapter-0 [data-tmle-overview]').count(),0,'supplement must contain the full preserved chapter without fragments of the main overview');
  assert.equal(await p.locator('#chapter-0 [data-lesson-language]').count(),1);
  await p.locator('#chapter-0 [data-lesson-language]').selectOption('r');assert(await p.locator('#chapter-0 [data-lesson-panel=r]').isVisible());
  await p.locator('a').filter({hasText:'返回精简导读'}).click();await p.locator('#chapter-0 [data-dr-models]').waitFor({state:'visible'});
  await p.locator('nav a[href="#chapter-1"]').click();await p.locator('#chapter-1[data-objects-mounted=true]').waitFor({state:'attached'});
  assert((await p.locator('#chapter-1').innerText()).includes('第0章最后留下了一个问题'));
  assert.equal(await p.locator('#chapter-1 [data-visual-id]').count(),18);
  assert.deepEqual(errors,[]);await p.close();console.log(`PASS concise intro ${width}px: three real-data figures, aligned rows, exact estimates, maths/popover, keyboard scroll, supplement/R-workbook round trip, chapter-1 handoff, no overflow or console errors`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
