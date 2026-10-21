import {renderTargetComparison} from './target-comparison.js';
import {renderInlineMath as math} from '../../scripts/markdown.js';
import {correctionBridge} from '../../shared/js/eif-correction.js';
const rounded=v=>Math.abs(v)<5e-7?0:v;
const f=v=>(rounded(v)>=0?'+':'')+rounded(v).toFixed(6),pp=v=>(100*rounded(v)).toFixed(4)+' pp';
const descriptions={
 initial:{label:'初始EIF',law:'\\widehat P_{\\mathrm{init}}',q:'\\widehat Q_{\\mathrm{init}}',theta:'\\widehat\\psi_{\\mathrm{init}}',fn:'D^*_{\\widehat P_{\\mathrm{init}}}',action:'固定初始Q和g，以初始标准化风险差为中心。',reason:'在拟合分布下，残差平均为0；原患者记录中的加权残差平均尚未归零。'},
 aipw:{label:'AIPW：改最终标量',law:'\\widehat P_{\\mathrm{init}}',q:'\\widehat Q_{\\mathrm{init}}',theta:'\\widehat\\psi_{\\mathrm{AIPW}}',fn:'U_{\\widehat Q_{\\mathrm{init}},\\widehat g;\\widehat\\psi_{\\mathrm{AIPW}}}',action:'Q、g及拟合分布保持初始版本；将初始校正量加到最终估计。',reason:'当前显示候选参数的估计函数U。经验平均因选择这个中心而为0；在初始拟合分布下，其平均反而是初始校正量的相反数。'},
 half:{label:'TMLE：更新到一半',law:'\\widehat P_{\\varepsilon}',q:'\\widehat Q_{\\varepsilon}',theta:'\\widehat\\psi_{\\varepsilon}',fn:'D^*_{\\widehat P_{\\varepsilon}}',action:'取最终求根幅度的一半作中间试算。Q已改变，g与经验W分布仍固定。',reason:'每次用当前Q重新标准化并确定中心。拟合分布下的EIF平均仍为0；原始记录上的平均尚未满足求根条件。'},
 tmle:{label:'TMLE：求根完成',law:'\\widehat P_*',q:'\\widehat Q_*',theta:'\\widehat\\psi_{\\mathrm{TMLE}}',fn:'D^*_{\\widehat P_*}',action:'选定使全体加权残差平均接近0的幅度，得到Q*；再用Q*重新标准化。',reason:'这次既换了拟合分布中的Q，也让它在原记录上满足经验EIF方程。g及原始患者记录保持不变。'},
};
function stagePanel(stage){
 const d=descriptions[stage.key],shown=stage.rows.slice(0,6),eq=stage.key==='aipw';
 const scalar=(title,formula,value,attr)=>`<div class="ec-scalar"><strong>${title}</strong><span>${math(formula)}</span><b ${attr}="${value}">${pp(value)}</b><small>${f(value)} 概率差</small></div>`;
 return `<section data-ec-panel="${stage.key}"${stage.key==='initial'?'':' hidden'}>
 <h4>${d.label}</h4><p>${d.action}</p>
 <div class="ec-versions"><div><strong>规则用哪一版？</strong><p>当前Q：${math(d.q)}（${stage.qVersion==='initial'?'初始版':stage.qVersion==='targeted'?'更新完成':'更新中'}）</p><p>当前g：${math('\\widehat g')}（初始版，固定）</p><p>拟合分布：${math(d.law)}</p><p>${math(d.theta+'='+stage.theta.toFixed(8))}</p><small>${stage.key==='initial'||eq?'ε=0，未更新预测':`ε=${stage.epsilon.toFixed(10)}，更新Q的预测`}</small></div><div><strong>平均用哪些记录？</strong><p>${math('P_n')}：原始${stage.n}条实际记录</p><small>每条权重1/${stage.n}；实际W、A、Y均固定</small></div></div>
 <p>${math(d.fn)}${eq?'是当前候选中心下的估计函数。':'是非参数观测模型中、当前拟合分布处的EIF。'}下表逐行计算，图中预览前6人，所有平均使用完整${stage.n}人。</p>
 <div class="table-wrap" tabindex="0" role="region" aria-label="${d.label}同六位RHC患者逐项计算，可横向滚动"><table class="ec-patients"><thead><tr><th>原行i</th><th>原A / Y</th><th>当前${math('Q(A_i,W_i)')}</th><th>初始${math('\\widehat g(W_i)')}</th><th>${math('C_i')} 加权残差</th><th>${math('\\Delta_i')} 两臂预测差</th><th>减去同一中心</th><th>${eq?'U输出':'EIF输出'}</th></tr></thead><tbody>${shown.map(r=>`<tr data-ec-row="${r.row}"><td>${r.row}</td><td>${r.a} / ${r.y}</td><td data-ec-cell="qa" data-value="${r.qa}">${r.qa.toFixed(6)}</td><td data-ec-cell="g" data-value="${r.g}">${r.g.toFixed(6)}</td><td class="ec-c" data-ec-cell="correction" data-value="${r.correction}">${f(r.correction)}</td><td class="ec-delta" data-ec-cell="contrast" data-value="${r.contrast}">${f(r.contrast)}</td><td data-ec-cell="theta" data-value="${r.theta}">${r.theta.toFixed(6)}</td><td data-ec-cell="value" data-value="${r.value}">${f(r.value)}</td></tr>`).join('')}</tbody></table></div>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="${d.label}经验平均的三项相消，可横向滚动"><div class="ec-equation">
 ${scalar('加权残差平均','P_n C',stage.residualMean,'data-ec-residual')}<span class="ec-op">＋</span>${scalar('当前Q标准化','P_n\\Delta',stage.contrastMean,'data-ec-plugin')}<span class="ec-op">−</span>${scalar('当前中心',d.theta,stage.theta,'data-ec-theta')}<span class="ec-op">＝</span>${scalar(eq?'估计函数经验平均':'EIF经验平均',eq?'P_n U':'P_n D^*',stage.empiricalMean,'data-ec-empirical')}
 </div></div>
 <div class="ec-comparison"><div><strong>按原始记录平均</strong><p>${math(eq?'P_n U':'P_n D^*')} = <b>${f(stage.empiricalMean)}</b></p><small>保留实际A、Y，每人1/n</small></div><div><strong>按当前拟合分布平均</strong><p>${math('\\mathbb E_{'+d.law+'}['+(eq?'U':'D^*')+']')} = <b data-ec-model="${stage.modelMean}">${f(stage.modelMean)}</b></p><small>W仍按经验分布；A用ĝ、Y用当前Q的概率平均</small></div></div>
 <p class="ec-explanation">${d.reason}</p>
 <details><summary>固定第1人的W，核对拟合分布中四种A、Y组合的加权平均</summary><p>这四行是同一基线下的可能取值组合，用当前g和Q给概率。原第1人的实际A、Y仍在上表。这里先核对加权残差的条件平均。</p><div class="table-wrap" tabindex="0" role="region" aria-label="拟合分布中的四种条件组合，可横向滚动"><table><thead><tr><th>A</th><th>Y</th><th>条件联合概率</th><th>${math('H(Y-Q)')}</th><th>概率 × 加权残差</th></tr></thead><tbody>${stage.modelFirst.cells.map(c=>`<tr><td>${c.a}</td><td>${c.y}</td><td>${c.mass.toFixed(6)}</td><td>${f(c.weightedResidual)}</td><td>${f(c.mass*c.weightedResidual)}</td></tr>`).join('')}</tbody></table></div><p>四项概率和为${stage.modelFirst.mass.toFixed(6)}；概率乘加权残差后相加为${f(stage.modelFirst.residualMean)}。对全部${stage.n}个基线位置都这样平均，再加上两臂预测差并减去当前中心，得到上方拟合分布的平均${f(stage.modelMean)}。小数仅用于显示，计算使用完整精度。</p></details>
 </section>`;
}
export function renderEifCorrection(html,fit){
 const marker='<div class="eif-correction-placeholder"></div>';if(!html.includes(marker)&&!html.includes('<div class="target-comparison-placeholder"></div>'))return html;
 const data=correctionBridge(fit);
 html=html.replace(marker,`<figure class="ec-visual" data-eif-correction><figcaption><strong>比较当前估计函数在拟合分布与经验分布下的平均</strong></figcaption><p>固定第8讲的多变量W与原始${data.n}人。选择一次计算，追踪Q、g、中心与两种平均。真实总体P₀及真实误差在所有步骤中都未知。</p><div class="ec-controls" role="group" aria-label="选择IF与校正步骤">${data.stages.map(s=>`<button type="button" data-ec-choice="${s.key}" aria-pressed="${s.key==='initial'}" aria-controls="ec-panel-${s.key}">${descriptions[s.key].label}</button>`).join('')}<button type="button" data-ec-reset>重置图示</button></div><p data-ec-status role="status" aria-live="polite">当前：初始EIF；Q和g均为初始版。</p>${data.stages.map(stagePanel).join('').replaceAll(/data-ec-panel="([^"]+)"/g,'id="ec-panel-$1" data-ec-panel="$1"')}<p class="ec-note">TMLE求根容差为${data.tolerance}；“约为0”保留求解与舍入误差。图中的中心和校正量均由现有资料计算，真实目标仍未知。</p></figure>`);
 return renderTargetComparison(html,data);
}
