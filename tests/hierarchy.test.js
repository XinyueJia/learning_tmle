import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';

const exists = async path => { try { await stat(path); return true; } catch { return false; } };
test('published editions separate authored languages from shared engines', async () => {
  const editions = JSON.parse(await readFile('editions.json', 'utf8'));
  assert.deepEqual(editions.map(edition => edition.id), ['zh','en']);
  assert(await exists('en/README.md'));
  assert(await exists('dist/en/index.html'));
  assert.equal((await readdir('en/src/chapters')).filter(name => /^ch\d\d\.md$/.test(name)).length,9);
  for (const path of ['src', 'julia', 'case-study', 'docs', 'reviews', 'original']) assert(!(await exists(path)), `Stale root directory: ${path}`);
  assert.equal((await readdir('zh/src/chapters')).filter(name => /^ch\d\d\.md$/.test(name)).length, 9);
});
test('built shared engines and fixed observations preserve source bytes', async () => {
  for (const path of ['js/math.js','js/case-study.js','julia/EIFCase.jl','data/rws-counts.csv','data/rws-records.csv']) {
    assert.deepEqual(await readFile('dist/shared/'+path), await readFile('shared/'+path));
  }
});
test('every relative page link, stylesheet and module target resolves inside the portable build', async () => {
  const root = resolve('dist');
  for (const name of ['index.html','case-study.html','sources.html','audit.html','public-data.html']) {
    const path = resolve('dist/zh',name), html = await readFile(path,'utf8');
    for (const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(#|https?:|data:|mailto:)/.test(raw)) continue;
      const url = new URL(raw, 'https://local.invalid/zh/'+name);
      const target = resolve(root, '.'+decodeURIComponent(url.pathname));
      assert(!relative(root,target).startsWith('..'),raw);
      assert(await exists(target), `${name}: missing ${raw}`);
    }
  }
});
test('localised browser modules import existing shared or local files in source and build', async () => {
  for (const base of ['zh/src','dist/zh/src']) {
    for (const name of (await readdir(base)).filter(name=>name.endsWith('.js'))) {
      const path=resolve(base,name), source=await readFile(path,'utf8');
      for (const [,specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        assert(await exists(resolve(dirname(path),specifier)), `${path}: ${specifier}`);
      }
    }
  }
});
test('legacy entry points preserve bookmarks through edition redirects', async () => {
  for (const name of ['sources.html','audit.html','case-study.html']) {
    const html=await readFile('dist/'+name,'utf8');
    assert(html.includes('location.search+location.hash'));
    assert(html.includes('location.replace(target)'));
    assert(html.includes(name==='index.html'?'href="zh/"':`href="zh/${name}"`));
  }
});

test('root defaults to English and preserves language links and chapter bookmarks', async()=>{const html=await readFile('dist/index.html','utf8');assert(html.includes('href="en/"'));assert(html.includes('href="zh/"'));assert(html.includes('location.search+location.hash'));assert(html.includes("location.replace('en/'+location.search+location.hash)"));});
