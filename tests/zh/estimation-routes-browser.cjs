const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1360,375]){
 const p=await b.newPage({viewport:{width,height:950}}),errors=[],external=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await p.goto(base+'/chapter-0-details.html?edition=three-routes#chapter-0');await p.locator('#chapter-0[data-objects-mounted=true]').waitFor({state:'attached'});
 const ch=p.locator('#chapter-0'),fig=ch.locator('[data-estimation-routes]'),combo=ch.locator('[data-qg-combination]');
 assert.equal(await ch.locator('[name^=object-mode]').count(),0);assert.equal(await fig.getAttribute('data-selected-route'),'gcomp');
 const expected={gcomp:.073692119047307,ipw:.073692119047307,psm:188/2184};
 async function checkDiagram(panel){
  const expression=panel.locator('.er-expression').first();
  assert.equal(await expression.evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
  const vector=expression.locator('.er-vector').first(),cells=vector.locator('.er-row');
  const centre=await cells.evaluateAll(es=>(es[0].getBoundingClientRect().top+es.at(-1).getBoundingClientRect().bottom)/2);
  for(const arrow of await expression.locator(':scope>.er-arrow').all()){const y=await arrow.evaluate(e=>{const r=e.getBoundingClientRect();return(r.top+r.bottom)/2;});assert(Math.abs(y-centre)<1,`operator centre ${y} vs patient centre ${centre}`);}
  const tops=await expression.locator('.er-vector .er-row:first-of-type').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert(Math.max(...tops)-Math.min(...tops)<1);
  for(const header of await expression.locator('.er-vector header').all())assert(await header.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'header formula fits its object');
  await nativeScroll(p,expression.locator('..'));
 }
 for(const key of ['gcomp','ipw','psm']){
  await fig.locator(`[data-route-choice=${key}]`).focus();await p.keyboard.press('Enter');
  const panel=fig.locator(`[data-route-panel=${key}]`);assert(await panel.isVisible());assert.equal(await fig.locator('[data-route-panel]:visible').count(),1);
  assert.equal(await fig.getAttribute('data-selected-route'),key);assert.equal(await fig.locator(`[data-route-choice=${key}]`).getAttribute('aria-pressed'),'true');
  assert(Math.abs(Number(await panel.locator(`[data-route-result=${key}]`).getAttribute('data-value'))-expected[key])<1e-10);
  await checkDiagram(panel);
  if(key==='psm'){
   assert((await panel.innerText()).includes('1367'));const d=panel.locator('details');await d.locator('summary').focus();await p.keyboard.press('Enter');
   assert.equal(await d.locator('[data-route-pair]').count(),6);assert((await d.innerText()).includes('RHC行2与未RHC行4'));
   await d.locator('summary').focus();await p.keyboard.press('Enter');
  }
  await panel.screenshot({path:`output/zh/playwright/three-routes-${key}-${width}.png`});
 }
 await fig.locator('[data-route-reset]').focus();await p.keyboard.press('Enter');assert.equal(await fig.getAttribute('data-selected-route'),'gcomp');
 await fig.screenshot({path:`output/zh/playwright/three-routes-overview-${width}.png`});
 const stats={aipw:.089967995209098,tmle:.08997972473530443};
 for(const [key,value]of Object.entries(stats))assert(Math.abs(Number(await combo.locator(`[data-route-result=${key}]`).getAttribute('data-value'))-value)<1e-10);
 assert(Math.abs(Number(await combo.locator('[data-combination-correction]').getAttribute('data-combination-correction'))-.003469139306768)<1e-12);
 assert((await combo.locator('.er-context').innerText()).includes('调整集已从X扩大为W'));
 await checkDiagram(combo);
 for(const area of await combo.locator('.er-branch').all())await nativeScroll(p,area.locator('..'));
 const detail=combo.locator('details');await detail.locator('summary').focus();await p.keyboard.press('Enter');assert.equal(await detail.locator('[data-combination-row]').count(),6);
 const cells=await detail.locator('[data-combination-row="1"] td').allTextContents();assert.notEqual(cells[1],cells[2]);assert.notEqual(cells[3],cells[4]);
 await combo.screenshot({path:`output/zh/playwright/three-routes-combination-${width}.png`});
 await detail.locator('summary').focus();await p.keyboard.press('Enter');
 await ch.locator('[data-lesson-language]').selectOption('r');assert.equal(await ch.locator('[data-object-mode=math]').count(),5);
 assert.equal(await ch.locator('.er-visual pre,.er-visual code,.er-visual .katex-error').count(),0);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 .er-visual').count(),0);await p.locator('nav [href="#chapter-0"]').click();assert.equal(await fig.getAttribute('data-selected-route'),'gcomp');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await p.close();console.log(`PASS three routes ${width}px: real gcomp/IPW/PSM estimates and pair IDs, distinct target populations, keyboard selection/reset, data/operator alignment and native scrolling, full-W AIPW/TMLE correction positions, source-ordered updates, maths-only diagrams, no overflow/errors/external requests`);
 }}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
