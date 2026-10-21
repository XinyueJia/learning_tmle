const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve('dist'),prefix='/learning-tmle/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.csv':'text/csv','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff'};
(async()=>{
 const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith(prefix)){res.writeHead(404);return res.end('Outside project prefix');}pathname=pathname.slice(prefix.length);const file=path.resolve(root,pathname+(!pathname||pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}${prefix}`;
 const browser=await chromium.launch({channel:process.env.EIF_BROWSER_CHANNEL||'chrome',headless:true});fs.mkdirSync('output/en/playwright',{recursive:true});
 try{
  for(const width of [1360,790,375]){
   const p=await browser.newPage({viewport:{width,height:900}}),errors=[],failed=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   p.on('response',r=>{if(r.status()>=400)failed.push(r.url()+':'+r.status());});
   await p.route('**/*',r=>r.request().url().startsWith(base)||r.request().url().startsWith('data:')?r.continue():r.abort());
   await p.goto(base+'?edition=pages-test#chapter-7');await p.locator('#chapter-7').waitFor({state:'visible'});
   assert.equal(await p.locator('html').getAttribute('lang'),'en-GB');assert(await p.locator('#chapter-7').isVisible());
   assert(p.url().includes(prefix+'en/')&&p.url().includes('edition=pages-test'));
   for(let n=0;n<=8;n++){
    await p.locator(`aside nav [data-chapter="${n}"]`).click();const ch=p.locator(`#chapter-${n}`);await ch.waitFor({state:'visible'});
    assert.equal(await ch.locator('h1').count(),1);assert((await ch.locator('h1').innerText()).startsWith(`Chapter ${n}:`));
    assert(!/\p{Script=Han}/u.test(await ch.innerText()),`Chinese text in chapter ${n}`);
    assert.equal(await ch.locator('.katex-error,[role=alert],.error').count(),0);assert(await ch.locator('math').count()>0);
    if(n>0){assert.equal(await ch.locator('[data-case-mounted=true]').count(),1);const lab=ch.locator('[data-lab]');assert(await lab.locator('.results').innerText());const control=lab.locator('input[type=range]:visible').first();if(await control.count()){const old=await control.inputValue();await control.focus();await control.press('ArrowRight');assert.notEqual(await control.inputValue(),old);await lab.locator('.reset').click();assert.equal(await control.inputValue(),old);}}
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow chapter ${n} at ${width}`);
    await ch.locator('h1').scrollIntoViewIfNeeded();await p.screenshot({path:`output/en/playwright/ch${n}-${width}.png`});
   }
   await p.locator('aside nav [data-chapter="0"]').click();const overview=p.locator('[data-tmle-overview]');assert.equal(await overview.getAttribute('data-to-mounted'),'true');
   for(let n=0;n<6;n++){await overview.locator(`[data-to-go="${n}"]`).click();assert.equal(await overview.locator('[data-to-panel]:visible').count(),1);assert(!/\p{Script=Han}/u.test(await overview.innerText()));assert.equal(await overview.locator('.katex-error').count(),0);}
   const recall=overview.locator('[data-to-panel="5"] .recall-trigger').first();await recall.click();assert(await overview.locator('[data-to-panel="5"] .recall-popover').first().isVisible());assert((await recall.innerText()).includes('Symbols'));await p.keyboard.press('Escape');
   await overview.locator('[data-to-panel="5"]').screenshot({path:`output/en/playwright/variance-${width}.png`});
   await p.locator('aside nav [data-chapter="1"]').click();const c1=p.locator('#chapter-1');assert.equal(await c1.locator('[data-visual-id]').count(),18);
   const modes=c1.locator('input[name="object-mode-1"]');for(const mode of ['julia','r','math']){await c1.locator(`input[name="object-mode-1"][value="${mode}"]`).check();assert(!/\p{Script=Han}/u.test(await c1.innerText()));}
   const guide=c1.locator('.rhc-julia-lesson details').first();if(await guide.count()){await guide.locator('summary').click();assert(!/\p{Script=Han}/u.test(await guide.innerText()));}
   await p.locator('aside nav [data-chapter="8"]').click();const full=p.locator('[data-rhc-full]');const initial=+await full.getAttribute('data-full-estimate');assert(Math.abs(initial-.08649885590233014)<1e-12);
   for(const language of ['julia','r']){await full.locator('[data-trace-language]').selectOption(language);for(let n=0;n<10;n++){await full.locator(`[data-trace-stage="${n}"]`).click();assert.equal(await full.getAttribute('data-trace-stage'),String(n));assert(!/\p{Script=Han}/u.test(await full.innerText()));assert(await full.locator('.trace-current-code .trace-line-card').count()>0);}}
   await full.locator('[data-full-action=solve]').click();assert(Math.abs(+await full.getAttribute('data-full-estimate')-.08997972473530443)<1e-12);assert(Math.abs(+await full.getAttribute('data-full-score'))<1e-12);
   await full.locator('[data-trace-stage="4"]').click();const offset=full.locator('.trace-current-code button[data-trace-key=offset]').first();await offset.click();assert(await full.locator('th[data-trace-column=offset].trace-linked').count());await p.keyboard.press('Escape');
   await full.locator('[data-full-action=reset]').click();assert.equal(+await full.getAttribute('data-full-estimate'),initial);
   // The language switch carries the current chapter and query into the other edition.
   await p.locator('.language-picker summary').click();await p.locator('.language-switch [data-language=zh]').click();await p.locator('#chapter-8').waitFor({state:'visible'});assert.equal(await p.locator('html').getAttribute('lang'),'zh-CN');assert(p.url().includes('edition=pages-test'));
   await p.locator('.language-picker summary').click();await p.locator('.language-switch [data-language=en]').click();await p.locator('#chapter-8').waitFor({state:'visible'});
   for(const file of ['sources.html','case-study.html','public-data.html']){await p.goto(base+'en/'+file);assert(!/\p{Script=Han}/u.test((await p.locator('main').innerText()).replace('中文','')));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file);if(file!=='sources.html')assert.equal(await p.locator('main table').count(),1);}
   const csv=await p.request.get(base+'shared/data/public/rhc/source.csv');assert.equal((await csv.body()).length,2320412);
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await p.close();console.log(`PASS English ${width}px: all9chapters, 18figures, maths/Julia/R, six-step and ten-step TMLE, solver/reset/recalls, language/bookmark roundtrip, real CSV, no Chinese/overflow/errors, repository-prefix paths`);
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
