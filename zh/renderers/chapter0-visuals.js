import { CASE_CONTEXT as context } from '../src/case-context.js';
import { chapter0Data, chapter0ErrorData } from '../src/chapter0-data.js';
import { renderInlineMath as math, renderFormulaRecall as recall } from '../../scripts/markdown.js';

const f = n => String(Number(n.toFixed(4)));
const pct = n => `${f(100 * n)}%`;
const figure = (id, title, lead, body, reminder, caption) => `<figure class="step-visual intro-visual" id="intro-visual-${id}" data-intro-visual-id="${id}" aria-labelledby="intro-title-${id}"><div class="visual-kicker">第0章 · 看图理解</div><h3 id="intro-title-${id}">${title}</h3><p class="visual-lead">${lead}</p>${body}${recall(reminder)}<figcaption>${caption}</figcaption></figure>`;

/** Component diagram: hypothetical fitted outputs, not a fit to the fixed CSV. */
function estimatorMap(data) {
  const fitted = data.scenarios[0];
  const arrow = '<span class="estimator-arrow" aria-hidden="true">→</span>';
  const records = `<svg class="estimator-records" viewBox="0 0 160 104" role="img" aria-label="一份样本包含多条基线、用药和结局记录，图中行数仅作示意"><rect x="13" y="5" width="134" height="92" rx="7" fill="#edf3f6" stroke="#9eb4c3"/><text x="43" y="24">X</text><text x="78" y="24">A</text><text x="113" y="24">Y</text>${[35,51,67,83].map((y,i)=>`<circle cx="26" cy="${y}" r="3" fill="#3976a8"/>${[45,80,115].map((x,j)=>`<rect x="${x-9}" y="${y-4}" width="18" height="8" rx="2" fill="${(i+j)%2?'#c2d7c8':'#d9bc91'}"/>`).join('')}`).join('')}</svg>`;
  const fitBars = `<svg class="estimator-fit-bars" viewBox="0 0 190 114" role="img" aria-label="设定的两组拟合风险，药物B与药物A各两项，均为0到100%刻度"><text x="32" y="15" fill="#3976a8">药物B</text><text x="104" y="15" fill="#a66520">药物A</text>${[0,1].map(x=>`<text x="3" y="${40+x*48}">X=${x}</text>${[0,1].map(a=>{const q=fitted.fit.q[a][x],y=27+x*48+a*17;return `<rect x="42" y="${y}" width="104" height="11" fill="#e3e8df"/><rect x="42" y="${y}" width="${104*q}" height="11" fill="${a?'#a66520':'#3976a8'}"/><text x="150" y="${y+10}">${pct(q)}</text>`;}).join('')}`).join('')}</svg>`;
  const contributions = `<svg class="estimator-contributions" viewBox="0 0 210 82" role="img" aria-label="IF对不同记录给出正负贡献，图中条形仅作概念示意，无实际数值"><line x1="10" x2="200" y1="40" y2="40" stroke="#7a9284"/>${[-17,26,-11,18,-25,9].map((v,i)=>`<rect x="${18+i*29}" y="${v>0?40-v:40}" width="14" height="${Math.abs(v)}" rx="2" fill="${v>0?'#287663':'#a66520'}"/>`).join('')}<text x="9" y="16">＋</text><text x="9" y="74">−</text></svg>`;
  return figure('estimator-map', '从估计过程到方法修正：IF怎样指导AIPW与TMLE', '上方标出两种方法的介入位置；下方从IF分析层接到两条修正路径。仍使用同一RWS目标和设定的初始拟合。',
    `<div class="estimator-target-band"><span class="estimator-target-icon" aria-hidden="true">◎</span><div><small>先固定研究问题与目标</small><strong>同一人群：药物A减B的12个月进展或全因死亡风险差</strong></div></div>
    <section class="estimator-rule" aria-label="代入估计量的计算组件"><div class="estimator-rule-label">初始代入估计量（estimator）＝ 下方四步规则；标记指出后续修正位置</div><ol class="estimator-flow">
      <li class="estimator-node" data-estimator-component="sample"><span class="estimator-step">1 · 输入</span><h4>一份RWS样本</h4>${records}<p>每人一条 ${math('O_i=(X_i,A_i,Y_i)')} 记录</p></li>
      <li class="estimator-node" data-estimator-component="fit"><span class="estimator-step">2 · 拟合</span><h4>估计组成目标的量</h4><div class="estimator-weight-strip" role="img" aria-label="本课标准化采用样本基线组别比例，两个基线组各占50%">${fitted.fit.px.map((p,x)=>`<span style="width:${100*p}%">X=${x}：${pct(p)}</span>`).join('')}</div>${fitBars}<p>样本组别比例 ＋ 四项组内风险</p><span class="method-mark method-mark-tmle" data-method-anchor="tmle">↺ TMLE在这里更新风险</span></li>
      <li class="estimator-node" data-estimator-component="target"><span class="estimator-step">3 · 代入目标规则</span><h4>标准化后再相减</h4><div class="estimator-merge" aria-label="两臂使用同一套目标人群权重"><span>${pct(fitted.fit.px[0])}</span><span>${pct(fitted.fit.px[1])}</span><b aria-hidden="true">↘　↙</b><strong>两臂各自加权</strong></div><div class="estimator-arm-results"><span>药物A ${pct(fitted.risk1)}</span><span>药物B ${pct(fitted.risk0)}</span></div><p>${math('\\Psi(\\widetilde P)')}：加权风险A − 加权风险B</p></li>
      <li class="estimator-node estimator-output" data-estimator-component="estimate" data-estimate="${f(fitted.estimate)}"><span class="estimator-step">4 · 输出</span><h4>本次估计值</h4><strong class="estimator-result">${f(100*fitted.estimate)} <small>pp</small></strong><p>教学真值 ${f(100*data.target)} pp</p><div class="estimator-error" data-error="${f(fitted.error)}">本次误差 +${f(100*fitted.error)} pp</div><span class="method-mark method-mark-aipw" data-method-anchor="aipw">＋ AIPW在这里加校正</span></li>
    </ol></section>
    <div class="estimator-theory-link"><span aria-hidden="true">┆<br>↓</span>分析整条规则的误差，并用这一结构指导下方的方法构造</div>
    <section class="estimator-analysis" data-if-position="analysis" aria-label="IF所在的误差分析层"><header><span>IF</span><div><small>误差分析层</small><h4>把分布与样本的波动，接到目标的估计误差</h4></div></header><div class="estimator-if-flow">
      <div class="estimator-if-context"><span>给定同一目标 ${math('\\Psi')}</span><span>规定统计模型</span><small>哪些分布变化允许发生？</small></div>${arrow}
      <div class="estimator-if-function"><div class="estimator-function-symbol">${math('D_P')}</div><strong>构建并验证影响函数</strong><small>每条记录 ${math('O_i')}<br>对应贡献 ${math('D_P(O_i)')}</small></div>${arrow}
      <div class="estimator-if-average">${contributions}<strong>各条记录的贡献取平均</strong><small>正负贡献仅为示意，未计算本例ATE的IF</small></div>
    </div><div class="estimator-error-relation"><strong>满足条件时：估计误差 ＝ IF贡献的样本平均 ＋ 剩余项</strong><p>还需证明剩余项足够小，才能用IF描述主要抽样波动，并进一步计算标准误。普通代入估计并不自动满足这些条件。</p></div><p class="estimator-later">第1—6讲构建并验证IF → 第7讲建立估计误差与效率的联系 → 第8讲用这一结构设计偏差校正与目标化更新</p></section>
    <section class="estimator-methods" aria-label="EIF指导AIPW与TMLE的不同修正路径">
      <header><span class="method-guidance-symbol" aria-hidden="true">EIF<br>↙　↘</span><div><small>把理论结构用于构造估计方法</small><h4>从相同的初始拟合出发，分别修正估计值与风险预测</h4><p>上方的理论IF用于分析；这里用拟合的风险与用药概率，实现ATE EIF所给的修正结构。</p></div></header>
      <div class="method-shared-inputs" data-method-shared-inputs="true"><div><strong>观察结果与初始预测</strong><span>12个月是否进展或全因死亡<br>减去实际用药下的预测风险</span></div><div><strong>给定基线的用药概率</strong><span>药物A的概率，以及药物B的互补概率<br>用于调整每条记录的权重</span></div><div><strong>相同的目标人群</strong><span>继续用同一样本的基线组别比例<br>药物A风险减药物B风险</span></div></div>
      <div class="method-guidance-hub" data-guidance="eif"><strong>EIF给出：残差如何加权、两臂如何取正负号，以及目标相关的更新方向</strong><span>残差是“实际结局减预测风险”，只是EIF的一部分；以下只标方法位置，不展示完整EIF公式。</span></div>
      <div class="method-branches" aria-hidden="true"><span>↙ 指导输出端的校正</span><span>指导风险模型的更新 ↘</span></div>
      <div class="method-route-grid">
        <section class="method-route method-aipw" data-method-route="aipw" data-correction-position="estimate"><div class="method-route-heading"><span class="method-route-icon" aria-hidden="true">＋</span><div><h4>AIPW · 修正最终估计值</h4><small>对应上方步骤4 · 初始风险预测保留</small></div></div>
          <ol class="method-mini-flow"><li><span>初始代入值</span><strong>${f(100*fitted.estimate)} pp</strong></li><li class="method-adjustment"><span class="method-flow-arrow" aria-hidden="true">＋</span><strong>数据给出的校正项</strong><small>按EIF中的残差结构加权<br>再在同一样本中取平均</small></li><li class="method-output"><span class="method-flow-arrow" aria-hidden="true">↓</span><strong>AIPW估计值</strong></li></ol>
          <p class="method-if-guidance"><b>EIF怎样指导？</b>把预测遗漏的、与目标相关的残差信息汇总到估计值上。药物A与B的贡献按风险差方向相反计入。</p>
        </section>
        <section class="method-route method-tmle" data-method-route="tmle" data-correction-position="outcome-regression"><div class="method-route-heading"><span class="method-route-icon" aria-hidden="true">↺</span><div><h4>TMLE · 更新结局风险模型</h4><small>对应上方步骤2，再走步骤3与4</small></div></div>
          <ol class="method-mini-flow"><li><span>同一组初始风险预测</span><strong>沿EIF指定的目标方向更新</strong><small>选择更新幅度，让相应的<br>加权残差样本平均接近0</small></li><li class="method-adjustment"><span class="method-flow-arrow" aria-hidden="true">↓</span><strong>得到更新后的组内风险</strong><small>用原样本人群权重<br>重新标准化、相减</small></li><li class="method-output"><span class="method-flow-arrow" aria-hidden="true">↓</span><strong>TMLE估计值</strong></li></ol>
          <p class="method-if-guidance"><b>EIF怎样指导？</b>给出风险模型需要调整的方向及更新的判据。调整的是预测风险，患者记录与因果目标保持不变。</p>
        </section>
      </div>
      <p class="method-conditions">图中未计算两种修正后的数值，也不预设它们回到20 pp。TMLE所控制的是加权后的整体平均；样本EIF方程接近0本身不证明有限样本无偏。误差控制与推断条件留到后续章节。</p>
    </section>
`,
    String.raw`$O_i$ 是第$i$名患者的基线$X_i$、初始用药$A_i$与结局$Y_i$；$\widetilde P$表示拟合分布，$\Psi$是固定目标的计算规则。$D_P$表示以真实分布$P$为参考的理论IF，输入$O_i$后给出一条记录的贡献。图中各条IF柱没有数值，既不计算完整ATE EIF，也不把固定风险误差斜率当作IF。右端21 pp来自人为设定的初始拟合输出，不是固定CSV的实际训练结果，也不是两种修正后的数值。下方算法采用拟合的结局风险及倾向得分（propensity score）；它定义给定基线后启动药物A的概率，实际用药B的记录使用其互补概率。AIPW按EIF残差结构汇总校正项；本课标准化使用同一样本的组别比例，人群构成部分在样本平均中抵消，因此这里展示剩余的加权残差校正。TMLE固定这套权重、更新风险模型，使其样本EIF方程接近0。此处的拟合EIF结构须与上方以真实P为参考的理论IF区分；未知真实IF不直接作为程序输入。估计误差的展开与推断仍需要后文条件及足够小的剩余项。`,
    '同一RWS目标下，AIPW保留初始结局拟合并修正输出；TMLE更新结局风险后重新代入。两条路径共享EIF的一阶结构，但并非同一个有限样本算法。图中不比较两者谁总是更准；第8讲再构建完整公式及实际计算。');
}

export function chapter0Figures() {
  const d = chapter0Data();
  const errorData = chapter0ErrorData();
  return {
    question: figure('question', '先把一个问题填完整，再问用什么方法', '“有效吗”还没有告诉我们要算哪个数。下面五项合在一起，才给出一个具体的估计目标。',
      `<div class="intro-question-grid">${[
        ['目标人群',context.population,'这个平均数针对谁？'],
        ['处理与对照',`${context.arm1}，或${context.arm0}；其后均按常规诊疗`,'比较哪两种明确方案？'],
        ['结局',`${context.endpoint}；任一发生记1，无进展且存活记0`,'记录什么结果？'],
        ['时间',context.timeZero + '，观察12个月','观察到什么时候？'],
        ['汇总方式',context.contrast,'要风险差、风险比，还是某组结果？']
      ].map(([label,value,question])=>`<div><small>${label}</small><strong>${value}</strong><span>${question}</span></div>`).join('')}</div>`,
      String.raw`$A=1$ 与 $A=0$ 是处理和对照方案的标签；$Y=1$ 表示12个月内发生进展或全因死亡，$Y=0$ 表示无进展且存活；$A=0$是药物B治疗。问题还必须规定针对哪一人群以及采用什么汇总尺度，单有“处理”和“结局”两个标签还不够。`,
      '本例的方案和风险都是教学设定。确定估计目标发生在选择回归、加权或其他估计方法之前。'),
    'potential-outcomes': figure('potential-outcomes', '同一个人只能观察到实际采用方案下的结局', '这里不填写任何人的另一个结局。问题在于：实际记录没有同时提供同一人的两种方案结果。',
      `<div class="potential-person">同一个符合条件的人</div><div class="potential-branches"><section><span class="branch-tag">实际启动研究药物A · A=1</span><h4>${math('Y(1)')}</h4><p>按方案1时的潜在结局</p><strong class="observed-outcome">这一条实际发生，可以记录</strong></section><section class="counterfactual-branch"><span class="branch-tag">如果启动活性对照药物B · A=0</span><h4>${math('Y(0)')}</h4><p>按方案0时的潜在结局</p><strong>这一条没有同时观察到</strong></section></div>`,
      String.raw`$Y(1)$ 和 $Y(0)$ 表示同一人在两种规定方案下的潜在结局；括号里的数是方案标签，不是概率或乘法。图选定实际 $A=1$ 的情况，因此在一致性条件下观察到的是 $Y(1)$，另一个结局仍未知。`,
      '换一个实际A=0的人，可见的是Y(0)，不可见的是Y(1)。本课程要识别的是总体平均对比，并不据此恢复每个人未观察到的结果。'),
    identification: figure('identification', '先有因果问题，再说明怎样连接到观测数据', '识别（identification）是在说明：哪些条件成立时，观测分布足以确定我们关心的因果量。',
      `<div class="intro-bridge"><section><small>① 要回答的因果问题</small><strong>同一人群都采用方案1<br>与都采用方案0的平均结果之差</strong></section><div class="bridge-arrow" aria-hidden="true">↓</div><section class="assumption-bridge"><small>② 需要论证的桥梁</small><strong>一致性 · 给定基线的可交换性 · 正值性</strong><p>清楚定义处理，并在本例中排除个体间干扰；对遗漏混杂的判断需要研究设计与专业知识。</p></section><div class="bridge-arrow" aria-hidden="true">↓</div><section><small>③ 观测分布中的计算</small><strong>先比较相同基线组内的风险<br>再按同一目标人群的构成加权</strong></section></div>`,
      String.raw`$X$ 表示处理前的基线组，$A$ 是实际处理方案，$Y$ 是观察结局，$P$ 汇总它们的观测概率。桥梁把潜在结局问题接到 $P$ 的一个计算规则；EIF不替我们证明这些因果条件。`,
      '处理和对照组原本的人群构成可能不同。给两组使用同一套目标人群权重，所回答的问题才是“同一人群两种方案的比较”；该解释仍以识别条件成立为前提。'),
    'target-number': figure('target-number', '对同一人群分别计算两种方案的加权风险，再相减', '默认目标人群的两个基线组各占一半。组内风险沿用全书同一套离散模型。',
      `<div class="intro-risk-grid">${d.rows.map(row=>`<section><h4>基线组 ${row.x}</h4><p>人群占 ${pct(row.p)}</p><div>采用方案1：<strong>${pct(row.q1)}</strong></div><div>采用方案0：<strong>${pct(row.q0)}</strong></div><p>组内差：${f(100*row.cate)} pp</p></section>`).join('')}</div><div class="intro-static-risks">${[['同一人群都采用方案1',d.risk1],['同一人群都采用方案0',d.risk0]].map(([label,risk])=>`<div class="intro-risk-row"><span>${label}</span><div class="intro-risk-track"><i style="width:${100*risk}%"></i></div><strong>${pct(risk)}</strong></div>`).join('')}<p class="chart-note">横条从0开始，共用0–100%刻度。</p></div><p class="visual-result">方案1：${d.rows.map(row=>`${f(row.p)} × ${f(row.q1)}`).join(' + ')} = ${f(d.risk1)}<br>方案0：${d.rows.map(row=>`${f(row.p)} × ${f(row.q0)}`).join(' + ')} = ${f(d.risk0)}<br>相减：${f(d.risk1)} − ${f(d.risk0)} = ${f(d.ate)} = <b>${f(100*d.ate)} 个百分点（pp）</b></p>`,
      String.raw`每组的风险先乘该组在目标人群中的概率，再把两组相加。两种方案都使用同一套人群概率；风险之差的单位是概率差，乘100后显示为百分点（pp），并不是相对百分比变化。`,
      `这里算的是模型给出的总体量，不是某次样本估计。默认观测处理组风险${pct(d.observedRisk1)}、活性对照组风险${pct(d.observedRisk0)}之差为${f(100*d.naive)} pp，使用了另一套组别构成；它不等于上面的同一人群对比。`),
    'estimator-map': estimatorMap(errorData),
    'fit-error': figure('fit-error', '高估不同方案的风险，会使ATE向不同方向变化', '固定真实人群、四项真实风险和目标。下面两套拟合各自只估错一项；它们互不叠加，也没有改变处理分配。',
      `<div class="intro-error-baseline">共同真值：ATE = <strong>${f(100*errorData.target)} pp</strong>；基线组0占 <strong>${pct(errorData.truth.px[0])}</strong></div><div class="intro-risk-grid">${errorData.scenarios.map(row=>`<section class="intro-error-scenario" data-error-arm="${row.a}"><h4>只高估${row.a===1?'处理1':'对照'}风险</h4><p>基线组 ${row.x}：${pct(row.truthRisk)} → <strong>${pct(row.fittedRisk)}</strong></p><div class="intro-error-flow"><span>组内误差<br><b>+${f(100*errorData.riskError)} pp</b></span><span aria-hidden="true">↓</span><span>先乘人群权重 ${f(errorData.truth.px[row.x])}<br>再按ATE中的${row.a===1?'加号':'减号'}计入</span><span aria-hidden="true">↓</span><span>目标误差<br><b>${row.error>0?'+':''}${f(100*row.error)} pp</b></span></div><p>拟合方案风险：${pct(row.risk1)} − ${pct(row.risk0)}</p><strong class="intro-error-result">拟合ATE：${f(100*row.estimate)} pp</strong></section>`).join('')}</div>`,
      String.raw`$P$固定为真分布；每张卡片各有一套拟合分布$\widetilde P$，仅改变$Q(a,0)$的拟合值。目标误差是$\Psi(\widetilde P)-\Psi(P)$；先乘组0的权重，再由处理减对照决定符号。pp是百分点，图中没有相对百分比变化。`,
      '这是条件风险坐标误差的精确传递，不是完整ATE IF，也不是对重复抽样平均后的统计偏差。两例只改一项，所以没有不同输入误差相乘；多个机制一起估错时还须检查剩余项。'),
    'eif-role': figure('eif-role', '先研究目标怎样随分布变化，再解释估计误差', '下面是三层问题。第二层需要估计方法和剩余项条件，不能仅从第一层直接跳过去。',
      `<div class="intro-bridge"><section><small>① 分布层：IF要表示什么？</small><strong>合法记录权重稍变 → 目标在起点的变化率</strong><p>同一个观测记录函数，配合不同方向，读出各自的目标响应。</p></section><div class="bridge-arrow" aria-hidden="true">↓ 需要额外条件</div><section class="assumption-bridge"><small>② 抽样层：怎样进入估计误差？</small><strong>样本中各条记录的IF贡献取平均<br>＋ 需要足够小的剩余项</strong><p>这时函数的方差才进入主要抽样误差的尺度；任意代入估计并不自动满足。</p></section><div class="bridge-arrow" aria-hidden="true">↓ 下一步要比较</div><section><small>③ 效率层：怎样理解efficient？</small><strong>固定目标、统计模型与合适的估计方法类别<br>主要抽样波动还能减少吗？</strong><p>EIF在给定模型的影响函数中方差最小；通过第二层的桥梁，连接到一阶大样本效率下界。</p></section></div>`,
      String.raw`IF是influence function，输入可能的观测记录，输出目标相关的带符号贡献；EIF前面的E是efficient。第一层保持同一个目标规则$\Psi$，研究分布方向；第二层额外联系样本平均与估计误差；第三层比较给定模型内的一阶大样本波动。`,
      '此图是路线图，不是EIF存在性或效率的证明。IF不等于个体因果效应，不会修复未测混杂；效率下界也不保证一次小样本中某种方法总是更好。第5—8章将逐步建立各层条件。')
  };
}

export function renderChapter0Visuals(html) {
  const figures = chapter0Figures();
  return html.replace(/<div class="course-visual" data-visual="([a-z-]+)"><\/div>/g, (_,id) => {
    if (!Object.hasOwn(figures,id)) throw new Error(`Unknown chapter 0 visual: ${id}`);
    return figures[id];
  });
}
