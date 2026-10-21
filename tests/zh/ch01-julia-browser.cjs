const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseURL =( (process.env.EIF_URL || 'http://127.0.0.1:4174').replace(/\/$/,'')).replace(/(?:\/zh)?$/, '/zh');
const screenshots = process.env.EIF_SCREENSHOT_DIR || 'output/zh/playwright';
const moduleSource = fs.readFileSync('shared/julia/EIFCase.jl','utf8');
const sources = {
  core: moduleSource.split('# BEGIN_CH01')[1].split('# END_CH01')[0].trim().split('\n'),
  lesson: fs.readFileSync('zh/julia/lessons/ch01.jl','utf8').trim().split('\n'),
};
const output = fs.readFileSync('zh/julia/lessons/ch01-output.txt','utf8');

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    fs.mkdirSync(screenshots,{recursive:true});
    for (const width of [1360,375]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors=[],external=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.route('**/*',r=>{
        const url=r.request().url();
        if(url.startsWith(new URL(baseURL).origin+'/')||url.startsWith('data:'))return r.continue();
        external.push(url);return r.abort();
      });
      await page.goto(baseURL+'/?edition=ch01-julia-lines#chapter-1');
      await page.evaluate(()=>document.fonts.ready);
      const guide=page.locator('#ch01-julia-guide');
      await guide.waitFor({state:'visible'});
      assert.equal(await guide.locator('.julia-line-card').count(),32);
      for (const card of await guide.locator('.julia-line-card').all()) {
        const name=await card.getAttribute('data-julia-part'), index=Number(await card.getAttribute('data-julia-line'));
        assert.equal(await card.locator('code.language-julia').textContent(),sources[name][index-1]+'\n');
        assert(await card.locator('p').count()>=2,'source line has an explanation');
        assert(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1),`card ${name}:${index} stays inside viewport`);
      }
      const equations=guide.locator('.equation');
      assert.equal(await equations.count(),2);
      for(const equation of await equations.all()){
        assert(await equation.locator('math').count()>0);
        assert(await equation.evaluate(e=>e.nextElementSibling?.classList.contains('formula-recall')));
      }
      const raw=await guide.evaluate(e=>{
        const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),bad=[];
        while(walker.nextNode()){
          const node=walker.currentNode;
          if(node.parentElement.closest('.katex,code,pre'))continue;
          if(/\$|\\(?:sum|widehat|frac)|\*\*/.test(node.textContent))bad.push(node.textContent);
        }
        return bad;
      });
      assert.deepEqual(raw,[],'no raw TeX, delimiters or emphasis markers');
      const tables=guide.locator('table');
      assert.equal(await tables.count(),4);
      const eventRows=await tables.nth(1).locator('tbody tr').evaluateAll(rs=>rs.map(r=>[...r.cells].map(c=>c.textContent)));
      assert.deepEqual(eventRows.map(r=>Number(r[4])),[0,56,56,72,72,76,76,116]);
      const influenceRows=await tables.nth(2).locator('tbody tr').evaluateAll(rs=>rs.map(r=>[...r.cells].map(c=>c.textContent)));
      assert.equal(influenceRows[1][1],'0.280000');
      assert.equal(influenceRows[1][2],'0.420000');
      assert.equal(influenceRows[1][3],'0.117600');
      assert.equal(influenceRows.at(-1)[4],'0.000000');
      assert.equal(await guide.locator('pre code.language-text').last().textContent(),output);
      for (const answer of await guide.locator('details').all()) {
        assert(!(await answer.evaluate(e=>e.open)),'predictions start folded');
        await answer.locator('summary').click();assert(await answer.evaluate(e=>e.open));
        assert(await answer.locator('math').count()>0);
        await answer.locator('summary').click();
      }
      for (const pre of await guide.locator('pre').all()) assert.equal(await pre.getAttribute('tabindex'),'0');
      const longCode=guide.locator('[data-julia-part="lesson"][data-julia-line="5"] pre');
      await longCode.focus();
      if(await longCode.evaluate(e=>e.scrollWidth>e.clientWidth+1)){
        await longCode.press('ArrowRight');
        await page.waitForFunction(e=>e.scrollLeft>0,await longCode.elementHandle());
      }
      const firstTable=guide.locator('.table-wrap').first();
      if(await firstTable.evaluate(e=>e.scrollWidth>e.clientWidth+1)){
        await firstTable.focus();await firstTable.press('ArrowRight');
        await page.waitForFunction(e=>e.scrollLeft>0,await firstTable.elementHandle());
      }
      for(const [name,part,line] of [['add','core',6],['weight','core',15],['return','core',17],['call','lesson',7],['round','lesson',13]]){
        await guide.locator(`[data-julia-part="${part}"][data-julia-line="${line}"]`).screenshot({path:path.join(screenshots,`ch01-julia-${name}-${width}.png`)});
      }
      for(const [name,title] of [['start','先运行一次'],['events','走进函数'],['influence','第二次循环'],['output','核对实际输出']]){
        const heading=guide.locator('h4').filter({hasText:title});
        await heading.scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(screenshots,`ch01-julia-${name}-${width}.png`)});
      }
      await page.locator('#chapter-1 .case-workbench [data-case-action="reveal"]').click();
      assert((await page.locator('#chapter-1 .case-workbench').innerText()).includes('58.42%'));
      await page.locator('#chapter-1 .case-workbench .case-reset').click();
      assert.equal(await guide.locator('.julia-line-card').count(),32,'case reset does not replace guide');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
      await page.close();
      console.log(`PASS chapter 1 Julia walkthrough: ${width}px; 32 exact source lines, two rendered formulas, loop ledgers, output, answers, keyboard/layout/console`);
    }
  } finally {await browser.close();}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
