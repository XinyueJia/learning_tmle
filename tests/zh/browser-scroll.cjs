const assert=require('node:assert/strict');
/** Check the focusable region itself; presentation no longer adds a second slider. */
module.exports=async function nativeScroll(page,area){
 assert.equal(await page.locator('.diagram-scroll-controls').count(),0);
 assert.equal(await area.getAttribute('tabindex'),'0');
 if(await area.evaluate(e=>e.scrollWidth>e.clientWidth+2)){
  await area.evaluate(e=>{e.scrollLeft=0;});await area.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);
  assert(await area.evaluate(e=>e.scrollLeft)>0,'wide region scrolls with the keyboard');
  await page.keyboard.press('ArrowLeft');await page.waitForTimeout(200);assert.equal(await area.evaluate(e=>Math.round(e.scrollLeft)),0);
 }
};
