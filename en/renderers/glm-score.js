import {renderInlineMath as math} from '../markdown.js';
import {glmScoreData} from '../../shared/js/glm-score.js';
const f = x => (x > 0 ? '+' : '') + x.toFixed(6);
export function renderGlmScore(html, data) {
  if (!html.includes('glm-score-placeholder')) return html;
  const d = glmScoreData(data.Y), preview = d.rows.slice(0, 6);
  const scalar = `<p class="gs-reference">The fixed reference distribution is the empirical distribution of these records: ${d.n} people, ${d.events} deaths; ${math(`\\mu=${d.events}/${d.n}`)} ≈ ${d.mu.toFixed(6)}, ${math('\\beta=\\operatorname{logit}(\\mu)')} ≈ ${d.beta.toFixed(6)}.</p>`;
  const vector = (title, symbol, key, role) => `<div class="gs-vector"><header><strong>${title}</strong><span>${math(symbol)}</span><small>${role}</small></header>${preview.map(row => `<div class="gs-row" data-gs-row="${row.record}"><small>i=${row.record}</small><b data-gs-field="${key}" data-value="${row[key]}">${key === 'y' ? row.y : f(row[key])}</b></div>`).join('')}<footer>⋮<br>${d.n} × 1 · Patient row unchanged</footer></div>`;
  const operation = (label, formula) => `<div class="gs-operation"><span>${label}</span><strong>${math(formula)}</strong><b aria-hidden="true">→</b></div>`;
  const scroll = (body, label) => `<div class="diagram-scroll gs-scroll" tabindex="0" role="region" aria-label="${label}"><div class="gs-flow">${body}</div></div>`;
  return html.replace(/<div class="glm-score-placeholder" data-glm-score="(0|1|pairing)"><\/div>/g, (_, mode) => {
    let content;
    if (mode === '0') {
      content = `<figcaption><strong>Why are the logistic intercept score and mean IF both equal to the residual?</strong></figcaption>${scalar}` + scroll(
        vector('Observe the outcome', 'y_i', 'y', 'Input: the same six real records') + operation('Subtract the reference probability from each outcome', '-\\mu') +
        vector('person-by-person residuals', 'y_i-\\mu', 'ifMean', 'Output: one value per patient') +
        `<div class="gs-branches"><div><strong>↗ Intercept score</strong><p>${math('s_\\beta(y)')}: Differentiate the log-likelihood with respect to β</p><span>Purpose: Sum and solve for the regression parameter</span></div><div><strong>↘ Mean IF</strong><p>${math('D_P^{\\mathrm{mean}}(y)')}: shift probability towards y and track the mean</p><span>Purpose: Track how the target changes with the distribution</span></div></div>`, 'After subtracting the fixed mean, the RHC outcome is interpreted as the intercept score and mean IF respectively.');
    } else if (mode === '1') {
      content = `<figcaption><strong>First specify the target, and then convert the score into IF</strong></figcaption>${scalar}` + scroll(
        vector('intercept score', 's_\\beta(y_i)', 'scoreBeta', 'Likelihood derivative with respect to logit intercept') +
        operation(`÷ Information ${d.information.toFixed(6)}`, 'I_\\beta^{-1}') +
        vector('IF for the logit of mortality risk', 'D_P^{\\mathrm{logit}}(y_i)', 'ifLogit', 'Target: logit of mortality risk') +
        operation(`× expit derivative ${d.information.toFixed(6)}`, '\\frac{d\\mu}{d\\beta}') +
        vector('IF of death probability', 'D_P^{\\mathrm{mean}}(y_i)', 'ifMean', 'Target: Probability of Death'), 'The scores of the same patient are converted into logit target IF by information, and then converted into mean target IF.');
    } else {
      const cells = (label, formula, key) => `<div class="gs-vector gs-support"><header><strong>${label}</strong><span>${math(formula)}</span></header>${d.support.map(row => `<div class="gs-row" data-gs-support="${row.y}"><small>Y=${row.y}</small><b data-gs-field="${key}" data-value="${row[key]}">${f(row[key])}</b></div>`).join('')}<footer>Two types of outcomes · 2 × 1</footer></div>`;
      content = `<figcaption><strong>Multiply the IF by the score and take a probability-weighted average to obtain the derivative along the logit path</strong></figcaption><p>Path: ${math('\\mu_t=\\operatorname{expit}(\\beta+t)')}; t is measured in logit increments. The reference P remains fixed, and the following two lines are aligned by outcome category.</p>` + scroll(
        cells('Mean IF', 'D(Y)', 'ifMean') + operation('Multiply term by term', '\\times') +
        cells('logit path score', 'S_{\\mathrm{logit}}(Y)', 'scoreBeta') + operation('Multiply probabilities item by item', '\\times') +
        cells('Reference probability', 'P(Y=y)', 'p') + operation('Add two items', '\\sum') +
        `<div class="gs-result"><strong>${math('\\mathbb E_P[DS]')}</strong><b data-gs-pairing="${d.pairedDerivative}">${d.pairedDerivative.toFixed(6)}</b><span>Exact derivative ${math('\\mu(1-\\mu)')}</span><small>For small t, the corresponding change is approximately<br>${math('t\\mu(1-\\mu)')}<br>For a finite step, recalculate using expit</small></div>`, 'The mean IF is multiplied by the logit path score, and then the weighted sum is calculated based on the probabilities of the two outcomes.');
    }
    return `<figure class="gs-visual" data-gs-visual="${mode}">${content}<p class="gs-note">${mode === 'pairing' ? 'Calculated as two-category probabilities aggregated over the complete cohort; decimals are used for display.' : `Preview the first ${preview.length} rows of the original CSV, and use all ${d.n} rows for reference.`} Here P is a known empirical reference; the true population P₀ is still unknown.</p></figure>`;
  });
}
