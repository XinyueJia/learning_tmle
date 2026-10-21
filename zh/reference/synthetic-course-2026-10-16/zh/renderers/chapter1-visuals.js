import { chapter1VisualData } from '../src/chapter1-visual-data.js';
import { contaminate } from '../../shared/js/math.js';
import { renderInlineMath as math, renderFormulaRecall as recall } from '../../scripts/markdown.js';

const figureRecalls = {
  sample: String.raw`$Y=1$ 表示12个月内疾病进展或全因死亡，$Y=0$ 表示已确认12个月内无进展且存活。每组人数乘结局编码得到事件人数；相加后除以总人数200，得到全样本观察风险，不是药物A与B的因果比较。`,
  distribution: String.raw`$P$ 是原分布，$\Psi$ 是将分布映成均值的泛函（functional），输出 $\mu=\mathbb E_P[Y]$。左图柱高是概率；右图柱高是结局编码乘概率。因 $Y$ 只有0和1，右图相加恰好是事件风险，单位是概率。`,
  replacement: String.raw`$t=0.1$ 是替换的概率权重，$z=1$ 是选定的终点事件编码。每组保留原权重的90%，分别为37.8%与52.2%；再向 $Y=1$ 加入10%，得到37.8%与62.2%。条形按精确比例绘制，小数权重不四舍五入成人数或整格。`,
  mixture: String.raw`$P$ 是原分布，$P_t$ 是替换后的分布；$t$ 是新增比例，$1-t$ 是保留比例。$\delta_1$ 表示全部权重都放在Y=1的分布，所以 $(1-t)P$ 与 $t\delta_1$ 分别记保留组件和新增组件，两者相加才是完整的新分布。`,
  'mean-change': String.raw`$\mu$ 是原均值，$t$ 是替换比例，$z$ 是选定结局编码：移出贡献是 $t\mu$，加入贡献是 $tz$。新均值减原均值，就是加入贡献减去移出贡献；横轴与箭头增减量都以概率为单位。`,
  rate: String.raw`$t$ 是替换比例，$\Delta\mu$ 是新均值减原均值；分子 $\Delta\mu$ 以概率差为单位，分母 $t$ 是无量纲比例。$\Delta\mu/t$ 是每单位比例的变化率；本图固定选定结局编码和原分布，只缩小替换比例。`,
  general: String.raw`$z$ 是每张卡选定的结局编码，$t$ 是相同的替换比例，$\mu$ 是固定的原均值。$\mu-t\mu+tz$ 先减去旧贡献再加进新贡献；合并含 $t$ 的两项，就得到 $\mu+t(z-\mu)$，其中括号是选定结局编码减原均值。`,
  'rate-function': String.raw`$z$ 是每行选定的输入结局编码；原分布 $P$、原均值 $\mu$ 和替换比例 $t$ 都固定。每行的分子是新减旧的变化量 $\Delta\mu$，再除以同一个 $t$ 得到变化率；横向箭头表示输入与输出的对应关系。`,
  influence: String.raw`$D(z;P)$ 表示在原分布 $P$ 固定时，输入选定结局编码 $z$ 所得到的影响值，规则是 $z-\mu$。横轴是结局编码，箭头标出相对固定原均值 $\mu$ 的带符号距离；这个值是每单位比例的变化率，再乘替换比例 $t$ 才得到实际均值变化。`,
  'random-influence': String.raw`大写 $Y$ 是随机结局，小写 $z$ 是查表时选定的输入；$D(Y;P)=Y-\mu$ 表示把随机结局送进固定规则。原分布 $P$ 与原均值 $\mu$ 都不变，每一行输入的概率原样传给对应输出，随机的是会进入哪一行。`,
  'exercise-one': String.raw`本题的 $z$ 是选定接收新增权重的结局编码，$t$ 是题目给出的替换比例；$P$ 和 $P_t$ 分别是上下两条中的原、新概率。先将每个结局编码乘其新概率并相加，再减固定的原均值 $\mu$，得到以概率差为单位的变化量 $\Delta\mu$。`,
  'exercise-two': String.raw`本题固定原分布 $P$，按选定结局编码 $z$ 和替换比例 $t$ 算出新分布 $P_t$；新概率包含保留的旧份额与新增份额。每项“结局编码 × 新概率”是均值贡献，相加得到新均值，再减原均值 $\mu$ 才是带正负号的 $\Delta\mu$。`,
  centering: String.raw`$D(Y;P)$ 是减去原均值后得到的影响值，$\mathbb E_P$ 表示按原分布 $P$ 的概率加权后相加。每根条形画的是“概率 × 影响值”，所以平均为零指这些带符号贡献之和为零，并非每个 $D$ 都为零。`,
  'centering-proof': String.raw`$y$ 是各组结局编码，$\mu$ 是每组共用的固定原均值；先用分配律展开“概率 × $(y-\mu)$”，再分别加总“概率 × $y$”和“概率 × $\mu$”。前一项按均值定义等于 $\mu$，后一项提出固定的 $\mu$ 后乘以概率之和1，也等于 $\mu$；两项相减得到0。`,
  'reference-distribution': String.raw`$D(Y;P)$ 中的 $P$ 固定了原均值和函数规则；$\mathbb E_P$ 与 $\mathbb E_{P_t}$ 的下标分别说明用原概率或新概率加权。两栏都计算“概率 × 同一个旧影响值”，只改变权重，没有将 $D$ 中的原均值换成新均值，因此均值零的结论必须注明平均所用的分布。`,
  'survival-window': String.raw`横轴是从首次给药日算起的月份，虚线标出12个月。$Y=1$ 只要求终点在12个月内已发生；$Y=0$ 要有足够信息确认整个12个月内无进展且存活。末次已知无事件在8个月不能排除其后发生事件，所以该状态未知，不能编码成0。图中4、8、14个月是虚构示意，不是CSV中的日期。`,
  'survival-complement': String.raw`$\mu=\mathbb E_P[Y]$ 是12个月内进展或全因死亡的风险；$S(12)=P(Y=0)=\mathbb E_P[1-Y]$ 是12个月无进展且存活概率，完整结局下两者相加为1。$D_\mu(z;P)=z-\mu$ 是前面得到的影响函数（influence function）；$D_S(z;P)=(1-z)-S(12)=-(z-\mu)$。常数1不随分布改变，所以变化量与影响函数都只需反号。$z$ 是选定的0或1，$t$ 是替换权重；同一扰动下新风险加新补集概率仍为1。变化量以概率差计，乘100得到百分点。这里 $S(12)$ 不是第2章的路径得分。`,
  boundary: String.raw`本图固定选定结局编码 $z$，横坐标 $t$ 是无量纲路径参数；它决定新分布 $P_t$ 的各组概率。实心端点允许概率为零，空心端点要求每个概率严格为正；$0\le t\le1$ 中的 $t$ 才可直接读作普通替换比例。`,
};

const f = (n, places = 6) => String(Number(n.toFixed(places)));
const pct = p => `${f(100 * p)}%`;
const signed = n => { const rounded = Number(n.toFixed(6)); return `${rounded > 0 ? '+' : ''}${f(rounded)}`; };
const colour = ['#3976a8', '#a66520', '#287663'];
const badge = (value, i) => `<span class="score-badge score-${i}">Y=${value}</span>`;
const legend = values => `<div class="visual-legend">${values.map((v, i) => badge(v, i)).join('')}</div>`;
const figure = (id, number, title, lead, body, caption) => {
  if (!Object.hasOwn(figureRecalls, id)) throw new Error(`Missing chapter 1 formula recall: ${id}`);
  return `<figure class="step-visual" id="visual-${id}" data-visual-id="${id}" aria-labelledby="visual-title-${id}"><div class="visual-kicker">看图理解 · ${number}</div><h3 id="visual-title-${id}">${title}</h3><p class="visual-lead">${lead}</p>${body}${recall(figureRecalls[id])}<figcaption>${caption}</figcaption></figure>`;
};

function barChart(id, values, amounts, unit, max = 1) {
  const y = n => 154 - 114 * n / max;
  return `<svg class="visual-chart" viewBox="0 0 320 206" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${unit}柱形图</title><desc id="${id}-desc">${values.map((v, i) => `Y=${v}：${f(amounts[i])}${unit}`).join('；')}。柱形从零开始。</desc>${[0, .5, 1].map(r => `<line x1="40" x2="304" y1="${y(r * max)}" y2="${y(r * max)}" stroke="#d4ddd5"/><text x="32" y="${y(r * max) + 4}" text-anchor="end">${f(r * max)}</text>`).join('')}${values.map((v, i) => { const x = 64 + i * 80; return `<rect x="${x}" y="${y(amounts[i])}" width="44" height="${114 * amounts[i] / max}" fill="${colour[i]}" rx="3"/><text x="${x + 22}" y="${y(amounts[i]) - 10}" text-anchor="middle" class="chart-value">${f(amounts[i])}</text><text x="${x + 22}" y="178" text-anchor="middle">Y=${v}</text>`; }).join('')}<text x="172" y="201" text-anchor="middle">${unit}</text></svg>`;
}

function weightBar(values, probabilities, label) {
  return `<div class="probability-strip" role="img" aria-label="${label}：${values.map((v, i) => `Y=${v}占${pct(probabilities[i])}`).join('，')}">${values.map((v, i) => `<span class="score-${i}" style="width:${100 * probabilities[i]}%" aria-hidden="true">${pct(probabilities[i])}</span>`).join('')}</div>`;
}

function replacementLedger(data, stage) {
  const r = data.replacement, values = data.base.values;
  const amounts = stage === 'before' ? r.beforeUnits : stage === 'retained' ? r.retainedUnits : r.afterUnits;
  const mass = amounts.reduce((sum, amount) => sum + amount, 0) / r.totalUnits;
  return `<div data-weight-stage="${stage}" data-active-mass="${f(mass)}">${weightBar(values, amounts.map(amount => amount / r.totalUnits), '相同100%刻度的概率权重')}<div class="grid-totals">${values.map((y, i) => `<span>${badge(y, i)} <b>${f(amounts[i])}%</b></span>`).join('')}</div><p>总权重 ${pct(mass)}</p></div>`;
}

function arrows(id) {
  return `<defs><marker id="${id}-positive" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#287663" stroke-width="1.5"/></marker><marker id="${id}-negative" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#a66520" stroke-width="1.5"/></marker></defs>`;
}

function contributionStrip(id, values, contributions, total) {
  return `<div class="contribution-strip" role="img" aria-label="${id}：${values.map((v, i) => `Y=${v}组贡献${f(contributions[i])}`).join('，')}，总计${f(total)}。两类加权项的总和共用相同刻度。">${contributions.map((amount, i) => `<span class="score-${i}" style="width:${100 * amount / total}%" aria-hidden="true"></span>`).join('')}</div><div class="ledger-scale" aria-hidden="true"><span>0</span><span>${f(total / 2)}</span><span>${f(total)}</span></div>`;
}

export function chapter1Figures() {
  const d = chapter1VisualData(), { base: b, replacement: r, mixture: m } = d;
  const figures = {};
  figures.sample = figure('sample', '01', '同一份200人记录：先数结局，再算事件比例', '匿名药物A与活性对照B的合成RWS记录；这里合并两组，只问全样本12个月终点风险。每个人最多记一次事件。',
    `<div class="visual-cards binary-cards">${b.values.map((y, i) => `<div>${badge(y, i)}<p>${y === 0 ? '已确认12个月内无进展且存活' : '12个月内疾病进展或全因死亡'}</p><strong>${d.sample.counts[i]} 人</strong><p>${d.sample.counts[i]} × ${y} = ${d.sample.counts[i] * y} 名事件者</p></div>`).join('')}</div>${weightBar(b.values, d.sample.counts.map(n => n / d.sample.total), '固定200人样本的结局比例')}<p class="visual-result">${d.sample.events} / ${d.sample.total} = <b>${f(d.sample.mean)} = ${pct(d.sample.mean)}</b></p>`,
    '固定样本有84人Y=0、116人Y=1。经验比例碰巧等于教学总体的概率是本案例的构造；一般样本不必如此。观察风险不是A减B的因果风险差。');

  figures.distribution = figure('distribution', '02', '同一套权重，回答两个不同的问题', '第一张图看“多少概率落在这里”，第二张图看“这里给终点风险贡献多少”。二元结局的两张纵轴都用概率刻度，但柱形含义不同。',
    `${legend(b.values)}<div class="visual-pair"><section><h4>① 概率：所占的份额</h4>${barChart('probabilities', b.values, b.probabilities, '概率（无量纲）')}</section><section><h4>② 结局编码 × 概率：均值贡献</h4>${barChart('contributions', b.values, b.meanContributions, '均值贡献（概率）')}</section></div><p class="visual-result">${b.meanContributions.map(n => f(n)).join(' + ')} = <b>${f(b.mean)}</b></p><div class="symbolic-ledger"><span>输入：概率柱 ${math('P')}</span><span>计算：加权平均 ${math('\\Psi')}</span><span>输出：均值 ${math(`\\mu=${f(b.mean)}`)}</span></div>`,
    `Y=0也占${pct(b.probabilities[0])}概率，但它的均值贡献为0。总体均值要把两个贡献相加，不是把两个柱高再等权平均。`);

  figures.replacement = figure('replacement', '03', '精确移动概率权重：每组减去10%，再加到Y=1', '固定选择z=1、t=0.1。三条都以完整100%为刻度，长度直接表示概率；小数百分比不需要凑成整数格。',
    `${legend(b.values)}<div class="replacement-stages"><section><h4><span>1</span> 原分布</h4>${replacementLedger(d, 'before')}</section><section><h4><span>2</span> 每组保留90%</h4>${replacementLedger(d, 'retained')}<p>移出 ${r.removedUnits.map(n => `${f(n)}%`).join(' + ')} = ${pct(r.t)}。</p></section><section><h4><span>3</span> 向Y=1加入10%</h4>${replacementLedger(d, 'after')}</section></div><p class="visual-result">Y=1：${f(r.retainedUnits[1])}% + ${pct(r.t)} = <b>${pct(r.probabilities[1])}</b></p>`,
    '移动的是概率权重，不是在固定200人中改写若干个人。中间只含保留组件，总质量90%；最终重新得到总质量100%。37.8%与62.2%不四舍五入成整格。');

  figures.mixture = figure('mixture', '04', '把同一操作读成“两部分相加”', '整条长度一直代表100%概率。前两段来自保留的旧分布，橙框段来自全部为Y=1的新部分。',
    `${legend(b.values)}<div class="mixture-strip" role="img" aria-label="同一100%刻度：${b.values.map((v, i) => `保留Y=${v}的${f(r.retainedUnits[i])}%`).join('，')}，另向Y=${r.z}加入${pct(r.t)}">${b.values.map((v, i) => `<span class="score-${i}" style="width:${r.retainedUnits[i]}%">${f(r.retainedUnits[i])}%</span>`).join('')}<span class="score-${b.values.indexOf(r.z)} added" style="width:${100 * r.t}%">${pct(r.t)}</span></div><div class="visual-pair mixture-key"><div><strong>旧分布保留 ${pct(m.retainedMass)}</strong><p>两种结局编码都有留下：${r.retainedUnits.map(v => `${f(v)}%`).join(' + ')} = ${pct(m.retainedMass)}</p>${math('(1-t)P')}</div><div><strong>固定Y=1的新部分 ${pct(m.addedMass)}</strong><p>只有选中的结局编码接收新增权重。</p>${math('t\\delta_1')}</div></div><p class="visual-result">${math('P_t=(1-t)P+t\\delta_1')}<br>${pct(m.retainedMass)} + ${pct(m.addedMass)} = 100%</p>`,
    '保留的组件总质量是0.9；组件内部的相对比例仍为42%、58%。它与新增的0.1合起来，才是完整的新分布。');

  const lower = Math.floor((m.retainedMeanContribution - .05) * 10) / 10;
  const upper = Math.ceil((m.updatedMean + .05) * 10) / 10;
  const X = n => 32 + 292 * (n - lower) / (upper - lower);
  figures['mean-change'] = figure('mean-change', '05', '先减掉旧贡献，再补进新贡献', '从原均值中减去移出部分的贡献，再加上新增部分的贡献。移出的10%原来平均为0.58，新增部分全部为Y=1。',
    `<svg class="mean-ledger visual-chart" viewBox="0 0 360 210" role="img" aria-label="均值变化计算：原来${f(b.mean)}，移出${f(m.removedMeanContribution)}贡献后为${f(m.retainedMeanContribution)}，再加入${f(m.addedMeanContribution)}贡献后为${f(m.updatedMean)}。净增加${f(m.delta)}。">${arrows('ledger')}${Array.from({ length: Math.round((upper - lower) * 10) + 1 }, (_, i) => lower + i / 10).map(v => `<line x1="${X(v)}" x2="${X(v)}" y1="164" y2="171" stroke="#577069"/><text x="${X(v)}" y="189" text-anchor="middle">${f(v)}</text>`).join('')}<line x1="28" x2="328" y1="164" y2="164" stroke="#577069"/><line x1="${X(b.mean)}" x2="${X(m.retainedMeanContribution)}" y1="55" y2="55" stroke="#a66520" stroke-width="3" marker-end="url(#ledger-negative)"/><text x="${(X(b.mean) + X(m.retainedMeanContribution)) / 2}" y="36" text-anchor="middle">移出 ${f(m.removedMeanContribution)}</text><line x1="${X(m.retainedMeanContribution)}" x2="${X(m.updatedMean)}" y1="111" y2="111" stroke="#287663" stroke-width="3" marker-end="url(#ledger-positive)"/><text x="${(X(m.retainedMeanContribution) + X(m.updatedMean)) / 2}" y="94" text-anchor="middle">加入 ${f(m.addedMeanContribution)}</text>${[b.mean, m.retainedMeanContribution, m.updatedMean].map(v => `<line x1="${X(v)}" x2="${X(v)}" y1="119" y2="162" stroke="#a6b5a8" stroke-dasharray="3 3"/><circle cx="${X(v)}" cy="164" r="4" fill="#17342e"/><text x="${X(v)}" y="148" text-anchor="middle" class="chart-value">${f(v)}</text>`).join('')}<text x="180" y="208" text-anchor="middle">均值的局部刻度（概率）</text></svg><div class="visual-cards"><div>原来的终点风险<strong>${f(b.mean)}</strong></div><div>保留部分的贡献<strong>${f(m.retainedMeanContribution)}</strong></div><div>新终点风险<strong>${f(m.updatedMean)}</strong></div></div><p class="visual-result">${f(b.mean)} − ${f(m.removedMeanContribution)} + ${f(m.addedMeanContribution)} = <b>${f(m.updatedMean)}</b><br>净变化 ${f(m.addedMeanContribution)} − ${f(m.removedMeanContribution)} = <b>+${f(m.delta)}</b></p>`,
    '图中0.522是保留组件对整个人群均值的贡献；把保留组件单独归一化后，其内部均值仍是0.58。箭头表示均值贡献的变化。');

  figures.rate = figure('rate', '06', '步长缩小，变化量也按同一倍数缩小', '沿着“新增Y=1”这同一个方向。把每行先读成一次输入→输出，再比较最后的变化率。',
    `<div class="rate-paths">${d.rates.map(row => `<div class="rate-path"><div><small>替换比例</small><strong>${f(row.t)} <span>（${pct(row.t)}）</span></strong><div class="rate-track" aria-hidden="true"><i style="width:${100 * row.t / r.t}%"></i></div></div><span class="flow-arrow" aria-hidden="true">→</span><div><small>均值实际增加</small><strong>+${f(row.delta)}</strong></div><span class="flow-arrow" aria-hidden="true">→</span><div class="rate-answer"><small>变化量 ÷ 步长</small>${math(`\\frac{${f(row.delta)}}{${f(row.t)}}=${f(row.rate)}`)}</div></div>`).join('')}</div><p class="visual-result">${math('\\Delta\\mu=t\\times0.42')}<br>变化量会缩小，变化率始终是 <b>0.42 概率差 / 单位比例</b>。</p>`,
    '蓝条只比较三次替换比例的大小，用同一横向尺度。这里不再使用整格计数：1%或0.1%的路径需要小数权重，不能用100个整格四舍五入。');

  figures.general = figure('general', '07', '换一个目标结局编码，新增权重只去一个地方', `保留部分完全相同，仍为${r.retainedUnits.map(v => `${f(v)}%`).join('、')}。下面两张卡片分别选不同的目标结局编码，替换比例都为${pct(r.t)}。`,
    `<div class="visual-cards binary-cards destinations">${b.values.map((z, selected) => { const probabilities = contaminate(b.probabilities, selected, r.t); return `<div><h4>选择 ${math(`z=${z}`)}</h4>${b.values.map((value, i) => `<p class="destination-row ${i === selected ? 'selected' : ''}">${badge(value, i)}<span>${f(r.retainedUnits[i])}% + ${i === selected ? pct(r.t) : '0%'}<b>= ${pct(probabilities[i])}</b></span><small>开关 ${i === selected ? 1 : 0}</small></p>`).join('')}</div>`; }).join('')}</div><div class="symbolic-ledger"><span>原均值 ${math('\\mu')}</span><span>− 移出 ${math('t\\mu')}</span><span>+ 加入 ${math('tz')}</span></div><p class="visual-result">${math('\\mu-t\\mu+tz=\\mu+t(z-\\mu)')}</p>`,
    '“开关1”表示这一行就是选定的结局编码，所以加上t；“开关0”表示不是这一行，所以加0。它就是下一条公式中的指示符。这里只在已有的0、1中选择。');

  figures['rate-function'] = figure('rate-function', '08a', '把两次变化率并排，得到一张输入与输出的查表', `原均值固定为${f(b.mean)}，替换比例都取${pct(d.functionMap.t)}。每行只改变选定结局编码，先重算新权重下的均值，再除以同一个步长。`,
    `<div class="function-journeys">${d.functionMap.rows.map((row, i) => `<section class="function-journey" data-z="${row.z}" data-rate="${f(row.rate)}"><h4>输入 ${math(`z=${row.z}`)} ${badge(row.z, i)}</h4><div class="journey-calculation"><div><small>原均值 → 新均值（概率）</small><strong>${f(b.mean)} → ${f(row.mean)}</strong></div><span class="flow-arrow" aria-hidden="true">→</span><div><small>新减旧，得到变化量（概率差）</small><strong>${f(row.mean)} − ${f(b.mean)} = ${signed(row.delta)}</strong></div></div><div class="journey-output"><small>再除以替换比例 ${f(d.functionMap.t)}</small><strong>${math(`\\frac{${f(row.delta)}}{${f(d.functionMap.t)}}=${f(row.rate)}`)}</strong><span>变化率（概率差 / 单位比例）</span></div></section>`).join('')}</div><div class="lookup-summary" aria-label="两个结局编码对应两个变化率">${d.functionMap.rows.map(row => `<span>${math(`${row.z}\\ \\longmapsto\\ ${f(row.rate)}`)}</span>`).join('')}</div>`,
    '表中每行是一个单独的替换方向，两行并没有同时实施。这里0.522是选Y=0时完整新分布的均值，与前图保留组件的0.522贡献同值但含义不同。固定原分布后，输入一个结局编码就有一个确定的变化率；下一步给整张对应表命名。');

  const axis = v => 34 + 286 * v / Math.max(...b.values), muX = axis(b.mean);
  figures.influence = figure('influence', '08b', '同一个规则：每个结局编码减去固定的原均值', `竖虚线固定在原均值${f(b.mean)}。向左是负值，向右是正值；每个箭头从均值出发。`,
    `<svg class="visual-chart influence-axis" viewBox="0 0 360 224" role="img" aria-label="从均值${f(b.mean)}到各结局编码的带符号距离：${d.directions.map(row => `z=${row.z}为${signed(row.d)}`).join('，')}。这些是变化率，不是一次替换后的均值变化。">${arrows('influence')}<line x1="${muX}" x2="${muX}" y1="22" y2="186" stroke="#577069" stroke-dasharray="4 4"/><text x="${muX}" y="15" text-anchor="middle">μ = ${f(b.mean)}</text>${d.directions.map(({ z, d: direction }, i) => { const y = 52 + 51 * i; return `<line x1="${muX}" x2="${axis(z)}" y1="${y}" y2="${y}" stroke="${direction < 0 ? '#a66520' : '#287663'}" stroke-width="3" marker-end="url(#influence-${direction < 0 ? 'negative' : 'positive'})"/><circle cx="${axis(z)}" cy="${y}" r="4" fill="${colour[i]}"/><text x="${(muX + axis(z)) / 2}" y="${y - 12}" text-anchor="middle" class="chart-value">${signed(direction)}</text><text x="${axis(z)}" y="${y + 20}" text-anchor="middle">z=${z}</text>`; }).join('')}<line x1="32" x2="326" y1="193" y2="193" stroke="#577069"/><text x="180" y="218" text-anchor="middle">结局编码刻度；箭头值为每单位比例的变化率</text></svg><p class="visual-result">选Y=1：变化率 <b>+${f(r.z - b.mean)}</b>，替换${pct(r.t)}时实际变化才是 <b>+${f(m.delta)}</b>。</p>`,
    `每个可能的${math('z')}对应一个值，合起来才叫函数${math('D(z;P)')}。它描述分布的方向敏感性，不能读作个人的结局编码变化或个人处理效应。`);

  figures['random-influence'] = figure('random-influence', '08c', '把随机结局送进同一条规则，概率沿着箭头传过去', `两行都减去固定的${f(b.mean)}。这里计算一个新数值，没有改变原来的结局状态或各组概率。`,
    `<div class="random-map">${d.randomInfluence.rows.map((row, i) => `<section class="random-map-row" data-y="${row.y}" data-d="${f(row.d)}" data-probability="${f(row.probability)}"><div class="map-input score-${i}"><small>原结局Y</small><strong>${math(`Y=${row.y}`)}</strong><span>概率 ${pct(row.probability)}</span></div><div class="map-rule"><span aria-hidden="true">→</span><small>减去 ${f(b.mean)}</small><span aria-hidden="true">→</span></div><div class="map-output score-${i}"><small>算出的影响值</small><strong>${signed(row.d)}</strong><span>概率仍是 ${pct(row.probability)}</span></div></section>`).join('')}</div><p class="visual-result">输入是 ${math('Y')}，输出是 ${math('D(Y;P)=Y-\\mu')}。<br>两种输出的概率仍为 ${b.probabilities.map(pct).join('、')}。</p>`,
    '小写z表示我们选定一个输入来查表；大写Y表示尚未观察到的随机结局。函数规则和原均值固定，随机的是这次会进入哪一行。输出不是某个人被干预后的结局编码变化。');

  for (const [i, example] of d.exercises.entries()) {
    const id = i === 0 ? 'exercise-one' : 'exercise-two';
    figures[id] = figure(id, `练习${i + 1}`, `先算新权重，再核对终点风险：z=${example.z} / ${pct(example.t)}`, '两条长度都代表完整的100%概率；颜色与结局编码含义不变。',
      `${legend(b.values)}<div class="exercise-bars"><div><strong>原权重</strong>${weightBar(b.values, b.probabilities, '原权重')}</div><div><strong>新权重</strong>${weightBar(b.values, example.probabilities, '新权重')}</div></div><p class="visual-result">均值贡献 ${example.meanContributions.map(n => f(n)).join(' + ')} = <b>${f(example.mean)}</b><br>相对原均值：<b>${signed(example.delta)}</b></p>`,
      `新增的${pct(example.t)}全部去z=${example.z}；z=${example.z}也保留了原来未被替换的部分，所以它的新概率不必等于${pct(example.t)}。`);
  }

  const cX = v => 146 + v * 312;
  figures.centering = figure('centering', '08d', '平均为零：先乘各自的概率，再把正负贡献相加', '两个影响值都不为零；下方条形画的是“概率×影响值”，长度以绝对值比较，方向保留正负号。',
    `<div class="centering-rows">${b.values.map((z, i) => `<div class="centering-row">${badge(z, i)}<span>${math(`${f(b.probabilities[i])}\\times(${f(d.centering.directions[i])})`)}</span><strong>${signed(d.centering.weightedContributions[i])}</strong></div>`).join('')}</div><svg class="visual-chart" viewBox="0 0 360 154" role="img" aria-label="概率加权贡献：${b.values.map((v, i) => `Y=${v}为${signed(d.centering.weightedContributions[i])}`).join('，')}。总和${f(d.centering.total)}。"><line x1="146" x2="146" y1="8" y2="129" stroke="#577069" stroke-dasharray="4 3"/>${d.centering.weightedContributions.map((v, i) => { const y = 14 + 35 * i; return `<rect x="${Math.min(cX(v), cX(0))}" y="${y}" width="${Math.abs(v) * 312}" height="21" rx="3" fill="${v < 0 ? '#a66520' : '#287663'}"/><text x="${cX(v) + (v < 0 ? -6 : 6)}" y="${y + 16}" text-anchor="${v < 0 ? 'end' : 'start'}">${signed(v)}</text>`; }).join('')}<text x="146" y="147" text-anchor="middle">0</text></svg><p class="visual-result">${d.centering.weightedContributions.map(n => f(n)).join(' + ')} = <b>${f(d.centering.total)}</b><br>${math('\\mathbb E_P[D(Y;P)]=0')}</p>`,
    `正负贡献的抵消使用原分布${math('P')}，须先给两个${math('D')}值分别乘上对应的概率。改用新权重时，一般不再为零。`);

  const proof = d.centeringProof;
  figures['centering-proof'] = figure('centering-proof', '08e', '为什么恰好抵消？展开乘法，再分别求和', '用分配律展开后，分别计算结局加权项与均值加权项的和，再将两者相减。下图分别展示这两项，长度共用同一概率刻度。',
    `${legend(b.values)}<div class="visual-pair centering-ledgers"><section><h4>① 加权原结局Y</h4>${contributionStrip('加权原结局Y', b.values, proof.rows.map(row => row.weightedY), proof.meanTotal)}<div class="ledger-calculations">${proof.rows.map((row, i) => `<div>${badge(row.y, i)}<span>${f(row.probability)} × ${row.y}</span><b>${f(row.weightedY)}</b></div>`).join('')}</div><p class="ledger-total">合计 <strong>${f(proof.meanTotal)}</strong></p></section><section><h4>② 加权固定基准 ${f(b.mean)}</h4>${contributionStrip('加权固定基准', b.values, proof.rows.map(row => row.weightedBaseline), proof.meanTotal)}<div class="ledger-calculations">${proof.rows.map((row, i) => `<div>${badge(row.y, i)}<span>${f(row.probability)} × ${f(b.mean)}</span><b>${f(row.weightedBaseline)}</b></div>`).join('')}</div><p class="ledger-total">合计 <strong>${f(proof.baselineTotal)}</strong></p></section></div><div class="normalisation-ledger"><span>概率总和</span><strong>${b.probabilities.map(n => f(n)).join(' + ')} = ${f(proof.mass)}</strong><span>均值加权项的和为 ${f(b.mean)} × ${f(proof.mass)} = ${f(proof.baselineTotal)}</span></div><p class="visual-result">影响值的加权平均 = 结局加权项之和 − 均值加权项之和<br>${f(proof.meanTotal)} − ${f(proof.baselineTotal)} = <b>${f(proof.difference)}</b></p>`,
    '结局加权项之和等于原均值；均值加权项之和可提出固定均值，再乘以概率之和1，仍等于原均值。两项相减才得到0。Y=0组的结局加权项为0，但它仍占42%概率，均值加权项不能漏掉这一组。');

  const reference = d.referenceDistribution;
  figures['reference-distribution'] = figure('reference-distribution', '08f', '函数保持原样，只换平均时使用的概率', `固定两种影响值 ${reference.rows.map(row => signed(row.d)).join('、')}，仍减去原均值${f(reference.referenceMean)}。新权重来自选z=${reference.z}、替换${pct(reference.t)}后的分布。`,
    `${legend(b.values)}<div class="visual-pair reference-panels">${[['original', '按原分布 P', 'originalProbability', 'originalContribution', reference.originalTotal], ['updated', '按扰动分布 Pₜ', 'updatedProbability', 'updatedContribution', reference.updatedTotal]].map(([id, label, probabilityKey, contributionKey, total]) => `<section data-reference-average="${id}" data-total="${f(total)}"><h4>${label}</h4>${weightBar(b.values, reference.rows.map(row => row[probabilityKey]), label)}<div class="reference-calculations">${reference.rows.map((row, i) => `<div>${badge(row.y, i)}<span>${math(`${f(row[probabilityKey])}\\times(${f(row.d)})`)}</span><b>${signed(row[contributionKey])}</b></div>`).join('')}</div><p class="ledger-total">相加得到 <strong>${signed(total)}</strong></p></section>`).join('')}</div><p class="visual-result">${math('\\mathbb E_P[D(Y;P)]=0')}<br>${math(`\\mathbb E_{P_t}[D(Y;P)]=${f(reference.updatedTotal)}`)}</p>`,
    `两次计算使用同一个原函数D(Y;P)，改变的是权重；并未将基准换成新均值${f(reference.updatedMean)}。因此“均值零”一定要说清在哪个分布下平均。本图数值是总体加权计算，不保证一份随机样本中旧函数值的平均也恰为零。`);

  const left = d.boundary.minStrict, right = d.boundary.maxStrict, bx = v => 34 + 292 * (v - left) / (right - left);
  figures.boundary = figure('boundary', '技术补图', '端点能用吗？先说明要求哪种概率条件', '仍取z=1。上轨允许某个权重为0，下轨要求每个权重严格大于0。',
    `<svg class="visual-chart" viewBox="0 0 360 200" role="img" aria-label="概率非负允许闭区间负29/21到1；概率全正只允许开区间负29/21到1；0到1有替换比例解释。"><text x="22" y="22">概率非负：包括端点</text><line x1="34" x2="326" y1="46" y2="46" stroke="#287663" stroke-width="5"/><circle cx="34" cy="46" r="5" fill="#287663"/><circle cx="326" cy="46" r="5" fill="#287663"/><text x="22" y="93">概率全正：不含端点</text><line x1="34" x2="326" y1="119" y2="119" stroke="#287663" stroke-width="5"/><circle cx="34" cy="119" r="5" fill="#fffef9" stroke="#287663" stroke-width="2"/><circle cx="326" cy="119" r="5" fill="#fffef9" stroke="#287663" stroke-width="2"/>${[left, 0, right].map(v => `<line x1="${bx(v)}" x2="${bx(v)}" y1="137" y2="147" stroke="#577069"/><text x="${bx(v)}" y="166" text-anchor="middle">${v === left ? '−29/21' : f(v)}</text>`).join('')}<text x="180" y="194" text-anchor="middle">路径参数 t；负值仅作局部反方向</text></svg><p class="visual-result">严格正概率：${math('-29/21<t<1')}<br>普通替换解释：${math('0\\le t\\le1')}</p>`,
    '左端点使Y=1的概率为0；右端点只剩Y=1。负t在合法区间内能计算，但不能解释为替换负数个人。');

  const window = d.survivalWindow, monthX = month => 36 + month * 19;
  const windowLabel = row => row.id === 'event' ? '4个月发生终点 → Y=1' : row.id === 'event-free' ? '已确认至14个月无事件 → Y=0' : '8个月后状态未知 → 不能填0';
  figures['survival-window'] = figure('survival-window', '终点时间窗', '先确定随访信息够不够，再编码0或1', '虚构时间线示意（schematic）：三行用于说明编码规则，不代表CSV中的三名患者；合成CSV只保存结局编码，没有事件日期或随访日期。',
    `<svg class="visual-chart" viewBox="0 0 360 326" role="img" aria-labelledby="window-title window-desc" data-schematic="true"><title id="window-title">12个月终点编码示意</title><desc id="window-desc">首次给药为0个月。4个月发生疾病进展或全因死亡编码1；确认14个月仍无进展且存活编码0；末次8个月无事件且其后未知不能编码0。</desc><text x="36" y="18">首次给药</text><text x="${monthX(window.month)}" y="18" text-anchor="middle">12个月</text><line x1="${monthX(window.month)}" x2="${monthX(window.month)}" y1="28" y2="275" stroke="#577069" stroke-dasharray="5 4"/>${window.rows.map((row, i) => { const y = 70 + i * 85, last = monthX(row.lastSeenMonth); return `<text x="18" y="${y - 20}">${windowLabel(row)}</text><line x1="36" x2="302" y1="${y}" y2="${y}" stroke="#d4ddd5" stroke-width="3"/><line x1="36" x2="${last}" y1="${y}" y2="${y}" stroke="${colour[i]}" stroke-width="5"/><circle cx="36" cy="${y}" r="4" fill="${colour[i]}"/>${row.eventMonth !== null ? `<path d="M${last - 5} ${y - 6}L${last + 5} ${y + 6}M${last + 5} ${y - 6}L${last - 5} ${y + 6}" stroke="${colour[i]}" stroke-width="3"/>` : `<circle cx="${last}" cy="${y}" r="5" fill="#fffef9" stroke="${colour[i]}" stroke-width="2"/>`}${row.y === null ? `<line x1="${last + 7}" x2="302" y1="${y}" y2="${y}" stroke="${colour[i]}" stroke-dasharray="4 4"/><text x="302" y="${y - 8}" text-anchor="end">未知</text>` : ''}`; }).join('')}${[0, 4, 8, 12, 14].map(month => `<line x1="${monthX(month)}" x2="${monthX(month)}" y1="280" y2="287" stroke="#577069"/><text x="${monthX(month)}" y="305" text-anchor="middle">${month}</text>`).join('')}<text x="180" y="325" text-anchor="middle">首次给药后的月份</text></svg>`,
    'Y=1包括进展或全因死亡，且每人最多计一次；死亡已属于终点。第三行仅提醒真实失访的观测缺口，当前完整结局教学表没有将这类未知状态填成0。');

  const survival = d.survival;
  figures['survival-complement'] = figure('survival-complement', '同一终点的补集', '风险与无进展生存概率：换成补集，影响值反号', '仍用同一批记录与同一个12个月时间窗。已知完整结局时，事件发生与无进展且存活恰好覆盖所有人。',
    `<div class="visual-cards binary-cards"><div><h4>事件风险</h4>${math('\\mu=\\mathbb E_P[Y]')}<strong>${f(survival.risk)} = ${pct(survival.risk)}</strong><p>${d.sample.events} / ${d.sample.total} 名事件者</p></div><div><h4>12个月无进展生存概率</h4>${math('S(12)=\\mathbb E_P[1-Y]')}<strong>${f(survival.eventFree)} = ${pct(survival.eventFree)}</strong><p>${d.sample.counts[0]} / ${d.sample.total} 已确认无事件</p></div></div>${weightBar(b.values, b.probabilities, '风险与其补集')}<p class="visual-result">${math('S(12)=1-\\mu')}<br>${math(`1-${f(survival.risk)}=${f(survival.eventFree)}`)}</p><div class="table-wrap"><table><thead><tr><th>结局z</th><th>风险影响值 ${math('D_\\mu=z-\\mu')}</th><th>补集影响值 ${math('D_S=(1-z)-S(12)')}</th></tr></thead><tbody>${survival.rows.map(row => `<tr data-survival-y="${row.y}" data-risk-d="${f(row.riskD)}" data-survival-d="${f(row.eventFreeD)}"><td>${row.y}</td><td>${signed(row.riskD)}</td><td>${signed(row.eventFreeD)}</td></tr>`).join('')}</tbody></table></div><p class="visual-result">${math('D_S(z;P)=-D_\\mu(z;P)')}<br>仍选z=1、t=${f(r.t)}：风险 ${f(survival.risk)} → ${f(survival.updatedRisk)}（${signed(survival.riskDelta)}）；<br>无进展生存 ${f(survival.eventFree)} → ${f(survival.updatedEventFree)}（${signed(survival.eventFreeDelta)}）。</p>`,
    'S(12)只描述一个预定时点的无进展且存活概率，没有从这些二元记录估计整条生存曲线、Kaplan–Meier或风险比。沿本图概率扰动，事件风险增加4.2个百分点，对应无进展生存概率减少4.2个百分点；这不是给药干预效应。');

  return figures;
}

export function renderChapter1Visuals(html) {
  const figures = chapter1Figures();
  return html.replace(/<div class="course-visual" data-visual="([a-z-]+)"><\/div>/g, (_, id) => {
    if (!Object.hasOwn(figures, id)) throw new Error(`Unknown chapter 1 visual: ${id}`);
    return figures[id];
  });
}
