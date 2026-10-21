const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseURL=((process.env.EIF_URL||'http://127.0.0.1:4174').replace(/\/$/,'')).replace(/(?:\/zh)?$/, '/zh');
const screenshotDir=process.env.EIF_SCREENSHOT_DIR||'output/zh/playwright';
const chapterLimit = Number(process.env.CHAPTER_LIMIT || 9);
const readerBridges={
  0:['先规定一个教学问题','统计效率'],
  1:['先按逐人平均的方式计算','原分布这个起点计算'],
  2:['对数把乘法比例变成加法差值','0.72153'],
  3:['1000 份人群权重','三个条件同时满足的概率'],
  4:['这里不用先记商式法则','最后一项是两个变化量的乘积'],
  5:['先练习本章的平均工具','组内固定的数可以提出平均'],
  6:['先把“函数空间”读成','单基辅助练习'],
  7:['先用一个独立的尺度练习','先用两种确定性的假想余项练习判断'],
  8:['四条记录算出的','把这个要求写成一份可算的误差预算']
};
(async()=>{
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    fs.mkdirSync(screenshotDir,{recursive:true});
    for(const width of [1360,375]) {
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[],external=[];await page.route('**/*',route=>{const url=route.request().url();if(url.startsWith(new URL(baseURL).origin+'/')||url.startsWith('data:'))return route.continue();external.push(url);return route.abort();});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.goto(baseURL+'/');await page.locator('#intro-target').waitFor();
      assert(await page.locator('#chapter-0').isVisible(),'new readers start with the concept introduction');
      assert.equal(await page.locator('nav a').first().getAttribute('href'),'#chapter-0');
      assert.equal(await page.locator('.brand').getAttribute('href'),'#chapter-0');
      assert.equal(await page.locator('#chapter-0 footer .next').getAttribute('href'),'#chapter-1');
      assert.equal(await page.locator('#chapter-8 footer .next').count(),0,'last main chapter must not link to a non-existent chapter 9');
      const count=await page.locator('.chapter').count();assert.equal(count,chapterLimit);
      const skip=page.locator('.skip');await skip.focus();assert(await skip.isVisible());assert.equal(await skip.evaluate(e=>getComputedStyle(e).clipPath),'none');
      await page.locator('nav a[href="#chapter-1"]').click();
      assert((await page.locator('.reader-note').innerText()).includes('基础应用生物统计'));
      await page.screenshot({path:path.join(screenshotDir,`reader-entry-${width}.png`)});
      const chapterNumbers=await page.locator('.chapter').evaluateAll(es=>es.map(e=>Number(e.dataset.number)));
      assert.deepEqual(chapterNumbers,Array.from({length:count},(_,i)=>i));
      for(const n of chapterNumbers){
        await page.locator(`nav a[href="#chapter-${n}"]`).click();
        const chapter=page.locator(`#chapter-${n}`);await chapter.waitFor({state:"visible"});assert(await chapter.isVisible());
        const chapterText=await chapter.innerText();
        for(const bridge of readerBridges[n])assert(chapterText.includes(bridge),`ch${n} reader bridge missing: ${bridge}`);
        const bridgeParagraph=chapter.locator('p').filter({hasText:readerBridges[n][0]}).first();
        const bridgeHeading=chapter.locator('h2').filter({hasText:readerBridges[n][0]}).first();
        await ((await bridgeParagraph.count())?bridgeParagraph:bridgeHeading).scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(screenshotDir,`reader-ch${String(n).padStart(2,'0')}-${width}.png`)});
        assert(await chapter.locator('.katex math').count()>0,`ch${n} missing MathML`);
        assert(await chapter.locator('p .inline-math math').count()>0,`ch${n} sentence mathematics not rendered`);
        assert.equal(await chapter.locator('.inline-math .katex-display').count(),0,'sentence formula stays inline');
        if(width===375){
          const wide=await chapter.locator('.inline-math').evaluateAll(es=>es.map((e,i)=>({i,wide:e.scrollWidth>e.clientWidth+1,tab:e.tabIndex})).filter(e=>e.wide));
          assert(wide.every(e=>e.tab===0),'overflowing sentence formula must be keyboard focusable');
          if(wide.length){
            const formula=chapter.locator('.inline-math').nth(wide[0].i);
            await formula.focus();await formula.press('ArrowRight');
            await page.waitForFunction(el=>el.scrollLeft>0,await formula.elementHandle());
            await formula.press('ArrowLeft');
          }
        }
        const unrendered=await chapter.evaluate(el=>{
          const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),bad=[];
          while(walker.nextNode()){
            const node=walker.currentNode;
            if(node.parentElement.closest('.katex,.lab,code,pre'))continue;
            if(/(?:[A-Za-zΨψμ])[＿_][A-Za-z0-9]/.test(node.textContent)||/\$[^$]+\$/.test(node.textContent))bad.push(node.textContent);
          }
          return bad;
        });
        assert.deepEqual(unrendered,[],`ch${n} raw sentence formula or delimiters`);
        if(n===0){
          assert.equal(await chapter.locator('figure[data-intro-visual-id]').count(),7);
          assert.equal(await chapter.locator('.course-visual').count(),0);
          assert.equal(await chapter.locator('.equation').count(),4);
          const errorFigure=chapter.locator('#intro-visual-fit-error');
          const numericDetails=errorFigure.locator('xpath=ancestor::details');
          assert(!(await numericDetails.evaluate(e=>e.open)),'specific arithmetic is secondary to the visible estimator overview');
          await numericDetails.locator('summary').click();
          assert((await errorFigure.locator('[data-error-arm="1"]').innerText()).includes('+1 pp'));
          assert((await errorFigure.locator('[data-error-arm="0"]').innerText()).includes('-1 pp'));
          assert.deepEqual(await errorFigure.locator('.intro-error-result').allTextContents(),['拟合ATE：21 pp','拟合ATE：19 pp']);
          for(const [step,title] of [['1','5.1 先看估计量的组件，以及IF的位置'],['2','5.2 为什么这个工具会是一个“函数”？'],['3','5.3 目标对分布敏感，怎样又联系到估计误差？'],['4','5.4 已经有IF，为什么还要加上“efficient”？'],['5','5.5 这和AIPW、TMLE有什么关系？']]){
            const heading=chapter.locator('h3').filter({hasText:title});
            assert.equal(await heading.count(),1,'IF motivation unfolds in the main text');
            await heading.scrollIntoViewIfNeeded();
            await page.screenshot({path:path.join(screenshotDir,`ch00-if-bridge-step${step}-${width}.png`)});
          }
          const errorRecall=chapter.locator('.recall-popover').filter({hasText:'这是一套拟合值的误差'}).first();
          await errorRecall.locator('xpath=..').locator('.recall-trigger').click();
          assert((await errorRecall.innerText()).includes('这是一套拟合值的误差'));
          assert((await errorRecall.innerText()).includes('不是已经对重复抽样平均'));
          await page.keyboard.press('Escape');
          await numericDetails.locator('summary').click();
          assert(chapterText.includes('永远报“20个百分点”'));
          const bridgeText=await chapter.locator('h2').filter({hasText:'5. IF与'}).evaluate(heading=>{
            let text='';for(let e=heading.nextElementSibling;e&&e.tagName!=='H2';e=e.nextElementSibling)text+=e.textContent;
            return text;
          });
          assert(!bridgeText.includes('**'),'IF introduction renders emphasis without raw Markdown markers');
          assert(await chapter.locator('p .inline-math annotation').allTextContents().then(ts=>ts.includes('\\Psi(P)')));
          for(const figure of await chapter.locator('figure[data-intro-visual-id]').all()){
            const id=await figure.getAttribute('data-intro-visual-id');
            const folded=figure.locator('xpath=ancestor::details');
            if(await folded.count())await folded.locator('summary').first().click();
            assert(await figure.isVisible());
            assert.equal(await figure.locator('.formula-recall').count(),1);
            assert(await figure.evaluate(e=>e.scrollWidth<=e.clientWidth+1),`intro diagram ${id} overflows`);
            await figure.screenshot({path:path.join(screenshotDir,`ch00-visual-${id}-${width}.png`)});
            if(await folded.count())await folded.locator('summary').first().click();
          }
          const localNotes=await chapter.locator('.equation').evaluateAll(es=>es.map(e=>e.nextElementSibling?.classList.contains('formula-recall')));
          assert(localNotes.every(Boolean),'introductory formulas retain symbol and operation recalls');
          const target=chapter.locator('.intro-target strong');
          assert.equal(await target.innerText(),'20.00 pp');
          assert((await chapter.locator('.lab .metric-value').allTextContents()).includes('-4.00 pp'));
          assert(!(await chapter.locator('details').first().evaluate(e=>e.open)),'prediction answer starts folded');
          await page.locator('#intro-assignment').selectOption('randomised');
          assert.equal(await target.innerText(),'20.00 pp','assignment mechanism does not change the same-population estimand');
          assert.equal(await chapter.locator('.lab .metric-value').nth(3).innerText(),'20.00 pp');
          await page.locator('#intro-population').selectOption('0.2');assert.equal(await target.innerText(),'14.00 pp');
          await page.locator('#intro-population').selectOption('0.8');assert.equal(await target.innerText(),'26.00 pp');
          await page.locator('#intro-target').selectOption('risk1');assert.equal(await target.innerText(),'56.00%');
          await page.locator('#intro-target').selectOption('risk0');assert.equal(await target.innerText(),'30.00%');
          await chapter.locator('.reset').click();assert.equal(await target.innerText(),'20.00 pp');
          await chapter.locator('.lab').screenshot({path:path.join(screenshotDir,`ch00-lab-${width}.png`)});
          await chapter.locator('footer .next').click();await page.locator('#chapter-1').waitFor({state:'visible'});assert(await page.locator('#chapter-1').isVisible(),'chapter 0 hands off to the original mean derivation');
          await page.locator('nav a[href="#chapter-0"]').click();await chapter.waitFor({state:'visible'});
        }
        if(n===1)await require('./ch01-survival-checks.cjs')(page,chapter,width,screenshotDir);
        assert.equal(await chapter.locator('.katex-error').count(),0);
        assert.equal(await chapter.locator('.lab .error').count(),0);
        assert(await chapter.locator('.lab input,.lab select').count()>0);
        const before=await chapter.locator('.lab .results').innerText();
        for(const control of await chapter.locator('.lab input[type=range]:visible').all()){
          const original=await control.inputValue();await control.focus();await control.press(original===await control.getAttribute('max')?'ArrowLeft':'ArrowRight');assert.notEqual(await control.inputValue(),original,'keyboard must change value');
        }
        for(const control of await chapter.locator('.lab select:visible').all()){
          const options=await control.locator('option').evaluateAll(os=>os.map(o=>o.value));
          if(options.length>1){const current=await control.inputValue();await control.selectOption(options.find(o=>o!==current));assert.notEqual(await control.inputValue(),current,'selection must change');}
        }
        await chapter.locator('.lab .reset').click();assert.equal(await chapter.locator('.lab .results').innerText(),before,`ch${n} reset`);
        for(const details of await chapter.locator('details').all()){
          await details.locator('summary').click();assert(await details.evaluate(e=>e.open));
          assert(!((await details.innerText()).includes('$$')),`ch${n} raw TeX in details`);
          await details.locator('summary').click();
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`ch${n} ${width}px document overflow`);
        const bad=await chapter.locator('input,select,button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+1)}).map(e=>e.id||e.textContent));
        assert.deepEqual(bad,[],`ch${n} controls outside viewport`);
        await chapter.locator('.lab').scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(screenshotDir,`ch${String(n).padStart(2,'0')}-${width}.png`)});
      }
      await page.locator('nav a[href="#chapter-1"]').click();
      await page.locator('#mean-z').selectOption('1');await page.locator('#mean-t').fill('0.2');
      assert((await page.locator('#chapter-1 .results').innerText()).includes('0.6640'));
      if(width===375){
        const equations=page.locator('#chapter-1 .equation');
        const wideIndex=await equations.evaluateAll(es=>es.findIndex(e=>e.scrollWidth>e.clientWidth+1));
        assert(wideIndex>=0);const equation=equations.nth(wideIndex);
        assert(await equation.evaluate(e=>e.scrollWidth>e.clientWidth),'long formula must scroll locally');
        await equation.focus();await equation.press('ArrowRight');
        await page.waitForFunction(el=>el.scrollLeft>0,await equation.elementHandle());
        await equation.press('ArrowLeft');
      }
      await page.locator('#mean-z').selectOption('0');await page.locator('#mean-t').fill('0.8');
      assert((await page.locator('#chapter-1 .results').innerText()).includes('0.1160'));
      await page.locator('#chapter-1 .reset').click();
      if(count>=2){
        await page.locator('nav a[href="#chapter-2"]').click();
        await page.locator('#score-z').selectOption('0');await page.locator('#point-t').fill('-0.1');
        const txt=await page.locator('#chapter-2 .results').innerText();
        for(const expected of ['0.6380','-0.5800','0.362','0.638','1.381'])assert(txt.includes(expected),`ch2 missing ${expected}`);
        const scoreBefore=await page.locator('#chapter-2 tbody tr').evaluateAll(rows=>rows.map(r=>[r.cells[3].textContent,r.cells[4].textContent,r.cells[5].textContent]));
        await page.locator('#point-t').fill('0.2');
        const scoreAfter=await page.locator('#chapter-2 tbody tr').evaluateAll(rows=>rows.map(r=>[r.cells[3].textContent,r.cells[4].textContent,r.cells[5].textContent]));
        assert.deepEqual(scoreBefore,scoreAfter,'base score/direction independent of t');
        await page.locator('nav a[href="#chapter-1"]').click();await page.locator('#mean-t').fill('0.25');
        await page.locator('nav a[href="#chapter-2"]').click();await page.locator('#chapter-2 .reset').click();
        await page.locator('nav a[href="#chapter-1"]').click();assert.equal(await page.locator('#mean-t').inputValue(),'0.25','reset isolated across chapters');
        await page.locator('#chapter-1 .reset').click();
      }

      if(count>=3){
        await page.locator('nav a[href="#chapter-3"]').click();await page.locator('#factor-kind').selectOption('A');
        await page.locator('#factor-g0').fill('0.5');await page.locator('#factor-g1').fill('0.5');
        let values=await page.locator('#chapter-3 .lab .metric-value').allTextContents();assert.equal(values[0],'20.00 pp');assert.equal(values[1],'20.00 pp');
        await page.locator('#factor-g0').fill('0.05');await page.locator('#factor-g1').fill('0.95');values=await page.locator('#chapter-3 .lab .metric-value').allTextContents();assert.equal(values[0],'20.00 pp');assert.notEqual(values[1],'20.00 pp');
        await page.locator('#factor-kind').selectOption('X');await page.locator('#factor-px').fill('0.8');assert.equal(await page.locator('#chapter-3 .lab .metric-value').first().innerText(),'26.00 pp');
        await page.locator('#factor-kind').selectOption('Y');await page.locator('#factor-q11').fill('0.7');assert.equal(await page.locator('#chapter-3 .lab .metric-value').first().innerText(),'30.00 pp');
        assert.equal(await page.locator('#chapter-3 .lab details tbody tr').count(),8);
        await page.locator('#factor-kind').selectOption('A');assert.equal(await page.locator('#factor-g0').inputValue(),'0.2');assert.equal(await page.locator('#factor-g1').inputValue(),'0.8');assert.equal(await page.locator('#chapter-3 .lab .metric-value').nth(1).innerText(),'-4.00 pp');
        await page.locator('#chapter-3 .reset').click();
      }
      if(count>=4){
        await page.locator('nav a[href="#chapter-4"]').click();
        const slopes=[.775,-.475,-4.1,.9,1.1,-3.9,-.525,.725];
        for(let k=0;k<8;k++){
          await page.locator('#ate-cell').selectOption(String(k));const vals=await page.locator('#chapter-4 .lab .metric-value').allTextContents();
          assert(Math.abs(parseFloat(vals[2])-slopes[k])<1e-5,'all cell EIFs in UI');assert(Math.abs(parseFloat(vals[3])-slopes[k])<2e-5,'independent finite difference in UI');
        }
        await page.locator('#ate-cell').selectOption('5');await page.locator('#ate-t').fill('0.1');const vals=await page.locator('#chapter-4 .lab .metric-value').allTextContents();
        assert.equal(vals[4],'-2.16 pp');assert.equal(vals[5],'-19.00 pp');assert.equal(await page.locator('#chapter-4 .lab details tbody tr').count(),8);
        await page.locator('#chapter-4 .reset').click();
      }
      if(count>=5){
        await page.locator('nav a[href="#chapter-5"]').click();
        for(const [kind,expected] of [['X',.05],['A',0],['Y',.02],['J',-.028]]){
          await page.locator('#path-kind').selectOption(kind);const values=await page.locator('#chapter-5 .lab .metric-value').allTextContents();assert(Math.abs(parseFloat(values[0])-expected)<1e-6);assert(Math.abs(parseFloat(values[1])-expected)<1e-6);
        }
        await page.locator('#path-kind').selectOption('A');
        for(const t of ['-3','2','3']){
          await page.locator('#path-t').fill(t);assert.equal(await page.locator('#chapter-5 .lab .metric-value').nth(2).innerText(),'20.00 pp');
          const rows=await page.locator('#chapter-5 .lab table').first().locator('tbody tr').evaluateAll(rs=>rs.map(r=>[...r.cells].map(c=>c.textContent)));
          assert(rows.every(r=>r[1]==='0.500 → 0.500'));assert.equal(rows[0][3],'0.700 → 0.700');assert.equal(rows[1][3],'0.200 → 0.200');assert(rows.some(r=>{const v=r[2].split(' → ');return v[0]!==v[1]}),'pure g path must actually change g');
        }
        await page.locator('#path-kind').selectOption('J');await page.locator('#path-t').fill('3');
        const extreme=await page.locator('#chapter-5 .lab table').first().locator('tbody tr').evaluateAll(rs=>rs.flatMap(r=>[...r.cells].slice(1).map(c=>c.textContent.split(' → ')[1])));assert(extreme.every(v=>v!=='0.000'&&v!=='1.000'),'positive extreme probabilities not rounded to false boundary');
        await page.locator('#chapter-5 .reset').click();
      }
      if(count>=6){
        await page.locator('nav a[href="#chapter-6"]').click();
        for(const [b,norm,residual] of [['2','1.7375','0.6400'],['-1','1.2575','0.1600'],['0','1.0975','0.0000']]){
          await page.locator('#projection-b').fill(b);const v=await page.locator('#chapter-6 .lab .metric-value').allTextContents();assert.equal(v[0],norm);assert.equal(v[1],'1.0975');assert.equal(v[2],residual);assert.equal(v[3],'0.0000000000');
          const rows=await page.locator('#chapter-6 .lab table').first().locator('tbody tr').evaluateAll(rs=>rs.map(r=>[r.cells[2].textContent,r.cells[5].textContent]));assert(rows.every(([a,c])=>a===c),'actual weighted projection returns canonical gradient');
        }
        const pairs=await page.locator('#chapter-6 .lab details').first().locator('tbody tr').evaluateAll(rs=>rs.map(r=>[...r.cells].slice(1).map(c=>c.textContent)));
        assert.equal(pairs.length,5);const expectedPairs=['0.050000','-0.105000','0.080000','-0.080000','0.125000'];pairs.forEach((r,i)=>{assert.deepEqual(r,[expectedPairs[i],expectedPairs[i],expectedPairs[i],'0.0000000000']);});
        await page.locator('#projection-b').fill('1');const positive=await page.locator('#chapter-6 .lab table').first().locator('tbody tr').evaluateAll(rs=>rs.map(r=>parseFloat(r.cells[6].textContent)));
        await page.locator('#projection-b').fill('-1');const negative=await page.locator('#chapter-6 .lab table').first().locator('tbody tr').evaluateAll(rs=>rs.map(r=>parseFloat(r.cells[6].textContent)));positive.forEach((v,i)=>assert(Math.abs(v+negative[i])<1e-10));
        await page.locator('#chapter-6 .lab details').nth(1).locator('summary').click();assert((await page.locator('#chapter-6 .lab details').nth(1).innerText()).includes('-0.160000'));await page.locator('#chapter-6 .lab details').nth(1).locator('summary').click();
        await page.locator('#chapter-6 .reset').click();
      }
      if(count>=7){
        await page.locator('nav a[href="#chapter-7"]').click();await page.locator('#eff-r').fill('0.2');await page.locator('#eff-n').selectOption('1000');let v=await page.locator('#chapter-7 .lab .metric-value').allTextContents();assert.equal(v[0],'20.00 pp');assert.equal(v[1],'1.097500');assert.equal(v[2],'1.097500');assert.equal(v[3],'3.31 pp');
        await page.locator('#eff-n').selectOption('4000');assert.equal(await page.locator('#chapter-7 .lab .metric-value').nth(3).innerText(),'1.66 pp');
        await page.locator('#eff-n').selectOption('1000');await page.locator('#eff-r').fill('0.05');v=await page.locator('#chapter-7 .lab .metric-value').allTextContents();assert.equal(v[0],'20.00 pp');assert.equal(v[1],'3.452105');assert.equal(v[1],v[2]);assert.equal(v[3],'5.88 pp');
        await page.locator('#eff-r').fill('0.5');assert.equal(await page.locator('#chapter-7 .lab .metric-value').nth(1).innerText(),'0.790000');await page.locator('#chapter-7 .reset').click();
      }
      if(count>=8){
        await page.locator('nav a[href="#chapter-8"]').click();
        for(const preset of ['Q','g','both-correct']){
          await page.locator(`#chapter-8 [data-preset="${preset}"]`).click();const v=await page.locator('#chapter-8 .lab .metric-value').allTextContents();assert.equal(v[0],'20.00 pp');assert.equal(v[2],'20.00 pp');assert.equal(v[3],'20.00 pp');assert(parseFloat(v[7])<1e-12);if(preset!=='g')assert.equal(v[4],'0.000000');
        }
        await page.locator('#chapter-8 [data-preset="both-wrong"]').click();let v=await page.locator('#chapter-8 .lab .metric-value').allTextContents();assert.equal(v[1],'2.00 pp');assert.equal(v[2],'20.20 pp');assert.equal(v[3],'23.47 pp');assert(Math.abs(parseFloat(v[4])-.283175496219227)<1e-6);assert(parseFloat(v[7])<1e-12);
        for(const epsilon of ['-1','1']){
          await page.locator('#trial-epsilon').fill(epsilon);const current=await page.locator('#chapter-8 .lab .metric-value').allTextContents();assert.equal(current[3],v[3],'manual epsilon does not change automatic TMLE');assert.equal(current[4],v[4],'manual epsilon does not change automatic root');assert.notEqual(current[6],v[6],'manual epsilon changes trial score');const rows=await page.locator('#chapter-8 .lab table').first().locator('tbody tr').evaluateAll(rs=>rs.map(r=>[parseFloat(r.cells[4].textContent),parseFloat(r.cells[5].textContent)]));assert(rows.every(row=>row.every(q=>q>0&&q<1)),'logistic trial/targeting predictions in range');
        }
        await page.locator('#chapter-8 .lab details summary').click();assert((await page.locator('#chapter-8 .lab details').innerText()).includes('0.0346703225'),'nonzero updated bias remains visible when score is zero');await page.locator('#chapter-8 .lab details summary').click();
        if(width===375){
          const wrapper=page.locator('#chapter-8 .table-wrap').first();await wrapper.focus();await wrapper.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#chapter-8 .table-wrap').scrollLeft>0);assert(await wrapper.evaluate(e=>e.scrollLeft>0),'wide table scrolls by keyboard');
        }
        await page.locator('#chapter-8 .reset').click();
      }
      await page.locator('nav a[href="#chapter-1"]').click();await page.locator('#chapter-1 .mark-read').click();assert((await page.locator('#reading-status').textContent()).includes(`1 / ${count}`));
      await page.locator('nav a[href="#chapter-0"]').click();await page.locator('#chapter-0 .mark-read').click();assert((await page.locator('#reading-status').textContent()).includes(`2 / ${count}`),'chapter zero can be marked learned');
      await page.locator('nav a[href="#chapter-1"]').click();await page.locator('#chapter-1').waitFor({state:'visible'});
      if(count>=8){
        await page.locator('#mean-t').fill('0.3');await page.locator('nav a[href="#chapter-8"]').click();await page.locator('#chapter-8 [data-preset="Q"]').click();await page.locator('#chapter-8 .reset').click();await page.locator('nav a[href="#chapter-1"]').click();assert.equal(await page.locator('#mean-t').inputValue(),'0.3','first/last chapter reset isolation');await page.locator('#chapter-1 .reset').click();
      }
      await page.goto(baseURL+'/sources.html');assert(await page.locator('h1').count()>0);await page.locator('a[href="audit.html"]').click();assert(await page.locator('h1').count()>0);assert(await page.locator('math').count()>0,'audit display mathematics rendered');
      await page.goto(baseURL+'/?edition=legacy#chapter-1');await page.locator('#chapter-1').waitFor({state:'visible'});assert(!(await page.locator('#chapter-0').isVisible()),'existing chapter-one deep links keep their meaning');
      assert.deepEqual(external,[],'course must run without external requests');assert.deepEqual(errors,[],`console/page errors at ${width}px`);
      await page.close();
      console.log(`PASS browser: ${count} chapters, ${width}px, interactions/reset/details/MathML/overflow/console`);
    }
  } finally {await browser.close();}
})().then(()=>{console.log('PASS browser runner: all assertions and browser cleanup completed');process.exit(0);}).catch(e=>{console.error(e);process.exit(1);});
