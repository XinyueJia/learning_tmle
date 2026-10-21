import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chapter1Sources, expandJuliaLineCards, chapter1LoopTrace, expandChapter1Walkthrough } from '../../zh/renderers/julia-walkthrough.js';
import { renderMarkdown } from '../../scripts/markdown.js';

const moduleSource = await readFile('shared/julia/EIFCase.jl','utf8');
const lesson = await readFile('zh/julia/lessons/ch01.jl','utf8');
const guide = await readFile('zh/src/julia/ch01-walkthrough.md','utf8');
const sources = chapter1Sources(moduleSource,lesson);
const near = (a,b) => assert(Math.abs(a-b)<1e-12, `${a} != ${b}`);

test('every nonblank Julia line has one explanation and is displayed from tested source', () => {
  const expanded = expandJuliaLineCards(guide,sources);
  const cards = [...expanded.matchAll(/data-julia-part="(core|lesson)" data-julia-line="(\d+)"[\s\S]*?```julia\n([\s\S]*?)\n```/g)];
  assert.equal(cards.length,32);
  for (const [,name,index,code] of cards) assert.equal(code,sources[name].split('\n')[Number(index)-1]);
  assert(!expanded.includes('<!-- julia-line'));
});

test('source drift, missing explanations and duplicate line explanations stop the build', () => {
  assert.throws(() => expandJuliaLineCards(guide,{...sources,core:sources.core.replace('events = 0','events = 1')}), /changed/);
  assert.throws(() => expandJuliaLineCards(guide.replace(/<!-- julia-line core:6 -->[\s\S]*?<!-- \/julia-line -->/,''),sources), /Unexplained/);
  const first = guide.match(/<!-- julia-line core:1 -->[\s\S]*?<!-- \/julia-line -->/)[0];
  assert.throws(() => expandJuliaLineCards(guide+'\n'+first,sources),/duplicate/);
});

test('loop ledgers preserve the independently enumerated frequencies, events and IF weights', () => {
  const counts = [24,56,4,16,16,4,40,40];
  const rows = counts.map((n,i) => ({x:Math.floor(i/4),a:Math.floor(i/2)%2,y:i%2,n}));
  const d = chapter1LoopTrace(rows);
  assert.equal(d.n,200); assert.equal(d.events,116); near(d.risk,.58);
  assert.deepEqual(d.trace.map(c=>c.eventTotal),[0,56,56,72,72,76,76,116]);
  [.12,.28,.02,.08,.08,.02,.2,.2].forEach((p,i)=>near(d.trace[i].probability,p));
  [-.0696,.1176,-.0116,.0336,-.0464,.0084,-.116,.084].forEach((v,i)=>near(d.trace[i].contribution,v));
  near(d.trace.at(-1).weightedMean,0);
  rows[2].n=5;rows[3].n=15;
  near(chapter1LoopTrace(rows).risk,.575);
});

test('the guide keeps copyable Julia, paths and formulas through the real Markdown renderer', async () => {
  const expanded = await expandChapter1Walkthrough('<div class="julia-walkthrough" data-julia-walkthrough="01"></div>');
  const html = renderMarkdown(expanded);
  assert.equal((html.match(/class="julia-line-card"/g)||[]).length,32);
  assert(html.includes('@__DIR__'));
  assert(html.includes('events = events + cell.n * cell.y'));
  assert(html.includes('application/x-tex'));
  assert.equal((html.match(/class="equation"/g)||[]).length,2, 'both walkthrough display equations survive source insertion');
  assert(!html.includes('<p>$\n'), 'display math cannot leak as raw dollar/TeX paragraphs');
  assert(html.includes('result.mean'));
  assert(!/[\u0000-\u0008\u000b-\u001f]/.test(expanded));
  assert(!expanded.includes('\times'), 'no accidental tab escape in TeX times');
});
