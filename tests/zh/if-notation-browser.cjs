const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const {readRhc}=await import('../../shared/js/rhc.js'),rows=readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8'));
 const mu=rows.reduce((s,row)=>s+row.y,0)/rows.length;
 const browser=await chromium.launch({channel:'chrome',headless:true});try{
 for(const width of [1360,375]){
  const p=await browser.newPage({viewport:{width,height:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/chapter-0-details.html?edition=if-notation#chapter-0');const chapter=p.locator('#chapter-0'),fig=chapter.locator('[data-ifn-visual][data-ifn-mounted=true]');await fig.waitFor();
  const order=await chapter.evaluate(el=>{
   const nodes=[...el.querySelectorAll('*')];
   return ['[data-ifn-visual]','[data-ie-visual]','[data-qg-combination]','[data-eif-correction]','[data-target-comparison]'].map(sel=>nodes.indexOf(el.querySelector(sel)));
  });
  assert(order.every((position,i)=>position>=0&&(!i||position>order[i-1])),'mean calls → mean error → risk-difference correction → fitted laws → AIPW/TMLE comparison');
  const supplement=chapter.locator('details').filter({has:p.getByText('符号补充：从已知的y，到随机变量Y和一列输出',{exact:true})});
  assert.equal(await supplement.count(),1);assert(!await supplement.evaluate(e=>e.open));
  await supplement.locator('summary').focus();await p.keyboard.press('Enter');assert(await supplement.evaluate(e=>e.open));
  assert((await supplement.innerText()).includes('realisation'));assert(await supplement.locator('math').count()>0);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded notation stays in viewport');
  await supplement.locator('summary').focus();await p.keyboard.press('Enter');
  await chapter.getByRole('heading',{name:'5.1 把同一条规则用到每位患者',exact:true}).scrollIntoViewIfNeeded();
  await p.screenshot({path:`output/zh/playwright/ch00-narrative-calls-${width}.png`});
  await chapter.getByRole('heading',{name:'5.3 回到RHC风险差：把Q与g接起来',exact:true}).scrollIntoViewIfNeeded();
  await p.screenshot({path:`output/zh/playwright/ch00-narrative-return-${width}.png`});

  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'initial page boundary');
  const recap=chapter.locator('details').filter({has:p.getByText('回看一般符号：将均值例子接回§4的IF写法',{exact:true})});assert.equal(await recap.count(),1);assert(!await recap.evaluate(e=>e.open));
  assert(await recap.evaluate(e=>e.previousElementSibling.hasAttribute('data-ifn-visual')),'table recap follows worked example');
  for(const y of [0,1]){
   const branch=fig.locator(`[data-ifn-outcome="${y}"]`);assert.equal(Number(await branch.getAttribute('data-ifn-output')),y-mu);
   assert.equal(Number(await branch.getAttribute('data-ifn-probability')),rows.filter(row=>row.y===y).length/rows.length);
  }
  const branchText=await fig.locator('.ifn-branches').innerText();
  for(let i=1;i<=6;i++){
   const input=fig.locator(`[data-ifn-vector=outcome] [data-ifn-row="${i}"]`),output=fig.locator(`[data-ifn-vector=value] [data-ifn-row="${i}"]`);
   assert.equal(Number(await input.getAttribute('data-ifn-value')),rows[i-1].y);assert.equal(Number(await output.getAttribute('data-ifn-value')),rows[i-1].y-mu);
   assert(Math.abs(Number(await output.locator('b').innerText())-(rows[i-1].y-mu))<.0000006);
   const ys=await fig.locator(`[data-ifn-row="${i}"]`).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));assert(Math.max(...ys)-Math.min(...ys)<1);
  }
  await fig.locator('[data-ifn-select]').selectOption('5');assert(await fig.locator('[data-ifn-equation="5"]').isVisible());assert((await fig.locator('[data-ifn-equation="5"]').innerText()).includes('0.665562'));
  assert(await fig.locator('[data-ifn-row="5"]').evaluateAll(es=>es.every(e=>e.classList.contains('ifn-selected'))));assert.equal(await fig.locator('.ifn-branches').innerText(),branchText);
  await fig.locator('[data-ifn-reset]').focus();await p.keyboard.press('Enter');assert.equal(await fig.locator('[data-ifn-select]').inputValue(),'1');assert(await fig.locator('[data-ifn-equation="1"]').isVisible());
  for(const area of await fig.locator('.diagram-scroll').all()){
   const flow=area.locator(':scope > div');assert.equal(await flow.evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
   await nativeScroll(p,area);
  }
  await fig.screenshot({path:`output/zh/playwright/if52-notation-${width}.png`});
  await recap.locator('summary').focus();await p.keyboard.press('Enter');assert(await recap.locator('table').isVisible());assert.equal(await recap.locator('tbody tr').count(),5);assert(await recap.locator('math').count()>0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded recap stays in viewport');const recapArea=recap.locator('.table-wrap');await nativeScroll(p,recapArea);await recap.screenshot({path:`output/zh/playwright/if52-recap-${width}.png`});await recap.locator('summary').focus();await p.keyboard.press('Enter');
  assert(await fig.locator('math').count()>0);assert.equal(await fig.locator('pre,code').count(),0);
  await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 [data-ifn-visual]').count(),0);await p.locator('nav [href="#chapter-0"]').click();assert.equal(await fig.locator('[data-ifn-select]').inputValue(),'1');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await p.close();console.log(`PASS IF5.1 notation ${width}px: concrete-to-symbol order, fixed branch probabilities, observed outcomes/values, row alignment, selection/reset, collapsed recap/MathML, keyboard scroll, chapter isolation, no overflow/errors/external requests`);
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
