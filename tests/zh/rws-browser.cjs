const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = new URL(process.env.EIF_URL || 'http://127.0.0.1:4174').origin;
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    for(const width of [1360,375]) {
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[],external=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
      await page.route('**/*',route=>{
        const url=route.request().url();
        if(url.startsWith(origin+'/')||url.startsWith('data:'))return route.continue();
        external.push(url);return route.abort();
      });
      await page.goto(origin+'/zh/?edition=rws#chapter-0');
      await page.locator('#chapter-0 .case-context-note').waitFor();
      const question=page.locator('#intro-visual-question');
      const text=await question.innerText();
      for(const required of ['肺癌','活性对照','首次给药','12个月','药物A减'])assert(text.includes(required),required);
      const chapter0=await page.locator('#chapter-0').innerText();
      for(const required of ['新使用者队列','共同起点','全因','完整','停药','合成数据','不利的疗效方向']) assert(chapter0.includes(required),required);
      const labels=await page.locator('#chapter-0 .lab .metric-label').allTextContents();
      assert(labels.some(label=>label.includes('药物B')));
      assert(!labels.some(label=>/未处理|不处理/.test(label)));
      const values=await page.locator('#chapter-0 .lab .metric-value').allTextContents();
      assert.deepEqual(values,['65.00%','45.00%','20.00 pp','-4.00 pp']);
      const contexts=await page.locator('.case-context-note').allTextContents();assert.equal(contexts.length,9);
      for(const context of contexts) {
        assert(context.includes('A=0，首次启动活性对照药物B'));
        assert(context.includes('12个月内疾病进展或全因死亡'));
        assert(context.includes('合成'));
      }
      const fullText=await page.locator('main').textContent();
      assert(!/电话|出院|住院|hospitalisations/.test(fullText),'previous clinical case must not leak into current teaching');
      await page.evaluate(()=>document.fonts.ready);
      await question.screenshot({path:`output/zh/playwright/rws-question-${width}.png`});
      await page.locator('#chapter-0 .lab').screenshot({path:`output/zh/playwright/rws-target-${width}.png`});
      await page.locator('nav a[href="#chapter-1"]').click();
      const choiceFits = await page.locator('.case-workbench[data-case-study="1"] select[data-case-key="y"]').evaluate(select=>{
        const style=getComputedStyle(select),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
        ctx.font=`${style.fontSize} ${style.fontFamily}`;
        return ctx.measureText(select.selectedOptions[0].textContent).width < select.clientWidth-30;
      });
      assert(choiceFits,'selected clinical outcome label fits without truncation');
      const guide=page.locator('#ch01-julia-guide');
      assert.equal(await guide.locator('.julia-line-card').count(),32);
      assert((await guide.innerText()).includes('events = events + cell.n * cell.y'));
      assert(!(await guide.innerText()).includes('hospitalisations'));
      await page.locator('.case-workbench[data-case-study="1"]').screenshot({path:`output/zh/playwright/rws-mean-${width}.png`});
      const response=await page.request.get(origin+'/shared/data/rws-counts.csv');assert.equal(response.status(),200);
      assert.deepEqual(await response.body(),fs.readFileSync('shared/data/rws-counts.csv'));
      await page.locator('nav a[href="#chapter-4"]').click();
      assert(!(await page.locator('#chapter-4').innerText()).includes('未接受处理'));
      await page.locator('nav a[href="#chapter-8"]').click();
      const work=page.locator('.case-workbench[data-case-study="8"]');
      await work.locator('[data-case-action="solve"]').click();
      assert((await work.innerText()).includes('20.000 pp'));
      assert((await page.locator('#chapter-8').innerText()).includes('不是药物A的疗效获益'));
      await work.screenshot({path:`output/zh/playwright/rws-tmle-${width}.png`});
      await work.locator('.case-reset').click();
      assert.equal(await work.locator('[data-case-key="epsilon"]').inputValue(),'0');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
      await page.close();
      console.log(`PASS RWS ${width}px: protocol/active comparator, nine consistent contexts, endpoint/risk direction, canonical CSV, Julia source, TMLE/reset/layout/console`);
    }
  }finally{await browser.close();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
