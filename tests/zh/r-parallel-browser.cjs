const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 fs.mkdirSync('output/zh/playwright',{recursive:true});
 for(const width of [1360,375]){
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(new URL(base).origin+'/')||url.startsWith('data:'))return route.continue();external.push(url);return route.abort();});
  await page.goto(base+'/chapter-0-details.html?edition=r-parallel#chapter-0');await page.locator('[data-full-mounted=true]').waitFor({state:'attached'});
  for(let number=0;number<=8;number++){
   await page.locator(`nav [href="#chapter-${number}"]`).click();const chapter=page.locator(`#chapter-${number}`);await chapter.waitFor({state:'visible'});
   assert.equal(await page.locator('.diagram-scroll-controls').count(),0);
   const language=chapter.locator('[data-lesson-language]');assert.equal(await language.count(),1);
   const julia=chapter.locator('[data-lesson-panel=julia]'),r=chapter.locator('[data-lesson-panel=r]');
   assert(await julia.isVisible(),`initial Julia panel chapter${number}`);assert(!await r.isVisible());
   const before=await chapter.locator('[data-object-stage] .ov-canvas [data-value]').evaluateAll(es=>es.map(e=>[e.dataset.object,e.dataset.value]));
   await language.selectOption('r');assert(await r.isVisible());assert(!await julia.isVisible());
   assert.equal(await chapter.getAttribute('data-code-language'),'r');assert(await r.locator('pre code.language-r').count()>0);
   assert((await r.innerText()).includes('Rscript --vanilla'));
   await r.locator('details > summary').last().focus();await page.keyboard.press('Enter');
   const explanations=r.locator('[data-r-line]');assert(await explanations.count()>10);
   assert(await explanations.first().isVisible());assert(await r.locator('math').count()>0);
   await page.keyboard.press('Enter');
   if(number===0){
    assert.equal(await chapter.locator('[name^=object-mode]').count(),0);
    assert.equal(await chapter.locator('[data-object-mode=math]').count(),5);
    assert.equal(await chapter.locator('.ov-canvas .ov-code,.ov-canvas [data-julia-name],.ov-canvas [data-r-name]').count(),0);
    assert.deepEqual(await chapter.locator('[data-object-stage] .ov-canvas [data-value]').evaluateAll(es=>es.map(e=>[e.dataset.object,e.dataset.value])),before);
    await chapter.locator('[data-object-stage=source]').screenshot({path:`output/zh/playwright/math-only-ch00-${width}.png`});
   }
   if(number===1){
    assert.equal(await chapter.locator('[name^=object-mode][value=r]').isChecked(),true);
    for(const fig of await chapter.locator('[data-object-stage]').all()){
     assert.equal(await fig.getAttribute('data-object-mode'),'r');const text=await fig.locator('.ov-canvas').textContent();
     assert(!/hcat|Float64|expit\.|\.\*|\.\-|Julia/.test(text),text.slice(0,100));assert.equal(await fig.locator('[data-code-language=r]').count(),1);
     for(const area of await fig.locator('.ov-expression-scroll:visible').all()){
      await area.locator('.ov-expression[data-vector-layout]').first().waitFor({state:'attached'});
      const report=await area.evaluate(el=>{const expression=el.firstElementChild,groups={patient:[],outcome:[]};for(const object of expression.querySelectorAll('.ov-object[data-alignment]')){if(object.closest('.ov-expression')!==expression)continue;const key=object.dataset.alignment;if(groups[key])groups[key].push([...object.querySelectorAll(key==='patient'?'[data-record]':'[data-outcome]')]);}let max=0;for(const sets of Object.values(groups))for(let i=0;i<(sets[0]?.length||0);i++){const ys=sets.filter(s=>s[i]).map(s=>s[i].getBoundingClientRect().top);max=Math.max(max,Math.max(...ys)-Math.min(...ys));}return{max,wrap:getComputedStyle(expression).flexWrap};});
      assert(report.max<.8);assert.equal(report.wrap,'nowrap');
     }
    }
    assert.deepEqual(await chapter.locator('[data-object-stage] .ov-canvas [data-value]').evaluateAll(es=>es.map(e=>[e.dataset.object,e.dataset.value])),before);
    const toolbar=chapter.locator('[data-object-toolbar]');await chapter.locator(`[data-object-stage=${number===0?'source':'weighted-mean'}]`).screenshot({path:`output/zh/playwright/r-objects-ch0${number}-${width}.png`});await toolbar.locator('[value=math]').check();
    assert.equal(await chapter.locator('[data-object-stage] .ov-code').count(),0);
    await toolbar.locator('[value=julia]').check();assert(await julia.isVisible());assert(!await r.isVisible());
    await toolbar.locator('[value=r]').check();assert(await r.isVisible());
    await toolbar.locator('[data-object-action=next]').click();assert((await toolbar.locator('.ov-status').innerText()).includes('7—12'));
    await toolbar.locator('[data-object-action=reset]').click();assert(await toolbar.locator('[value=math]').isChecked());
    if(number===1){await toolbar.locator('[value=r]').check();await toolbar.locator('[data-object-z]').selectOption('0');await toolbar.locator('[data-object-t]').fill('0');assert((await chapter.locator('[data-object-stage=change-rate]').innerText()).includes('未定义'));await toolbar.locator('[data-object-action=reset]').click();}
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(number===1)await r.screenshot({path:`output/zh/playwright/r-ch01-code-${width}.png`});
  }
  const chapter=page.locator('#chapter-8'),trace=chapter.locator('[data-rhc-full]');
  await trace.locator('[data-trace-stage="9"]').click();await trace.locator('[data-full-epsilon]').fill('0.003');await trace.locator('[data-full-epsilon]').dispatchEvent('change');
  const table=trace.locator('.trace-patient-table'),values=await table.locator('td[data-value]').evaluateAll(es=>es.map(e=>[e.dataset.traceKey,e.dataset.value]));
  await table.evaluate(el=>{window.rPersistentTable=el;});
  const epsilon=await trace.getAttribute('data-full-epsilon'),estimate=await trace.getAttribute('data-full-estimate');
  await trace.locator('[data-trace-language]').selectOption('julia');assert((await trace.locator('.trace-current-code').innerText()).includes('本步Julia'));
  await trace.locator('[data-trace-language]').selectOption('r');assert((await trace.locator('.trace-current-code').innerText()).includes('本步R'));
  assert.equal(await trace.getAttribute('data-full-epsilon'),epsilon);assert.equal(await trace.getAttribute('data-full-estimate'),estimate);
  assert(await table.evaluate(el=>el===window.rPersistentTable));assert.deepEqual(await table.locator('td[data-value]').evaluateAll(es=>es.map(e=>[e.dataset.traceKey,e.dataset.value])),values);
  assert.equal(await chapter.locator('[data-lesson-language]').inputValue(),'r');
  for(let step=0;step<10;step++){
   await trace.locator(`[data-trace-stage="${step}"]`).click();const code=trace.locator('.trace-current-code');
   assert(await code.locator('.trace-line-card').count()>0);assert(!/\.\*|\.\-|include\(|using \.RHCCase|@assert/.test(await code.textContent()));
   const symbol=trace.locator('.trace-formula button[data-trace-key]').last();const key=await symbol.getAttribute('data-trace-key');await symbol.focus();
   assert((await trace.locator('.trace-link-note').innerText()).includes('↔ R '+key),`step${step} ${key}: ${await trace.locator('.trace-link-note').innerText()}`);
   assert(await trace.locator(`.trace-current-code [data-trace-key="${key}"].trace-linked`).count()>0);
   await page.keyboard.press('Escape');
  }
  await trace.locator('[data-trace-stage="4"]').click();const offset=trace.locator('.trace-current-code button[data-trace-key=offset]').first();await offset.click();
  assert(await trace.locator('th[data-trace-column=offset]').evaluate(el=>el.classList.contains('trace-linked')));
  await page.keyboard.press('Escape');
  await trace.locator('.trace-current-code').screenshot({path:`output/zh/playwright/r-ch08-step-${width}.png`});
  await trace.locator('[data-full-action=solve]').click();assert(Math.abs(Number(await trace.getAttribute('data-full-estimate'))-.08997972473530443)<1e-10);
  assert(Math.abs(Number(await trace.getAttribute('data-full-score')))<1e-12);assert.equal(await trace.getAttribute('data-trace-language'),'r');
  await trace.locator('[data-full-action=reset]').click();assert.equal(await trace.getAttribute('data-trace-stage'),'0');assert.equal(await trace.getAttribute('data-full-epsilon'),'0');assert.equal(await trace.getAttribute('data-trace-language'),'r');
  await trace.locator('.trace-all-code > summary').click();assert((await trace.locator('.trace-all-code').innerText()).includes('查看完整R代码及逐行解释'));
  assert.equal(await trace.locator('.katex-error').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await page.close();
  console.log(`PASS R parallel ${width}px: nine language panels/line explanations/MathML, chapter-0 maths only, chapter-1 three object modes with identical data, paging/zero-step/reset, persistent TMLE table and all ten R steps, formula-column-code linking, solver, keyboard and overflow/console/offline`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
