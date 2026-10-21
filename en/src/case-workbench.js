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
const table = (label, heads, rows) => `<div class="table-wrap" tabindex="0" role="region" aria-label="${label}"><table><caption>${label}</caption><thead><tr>${heads.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const titles = [
  'Inspect the original SUPPORT cohort counts', 'Step 1: calculate the mortality mean and influence values',
  'Step 2: compare the mean derivative with the gradient–score pairing', 'Step 3: compare observed stratum risks with the initial fit',
  'Step 4: average the initial fitted EIF over the sample', 'Step 5: check the seven independent directions one by one',
  'Step 6: project into the tangent space with known g', 'Step 7: calculate empirical EIF variance and standard error',
  'Step 8: solve for ε and update the four stratum risks',
];
const defaults = () => ({ y: 1, index: 3, t: .01, reveal: false, coefficient: 1,
  epsilon: 0, lo: -1, hi: 1, steps: 0, solved: false });

function renderChapter(chapter, state, rows) {
  const data = caseData(rows);
  if (chapter === 0) return `<p>These counts aggregate ${data.n} real public patient records. Every chapter reads the same frequency table without resampling; the algorithm uses only the counts.</p>`
    + metrics([['Fixed number of records', data.n, 'patients; one patient per CSV row'], ['Number of (X,A,Y) cells', data.cells.length, 'arranged by X, A, Y']])
    + table('Patient counts by sex, treatment and outcome', ['X', 'A', 'Y', 'Patient count n'], data.cells.map(c => [c.x, c.a, c.y, c.n]))
    + `<p><a class="case-download" download="rhc-counts.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(countsCsv(rows))}">Download eight-row count CSV</a> · <a class="case-download" download="rhc-records.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(recordsCsv(rows))}">Download ${data.n}-row record CSV</a></p><p>Later steps use the counts, initial fits and target derivatives to construct TMLE. This panel keeps the original inputs visible.</p>`;
  if (chapter === 1) {
    const events = data.cells.reduce((s, c) => s + c.n * c.y, 0);
    const direction = caseMeanDirection(state.y === 1 ? 1 : 0, state.t, rows);
    return metrics([['Deaths within 30 days / total patients', `${events} / ${data.n}`], ['Sample 30-day mortality proportion', pct(data.marginalRisk), 'sample mean; current target is 30-day mortality risk']])
      + table('Binary outcomes in the same data', ['Y', 'Patients', 'empirical probability'], [0, 1].map(y => {
        const n = data.cells.filter(c => c.y === y).reduce((s, c) => s + c.n, 0);
        return [y, n, f(n / data.n)];
      })) + `<p>Predict first: if outcome Y=${state.y} gains a little probability mass, will the mean rise or fall? Calculate the influence value and the resulting change.</p>`
      + (state.reveal ? metrics([['Influence value: selected Y − original mean', f(direction.derivative), 'Rate per unit replacement proportion'], ['Mean change along the current path', pp(direction.delta), 'rate of change times step size'], ['Mean after replacement', pct(direction.updatedRisk)]]) : '<p>Make a prediction, then select “Check influence value”. ATE and TMLE results are introduced in later steps.</p>');
  }
  if (chapter === 2) {
    const d = caseMeanDirection(state.index, state.t, rows);
    return `<p>Selected observation combination: ${key(d.cells[state.index])}. Step size t controls the probability change; h and S stay fixed at the original empirical distribution. The target remains the binary outcome mean, rather than the ATE.</p>`
      + metrics([['Original empirical mean', f(d.marginalRisk)], ['Current exact mean', f(d.updatedRisk)], ['Starting-point derivative', f(d.derivative)], ['Probability-weighted pairing', f(d.pairing)], ['Finite-step difference quotient', d.quotient === null ? 'Undefined at t=0' : f(d.quotient)]])
      + table('Pair the mean influence function with the score in each cell', ['X,A,Y', 'n', 'Original probability p', 'new probability', 'direction h', 'relative change S', 'mean influence D', 'Contribution pDS'], d.cells.map(c => [key(c), c.n, f(c.p), f(c.updatedP), f(c.h), f(c.S), f(c.D), f(c.contribution)]))
      + '<p>The ordinary sum of h is zero. S and D each have mean zero under the original empirical probabilities. Individual D values can be non-zero; summing their contributions gives the directional derivative.</p>';
  }
  if (chapter === 3) return `<p>The initial outcome regression uses A alone. Both X strata within a treatment arm therefore share a fitted risk. This deliberately simplified starting model differs from the four observed stratum risks.</p>`
    + table('Counts, observed risks and initial fits in four groups', ['X', 'A', 'Patients', 'Observed deaths', 'Observed risk', 'Empirical X-stratum probability', 'Empirical probability of A=1', 'Initial fitted risk'], data.groups.map(g => [g.x, g.a, g.n, g.events, f(g.qObserved), f(g.px), f(g.gHat), f(g.initialQ)]))
    + metrics([['Initial risk difference: treatment-only fit', pp(data.initialEstimate)], ['Unadjusted arm difference', pp(data.observedDifference)]])
    + '<p>Patient counts, event counts, empirical treatment probabilities and initial fits all come from this count table. Next, check the target-related residuals left by the initial fit.</p>';
  if (chapter === 4) {
    const at = caseAt(0, rows);
    return `<p>Within each X stratum, H is the reciprocal RHC probability for recipients and the negative reciprocal no-RHC probability for non-recipients. Divide each group’s weighted residual total by the overall patient count to obtain its contribution to the per-record average.</p>`
      + table('Four groups of H and initial residuals', ['X', 'A', 'H', 'Initial risk', 'Patients × initial risk', 'Observed deaths − sum of predictions', 'H × residual sum', 'Contribution / total patients'], at.groups.map(g => [g.x, g.a, f(g.h), f(g.initialQ), f(g.predictedEvents), f(g.residualTotal), f(g.weightedResidual), f(g.scoreContribution)]))
      + metrics([['Initial target estimate', pp(at.estimate)], ['Empirical mean of the initial fitted EIF', f(at.eifMean), 'Average over all records'], ['Sample average of weighted outcome residuals', f(at.score), 'Group totals divided by total patients']])
      + table('Initial fitted EIF value for each (X,A,Y) cell', ['X,A,Y', 'n', 'D', 'Empirical probability × D'], at.eifRows.map(c => [key(c), c.n, f(c.D), f(c.p * c.D)]))
      + '<p>A non-zero mean exposes target-related residuals from the initial fit; it is not a check of population unbiasedness. There is no need to update parameters here.</p>';
  }
  if (chapter === 5) {
    const d = caseDirections(rows);
    const directionTable = (label, list) => table(label, ['direction', 'Empirical score mean', 'Direct central finite difference', 'gradient pairing', 'Finite difference − gradient pairing'], list.map(r => [r.label, f(r.scoreMean), f(r.numerical), f(r.paired), r.error.toExponential(2)]));
    return '<p>Here we verify the target and gradient at the saturated empirical distribution, using all four observed group risks. We do not treat Step 4’s initial fitted function as the correct derivative. Central finite differences recalculate ATE from perturbed observation-combination probabilities, with step size 10⁻⁷.</p>'
      + directionTable('Eight point-replacement directions: check every row', d.points)
      + directionTable('Seven independent directions: increase the probability of a combination while reducing the probability of the reference combination by the same amount', d.contrasts)
      + '<p>The eight point-mass directions span seven independent dimensions. The seven contrast directions cover the tangent space of this finite probability table. Read the numerical checks alongside the general algebraic argument: agreement for one direction is insufficient. Later targeting updates one specified outcome direction, rather than fitting these fifteen paths separately.</p>';
  }
  if (chapter === 6) {
    const d = caseProjection(rows, state.coefficient);
    return '<p>For this exercise only, suppose the table’s treatment probabilities are known by design. Population composition and the four outcome risks may vary; treatment directions are outside the model. The final case still estimates treatment probabilities from counts; this exercise leaves that algorithm unchanged.</p>'
      + metrics([['Tangent-space dimension in the known-g model', d.dimension, 'Population composition: 1 dimension; outcome risks: 4 dimensions'], ['Maximum difference between projection and saturated empirical gradient', d.maxError.toExponential(2)], ['Candidate function empirical second moment', f(d.candidateSecondMoment)], ['Projected function empirical second moment', f(d.projectedSecondMoment)]])
      + table('Remove the added treatment-direction component', ['X,A,Y', 'Original empirical gradient', 'Treatment-direction component A−g', 'Candidate function', 'Projection in the known-g model', 'Removed component'], d.cells.map((c, i) => [key(c), f(d.D[i]), f(d.treatmentPart[i]), f(d.candidate[i]), f(d.projected[i]), f(d.removed[i])]))
      + '<p>The candidate adds a multiple of the treatment-direction component to the empirical gradient. It represents derivatives in the known-g model, while the unrestricted model has additional directions to check. Projection removes this added component. Here the empirical ATE gradient is already orthogonal to treatment directions, so projection returns that gradient; knowing g need not change the efficiency bound.</p>';
  }
  if (chapter === 7) {
    const at = caseAt(0, rows);
    const saturated = caseEmpiricalMoments(rows);
    return '<p>Use Step 4’s initial fitted function, whose empirical mean is still non-zero. Calculate its mean and second moment from counts, then subtract the squared mean to obtain the centred empirical variance, with denominator n. This differs from the function defined by saturated within-group risks in the population experiment.</p>'
      + table('Empirical moments of the initial fitted function', ['X,A,Y', 'n', 'D', 'pD', 'pD²', 'p×(D−mean D)²'], at.eifRows.map(c => [key(c), c.n, f(c.D), f(c.p * c.D), f(c.p * c.D ** 2), f(c.p * (c.D - at.eifMean) ** 2)]))
      + metrics([['Empirical mean', f(at.eifMean)], ['Empirical second moment', f(at.eifSecondMoment)], ['Empirical centred variance', f(at.eifVariance)], ['Initial-function empirical SE', pp(at.se), 'Square root of (centred variance / sample size)']])
      + '<h4>Use all four observed group risks and recalculate the gradient</h4>'
      + metrics([['Empirical mean of the saturated gradient', f(saturated.eifMean)], ['Its empirical second moment', f(saturated.eifSecondMoment)], ['Its empirical centred variance', f(saturated.eifVariance)], ['Its empirical SE calculation', pp(saturated.se), 'Plug-in calculation for the current table']])
      + '<p>This replaces the initial fitted function with the gradient at the saturated empirical distribution; it does more than centre the original function. The conditional risks differ, so variance values must identify their function and distribution.</p>'
      + '<p>These calculations give neither the unknown true distribution’s efficiency bound nor this estimate’s actual error. The initial outcome regression is structurally misspecified, so this SE demonstration does not guarantee reliable inference. Recalculate it after Step 8 updates the function. We therefore do not display confidence intervals based on this value.</p>';
  }
  const at = caseAt(state.epsilon, rows);
  const left = caseAt(state.lo, rows).score, right = caseAt(state.hi, rows).score;
  return '<p>Update the four stratum predictions using patient and event counts. Keep empirical population and treatment probabilities fixed; add ε×H to each initial logit. Enter ε to inspect the score, or bisect the bracket. Automatic solving runs when selected.</p>'
    + metrics([['Current ε', f(at.epsilon, 12)], ['Current mean weighted residual', f(at.score, 12)], ['Current risk difference', pp(at.estimate)], ['Current fitted gradient’s empirical mean', f(at.eifMean, 12)], ['Average log-likelihood', f(at.logLikelihood, 9)], ['Derivative of the score with respect to ε', f(at.slope, 9)]])
    + table('Check offsets, updated predictions and score contributions by stratum', ['X', 'A', 'n', 'Observed events', 'Empirical g', 'H', 'Initial offset', 'Prediction Qε at current ε', 'Predicted event total', 'Observed events − predicted events', 'H × residual', 'Score contribution'], at.groups.map(g => [g.x, g.a, g.n, g.events, f(g.gHat), f(g.h), f(g.offset), f(g.qUpdated, 9), f(g.predictedEvents), f(g.residualTotal), f(g.weightedResidual), f(g.scoreContribution, 9)]))
    + `<p>Manual bracket: [${f(state.lo, 9)}, ${f(state.hi, 9)}]; endpoint scores ${f(left, 9)} / ${f(right, 9)}. Bisections: ${state.steps}. Entering ε leaves this bracket fixed. Automatic solving starts independently from [−1,1] and leaves the manual bracket unchanged. ${state.solved ? 'Automatic root finding is complete.' : 'Automatic solving has not been selected; the display uses your current trial ε.'}</p>`
    + metrics([['Updated-function centred empirical variance', f(at.eifVariance)], ['Updated-function empirical SE', pp(at.se), 'is not a guarantee of reliable inference']])
    + '<p>The initial Q uses treatment alone, so it is structurally misspecified. A single ε update need not recover all four stratum risks. This experiment demonstrates targeting; a zero empirical EIF mean does not establish unbiasedness or reliable confidence-interval coverage.</p>'
    + '<details class="case-solution"><summary>View the root and four updated group risks</summary><div class="case-answer"></div></details>';
}

function answer(rows) {
  const solved = solveCase(rows);
  return metrics([['Solved ε', f(solved.epsilon, 12)], ['Final risk difference', pp(solved.estimate)], ['Mean weighted residual', f(solved.score, 12)], ['Empirical EIF mean', f(solved.eifMean, 12)], ['Number of root iterations', solved.iterations]])
    + table('Four stratum predictions Q* after root finding', ['X', 'A', 'Updated prediction Q*'], solved.groups.map(g => [g.x, g.a, f(g.qUpdated, 12)]))
    + '<p>The answer is solved from the current counts. Agreement with saturated sex standardisation follows from a stratified identity using empirical g; it is separate from unbiasedness and confidence-interval coverage.</p>';
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
    if (chapter === 1) controls = select('y', 'Outcome receiving the added mass', [[0, `Y=0: ${context.y0}`], [1, `Y=1: ${context.y1}`]], state.y) + number('t', 'Replacement proportion t', 0, .5, .01, state.t) + '<button type="button" data-case-action="reveal">Check influence value</button>';
    if (chapter === 2) controls = select('index', 'Selected observation combination (X,A,Y)', caseData(rows).cells.map((c, i) => [i, key(c)]), state.index) + number('t', 'Path step size t', -.01, .3, .001, state.t);
    if (chapter === 6) controls = number('coefficient', 'Coefficient of the added treatment direction', -2, 2, .25, state.coefficient);
    if (chapter === 8) controls = number('epsilon', 'Manual input ε (epsilon)', -1, 1, .01, state.epsilon)
      + '<button type="button" data-case-action="step">Bisect the current bracket once</button><button type="button" data-case-action="solve">Find the root automatically</button>';
    root.innerHTML = `<h3>${titles[chapter]}</h3><p class="case-context-note"><strong>${context.title}</strong>: A=1, ${context.arm1}; A=0, ${context.arm0}. X=0 denotes ${context.x0} and X=1 denotes ${context.x1}. Y=1 denotes ${context.endpoint}, counted once per patient. All records come from the public CSV. Causal interpretation requires the stated identification conditions. Counts are exact; displayed decimals are rounded.</p><div class="controls">${controls}<button class="case-reset" type="button" data-case-action="reset">Reset this chapter’s case</button></div><p class="case-status" role="status" aria-live="polite"></p><div class="case-output"></div>`;
    const status = root.querySelector('.case-status');
    const render = () => {
      root.querySelector('.case-output').innerHTML = renderChapter(chapter, state, rows);
      for (const input of root.querySelectorAll('[data-case-key]')) input.value = String(state[input.dataset.caseKey]);
      root.dataset.caseEpsilon = String(state.epsilon);
    };
    const attempt = fn => {
      try { fn(); status.textContent = ''; render(); }
      catch (error) { status.textContent = `Check the input: ${error.message}`; }
    };
    root.addEventListener('change', event => {
      const input = event.target.closest('[data-case-key]');
      if (!input || !root.contains(input)) return;
      attempt(() => {
        const value = Number(input.value);
        if (input.value.trim() === '' || !Number.isFinite(value)) throw new RangeError('Input must be a finite number');
        if ((input.min !== '' && value < Number(input.min)) || (input.max !== '' && value > Number(input.max))) throw new RangeError('Input is outside this exercise’s range');
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
        catch (error) { status.textContent = `Answer calculation failed: ${error.message}`; }
      }
    }, true);
    render(); root.dataset.caseMounted = 'true';
  }
}
