import {renderInlineMath as math} from '../../scripts/markdown.js';
import {meanErrorData} from '../../shared/js/mean-error.js';
const f=value=>{const rounded=Math.abs(value)<5e-7?0:value;return(rounded>0?'+':'')+rounded.toFixed(6);};
export function renderMeanError(html,data){
 const marker='<div class="if-error-placeholder"></div>';
 if(!html.includes(marker))return html;
 const state=meanErrorData(data.Y),demo=meanErrorData(data.Y,.3),{n,events,muhat}=state,shown=state.outcomes.slice(0,6);
 const inference=state.iidMeanInference;
 const mode=(key,body)=>`<span data-ie-only="${key}"${key==='population'?'':' hidden'}>${body}</span>`;
 const row=(y,i,output)=>`<div class="ie-row" data-ie-row="${i+1}" data-ie-y="${y}"><small>i=${i+1}</small>${output?`${mode('population',math(`${y}-\\mu_0`))}${mode('empirical',`<b data-ie-sample-value="${state.sampleCentred.values[i]}">${f(state.sampleCentred.values[i])}</b>`)}${mode('assumed',`<b data-ie-assumed-value="${i}">${f(demo.referenceCentred.values[i])}</b>`)}`:`<b>${y}</b>`}</div>`;
 const vector=output=>`<div class="ie-vector ${output?'ie-contributions':'ie-outcomes'}"><header><strong>${output?`${mode('population',math('D^{\\mathrm{mean}}_{P_0}(y_i)'))}${mode('empirical',math('D^{\\mathrm{mean}}_{P_n}(y_i)'))}${mode('assumed',math('y_i-m'))}`:math('y_i')}</strong><span>${output?`${mode('population','真实均值IF · 中心未知')}${mode('empirical','OLS残差 · 估计IF')}${mode('assumed','相对假设中心的差值')}`:'真实已观察的结局'}</span><small>完整${n}项 · 只预览前${shown.length}项</small></header>${shown.map((y,i)=>row(y,i,output)).join('')}<footer>⋮<br>${output?'后面仍有其余记录的输出':'原始结局始终不变'}</footer></div>`;
 return html.replace(marker,`<figure class="ie-visual" data-ie-visual style="--ie-half-height:${shown.length*38/2}px">
 <figcaption><strong>每条RHC结局减去不同的均值，会得到什么？</strong><br>从OLS残差接到均值IF：同一列结局，只改变减去的中心。</figcaption>
 <h4>① 用这份数据描述队列，或估计目标人群的风险</h4>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="固定未知真实分布与当前数据的经验分布，可横向滚动"><div class="ie-laws">
 <div class="ie-law ie-population" data-ie-population><strong>${math('P_0')} · 固定但未知</strong><p>推断任务：目标人群的真实观测规律</p><div class="ie-unknown">${math('\\mu_0=\\mathbb E_{P_0}[Y]')}<b>未知</b></div><p>目标风险固定但未知。当前队列提供估计它的资料。</p></div>
 <div class="ie-sampling"><span aria-hidden="true">→</span><small>现有资料<br>${n}条记录</small></div>
 <div class="ie-law ie-empirical"><strong>${math('P_n')} · 当前数据可算</strong><p>描述任务：这${n}人的结局已全部记录；每条赋权重1/${n}</p><small>0—100%死亡概率刻度</small><div class="ie-risk-track" aria-label="当前经验死亡比例${(100*muhat).toFixed(4)}%"><i style="width:${100*muhat}%"></i></div><p>${events}个死亡 / ${n}人<br>${math(`\\widehat\\mu_n=${events}/${n}`)} ≈ <b data-ie-sample-risk>${(100*muhat).toFixed(4)}%</b></p><p>这批人的比例已确定；用它推断总体风险时，它承担估计值的角色。</p></div></div></div>
 <p class="ie-note">实际只使用现有这一批资料。假想重复抽样是在固定P₀的数据形成模型下比较可能的患者组合，用来定义推断中的波动；下面的控件只改变减去的中心。</p>
 <h4>② 改变减去的中心，逐人差值的含义也随之改变</h4>
 <div class="ie-controls"><label>每个结局减去哪个均值？<select data-ie-mode><option value="population">真实总体均值μ₀：固定、未知</option><option value="empirical">本样本均值μ̂ₙ：得到OLS残差</option><option value="assumed">假设均值m：仅供数值试算</option></select></label><label data-ie-assumption hidden>假设m（概率，0—1）<input type="number" min="0" max="1" step="0.01" value="0.3" data-ie-reference></label><button type="button" data-ie-reset>重置图示</button></div>
 <p class="ie-status" data-ie-status role="status">真实μ₀未知，逐人输出和估计误差先用含μ₀的式子表示。</p><p data-ie-error hidden></p>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="结局逐人减去固定中心，再对全样本平均，可横向滚动"><div class="ie-flow">${vector(false)}<span class="ie-operator" aria-hidden="true">→</span><div class="ie-centre"><small>每行都减同一个中心</small><strong>${mode('population',math('\\mu_0\\ (\\text{未知})'))}${mode('empirical',math(`\\widehat\\mu_n=\\frac{${events}}{${n}}`))}${mode('assumed',`${math('m=')}<b data-ie-reference-value>0.300000</b>`)}</strong><span>${mode('population','真实分布下的均值规则')}${mode('empirical','只截距OLS的拟合值')}${mode('assumed','用指定的m进行数值试算')}</span></div><span class="ie-operator" aria-hidden="true">→</span>${vector(true)}<span class="ie-operator ie-average-label">全${n}项<br>取平均 →</span><div class="ie-average"><header>一个汇总后的数</header><strong>${mode('population',math('\\widehat\\mu_n-\\mu_0'))}${mode('empirical','<b data-ie-sample-average>'+f(state.sampleCentred.mean)+'</b>')}${mode('assumed','<b data-ie-distance>'+f(demo.distance)+'</b>')}</strong><span>${mode('population','实际估计误差 · 数值未知')}${mode('empirical','OLS残差的平均 · 可计算')}${mode('assumed','样本均值与假设m的距离')}</span></div></div></div>
 <p class="ie-result">${mode('population',`这里的两个未知是同一件事：左边每项需要${math('\\mu_0')}，右边实际误差也需要${math('\\mu_0')}。下面将逐步证明两边相等。`)}${mode('empirical',`每项现在都是只截距OLS残差，也是在样本中心准备的估计IF值。平均为0来自拟合均值等于样本均值（机器运算可能有微小舍入误差）；真实误差对应上面的μ₀规则。`)}${mode('assumed',`${math('\\widehat\\mu_n-m=')}<b data-ie-distance-copy>${f(demo.distance)}</b>，即 <b data-ie-distance-pp>${(100*demo.distance).toFixed(4)}</b> 个百分点。这里算的是相对于指定m的距离；m取真实μ₀时，距离就成为实际估计误差。`)}</p>
 <p class="ie-note">图中预览前${shown.length}项，平均使用完整${n}项。切换选项只改变每行减去的中心。概率差0.01对应1个百分点（percentage point）。</p>
 <h4>③ 平均为0，还能用这批数据估计标准误吗？</h4>
 <p>将中心换成本样本均值后，各项差值可以计算。正负差值在平均时抵消，平方后保留偏离的大小。下列运算固定使用同一份完整数据，与上面的假设m控件分开。</p>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="现有患者的估计IF值平方后汇总，计算iid均值标准误，可横向滚动"><div class="ie-inference-flow" data-ie-inference>
 <div class="ie-spread-block"><strong>估计IF值</strong><span>${math('\\widehat D_i=y_i-\\widehat\\mu_n')}</span>${state.grouped.support.map((y,i)=>`<p>Y=${y} · ${state.grouped.counts[i]}人<br><b>${f(state.grouped.sampleCentred.values[i])}</b></p>`).join('')}<small>全${n}项平均为0</small></div>
 <span class="ie-inference-op">逐项平方<br>再相加 →</span>
 <div class="ie-spread-block"><strong>平方和</strong><span>${math('\\sum_i\\widehat D_i^2')}</span><b data-ie-sum-squares="${inference.sumSquares}">${inference.sumSquares.toFixed(4)}</b><small>每项平方 ≥ 0<br>保留偏离的大小</small></div>
 <span class="ie-inference-op">÷ ${n-1}<br>→</span>
 <div class="ie-spread-block"><strong>样本方差</strong><span>${math('s_D^2')}</span><b data-ie-sample-variance="${inference.sampleVariance}">${inference.sampleVariance===null?'n至少为2':inference.sampleVariance.toFixed(6)}</b><small>分母n−1<br>单位：概率差的平方</small></div>
 <span class="ie-inference-op">÷ ${n}<br>再开平方 →</span>
 <div class="ie-spread-block ie-se-result"><strong>均值标准误估计</strong><span>${math('\\widehat{\\operatorname{SE}}(\\widehat\\mu_n)')}</span><b data-ie-standard-error="${inference.standardError}">${inference.standardError===null?'n至少为2':inference.standardError.toFixed(6)}</b><span data-ie-se-pp>${inference.standardError===null?'':`约${(100*inference.standardError).toFixed(4)}个百分点`}</span><small>iid抽样模型下的波动尺度</small></div>
 </div></div>
 <p class="ie-note">标准误由现有记录估计；本次真实误差仍取决于未知μ₀。这里计算描述性均值的标准误，使用独立同分布模型；ATE/IPW/AIPW/TMLE需要各自的误差推导。</p>
 <script type="application/json" data-ie-outcomes>${JSON.stringify(state.outcomes)}</script>
 </figure>`);
}
