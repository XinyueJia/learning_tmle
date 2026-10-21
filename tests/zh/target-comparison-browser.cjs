const {chromium}=require('playwright'),assert=require('node:assert/strict');
const nativeScroll=require('./browser-scroll.cjs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1360,375]){
 const p=await b.newPage({viewport:{width,height:950}}),errors=[],external=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await p.goto(base+'/chapter-0-details.html?edition=why-target-q#chapter-0');const ch=p.locator('#chapter-0'),fig=ch.locator('[data-target-comparison][data-tq-mounted=true]');await fig.waitFor();
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const means={initial:[.30176382259742274,.38826267849975415],aipw:[.30412885976038406,.394096854969483],tmle:[.3005830449692062,.39056276970451126]};
 for(const a of [1,0]){
  await fig.locator(`[data-tq-choice="${a}"]`).focus();await p.keyboard.press('Enter');
  assert.equal(await fig.getAttribute('data-tq-arm'),String(a));assert.equal(await fig.locator('[data-tq-panel]:visible').count(),1);
  assert.equal(await fig.locator(`[data-tq-choice="${a}"]`).getAttribute('aria-pressed'),'true');
  const panel=fig.locator(`[data-tq-panel="${a}"]`);
  for(const [key,risks]of Object.entries(means)){
   const vector=panel.locator(`[data-tq-object=${key}]`);assert.equal(await vector.locator('[data-tq-row]').count(),6);
   assert(Math.abs(Number(await vector.locator('[data-tq-arm-mean]').getAttribute('data-tq-arm-mean'))-risks[a])<1e-12);
   for(const accent of await vector.locator('header .katex svg').all())assert(await accent.evaluate(e=>e.getBoundingClientRect().height<10),'formula accents retain mathematical size');
   const footer=vector.locator('footer');assert(await footer.evaluate(e=>{const box=e.getBoundingClientRect();return [...e.children].every(c=>{const r=c.getBoundingClientRect();return r.top>=box.top&&r.bottom<=box.bottom+1&&r.left>=box.left&&r.right<=box.right+1;});}),'all reduction labels fit their footer');
   const actual=await vector.locator('.tq-row small').allTextContents();assert.deepEqual(actual,['i=1 · 原A=0, Y=0','i=2 · 原A=1, Y=0','i=3 · 原A=1, Y=0','i=4 · 原A=0, Y=0','i=5 · 原A=1, Y=1','i=6 · 原A=0, Y=0']);
   assert((await vector.locator('header').innerText()).includes(key==='aipw'?'供平均的贡献':'概率预测'));
   for(const row of await vector.locator('.tq-row').all()){
    const value=Number(await row.getAttribute('data-value'));if(key!=='aipw')assert(value>0&&value<1);
    const svg=row.locator('svg'),xExpected=12+(value+1)/3*216;
    if(key==='aipw'){
     const path=await svg.locator('.tq-dot path').getAttribute('d'),x=Number(path.match(/^M ([\d.e+-]+)/)[1]);assert(Math.abs(x-xExpected)<1e-9);assert(x>=12&&x<=228);
    }else assert(Math.abs(Number(await svg.locator('circle').getAttribute('cx'))-xExpected)<1e-9);
    assert.equal(await svg.locator('.tq-band').getAttribute('width'),'72');
   }
  }
  for(let i=1;i<=6;i++){const tops=await panel.locator(`[data-tq-row="${i}"]`).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert(Math.max(...tops)-Math.min(...tops)<1);}
  const contribution=panel.locator('[data-tq-object=aipw]');
  const chosen=a?[[2,-.1957527094804618],[5,1.8046933000675585]]:[[1,-.12377799052860222]];
  for(const [row,value]of chosen)assert(Math.abs(Number(await contribution.locator(`[data-tq-row="${row}"]`).getAttribute('data-value'))-value)<1e-12);
  assert.equal(await panel.locator('.tq-vectors').evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
  await nativeScroll(p,panel.locator('.diagram-scroll'));
  await panel.locator('h4').scrollIntoViewIfNeeded();await p.screenshot({path:`output/zh/playwright/why-target-q-arm${a}-${width}.png`});
  await panel.locator('.diagram-scroll').screenshot({path:`output/zh/playwright/why-target-q-vectors-arm${a}-${width}.png`});
 }
 for(const [key,expected]of [['aipw',.08996799520909893],['tmle',.08997972473530508]]){
  const route=fig.locator(`[data-tq-method=${key}]`);assert(Math.abs(Number(await route.locator('[data-tq-estimate]').getAttribute('data-tq-estimate'))-expected)<1e-12);
  const risk0=Number(await route.locator('[data-tq-risk0]').getAttribute('data-tq-risk0')),risk1=Number(await route.locator('[data-tq-risk1]').getAttribute('data-tq-risk1'));assert(risk0>=0&&risk0<=1&&risk1>=0&&risk1<=1);
  await nativeScroll(p,route.locator('.diagram-scroll'));assert.equal(await route.locator('.tq-equation').evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
  await route.screenshot({path:`output/zh/playwright/why-target-q-${key}-reduction-${width}.png`});
 }
 assert(Math.abs(Number(await fig.locator('[data-tq-updated-correction]').getAttribute('data-tq-updated-correction')))<1e-12);
 assert(Math.abs(Number(await fig.locator('[data-tq-updated-aipw]').getAttribute('data-tq-updated-aipw'))-.08997972473530508)<1e-12);
 const details=fig.locator('details');await details.locator('summary').focus();await p.keyboard.press('Enter');assert(await details.evaluate(e=>e.open));
 assert((await details.innerText()).includes('0.003547'));assert((await details.innerText()).includes('风险差的方程'));
 await fig.locator('[data-tq-reset]').focus();await p.keyboard.press('Enter');assert.equal(await fig.getAttribute('data-tq-arm'),'1');assert(!(await details.evaluate(e=>e.open)));
 assert((await fig.locator('.diagram-scroll').evaluateAll(es=>es.map(e=>e.scrollLeft))).every(x=>x===0));
 await ch.locator('[data-lesson-language]').selectOption('r');assert.equal(await fig.locator('pre,code').count(),0);assert.equal(await fig.getAttribute('data-tq-arm'),'1');
 const before=fig.locator('xpath=preceding-sibling::*[contains(@class,"formula-recall")][1]');await before.locator('.recall-trigger').focus();await p.keyboard.press('Enter');assert(await before.locator('.recall-popover').isVisible());assert((await before.innerText()).includes('expit'));await p.keyboard.press('Escape');
 const old=ch.locator('[data-eif-correction]');await old.locator('[data-ec-choice=aipw]').click();assert.equal(await fig.getAttribute('data-tq-arm'),'1');assert.equal(await old.getAttribute('data-ec-stage'),'aipw');
 await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 [data-target-comparison]').count(),0);await p.locator('nav [href="#chapter-0"]').click();assert.equal(await fig.getAttribute('data-tq-arm'),'1');
 assert.equal(await fig.locator('.katex-error,[role=alert]').count(),0);assert(await fig.locator('math').count()>0);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await p.close();console.log(`PASS why-target-Q ${width}px: same six RHC records, both arms, true Z contributions versus Q predictions, shared unclipped axis, independent arm means and risk differences, updated-Q AIPW identity, contrast-only targeting, row alignment, keyboard/reset/native scrolling, maths-only, no overflow/errors/external requests`);
 }}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
