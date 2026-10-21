const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.EIF_URL||'http://127.0.0.1:4174';
(async()=>{
 const {readRhc}=await import('../../shared/js/rhc.js');
 const Y=readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8')).map(r=>r.y);
 const mu=Y.reduce((a,b)=>a+b,0)/Y.length;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const width of [1360,375]){
  const p=await browser.newPage({viewport:{width,height:1000}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(base+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/zh/chapter-0-details.html?edition=glm-score#chapter-0');
  for(const chapter of [0,1]){
   if(chapter)await p.locator('nav a[href="#chapter-1"]').click();
   const article=p.locator('#chapter-'+chapter),fig=article.locator(`[data-gs-visual="${chapter}"]`);
   await fig.waitFor({state:'visible'});assert.equal(await article.locator('.katex-error').count(),0);
   for(const field of chapter?['scoreBeta','ifLogit','ifMean']:['y','ifMean']){
    const cells=fig.locator(`[data-gs-field="${field}"]`);assert.equal(await cells.count(),6);
    for(let i=0;i<6;i++){
     const expected=field==='y'?Y[i]:field==='ifLogit'?(Y[i]-mu)/(mu*(1-mu)):Y[i]-mu;
     assert(Math.abs(Number(await cells.nth(i).getAttribute('data-value'))-expected)<1e-10);
    }
   }
   const rowHeights=await fig.locator('[data-gs-row]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
   assert(rowHeights.every(x=>x===40),'patient rows stay aligned');
   assert.equal(await fig.locator('pre,code,[data-julia-name],[data-r-name]').count(),0);
   const scroll=fig.locator('.gs-scroll');await scroll.scrollIntoViewIfNeeded();await scroll.focus();
   assert(await scroll.evaluate(e=>e.scrollWidth>e.clientWidth));
   await p.keyboard.press('ArrowRight');await p.waitForTimeout(250);
   assert(await scroll.evaluate(e=>e.scrollLeft>0),'native keyboard horizontal scrolling works');
   await scroll.evaluate(e=>e.scrollLeft=0);
   await fig.screenshot({path:`output/zh/playwright/glm-score-ch${chapter}-${width}.png`});
   await scroll.evaluate(e=>e.scrollLeft=e.scrollWidth);
   const last=chapter?fig.locator('.gs-vector').last():fig.locator('.gs-branches');
   const edge=await scroll.boundingBox(),end=await last.boundingBox();
   assert(end.x+end.width<=edge.x+edge.width+1,'last object is reachable inside the scroll region');
   await fig.screenshot({path:`output/zh/playwright/glm-score-ch${chapter}-end-${width}.png`});
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no page-wide overflow');
  }
  const c1=p.locator('#chapter-1');
  const derivative=c1.locator('.equation').filter({has:p.locator('annotation').filter({hasText:'\\ell(\\beta;y)'})});
  assert.equal(await derivative.count(),1);
  const recall=derivative.locator('xpath=following-sibling::*[1]');
  await recall.locator('.recall-trigger').focus();await p.keyboard.press('Enter');
  assert(await recall.locator('.recall-popover').isVisible());await p.keyboard.press('Escape');
  await c1.locator('summary').filter({hasText:'展开答案与参数化补充'}).click();
  const parameter=c1.locator('details').filter({has:p.locator('summary').filter({hasText:'展开答案与参数化补充'})});
  assert(await parameter.locator('.equation').isVisible());
  const pair=c1.locator('[data-gs-visual="pairing"]');
  assert(Math.abs(Number(await pair.locator('[data-gs-pairing]').getAttribute('data-gs-pairing'))-mu*(1-mu))<1e-12);
  assert.equal(await pair.locator('[data-gs-support]').count(),6);
  await pair.screenshot({path:`output/zh/playwright/glm-score-pairing-${width}.png`});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log(`PASS GLM score ${width}px: actual RHC rows/targets, path pairing, formula rendering/recall, technical expansion, aligned rows, keyboard scrolling, maths-only figures, layout/console/offline`);
  await p.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
