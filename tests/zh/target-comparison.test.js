import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {renderEifCorrection} from '../../zh/renderers/eif-correction.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const fit=prepareRhc(readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')));

test('both arms plot real first-six objects on one uncropped axis and use full-cohort reductions',()=>{
 const html=renderEifCorrection('<div class="target-comparison-placeholder"></div>',fit);
 assert(!html.includes('target-comparison-placeholder'));assert(!html.includes('data-eif-correction'));
 assert.equal((html.match(/data-tq-panel=/g)||[]).length,2);
 assert.equal((html.match(/data-tq-row=/g)||[]).length,36);
 for(const key of ['initial','aipw','tmle'])assert.equal((html.match(new RegExp(`data-tq-object="${key}"`,'g'))||[]).length,2);
 assert(html.includes('贡献角色')&&html.includes('概率预测')&&html.includes('5735'));
 assert(html.includes('一个共同ε')&&html.includes('两者之差'));assert(html.includes('<svg')&&html.includes('<math'));
 assert(!/<pre|<code|katex-error/.test(html));
 assert(html.includes('data-tq-updated-aipw')&&html.includes('data-tq-gap'));
});

test('chapter explains why substitution changes Q without claiming predictive or finite-sample dominance',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8').split('#### 第五步：')[1].split('现在可以区分三种0')[0],html=renderMarkdown(md);
 assert(md.includes('AIPW已经完成了校正')&&md.includes('substitution estimation')&&md.includes('pseudo-outcome'));
 assert(md.includes('两臂共用一个ε')&&md.includes('求解容差'));
 assert(md.includes('真实目标未知')&&md.includes('一般有限样本'));
 assert.equal((html.match(/class="equation"/g)||[]).length,3);assert.equal((html.match(/class="formula-recall"/g)||[]).length,3);
 assert(!html.includes('katex-error'));
});
