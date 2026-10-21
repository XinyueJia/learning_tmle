const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

(async () => {
  const root = path.resolve('dist'), prefix = '/learning-tmle/';
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv', '.json': 'application/json', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) { res.writeHead(404); return res.end(); }
    const relative = decodeURIComponent(url.pathname.slice(prefix.length));
    const file = path.resolve(root, relative + (!relative || relative.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    try { res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  const browser = await chromium.launch({ channel: process.env.EIF_BROWSER_CHANNEL || 'chrome', headless: true });
  fs.mkdirSync('output/en/verification/lazy-chapters', { recursive: true });
  try {
    for(const lang of ['en','zh']){
      const p=await browser.newPage(),requests=[];
      p.on('request',r=>requests.push(new URL(r.url()).pathname));
      await p.goto(base+lang+'/');await p.locator('#chapter-0').waitFor({state:'visible'});
      assert.deepEqual(requests.filter(path=>/\/chapters\/chapter-\d+\.html$/.test(path)),[prefix+lang+'/chapters/chapter-0.html']);
      assert(!requests.some(path=>path.endsWith('rhc-full.js')||path.endsWith('tmle_trace.jl')));
      console.log(JSON.stringify({lang,initialChapter:0,defaultEntry:'PASS',...await p.evaluate(()=>({documentBytes:performance.getEntriesByType('navigation')[0].encodedBodySize,resourceBytes:performance.getEntriesByType('resource').reduce((sum,r)=>sum+r.encodedBodySize,0),resources:performance.getEntriesByType('resource').length}))}));
      await p.close();
    }
    for(const lang of ['en','zh'])for(const width of [1360,375]){
      const page=await browser.newPage({viewport:{width,height:900}}),requests=[],errors=[];
      page.on('request',r=>requests.push(new URL(r.url()).pathname));
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.goto(base+lang+'/?lazy-check=1#chapter-7');
      await page.locator('#chapter-7').waitFor({state:'visible'});
      assert.deepEqual(requests.filter(p=>/\/chapters\/chapter-\d+\.html$/.test(p)),[prefix+lang+'/chapters/chapter-7.html']);
      assert(!requests.some(p=>p.endsWith('rhc-full.js')||p.endsWith('tmle_trace.jl')||p.endsWith('source.csv')));
      const initial=await page.evaluate(()=>({resources:performance.getEntriesByType('resource').length,bytes:performance.getEntriesByType('resource').reduce((s,r)=>s+r.encodedBodySize,0)}));
      for(let n=0;n<=8;n++){
        await page.locator(`aside nav [data-chapter="${n}"]`).click();
        const chapter=page.locator(`#chapter-${n}`);await chapter.waitFor({state:'visible'});
        assert.equal(await chapter.getAttribute('data-chapter-state'),'ready');
        assert(await chapter.locator('math').count()>0);
        assert.equal(await chapter.locator('.katex-error,[role=alert]').count(),0);
        if(n>0)assert(await chapter.locator('[data-lab] .results').innerText());
        if(n===0){const overview=chapter.locator('[data-tmle-overview]');await overview.locator('[data-to-next]').click();assert.equal(await overview.getAttribute('data-to-step'),'1');}
        if(n===1){const control=chapter.locator('[data-lab] input[type=range]').first();await control.focus();await control.press('ArrowRight');page.savedValue=await control.inputValue();}
        if(n===2){const recall=chapter.locator('.recall-trigger').first();await recall.click();assert(await chapter.locator('.recall-popover').first().isVisible());await page.keyboard.press('Escape');}
      }
      const full=page.locator('[data-rhc-full]');await full.locator('[data-full-action=solve]').click();
      assert(Math.abs(+await full.getAttribute('data-full-estimate')-.08997972473530443)<1e-12);
      const counts=()=>requests.filter(p=>/\/chapters\/chapter-\d+\.html$/.test(p)).length;
      const before=counts();assert.equal(before,9);
      await page.locator('aside nav [data-chapter="1"]').click();await page.locator('#chapter-1').waitFor({state:'visible'});
      assert.equal(await page.locator('#chapter-1 [data-lab] input[type=range]').first().inputValue(),page.savedValue);
      await page.locator('#chapter-1 .mark-read').click();assert((await page.locator('#reading-status').innerText()).includes('1 / 9'));
      await page.locator('#chapter-1 .next').click();await page.locator('#chapter-2').waitFor({state:'visible'});
      await page.goBack();await page.locator('#chapter-1').waitFor({state:'visible'});
      await page.goForward();await page.locator('#chapter-2').waitFor({state:'visible'});
      assert.equal(counts(),before,'Returning to loaded chapters makes no fragment request');
      assert.equal(requests.filter(p=>p.endsWith('/rhc/source.csv')).length,1,'One shared raw CSV request across visited chapters');
      await page.locator('aside nav [data-chapter="0"]').click();await page.locator('#chapter-0').waitFor({state:'visible'});
      const overview=page.locator('[data-tmle-overview]');await overview.locator('[data-to-next]').click();assert.equal(await overview.getAttribute('data-to-step'),'2','No duplicate listeners on revisit');
      await page.locator('.language-picker summary').click();await page.locator(`[data-language=${lang==='en'?'zh':'en'}]`).click();
      await page.locator('#chapter-0').waitFor({state:'visible'});assert(page.url().includes('lazy-check=1#chapter-0'));
      assert.equal(await page.locator('.chapter[data-chapter-state=ready]').count(),1,'Only current chapter loaded after language switch');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert.deepEqual(errors,[]);await page.screenshot({path:`output/en/verification/lazy-chapters/lazy-${lang}-${width}.png`});
      console.log(JSON.stringify({lang,width,result:'PASS',initialChapter:7,initialResources:initial.resources,initialResourceBytes:initial.bytes,checks:'all chapters, lazy modules, one CSV, cached state, no duplicate listeners, mark-read, next/back/forward, new recalls, solver, language links, no errors/overflow, Pages prefix'}));
      await page.close();
    }
    // Delayed, failed and out-of-order requests must not replace the selected chapter.
    const p=await browser.newPage();let delayedResolve;
    await p.route('**/chapters/chapter-3.html',async route=>{await new Promise(resolve=>{delayedResolve=resolve;});await route.continue();});
    await p.goto(base+'en/#chapter-7');await p.locator('#chapter-7').waitFor({state:'visible'});
    await p.locator('aside nav [data-chapter="3"]').click();await p.waitForFunction(()=>location.hash==='#chapter-3');
    await p.locator('aside nav [data-chapter="4"]').click();await p.locator('#chapter-4').waitFor({state:'visible'});
    while(!delayedResolve)await new Promise(resolve=>setTimeout(resolve,10));
    delayedResolve();await p.locator('#chapter-3[data-chapter-state=ready]').waitFor({state:'attached'});
    assert(await p.locator('#chapter-4').isVisible());assert(!await p.locator('#chapter-3').isVisible());
    let fail=true;await p.route('**/chapters/chapter-5.html',route=>fail?(fail=false,route.fulfill({status:503,body:'Unavailable'})):route.continue());
    await p.locator('aside nav [data-chapter="5"]').click();await p.locator('#chapter-loading[role=alert]').waitFor({state:'visible'});
    await p.locator('#chapter-loading button').click();await p.locator('#chapter-5').waitFor({state:'visible'});
    assert.equal(await p.locator('.chapter:visible').count(),1);
    await p.goto(base+'en/#chapter-99');await p.locator('#chapter-0').waitFor({state:'visible'});
    await p.reload();await p.locator('#chapter-0').waitFor({state:'visible'});
    await p.goto(base+'zh/chapter-0-details.html#chapter-0');await p.locator('#chapter-0').waitFor({state:'visible'});
    assert(await p.locator('.dr-supplement-back').isVisible());assert(await p.locator('[data-if-mounted=true]').count());
    await p.close();console.log('PASS recovery: out-of-order navigation, HTTP failure/retry, unknown chapter fallback/refresh and archived supplementary reading');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
