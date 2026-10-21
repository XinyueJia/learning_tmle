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
  fs.mkdirSync('output/en/verification/language-menu', { recursive: true });
  try {
    for (const width of [1360, 790, 375]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(base + '?edition=language-menu#chapter-7');
      await page.locator('#chapter-7').waitFor({ state: 'visible' });
      assert(page.url().includes(prefix + 'en/?edition=language-menu#chapter-7'));
      assert.equal(await page.locator('html').getAttribute('lang'), 'en-GB');
      assert.equal(await page.title(), 'Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation');
      assert.equal(await page.locator('.course-intro > p').first().innerText(), 'Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation');
      assert((await page.locator('.brand').innerText()).startsWith('Learning TMLE'));
      await page.locator('aside nav [data-chapter="1"]').click();
      await page.waitForURL(url => url.hash === '#chapter-1');
      await page.waitForFunction(() => document.querySelector('[data-language=zh]').getAttribute('href').endsWith('?edition=language-menu#chapter-1'));
      assert((await page.locator('[data-language=zh]').getAttribute('href')).endsWith('?edition=language-menu#chapter-1'));
      assert.equal(await page.locator('[data-language=en]').getAttribute('aria-current'), 'true');
      await page.locator('aside nav [data-chapter="7"]').click();
      await page.locator('#chapter-7').waitFor({ state: 'visible' });
      const summary = page.locator('.language-picker summary');
      await summary.scrollIntoViewIfNeeded();
      assert.equal(await summary.innerText(), 'English');
      assert.equal(await page.locator('[data-language=zh]').isVisible(), false);
      await summary.focus();
      await summary.press('Enter');
      assert(await page.locator('[data-language=zh]').isVisible());
      assert.equal(await page.locator('[data-language=en]').getAttribute('aria-current'), 'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.language-picker').getAttribute('open'), null);
      assert(await summary.evaluate(el => el === document.activeElement));
      await summary.click();
      await page.screenshot({ path: `output/en/verification/language-menu/en-${width}.png` });
      const box = await page.locator('.language-panel').boundingBox();
      assert(box.x >= 0 && box.x + box.width <= width, 'Menu fits viewport');
      await page.locator('[data-language=zh]').click();
      await page.locator('#chapter-7').waitFor({ state: 'visible' });
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
      assert.equal(await page.title(), 'Learning TMLE：影响函数与双重稳健估计学习笔记');
      assert.equal(await page.locator('.course-intro > p').first().innerText(), 'Learning TMLE：影响函数与双重稳健估计学习笔记');
      assert(page.url().includes('?edition=language-menu#chapter-7'));
      await page.locator('.language-picker summary').click();
      assert.equal(await page.locator('[data-language=zh]').getAttribute('aria-current'), 'true');
      await page.screenshot({ path: `output/en/verification/language-menu/zh-${width}.png` });
      await page.locator('#chapter-7 h1').click();
      assert.equal(await page.locator('.language-picker').getAttribute('open'), null);
      await page.goto(base + 'zh/sources.html?edition=language-menu');
      await page.locator('.language-picker summary').click();
      await page.locator('[data-language=en]').click();
      assert(page.url().includes('/en/sources.html?edition=language-menu'));
      assert.equal(await page.locator('html').getAttribute('lang'), 'en-GB');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: English default, keyboard/Escape/outside dismissal, language selection, chapter/query preservation, supporting pages, Pages prefix, no overflow or console errors`);
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
