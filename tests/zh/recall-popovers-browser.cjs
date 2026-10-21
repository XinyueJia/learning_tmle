const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const origin=new URL(process.env.EIF_URL||'http://127.0.0.1:4174').origin;
const delay=page=>page.waitForTimeout(240);
async function fits(panel){
 const box=await panel.boundingBox();assert(box,'popover visible');
 const view=await panel.page().evaluate(()=>({x:visualViewport.offsetLeft,y:visualViewport.offsetTop,w:visualViewport.width,h:visualViewport.height}));
 assert(box.x>=view.x-1&&box.y>=view.y-1&&box.x+box.width<=view.x+view.w+1&&box.y+box.height<=view.y+view.h+1,JSON.stringify({box,view}));
 assert(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'popover text has no horizontal overflow');
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  for(const mobile of [false,true]){
   const width=mobile?375:1360;
   const page=await browser.newPage({viewport:{width,height:900},isMobile:mobile,hasTouch:mobile});
   const errors=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
   await page.goto(origin+'/zh/?edition=recall-popovers#chapter-1');
   const chapter=page.locator('#chapter-1'),note=chapter.locator('.equation').first().locator('xpath=following-sibling::*[1]');
   const trigger=note.locator('.recall-trigger'),panel=note.locator('.recall-popover');
   await trigger.waitFor();
   assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert(!(await panel.isVisible()));
   assert((await note.boundingBox()).height<=55,'long explanatory note is not embedded in the default page');
   const ids=await page.locator('.recall-popover').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
   if(!mobile){
    await trigger.hover();await panel.waitFor({state:'visible'});await fits(panel);
    assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    await panel.hover();await delay(page);assert(await panel.isVisible(),'hover remains open when moving into explanation');
    assert(await panel.locator('math').count()>0);
    await page.screenshot({path:`output/zh/playwright/recall-hover-${width}.png`});
    await page.mouse.move(1,1);await panel.waitFor({state:'hidden'});
    await trigger.focus();await panel.waitFor({state:'visible'});
    await page.keyboard.press('Escape');await delay(page);assert(!(await panel.isVisible()),'Escape stays closed while trigger remains focused');
    await page.keyboard.press('Enter');await panel.waitFor({state:'visible'});
    assert(await panel.evaluate(e=>e===document.activeElement));
    await page.keyboard.press('Tab');assert(await panel.locator('.recall-close').evaluate(e=>e===document.activeElement));
    await page.keyboard.press('Enter');await panel.waitFor({state:'hidden'});
    assert(await trigger.evaluate(e=>e===document.activeElement),'close restores keyboard focus');
   }
   if(mobile)await trigger.tap();else await trigger.click();
   await panel.waitFor({state:'visible'});await fits(panel);
   await page.screenshot({path:`output/zh/playwright/recall-open-${width}.png`});
   if(mobile)await panel.locator('.recall-close').tap();else await panel.locator('.recall-close').click();
   await delay(page);assert(!(await panel.isVisible()),'close button does not immediately reopen the panel');
   if(mobile)await trigger.tap();else await trigger.click();await panel.waitFor({state:'visible'});
   if(mobile)await page.touchscreen.tap(2,2);else await page.mouse.click(2,2);
   await panel.waitFor({state:'hidden'});assert.equal(await trigger.getAttribute('aria-expanded'),'false');
   await trigger.click();await panel.waitFor({state:'visible'});
   await page.locator('nav a[href="#chapter-2"]').click();assert.equal(await page.locator('.recall-popover:popover-open').count(),0,'changing chapter closes panels');
   await page.locator('nav a[href="#chapter-1"]').click();
   const answer=chapter.locator('#visual-exercise-one').locator('xpath=ancestor::details');
   await answer.locator('summary').click();
   const folded=answer.locator('.recall-trigger').first(),foldedPanel=answer.locator('.recall-popover').first();
   await folded.click();await foldedPanel.waitFor({state:'visible'});
   await answer.evaluate(e=>{e.open=false;});await foldedPanel.waitFor({state:'hidden'});
   // A short viewport forces long notes to scroll inside the floating panel.
   if(!mobile)await page.setViewportSize({width,height:480});
   const candidates=chapter.locator('.recall-trigger:visible');
   const lengths=await candidates.evaluateAll(buttons=>buttons.map(button=>button.parentElement.querySelector('.recall-popover').textContent.length));
   const longest=candidates.nth(lengths.indexOf(Math.max(...lengths)));
   await longest.click();
   const longPanel=chapter.locator('.recall-popover:popover-open');await longPanel.waitFor();await fits(longPanel);
   if(await longPanel.evaluate(e=>e.scrollHeight>e.clientHeight+5)){
    await longPanel.evaluate(e=>{e.scrollTop=40;});await delay(page);assert(await longPanel.isVisible(),'scrolling the popover does not close it');
    assert(await longPanel.evaluate(e=>e.scrollTop>0));
   }
   await page.screenshot({path:`output/zh/playwright/recall-long-${width}.png`});
   await page.keyboard.press('Escape');
   if(mobile){
    await trigger.tap();await panel.waitFor({state:'visible'});
    const cdp=await page.context().newCDPSession(page);
    await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1.5});await delay(page);
    if(await panel.isVisible())await fits(panel);
    await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});await cdp.detach();
    await page.keyboard.press('Escape');
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   await page.close();console.log(`PASS symbol popovers ${width}px: hover/focus/click/touch/close/escape/outside, scope, scrolling and viewport bounds`);
  }
  // Exercise the JS fallback when native showPopover is unavailable.
  const fallback=await browser.newPage({viewport:{width:375,height:800}});
  await fallback.addInitScript(()=>{Object.defineProperty(HTMLElement.prototype,'showPopover',{value:undefined,configurable:true});});
  await fallback.goto(origin+'/zh/#chapter-1');
  const trigger=fallback.locator('#chapter-1 .recall-trigger').first(),panel=fallback.locator('#chapter-1 .recall-popover').first();
  await trigger.click();assert(await panel.isVisible());await fits(panel);
  await fallback.keyboard.press('Escape');assert(!(await panel.isVisible()));await fallback.close();
  console.log('PASS non-native popover fallback');
 }finally{await browser.close();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
