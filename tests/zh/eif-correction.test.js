import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {renderEifCorrection} from '../../zh/renderers/eif-correction.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const fit=prepareRhc(readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')));

test('correction figure labels two distributions, four stages and the AIPW estimating function explicitly',()=>{
 const html=renderEifCorrection('<div class="eif-correction-placeholder"></div>',fit);
 for(const key of ['initial','aipw','half','tmle'])assert(html.includes(`data-ec-panel="${key}"`));
 assert.equal((html.match(/data-ec-row=/g)||[]).length,24);
 assert.equal((html.match(/data-ec-model=/g)||[]).length,4);
 assert.equal((html.match(/data-ec-empirical=/g)||[]).length,4);
 assert(html.includes('估计函数U')&&html.includes('P₀')&&html.includes('非参数观测模型'));
 assert(html.includes('更新到一半')&&html.includes('求根完成')&&html.includes('5735'));
 assert(!/<pre|<code|katex-error|eif-correction-placeholder/.test(html));assert(html.includes('<math'));
 assert.equal(renderEifCorrection('<p>Elsewhere</p>',fit),'<p>Elsewhere</p>');
});

test('chapter bridge derives the empirical cancellation and distinguishes candidate centres from fitted-law targets',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8').split('### 5.4')[1].split('### 5.5')[0],html=renderMarkdown(md);
 assert(md.includes('估计函数（estimating function）'));assert(md.includes('P_{n,W}'));
 assert(md.includes('真实分布$P_0$')&&md.includes('非参数模型'));
 assert(md.includes('第7、8讲')&&md.includes('剩余项'));
 assert.equal((html.match(/class="equation"/g)||[]).length,9);
 assert.equal((html.match(/class="formula-recall"/g)||[]).length,9);
 assert(!html.includes('katex-error'));assert(html.includes('初始拟合分布仍是'));
});
