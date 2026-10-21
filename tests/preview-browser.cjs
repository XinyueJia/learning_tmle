const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin=process.env.EIF_URL||'http://127.0.0.1:4174';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const results=[];
  try {
    for(const width of [1360,375]) {
      const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      page.on('requestfailed',r=>errors.push(`${r.url()}: ${r.failure()?.errorText}`));
      page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      for(const chapter of [0,1,8]) {
        const response=await page.goto(`${origin}/zh/?preview-check=${chapter}#chapter-${chapter}`);
        assert.equal(response.status(),200);
        for(let load=0;load<2;load++) {
          if(load)assert.equal((await page.reload()).status(),200);
          const current=page.locator(`#chapter-${chapter}`);
          await current.waitFor({state:'visible'});
          await page.locator('[data-full-mounted=true]').waitFor({state:'attached'});
          assert.equal(await page.locator('article').count(),9);
          assert(await current.locator('math').count()>0);
          assert.equal(await current.locator('.katex-error,[role=alert]').count(),0);
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        }
      }
      const response=await page.request.get(origin+'/shared/data/public/rhc/source.csv');
      assert.equal(response.status(),200);
      assert.deepEqual(await response.body(),fs.readFileSync('shared/data/public/rhc/source.csv'));
      assert.deepEqual(errors,[]);
      results.push({width,chapters:[0,1,8],initialLoadAndReload:'passed',sourceData:'byte-identical',browserErrors:errors});
      console.log(`PASS ${width}px: direct load and reload in chapters 0/1/8, maths, RHC CSV, layout and browser errors`);
      await page.close();
    }
  } finally { await browser.close(); }
  fs.mkdirSync('output/local-preview',{recursive:true});
  fs.writeFileSync('output/local-preview/browser-verification.json',JSON.stringify(results,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
