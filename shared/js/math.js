/** Pure finite-distribution numerical kernel. Matrices use q[a][x]. */
export const DEFAULT_MODEL = Object.freeze({
  px: Object.freeze([0.5, 0.5]),
  g: Object.freeze([0.2, 0.8]),
  q: Object.freeze([Object.freeze([0.70, 0.20]), Object.freeze([0.80, 0.50])]),
});
const finite = (v, name) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new TypeError(`${name} must be finite`);
  return v;
};
function vector(v, n, name) {
  if (!Array.isArray(v) || v.length !== n) throw new TypeError(`${name} must have length ${n}`);
  v.forEach(x => finite(x, name));
  return v;
}
function probabilities(p, strict = false) {
  if (!Array.isArray(p) || !p.length) throw new TypeError('A non-empty probability array is required');
  p.forEach(v => {
    finite(v, 'Probability');
    if (v < 0 || v > 1 || (strict && v === 0)) throw new RangeError('Invalid probability');
  });
  if (Math.abs(p.reduce((s, v) => s + v, 0) - 1) > 1e-12) throw new RangeError('Probabilities must sum to one');
  return p;
}
function interior(v, name) {
  finite(v, name);
  if (v <= 0 || v >= 1) throw new RangeError(`${name} must lie strictly between zero and one`);
  return v;
}
function validate(model) {
  if (!model || typeof model !== 'object') throw new TypeError('A model is required');
  probabilities(vector(model.px, 2, 'px'), true);
  vector(model.g, 2, 'g').forEach(v => interior(v, 'g'));
  if (!Array.isArray(model.q) || model.q.length !== 2) throw new TypeError('q must be a 2 by 2 matrix');
  model.q.forEach(row => vector(row, 2, 'q').forEach(v => interior(v, 'q')));
  return model;
}
function cellCheck(cell) {
  if (!cell || !['x', 'a', 'y'].every(k => cell[k] === 0 || cell[k] === 1)) throw new TypeError('Cell coordinates must be binary');
}
const pi = (model, a, x) => a ? model.g[x] : 1 - model.g[x];
const clever = (model, a, x) => finite(a ? 1 / model.g[x] : -1 / (1 - model.g[x]), 'Inverse propensity weight');
const targetMean = (truth, fit) => truth.px.reduce((s, p, x) => s + p * (fit.q[1][x] - fit.q[0][x]), 0);
export function cloneModel(model = DEFAULT_MODEL) {
  validate(model);
  return { px: [...model.px], g: [...model.g], q: model.q.map(row => [...row]) };
}
export function mean(values, p) {
  probabilities(p); vector(values, p.length, 'values');
  return finite(p.reduce((s, w, i) => s + w * values[i], 0), 'Mean');
}
export function contaminate(p, index, t) {
  probabilities(p); finite(t, 't');
  if (!Number.isInteger(index) || index < 0 || index >= p.length) throw new RangeError('Invalid cell index');
  const updated = p.map((v, i) => (1 - t) * v + (i === index ? t : 0));
  probabilities(updated);
  return updated;
}
export function pointScore(p, index) {
  probabilities(p, true);
  if (!Number.isInteger(index) || index < 0 || index >= p.length) throw new RangeError('Invalid cell index');
  return p.map((v, i) => (i === index ? 1 / v : 0) - 1);
}
export function joint(model) {
  validate(model);
  const cells = [];
  for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) for (let y = 0; y < 2; y++) {
    cells.push({ x, a, y, p: model.px[x] * pi(model, a, x) * (y ? model.q[a][x] : 1 - model.q[a][x]) });
  }
  probabilities(cells.map(c => c.p), true);
  return cells;
}
/** Marginal endpoint distribution, summing out treatment and baseline risk. */
export function marginalOutcomeModel(model = DEFAULT_MODEL) {
  const probabilities = [0, 0];
  for (const cell of joint(model)) probabilities[cell.y] += cell.p;
  return { values: [0, 1], probabilities };
}
const endpointMarginal = marginalOutcomeModel();
export const MEAN_MODEL = Object.freeze({
  values: Object.freeze(endpointMarginal.values),
  probabilities: Object.freeze(endpointMarginal.probabilities),
});
export function fromJoint(cells) {
  if (!Array.isArray(cells) || cells.length !== 8) throw new TypeError('Exactly eight cells are required');
  const seen = new Set();
  cells.forEach(c => { cellCheck(c); const key = `${c.x}${c.a}${c.y}`; if (seen.has(key)) throw new RangeError('Duplicate cell'); seen.add(key); });
  probabilities(cells.map(c => c.p), true);
  const px = [0, 0], mass = [[0, 0], [0, 0]], success = [[0, 0], [0, 0]];
  for (const c of cells) { px[c.x] += c.p; mass[c.a][c.x] += c.p; success[c.a][c.x] += c.p * c.y; }
  const model = { px, g: px.map((p, x) => mass[1][x] / p), q: success.map((row, a) => row.map((s, x) => s / mass[a][x])) };
  return validate(model);
}
export function ate(model) { validate(model); return targetMean(model, model); }
export function naive(model) {
  validate(model);
  const conditional = a => {
    const weights = model.px.map((p, x) => p * pi(model, a, x));
    return weights.reduce((s, p, x) => s + p * model.q[a][x], 0) / weights.reduce((s, p) => s + p, 0);
  };
  return finite(conditional(1) - conditional(0), 'Observational contrast');
}
export function eif(model, cell) {
  validate(model); cellCheck(cell);
  const dx = model.q[1][cell.x] - model.q[0][cell.x] - ate(model);
  const dy = finite(clever(model, cell.a, cell.x) * (cell.y - model.q[cell.a][cell.x]), 'EIF outcome component');
  return { dx, dy, total: finite(dx + dy, 'EIF') };
}
export function expectation(cells, fn) {
  if (!Array.isArray(cells) || !cells.length || typeof fn !== 'function') throw new TypeError('Cells and a function are required');
  probabilities(cells.map(c => c.p));
  return finite(cells.reduce((s, c, i) => s + c.p * finite(fn(c, i), 'Function value'), 0), 'Expectation');
}
export function expit(z) {
  finite(z, 'Log odds');
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z); return e / (1 + e);
}
export function logit(p) { interior(p, 'Probability'); return Math.log(p) - Math.log1p(-p); }
function kindCheck(kind) { if (!['X', 'A', 'Y'].includes(kind)) throw new RangeError('Mechanism must be X, A or Y'); }
export function tilt(model, kind, t) {
  validate(model); kindCheck(kind); finite(t, 't');
  const updated = cloneModel(model);
  if (kind === 'X') { const p = expit(logit(model.px[1]) + t); updated.px = [1 - p, p]; }
  if (kind === 'A') updated.g = model.g.map(p => expit(logit(p) + t));
  if (kind === 'Y') updated.q = model.q.map(row => row.map(p => expit(logit(p) + t)));
  return validate(updated);
}
/** Joint exponential path; unlike a conditional tilt, all mechanisms may change. */
export function jointTilt(model, score, t) {
  const cells = joint(model), p = cells.map(c => c.p);
  vector(score, 8, 'Joint score'); finite(t, 't');
  if (Math.abs(mean(score, p)) > 1e-10) throw new RangeError('Joint score must have mean zero under the base model');
  const logWeights = cells.map((c, i) => finite(Math.log(c.p) + finite(t * score[i], 'Joint tilt exponent'), 'Joint log weight'));
  const shift = Math.max(...logWeights);
  const weights = logWeights.map(v => Math.exp(v - shift));
  const normaliser = weights.reduce((s, w) => s + w, 0);
  return fromJoint(cells.map((c, i) => ({ ...c, p: weights[i] / normaliser })));
}
export function mechanismScore(model, kind, cell) {
  validate(model); kindCheck(kind); cellCheck(cell);
  return kind === 'X' ? cell.x - model.px[1] : kind === 'A' ? cell.a - model.g[cell.x] : cell.y - model.q[cell.a][cell.x];
}
export function inner(p, f, h) {
  probabilities(p); vector(f, p.length, 'f'); vector(h, p.length, 'h');
  return finite(p.reduce((s, w, i) => s + w * f[i] * h[i], 0), 'Inner product');
}
export function project(p, f, basis) {
  probabilities(p, true); vector(f, p.length, 'f');
  if (!Array.isArray(basis)) throw new TypeError('Basis must be an array of vectors');
  const orthonormal = [];
  for (const b of basis) {
    vector(b, p.length, 'Basis vector');
    const originalNorm = Math.sqrt(inner(p, b, b));
    if (!Number.isFinite(originalNorm) || originalNorm === 0) throw new RangeError('Basis is rank deficient');
    let v = b.map(x => x / originalNorm);
    // Two passes of modified Gram–Schmidt limit cancellation.
    for (let pass = 0; pass < 2; pass++) for (const u of orthonormal) {
      const coefficient = inner(p, v, u); v = v.map((x, i) => x - coefficient * u[i]);
    }
    const norm = Math.sqrt(inner(p, v, v));
    if (norm <= 1e-12) throw new RangeError('Basis is rank deficient at numerical precision');
    orthonormal.push(v.map(x => x / norm));
  }
  const result = p.map(() => 0);
  for (const u of orthonormal) { const coefficient = inner(p, f, u); result.forEach((_, i) => { result[i] += coefficient * u[i]; }); }
  return result;
}
export function varianceDirect(model) { return expectation(joint(model), c => eif(model, c).total ** 2); }
export function varianceAnalytic(model) {
  validate(model); const psi = ate(model);
  return finite(model.px.reduce((s, p, x) => s + p * ((model.q[1][x] - model.q[0][x] - psi) ** 2
    + model.q[1][x] * (1 - model.q[1][x]) / model.g[x]
    + model.q[0][x] * (1 - model.q[0][x]) / (1 - model.g[x])), 0), 'Variance');
}
export function cleverCovariate(model, a, x) {
  validate(model); cellCheck({ x, a, y: 0 });
  return clever(model, a, x);
}
export function nuisanceBias(truth, fit) {
  validate(truth); validate(fit);
  return finite(truth.px.reduce((s, p, x) => s + p * (fit.g[x] - truth.g[x])
    * ((fit.q[1][x] - truth.q[1][x]) / fit.g[x]
      + (fit.q[0][x] - truth.q[0][x]) / (1 - fit.g[x])), 0), 'Nuisance bias');
}
export function fitFromOffsets(truth, b, lambda) {
  validate(truth); finite(b, 'Outcome offset'); finite(lambda, 'Treatment interpolation');
  if (lambda < 0 || lambda > 1) throw new RangeError('Treatment interpolation must lie between zero and one');
  const updated = {
    px: [...truth.px],
    g: truth.g.map(g => (1 - lambda) * g + lambda * .5),
    q: [[truth.q[0][0] + b, truth.q[0][1] + .5 * b],
      [truth.q[1][0] - .5 * b, truth.q[1][1] - b]],
  };
  return validate(updated);
}
export function aipw(truth, fit) {
  validate(truth); validate(fit);
  let correction = 0;
  for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) {
    correction += truth.px[x] * pi(truth, a, x) * clever(fit, a, x) * (truth.q[a][x] - fit.q[a][x]);
  }
  return finite(targetMean(truth, fit) + correction, 'AIPW estimate');
}
export function fluctuation(truth, fit, epsilon) {
  validate(truth); validate(fit); finite(epsilon, 'epsilon');
  const updated = cloneModel(fit);
  updated.px = [...truth.px];
  updated.q = fit.q.map((row, a) => row.map((p, x) => expit(logit(p) + epsilon * clever(fit, a, x))));
  return validate(updated);
}
// Evaluate the logistic score directly to permit bracketing without logit(0/1).
function scoreAndSlope(truth, fit, epsilon) {
  let score = 0, slope = 0;
  for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) {
    const h = clever(fit, a, x), w = truth.px[x] * pi(truth, a, x);
    const q = expit(logit(fit.q[a][x]) + epsilon * h);
    score += w * h * (truth.q[a][x] - q);
    slope -= w * h * h * q * (1 - q);
  }
  return { score: finite(score, 'Fluctuation score'), slope: finite(slope, 'Fluctuation score derivative') };
}
export function fluctuationScore(truth, fit, epsilon) {
  validate(truth); validate(fit); finite(epsilon, 'epsilon');
  return scoreAndSlope(truth, fit, epsilon).score;
}
export function tmle(truth, fit) {
  validate(truth); validate(fit);
  const tolerance = 1e-12;
  const finish = (epsilon, score, iterations) => {
    const updated = fluctuation(truth, fit, epsilon);
    return { epsilon, updated, estimate: targetMean(truth, updated), score, converged: true, iterations };
  };
  const initial = scoreAndSlope(truth, fit, 0);
  if (Math.abs(initial.score) <= tolerance) return finish(0, initial.score, 0);
  let lo = -1, hi = 1, slo = scoreAndSlope(truth, fit, lo).score, shi = scoreAndSlope(truth, fit, hi).score;
  for (let i = 0; (slo < 0 || shi > 0) && i < 60; i++) {
    if (slo < 0) { lo *= 2; slo = scoreAndSlope(truth, fit, lo).score; }
    if (shi > 0) { hi *= 2; shi = scoreAndSlope(truth, fit, hi).score; }
  }
  if (!(slo >= 0 && shi <= 0)) throw new RangeError('TMLE could not bracket the score root');
  let epsilon = 0;
  for (let iterations = 1; iterations <= 200; iterations++) {
    const { score, slope } = scoreAndSlope(truth, fit, epsilon);
    if (Math.abs(score) <= tolerance) return finish(epsilon, score, iterations);
    if (score > 0) lo = epsilon; else hi = epsilon;
    const next = epsilon - score / slope;
    epsilon = Number.isFinite(next) && next > lo && next < hi ? next : lo + (hi - lo) / 2;
    if (!Number.isFinite(epsilon)) throw new RangeError('TMLE root is not representable');
  }
  throw new Error('TMLE score did not converge within 200 iterations');
}
