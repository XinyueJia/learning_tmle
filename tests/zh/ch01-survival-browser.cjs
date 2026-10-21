const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
const out=process.env.EIF_SCREENSHOT_DIR||'output/zh/playwright';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{for(const width of [1360,375]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base+'/?edition=ch01-survival#chapter-1');
  const ch=page.locator('#chapter-1');await ch.waitFor({state:'visible'});
  assert.deepEqual(await page.locator('#mean-z option').evaluateAll(es=>es.map(e=>e.value)),['0','1']);
  const metric=()=>ch.locator('.lab .metric-value').allTextContents();
  assert.deepEqual(await metric(),['0.5800','0.4200','0.5800','0.5800','0.0000','0.4200','0.0000']);
  await page.locator('#mean-t').fill('0.1');
  assert.deepEqual(await metric(),['0.5800','0.4200','0.6220','0.6220','0.0420','0.3780','-0.0420']);
  assert.deepEqual(await ch.locator('.lab tbody tr').evaluateAll(rs=>rs.map(r=>[r.cells[1].textContent,r.cells[2].textContent])),[['0.4200','0.3780'],['0.5800','0.6220']]);
  for(const [z,t,risk,survival] of [['1','0.2','0.6640','0.3360'],['0','0.8','0.1160','0.8840'],['0','1','0.0000','1.0000'],['1','1','1.0000','0.0000']]){
   await page.locator('#mean-z').selectOption(z);await page.locator('#mean-t').fill(t);const values=await metric();assert.equal(values[2],risk);assert.equal(values[5],survival);assert.equal(values[2],values[3]);
  }
  await ch.locator('.reset').click();assert.equal(await page.locator('#mean-z').inputValue(),'1');assert.equal(await page.locator('#mean-t').inputValue(),'0');
  const formulaSources=await ch.locator('#visual-survival-complement annotation').allTextContents();
  assert(formulaSources.includes('S(12)=\\mathbb E_P[1-Y]'));assert(!formulaSources.some(s=>s.includes('S_{12}')),'survival notation matches main prose');
  assert((await ch.locator('#visual-rate annotation').allTextContents()).includes('\\frac{0.00042}{0.001}=0.42'));
  assert.equal(await ch.locator('#visual-survival-window [data-schematic=true]').count(),1);
  for(const [stage,mass,weights] of [['before',1,['42%','58%']],['retained',.9,['37.8%','52.2%']],['after',1,['37.8%','62.2%']]]){
   const panel=ch.locator(`[data-weight-stage=${stage}]`);assert.equal(+(await panel.getAttribute('data-active-mass')),mass);
   assert.deepEqual(await panel.locator('.probability-strip>span').allTextContents(),weights);
  }
  for(const id of ['survival-window','replacement','survival-complement']){
   const figure=ch.locator('#visual-'+id);await figure.screenshot({path:path.join(out,`ch01-survival-${id}-${width}.png`)});
   assert(await figure.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  }
  await ch.locator('.lab').screenshot({path:path.join(out,`ch01-survival-lab-${width}.png`)});
  await page.locator('nav a[href="#chapter-2"]').click();
  await page.locator('#score-z').selectOption('1');await page.locator('#point-t').fill('0.3');
  const ch2=page.locator('#chapter-2');assert.deepEqual(await ch2.locator('.lab .metric-value').allTextContents(),['0.4200','0.4200','0.0000','0.7060']);
  const rows=await ch2.locator('.lab tbody tr').evaluateAll(rs=>rs.map(r=>[r.cells[3].textContent,r.cells[4].textContent,r.cells[5].textContent]));
  assert.deepEqual(rows,[['-0.420','-1.000','-0.580'],['0.420','0.724','0.420']]);
  assert.equal(await ch.locator('.katex-error').count(),0);assert.equal(await ch2.locator('.katex-error').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
  await page.close();console.log(`PASS final RWS survival chapter: ${width}px; exact risk/complement/weights/score, boundary/reset, notation/precision, schematic/layout/console`);
 }}finally{await browser.close();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
