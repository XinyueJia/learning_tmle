import {expit, logit} from './math.js';

export const TMLE_TRACE_TOLERANCE = 1e-12;

function finite(value, name) {
  if (!Number.isFinite(value)) throw Error(`${name} must be finite`);
  return value;
}

function probability(value, name) {
  finite(value, name);
  if (!(value > 0 && value < 1)) throw Error(`${name} reached a numerical probability boundary`);
  return value;
}

function average(values, name) {
  return finite(values.reduce((total, value) => total + value, 0) / values.length, name);
}

function validateFit(fit) {
  const n = fit?.n;
  if (!Number.isSafeInteger(n) || n < 1 || !Array.isArray(fit.rows) || fit.rows.length !== n) {
    throw Error('Prepared fit requires n ordered observations');
  }
  if (fit.rows.some(row => !row || ![0, 1].includes(row.a) || ![0, 1].includes(row.y))) {
    throw Error('Observed treatment and outcome must be binary');
  }
  for (const name of ['g', 'q0', 'q1']) {
    if (!Array.isArray(fit[name]) || fit[name].length !== n) throw Error(`${name} must have n entries`);
    for (const value of fit[name]) probability(value, name);
  }
  if (fit.H !== undefined && (!Array.isArray(fit.H) || fit.H.length !== n)) {
    throw Error('Stored H must have n entries');
  }
  return n;
}

/**
 * Trace each patient through one logistic TMLE fluctuation, without refitting.
 * All arithmetic uses the entire supplied cohort; the window selects shown rows.
 * Observed A/Y stay fixed, and both intervention arms use the same epsilon.
 */
export function tmleTrace(fit, epsilon = 0, {start = 0, count = 6} = {}) {
  const n = validateFit(fit);
  finite(epsilon, 'epsilon');
  if (!Number.isSafeInteger(start) || start < 0 || start >= n ||
      !Number.isSafeInteger(count) || count < 1) {
    throw Error('Display start must select a cohort row and count must be a positive integer');
  }
  const vectors = {
    a: fit.rows.map(row => row.a), y: fit.rows.map(row => row.y),
    g: [...fit.g], q0: [...fit.q0], q1: [...fit.q1],
  };
  const {a, y, g, q0, q1} = vectors;
  vectors.qa = a.map((treatment, i) => treatment ? q1[i] : q0[i]);
  vectors.offset = vectors.qa.map(logit);
  vectors.offset0 = q0.map(logit);
  vectors.offset1 = q1.map(logit);
  vectors.h0 = g.map(value => finite(-1 / (1 - value), 'h0'));
  vectors.h1 = g.map(value => finite(1 / value, 'h1'));
  vectors.h = a.map((treatment, i) => treatment ? vectors.h1[i] : vectors.h0[i]);
  if (fit.H !== undefined) for (let i = 0; i < n; i++) {
    const stored = finite(fit.H[i], 'Stored H');
    if (Math.abs(stored - vectors.h[i]) > TMLE_TRACE_TOLERANCE * Math.max(1, Math.abs(vectors.h[i]))) {
      throw Error('Stored H does not match the ordered observed treatment and propensity');
    }
  }
  vectors.shift = vectors.h.map(value => finite(epsilon * value, 'epsilon times H'));
  vectors.shift0 = vectors.h0.map(value => finite(epsilon * value, 'epsilon times H0'));
  vectors.shift1 = vectors.h1.map(value => finite(epsilon * value, 'epsilon times H1'));
  vectors.eta = vectors.offset.map((value, i) => finite(value + vectors.shift[i], 'eta'));
  vectors.eta0 = vectors.offset0.map((value, i) => finite(value + vectors.shift0[i], 'arm-zero eta'));
  vectors.eta1 = vectors.offset1.map((value, i) => finite(value + vectors.shift1[i], 'arm-one eta'));
  vectors.qstar_a = vectors.eta.map(value => probability(expit(value), 'qstar_a'));
  vectors.residual = y.map((value, i) => finite(value - vectors.qstar_a[i], 'residual'));
  vectors.score_contribution = vectors.h.map((value, i) => finite(value * vectors.residual[i], 'score contribution'));
  vectors.qstar0 = vectors.eta0.map(value => probability(expit(value), 'qstar0'));
  vectors.qstar1 = vectors.eta1.map(value => probability(expit(value), 'qstar1'));
  vectors.contrast = vectors.qstar1.map((value, i) => finite(value - vectors.qstar0[i], 'contrast'));
  const estimate = average(vectors.contrast, 'estimate');
  vectors.centred = vectors.contrast.map(value => finite(value - estimate, 'centred contrast'));
  vectors.eif = vectors.score_contribution.map((value, i) => finite(value + vectors.centred[i], 'EIF'));
  const initial_estimate = average(q1.map((value, i) => value - q0[i]), 'initial estimate');
  const initial_score = average(vectors.h.map((value, i) => finite(value * (y[i] - vectors.qa[i]), 'initial score contribution')), 'initial score');
  const score = average(vectors.score_contribution, 'score');
  const eif_mean = average(vectors.eif, 'EIF mean');
  const variance = average(vectors.eif.map(value => finite((value - eif_mean) ** 2, 'squared centred EIF')), 'EIF variance');
  const summary = {
    n, epsilon, initial_estimate, initial_score,
    aipw: finite(initial_estimate + initial_score, 'initial AIPW'), score, estimate, eif_mean,
    centred_mean: average(vectors.centred, 'centred contrast mean'), variance,
    se: finite(Math.sqrt(variance / n), 'standard error'),
    min_q: vectors.qstar0.reduce((lowest, value, i) => Math.min(lowest, value, vectors.qstar1[i]), Infinity),
    max_q: vectors.qstar0.reduce((highest, value, i) => Math.max(highest, value, vectors.qstar1[i]), -Infinity),
    slope: -average(vectors.h.map((value, i) => finite(value ** 2 * vectors.qstar_a[i] * (1 - vectors.qstar_a[i]), 'score slope contribution')), 'score slope'),
    log_likelihood: average(y.map((value, i) => value * Math.log(vectors.qstar_a[i]) + (1 - value) * Math.log1p(-vectors.qstar_a[i])), 'log likelihood'),
  };
  const shownCount = Math.min(count, n - start);
  const rowNumbers = Array.from({length: shownCount}, (_, i) => start + i + 1);
  const shown = rowNumbers.map(row => {
    const i = row - 1, observation = fit.rows[i];
    return {row, age: observation.age, race: observation.race, x: observation.x,
      ...Object.fromEntries(Object.entries(vectors).map(([name, values]) => [name, values[i]]))};
  });
  return {vectors, shown, summary, start, count: shownCount, requestedCount: count, rowNumbers};
}
