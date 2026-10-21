const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=new URL(process.env.EIF_URL||'http://127.0.0.1:4174').origin;
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  for(const width of [1360,375]) {
   const page=await browser.newPage({viewport:{width,height:900}}),errors=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>{const url=r.request().url();if(url.startsWith(origin+'/')||url.startsWith('data:'))return r.continue();external.push(url);return r.abort();});
   await page.goto(origin+'/zh/?edition=inline-formatting#chapter-0');
   await page.locator('#intro-target').waitFor();
   for(const [chapter,terms] of [[0,['合成数据（synthetic data）','识别（identification）','estimator（估计量）','estimate（估计值）']],[6,['加权内积（weighted inner product）','正交（orthogonality）','半参数模型（semiparametric model）','基（basis）']]]) {
    await page.locator(`nav a[href="#chapter-${chapter}"]`).click();
    for(const term of terms){
     const item=page.locator(`#chapter-${chapter} strong`).filter({hasText:term}).first();
     await item.scrollIntoViewIfNeeded();assert(await item.isVisible(),term);
     assert(await item.evaluate(el=>Number(getComputedStyle(el).fontWeight)>=600),term+' rendered bold');
    }
   }
   const leaks=await page.locator('main').evaluate(root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),found=[];
    while(walker.nextNode()){
     const node=walker.currentNode;
     if(node.parentElement.closest('code,pre,.katex,script,style'))continue;
     if(node.textContent.includes('**'))found.push(node.textContent);
    }return found;
   });assert.deepEqual(leaks,[],'all nine chapters including folded answers: no raw strong markers');
   await page.locator('nav a[href="#chapter-1"]').click();
   const guide=page.locator('#ch01-julia-guide');assert.equal(await guide.locator('.julia-line-card').count(),32);
   const core=fs.readFileSync('shared/julia/EIFCase.jl','utf8').split('# BEGIN_CH01')[1].split('# END_CH01')[0].trim().split('\n');
   for(const line of [6,14,17]){
    const card=guide.locator(`[data-julia-part="core"][data-julia-line="${line}"]`);
    assert.equal((await card.locator('code').first().textContent()).trimEnd(),core[line-1]);
   }
   assert(await page.locator('#chapter-1 math').count()>0);
   await page.locator('nav a[href="#chapter-0"]').click();
   const term=page.locator('#chapter-0 strong').filter({hasText:'识别（identification）'}).first();
   await term.scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:`output/zh/playwright/inline-formatting-${width}.png`});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
   await page.close();console.log(`PASS inline formatting ${width}px: 8 bilingual terms bold; no raw markers in nine chapters; code/MathML/layout/console preserved`);
  }
 }finally{await browser.close();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
