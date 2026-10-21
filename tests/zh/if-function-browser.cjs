const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const width of [1360,375]){
  const p=await browser.newPage({viewport:{width,height:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/chapter-0-details.html?edition=if-input-output#chapter-0');
  const c0=p.locator('#chapter-0'),fig=c0.locator('[data-if-function][data-if-mounted=true]');await fig.waitFor();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'initial page stays within viewport before any local scrolling');
  assert.equal(await c0.locator('[data-object-stage]').count(),5);
  const qg=c0.locator('.table-wrap').filter({hasText:'结局回归（outcome regression）'});
  assert.equal(await qg.count(),1);assert.equal(await qg.locator('tbody tr').count(),2);
  assert((await qg.innerText()).includes('处理机制（treatment mechanism）'));
  assert(await qg.locator('math').count()>0);
  assert.equal(await qg.getAttribute('tabindex'),'0');
  const beforeFunctional=await qg.evaluate(e=>{const equations=[...document.querySelectorAll('#chapter-0 .equation')];return e.compareDocumentPosition(equations[1])&Node.DOCUMENT_POSITION_FOLLOWING;});assert(beforeFunctional);
  assert(await qg.locator('table').evaluate(e=>e.getBoundingClientRect().width>=1060));
  assert(await qg.locator('td .inline-math').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height<40)),'Q/g formulas stay on one line');
  await nativeScroll(p,qg);
  await qg.screenshot({path:`output/zh/playwright/q-g-first-use-${width}.png`});
  const fixed=await fig.locator('.if-context').innerText(),input=fig.locator('[data-if-input]');
  assert(fixed.includes('5735'));assert(fixed.includes('1918'));assert(fixed.includes('3817'));
  async function check(y){
   const result=fig.locator(`[data-if-result="${y}"]`);assert(await result.isVisible());
   assert(!await fig.locator(`[data-if-result="${1-y}"]`).isVisible());
   assert(Math.abs(Number(await result.locator('[data-if-number]').getAttribute('data-if-number'))-(y-1918/5735))<1e-14);
   assert.equal(await result.locator('.if-flow').evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
   const cards=await result.locator('.if-cell').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{top:r.top,height:r.height,left:r.left};}));
   assert.equal(cards.length,3);assert(Math.max(...cards.map(c=>c.top))-Math.min(...cards.map(c=>c.top))<1);
   assert(Math.max(...cards.map(c=>c.height))-Math.min(...cards.map(c=>c.height))<1);
   assert(cards.every((c,i)=>!i||c.left>cards[i-1].left));
   const area=result.locator('.diagram-scroll');await nativeScroll(p,area);
   assert.equal(await fig.locator('.if-context').innerText(),fixed);
   assert(await result.locator('math').count()>0);
  }
  await check(0);await input.selectOption('1');assert.equal(await input.inputValue(),'1');await check(1);
  await fig.locator('[data-if-reset]').focus();await p.keyboard.press('Enter');assert.equal(await input.inputValue(),'0');await check(0);
  const recall=c0.locator('.formula-recall').filter({hasText:'存活概率改变'});
  assert(await recall.count()>0);
  await fig.screenshot({path:`output/zh/playwright/if-input-output-${width}.png`});
  await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 [data-if-function]').count(),0);
  await p.locator('nav [href="#chapter-0"]').click();assert.equal(await input.inputValue(),'0');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await c0.locator('.katex-error').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await p.close();console.log(`PASS Chapter 0 IF input/output ${width}px: real RHC values, fixed context, keyboard calls/reset, MathML, aligned no-wrap flow, local scroll and isolated chapter`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
