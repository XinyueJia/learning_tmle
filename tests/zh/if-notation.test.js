import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderMarkdown} from '../../scripts/markdown.js';
import {renderIfNotation} from '../../zh/renderers/if-notation.js';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {objectLessonData} from '../../shared/js/object-data.js';
const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8'));
const data=objectLessonData(rows,prepareRhc(rows));
const marker='<div class="if-notation-placeholder"></div>';

test('Unobserved new-outcome branches use independently counted real frequencies and fixed outputs',()=>{
 const html=renderIfNotation(marker,data),branches=[...html.matchAll(/data-ifn-outcome="(\d)" data-ifn-probability="([^"]+)" data-ifn-output="([^"]+)"/g)];
 const deaths=rows.filter(row=>row.y===1).length,mu=deaths/rows.length;
 assert.equal(branches.length,2);
 for(const [,rawY,p,d]of branches){const y=Number(rawY);assert.equal(Number(p),rows.filter(row=>row.y===y).length/rows.length);assert.equal(Number(d),y-mu);}
 assert(html.includes('P_{n,Y}'));assert(html.includes('按参考分布抽取新结局的思想实验'));assert(html.includes('<math'));assert(!html.includes('katex-error'));
});

test('Realised vector preserves each first-six source outcome and signed value without averaging preview rows',()=>{
 const html=renderIfNotation(marker,data),section=html.split('data-ifn-vector="value"')[1].split('</footer>')[0];
 const values=[...section.matchAll(/data-ifn-row="(\d+)" data-ifn-value="([^"]+)"/g)];
 const mu=rows.reduce((sum,row)=>sum+row.y,0)/rows.length;
 assert.equal(values.length,6);
 for(const [,index,value]of values)assert.equal(Number(value),rows[Number(index)-1].y-mu);
 assert.equal(rows[0].y,0);assert.equal(rows[4].y,1);
 assert(html.includes('完整向量有5735项'));
 assert(html.includes('data-ifn-equation="5" hidden'));
});

test('Section5.1 motivates calls before generic notation and keeps its table as an optional recap',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8'),s=md.split('### 5.1')[1].split('### 5.2')[0];
 const rendered=renderIfNotation(renderMarkdown(s),data);
 const purpose=s.indexOf('先准备一个固定的均值'),definition=s.indexOf('函数记作');
 assert(purpose>=0&&definition>purpose,'concrete task precedes function naming');
 assert(s.indexOf('if-function-placeholder')<s.indexOf('if-notation-placeholder'));
 assert(s.indexOf('if-notation-placeholder')<s.indexOf('| 现在回看的写法'));
 assert(rendered.includes('<details class="if-symbol-recap"><summary>将均值例子接回§4的IF写法'));
 assert(rendered.indexOf('<table>')>rendered.indexOf('<details class="if-symbol-recap"><summary>将均值例子接回§4的IF写法'));
 assert(!rendered.includes('if-notation-placeholder'));
 assert.throws(()=>renderIfNotation(marker,{...data,shown:[]}),/Inconsistent/);
 assert.equal(renderIfNotation('<p>Other chapter</p>',data),'<p>Other chapter</p>');
});
