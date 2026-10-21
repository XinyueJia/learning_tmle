import {renderMarkdown,renderInlineMath as math} from '../../scripts/markdown.js';
import {tmleTrace} from '../../shared/js/tmle-trace.js';
import {solveRhc} from '../../shared/js/rhc.js';
import {renderCalibration,renderReferenceCalibration} from './tmle-calibration.js';
import {renderIpwBridge,renderEifAipwBridge} from './tmle-ipw-bridge.js';
const labels=[`准备${math('Q')}预测`,`从AIPW提取${math('H')}`,`拟合${math('\\varepsilon')}`,`更新两臂${math('Q')}`,'计算风险差','EIF与标准误'];
const notes=[
 '三列初始风险预测已加入',`加入倾向评分及三个${math('H')}；先前${math('Q')}保留`,
 `加入offset；${math('\\varepsilon')}是全体共用的一个数`,'加入实际臂及两臂的更新预测','加入每个人更新后的风险差','加入每个人的拟合EIF输出',
];
export const OVERVIEW_COLUMNS=[
 ['a','A',0],['y','Y',0],['qa','\\widehat Q_A',0],['q1','\\widehat Q_1',0],['q0','\\widehat Q_0',0],
 ['g','\\widehat g',1],['h1','H_1',1],['h0','H_0',1],['h','H_A',1],['offset','\\operatorname{logit}\\widehat Q_A',2],
 ['qstar_a','\\widehat Q_A^*',3],['qstar1','\\widehat Q_1^*',3],['qstar0','\\widehat Q_0^*',3],['contrast','\\widehat Q_1^*-\\widehat Q_0^*',4],['eif','\\widehat D',5],
];
const decimal=x=>x.toFixed(6),pp=x=>(100*x).toFixed(4)+' 个百分点';
const scalar=(label,x,kind='decimal')=>`<div class="to-metric"><span>${label}</span><strong data-to-number="${x}">${kind==='pp'?pp(x):Math.abs(x)<1e-9?x.toExponential(2):decimal(x)}</strong></div>`;
const region=(label,body)=>`<div class="to-scroll" tabindex="0" role="region" aria-label="${label}">${body}</div>`;
const states=(initial,target,render)=>[initial,target].map((t,j)=>`<div data-to-state="${j?'target':'initial'}"${j?'':' hidden'}>${render(t)}</div>`).join('');
// Nested native disclosure summaries remain raw HTML after the block Markdown pass.
const renderStep=md=>renderMarkdown(md).replace(/<summary>([^<]*\$[^<]*)<\/summary>/g,
 (_,text)=>`<summary>${renderMarkdown(text).trim().replace(/^<p>|<\/p>$/g,'')}</summary>`);
export function renderTmleOverview(source,fit){
 const parts=source.split(/<!-- tmle-step:\d -->/).slice(1);
 if(parts.length!==6)throw Error('TMLE overview needs six authored steps');
 const solved=solveRhc(fit),initial=tmleTrace(fit,0),target=tmleTrace(fit,solved.epsilon);
 const half=tmleTrace(fit,solved.epsilon/2);
 const direction=`<figure class="to-direction" data-to-direction><figcaption>同一个${math('\\varepsilon')}如何沿各人的${math('H')}调整预测？</figcaption><p>全5735人共同拟合的${math('\\widehat\\varepsilon')} = <b data-to-common-epsilon="${solved.epsilon}">${solved.epsilon.toFixed(9)}</b>；初始${math('\\widehat Q')}与${math('\\widehat g')}固定。</p>${region('同一RHC数据中两位患者的不同更新量，可横向滚动',`<div class="to-direction-patients">${target.shown.slice(0,2).map(r=>`<div class="to-direction-patient" data-to-direction-row="${r.row}"><h4>原行${r.row} · ${r.a?'接受RHC':'未接受RHC'}</h4><p>接受RHC概率 ${math('\\widehat g')} = ${decimal(r.g)}</p><p>${math('H_A')} = <b data-to-direction-h="${r.h}">${decimal(r.h)}</b></p><div class="to-direction-shift">同一个 ${math('\\widehat\\varepsilon')} × 这个人的 ${math('H_A')}<br><b data-to-direction-shift="${r.shift}">${r.shift>0?'+':''}${decimal(r.shift)}</b> logit单位</div><p>死亡风险预测<br><b>${(100*r.qa).toFixed(3)}%</b> → <b data-to-direction-prediction="${r.qstar_a}">${(100*r.qstar_a).toFixed(3)}%</b></p></div>`).join('')}</div>`)}<p>${math('\\varepsilon')}决定共同幅度；${math('H')}给出每条记录的方向和相对幅度。转回概率后，改变多少还取决于初始预测。</p>${region('一个epsilon对应一个全队列加权残差平均',`<div class="to-direction-path">${[initial,half,target].map((t,i)=>`<div data-to-direction-point="${i}"><strong>${['初始','途中试算','拟合完成'][i]}</strong><span>${math('\\varepsilon')} = ${t.summary.epsilon.toFixed(9)}</span><span>全体加权残差平均</span><b data-to-direction-score="${t.summary.score}">${Math.abs(t.summary.score)<1e-9?t.summary.score.toExponential(2):decimal(t.summary.score)}</b></div>`).join('<span class="to-op">→</span>')}</div>`)}<p class="to-data-note">两位患者只用于展示逐人调整；三处汇总都计算全部5735条实际记录。加权残差平均以概率为单位，中途值是沿同一路径的试算。</p></figure>`;
 const trialNames={qstar_a:'Q_\\varepsilon(A_i,W_i)',qstar1:'Q_\\varepsilon(1,W_i)',qstar0:'Q_\\varepsilon(0,W_i)'};
 const table=region('同六位患者逐步增加的TMLE中间量，可横向滚动',`<table class="to-table"><thead><tr><th>原行</th>${OVERVIEW_COLUMNS.map(([key,tex,stage])=>`<th data-to-column="${key}" data-to-from="${stage}"${stage?' hidden':''}>${trialNames[key]?states(initial,target,t=>math(t===target?tex:trialNames[key])):math(tex)}</th>`).join('')}</tr></thead><tbody>${initial.shown.map((r,i)=>`<tr data-to-patient="${r.row}"><th>${r.row}</th>${OVERVIEW_COLUMNS.map(([key,tex,stage])=>`<td data-to-column="${key}" data-to-from="${stage}"${stage?' hidden':''}>${['qstar_a','qstar1','qstar0','contrast','eif'].includes(key)?states(initial,target,t=>`<span data-to-value="${t.shown[i][key]}">${decimal(t.shown[i][key])}</span>`):`<span data-to-value="${r[key]}">${['a','y'].includes(key)?r[key]:decimal(r[key])}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
 const flow=initial.shown.map((r,i)=>`<div data-to-flow-row="${r.row}"${i?' hidden':''}>${states(initial,target,t=>{
  const v=t.shown[i],cell=(name,value)=>`<div class="to-operand"><span>${name}</span><b>${decimal(value)}</b></div>`,op=s=>`<b class="to-op">${s}</b>`;
  return region('一位患者实际处理下的预测更新：logit、偏移、expit',`<div class="to-expression">${cell(`初始预测 ${math('\\widehat Q_A')}`,v.qa)}${op('→')}<span class="to-transform">logit</span>${op('→')}${cell('offset',v.offset)}${op('＋')}${cell(math('\\varepsilon H_A'),v.shift)}${op('＝')}${cell('更新后logit',v.eta)}${op('→')}<span class="to-transform">expit</span>${op('→')}${cell(t===target?`更新预测 ${math('\\widehat Q_A^*')}`:`当前预测 ${math('Q_\\varepsilon')}`,v.qstar_a)}</div>`);
 })}</div>`).join('');
 return `<section class="to-overview" data-tmle-overview data-to-step="0" aria-label="TMLE六步算法导读">
 <div class="to-step-list" role="group" aria-label="选择TMLE算法步骤">${labels.map((label,i)=>`<button type="button" data-to-go="${i}" aria-controls="to-panel-${i}"${i?'':' aria-current="step"'}>${i+1}. ${label}</button>`).join('')}</div>
 ${labels.map((label,i)=>`<template data-to-label="${i}">${label}</template><template data-to-note="${i}">${notes[i]}</template>`).join('')}
 <p class="to-status" data-to-status role="status" aria-live="polite">第1/6步：${labels[0]}</p>
 ${parts.map((md,i)=>`<section id="to-panel-${i}" data-to-panel="${i}"${i?' hidden':''}>${renderStep(md).replace('<div class="tmle-direction-placeholder"></div>',direction).replace('<div class="tmle-ipw-placeholder"></div>',()=>renderIpwBridge(initial)).replace('<div class="tmle-eif-aipw-placeholder"></div>',()=>renderEifAipwBridge(initial)).replace('<div class="tmle-calibration-placeholder"></div>',()=>renderCalibration(initial.summary,target.summary)).replace('<div class="tmle-reference-placeholder"></div>',renderReferenceCalibration)}</section>`).join('')}
 <div data-to-only="2,3" hidden class="to-trial"><span>回看这次拟合：</span><button type="button" data-to-view="initial" aria-pressed="false">初始 ${math('\\varepsilon=0')}</button><button type="button" data-to-view="target" aria-pressed="true">拟合完成</button><p>${math('Q')}的初始预测与${math('g')}固定；只改变共同的${math('\\varepsilon')}。拟合使用实际${math('A')}、${math('Y')}，求解容差10⁻¹²。</p></div>
 <div data-to-only="2,3" hidden>${states(initial,target,t=>`<div class="to-metrics">${scalar(`当前${math('\\varepsilon')}（共同系数）`,t.summary.epsilon)}${scalar('全部患者的加权残差平均',t.summary.score)}</div>`)}</div>
 <div data-to-only="3" hidden class="to-update"><label>查看实际处理下的逐步运算 <select data-to-row>${initial.rowNumbers.map(r=>`<option value="${r}">原行 ${r}</option>`).join('')}</select></label>${flow}<p>同一个${math('\\varepsilon')}还分别乘上${math('H_1')}、${math('H_0')}，更新下表每人的两臂预测。</p></div>
 <p class="to-table-caption"><b>患者表</b> · 原CSV前6行 · <span data-to-table-note>三列初始风险预测已加入</span></p>
 ${table}
 <p class="to-data-note">概率列采用0–1尺度；所有患者列都是${math('5735\\times1')}，这里仅预览6行。原始${math('W')}、${math('A')}、${math('Y')}保持固定，${math('Q')}与${math('g')}沿用上文同一拟合；新加入的列以蓝色突出。</p>
 <div data-to-only="4" hidden class="to-metrics">${scalar('全5735人更新后的平均风险差',target.summary.estimate,'pp')}</div>
 <div data-to-only="5" hidden class="to-metrics">${scalar('全体拟合EIF的平均',target.summary.eif_mean)}${scalar('EIF经验方差（概率差²）',target.summary.variance)}${scalar('按EIF公式计算的标准误',target.summary.se,'pp')}</div>
 <div class="to-navigation"><button type="button" data-to-previous disabled>← 上一步</button><button type="button" data-to-next>下一步 →</button><button type="button" data-to-reset>从第1步重看</button></div>
 </section>`;
}
