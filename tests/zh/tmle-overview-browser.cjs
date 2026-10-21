const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.EIF_URL||'http://127.0.0.1:4174';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 fs.mkdirSync('output/zh/playwright',{recursive:true});
 for(const width of [1360,375]){
  const p=await browser.newPage({viewport:{width,height:950}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto(base+'/zh/?edition=tmle-overview#chapter-0');const root=p.locator('[data-tmle-overview]');await root.locator('[data-to-panel="0"]').waitFor({state:'visible'});
  assert.equal(await root.getAttribute('data-to-mounted'),'true');
  const count=[6,10,11,14,15,16];
  for(let step=0;step<6;step++){
   await root.locator(`[data-to-go="${step}"]`).focus();await p.keyboard.press('Enter');
   assert.equal(await root.getAttribute('data-to-step'),String(step));assert.equal(await root.locator('[data-to-panel]:visible').count(),1);
   assert.equal(await root.locator('.to-table thead th:visible').count(),count[step]);
   assert.equal(await root.locator('[data-to-patient]').count(),6);
   const recall=root.locator(`[data-to-panel="${step}"] .recall-trigger`).first();await recall.focus();await p.keyboard.press('Enter');assert(await root.locator('.recall-popover:visible').count()===1);await p.keyboard.press('Escape');
   assert.equal(await root.locator('pre,code,.katex-error').count(),0);
   if(step<4)assert(await root.locator('[data-to-status] .katex').count()>0,'dynamic status preserves mathematical rendering');
   if(step===1||step===2)assert(await root.locator('[data-to-table-note] .katex').count()>0,'dynamic table note preserves mathematical rendering');
   const rawSymbols=await root.evaluate(el=>{
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),found=[];
    while(walker.nextNode()){
     const node=walker.currentNode;
     if(node.parentElement.closest('.katex,template,script,style'))continue;
     if(/(?<![A-Za-z])[QgHWAYin](?![A-Za-z])|[εĝ₀ₙ]|\\widehat|\$/.test(node.textContent))found.push(node.textContent);
    }
    return found;
   });
   assert.deepEqual(rawSymbols,[],'symbols outside math rendering');
   if(step===1){
    const bridge=root.locator('[data-to-ipw-bridge]');assert(await bridge.isVisible());
    for(const branch of ['weight','outcome','residual'])assert.equal(await bridge.locator(`[data-to-ipw-${branch}-row]`).count(),6);
    for(let i=1;i<=6;i++){
     const tops=await Promise.all(['weight','outcome','residual'].map(branch=>bridge.locator(`[data-to-ipw-${branch}-row="${i}"]`).evaluate(e=>e.getBoundingClientRect().top)));
     assert(Math.max(...tops)-Math.min(...tops)<1,'same patient row must align across both operations');
    }
    assert(Math.abs(Number(await bridge.locator('[data-to-ipw-average]').getAttribute('data-to-ipw-average'))-.08908907950951162)<1e-12);
    assert.equal(Number(await bridge.locator('[data-to-ipw-outcome]').first().getAttribute('data-to-ipw-outcome')),0);
    assert(Number(await bridge.locator('[data-to-ipw-residual]').first().getAttribute('data-to-ipw-residual'))>0);
    for(const area of await bridge.locator('.to-scroll').all()){
     if(await area.evaluate(e=>e.scrollWidth>e.clientWidth+1)){await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);assert(await area.evaluate(e=>e.scrollLeft>0));await area.evaluate(e=>e.scrollLeft=0);}
    }
    await bridge.screenshot({path:`output/zh/playwright/tmle-ipw-bridge-${width}.png`});
    const algebra=root.locator('[data-to-eif-aipw]');assert(await algebra.isVisible());
    assert.equal(await algebra.locator('[data-to-eif-row]').count(),2);
    for(const row of await algebra.locator('[data-to-eif-row]').all()){
     const c=Number(await row.locator('[data-to-eif-c]').getAttribute('data-to-eif-c'));
     const delta=Number(await row.locator('[data-to-eif-contrast]').getAttribute('data-to-eif-contrast'));
     const centre=Number(await row.locator('[data-to-eif-centre]').getAttribute('data-to-eif-centre'));
     const d=Number(await row.locator('[data-to-eif-output]').getAttribute('data-to-eif-output'));
     assert(Math.abs(c+delta-centre-d)<1e-12);assert(Math.abs(c-d)>1e-3);
    }
    assert(Math.abs(Number(await algebra.locator('[data-to-eif-centred-average]').getAttribute('data-to-eif-centred-average')))<1e-12);
    assert(Math.abs(Number(await algebra.locator('[data-to-eif-average]').getAttribute('data-to-eif-average'))-.00346913930676768)<1e-12);
    assert(Math.abs(Number(await algebra.locator('[data-to-ipw-aipw]').getAttribute('data-to-ipw-aipw'))-.089967995209098)<1e-12);
    assert((await bridge.boundingBox()).y<(await algebra.boundingBox()).y);
    for(const area of await algebra.locator('.to-scroll').all()){
     if(await area.evaluate(e=>e.scrollWidth>e.clientWidth+1)){await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);assert(await area.evaluate(e=>e.scrollLeft>0));await area.evaluate(e=>e.scrollLeft=0);}
    }
    for(const recall of await root.locator('[data-to-panel="1"] .recall-trigger').all()){
     await recall.focus();await p.keyboard.press('Enter');assert.equal(await root.locator('.recall-popover:visible').count(),1);await p.keyboard.press('Escape');
    }
    await algebra.screenshot({path:`output/zh/playwright/tmle-eif-aipw-${width}.png`});
   }
   if(step===2){
    const direction=root.locator('[data-to-direction]');assert(await direction.isVisible());
    const shifts=await direction.locator('[data-to-direction-shift]').evaluateAll(es=>es.map(e=>+e.dataset.toDirectionShift));assert(shifts[0]<0&&shifts[1]>0);
    const scores=await direction.locator('[data-to-direction-score]').evaluateAll(es=>es.map(e=>+e.dataset.toDirectionScore));assert(scores[0]>scores[1]&&Math.abs(scores[2])<1e-12);
    for(const area of await direction.locator('.to-scroll').all()){if(await area.evaluate(e=>e.scrollWidth>e.clientWidth+1)){await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);assert(await area.evaluate(e=>e.scrollLeft>0));await area.evaluate(e=>e.scrollLeft=0);}}
    await direction.screenshot({path:`output/zh/playwright/tmle-common-epsilon-${width}.png`});

    for(const [state,score] of [['initial',.00346913930676768],['target',0]]){
     await root.locator(`[data-to-view="${state}"]`).focus();await p.keyboard.press('Enter');
     const metrics=root.locator('[data-to-only="2,3"] [data-to-state]:visible [data-to-number]');
     assert.equal(await metrics.count(),2);assert(Math.abs(Number(await metrics.nth(1).getAttribute('data-to-number'))-score)<1e-11);
    }
   }
   if(step===3){
    await root.locator('[data-to-row]').selectOption('2');assert(await root.locator('[data-to-flow-row="2"]').isVisible());
    await root.locator('[data-to-view="initial"]').click();
    assert((await root.locator('th[data-to-column=qstar1]').innerText()).includes('ε'));assert(!(await root.locator('th[data-to-column=qstar1] annotation:visible').count()));
    const oldQ=Number(await root.locator('[data-to-patient="2"] [data-to-column=qa] [data-to-value]').getAttribute('data-to-value'));
    const before=Number(await root.locator('[data-to-patient="2"] [data-to-column=qstar_a] [data-to-state=initial] [data-to-value]').getAttribute('data-to-value'));assert(Math.abs(oldQ-before)<1e-12);
    await root.locator('[data-to-view="target"]').click();
    const after=Number(await root.locator('[data-to-patient="2"] [data-to-column=qstar_a] [data-to-state=target] [data-to-value]').getAttribute('data-to-value'));assert(after>before);
    const area=root.locator('[data-to-flow-row="2"] [data-to-state=target] .to-scroll');await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);assert(await area.evaluate(e=>e.scrollLeft>0));
    await root.locator('[data-to-flow-row="2"]').screenshot({path:`output/zh/playwright/tmle-overview-update-${width}.png`});
    // Carry an initial-state view forward; final estimates must still use the fitted root.
    await root.locator('[data-to-view="initial"]').click();
   }
   if(step>=4)assert.equal(await root.getAttribute('data-to-view'),'target');
   if(step===4){
    const value=Number(await root.locator('[data-to-only="4"] [data-to-number]').getAttribute('data-to-number'));assert(Math.abs(value-.08997972473530443)<1e-10);
    const calibration=root.locator('[data-to-calibration]'),reference=root.locator('[data-to-reference]');
    assert(await calibration.isVisible());assert(!(await reference.isVisible()));
    const disclosure=root.locator('[data-to-panel="4"] details').first();
    await disclosure.locator(':scope > summary').focus();await p.keyboard.press('Enter');assert(await reference.isVisible());
    const scores=await reference.locator('[data-to-ref-score]').evaluateAll(es=>es.map(e=>+e.dataset.toRefScore));
    const errors=await reference.locator('[data-to-ref-error]').evaluateAll(es=>es.map(e=>+e.dataset.toRefError));
    assert.equal(scores.length,3);assert(scores.every(x=>Math.abs(x)<1e-12));assert(Math.abs(errors[0])<1e-12&&Math.abs(errors[1])<1e-12);assert(errors[2]>.003);
    for(const area of await reference.locator('.to-scroll').all()){
     if(await area.evaluate(e=>e.scrollWidth>e.clientWidth+1)){await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);assert(await area.evaluate(e=>e.scrollLeft>0));await area.evaluate(e=>e.scrollLeft=0);}
    }
    await calibration.screenshot({path:`output/zh/playwright/tmle-calibration-${width}.png`});
    await reference.screenshot({path:`output/zh/playwright/tmle-reference-${width}.png`});
    await disclosure.locator(':scope > summary').click();assert(!(await reference.isVisible()));
   }
   if(step===5){const values=await root.locator('[data-to-only="5"] [data-to-number]').evaluateAll(es=>es.map(e=>+e.dataset.toNumber));assert(Math.abs(values[0])<1e-12);assert(Math.abs(values[2]-.013082375165239402)<1e-12);}
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page width');
   await root.locator(`[data-to-panel="${step}"]`).screenshot({path:`output/zh/playwright/tmle-overview-step${step+1}-${width}.png`});
  }
  assert(await root.locator('[data-to-next]').isDisabled());await root.locator('[data-to-reset]').click();assert.equal(await root.getAttribute('data-to-step'),'0');assert.equal(await root.locator('[data-to-row]').inputValue(),'1');assert(await root.locator('[data-to-previous]').isDisabled());
  await root.locator('[data-to-next]').click();assert.equal(await root.getAttribute('data-to-step'),'1');await root.locator('[data-to-previous]').click();assert.equal(await root.getAttribute('data-to-step'),'0');
  await p.locator('nav a[href="#chapter-1"]').click();await p.locator('nav a[href="#chapter-0"]').click();await root.waitFor({state:'visible'});assert(await root.isVisible());assert.equal(await root.getAttribute('data-to-step'),'0');
  assert.deepEqual(errors,[]);await p.close();console.log(`PASS TMLE overview ${width}px: six-step navigation, row-preserving column additions, accessible formula recalls, initial/fitted epsilon states, Qε versus Q* labels, update flow, target estimate/SE, reset and chapter navigation, no overflow or console errors`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
