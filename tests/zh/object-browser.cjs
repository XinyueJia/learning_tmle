const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const {readRhc,prepareRhc}=await import('../../shared/js/rhc.js');
 const rows=readRhc(fs.readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows);
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const width of [1360,375]){
  const p=await browser.newPage({viewport:{width,height:900}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/chapter-0-details.html?edition=object-grammar#chapter-0');
  const c0=p.locator('#chapter-0'),c1=p.locator('#chapter-1');
  await c0.locator('[data-object-toolbar]').waitFor();await p.locator('#chapter-0[data-objects-mounted=true]').waitFor({state:'attached'});
  assert.equal(await c0.locator('[data-object-stage]').count(),5);
  const select=c0.locator('[data-object-stage=select]');
  async function verifySelection(start){
   for(let i=start;i<start+6;i++){
    const qa=select.locator(`[data-object=qa] [data-record="${i+1}"]`);
    const expected=rows[i].a?fit.q1[i]:fit.q0[i];
    assert(Math.abs(Number(await qa.locator('b').innerText())-expected)<.0000006);
    assert((await qa.getAttribute('class')).includes(`ov-from-q${rows[i].a}`));
    const heights=await select.locator(`[data-record="${i+1}"]`).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
    assert(heights.every(h=>h===36),'same patient cells keep equal row heights');
   }
  }
  await verifySelection(0);
  const originalRD=await c0.locator('[data-object=initial-risk]').getAttribute('data-value');
  await c0.locator('[data-object-action=next]').focus();await p.keyboard.press('Enter');
  await verifySelection(6);assert((await c0.locator('.ov-status').innerText()).includes('7—12'));
  assert.equal(await c0.locator('[data-object=initial-risk]').getAttribute('data-value'),originalRD);
  assert((await c0.locator('#object-0-predict figcaption').innerText()).includes('7—12'));
  await c0.locator('[data-object-selected]').selectOption('9');
  assert(await select.locator('[data-object=qa] [data-record="9"]').evaluate(e=>e.classList.contains('ov-row-selected')));
  const actualA=await select.locator('[data-object=treatment-vector]').innerText();
  await c0.locator('[data-object-scenario]').selectOption('zero');
  assert.equal(await c0.locator('#object-0-predict [data-object=q0]').count(),1);
  assert.equal(await select.locator('[data-object=treatment-vector]').innerText(),actualA);
  assert.equal(await c0.locator('[name^=object-mode]').count(),0);
  for(const language of ['r','julia']){
   await c0.locator('[data-lesson-language]').selectOption(language);
   assert.equal(await c0.locator('[data-object-mode=math]').count(),5);
   assert.equal(await c0.locator('.ov-canvas .ov-code,.ov-canvas [data-julia-name],.ov-canvas [data-r-name]').count(),0);
   assert.equal(await c0.locator('[data-object-scenario]').inputValue(),'zero');
   assert.equal(await c0.locator('[data-object-selected]').inputValue(),'9');
   await verifySelection(6);
   assert.equal(await c0.locator('[data-object=initial-risk]').getAttribute('data-value'),originalRD);
  }
  await c0.locator('[data-object-action=reset]').click();
  assert.equal(await c0.locator('[data-object-scenario]').inputValue(),'one');
  assert.equal(await c0.locator('[data-object-selected]').inputValue(),'1');
  assert.equal(await c0.locator('[data-object-mode=math]').count(),5);
  const fitDetails=c0.locator('details').filter({has:p.locator('[data-object-stage=fit]')});
  await fitDetails.locator('summary').first().click();
  const extra=c0.locator('.ov-extra-fit');await extra.locator('summary').click();
  assert(await extra.locator('[data-object=propensity]').isVisible());assert((await extra.innerText()).includes('5735 × 1'));
  await extra.locator('summary').click();await fitDetails.locator('summary').first().click();
  for(const stage of ['source','predict','select','estimate'])await c0.locator(`#object-0-${stage}`).screenshot({path:`output/zh/playwright/object-ch00-${stage}-${width}.png`});
  await p.locator('nav [href="#chapter-1"]').click();await p.locator('#chapter-1[data-objects-mounted=true]').waitFor({state:'attached'});
  assert.equal(await c1.locator('[data-object-stage]').count(),13);assert.equal(await c1.locator('[data-visual-id]').count(),18);
  const limitEquation=c1.locator('.equation').filter({has:p.locator('annotation').filter({hasText:'\\lim_{t\\to0}'})});
  assert.equal(await limitEquation.count(),1,'general z difference quotient is fully rendered');
  const recall=limitEquation.locator('xpath=following-sibling::*[1]');
  assert(await recall.evaluate(el=>el.classList.contains('formula-recall')));
  await recall.locator('.recall-trigger').focus();await p.keyboard.press('Enter');
  assert(await recall.locator('.recall-popover').isVisible());assert((await recall.innerText()).includes('0/0未定义'));await p.keyboard.press('Escape');
  await c1.locator('h1').scrollIntoViewIfNeeded();await p.screenshot({path:`output/zh/playwright/ch01-narrative-opening-${width}.png`});
  await limitEquation.scrollIntoViewIfNeeded();await p.screenshot({path:`output/zh/playwright/ch01-narrative-quotient-${width}.png`});

  const sample=c1.locator('#visual-sample'),prob=c1.locator('#visual-distribution');
  assert.equal(await sample.locator('[data-object=events]').getAttribute('data-value'),'1918');
  assert.equal(await prob.locator('[data-record]').count(),0);assert.equal(await prob.locator('[data-object=probability] [data-outcome]').count(),2);
  assert.equal(await prob.locator('[data-object=probability]').getAttribute('data-dim'),'2 × 1');
  const t=c1.locator('[data-object-t]');await t.focus();await t.press('Home');
  assert.equal(await t.inputValue(),'0');assert(await c1.locator('#visual-rate [data-quotient=undefined]').isVisible());
  assert.equal(Number(await c1.locator('#visual-mean-change [data-object=mean-delta]').getAttribute('data-value')),0);
  await t.press('End');assert.equal(await t.inputValue(),'1');
  assert.equal(Number(await c1.locator('#visual-mean-change [data-object=new-risk]').first().getAttribute('data-value')),1);
  await c1.locator('[data-object-z]').selectOption('0');
  assert.equal(Number(await c1.locator('#visual-mean-change [data-object=new-risk]').first().getAttribute('data-value')),0);
  const old=Number(await c1.locator('[data-object=old-d-new-mean]').getAttribute('data-value'));
  assert(Math.abs(old+1918/5735)<1e-14);assert(Math.abs(Number(await c1.locator('[data-object=new-d-new-mean]').getAttribute('data-value')))<1e-14);
  const firstInfluence=await c1.locator('#visual-random-influence [data-object=influence] [data-record="1"] b').innerText();
  assert(Math.abs(Number(firstInfluence)-(rows[0].y-1918/5735))<.0000006);
  await c1.locator('[data-object-action=next]').click();
  assert.equal(await sample.locator('[data-object=events]').getAttribute('data-value'),'1918');assert.equal(await sample.locator('[data-record="7"]').count(),1);
  await c1.locator('input[value=julia][name^=object-mode]').check();assert.equal(await c1.locator('[data-object-mode=julia]').count(),13);
  await c1.locator('[data-object-action=reset]').click();assert.equal(await t.inputValue(),'0.1');assert.equal(await c1.locator('[data-object-z]').inputValue(),'1');
  assert.equal(await c0.locator('[data-object-mode=math]').count(),5,'chapter state remains separate');
  const worked=sample.locator('.ov-worked-reference');await worked.locator('summary').first().focus();await p.keyboard.press('Enter');assert(await worked.evaluate(e=>e.open));await p.keyboard.press('Enter');
  const guide=c1.getByText('逐行解释：输入、运算与输出',{exact:true});await guide.click();
  const line=c1.locator('[data-julia-line="19"]');assert((await line.innerText()).includes('Vector{Float64}'));assert.equal(await line.locator('[data-direction=input]').count(),2);assert.equal(await line.locator('[data-direction=output]').count(),1);
  assert(await c1.getByRole('heading',{name:'代码第19行',exact:true}).isVisible());await guide.click();
  for(const id of ['sample','distribution','replacement','rate','random-influence','centering-proof','reference-distribution']){
   const fig=c1.locator('#visual-'+id);assert(await fig.evaluate(e=>e.scrollWidth<=e.clientWidth+1),id+' no figure overflow');await fig.screenshot({path:`output/zh/playwright/object-ch01-${id}-${width}.png`});
  }
  const dupe=await p.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});assert.deepEqual(dupe,[]);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await c1.locator('.katex-error,[role=alert]').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await p.close();console.log(`PASS object grammar ${width}px: real-row provenance, dimensions, fixed row height, 2-row probabilities, complete reductions, keyboard/pagination/modes/reset, t0/t1/z0/z1, old/new IF, Julia cards, local resources and layout`);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
