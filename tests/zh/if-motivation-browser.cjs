const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const {readRhc,prepareRhc}=await import('../../shared/js/rhc.js'),rows=readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows);
 const mu=rows.reduce((s,r)=>s+r.y,0)/rows.length,p0=1-mu;
 const b=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1360,375]){
  const p=await b.newPage({viewport:{width,height:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/chapter-0-details.html?edition=why-if#chapter-0');const fig=p.locator('[data-im-visual][data-im-mounted=true]');await fig.waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'initial boundary');
  assert(Math.abs(Number(await fig.locator('[data-im-gcomp]').getAttribute('data-im-gcomp'))-fit.initialEstimate)<1e-12);
  for(const a of [0,1]){const mean=fit['q'+a].reduce((s,q)=>s+q,0)/rows.length;assert(Math.abs(parseFloat(await fig.locator(`[data-im-risk="${a}"]`).innerText())-100*mean)<.000051);}
  const truth=await fig.locator('.im-truth').innerText(),point=await fig.locator('.im-point').innerText(),fixed=await fig.locator('[data-im-vector=fixed]').innerText(),input=fig.locator('[data-im-delta]');
  async function check(delta){
   assert.equal(await fig.getAttribute('data-im-valid'),'true');
   assert(Math.abs(parseFloat(await fig.locator('[data-im-new="0"]').innerText())-100*(p0-delta))<.000051);
   assert(Math.abs(parseFloat(await fig.locator('[data-im-new="1"]').innerText())-100*(mu+delta))<.000051);
   assert(Math.abs(Number(await fig.locator('[data-im-exact]').innerText())-delta)<.0000006);assert(Math.abs(Number(await fig.locator('[data-im-paired]').innerText())-delta)<.0000006);
   for(const y of [0,1]){const weight=y?delta:-delta,d=y-mu;assert(Math.abs(Number(await fig.locator(`[data-im-weights="${y}"]`).innerText())-weight)<.0000006);assert(Math.abs(Number(await fig.locator(`[data-im-terms="${y}"]`).innerText())-weight*d)<.0000006);}
   assert.equal(Number(await fig.locator('[data-im-prob-sum]').innerText()),1);assert.equal(await fig.locator('.im-truth').innerText(),truth);assert.equal(await fig.locator('.im-point').innerText(),point);assert.equal(await fig.locator('[data-im-vector=fixed]').innerText(),fixed);
  }
  await check(.01);await fig.screenshot({path:`output/zh/playwright/why-if-positive-${width}.png`});
  await fig.locator('[data-im-action=negative]').focus();await p.keyboard.press('Enter');await check(-.01);
  for(const delta of [0,.1,-.1]){await input.fill(String(delta));await check(delta);}
  await fig.locator('[data-im-action=lower]').click();await check(-mu);await fig.locator('[data-im-action=upper]').click();await check(p0);
  const slider=fig.locator('[data-im-slider]');await slider.focus();await slider.press('Home');await check(-mu);await slider.press('End');await check(p0);
  for(const bad of ['', '1', '-1']){await input.fill(bad);assert.equal(await fig.getAttribute('data-im-valid'),'false');assert(await fig.locator('[role=alert]').isVisible());assert.equal(await fig.locator('[data-im-paired]').innerText(),'—');}
  await fig.locator('[data-im-action=reset]').focus();await p.keyboard.press('Enter');await check(.01);assert.equal(await fig.locator('[role=alert]').count(),0);
  const pair=fig.locator('.im-pairing');for(const y of [0,1]){const tops=await pair.locator(`[data-im-y="${y}"]`).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert(Math.max(...tops)-Math.min(...tops)<1);}
  for(const area of await fig.locator('.diagram-scroll').all()){
   assert.equal(await area.locator(':scope > div').evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');await nativeScroll(p,area);
  }
  await fig.screenshot({path:`output/zh/playwright/why-if-final-${width}.png`});
  assert(await fig.locator('math').count()>0);assert.equal(await fig.locator('pre,code').count(),0);
  const recap=p.locator('#chapter-0 details').filter({has:p.getByText('回看一般写法：固定什么，一次输入什么？',{exact:true})});await recap.locator('summary').focus();await p.keyboard.press('Enter');assert((await recap.innerText()).includes('同一个常数'));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await recap.locator('summary').focus();await p.keyboard.press('Enter');
  await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 [data-im-visual]').count(),0);await p.locator('nav [href="#chapter-0"]').click();await check(.01);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await p.close();console.log(`PASS whyIF section4 ${width}px: real gcomp, unknown fixed target, probabilities +/- transfer and endpoints, fixed old D, pairing/direct equality, invalid input/reset, row alignment/keyboard scrolling, recap, no overflow/errors/external requests`);
 }}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
