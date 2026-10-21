const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = new URL(process.env.EIF_URL || 'http://127.0.0.1:4174').origin;
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [1360,375]) {
      const page = await browser.newPage({ viewport: { width, height:900 } });
      const errors=[], external=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
      await page.route('**/*', route=>{
        const url=route.request().url();
        if(url.startsWith(origin+'/')||url.startsWith('data:'))return route.continue();
        external.push(url);return route.abort();
      });
      await page.goto(origin+'/?edition=hierarchy&keep=1#chapter-1');
      await page.locator('#ch01-julia-guide').waitFor();
      assert.equal(page.url(),origin+'/zh/?edition=hierarchy&keep=1#chapter-1');
      assert.equal(await page.locator('nav a[data-chapter]').count(),9);
      assert.equal(await page.locator('#ch01-julia-guide .julia-line-card').count(),32);
      assert(await page.locator('#chapter-1 math').count()>0);
      const links=await page.locator('a[download]').evaluateAll(nodes=>nodes.map(node=>node.href).filter(href=>!href.startsWith('data:')));
      for(const link of new Set(links)) {
        const response=await page.request.get(link);assert.equal(response.status(),200,link);
        const pathname=new URL(link).pathname;
        assert.deepEqual(await response.body(),fs.readFileSync('dist'+decodeURIComponent(pathname)));
      }
      for(const [url,file] of [
        ['/shared/js/math.js','shared/js/math.js'],
        ['/shared/data/rws-counts.csv','shared/data/rws-counts.csv'],
        ['/shared/julia/EIFCase.jl','shared/julia/EIFCase.jl'],
        ['/zh/julia/lessons/ch01.jl','zh/julia/lessons/ch01.jl'],
        ['/zh/julia/lessons/ch08.jl','zh/julia/lessons/ch08.jl'],
      ]) {
        const response=await page.request.get(origin+url);assert.equal(response.status(),200,url);
        assert.deepEqual(await response.body(),fs.readFileSync(file));
      }
      await page.locator('#mean-t').fill('0.25');
      await page.locator('#chapter-1 .reset').click();
      assert.equal(await page.locator('#mean-t').inputValue(),'0');
      for(const name of ['sources','audit','case-study']) {
        await page.goto(origin+'/'+name+'.html?edition=hierarchy#kept');
        await page.locator('h1').waitFor();
        assert.equal(page.url(),origin+'/zh/'+name+'.html?edition=hierarchy#kept');
      }
      await page.goto(origin+'/zh/#chapter-1');
      await page.locator('#ch01-julia-guide').scrollIntoViewIfNeeded();
      await page.evaluate(()=>document.fonts.ready);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:`output/zh/playwright/hierarchy-${width}.png`});
      assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
      await page.close();
      console.log(`PASS hierarchy ${width}px: legacy redirects/query/hash, 9 chapters, 32 Julia lines, downloads/source bytes, formula/reset/layout/console`);
    }
  } finally { await browser.close(); }
})().then(()=>process.exit(0)).catch(error=>{console.error(error);process.exit(1);});
