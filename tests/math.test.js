import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../shared/js/math.js';

const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const sum = xs => xs.reduce((a, b) => a + b, 0);
const base = () => m.cloneModel();
const dot = (p, f, h) => sum(p.map((w, i) => w * f[i] * h[i]));
function tiltedCells(cells, score, t) {
  const weights = cells.map((c, i) => c.p * Math.exp(t * score[i]));
  const z = sum(weights);
  return cells.map((c, i) => ({ ...c, p: weights[i] / z }));
}
const derivative = fn => (fn(1e-5) - fn(-1e-5)) / 2e-5;
const probA = (model, a, x) => a ? model.g[x] : 1 - model.g[x];
const h = (model, a, x) => a ? 1 / model.g[x] : -1 / (1 - model.g[x]);

test('defaults, immutable constants, independent cloning and probability factorisation', () => {
  assert.deepEqual(m.DEFAULT_MODEL, { px: [.5, .5], g: [.2, .8], q: [[.7, .2], [.8, .5]] });
  assert.deepEqual(m.MEAN_MODEL.values, [0, 1]);
  m.MEAN_MODEL.probabilities.forEach((p, y) => near(p, [84/200, 116/200][y]));
  assert.ok(Object.isFrozen(m.MEAN_MODEL.probabilities));
  const model = base(), cells = m.joint(model);
  near(sum(cells.map(c => c.p)), 1);
  for (const c of cells) near(c.p, .5 * (c.a ? model.g[c.x] : 1 - model.g[c.x]) * (c.y ? model.q[c.a][c.x] : 1 - model.q[c.a][c.x]));
  const restored = m.fromJoint([...cells].reverse());
  for (const key of ['px', 'g']) restored[key].forEach((v, i) => near(v, model[key][i]));
  restored.q.forEach((row, a) => row.forEach((v, x) => near(v, model.q[a][x])));
  model.q[0][0] = .1;
  near(m.DEFAULT_MODEL.q[0][0], .7);
  assert.ok(Object.isFrozen(m.DEFAULT_MODEL.q[0]));
});

test('mean contamination has an exact first-order identity across its legal interval', () => {
  const values = [0, 1, 3], p = [.2, .5, .3];
  near(m.mean(values, p), 1.4);
  for (let index = 0; index < 3; index++) {
    for (const t of [-.1, 0, .05, .3, 1]) {
      const pt = m.contaminate(p, index, t);
      near(m.mean(values, pt), 1.4 + t * (values[index] - 1.4));
      near(sum(pt), 1);
    }
    const s = m.pointScore(p, index);
    near(dot(p, s, [1, 1, 1]), 0);
    near(dot(p, values.map(y => y - 1.4), s), values[index] - 1.4);
  }
  assert.deepEqual(m.contaminate(p, 1, 1), [0, 1, 0]);
  assert.throws(() => m.contaminate(p, 0, -.26));
  assert.throws(() => m.contaminate(p, 0, 1.01));
});

test('ATE and observational contrast have independent expected values', () => {
  near(m.ate(base()), .2);
  // Treatment X weights are (.2,.8), control X weights (.8,.2).
  near(m.naive(base()), .2 * .8 + .8 * .5 - (.8 * .7 + .2 * .2));
  const model = base(); model.px = [.3, .7];
  near(m.ate(model), .3 * .1 + .7 * .3);
});

test('all eight contamination derivatives give the EIF, not a finite-t linear substitute', () => {
  const model = base(), cells = m.joint(model), p = cells.map(c => c.p);
  for (let i = 0; i < 8; i++) {
    const c = cells[i];
    const dx = model.q[1][c.x] - model.q[0][c.x] - .2;
    const dy = (c.a ? 1 / model.g[c.x] : -1 / (1 - model.g[c.x])) * (c.y - model.q[c.a][c.x]);
    const result = m.eif(model, c);
    near(result.dx, dx); near(result.dy, dy); near(result.total, dx + dy);
    near(derivative(t => m.ate(m.fromJoint(cells.map((cell, j) => ({ ...cell, p: m.contaminate(p, i, t)[j] }))))), dx + dy, 5e-8);
  }
  near(m.expectation(cells, c => m.eif(model, c).total), 0);
  const pt = m.contaminate(p, 0, .2);
  const actual = m.ate(m.fromJoint(cells.map((c, i) => ({ ...c, p: pt[i] }))));
  assert.ok(Math.abs(actual - (.2 + .2 * m.eif(model, cells[0]).total)) > .005);
});

test('EIF represents seven independent directions and arbitrary seven-dimensional scores', () => {
  const model = base(), cells = m.joint(model), p = cells.map(c => c.p), d = cells.map(c => m.eif(model, c).total);
  const basis = Array.from({ length: 7 }, (_, j) => p.map((w, i) => (i === j ? 1 / w : 0) - 1));
  const scores = [...basis, p.map((_, i) => sum(basis.map((b, j) => Math.sin(j + 1) * b[i])))];
  for (const score of scores) {
    near(dot(p, score, p.map(() => 1)), 0);
    near(derivative(t => m.ate(m.fromJoint(tiltedCells(cells, score, t)))), dot(p, d, score), 3e-7);
  }
});

test('an arbitrary score decomposes into all three conditional tangent components', () => {
  const model = base(), cells = m.joint(model), p = cells.map(c => c.p);
  const raw = [2, -1, 4, 3, -.5, 7, -2, 1];
  const centre = sum(p.map((w, i) => w * raw[i]));
  const s = raw.map(v => v - centre);
  const conditional = predicate => sum(cells.map((c, i) => predicate(c) ? c.p * s[i] : 0)) / sum(cells.map(c => predicate(c) ? c.p : 0));
  const sx = cells.map(c => conditional(o => o.x === c.x));
  const sa = cells.map((c, i) => conditional(o => o.x === c.x && o.a === c.a) - sx[i]);
  const sy = s.map((v, i) => v - sx[i] - sa[i]);
  const dx = cells.map(c => model.q[1][c.x] - model.q[0][c.x] - .2);
  const dy = cells.map(c => h(model, c.a, c.x) * (c.y - model.q[c.a][c.x]));
  near(dot(p, sx, sa), 0); near(dot(p, sx, sy), 0); near(dot(p, sa, sy), 0);
  for (let x = 0; x < 2; x++) {
    near(sum(cells.map((c, i) => c.x === x ? c.p * sa[i] : 0)), 0);
    for (let a = 0; a < 2; a++) near(sum(cells.map((c, i) => c.x === x && c.a === a ? c.p * sy[i] : 0)), 0);
  }
  for (const [component, expected] of [[sx, dot(p, dx, sx)], [sa, 0], [sy, dot(p, dy, sy)]]) {
    near(derivative(t => m.ate(m.fromJoint(tiltedCells(cells, component, t)))), expected, 2e-9);
  }
});

test('jointTilt follows a general centred joint score and its ATE derivative', () => {
  const model = base(), cells = m.joint(model), p = cells.map(c => c.p);
  const raw = [2, -1, 4, 3, -.5, 7, -2, 1];
  const centre = sum(p.map((w, i) => w * raw[i]));
  const score = raw.map(v => v - centre);
  const origin = m.joint(m.jointTilt(model, score, 0));
  origin.forEach((c, i) => near(c.p, cells[i].p));
  const plus = m.joint(m.jointTilt(model, score, 1e-5));
  const minus = m.joint(m.jointTilt(model, score, -1e-5));
  score.forEach((v, i) => near((Math.log(plus[i].p) - Math.log(minus[i].p)) / 2e-5, v, 1e-9));
  const independentDerivative = sum(cells.map((c, i) => {
    const dx = model.q[1][c.x] - model.q[0][c.x] - .2;
    const dy = h(model, c.a, c.x) * (c.y - model.q[c.a][c.x]);
    return c.p * (dx + dy) * score[i];
  }));
  near(derivative(t => m.ate(m.jointTilt(model, score, t))), independentDerivative, 2e-9);
  for (let t = -3; t <= 3; t += .125) {
    const tilted = m.jointTilt(model, score, t), actual = m.joint(tilted);
    const direct = cells.map((c, i) => c.p * Math.exp(t * score[i]));
    const z = sum(direct);
    near(sum(actual.map(c => c.p)), 1);
    actual.forEach((c, i) => { assert.ok(c.p > 0); near(c.p, direct[i] / z, 2e-15); });
  }
  const general = m.jointTilt(model, score, .2);
  assert.notDeepEqual(general.px, model.px);
  assert.notDeepEqual(general.g, model.g);
  assert.notDeepEqual(general.q, model.q);
  assert.deepEqual(model, m.DEFAULT_MODEL);
});

test('jointTilt rejects malformed scores and unrepresentable paths without clipping', () => {
  const model = base(), cells = m.joint(model);
  const raw = [2, -1, 4, 3, -.5, 7, -2, 1];
  const centre = sum(cells.map((c, i) => c.p * raw[i]));
  const score = raw.map(v => v - centre);
  for (const call of [
    () => m.jointTilt(model, score.slice(1), .1),
    () => m.jointTilt(model, score.map((v, i) => i === 0 ? NaN : v), .1),
    () => m.jointTilt(model, raw, .1),
    () => m.jointTilt(model, score.map(v => v + 1e-8), .1),
    () => m.jointTilt(model, score, Infinity),
    () => m.jointTilt(model, score, Number.MAX_VALUE),
    () => m.jointTilt(model, score, 1000),
  ]) assert.throws(call);
  // The agreed centring tolerance is accepted, without altering supplied scores.
  const smallOffset = score.map(v => v + 1e-11);
  near(m.ate(m.jointTilt(model, smallOffset, .1)), m.ate(m.jointTilt(model, score, .1)));
});

test('conditional tilts have their specified likelihood scores and derivative identities', () => {
  const model = base(), cells = m.joint(model), p = cells.map(c => c.p), d = cells.map(c => m.eif(model, c).total);
  for (const kind of ['X', 'A', 'Y']) {
    const s = cells.map(c => kind === 'X' ? c.x - .5 : kind === 'A' ? c.a - model.g[c.x] : c.y - model.q[c.a][c.x]);
    s.forEach((v, i) => near(m.mechanismScore(model, kind, cells[i]), v));
    near(dot(p, s, p.map(() => 1)), 0);
    const plus = m.joint(m.tilt(model, kind, 1e-5)), minus = m.joint(m.tilt(model, kind, -1e-5));
    s.forEach((v, i) => near((Math.log(plus[i].p) - Math.log(minus[i].p)) / 2e-5, v, 1e-10));
    near(derivative(t => m.ate(m.tilt(model, kind, t))), dot(p, d, s), 1e-10);
    for (const t of [-5, -.5, 0, .5, 5]) {
      const tilted = m.tilt(model, kind, t);
      near(sum(m.joint(tilted).map(c => c.p)), 1);
      if (kind !== 'X') assert.deepEqual(tilted.px, model.px);
      if (kind !== 'A') assert.deepEqual(tilted.g, model.g);
      if (kind !== 'Y') assert.deepEqual(tilted.q, model.q);
    }
  }
});

test('pure treatment tilt preserves ATE and both other mechanisms over a dense range', () => {
  const model = base(); model.px = [.3, .7];
  for (let t = -10; t <= 10; t += .125) {
    const tilted = m.tilt(model, 'A', t);
    assert.deepEqual(tilted.px, model.px); assert.deepEqual(tilted.q, model.q);
    near(m.ate(tilted), .24);
  }
});

test('weighted projection uses the actual known-g tangent space and orthogonal treatment scores', () => {
  const model = base(), cells = m.joint(model), p = cells.map(c => c.p);
  const basis = [cells.map(c => c.x - model.px[1])];
  for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) basis.push(cells.map(c => c.x === x && c.a === a ? c.y - model.q[a][x] : 0));
  const d = cells.map(c => m.eif(model, c).total);
  const u = cells.map(c => (c.x ? -2 : 3) * (c.a - model.g[c.x]));
  const f = d.map((v, i) => v + u[i]);
  for (const b of basis) near(dot(p, u, b), 0);
  const projection = m.project(p, f, basis);
  projection.forEach((v, i) => near(v, d[i]));
  for (const b of basis) near(dot(p, f.map((v, i) => v - projection[i]), b), 0);
  near(dot(p, f, f), dot(p, d, d) + dot(p, u, u));
  near(m.inner(p, f, f), dot(p, f, f));
  // Non-orthogonal, differently scaled basis spans the same space.
  const mixed = basis.map((b, i) => b.map((v, j) => 7 * v + (i ? basis[0][j] : 0)));
  m.project(p, f, mixed).forEach((v, i) => near(v, d[i]));
  assert.deepEqual(m.project(p, f, []), Array(8).fill(0));
  assert.throws(() => m.project(p, f, [basis[0], basis[0]]));
});

test('direct and analytic variance match an independently enumerated second moment', () => {
  for (const g of [[.2, .8], [.5, .5], [.05, .95], [.001, .999]]) {
    const model = base(); model.g = g;
    const psi = .2;
    let expected = 0;
    for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) for (let y = 0; y < 2; y++) {
      const q = model.q[a][x], w = .5 * probA(model, a, x) * (y ? q : 1 - q);
      const d = model.q[1][x] - model.q[0][x] - psi + h(model, a, x) * (y - q);
      expected += w * d * d;
    }
    near(m.varianceDirect(model), expected);
    near(m.varianceAnalytic(model), expected);
  }
  near(m.varianceAnalytic(base()), 1.0975);
});

test('overlap-path variance has an interior optimum rather than universal monotonicity', () => {
  const modelAt = r => { const model = base(); model.g = [r, 1 - r]; return model; };
  const variance = r => m.varianceDirect(modelAt(r));
  // Independent enumeration: p_X=.5 and CATE deviations (-.1,+.1).
  const enumerated = r => {
    let result = 0;
    const g = [r, 1 - r], q = [[.7, .2], [.8, .5]];
    for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) for (let y = 0; y < 2; y++) {
      const weight = .5 * (a ? g[x] : 1 - g[x]) * (y ? q[a][x] : 1 - q[a][x]);
      const d = (x ? .1 : -.1) + (a ? 1 / g[x] : -1 / (1 - g[x])) * (y - q[a][x]);
      result += weight * d * d;
    }
    return result;
  };
  const optimum = Math.sqrt(.16) / (Math.sqrt(.16) + Math.sqrt(.23));
  near(optimum, .454760870464411, 1e-15);
  assert.ok(variance(.05) > variance(.2));
  assert.ok(variance(.45) < variance(.5), 'balance r=.5 need not minimise the variance');
  for (const r of [.05, .2, .45, .5, optimum - .001, optimum + .001]) {
    near(variance(r), enumerated(r));
    assert.ok(variance(optimum) < variance(r), `interior optimum must improve on r=${r}`);
  }
  near(variance(optimum), .01 + .16 / optimum + .23 / (1 - optimum));
  near(-.16 / optimum ** 2 + .23 / (1 - optimum) ** 2, 0, 1e-14);
  near(derivative(t => enumerated(optimum + t)), 0, 1e-8);
  near(derivative(t => variance(optimum + t)), 0, 1e-8);
});

test('population AIPW recovers truth with either correct nuisance, independent of fit.px', () => {
  const truth = base(); truth.px = [.3, .7];
  const correctQ = base(); correctQ.g = [.4, .6]; correctQ.px = [.8, .2];
  const correctG = base(); correctG.q = [[.4, .6], [.6, .3]]; correctG.px = [.8, .2];
  for (const fit of [correctQ, correctG]) near(m.aipw(truth, fit), .24);
});

test('AIPW bias equals the signed nuisance-error product', () => {
  const truth = base(); truth.px = [.3, .7];
  const fit = base(); fit.g = [.4, .6]; fit.q = [[.4, .6], [.6, .3]];
  const bias = sum(truth.px.map((p, x) => p * (fit.g[x] - truth.g[x]) * ((fit.q[1][x] - truth.q[1][x]) / fit.g[x]
    + (fit.q[0][x] - truth.q[0][x]) / (1 - fit.g[x]))));
  near(m.aipw(truth, fit) - .24, bias);
  const raised = base(); raised.g = [.3, .9]; raised.q = raised.q.map(row => row.map(v => v + .05));
  assert.ok(m.aipw(truth, raised) - .24 > 0);
});

test('chapter-eight public helpers expose independently calculated fits, weights and bias', () => {
  const truth = base(), fit = m.fitFromOffsets(truth, .12, .5);
  fit.q.forEach((row, a) => row.forEach((q, x) => near(q, [[.82, .26], [.74, .38]][a][x])));
  fit.g.forEach((g, x) => near(g, [.35, .65][x]));
  assert.deepEqual(fit.px, truth.px);
  near(m.cleverCovariate(fit, 0, 0), -1 / .65);
  near(m.cleverCovariate(fit, 1, 0), 1 / .35);
  near(m.cleverCovariate(fit, 0, 1), -1 / .35);
  near(m.cleverCovariate(fit, 1, 1), 1 / .65);
  const manual = .5 * (.35 - .2) * ((.74 - .8) / .35 + (.82 - .7) / .65)
    + .5 * (.65 - .8) * ((.38 - .5) / .65 + (.26 - .2) / .35);
  near(m.nuisanceBias(truth, fit), manual, 1e-14);
  near(m.nuisanceBias(truth, fit), .001978021978, 1e-12);
  near(m.aipw(truth, fit) - .2, manual, 1e-14);
  near(m.nuisanceBias(truth, m.fitFromOffsets(truth, 0, .5)), 0);
  near(m.nuisanceBias(truth, m.fitFromOffsets(truth, .12, 0)), 0);
  const weightedTruth = base(); weightedTruth.px = [.3, .7];
  const weightedFit = m.fitFromOffsets(weightedTruth, -.06, 1);
  assert.deepEqual(weightedFit.g, [.5, .5]);
  assert.deepEqual(weightedFit.px, [.3, .7]);
  const expected = .3 * (.5 - .2) * (.03 / .5 - .06 / .5)
    + .7 * (.5 - .8) * (.06 / .5 - .03 / .5);
  weightedFit.px = [.8, .2];
  near(m.nuisanceBias(weightedTruth, weightedFit), expected, 1e-14);
  assert.deepEqual(truth, m.DEFAULT_MODEL);
  fit.px[0] = .9;
  near(truth.px[0], .5);
});

test('chapter-eight public helpers reject illegal coordinates, offsets and probabilities', () => {
  const truth = base();
  for (const call of [
    () => m.cleverCovariate({}, 1, 0),
    () => m.cleverCovariate(truth, 2, 0),
    () => m.cleverCovariate(truth, 0, -1),
    () => m.cleverCovariate(truth, '1', 0),
    () => m.cleverCovariate(truth, NaN, 0),
    () => m.cleverCovariate(truth, 0, Infinity),
    () => m.nuisanceBias({}, truth),
    () => m.nuisanceBias(truth, { ...truth, g: [0, .8] }),
    () => m.fitFromOffsets({}, .12, .5),
    () => m.fitFromOffsets(truth, NaN, .5),
    () => m.fitFromOffsets(truth, Infinity, .5),
    () => m.fitFromOffsets(truth, .12, NaN),
    () => m.fitFromOffsets(truth, .12, -.001),
    () => m.fitFromOffsets(truth, .12, 1.001),
    () => m.fitFromOffsets(truth, .3, .5),
    () => m.fitFromOffsets(truth, -.4, .5),
  ]) assert.throws(call);
});

test('logistic fluctuation score is the negative population loss derivative', () => {
  const truth = base(), fit = base(); fit.g = [.35, .65]; fit.q = [[.45, .65], [.55, .35]];
  const loss = epsilon => {
    let value = 0;
    for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) {
      const z = Math.log(fit.q[a][x] / (1 - fit.q[a][x])) + epsilon * h(fit, a, x);
      // Stable softplus(z) - q0*z, using softplus(-z) when z is positive.
      const bernoulliLoss = z >= 0 ? (1 - truth.q[a][x]) * z + Math.log1p(Math.exp(-z)) : -truth.q[a][x] * z + Math.log1p(Math.exp(z));
      value += truth.px[x] * probA(truth, a, x) * bernoulliLoss;
    }
    return value;
  };
  for (const epsilon of [-1, -.2, 0, .4, 1]) {
    near(derivative(t => loss(epsilon + t)), -m.fluctuationScore(truth, fit, epsilon), 5e-10);
    const updated = m.fluctuation(truth, fit, epsilon);
    for (let a = 0; a < 2; a++) for (let x = 0; x < 2; x++) {
      assert.ok(updated.q[a][x] > 0 && updated.q[a][x] < 1);
      near(Math.log(updated.q[a][x] / (1 - updated.q[a][x])), Math.log(fit.q[a][x] / (1 - fit.q[a][x])) + epsilon * h(fit, a, x));
    }
    assert.deepEqual(updated.g, fit.g);
  }
  assert.ok(m.fluctuationScore(truth, fit, -1) > m.fluctuationScore(truth, fit, 1));
  const result = m.tmle(truth, fit);
  assert.ok(result.converged); assert.ok(result.iterations <= 200); near(result.score, 0, 1e-12);
  assert.ok(loss(result.epsilon) <= loss(0));
  assert.ok(loss(result.epsilon) < loss(result.epsilon + .01));
  assert.ok(loss(result.epsilon) < loss(result.epsilon - .01));
});

test('population TMLE has either-nuisance recovery and targeting uses truth.px', () => {
  const truth = base(); truth.px = [.3, .7];
  const qCorrect = base(); qCorrect.g = [.4, .6]; qCorrect.px = [.9, .1];
  const gCorrect = base(); gCorrect.q = [[.4, .6], [.6, .3]]; gCorrect.px = [.9, .1];
  const resultQ = m.tmle(truth, qCorrect); near(resultQ.epsilon, 0); near(resultQ.estimate, .24);
  const resultG = m.tmle(truth, gCorrect); near(resultG.estimate, .24, 2e-12);
  assert.deepEqual(resultG.updated.px, truth.px);
  near(m.expectation(m.joint(truth), c => m.eif(resultG.updated, c).total), 0, 1e-12);
});

test('TMLE converges from severe offsets with a checked bracket', () => {
  const truth = base(), fit = base();
  fit.q = [[.999999, .999999], [.000001, .000001]];
  const result = m.tmle(truth, fit);
  near(result.score, 0, 1e-12); assert.ok(result.converged);
  near(result.estimate, .2, 2e-12);
});

test('stable expit and strict error handling across public APIs', () => {
  near(m.expit(0), .5); assert.equal(m.expit(-1000), 0); assert.equal(m.expit(1000), 1);
  near(m.expit(m.logit(.123)), .123);
  const model = base(), cells = m.joint(model), p = cells.map(c => c.p), f = p.map(() => 1);
  for (const call of [
    () => m.cloneModel({}), () => m.joint({ ...model, g: [0, .8] }),
    () => m.ate({ ...model, q: [[1, .2], [.8, .5]] }), () => m.naive({ ...model, px: [.3, .3] }),
    () => m.mean([1], [.2]), () => m.mean([NaN], [1]), () => m.contaminate([1], 2, .1),
    () => m.pointScore([0, 1], 1), () => m.pointScore([1], -1),
    () => m.fromJoint(cells.slice(1)), () => m.fromJoint(cells.map((c, i) => i === 1 ? cells[0] : c)),
    () => m.eif(model, { x: 0, a: 2, y: 0 }), () => m.expectation(cells, () => NaN),
    () => m.tilt(model, 'Z', 0), () => m.tilt(model, 'X', Infinity), () => m.tilt(model, 'A', 1000),
    () => m.mechanismScore(model, 'Z', cells[0]), () => m.inner(p, [1], f),
    () => m.project(p, f, [Array(8).fill(0)]), () => m.varianceDirect({}), () => m.varianceAnalytic({}),
    () => m.expit(Infinity), () => m.logit(0), () => m.logit(1), () => m.logit(NaN),
    () => m.aipw({}, model), () => m.fluctuation(model, model, NaN),
    () => m.fluctuation(model, model, 1000), () => m.fluctuationScore(model, {}, 0), () => m.tmle(model, {}),
  ]) assert.throws(call);
});


test('RWS binary marginal, event risk and survival complement use the same full model', () => {
  const {values, probabilities:p} = m.MEAN_MODEL;
  near(p[0], 84/200); near(p[1], 116/200);
  // Independent four-group census: (80*.7 + 20*.8 + 20*.2 + 80*.5)/200.
  const risk = (56+16+4+40)/200;
  near(m.mean(values,p), risk);
  for (const z of [0,1]) for (const t of [-.1, 0, .01, .1, .8, 1]) {
    const pt = m.contaminate(p,z,t);
    const expectedRisk = (1-t)*risk+t*z;
    near(m.mean(values,pt), expectedRisk);
    near(m.mean([1,0],pt), 1-expectedRisk);
    near(m.mean(values,pt)-risk, t*(z-risk));
    const score = m.pointScore(p,z), d = values.map(y=>y-risk);
    near(m.inner(p,d,score), z-risk);
    near(m.inner(p,d.map(v=>-v),score), risk-z);
  }
  near(m.mean(values.map(y=>y-risk),p),0);
  const changed=m.cloneModel(); changed.g=[.5,.5];
  // Equal allocation: marginal risk is the arithmetic average of four conditional risks.
  near(m.marginalOutcomeModel(changed).probabilities[1],(.7+.8+.2+.5)/4);
  near(m.MEAN_MODEL.probabilities[1],.58);
});
