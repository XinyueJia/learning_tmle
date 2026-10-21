import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc} from '../../shared/js/rhc.js';
import {renderMeanError} from '../../zh/renderers/mean-error.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const Y=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')).map(row=>row.y);
const marker='<div class="if-error-placeholder"></div>';

test('Mean-error visual retains the whole original outcome vector while previewing only six rows',()=>{
 const before=JSON.stringify(Y),html=renderMeanError(marker,{Y});
 const serialised=html.match(/data-ie-outcomes>([\s\S]*?)<\/script>/)?.[1];
 assert.deepEqual(JSON.parse(serialised),Y);assert.equal(JSON.stringify(Y),before);
 assert.equal((html.match(/class="ie-row"/g)||[]).length,12);
 assert(html.includes('实际估计误差 · 数值未知'));assert(html.includes('假设均值m'));
 assert(html.includes('全5735项'));assert(html.includes('<math'));assert(!html.includes('katex-error'));
 assert(!html.includes('if-error-placeholder'));assert.equal(renderMeanError('<p>Elsewhere</p>',{Y}),'<p>Elsewhere</p>');
});

test('Section5.2 develops exact mean algebra and floating symbol recalls before any general remainder claims',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8').split('### 5.2')[1].split('### 5.3')[0],html=renderMeanError(renderMarkdown(md),{Y});
 assert.equal((md.match(/if-error-placeholder/g)||[]).length,1);
 assert.equal((html.match(/class="equation"/g)||[]).length,4);
 assert.equal((html.match(/class="formula-recall"/g)||[]).length,4);
 assert(md.includes('有限样本恒等式'));assert(md.includes('对任意有限个结局'));assert(md.includes('抽样分布与推断'));
 assert(md.indexOf('if-error-placeholder')<md.indexOf('\\begin{aligned}'));
 assert(md.includes('已经换了一条函数'));assert(!md.includes('o_p('));assert(!md.includes('O_p('));
 assert(md.includes('每条记录权重$1/n$'));
 assert(md.includes('5735')&&md.includes('1918/5735')&&md.includes('当前经验分布'));
 assert(md.includes('真实分布$P_0$和它的均值$\\mu_0$固定但未知'));
 assert(md.includes('独立观测使总和的方差'));assert(md.includes('样本内的离散程度'));
 assert(md.includes('本次真实误差'));assert(md.includes('独立同分布')||md.includes('iid抽样模型'));
 assert(html.includes('data-ie-standard-error'));assert(html.includes('data-ie-sum-squares'));
});
