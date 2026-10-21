import {SITE_TITLES} from '../shared/js/site-config.js';
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
const editions = JSON.parse(await readFile('editions.json', 'utf8'));
const selected = process.argv.find(arg => arg.startsWith('--locale='))?.slice(9);
if (selected && !editions.some(edition => edition.id === selected)) throw Error(`Unpublished edition: ${selected}`);
// A complete build must not publish files left behind by earlier source layouts.
if (!selected) await rm('dist', {recursive: true, force: true});
await mkdir('dist/vendor', { recursive: true });
await cp('shared', 'dist/shared', { recursive: true });
await cp('node_modules/katex/dist/katex.min.css', 'dist/vendor/katex.min.css');
await cp('node_modules/katex/LICENSE', 'dist/vendor/KATEX_LICENSE.txt');
await cp('node_modules/katex/dist/fonts', 'dist/vendor/fonts', { recursive: true });
for (const edition of editions.filter(edition => !selected || edition.id === selected)) {
  if (!/^[a-z]{2}$/.test(edition.id)) throw Error('Invalid edition identifier');
  await (await import(edition.module)).build();
}
// Retain existing bookmarks, including their query string and chapter fragment.
for (const name of !selected ? ['index.html', 'sources.html', 'audit.html', 'case-study.html'] : []) {
  const target = 'zh/' + (name === 'index.html' ? '' : name);
  await writeFile(`dist/${name}`, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SITE_TITLES.zh}</title><link rel="icon" href="data:,"><p><a id="edition-link" href="${target}">打开中文版课程</a></p><script>const target=${JSON.stringify(target)}+location.search+location.hash;document.getElementById('edition-link').href=target;location.replace(target);</script></html>`);
}
// The same relative URLs work at a domain root and under a Pages repository prefix.
await writeFile('dist/.nojekyll', '');
for (const edition of editions.filter(edition => !selected || edition.id === selected)) {
  const {readdir} = await import('node:fs/promises');
  const other = editions.find(item => item.id !== edition.id);
  if (!other) continue;
  for (const file of (await readdir(`dist/${edition.id}`)).filter(name => name.endsWith('.html'))) {
    // Only offer routes that exist in both editions.
    try { await readFile(`dist/${other.id}/${file}`); } catch { continue; }
    const path = `dist/${edition.id}/${file}`;
    let page = await readFile(path, 'utf8');
    const english = edition.id === 'en';
    const links = `<nav class="language-switch" aria-label="${english?'Course language':'课程语言'}"><details class="language-picker"><summary aria-label="${english?'Choose a language':'选择语言'}"><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 5h12M8 2v3M4 5c1 5 4 8 9 10M12 5c-1 5-4 8-9 10M13 21l4-10 4 10M14.5 18h5"/></svg><span>${english?'English':'中文'}</span><svg class="language-chevron" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></summary><div class="language-panel"><p>${english?'Read in another language':'选择阅读语言'}</p><ul><li><a href="../en/${file}" lang="en-GB" hreflang="en-GB" data-language="en"${english?' aria-current="true"':''}><span>English</span>${english?'<span aria-hidden="true">✓</span>':''}</a></li><li><a href="../zh/${file}" lang="zh-CN" hreflang="zh-CN" data-language="zh"${!english?' aria-current="true"':''}><span>中文</span>${!english?'<span aria-hidden="true">✓</span>':''}</a></li></ul></div></details></nav>`;
    page = page.replace(/(<main\b[^>]*>)/, (_, opening) => opening + links);
    // Some supporting pages use an implicit head, so insert before their first stylesheet.
    if (!page.includes('vendor/language-switch.css')) page = page.replace('<link rel="stylesheet"', '<link rel="stylesheet" href="../vendor/language-switch.css"><script src="../vendor/language-switch.js" defer></script><link rel="stylesheet"');
    await writeFile(path, page);
  }
}
await cp('scripts/language-switch.css', 'dist/vendor/language-switch.css');
await cp('scripts/language-switch.js', 'dist/vendor/language-switch.js');
if (editions.some(edition => edition.id==='en') && !selected) {
  await writeFile('dist/index.html', `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SITE_TITLES.en}</title><link rel="icon" href="data:,"></head><body><main><h1>${SITE_TITLES.en}</h1><nav aria-label="Course language"><a id="edition-en" href="en/">English</a> · <a id="edition-zh" href="zh/" lang="zh-CN">中文</a></nav></main><script>for(const id of ['en','zh'])document.getElementById('edition-'+id).href=id+'/'+location.search+location.hash;location.replace('en/'+location.search+location.hash);</script></body></html>`);
}
