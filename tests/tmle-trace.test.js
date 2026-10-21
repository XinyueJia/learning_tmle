import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc, prepareRhc} from '../shared/js/rhc.js';
import {tmleTrace, TMLE_TRACE_TOLERANCE} from '../shared/js/tmle-trace.js';

const near = (actual, expected, tolerance = 1e-12) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`,
);
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const fixture = () => ({
  n: 4,
  rows: [
    {a: 0, y: 0, x: 0, age: 40, race: 'white'},
    {a: 0, y: 1, x: 1, age: 50, race: 'black'},
    {a: 1, y: 0, x: 1, age: 60, race: 'other'},
    {a: 1, y: 1, x: 0, age: 70, race: 'white'},
  ],
  g: [.5, .5, .5, .5], q0: [.25, .25, .25, .25], q1: [.75, .75, .75, .75], H: [-2, -2, 2, 2],
});
// Independent Bernoulli likelihood, without using trace-derived predictions.
function likelihood(fit, epsilon) {
  return mean(fit.rows.map((row, i) => {
    const q = row.a ? fit.q1[i] : fit.q0[i];
    const h = row.a ? 1 / fit.g[i] : -1 / (1 - fit.g[i]);
    const p = 1 / (1 + Math.exp(-(Math.log(q / (1 - q)) + epsilon * h)));
    return row.y * Math.log(p) + (1 - row.y) * Math.log(1 - p);
  }));
}

test('a hand-calculable fixture traces every observed-row operation and initial summary', () => {
  const {vectors: v, summary: s} = tmleTrace(fixture());
  assert.equal(TMLE_TRACE_TOLERANCE, 1e-12);
  assert.deepEqual(v.a, [0, 0, 1, 1]);
  assert.deepEqual(v.y, [0, 1, 0, 1]);
  assert.deepEqual(v.qa, [.25, .25, .75, .75]);
  assert.deepEqual(v.h0, [-2, -2, -2, -2]);
  assert.deepEqual(v.h1, [2, 2, 2, 2]);
  assert.deepEqual(v.h, [-2, -2, 2, 2]);
  v.offset.forEach((value, i) => near(value, i < 2 ? -Math.log(3) : Math.log(3)));
  for (let i = 0; i < 4; i++) {
    near(v.offset0[i], -Math.log(3));
    near(v.offset1[i], Math.log(3));
    near(v.shift0[i], 0);
    near(v.shift1[i], 0);
    near(v.eta0[i], v.offset0[i]);
    near(v.eta1[i], v.offset1[i]);
    near(v.shift[i], 0);
    near(v.eta[i], v.offset[i]);
    near(v.qstar_a[i], v.qa[i]);
    near(v.qstar0[i], .25);
    near(v.qstar1[i], .75);
    near(v.residual[i], [-.25, .75, -.75, .25][i]);
    near(v.score_contribution[i], [.5, -1.5, -1.5, .5][i]);
    near(v.contrast[i], .5);
    near(v.centred[i], 0);
    near(v.eif[i], [.5, -1.5, -1.5, .5][i]);
  }
  near(s.initial_estimate, .5);
  near(s.initial_score, -.5);
  near(s.aipw, 0);
  near(s.estimate, .5);
  near(s.score, -.5);
  near(s.slope, -.75);
  near(s.eif_mean, -.5);
  near(s.centred_mean, 0);
  near(s.variance, 1);
  near(s.se, .5);
  near(s.min_q, .25);
  near(s.max_q, .75);
  near(s.log_likelihood, .5 * Math.log(.1875));
});

test('the analytic score root uses a negative epsilon and updates both arms consistently', () => {
  const epsilon = -Math.log(3) / 2;
  const {vectors: v, summary: s} = tmleTrace(fixture(), epsilon);
  for (const key of ['qstar0', 'qstar1', 'qstar_a']) v[key].forEach(value => near(value, .5));
  near(s.score, 0);
  near(s.eif_mean, 0);
  near(s.estimate, 0);
  near(s.variance, 1);
  near(s.se, .5);
  near(s.log_likelihood, -Math.log(2));
  assert.ok(s.log_likelihood > tmleTrace(fixture()).summary.log_likelihood);
});

test('positive and negative fluctuations preserve actual treatment selection and likelihood derivatives', () => {
  const fit = fixture();
  // Different row-specific g values make accidental scalar or treatment-only weights visible.
  fit.g = [.2, .4, .7, .8];
  delete fit.H;
  for (const epsilon of [-.1, 0, .1]) {
    const {vectors: v, summary: s} = tmleTrace(fit, epsilon), step = 1e-5;
    near(s.log_likelihood, likelihood(fit, epsilon));
    near((likelihood(fit, epsilon + step) - likelihood(fit, epsilon - step)) / (2 * step), s.score, 1e-9);
    near((tmleTrace(fit, epsilon + step).summary.score - tmleTrace(fit, epsilon - step).summary.score) / (2 * step), s.slope, 1e-9);
    near(s.eif_mean, s.score);
    near(s.centred_mean, 0);
    assert.ok(s.slope < 0);
    for (let i = 0; i < fit.n; i++) {
      assert.ok(v.h0[i] < 0 && v.h1[i] > 0);
      assert.equal(v.qstar_a[i], fit.rows[i].a ? v.qstar1[i] : v.qstar0[i]);
      near(v.shift[i], epsilon * v.h[i]);
      near(v.shift0[i], epsilon * v.h0[i]);
      near(v.shift1[i], epsilon * v.h1[i]);
      near(v.eta0[i], Math.log(fit.q0[i] / (1 - fit.q0[i])) + epsilon * v.h0[i]);
      near(v.eta1[i], Math.log(fit.q1[i] / (1 - fit.q1[i])) + epsilon * v.h1[i]);
      near(v.qstar0[i], 1 / (1 + Math.exp(-v.eta0[i])));
      near(v.qstar1[i], 1 / (1 + Math.exp(-v.eta1[i])));
      near(v.residual[i], fit.rows[i].y - v.qstar_a[i]);
      near(v.eif[i], v.h[i] * v.residual[i] + v.qstar1[i] - v.qstar0[i] - s.estimate);
      assert.ok(v.qstar0[i] > 0 && v.qstar0[i] < 1 && v.qstar1[i] > 0 && v.qstar1[i] < 1);
    }
    assert.equal(s.initial_estimate, tmleTrace(fit).summary.initial_estimate);
    assert.equal(s.aipw, tmleTrace(fit).summary.aipw);
  }
  assert.ok(tmleTrace(fit, .1).summary.estimate > tmleTrace(fit).summary.estimate);
  assert.ok(tmleTrace(fit, -.1).summary.estimate < tmleTrace(fit).summary.estimate);
});

const source = readFileSync(new URL('../shared/data/public/rhc/source.csv', import.meta.url), 'utf8');
const rows = readRhc(source), publicFit = prepareRhc(rows);

test('the complete public cohort matches fixed independent RHC regression references', () => {
  const initial = tmleTrace(publicFit);
  assert.equal(initial.summary.n, 5735);
  assert.equal(initial.vectors.y.reduce((sum, value) => sum + value, 0), 1918);
  assert.deepEqual(initial.shown.map(row => row.a), [0, 1, 1, 0, 1, 0]);
  assert.deepEqual(initial.shown.map(row => row.y), [0, 0, 0, 0, 1, 0]);
  near(initial.summary.initial_estimate, .0864988559023306);
  near(initial.summary.score, .0034691393067677457);
  near(initial.summary.aipw, .08996799520909834);
  near(initial.summary.estimate, .0864988559023306);
  const targeted = tmleTrace(publicFit, .003576966662876657), s = targeted.summary;
  near(s.estimate, .08997972473530443);
  near(mean(targeted.vectors.qstar0), .30058304496920574);
  near(mean(targeted.vectors.qstar1), .39056276970451026);
  near(s.se, .013082375165239404);
  near(s.score, 0, TMLE_TRACE_TOLERANCE);
  near(s.eif_mean, 0, TMLE_TRACE_TOLERANCE);
  near(s.aipw, .08996799520909834);
  near(s.centred_mean, 0);
  // Rebuild the full empirical score using only source A/Y and both updated arms.
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const h = rows[i].a ? 1 / publicFit.g[i] : -1 / (1 - publicFit.g[i]);
    total += h * (rows[i].y - (rows[i].a ? targeted.vectors.qstar1[i] : targeted.vectors.qstar0[i]));
  }
  near(s.score, total / rows.length);
  for (const values of Object.values(targeted.vectors)) assert.equal(values.length, 5735);
});

test('pagination preserves all vector rows, patient identities, and whole-cohort summaries', () => {
  const first = tmleTrace(publicFit, .01), second = tmleTrace(publicFit, .01, {start: 6, count: 6});
  assert.deepEqual(first.rowNumbers, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(second.rowNumbers, [7, 8, 9, 10, 11, 12]);
  assert.deepEqual(first.summary, second.summary);
  assert.deepEqual(first.vectors, second.vectors);
  for (const row of second.shown) {
    const i = row.row - 1;
    assert.equal(row.age, rows[i].age);
    assert.equal(row.race, rows[i].race);
    assert.equal(row.x, rows[i].x);
    for (const [name, values] of Object.entries(second.vectors)) assert.equal(row[name], values[i]);
  }
  const tail = tmleTrace(publicFit, .01, {start: 5733, count: 6});
  assert.deepEqual(tail.rowNumbers, [5734, 5735]);
  assert.equal(tail.count, 2);
  assert.equal(tail.requestedCount, 6);
  assert.deepEqual(tail.summary, first.summary);
});

test('a frozen fit is unchanged and returned vectors never alias its arrays', () => {
  const fit = fixture(), before = structuredClone(fit);
  fit.rows.forEach(Object.freeze);
  Object.values(fit).filter(Array.isArray).forEach(Object.freeze);
  Object.freeze(fit);
  const trace = tmleTrace(fit, .01);
  assert.deepEqual(fit, before);
  for (const key of ['g', 'q0', 'q1']) assert.notEqual(trace.vectors[key], fit[key]);
  trace.vectors.a[0] = 1;
  trace.vectors.y[0] = 1;
  trace.vectors.g[0] = .9;
  trace.vectors.q0[0] = .9;
  assert.deepEqual(fit, before);
});

test('invalid dimensions, binary observations, probabilities, weights and windows fail explicitly', () => {
  for (const mutate of [
    fit => {fit.n = 0;}, fit => {fit.n = 5;}, fit => {fit.rows = [];},
    fit => {fit.rows[0].a = 2;}, fit => {fit.rows[0].y = NaN;},
    fit => {fit.g.pop();}, fit => {fit.q0 = null;}, fit => {fit.q1.push(.5);},
    fit => {fit.g[0] = 0;}, fit => {fit.g[0] = 1;}, fit => {fit.g[0] = Infinity;},
    fit => {fit.q0[0] = 0;}, fit => {fit.q1[0] = 1;}, fit => {fit.q1[0] = NaN;},
    fit => {fit.H.pop();}, fit => {fit.H[0] = 2;}, fit => {fit.H[0] = NaN;},
    fit => {fit.g[0] = Number.MIN_VALUE; delete fit.H;},
  ]) {
    const fit = fixture(); mutate(fit); assert.throws(() => tmleTrace(fit));
  }
  for (const epsilon of [NaN, Infinity, -Infinity, 1000, -1000, Number.MAX_VALUE]) {
    assert.throws(() => tmleTrace(fixture(), epsilon));
  }
  for (const options of [{start: -1}, {start: 4}, {start: .5}, {count: 0}, {count: -1}, {count: 1.5}, {count: Infinity}]) {
    assert.throws(() => tmleTrace(fixture(), 0, options));
  }
  assert.throws(() => tmleTrace(null));
  // The unobserved arm must also remain an interior probability.
  const fit = fixture(); fit.q1[0] = 1 - Number.EPSILON;
  assert.throws(() => tmleTrace(fit, 1), /probability boundary/);
});
