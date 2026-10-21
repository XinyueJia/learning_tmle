const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
fs.mkdirSync('output/zh/playwright',{recursive:true});for(const width of [1360,375]){
 const p=await browser.newPage({viewport:{width,height:900}}),errors=[],external=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await p.goto(base+'/?edition=real-rhc#chapter-0');await p.locator('#chapter-0').waitFor({state:'visible'});
 assert.equal(await p.locator('article').count(),9);assert((await p.locator('.public-data-notice').innerText()).includes('5735'));
 for(let n=0;n<=8;n++){
  await p.locator(`nav [href="#chapter-${n}"]`).click();const ch=p.locator(`#chapter-${n}`);await ch.waitFor({state:'visible'});
  assert.equal(await ch.locator('h1').count(),1);assert((await ch.innerText()).includes('RHC'));
  if(n===0){assert.equal(await ch.locator('[data-dr-models],[data-dr-correction],[data-dr-routes]').count(),3);assert.equal(await ch.locator('.katex-error,[role=alert]').count(),0);continue;}
  assert.equal(await ch.locator('[data-case-mounted=true]').count(),1);assert(await ch.locator('math').count()>0);
  assert.equal(await ch.locator('.katex-error,.error,[role=alert]').count(),0);
  assert.equal(await ch.locator('.course-visual,.rhc-julia').count(),0,'no empty visual/Julia placeholders');
  const lab=ch.locator('[data-lab]');assert(await lab.locator('.results').innerText());
  const first=lab.locator('input[type=range]:visible').first();if(await first.count()){
   const original=await first.inputValue();await first.focus();await first.press('ArrowRight');assert.notEqual(await first.inputValue(),original);await lab.locator('.reset').click();assert.equal(await first.inputValue(),original);
  }else await lab.locator('.reset').click();
  const detail=ch.locator('details:visible').last();assert(!(await detail.evaluate(e=>e.open)));await detail.locator('summary').focus();await p.keyboard.press('Enter');assert(await detail.evaluate(e=>e.open));await p.keyboard.press('Enter');assert(!(await detail.evaluate(e=>e.open)));
  const recall=ch.locator('.recall-trigger').first();if(await recall.count()){await recall.click();assert(await ch.locator('.recall-popover').first().isVisible());await p.keyboard.press('Escape');}
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await ch.locator('h1').scrollIntoViewIfNeeded();await p.screenshot({path:`output/zh/playwright/rhc-ch${n}-${width}.png`});
 }
 await p.locator('nav [href="#chapter-1"]').click();const c1=p.locator('#chapter-1');assert.equal(await c1.locator('[data-visual-id]').count(),18);assert((await c1.locator('#visual-sample').innerText()).includes('1918'));
 for(const fig of await c1.locator('[data-visual-id]').all()){if(await fig.isVisible())assert(await fig.evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
 const window=c1.locator('#visual-survival-window');const svgpoints=await window.locator('svg circle').evaluateAll(es=>es.map(e=>+e.getAttribute('cx')));assert(svgpoints.every(x=>x>=0&&x<=360));await window.screenshot({path:`output/zh/playwright/rhc-window-${width}.png`});
 await c1.locator('#visual-centering-proof').screenshot({path:`output/zh/playwright/rhc-centering-${width}.png`});
 const guide=c1.getByText('逐行解释：输入、运算与输出',{exact:true});await guide.click();assert(await c1.getByRole('heading',{name:'代码第19行',exact:true}).isVisible());assert((await c1.innerText()).includes('逐个相减'));
 await p.locator('nav [href="#chapter-8"]').click();const c8=p.locator('#chapter-8'),coarse=c8.locator('[data-case-study="8"]');
 await coarse.locator('[data-case-action=step]').click();await coarse.locator('[data-case-action=solve]').click();assert.equal(await coarse.locator('.case-status').innerText(),'');assert((await coarse.innerText()).includes('7.369'));
 const full=c8.locator('[data-rhc-full]');assert.equal(await full.getAttribute('data-full-n'),'5735');
 const initial=Number(await full.getAttribute('data-full-estimate'));assert(Math.abs(initial-.08649885590233014)<1e-9);
 await full.locator('[data-full-epsilon]').fill('0.003');await full.locator('[data-full-epsilon]').dispatchEvent('change');assert(Number(await full.getAttribute('data-full-score'))>0);
 await full.locator('[data-full-epsilon]').fill('0.004');await full.locator('[data-full-epsilon]').dispatchEvent('change');assert(Number(await full.getAttribute('data-full-score'))<0);
 await full.locator('[data-full-action=step]').click();await full.locator('[data-full-action=solve]').click();assert(Math.abs(Number(await full.getAttribute('data-full-score')))<1e-10);assert(Math.abs(Number(await full.getAttribute('data-full-estimate'))-.08997972473530443)<1e-9);
 await full.screenshot({path:`output/zh/playwright/rhc-full-solved-${width}.png`});await full.locator('[data-full-action=reset]').click();assert.equal(await full.locator('[data-full-epsilon]').inputValue(),'0');assert.equal(Number(await full.getAttribute('data-full-estimate')),initial);
 await p.goto(base+'/public-data.html');assert((await p.locator('h1').innerText()).includes('SUPPORT/RHC'));const csv=await p.request.get(base+'/../shared/data/public/rhc/source.csv');assert.equal((await csv.body()).length,2320412);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await p.close();console.log(`PASS RHC all9chapters ${width}px: maths/18figures/Julia, experiments/reset, recall/answers, coarse+full manual+autoTMLE, source bytes, layout/console/offline`);
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
