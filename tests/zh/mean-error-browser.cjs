const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const {readRhc}=await import('../../shared/js/rhc.js'),rows=readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8')),Y=rows.map(r=>r.y),mu=Y.reduce((s,y)=>s+y,0)/Y.length;
 const b=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1360,375]){
  const p=await b.newPage({viewport:{width,height:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/chapter-0-details.html?edition=mean-error#chapter-0');const chapter=p.locator('#chapter-0'),fig=chapter.locator('[data-ie-visual][data-ie-mounted=true]');await fig.waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'initial boundary');
  const comparison=chapter.locator('[data-oe-visual]');await comparison.waitFor();
  assert.equal(Number(await comparison.locator('[data-oe-outcome]').getAttribute('data-oe-outcome')),Y[Y.indexOf(1)]);
  assert(Math.abs(Number(await comparison.locator('[data-oe-fitted]').getAttribute('data-oe-fitted'))-mu)<1e-12);
  assert(Math.abs(Number(await comparison.locator('[data-oe-residual]').getAttribute('data-oe-residual'))-(1-mu))<1e-12);
  assert.equal(await comparison.locator('[data-oe-error]').innerText(),'未知');
  assert.equal(await comparison.locator('pre,code').count(),0);
  for(const lane of await comparison.locator('.oe-scroll').all()){
   await nativeScroll(p,lane);await lane.evaluate(e=>e.scrollLeft=0);
   const heights=await lane.locator('.oe-box').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
   assert(Math.max(...heights)-Math.min(...heights)<1,'parallel subtraction boxes align');
  }
  await comparison.screenshot({path:`output/zh/playwright/ols-error-comparison-${width}.png`});
  for(const lane of await comparison.locator('.oe-scroll').all())await lane.evaluate(e=>e.scrollLeft=e.scrollWidth);
  await comparison.screenshot({path:`output/zh/playwright/ols-error-comparison-end-${width}.png`});

  const population=await fig.locator('[data-ie-population]').innerText(),observed=await fig.locator('.ie-outcomes').innerText(),risk=await fig.locator('[data-ie-sample-risk]').innerText();
  assert(population.includes('未知'));assert(risk.includes('33.4438%'));assert.equal(await fig.getAttribute('data-ie-mode'),'population');assert((await fig.locator('.ie-average').innerText()).includes('数值未知'));
  for(let i=1;i<=6;i++){
   assert.equal(Number(await fig.locator(`.ie-outcomes [data-ie-row="${i}"]`).getAttribute('data-ie-y')),Y[i-1]);
   const tops=await fig.locator(`[data-ie-row="${i}"]`).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert(Math.max(...tops)-Math.min(...tops)<1);
  }
  const mode=fig.locator('[data-ie-mode]'),reference=fig.locator('[data-ie-reference]');
  const inference=fig.locator('[data-ie-inference]'),inferenceText=await inference.innerText();
  const events=Y.filter(y=>y===1).length,n=Y.length,expectedSE=Math.sqrt(events*(n-events)/(n*n*(n-1)));
  assert(Math.abs(Number(await fig.locator('[data-ie-standard-error]').getAttribute('data-ie-standard-error'))-expectedSE)<1e-12);
  assert(Math.abs(Number(await fig.locator('[data-ie-sum-squares]').getAttribute('data-ie-sum-squares'))-events*(n-events)/n)<2e-10);
  assert((await inference.innerText()).includes('iid抽样模型'));
  assert((await fig.innerText()).includes('实际只使用现有这一批资料'));
  if(width===1360)assert(await inference.locator('..').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'complete standard-error calculation fits desktop');
  await inference.screenshot({path:`output/zh/playwright/mean-error-spread-${width}.png`});
  const spreadScroll=inference.locator('..');await spreadScroll.evaluate(e=>e.scrollLeft=e.scrollWidth);
  await spreadScroll.screenshot({path:`output/zh/playwright/mean-error-standard-error-${width}.png`});
  await spreadScroll.evaluate(e=>e.scrollLeft=0);
  await mode.selectOption('empirical');assert((await fig.locator('.ie-contributions').innerText()).includes('OLS残差'));assert((await fig.locator('[data-ie-status]').innerText()).includes('估计IF'));assert(Math.abs(Number(await fig.locator('[data-ie-sample-average]').innerText()))<1e-8);
  assert(Number(await fig.locator('[data-ie-sample-value]').nth(4).innerText())>0,'zero average is not zero per-person values');
  for(let i=0;i<6;i++)assert(Math.abs(Number(await fig.locator('[data-ie-sample-value]').nth(i).innerText())-(Y[i]-mu))<.0000006);
  await fig.screenshot({path:`output/zh/playwright/mean-error-empirical-${width}.png`});
  await mode.selectOption('assumed');
  for(const m of [.3,.4,0,1]){
   await reference.fill(String(m));assert.equal(await fig.getAttribute('data-ie-valid'),'true');
   assert(Math.abs(Number(await fig.locator('[data-ie-distance]').innerText())-(mu-m))<.0000006);
   for(let i=0;i<6;i++)assert(Math.abs(Number(await fig.locator(`[data-ie-assumed-value="${i}"]`).innerText())-(Y[i]-m))<.0000006);
   assert.equal(await inference.innerText(),inferenceText);assert.equal(await fig.locator('[data-ie-population]').innerText(),population);assert.equal(await fig.locator('.ie-outcomes').innerText(),observed);assert.equal(await fig.locator('[data-ie-sample-risk]').innerText(),risk);
  }
  for(const invalid of ['', '-.1','1.1']){await reference.fill(invalid);assert.equal(await fig.getAttribute('data-ie-valid'),'false');assert(await fig.locator('[role=alert]').isVisible());assert.equal(await fig.locator('[data-ie-distance]').innerText(),'—');}
  await reference.fill('.3');assert.equal(await fig.locator('[role=alert]').count(),0);await fig.screenshot({path:`output/zh/playwright/mean-error-assumed-${width}.png`});
  await fig.locator('[data-ie-reset]').focus();await p.keyboard.press('Enter');assert.equal(await mode.inputValue(),'population');assert.equal(await reference.inputValue(),'0.3');assert(!await reference.isVisible());assert((await fig.locator('.ie-average').innerText()).includes('数值未知'));
  for(const area of await fig.locator('.diagram-scroll').all()){
   assert.equal(await area.locator(':scope > div').evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
   if(width===1360&&await area.locator('.ie-flow').count())assert(await area.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'complete averaging flow fits desktop');await nativeScroll(p,area);
  }
  await fig.screenshot({path:`output/zh/playwright/mean-error-unknown-${width}.png`});
  const between=await fig.evaluate(e=>{const result=[];for(let node=e.nextElementSibling;node&&!node.matches('h3');node=node.nextElementSibling)result.push({tag:node.tagName,className:node.className});return result;});assert.equal(between.filter(r=>r.className==='equation').length,4);assert.equal(between.filter(r=>r.className==='formula-recall').length,4);
  const nextRecall=fig.locator('xpath=following-sibling::*[contains(@class,"formula-recall")]').first();await nextRecall.locator('.recall-trigger').focus();await p.keyboard.press('Enter');assert(await nextRecall.locator('.recall-popover').isVisible());assert((await nextRecall.innerText()).includes('分配律'));await p.keyboard.press('Escape');
  assert.equal(await chapter.locator('.katex-error,[role=alert]').count(),0);assert(await fig.locator('math').count()>0);assert.equal(await fig.locator('pre,code').count(),0);
  await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 [data-ie-visual]').count(),0);await p.locator('nav [href="#chapter-0"]').click();assert.equal(await mode.inputValue(),'population');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await p.close();console.log(`PASS OLS/mean-error5.2 ${width}px: per-person residual versus target error, new comparison graphic, unknown P0, real Pn, full-n averages, iid SE from independent count oracle, fixed spread under assumed centres, empirical zero versus nonzero individual values, assumed references0/1/signs, invalid input/reset, exact derivation callbacks, row alignment/keyboard scrolling, no overflow/errors/external requests`);
 }}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
