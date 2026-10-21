import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
test('reader references retain citations and data links while author records remain in project docs',()=>{
 for(const lang of ['zh','en']){
  const page=read(`dist/${lang}/sources.html`);
  for(const url of ['arxiv.org/abs/2107.00681','arxiv.org/abs/1810.03260','pubmed.ncbi.nlm.nih.gov/8782638/','hbiostat.org/data/','www.khstats.com/blog/tmle/tutorial-pt2'])assert(page.includes(url),lang+': '+url);
  for(const marker of ['Codex','VERIFICATION','reviews/','pdftotext','curl','SHA256','SHA-256','核验日期','数学审查者','本轮','原型审计'])assert(!page.includes(marker),lang+': '+marker);
  assert(!page.includes('href="audit.html"'));assert(!page.includes('href="AUDIT.md"'));
  assert(read(`${lang}/renderers/course.js`).includes(`${lang}/src/sources.md`));
  assert(read(`${lang}/docs/SOURCES.md`).length>1000,'Original project records remain available');
  assert(!read(`dist/${lang}/public-data.html`).includes('provenance.json'),'Integrity metadata is kept outside the reader page');
 }
});
test('legacy audit bookmark takes readers to references rather than exposing author audit notes',()=>{
 const page=read('dist/zh/audit.html');assert(page.includes("location.replace('sources.html'"));
 for(const marker of ['原型审计','数学审查','Codex','审计发现'])assert(!page.includes(marker));
});
