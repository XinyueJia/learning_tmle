import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePublicCsv} from '../../shared/js/public-rws.js';
import {renderOlsError} from '../../zh/renderers/ols-error.js';
import {renderMeanError} from '../../zh/renderers/mean-error.js';
const rows=parsePublicCsv(readFileSync('shared/data/public/rhc/source.csv','utf8').replace(/^""(?=,)/,'"source_row"'));
const Y=rows.map(r=>+(r.dth30==='Yes'));
const marker='<div class="ols-error-placeholder"></div>';
test('OLS comparison uses full RHC mean, an observed patient and a symbolic unknown estimation error',()=>{
 const before=[...Y],html=renderOlsError(marker,{Y});
 assert.deepEqual(Y,before);assert(html.includes('5735人中1918人'));assert(html.includes('原CSV第5条'));
 assert.equal(Number(html.match(/data-oe-outcome="([^"]+)"/)[1]),1);
 assert.equal(Number(html.match(/data-oe-fitted="([^"]+)"/)[1]),1918/5735);
 assert.equal(Number(html.match(/data-oe-estimate="([^"]+)"/)[1]),1918/5735);
 assert(Math.abs(Number(html.match(/data-oe-residual="([^"]+)"/)[1])-3817/5735)<1e-12);
 assert(html.includes('<b data-oe-error>未知</b>'));assert(!html.includes('data-oe-error="'));
 assert.equal((html.match(/data-oe-lane=/g)||[]).length,2);assert(html.includes('<math'));assert(!html.includes('katex-error'));
 assert.equal(renderOlsError('<p>Other</p>',{}),'<p>Other</p>');
});
test('OLS visual derives the example from supplied outcomes and makes no patient or mean hard-code assumption',()=>{
 const html=renderOlsError(marker,{Y:[0,1,0,0]});
 assert(html.includes('原CSV第2条'));assert(html.includes('data-oe-fitted="0.25"'));assert(html.includes('data-oe-residual="0.75"'));
 const zero=renderOlsError(marker,{Y:[0,0]});assert(zero.includes('data-oe-residual="0"'));assert(zero.includes('<b data-oe-error>未知</b>'));
});
test('Chapter introduces residual before estimand error and uses existing mean diagram for centring proof',()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8'),s4=md.split('## 4.')[1].split('## 5.')[0],s52=md.split('### 5.2')[1].split('### 5.3')[0];
 assert(s4.indexOf('ordinary least squares')<s4.indexOf('estimation error'));
 assert(s4.indexOf('ols-error-placeholder')<s4.indexOf('glm-score-placeholder'));
 assert(s4.includes('未加权且无惩罚'));assert(s4.includes('只拟合')||s4.includes('共同均值'));
 assert(s52.includes('e_i=\\widehat D_i=D^{\\mathrm{mean}}_{P_n}(y_i)'));
 assert.equal((s52.match(/^\$\$/gm)||[]).length,8);
 const html=renderMeanError('<div class="if-error-placeholder"></div>',{Y});
 assert(html.includes('OLS残差 · 估计IF'));assert(html.includes('真实均值IF · 中心未知'));
});
