import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {renderDrIntro} from '../../zh/renderers/dr-intro.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const source=readFileSync('zh/src/chapters/ch00.md','utf8');
const fit=prepareRhc(readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')));
const html=renderDrIntro(renderMarkdown(source),fit);
const value=key=>Number(html.match(new RegExp(`${key}="([^"]+)"`))[1]);
test('short introduction has three source-driven figures and keeps the supplement entry hidden',()=>{
 assert(source.split('\n').length<100);
 assert.equal((source.match(/^## /gm)||[]).length,5);
 assert.equal((source.match(/^\$\$/gm)||[]).length,2);
 assert(source.includes('一致估计'));assert(source.includes('条件平均为0'));assert(source.includes('一份有限样本'));
 assert(!html.includes('dr-intro-models'));assert(!html.includes('katex-error'));
 for(const key of ['models','correction','routes'])assert.equal((html.match(new RegExp(`data-dr-${key}>`,'g'))||[]).length,1);
 for(const key of ['q','g','residual'])assert.equal((html.match(new RegExp(`data-dr-${key}-row=`,'g'))||[]).length,6);
 assert(html.includes('<math'));assert(!html.includes('<pre'));assert(!html.includes('data-lab="0"'));
 assert(!html.includes('<a href="chapter-0-details.html#chapter-0"')); 
 assert(readFileSync('zh/src/supplements/ch00-details.md','utf8').includes('data-case-study="0"'));
});
test('introductory estimates match independently established R/Julia cohort benchmarks',()=>{
 assert.equal(fit.n,5735);assert.equal(fit.rows.reduce((s,r)=>s+r.y,0),1918);
 for(const [key,want] of [['initial',.08649885590233014],['correction-value',.00346913930676768],['aipw',.089967995209098],['tmle',.08997972473530443]])assert(Math.abs(value('data-dr-'+key)-want)<1e-10,key);
 // Reconstruct contributions from observed outcomes and exposed prediction attributes.
 const q1=[...html.matchAll(/data-q1="([^"]+)"/g)].map(m=>+m[1]),q0=[...html.matchAll(/data-q0="([^"]+)"/g)].map(m=>+m[1]),g=[...html.matchAll(/data-g="([^"]+)"/g)].map(m=>+m[1]);
 const contributions=[...html.matchAll(/data-c="([^"]+)"/g)].map(m=>+m[1]);
 fit.rows.slice(0,6).forEach((r,i)=>{
  const expected=r.a*(r.y-q1[i])/g[i]-(1-r.a)*(r.y-q0[i])/(1-g[i]);
  assert(Math.abs(contributions[i]-expected)<1e-12);
 });
 assert.equal(renderDrIntro('<p>Other chapter</p>',{}),'<p>Other chapter</p>');
});
