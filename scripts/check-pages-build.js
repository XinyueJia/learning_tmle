import {readdir, readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const root = 'dist';
const required = ['index.html', '.nojekyll', 'vendor/katex.min.css', 'vendor/language-switch.js',
  'shared/js/chapter-loader.js', 'shared/js/rhc-browser-data.js', 'shared/js/site-config.js', 'shared/data/public/rhc/source.csv'];
for (const lang of ['en', 'zh']) {
  for (const page of ['index.html', 'sources.html', 'case-study.html', 'public-data.html']) required.push(`${lang}/${page}`);
  for (let n = 0; n <= 8; n++) {
    const relative = `${lang}/chapters/chapter-${n}.html`;
    required.push(relative);
    const fragment = await readFile(join(root, relative), 'utf8');
    assert(fragment.includes(`<article id="chapter-${n}"`), `Invalid chapter: ${relative}`);
    assert(fragment.includes('<math'), `Missing accessible maths: ${relative}`);
  }
  const entry = await readFile(join(root, lang, 'index.html'), 'utf8');
  assert.equal((entry.match(/data-chapter-url=/g) || []).length, 9, `${lang}: missing chapter URLs`);
}
for (const relative of required) assert((await stat(join(root, relative))).isFile(), `Missing Pages file: ${relative}`);

let files = 0, bytes = 0, largest = {path: '', bytes: 0};
async function walk(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `Pages artifact contains a symbolic link: ${path}`);
    if (entry.isDirectory()) {
      assert(!['node_modules', '.git', '.pnpm-store', 'releases', 'output'].includes(entry.name), `Unexpected artifact directory: ${path}`);
      await walk(path);
    } else if (entry.isFile()) {
      const size = (await stat(path)).size;
      files++; bytes += size;
      if (size > largest.bytes) largest = {path, bytes: size};
    } else throw Error(`Unexpected artifact entry: ${path}`);
  }
}
await walk(root);
assert(bytes < 1_000_000_000, 'Published artifact exceeds the GitHub Pages 1 GB limit');
console.log(JSON.stringify({status: 'PASS',files, bytes, largest, editions: ['en', 'zh'], chaptersPerEdition: 9, requiredFiles: required.length}, null, 2));
