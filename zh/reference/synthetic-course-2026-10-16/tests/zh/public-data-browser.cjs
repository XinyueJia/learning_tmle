const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const width of [1360,375]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await page.goto(base+'/public-data.html');await page.locator('#public-data-lab[aria-busy=false]').waitFor();
  const value=key=>page.locator(`[data-count="${key}"]`).innerText();
  assert.equal(await value('n'),'107');assert.equal(await value('pfs-exceeds'),'13');assert.equal(await value('death-no-progression'),'27');assert.equal(await value('mutation-negative'),'1');assert.equal(await value('early-pfs'),'24');assert.equal(await value('early-os'),'2');
  assert.deepEqual(await page.locator('[data-drug-count]').allTextContents(),['47','33','27']);
  await page.getByLabel('查看哪种初始用药').selectOption('Afatinib');assert.equal(await value('n'),'47');assert.equal(await value('early-pfs'),'7');assert.equal(await value('early-os'),'1');
  await page.getByLabel('核查时点（月）').selectOption('3');assert.equal(await value('early-os'),'0');
  assert.equal(await page.locator('[data-endpoint-admissible]').getAttribute('data-endpoint-admissible'),'false');
  assert((await page.locator('.public-gate').innerText()).includes('不计算临床ATE或TMLE'));
  await page.getByRole('button',{name:'重置本页'}).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-count=n]').textContent==='107');
  assert.equal(await value('early-os'),'2');assert.equal(await page.getByLabel('核查时点（月）').inputValue(),'12');
  const answer=page.getByText('答案与理由',{exact:true});await answer.focus();await page.keyboard.press('Enter');assert(await answer.evaluate(e=>e.parentElement.open));assert((await page.locator('details[open]').innerText()).includes('不会提供缺失的数据字典'));
  const rules=page.getByText('展开本次核查规则与字段含义',{exact:true});await rules.click();assert(await rules.evaluate(e=>e.parentElement.open));
  assert.equal(await page.locator('math').count(),1);assert.equal(await page.locator('.katex-error').count(),0);
  const csv=await page.request.get(base+'/../shared/data/public/ng-2021-nsclc/source.csv');assert.equal(csv.status(),200);assert.deepEqual(await csv.body(),fs.readFileSync('shared/data/public/ng-2021-nsclc/source.csv'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  fs.mkdirSync('output/zh/playwright',{recursive:true});await page.locator('#public-data-lab').screenshot({path:`output/zh/playwright/public-data-${width}.png`});
  await page.goto(base+'/?edition=public-rws#chapter-0');assert((await page.locator('.public-data-notice').innerText()).includes('107条公开肺癌'));
  assert.equal(await page.locator('aside a[href="public-data.html"]').count(),1);
  await page.locator('.public-data-notice a').click();await page.locator('[data-count=n]').waitFor();assert.equal(await value('n'),'107');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await page.close();
  console.log(`PASS public real-data companion ${width}px: counts, filters, endpoint refusal, reset/keyboard/answers, formula, original CSV bytes, course navigation, layout/console/no external calls`);
 }}finally{await browser.close();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
