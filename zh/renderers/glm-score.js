import {renderInlineMath as math} from '../../scripts/markdown.js';
import {glmScoreData} from '../../shared/js/glm-score.js';
const f = x => (x > 0 ? '+' : '') + x.toFixed(6);
export function renderGlmScore(html, data) {
  if (!html.includes('glm-score-placeholder')) return html;
  const d = glmScoreData(data.Y), preview = d.rows.slice(0, 6);
  const scalar = `<p class="gs-reference">固定参考分布为这批记录的经验分布：${d.n}人，${d.events}个死亡；${math(`\\mu=${d.events}/${d.n}`)} ≈ ${d.mu.toFixed(6)}，${math('\\beta=\\operatorname{logit}(\\mu)')} ≈ ${d.beta.toFixed(6)}。</p>`;
  const vector = (title, symbol, key, role) => `<div class="gs-vector"><header><strong>${title}</strong><span>${math(symbol)}</span><small>${role}</small></header>${preview.map(row => `<div class="gs-row" data-gs-row="${row.record}"><small>i=${row.record}</small><b data-gs-field="${key}" data-value="${row[key]}">${key === 'y' ? row.y : f(row[key])}</b></div>`).join('')}<footer>⋮<br>${d.n} × 1 · 患者行不变</footer></div>`;
  const operation = (label, formula) => `<div class="gs-operation"><span>${label}</span><strong>${math(formula)}</strong><b aria-hidden="true">→</b></div>`;
  const scroll = (body, label) => `<div class="diagram-scroll gs-scroll" tabindex="0" role="region" aria-label="${label}"><div class="gs-flow">${body}</div></div>`;
  return html.replace(/<div class="glm-score-placeholder" data-glm-score="(0|1|pairing)"><\/div>/g, (_, mode) => {
    let content;
    if (mode === '0') {
      content = `<figcaption><strong>logistic截距score与均值IF为什么都等于残差？</strong></figcaption>${scalar}` + scroll(
        vector('观察结局', 'y_i', 'y', '输入：同六条真实记录') + operation('每项减参考概率', '-\\mu') +
        vector('逐人残差', 'y_i-\\mu', 'ifMean', '输出：一个人对应一个数') +
        `<div class="gs-branches"><div><strong>↗ 截距score</strong><p>${math('s_\\beta(y)')}：沿β改变对数似然</p><span>用途：相加后求回归参数</span></div><div><strong>↘ 均值IF</strong><p>${math('D_P^{\\mathrm{mean}}(y)')}：朝y替换概率，观察均值</p><span>用途：跟踪目标对分布的变化</span></div></div>`, 'RHC结局减去固定均值后，分别解释为截距score与均值IF');
    } else if (mode === '1') {
      content = `<figcaption><strong>先确定目标，再将score换算为IF</strong></figcaption>${scalar}` + scroll(
        vector('截距score', 's_\\beta(y_i)', 'scoreBeta', '对logit截距的似然导数') +
        operation(`÷ 信息 ${d.information.toFixed(6)}`, 'I_\\beta^{-1}') +
        vector('logit死亡概率的IF', 'D_P^{\\mathrm{logit}}(y_i)', 'ifLogit', '目标：logit死亡概率') +
        operation(`× expit导数 ${d.information.toFixed(6)}`, '\\frac{d\\mu}{d\\beta}') +
        vector('死亡概率的IF', 'D_P^{\\mathrm{mean}}(y_i)', 'ifMean', '目标：死亡概率'), '同一患者的score经信息换算为logit目标IF，再转换为均值目标IF');
    } else {
      const cells = (label, formula, key) => `<div class="gs-vector gs-support"><header><strong>${label}</strong><span>${math(formula)}</span></header>${d.support.map(row => `<div class="gs-row" data-gs-support="${row.y}"><small>Y=${row.y}</small><b data-gs-field="${key}" data-value="${row[key]}">${f(row[key])}</b></div>`).join('')}<footer>两类结局 · 2 × 1</footer></div>`;
      content = `<figcaption><strong>将IF与score相乘，再按概率平均，得到logit路径的目标导数</strong></figcaption><p>路径：${math('\\mu_t=\\operatorname{expit}(\\beta+t)')}；t以logit增量计。参考P仍固定，下面两行按结局类别对齐。</p>` + scroll(
        cells('均值IF', 'D(Y)', 'ifMean') + operation('逐项乘', '\\times') +
        cells('logit路径score', 'S_{\\mathrm{logit}}(Y)', 'scoreBeta') + operation('逐项乘概率', '\\times') +
        cells('参考概率', 'P(Y=y)', 'p') + operation('两项相加', '\\sum') +
        `<div class="gs-result"><strong>${math('\\mathbb E_P[DS]')}</strong><b data-gs-pairing="${d.pairedDerivative}">${d.pairedDerivative.toFixed(6)}</b><span>精确导数 ${math('\\mu(1-\\mu)')}</span><small>微小t对应变化约为<br>${math('t\\mu(1-\\mu)')}<br>有限步长需用expit重算</small></div>`, '均值IF乘logit路径score，再按两个结局概率加权求和');
    }
    return `<figure class="gs-visual" data-gs-visual="${mode}">${content}<p class="gs-note">${mode === 'pairing' ? '按完整队列汇总的两类概率计算；小数用于显示。' : `预览原CSV前${preview.length}行，参考均值使用全部${d.n}行。`} 此处P为已知经验参考；真实总体P₀仍未知。</p></figure>`;
  });
}
