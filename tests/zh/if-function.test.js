import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderIfFunction} from '../../zh/renderers/if-function.js';
import {renderMarkdown} from '../../scripts/markdown.js';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {objectLessonData} from '../../shared/js/object-data.js';
const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8'));
const data=objectLessonData(rows,prepareRhc(rows));
const marker='<div class="if-function-placeholder"></div>';

test('Chapter 0 preview outputs agree with independently reweighted real observations',()=>{
 const html=renderIfFunction(marker,data),actual=[...html.matchAll(/data-if-number="([^"]+)"/g)].map(m=>Number(m[1]));
 assert.equal(actual.length,2);
 const base=rows.reduce((s,row)=>s+row.y/rows.length,0);
 for(const y of [0,1]){
  const t=.0001;
  // Independently construct the changed empirical expectation, not z minus a stored mean.
  const changed=rows.reduce((s,row)=>s+(1-t)*row.y/rows.length,0)+t*y;
  assert(Math.abs((changed-base)/t-actual[y])<1e-8);
 }
 assert(html.includes('P_{n,Y}'));assert(html.includes('5735'));assert(html.includes('1918'));assert(html.includes('3817'));
 assert(Math.abs(actual[0]*3817/5735+actual[1]*1918/5735)<1e-14);
});

test('Chapter 0 keeps a single rendered preview and accessible mathematical function mapping',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8'),html=renderIfFunction(renderMarkdown(md),data);
 assert.equal((md.match(/class="if-function-placeholder"/g)||[]).length,1);
 assert(!html.includes('if-function-placeholder'));assert.equal((html.match(/data-if-function /g)||[]).length,1);
 assert(html.includes('aria-live="polite"'));assert(html.includes('data-if-reset'));
 assert(html.includes('<math'));assert(!html.includes('katex-error'));assert(html.includes('输入'));assert(html.includes('输出'));
 assert(html.includes('全队列30日死亡均值'));assert(html.includes('输入是一个0/1结局值'));
 assert.equal((md.match(/data-object-stage=/g)||[]).length,5);
});

test('Mean preview refuses mismatched influence values and leaves other chapters alone',()=>{
 assert.equal(renderIfFunction('<p>Another chapter</p>',data),'<p>Another chapter</p>');
 assert.throws(()=>renderIfFunction(marker,{...data,grouped:{...data.grouped,D:[0,0]}}),/Invalid empirical/);
});
