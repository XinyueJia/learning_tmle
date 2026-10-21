import {renderInlineMath as math} from '../../scripts/markdown.js';
import {meanTransfer} from '../../shared/js/mean-transfer.js';
const f=value=>{const v=Math.abs(value)<5e-7?0:value;return(v>0?'+':'')+v.toFixed(6);};
export function renderIfMotivation(html,data){
 const marker='<div class="if-motivation-placeholder"></div>';
 if(!html.includes(marker))return html;
 const state=meanTransfer(data.Y,.01),{n,baseP,fixedInfluence}=state;
 const risk0=data.q0.reduce((sum,value)=>sum+value,0)/n,risk1=data.q1.reduce((sum,value)=>sum+value,0)/n;
 if(Math.abs(risk1-risk0-data.initialRiskDifference)>1e-12)throw Error('G-computation preview must use the complete fixed fitted predictions');
 const probabilityCards=baseP.map((p,y)=>`<div class="im-prob-card" data-im-outcome="${y}"><strong>${math(`y=${y}`)} · ${y?'30日死亡':'30日存活'}</strong><p>原概率 <b data-im-base="${y}">${(100*p).toFixed(4)}%</b></p><div class="im-prob-track" aria-hidden="true"><i style="width:${100*p}%"></i></div><p>转移后 <b data-im-new="${y}">${(100*state.changedP[y]).toFixed(4)}%</b></p><div class="im-prob-track im-new-track" aria-hidden="true"><i data-im-bar="${y}" style="width:${100*state.changedP[y]}%"></i></div><small>概率改变 <b data-im-delta-p="${y}">${f(state.directionWeights[y])}</b></small></div>`).join('');
 const vector=(key,title,label,values)=>`<div class="im-vector" data-im-vector="${key}"><header><strong>${title}</strong><small>${label}</small></header>${values.map((value,y)=>`<div class="im-row" data-im-y="${y}"><small>y=${y}</small><b data-im-${key}="${y}">${f(value)}</b></div>`).join('')}<footer>${key==='fixed'?'原参考μ不变，旧D不重算':'两行依次对应存活、死亡两类结局'}</footer></div>`;
 return html.replace(marker,`<figure class="im-visual" data-im-visual>
 <figcaption><strong>先看已有的估计，再看为什么要研究变化</strong></figcaption>
 <h4>A. 用Q完成全人群标准化后，真实误差仍未知</h4>
 <p>预览同一${n}人及第8讲指定的多变量W初始结局回归。两种预测都对同一批人的基线取平均。</p>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="同人群两种平均预测之差为已知估计，真实目标仍未知，可横向滚动"><div class="im-estimate-flow"><div class="im-predictions"><strong>两种平均预测风险</strong>${[[1,risk1],[0,risk0]].map(([a,risk])=>`<p>${math(`\\widehat Q(${a},W)`)} 逐人预测后平均：<b data-im-risk="${a}">${(100*risk).toFixed(4)}%</b></p><div class="im-prob-track ov-${a?'purple':'cyan'}" aria-hidden="true"><i style="width:${100*risk}%"></i></div>`).join('')}<small>同一0—100%死亡风险刻度；使用全部${n}项</small></div><span class="im-arrow" aria-label="两平均风险相减">→</span><div class="im-point"><strong>已完成：点估计</strong><b data-im-gcomp="${data.initialRiskDifference}">${(100*data.initialRiskDifference).toFixed(4)} pp</b><span>${math('\\widehat\\psi_{\\mathrm{gcomp}}')}</span><small>由拟合Q和样本基线计算</small></div><div class="im-truth"><strong>真实目标${math('\\psi_0')}</strong><b>未知</b><span>所以真实误差也未知</span><small>点估计本身没有给出<br>误差大小或抽样波动</small></div></div></div>
 <div class="im-questions"><p><strong>下一步想知道什么？</strong> 现有患者和拟合结果给出确定的点估计。希望据此推断未知目标时，还需要估计它的精度：有限资料与Q拟合怎样影响最终数字？IF帮助分析这种联系；§5.2将用现有记录展示标准误的计算。</p></div>
 <h4>B. 先用死亡均值展示概率变化怎样影响目标</h4>
 <p>先用全队列死亡均值练习这一步：原${n}条结局形成参考概率，下面只调整存活、死亡两类的概率权重。${math('\\delta=0.01')}表示从存活类移给死亡类1个百分点的概率；负值表示反向移动。</p>
 <div class="im-controls"><label>转移量δ（概率差；0.01＝1个百分点）<input type="number" step="any" min="${state.allowed[0]}" max="${state.allowed[1]}" value="0.01" data-im-delta></label><label>拖动转移量<input type="range" step="1" min="0" max="10000" value="${Math.round((.01-state.allowed[0])/(state.allowed[1]-state.allowed[0])*10000)}" aria-valuetext="δ=0.01" data-im-slider></label><button type="button" data-im-action="positive">0→1：+0.01</button><button type="button" data-im-action="negative">1→0：−0.01</button><button type="button" data-im-action="lower">全部移向0</button><button type="button" data-im-action="upper">全部移向1</button><button type="button" data-im-action="reset">重置</button></div>
 <p class="im-status" data-im-status role="status">从存活类取走0.01概率，加到死亡类；两类改变量的和为0。</p><p data-im-error hidden></p>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="两类结局概率转移前后，共用0到100%刻度，可横向滚动"><div class="im-probabilities">${probabilityCards}<div class="im-mean-card"><strong>直接重算均值</strong><p>原均值 ${(100*state.baseMean).toFixed(4)}%</p><p>新均值 <b data-im-new-mean>${(100*state.changedMean).toFixed(4)}%</b></p><p>变化 <b data-im-exact>${f(state.exactChange)}</b></p><small>两类概率和＝<b data-im-prob-sum>${state.changedProbabilitySum.toFixed(6)}</b><br>概率条共用0—100%刻度</small></div></div></div>
 <h4>C. 将两个IF值分别乘以概率改变量，再相加</h4>
 <p>固定原参考均值${math(`\\mu=${state.events}/${n}`)}。均值规则${math('D^{\\mathrm{mean}}_P(y)=y-\\mu')}的两个取值分别为 <b>${f(fixedInfluence[0])}</b> 和 <b>${f(fixedInfluence[1])}</b>；负值表示增加该类权重会使均值下降，正值表示上升。下面将这两个影响值乘以对应的概率改变量，再相加；第1章会推导规则本身。</p>
 <div class="diagram-scroll" tabindex="0" role="region" aria-label="概率改变量与固定旧影响值逐行相乘，两项相加，可横向滚动"><div class="im-pairing">${vector('weights',math('\\Delta p_y'),'每类概率的新值减旧值',state.directionWeights)}<span class="im-operation">逐行<br>相乘</span>${vector('fixed',math('D^{\\mathrm{mean}}_P(y)'),'固定规则的两个取值',fixedInfluence)}<span class="im-arrow" aria-hidden="true">→</span>${vector('terms','每项乘积','正负号一起参与乘法',state.weightedTerms)}<span class="im-operation">两项<br>相加 →</span><div class="im-paired-scalar"><strong>合计</strong><b data-im-paired>${f(state.pairedChange)}</b><small>与直接重算的<br>均值变化相同</small></div></div></div>
 <p class="im-explanation" data-im-explanation>拿掉存活类的负值部分、增加死亡类的正值部分，这次两个乘积都是正数；两项相加为+0.01。可以与正文刚才展开的乘法逐项核对。</p>
 <p class="im-note">图中始终使用原参考均值定义的D。对于均值，两项乘积之和精确等于均值变化。第1章推导这条规则，第5—6章再检验所有允许方向，并解释如何确定规范的梯度。</p>
 <script type="application/json" data-im-outcomes>${JSON.stringify(state.outcomes)}</script>
 </figure>`);
}
