import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
const read = path => readFileSync(path, 'utf8');

test('both course entries contain a small shell and nine independent chapter URLs', () => {
  for (const lang of ['en', 'zh']) {
    const shell = read(`dist/${lang}/index.html`);
    assert(Buffer.byteLength(shell) < 15000, `${lang}: entry size budget`);
    assert.equal((shell.match(/data-chapter-url=/g) || []).length, 9);
    assert(!shell.includes('class="katex"'), 'Unvisited chapter maths is not embedded in the entry');
    const files = readdirSync(`dist/${lang}/chapters`).filter(file => /^chapter-\d+\.html$/.test(file));
    assert.equal(files.length, 9);
    for (let n = 0; n <= 8; n++) {
      assert(shell.includes(`data-chapter-url="chapters/chapter-${n}.html"`));
      const fragment = read(`dist/${lang}/chapters/chapter-${n}.html`);
      assert(fragment.startsWith(`<article id="chapter-${n}" data-number="${n}"`));
      assert.equal((fragment.match(/<h1\b/g) || []).length, 1);
      assert(fragment.includes('<math') && fragment.includes('class="mark-read"'));
      if (n > 0) assert(fragment.includes(`data-lab="${n}"`));
      if (n < 8) assert(fragment.includes(`href="#chapter-${n + 1}"`));
      assert(!fragment.includes('<script'), 'Chapter fragments contain content, not executable script tags');
    }
  }
});

test('chapter controllers and the original RHC data are loaded through scoped cached initialisers', () => {
  for (const lang of ['en', 'zh']) {
    const app = read(`${lang}/src/app.js`);
    assert(app.includes("()=>import('./rhc-full.js')"));
    assert(app.includes("()=>import('./object-visuals.js')"));
    assert(!app.includes("import './rhc-full.js'"));
    assert(app.includes('mountCaseWorkbenches(article)'));
    for (const file of ['rhc-full', 'object-visuals']) {
      const module = read(`${lang}/src/${file}.js`);
      assert(module.includes('getRhcData()'));
      assert(!module.includes("fetch('../shared/data/public/rhc/source.csv')"));
    }
  }
});

 test('the archived supplementary reading remains complete at its existing URL', () => {
  const page = read('dist/zh/chapter-0-details.html');
  assert(page.includes('dr-supplement-back'));
  assert(page.includes('data-if-function') && page.includes('data-qg-visual'));
  assert(page.includes('class="recall-trigger"'));
  assert(!page.includes('id="chapter-0" data-number="0" data-chapter-url='));
 });
