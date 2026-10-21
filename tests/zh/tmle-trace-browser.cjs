const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const {readRhc,prepareRhc}=await import('../../shared/js/rhc.js');const {tmleTrace}=await import('../../shared/js/tmle-trace.js');const {activeColumns,TRACE_STEPS,traceStepCode}=await import('../../zh/src/tmle-trace-view.js');
 const fit=prepareRhc(readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8'))),map=JSON.parse(fs.readFileSync('zh/src/julia/ch08-trace.json','utf8'));
 const b=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1360,375]){
  const p=await b.newPage({viewport:{width,height:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/?edition=tmle-trace#chapter-8');const root=p.locator('[data-rhc-full]');await root.locator('select[data-trace-row]').waitFor();await p.locator('[data-trace-mounted=true]').waitFor({state:'attached'});
  const patientTable=root.locator('.trace-patient-table'),firstRow=patientTable.locator('tbody tr').first();
  await patientTable.evaluate(e=>e.dataset.identity='same-table');await firstRow.evaluate(e=>e.dataset.identity='same-first-row');
  assert.equal(await patientTable.locator('th[data-trace-column]').count(),2);assert.equal(await root.getAttribute('data-full-n'),'5735');
  await root.locator('.trace-table-scroll').screenshot({path:`output/zh/playwright/trace-original-${width}.png`});
  const originalA=await patientTable.locator('tbody td[data-trace-key=a]').allTextContents(),originalY=await patientTable.locator('tbody td[data-trace-key=y]').allTextContents();
  for(let stage=1;stage<10;stage++){
   await root.locator('[data-trace-action=next]').focus();await p.keyboard.press('Enter');
   assert.equal(await root.getAttribute('data-trace-stage'),String(stage));assert.equal(await patientTable.getAttribute('data-identity'),'same-table');assert.equal(await firstRow.getAttribute('data-identity'),'same-first-row');
   assert.deepEqual(await patientTable.locator('th[data-trace-column]').evaluateAll(es=>es.map(e=>e.dataset.traceColumn)),activeColumns(stage));
   assert.equal(await root.locator('.trace-current-code [data-trace-code-line]').count(),traceStepCode(map,stage).length);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await root.locator('button[data-trace-stage="4"]').click();const input=root.locator('[data-full-epsilon]');
  await input.fill('0.003');await input.dispatchEvent('change');assert.equal(await root.locator('.full-status').innerText(),'');
  assert.equal(await root.getAttribute('data-trace-stage'),'4');
  const offsetSymbol=root.locator('.trace-formula button[data-trace-key=offset]');await offsetSymbol.hover();
  assert(await patientTable.locator('th[data-trace-column=offset]').evaluate(e=>e.classList.contains('trace-linked')));
  assert(await root.locator('.trace-current-code pre button[data-trace-key=offset]').first().evaluate(e=>e.classList.contains('trace-linked')));
  await offsetSymbol.focus();assert(await patientTable.locator('td[data-trace-key=offset]').first().evaluate(e=>e.classList.contains('trace-linked')));
  await offsetSymbol.click();await root.locator('.trace-formula button[data-trace-key=h]').hover();
  assert(await offsetSymbol.evaluate(e=>e.classList.contains('trace-linked')),'tap locks selected symbol despite hovering another');
  await p.keyboard.press('Escape');assert.equal(await root.locator('.trace-linked').count(),0);
  await root.locator('.trace-row-path').screenshot({path:`output/zh/playwright/trace-path-${width}.png`});
  await root.locator('.trace-step-content').screenshot({path:`output/zh/playwright/trace-formula-${width}.png`});
  await root.locator('select[data-trace-row]').selectOption('2');assert.equal(await patientTable.locator('tr.trace-selected-row').getAttribute('data-trace-row'),'2');assert((await root.locator('.trace-row-path').innerText()).includes('i=2'));
  await root.locator('button[data-trace-stage="9"]').click();
  async function verifyRows(start,epsilon){
   const expected=tmleTrace(fit,epsilon,{start,count:6});
   for(const person of expected.shown)for(const key of activeColumns(9)){
    const cell=patientTable.locator(`tbody tr[data-trace-row="${person.row}"] td[data-trace-key="${key}"]`);
    assert(Math.abs(Number(await cell.getAttribute('data-value'))-person[key])<1e-12,`${key} actual RHC row${person.row}`);
   }
   for(const person of expected.shown){const q=person.a?person.qstar1:person.qstar0;assert(Math.abs(person.qstar_a-q)<1e-14);}
  }
  await verifyRows(0,.003);
  assert.deepEqual(await patientTable.locator('tbody td[data-trace-key=a]').allTextContents(),originalA);assert.deepEqual(await patientTable.locator('tbody td[data-trace-key=y]').allTextContents(),originalY);
  assert.equal(await patientTable.locator('tbody td[data-trace-key=q0][data-changed=true]').count(),0);assert.equal(await patientTable.locator('tbody td[data-trace-key=qstar0][data-changed=true]').count(),6);
  const estimateBefore=await root.getAttribute('data-full-estimate'),scoreBefore=await root.getAttribute('data-full-score');
  await root.locator('[data-trace-action=next-rows]').click();await verifyRows(6,.003);assert.equal(await root.getAttribute('data-full-estimate'),estimateBefore);assert.equal(await root.getAttribute('data-full-score'),scoreBefore);
  assert((await root.locator('.trace-window').innerText()).includes('7—12'));
  await input.fill('-0.002');await input.dispatchEvent('change');await verifyRows(6,-.002);assert.equal(await root.locator('.full-status').innerText(),'');
  await input.fill('0.003');await input.dispatchEvent('change');assert(Number(await root.getAttribute('data-full-score'))>0);
  await input.fill('0.004');await input.dispatchEvent('change');assert(Number(await root.getAttribute('data-full-score'))<0);
  await input.fill('');await input.dispatchEvent('change');assert((await root.locator('.full-status').innerText()).includes('合法状态'));assert.equal(await root.getAttribute('data-full-epsilon'),'0.004');
  await input.fill('0');await input.dispatchEvent('change');assert.equal(await root.locator('.full-status').innerText(),'');
  await root.locator('[data-full-action=step]').click();assert((await root.locator('.full-results').innerText()).includes('已二分1步'));
  await root.locator('[data-full-action=solve]').click();assert.equal(await root.locator('.full-status').innerText(),'');
  const solved=Number(await root.getAttribute('data-full-epsilon'));assert(Math.abs(solved-.003576966662876657)<1e-12);assert(Math.abs(Number(await root.getAttribute('data-full-score')))<1e-12);assert(Math.abs(Number(await root.getAttribute('data-full-estimate'))-.08997972473530443)<1e-12);assert((await root.locator('.full-results').innerText()).includes('TMLE代入估计'));
  await verifyRows(6,solved);
  const scroll=root.locator('.trace-table-scroll');await scroll.evaluate(el=>{el.scrollLeft=el.querySelector('[data-trace-column=qstar0]').offsetLeft-70;});
  await scroll.screenshot({path:`output/zh/playwright/trace-table-${width}.png`});
  await root.locator('.full-results').screenshot({path:`output/zh/playwright/trace-summary-${width}.png`});
  const formal=root.locator('.trace-formal');await formal.locator('summary').focus();await p.keyboard.press('Enter');assert(await formal.locator('math').isVisible());assert(await formal.locator('annotation[encoding="application/x-tex"]').count());
  const all=root.locator('.trace-all-code');await all.locator(':scope > summary').click();assert.equal(await all.locator('[data-trace-code-line]').count(),40);assert((await all.locator(':scope > pre code').innerText()).includes('offset = logit.(qa)'));
  assert.equal(await all.locator(':scope > pre code').textContent(),fs.readFileSync('zh/julia/tmle_trace.jl','utf8'));
  await root.locator('[data-full-action=reset]').click();assert.equal(await input.inputValue(),'0');assert.equal(await root.getAttribute('data-trace-stage'),'0');assert.equal(await patientTable.locator('th[data-trace-column]').count(),2);assert.equal(await root.locator('select[data-trace-row]').inputValue(),'1');assert.equal(await scroll.evaluate(e=>e.scrollLeft),0);
  // A variable in the complete code guide can reveal its later column, without altering arithmetic.
  const future=all.locator(':scope > pre button[data-trace-key=offset1]').first();await future.click();assert.equal(await root.getAttribute('data-trace-stage'),'7');assert(await patientTable.locator('th[data-trace-column=offset1]').evaluate(e=>e.classList.contains('trace-linked')));
  await p.keyboard.press('Escape');await root.locator('[data-full-action=reset]').click();
  assert.equal(await root.locator('[role=alert],.katex-error').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.close();console.log(`PASS Chapter8 trace ${width}px: same DOM table/rows, 10 cumulative steps, all26 real columns, both-arm updates, formula-column-Julia hover/focus/tap/Escape, numeric signs/solver/invalid input, paging/reset, editable MathML, all40 source lines, no overflow/errors/external requests`);
 }}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
