import { CASE_CONTEXT as context } from './case-context.js';
import {
  CASE_COUNTS, caseData, caseAt, solveCase, countsCsv, recordsCsv,
  caseMeanDirection, caseDirections, caseProjection, caseEmpiricalMoments,
} from '../../shared/js/case-study.js';

const f = (v, digits = 6) => Math.abs(v) < .5 * 10 ** -digits ? (0).toFixed(digits) : v.toFixed(digits);
const pp = v => `${f(100 * v, 3)} pp`;
const pct = v => `${f(100 * v, 2)}%`;
const key = c => `(${c.x},${c.a},${c.y})`;
const metrics = rows => `<div class="metrics">${rows.map(([label, value, unit = '']) => `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-unit">${unit}</div></div>`).join('')}</div>`;
const table = (label, heads, rows) => `<p class="table-hint">表格可横向滚动；聚焦后可用左右键。</p><div class="table-wrap" tabindex="0" role="region" aria-label="${label}"><table><caption>${label}</caption><thead><tr>${heads.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const titles = [
  '固定案例 · 上市后RWS合成队列', '案例第1步 · 二元结局均值与影响值',
  '案例第2步 · 八格中的均值方向配对', '案例第3步 · 从人数和事件拟合四组',
  '案例第4步 · 组装初始拟合梯度', '案例第5步 · 检查完整的一组方向',
  '案例第6步 · 已知处理概率的假设投影', '案例第7步 · 经验方差与标准误演示',
  '案例第8步 · 按计数亲手完成 targeting',
];
const defaults = () => ({ y: 1, index: 3, t: .01, reveal: false, coefficient: 1,
  epsilon: 0, lo: -1, hi: 1, steps: 0, solved: false });

function renderChapter(chapter, state, rows) {
  const data = caseData(rows);
  if (chapter === 0) return `<p>这不是真实世界患者资料，而是从全书唯一教学模型生成并固定的${data.n}条合成记录。各章读取同一张频数表，不会重新抽样；算法只读取计数。</p>`
    + metrics([['固定记录数', data.n, '人；记录CSV每行一人'], ['联合单元数', data.cells.length, '按 X、A、Y 排列']])
    + table('八格频数表', ['X', 'A', 'Y', '人数 n'], data.cells.map(c => [c.x, c.a, c.y, c.n]))
    + `<p><a class="case-download" download="rws-counts.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(countsCsv(rows))}">下载八行计数CSV</a> · <a class="case-download" download="rws-records.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(recordsCsv(rows))}">下载${data.n}行记录CSV</a></p><p>后面将从计数、初始拟合和目标方向开始，逐步完成一次TMLE；这里先保留原始输入。</p>`;
  if (chapter === 1) {
    const events = data.cells.reduce((s, c) => s + c.n * c.y, 0);
    const direction = caseMeanDirection(state.y === 1 ? 1 : 0, state.t, rows);
    return metrics([['发生终点事件人数 / 总人数', `${events} / ${data.n}`], ['经验终点事件风险', pct(data.marginalRisk), '样本均值，目标暂为终点事件风险']])
      + table('同一数据的二元结局汇总', ['Y', '人数', '经验概率'], [0, 1].map(y => {
        const n = data.cells.filter(c => c.y === y).reduce((s, c) => s + c.n, 0);
        return [y, n, f(n / data.n)];
      })) + `<p>先预测：向结局Y=${state.y}增加一点权重，均值会上升还是下降？影响值与这次实际变化应当分别是多少？</p>`
      + (state.reveal ? metrics([['二元均值影响值 Y − 原均值', f(direction.derivative), '每单位替换比例的变化率'], ['当前实际均值变化', pp(direction.delta), '变化率乘步长'], ['替换后经验均值', pct(direction.updatedRisk)]]) : '<p>先记录预测，再按“核对影响值”；此处不提前显示后面ATE与TMLE的结果。</p>');
  }
  if (chapter === 2) {
    const d = caseMeanDirection(state.index, state.t, rows);
    return `<p>选定格${key(d.cells[state.index])}；位置t决定走多远，h与S在原经验分布处固定。目标仍是二元结局均值，不是ATE。</p>`
      + metrics([['原经验均值', f(d.marginalRisk)], ['当前精确均值', f(d.updatedRisk)], ['起点导数', f(d.derivative)], ['概率加权配对', f(d.pairing)], ['有限步长差商', d.quotient === null ? 't=0未定义' : f(d.quotient)]])
      + table('同一八格表的均值配对', ['X,A,Y', 'n', '原概率 p', '新概率', '方向 h', '相对变化 S', '均值影响 D', '贡献 pDS'], d.cells.map(c => [key(c), c.n, f(c.p), f(c.updatedP), f(c.h), f(c.S), f(c.D), f(c.contribution)]))
      + '<p>h的普通和为零；S与D各自按原经验概率平均为零。每格D不必为零，贡献相加才得到当前方向导数。</p>';
  }
  if (chapter === 3) return `<p>初始结局回归只按A分两臂，故同一处理臂的两个X组使用同一个拟合风险。这是刻意简化的初始模型，不是四组观察风险本身。</p>`
    + table('从样本计数拟合', ['X', 'A', '人数', '终点事件人数', '观察风险', '经验人群概率', '经验处理1概率', '初始拟合风险'], data.groups.map(g => [g.x, g.a, g.n, g.events, f(g.qObserved), f(g.px), f(g.gHat), f(g.initialQ)]))
    + metrics([['仅按处理拟合的初始风险差', pp(data.initialEstimate)], ['未经调整两臂差', pp(data.observedDifference)]])
    + '<p>人数、事件数、经验处理概率与初始拟合都只由这份计数表计算。下一步将检查初始拟合留下多少目标相关残差。</p>';
  if (chapter === 4) {
    const at = caseAt(0, rows);
    return `<p>H在启动药物A时为启动A概率的倒数，在启动药物B时为负的启动B概率倒数。每组的加权残差总和再除以总人数，成为每条记录平均的结局残差贡献。</p>`
      + table('四组H与初始残差', ['X', 'A', 'H', '初始风险', '人数×初始风险', '终点事件人数−预测总数', 'H×残差总和', '除以总人数后的贡献'], at.groups.map(g => [g.x, g.a, f(g.h), f(g.initialQ), f(g.predictedEvents), f(g.residualTotal), f(g.weightedResidual), f(g.scoreContribution)]))
      + metrics([['初始目标估计', pp(at.estimate)], ['初始拟合梯度的样本平均', f(at.eifMean), '每条记录平均，并非总和'], ['加权结局残差的样本平均', f(at.score), '按样本人数加权']])
      + table('初始拟合下八格影响值', ['X,A,Y', 'n', 'D', '经验概率×D'], at.eifRows.map(c => [key(c), c.n, f(c.D), f(c.p * c.D)]))
      + '<p>均值不为零暴露了初始拟合的目标相关残差；它不是总体无偏性的检查。这里暂不求更新参数。</p>';
  }
  if (chapter === 5) {
    const d = caseDirections(rows);
    const directionTable = (label, list) => table(label, ['方向', '经验score均值', '直接中心差分', '梯度配对', '差分−配对'], list.map(r => [r.label, f(r.scoreMean), f(r.numerical), f(r.paired), r.error.toExponential(2)]));
    return '<p>这里验证的是由四组观察风险组成的饱和经验分布目标，以及它自己的梯度；不是把第4步的初始拟合函数冒充正确导数。中心差分从扰动后的八格概率重新计算ATE，步长为10⁻⁷。</p>'
      + directionTable('八个点替换方向：全部逐行验证', d.points)
      + directionTable('七个独立对比方向：向一格加质量、从参考格减同样质量', d.contrasts)
      + '<p>八个点方向只有七个独立自由度。七个对比方向覆盖有限表内的七维合法方向；数值核对仍须与本章的一般代数论证一起读，单个方向相符并不充分。后续targeting只沿一个指定结局方向更新，并非重新逐个拟合这十五条路径。</p>';
  }
  if (chapter === 6) {
    const d = caseProjection(rows, state.coefficient);
    return '<p>只在本练习中，假设同一表的处理概率由设计已知，允许X与四项结局风险变化，处理方向不在模型内。最终案例仍使用计数估计的处理概率；此练习没有替换最终算法。</p>'
      + metrics([['假设模型的方向维数', d.dimension, '人群1维＋结局4维'], ['投影与饱和经验梯度最大差', d.maxError.toExponential(2)], ['候选函数经验二阶矩', f(d.candidateSecondMoment)], ['投影函数经验二阶矩', f(d.projectedSecondMoment)]])
      + table('把额外处理方向分量投出', ['X,A,Y', '原经验梯度', '处理方向分量 A−g', '待投影候选函数', '已知g模型内投影', '移除部分'], d.cells.map((c, i) => [key(c), f(d.D[i]), f(d.treatmentPart[i]), f(d.candidate[i]), f(d.projected[i]), f(d.removed[i])]))
      + '<p>待投影候选函数是在经验梯度上加指定倍数的处理方向分量；它不是未知g全模型中已经验证的梯度。投影移除了此分量。本例ATE的经验梯度本身已与处理方向正交，所以投影后回到它；“已知g”并不保证效率界一定改变。</p>';
  }
  if (chapter === 7) {
    const at = caseAt(0, rows);
    const saturated = caseEmpiricalMoments(rows);
    return '<p>本台面使用第4步的初始拟合函数，保留它尚未归零的经验平均。先按计数算平均、二阶矩，再减去平均平方得到经验中心方差。它与原总体实验中饱和组内风险所定义的函数不同。</p>'
      + table('初始拟合函数的经验矩', ['X,A,Y', 'n', 'D', 'pD', 'pD²', 'p×(D−平均D)²'], at.eifRows.map(c => [key(c), c.n, f(c.D), f(c.p * c.D), f(c.p * c.D ** 2), f(c.p * (c.D - at.eifMean) ** 2)]))
      + metrics([['经验平均', f(at.eifMean)], ['经验二阶矩', f(at.eifSecondMoment)], ['经验中心方差', f(at.eifVariance)], ['初始函数的经验SE演示', pp(at.se), '中心方差除以样本量后开方']])
      + '<h4>另一套函数：以四组观察风险为基点的梯度</h4>'
      + metrics([['饱和经验梯度的平均', f(saturated.eifMean)], ['其经验二阶矩', f(saturated.eifSecondMoment)], ['其经验中心方差', f(saturated.eifVariance)], ['其经验SE计算', pp(saturated.se), '当前表的代入计算']])
      + '<p>这不是把初始函数中心化后得到的同一个函数，而是换成了饱和经验分布处的梯度。两者条件风险不同；方差数字不能不说明函数和分布就互换。</p>'
      + '<p>这里不是已知真分布的效率界，也不是本次估计值的实际误差。初始结局回归存在结构误设，这个SE演示不保证可靠推断；第8步更新函数后还须重新计算，不能沿用旧值。不据此显示置信区间。</p>';
  }
  const at = caseAt(state.epsilon, rows);
  const left = caseAt(state.lo, rows).score, right = caseAt(state.hi, rows).score;
  return '<p>只按样本人数与事件数更新四组预测：保留经验人群构成和处理概率，在每组初始logit上加ε×H。先手填ε观察score，再点击二分一步；自动求解只在明确点击时运行。</p>'
    + metrics([['当前 ε', f(at.epsilon, 12)], ['当前每记录平均score', f(at.score, 12)], ['当前风险差', pp(at.estimate)], ['当前拟合梯度的经验平均', f(at.eifMean, 12)], ['平均log likelihood', f(at.logLikelihood, 9)], ['score对ε的斜率', f(at.slope, 9)]])
    + table('四组offset、预测与score账本', ['X', 'A', 'n', '事件数', '经验g', 'H', '初始offset', '当前更新Q', '预测事件总数', '事件−预测', 'H×残差', 'score贡献'], at.groups.map(g => [g.x, g.a, g.n, g.events, f(g.gHat), f(g.h), f(g.offset), f(g.qUpdated, 9), f(g.predictedEvents), f(g.residualTotal), f(g.weightedResidual), f(g.scoreContribution, 9)]))
    + `<p>手动二分保留区间：[${f(state.lo, 9)}, ${f(state.hi, 9)}]；端点score为 ${f(left, 9)} / ${f(right, 9)}。已二分${state.steps}步；手填ε不会自行改变这个区间；自动求根从[−1,1]独立运行，也不改写此手动区间。${state.solved ? '显式自动求根已经完成。' : '尚未点击自动求根；这里显示的是你当前选择的ε。'}</p>`
    + metrics([['更新函数的经验中心方差', f(at.eifVariance)], ['更新函数的经验SE演示', pp(at.se), '不是可靠推断的保证']])
    + '<p>初始Q只按处理分组，是结构误设；一个ε更新未必能恢复每组真实风险。本案例完整展示targeting计算，但经验EIF方程为零不证明无偏，当前SE不保证可靠推断或小样本覆盖。</p>'
    + '<details class="case-solution"><summary>展开完整核对答案（会显示最终结果）</summary><div class="case-answer"></div></details>';
}

function answer(rows) {
  const solved = solveCase(rows);
  return metrics([['求得 ε', f(solved.epsilon, 12)], ['最终风险差', pp(solved.estimate)], ['每记录平均score', f(solved.score, 12)], ['经验EIF平均', f(solved.eifMean, 12)], ['求根迭代次数', solved.iterations]])
    + table('求根后的四组Q', ['X', 'A', '更新Q'], solved.groups.map(g => [g.x, g.a, f(g.qUpdated, 12)]))
    + '<p>答案由当前计数重新求根，未查询未知真分布。与构造教学值相同是这张表的结果，不是一般无偏性或覆盖率证明。</p>';
}

export function mountCaseWorkbenches(document) {
  for (const [instance, root] of [...document.querySelectorAll('.case-workbench[data-case-study]')].entries()) {
    if (root.dataset.caseMounted === 'true') continue;
    const chapter = Number(root.dataset.caseStudy);
    if (!Number.isInteger(chapter) || chapter < 0 || chapter > 8) throw new RangeError('Case chapter must be between zero and eight');
    const rows = CASE_COUNTS;
    let state = defaults();
    const id = name => `case-${chapter}-${instance}-${name}`;
    const number = (name, label, min, max, step, value) => `<div class="control"><label for="${id(name)}">${label}</label><input id="${id(name)}" data-case-key="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
    const select = (name, label, options, value) => `<div class="control"><label for="${id(name)}">${label}</label><select id="${id(name)}" data-case-key="${name}">${options.map(([v, label]) => `<option value="${v}"${v === value ? ' selected' : ''}>${label}</option>`).join('')}</select></div>`;
    let controls = '';
    if (chapter === 1) controls = select('y', '选定替换结局', [[0, `Y=0：${context.y0}`], [1, `Y=1：${context.y1}`]], state.y) + number('t', '替换比例t', 0, .5, .01, state.t) + '<button type="button" data-case-action="reveal">核对影响值</button>';
    if (chapter === 2) controls = select('index', '选定观测格（X,A,Y）', caseData(rows).cells.map((c, i) => [i, key(c)]), state.index) + number('t', '替换位置t', -.01, .3, .001, state.t);
    if (chapter === 6) controls = number('coefficient', '候选函数中处理方向的倍数', -2, 2, .25, state.coefficient);
    if (chapter === 8) controls = number('epsilon', '手动输入ε（epsilon）', -1, 1, .01, state.epsilon)
      + '<button type="button" data-case-action="step">当前区间二分一步</button><button type="button" data-case-action="solve">显式自动求根</button>';
    root.innerHTML = `<h3>${titles[chapter]}</h3><p class="case-context-note"><strong>${context.title}</strong>：A=1，${context.arm1}；A=0，${context.arm0}。X=0为${context.x0}，X=1为${context.x1}。Y=1表示${context.endpoint}；每人至多计1次，数据均为合成。</p><div class="controls">${controls}<button class="case-reset" type="button" data-case-action="reset">重置本章案例</button></div><p class="case-status" role="status" aria-live="polite"></p><div class="case-output"></div>`;
    const status = root.querySelector('.case-status');
    const render = () => {
      root.querySelector('.case-output').innerHTML = renderChapter(chapter, state, rows);
      for (const input of root.querySelectorAll('[data-case-key]')) input.value = String(state[input.dataset.caseKey]);
      root.dataset.caseEpsilon = String(state.epsilon);
    };
    const attempt = fn => {
      try { fn(); status.textContent = ''; render(); }
      catch (error) { status.textContent = `无法计算，请检查输入：${error.message}`; }
    };
    root.addEventListener('change', event => {
      const input = event.target.closest('[data-case-key]');
      if (!input || !root.contains(input)) return;
      attempt(() => {
        const value = Number(input.value);
        if (input.value.trim() === '' || !Number.isFinite(value)) throw new RangeError('输入必须为有限数值');
        if ((input.min !== '' && value < Number(input.min)) || (input.max !== '' && value > Number(input.max))) throw new RangeError('输入超出本练习范围');
        const proposed = { ...state, [input.dataset.caseKey]: value, solved: false };
        renderChapter(chapter, proposed, rows);
        state = proposed;
      });
    });
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-case-action]');
      if (!button || !root.contains(button)) return;
      attempt(() => {
        if (button.dataset.caseAction === 'reset') state = defaults();
        if (button.dataset.caseAction === 'reveal') state.reveal = true;
        if (button.dataset.caseAction === 'step') {
          const epsilon = state.lo + (state.hi - state.lo) / 2, score = caseAt(epsilon, rows).score;
          state.epsilon = epsilon;
          if (score > 0) state.lo = epsilon; else state.hi = epsilon;
          state.steps += 1; state.solved = false;
        }
        if (button.dataset.caseAction === 'solve') {
          const solved = solveCase(rows);
          state.epsilon = solved.epsilon; state.solved = solved.converged;
        }
      });
    });
    root.addEventListener('toggle', event => {
      if (event.target.matches('.case-solution') && event.target.open) {
        try { event.target.querySelector('.case-answer').innerHTML = answer(rows); }
        catch (error) { status.textContent = `答案计算失败：${error.message}`; }
      }
    }, true);
    render(); root.dataset.caseMounted = 'true';
  }
}
