import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {objectLessonData} from '../../shared/js/object-data.js';
import {renderIfMotivation} from '../../zh/renderers/if-motivation.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')),fit=prepareRhc(rows),data=objectLessonData(rows,fit);
const marker='<div class="if-motivation-placeholder"></div>';

test('Motivation visual uses full real fitted gcomp and original outcomes, with unknown true target',()=>{
 const before=JSON.stringify(data),html=renderIfMotivation(marker,data),embedded=JSON.parse(html.match(/data-im-outcomes>([\s\S]*?)<\/script>/)[1]);
 assert.deepEqual(embedded,rows.map(r=>r.y));assert.equal(JSON.stringify(data),before);
 assert(Math.abs(Number(html.match(/data-im-gcomp="([^"]+)"/)[1])-.08649885590233014)<1e-12);
 assert(html.includes('真实目标'));assert(html.includes('真实误差也未知'));
 assert.equal((html.match(/class="im-row"/g)||[]).length,6);
 assert(html.includes('<math'));assert(!html.includes('katex-error'));assert(!html.includes('if-motivation-placeholder'));
});

test('Section4 motivates point-estimate error analysis before mean transfer and explains non-unique raw pairing',()=>{
 const section=readFileSync('zh/src/supplements/ch00-details.md','utf8').split('## 4.')[1].split('## 5.')[0],html=renderIfMotivation(renderMarkdown(section),data);
 assert(section.indexOf('点估计')<section.indexOf('概率转移'));
 assert(section.includes('影响值（influence value）'));assert(section.includes('D^{\\mathrm{mean}}_P(y)=y-\\mu'));assert(section.includes('同一个常数$c$'));
 assert(section.includes('中心化（centring）'));assert(!section.includes('\\Psi(P_n)'));
 assert.equal((html.match(/class="equation"/g)||[]).length,3);
 assert.equal((html.match(/class="formula-recall"/g)||[]).length,3);
 assert(!html.includes('if-motivation-placeholder'));
});
