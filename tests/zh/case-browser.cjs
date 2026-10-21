const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseURL =( (process.env.EIF_URL || 'http://127.0.0.1:4174').replace(/\/$/, '')).replace(/(?:\/zh)?$/, '/zh');
const chapters = (process.env.CASE_CHAPTERS || '0,1,2,3,4,5,6,7,8').split(',').map(Number);
const screenshots = process.env.EIF_SCREENSHOT_DIR || 'output/zh/playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    fs.mkdirSync(screenshots, { recursive: true });
    for (const width of [1360, 375]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, acceptDownloads: true });
      const errors = [], external = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith(new URL(baseURL).origin + '/') || url.startsWith('data:')) return route.continue();
        external.push(url); return route.abort();
      });
      await page.goto(baseURL + '/?edition=case-study');
      await page.evaluate(() => document.fonts.ready);
      for (const n of chapters) {
        await page.locator(`nav a[href="#chapter-${n}"]`).click();
        const chapter = page.locator(`#chapter-${n}`);
        await chapter.waitFor({ state: 'visible' });
        const work = chapter.locator(`.case-workbench[data-case-study="${n}"]`);
        await work.waitFor({ state: 'visible' });
        assert.equal(await work.getAttribute('data-case-mounted'), 'true');
        assert(!/NaN|undefined/.test(await work.innerText()));
        assert(await work.evaluate(e => e.scrollWidth <= e.clientWidth + 1), `chapter ${n} workbench overflows`);
        if (n > 0) {
          const code = chapter.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Julia：本讲新增' }) });
          assert.equal(await code.count(), 1, `chapter ${n} has executable Julia source`);
          assert(!(await code.evaluate(e => e.open)));
          await code.locator('summary').click();
          assert(await code.locator('code.language-julia').count() >= 2);
          const number = String(n).padStart(2, '0');
          const moduleSource = fs.readFileSync('shared/julia/EIFCase.jl', 'utf8');
          const expectedDefinition = moduleSource.split(`# BEGIN_CH${number}`)[1].split(`# END_CH${number}`)[0].trim() + '\n';
          const expectedUsage = fs.readFileSync(`zh/julia/lessons/ch${number}.jl`, 'utf8').trim() + '\n';
          assert.equal(await code.locator('code.language-julia').nth(0).textContent(), expectedDefinition, 'rendered Julia definition exactly matches tested source');
          assert.equal(await code.locator('code.language-julia').nth(1).textContent(), expectedUsage, 'rendered Julia use exactly matches tested source, including __DIR__');
          const pre = code.locator('pre').first();
          assert.equal(await pre.getAttribute('tabindex'), '0');
          await pre.focus();
          if (await pre.evaluate(e => e.scrollWidth > e.clientWidth + 1)) {
            await pre.press('ArrowRight');
            await page.waitForFunction(e => e.scrollLeft > 0, await pre.elementHandle());
          }
          await code.screenshot({ path: path.join(screenshots, `case-julia-ch${String(n).padStart(2, '0')}-${width}.png`) });
          await code.locator('summary').click();
        }
        if (n === 0) {
          assert((await work.innerText()).includes('人；记录CSV每行一人'));
          for (const name of ['rws-counts.csv', 'rws-records.csv']) {
            const pending = page.waitForEvent('download');
            await work.locator(`a[download="${name}"]`).click();
            const downloaded = await pending;
            assert.equal(downloaded.suggestedFilename(), name);
            const saved = path.join(screenshots, `case-${width}-${name}`);
            await downloaded.saveAs(saved);
            const lines = fs.readFileSync(saved, 'utf8').trim().split(/\r?\n/);
            assert.equal(lines.length, name.includes('counts') ? 9 : 201);
          }
        }
        if (n === 1) {
          assert((await work.innerText()).includes('116 / 200'));
          assert((await work.innerText()).includes('58.00%'));
          assert(!(await work.innerText()).includes('二元均值影响值'), 'prediction comes before the revealed influence');
          await work.locator('[data-case-action="reveal"]').click();
          assert((await work.innerText()).includes('0.420000'));
          assert((await work.innerText()).includes('58.42%'));
          await work.locator('[data-case-key="y"]').selectOption('0');
          assert((await work.innerText()).includes('-0.580000'));
          await page.locator('#mean-t').fill('0.2');
          await work.locator('.case-reset').click();
          assert.equal(await page.locator('#mean-t').inputValue(), '0.2', 'case reset preserves the original experiment');
          assert(!(await work.innerText()).includes('二元均值影响值'));
        }
        if (n === 2) {
          assert.equal(await work.locator('[data-case-key="index"]').inputValue(), '3');
          assert((await work.innerText()).includes('(0,1,1)'));
          assert((await work.innerText()).includes('11.500000'));
          assert((await work.innerText()).includes('0.584200'));
          const t = work.locator('[data-case-key="t"]');
          await t.fill('0'); await t.press('Tab');
          assert((await work.innerText()).includes('t=0未定义'));
          await work.locator('[data-case-key="index"]').selectOption('0');
          await t.fill('-0.01'); await t.press('Tab');
          assert((await work.innerText()).includes('0.585800'));
          await work.locator('.case-reset').click();
          assert.equal(await work.locator('[data-case-key="index"]').inputValue(), '3');
          assert((await work.innerText()).includes('0.584200'));
        }
        if (n === 3) {
          const rows = await work.locator('tbody tr').evaluateAll(rs => rs.map(r => [...r.cells].map(c => c.textContent)));
          assert.deepEqual(rows.map(r => [Number(r[2]), Number(r[3])]), [[80,56],[20,16],[20,4],[80,40]]);
          assert.deepEqual(rows.map(r => Number(r[7])), [.6,.56,.6,.56]);
          assert((await work.innerText()).includes('-4.000 pp'));
        }
        if (n === 4) {
          assert.deepEqual(await work.locator('.metric-value').allTextContents(), ['-4.000 pp','0.240000','0.240000']);
          const contributions = await work.locator('table').first().locator('tbody tr').evaluateAll(rs => rs.map(r => Number(r.cells[6].textContent)));
          assert.deepEqual(contributions, [-10,24,40,-6]);
          assert((await work.innerText()).includes('初始拟合梯度的样本平均'));
          assert(!(await work.innerText()).includes('20.000 pp'), 'chapter 4 saves the diagnostic without prematurely solving the estimator');
        }
        if (n === 5) {
          assert.equal(await work.locator('table').nth(0).locator('tbody tr').count(), 8);
          assert.equal(await work.locator('table').nth(1).locator('tbody tr').count(), 7);
          const rows = await work.locator('tbody tr').evaluateAll(rs => rs.map(r => [...r.cells].map(c => c.textContent)));
          assert(rows.every(r => Math.abs(Number(r[1])) < 1e-10 && Math.abs(Number(r[4])) < 1e-7));
          assert.equal(rows[3][0], '(0,1,1)');
          assert.equal(Number(rows[3][3]), .9);
        }
        if (n === 6) {
          const input = work.locator('[data-case-key="coefficient"]');
          const norms = async () => (await work.locator('.metric-value').allTextContents()).slice(2).map(Number);
          assert.deepEqual(await norms(), [1.2575,1.0975]);
          await input.fill('2'); await input.press('Tab');
          assert.deepEqual(await norms(), [1.7375,1.0975]);
          const rows = await work.locator('tbody tr').evaluateAll(rs => rs.map(r => [...r.cells].map(c => c.textContent)));
          for (const row of rows) {
            assert(Math.abs(Number(row[1])-Number(row[4])) < 1e-10);
            assert(Math.abs(Number(row[5])-2*Number(row[2])) < 1e-10);
          }
          await input.fill('-2'); await input.press('Tab');
          assert.deepEqual(await norms(), [1.7375,1.0975]);
          await input.fill('0'); await input.press('Tab');
          assert.deepEqual(await norms(), [1.0975,1.0975]);
          await work.locator('.case-reset').click();
          assert.equal(await input.inputValue(), '1');
        }
        if (n === 7) {
          const values = await work.locator('.metric-value').allTextContents();
          assert.deepEqual(values, ['0.240000','1.640000','1.582400','8.895 pp','0.000000','1.097500','1.097500','7.408 pp']);
          assert.equal(await work.locator('tbody tr').count(), 8);
          const centred = await work.locator('tbody tr').evaluateAll(rs => rs.reduce((sum,r) => sum + Number(r.cells[5].textContent),0));
          assert(Math.abs(centred-1.5824) < 5e-6);
          assert(!(await work.innerText()).includes('95%'));
          await work.locator('.case-reset').click();
          assert.deepEqual(await work.locator('.metric-value').allTextContents(), values);
        }
        if (n === 8) {
          const input = work.locator('[data-case-key="epsilon"]');
          const score = async () => Number(await work.locator('.case-output > .metrics').first().locator('.metric-value').nth(1).textContent());
          assert.equal(await input.inputValue(), '0');
          assert.equal(await score(), .24);
          assert.equal(await work.locator('.case-answer').textContent(), '', 'full answer is not computed or displayed before explicit reveal');
          await input.fill('0.1'); await input.press('Tab');
          assert(Math.abs((await score())-.089131462) < 1e-9);
          await input.fill('0.2'); await input.press('Tab');
          assert(Math.abs((await score())+.050881583) < 1e-9);
          await work.locator('.case-reset').click();
          await work.locator('[data-case-action="step"]').click();
          assert.equal(await input.inputValue(), '0');
          assert((await work.innerText()).includes('[0.000000000, 1.000000000]'));
          await work.locator('[data-case-action="step"]').click();
          assert.equal(await input.inputValue(), '0.5');
          assert((await work.innerText()).includes('[0.000000000, 0.500000000]'));
          assert((await score()) < 0);
          await input.fill('2'); await input.press('Tab');
          assert((await work.locator('.case-status').textContent()).includes('超出'));
          assert.equal(await work.getAttribute('data-case-epsilon'), '0.5', 'invalid input preserves last computed state');
          await work.locator('.case-reset').click();
          await work.locator('[data-case-action="solve"]').click();
          assert(Math.abs(Number(await input.inputValue())-.162239239634958) < 1e-10);
          assert(Math.abs(await score()) < 1e-10);
          const values = await work.locator('.metric-value').allTextContents();
          assert.equal(values[2], '20.000 pp');
          assert.equal(values[3], '0.000000000000');
          assert.equal(values[6], '1.219262');
          assert.equal(values[7], '7.808 pp');
          const updated = await work.locator('table').first().locator('tbody tr').evaluateAll(rs => rs.map(r => Number(r.cells[7].textContent)));
          for (const [i,q] of [.5504938029381764,.7412274916740937,.3999361660282145,.6092024772922973].entries()) assert(Math.abs(updated[i]-q) < 1e-9);
          for (const metric of await work.locator('.metric-value').all()) {
            assert(await metric.evaluate(e => e.scrollWidth <= e.clientWidth+1), 'long root/score fits the card');
            assert(await metric.evaluate(e => e.clientHeight <= parseFloat(getComputedStyle(e).lineHeight)+1), 'a decimal value is never split across lines');
          }
          await work.screenshot({path:path.join(screenshots, `case-tmle-solved-${width}.png`)});
          await work.locator('.case-solution summary').click();
          await page.waitForFunction(e => e.textContent.includes('20.000 pp'), await work.locator('.case-answer').elementHandle());
          assert((await work.locator('.case-answer').innerText()).includes('20.000 pp'));
          assert((await work.innerText()).includes('手动二分保留区间'));
          assert((await work.innerText()).includes('自动求根从[−1,1]独立运行'));
          assert.equal(await work.locator('.case-answer tbody tr').count(),4);
          await page.locator('#trial-epsilon').fill('0.3');
          await work.locator('.case-reset').click();
          assert.equal(await input.inputValue(),'0');
          assert.equal(await score(),.24);
          assert.equal(await work.locator('.case-answer').textContent(),'');
          assert.equal(await page.locator('#trial-epsilon').inputValue(),'0.3','sample-case reset preserves population experiment');
          assert(!(await work.innerText()).includes('95%'));
        }
        for (const wrap of await work.locator('.table-wrap').all()) {
          assert.equal(await wrap.getAttribute('tabindex'), '0');
          if (await wrap.evaluate(e => e.scrollWidth > e.clientWidth + 1)) {
            await wrap.focus(); await wrap.press('ArrowRight');
            await page.waitForFunction(e => e.scrollLeft > 0, await wrap.elementHandle());
            // Let the native key-scroll animation finish before restoring the screenshot position.
            await wrap.evaluate(e => new Promise(resolve => {
              let previous = e.scrollLeft, stable = 0;
              const frame = () => {
                stable = Math.abs(e.scrollLeft - previous) < .1 ? stable + 1 : 0;
                previous = e.scrollLeft;
                if (stable >= 5) { e.blur(); e.scrollTo({left: 0, behavior: 'instant'}); resolve(); }
                else requestAnimationFrame(frame);
              };
              requestAnimationFrame(frame);
            }));
            await page.waitForFunction(e => e.scrollLeft === 0, await wrap.elementHandle());
          }
        }
        const thread = chapter.locator('.case-thread');
        if (await thread.count()) {
          for (const eq of await thread.locator('.equation').all()) {
            assert(await eq.locator('math').count() > 0);
            assert(await eq.evaluate(e => e.nextElementSibling?.classList.contains('formula-recall')), `case ${n}: display formula has local symbol recall`);
          }
          assert(!/\*\*/.test(await thread.innerText()), `case ${n}: emphasis renders`);
        }
        await work.screenshot({ path: path.join(screenshots, `case-workbench-ch${String(n).padStart(2, '0')}-${width}.png`) });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `chapter ${n} page overflows`);
      }
      if (chapters.includes(1) && chapters.includes(2)) {
        await page.locator('nav a[href="#chapter-1"]').click();
        const first = page.locator('.case-workbench[data-case-study="1"]');
        await first.locator('[data-case-key="y"]').selectOption('0');
        await first.locator('[data-case-key="t"]').fill('0.2');
        await first.locator('[data-case-key="t"]').press('Tab');
        await first.locator('[data-case-action="reveal"]').click();
        assert((await first.innerText()).includes('46.40%'));
        for (const number of [2,6,8].filter(number => chapters.includes(number))) {
          await page.locator(`nav a[href="#chapter-${number}"]`).click();
          await page.locator(`.case-workbench[data-case-study="${number}"] .case-reset`).click();
        }
        await page.locator('nav a[href="#chapter-1"]').click();
        assert.equal(await first.locator('[data-case-key="y"]').inputValue(), '0');
        assert.equal(await first.locator('[data-case-key="t"]').inputValue(), '0.2');
        assert((await first.innerText()).includes('46.40%'), 'other chapter resets cannot overwrite case 1');
        await first.locator('.case-reset').click();
      }
      assert.deepEqual(errors, []); assert.deepEqual(external, []);
      await page.close();
      console.log(`PASS fixed case chapters ${chapters.join(',')}: ${width}px, Julia source/keyboard, case operations/reset, layout, console`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
