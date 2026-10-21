import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc,prepareRhc} from '../../shared/js/rhc.js';
import {objectLessonData} from '../../shared/js/object-data.js';
import {OBJECT_STAGES,renderObjectStage,objectFigure,objectToolbar} from '../../zh/src/object-grammar.js';

const rows=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8'));
const fit=prepareRhc(rows),data=objectLessonData(rows,fit);
const stages=Object.keys(OBJECT_STAGES);
const visible=html=>html.replace(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"');
const implementation=/\bdesign\b|\bqa\b|\bq0\b|\bq1\b|\bmu\b|\brisk\b|\bsupport_y\b|\bp_t\b|Julia|fit_logistic|hcat|prepare_full|Float64|\bVector\b|\bMatrix\b|\.\*|\.\-|\.==|expit\.|\bsum\b|\bmean\b|mu = risk|q_fit|g_fit|read_rhc_rows|rhc_observations/;

function scalarValues(html){
 return [...html.matchAll(/data-object="([^"]+)" data-dim="1" data-value="([^"]+)"/g)].map(([,id,value])=>[id,Number(value)]).sort((a,b)=>a[0].localeCompare(b[0]));
}
function vectorValues(html){
 return [...html.matchAll(/data-owner="([^"]+)"[^>]*><small>([^<]*)<\/small><b>([^<]*)<\/b>/g)].map(([,id,key,value])=>[id,key,value]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

test('every stage and prediction scenario renders language-neutral mathematics without a hidden Julia block',()=>{
 assert.equal(stages.length,18,'All five chapter-0 and thirteen chapter-1 stages are audited');
 for(const stage of stages)for(const scenario of ['one','zero','observed']){
  const html=renderObjectStage(stage,data,{mode:'math',scenario,t:.1,z:1});
  assert(!html.includes('class="ov-code"'),`${stage}: code block is not rendered`);
  assert(!html.includes('data-julia-name='),`${stage}: implementation names are not emitted in mathematical objects`);
  assert(!implementation.test(visible(html)),`${stage}/${scenario}: mathematical explanation leaks implementation`);
  assert(html.includes('数学运算'));
 }
});

test('mathematical fit details, fixed means and cohort reductions retain the teaching bridge',()=>{
 const fitHtml=visible(renderObjectStage('fit',data,{mode:'math'}));
 assert(fitHtml.includes('用同一基线矩阵拟合接受RHC的概率'));
 assert(fitHtml.includes('拟合接受RHC的概率'));
 assert(fitHtml.includes('5735 × 18')&&fitHtml.includes('5735 × 17'));
 assert(fitHtml.includes('拟合g时，以实际处理A为结果，使用17列Z作输入'));
 const mean=visible(renderObjectStage('weighted-mean',data,{mode:'math'}));
 assert(mean.includes('Σ 两组求和'));
 assert(mean.includes('概率p(y)已经包含组人数权重'));
 assert(mean.includes('参考分布P的固定均值'));
 assert(mean.includes('μ固定为原参考分布P=Pₙ的均值'));
 const average=visible(renderObjectStage('mean-if',data,{mode:'math'}));
 assert(average.includes('Σᵢ('));
 assert(average.includes('全部人数'));
 assert(average.includes('5735'));
 const selection=visible(renderObjectStage('select',data,{mode:'math'}));
 assert(selection.includes('按实际A逐行选择'));
 assert(selection.includes('两列分别来自全A=1与全A=0的模型调用'));
});

test('changing only the reading mode preserves all displayed patient, coefficient and scalar values',()=>{
 for(const stage of stages)for(const scenario of ['one','zero','observed']){
  const state={scenario,t:.25,z:0};
  const math=renderObjectStage(stage,data,{...state,mode:'math'}),julia=renderObjectStage(stage,data,{...state,mode:'julia'});
  assert.deepEqual(scalarValues(math),scalarValues(julia),`${stage}/${scenario}: scalar values`);
  assert.deepEqual(vectorValues(math),vectorValues(julia),`${stage}/${scenario}: aligned vector values`);
  const matrixRows=html=>[...html.matchAll(/<div class="ov-matrix-row"[\s\S]*?<\/div>/g)].map(match=>match[0]).sort();
  assert.deepEqual(matrixRows(math),matrixRows(julia),`${stage}/${scenario}: matrix values`);
  const dimensions=html=>[...html.matchAll(/data-object="([^"]+)" data-dim="([^"]+)"/g)].map(([,id,dimension])=>[id,dimension]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  assert.deepEqual(dimensions(math),dimensions(julia),`${stage}/${scenario}: dimensions`);
 }
});

test('Julia mode still renders runnable code and first-use implementation dimensions',()=>{
 for(const stage of stages){
  const html=renderObjectStage(stage,data,{mode:'julia'});
  assert(html.includes('class="ov-code"'));
  assert(html.includes('对应的可运行Julia'));
  assert(html.includes('data-julia-name='));
  assert(html.includes('<pre tabindex="0"><code>'));
 }
 const fitHtml=renderObjectStage('fit',data,{mode:'julia'});
 assert(fitHtml.includes('g_fit = fit_logistic('));
 assert(fitHtml.includes('Float64'));
 assert(renderObjectStage('source',data,{mode:'julia'}).includes('Vector的size为(n,)'));
 assert(renderObjectStage('patient-mean',data,{mode:'julia'}).includes('Vector的size为(n,)'));
});

test('all operand expressions have keyboard-focusable horizontal scroll regions and retain inner grouping',()=>{
 for(const stage of stages)for(const mode of ['math','julia']){
  const html=renderObjectStage(stage,data,{mode});
  const regions=[...html.matchAll(/<div class="ov-expression-scroll" tabindex="0" role="region" aria-label="([^"]+)，可横向滚动"><div class="ov-expression" role="group" aria-label="([^"]+)">/g)];
  assert(regions.length>0,stage);
  assert.equal(regions.length,(html.match(/class="ov-expression"/g)||[]).length,stage);
  for(const [,region,group] of regions)assert.equal(region,group);
  assert(!/height\s*[:=]/.test(html),'The renderer does not impose a height limit');
 }
});

test('pure operator tokens carry an additional class while operation phrases keep their text class',()=>{
 const html=renderObjectStage('predict',data,{mode:'julia'});
 assert(html.includes('<span class="ov-syntax ov-operator">) *</span>'));
 assert(html.includes('<span class="ov-syntax ov-operator">)</span>'));
 assert(html.includes('<span class="ov-syntax">expit.(hcat(</span>'));
 const math=renderObjectStage('weighted-mean',data,{mode:'math'});
 assert(math.includes('<span class="ov-syntax ov-operator">⊙</span>'));
 assert(math.includes('<span class="ov-syntax">Σ 两组求和</span>'));
 const estimate=renderObjectStage('estimate',data,{mode:'math'});
 assert(estimate.includes('<span class="ov-syntax ov-operator">−</span>'));
 assert(estimate.includes('<span class="ov-syntax">全n人平均</span>'));
});

test('chapter-0 toolbar keeps mathematical objects only; chapter-1 keeps all three reading modes',()=>{
 for(const chapter of [0,1]){
  const html=objectToolbar(chapter,data),toolbar=visible(html);
  if(chapter===0){
   assert(!html.includes('object-mode-'),'No redundant reading selector in chapter 0');
   assert(!/Julia运算|R运算|阅读方式/.test(toolbar));
   for(const control of ['previous','next','reset'])assert(html.includes(`data-object-action="${control}"`));
   assert(html.includes('data-object-selected'));
  }else for(const mode of ['math','julia','r'])assert(html.includes(`name="object-mode-1" value="${mode}"`));
  assert(!implementation.test(toolbar.replace('Julia运算','')));
  assert(toolbar.includes('n×1表示n项向量的数学竖排形状'));
  assert(toolbar.includes('系数向量按特征排列'));
 }
 for(const stage of stages){
  const html=objectFigure(stage,data,{toolbar:true});
  assert(!implementation.test(visible(html).replaceAll('Julia运算','')),`${stage}: complete figure, description, caption and toolbar`);
  assert(html.includes('data-object-window'));
 }
});
