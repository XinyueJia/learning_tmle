const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseURL=((process.env.EIF_URL||'http://127.0.0.1:4174').replace(/\/$/,'')).replace(/(?:\/zh)?$/, '/zh');
const screenshotDir=process.env.EIF_SCREENSHOT_DIR||'output/zh/playwright';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:375,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(baseURL+'/#chapter-0');await page.locator('#intro-target').waitFor();await page.evaluate(()=>document.fonts.ready);
    const wrapper=page.locator('#chapter-0 .lab .table-wrap');
    assert(await wrapper.evaluate(e=>e.scrollWidth>e.clientWidth),'six columns remain readable through local scrolling');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'table must not widen the page');
    fs.mkdirSync(screenshotDir,{recursive:true});
    await page.locator('#chapter-0 .lab').screenshot({path:path.join(screenshotDir,'ch00-lab-375.png')});
    await wrapper.focus();await wrapper.press('ArrowRight');
    await page.waitForFunction(e=>e.scrollLeft>0,await wrapper.elementHandle());
    await wrapper.evaluate(e=>e.scrollLeft=e.scrollWidth);
    await wrapper.screenshot({path:path.join(screenshotDir,'ch00-table-right-375.png')});
    assert.equal(await wrapper.locator('thead th').last().innerText(),'组内风险差');
    await page.locator('#intro-population').selectOption('0.8');
    assert.equal(await page.locator('#chapter-0 .intro-target strong').innerText(),'26.00 pp');
    await page.locator('#chapter-0 .reset').click();
    assert.equal(await page.locator('#chapter-0 .intro-target strong').innerText(),'20.00 pp');
    assert.deepEqual(errors,[]);
    console.log('PASS chapter 0 mobile: legible table, keyboard scrolling, page width, population/reset and console');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
