import test from 'node:test';
import assert from 'node:assert/strict';
import {caseData as _caseData,caseAt as _caseAt,solveCase as _solveCase,countsCsv as _countsCsv,recordsCsv as _recordsCsv,caseMeanDirection as _caseMeanDirection,caseDirections as _caseDirections,caseProjection as _caseProjection,caseEmpiricalMoments as _caseEmpiricalMoments} from '../shared/js/case-study.js';
import { DEFAULT_MODEL, joint, aipw } from '../shared/js/math.js';

// Explicit preserved synthetic fixtures test the general algebra, not the current clinical source.
const CASE_SIZE=200,CASE_COUNTS=Object.freeze(joint(DEFAULT_MODEL).map(({x,a,y,p})=>Object.freeze({x,a,y,n:Math.round(200*p)})));
const caseData=(rows=CASE_COUNTS)=>_caseData(rows),solveCase=(rows=CASE_COUNTS)=>_solveCase(rows),countsCsv=(rows=CASE_COUNTS)=>_countsCsv(rows),recordsCsv=(rows=CASE_COUNTS)=>_recordsCsv(rows),caseDirections=(rows=CASE_COUNTS)=>_caseDirections(rows),caseEmpiricalMoments=(rows=CASE_COUNTS)=>_caseEmpiricalMoments(rows);
const caseAt=(epsilon=0,rows=CASE_COUNTS)=>_caseAt(epsilon,rows),caseMeanDirection=(index=3,t=.01,rows=CASE_COUNTS)=>_caseMeanDirection(index,t,rows),caseProjection=(rows=CASE_COUNTS,coefficient=1)=>_caseProjection(rows,coefficient);

const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const sum = values => values.reduce((s, v) => s + v, 0);
const copy = () => CASE_COUNTS.map(c => ({ ...c }));
const changed = () => [12, 20, 8, 10, 25, 15, 20, 30].map((n, i) => ({ ...CASE_COUNTS[i], n }));

test('preserved synthetic fixture: saturated empirical gradient moments are distinct from the misspecified initial function', () => {
  const moments = caseEmpiricalMoments();
  near(moments.eifMean, 0);
  near(moments.eifSecondMoment, 1.0975);
  near(moments.eifVariance, 1.0975);
  near(moments.se, .07407766195014527);
  assert.deepEqual(moments.values.map(v => Number(v.toFixed(6))), [.775,-.475,-4.1,.9,1.1,-3.9,-.525,.725]);
  assert(Math.abs(moments.eifVariance - 1.5824) > .1, 'do not conflate different functions');
});

test('preserved synthetic fixture: case counts are immutable integer counts generated from the unique default model', () => {
  assert.equal(CASE_SIZE, 200);
  assert.deepEqual(CASE_COUNTS.map(c => c.n), [24, 56, 4, 16, 16, 4, 40, 40]);
  const base = joint(DEFAULT_MODEL);
  CASE_COUNTS.forEach((c, i) => { near(c.n / CASE_SIZE, base[i].p); assert.ok(Object.isFrozen(c)); });
  assert.ok(Object.isFrozen(CASE_COUNTS));
  assert.throws(() => { CASE_COUNTS[0].n = 1; });
});

test('preserved synthetic fixture: initial fits are the two empirical arm risks, with empirical X and treatment probabilities', () => {
  const d = caseData();
  assert.equal(d.n, 200); near(d.marginalRisk, 116 / 200);
  near(sum(d.cells.map(c => c.p)), 1);
  assert.deepEqual(d.groups.map(g => g.n), [80, 20, 20, 80]);
  assert.deepEqual(d.groups.map(g => g.events), [56, 16, 4, 40]);
  d.groups.map(g => g.h).forEach((h, i) => near(h, [-1.25, 5, -5, 1.25][i]));
  assert.deepEqual(d.initialFit.q, [[.6, .6], [.56, .56]]);
  near(d.initialEstimate, -.04); near(d.observedDifference, -.04);
  d.groups.forEach(g => near(g.offset, Math.log(g.initialQ / (1 - g.initialQ))));
});

test('preserved synthetic fixture: counts are canonicalised without mutating caller arrays; returned states are independent', () => {
  const rows = copy().reverse(), before = JSON.stringify(rows);
  const a = caseData(rows), b = caseData(rows);
  assert.equal(JSON.stringify(rows), before);
  assert.deepEqual(a.cells, caseData().cells);
  a.initialFit.q[0][0] = .1; a.empiricalModel.g[0] = .9;
  near(b.initialFit.q[0][0], .6); near(b.empiricalModel.g[0], .2);
});

test('preserved synthetic fixture: malformed, absent, zero, fractional, negative, duplicate and unsafe counts fail explicitly', () => {
  for (const rows of [null, [], copy().slice(1), [...copy(), { ...CASE_COUNTS[0] }]]) assert.throws(() => caseData(rows));
  for (const value of [0, -1, .5, NaN, Infinity, '24', Number.MAX_SAFE_INTEGER + 1]) {
    const rows = copy(); rows[0].n = value; assert.throws(() => caseData(rows));
  }
  let rows = copy(); rows[0].x = 2; assert.throws(() => caseData(rows));
  rows = copy(); rows[0] = { ...rows[1] }; assert.throws(() => caseData(rows));
  rows = copy(); rows[0].n = Number.MAX_SAFE_INTEGER; assert.throws(() => caseData(rows));
});

test('preserved synthetic fixture: the initial score and EIF moments have independent fixed-table expectations', () => {
  const at = caseAt();
  near(at.score, .24); near(at.slope, -1.52); near(at.eifMean, .24);
  near(at.eifSecondMoment, 1.64); near(at.eifVariance, 1.5824);
  near(at.eifVariance, at.eifSecondMoment - at.eifMean ** 2);
  near(at.se, Math.sqrt(1.5824 / 200));
  near(at.aipw, .2); near(at.aipw, aipw(at.empiricalModel, at.updatedFit));
  near(sum(at.groups.map(g => g.weightedResidual)), 48);
  assert.deepEqual(at.groups.map(g => g.predictedEvents), [48, 11.200000000000001, 12, 44.800000000000004]);
});

test('preserved synthetic fixture: log likelihood derivative equals average score and its curvature equals slope', () => {
  for (const rows of [CASE_COUNTS, changed()]) for (const epsilon of [-.3, 0, .16, .4]) {
    const step = 1e-5, at = caseAt(epsilon, rows);
    const derivative = (caseAt(epsilon + step, rows).logLikelihood - caseAt(epsilon - step, rows).logLikelihood) / (2 * step);
    const curvature = (caseAt(epsilon + step, rows).score - caseAt(epsilon - step, rows).score) / (2 * step);
    near(derivative, at.score, 3e-9); near(curvature, at.slope, 5e-9);
    assert.ok(at.slope < 0);
  }
});

test('preserved synthetic fixture: updates keep empirical X and treatment mechanisms fixed and keep predictions in range', () => {
  const rows = changed(), original = JSON.stringify(rows), data = caseData(rows);
  for (const epsilon of [-1, -.5, 0, .5, 1]) {
    const at = caseAt(epsilon, rows);
    assert.deepEqual(at.updatedFit.px, data.empiricalModel.px);
    assert.deepEqual(at.updatedFit.g, data.empiricalModel.g);
    assert.deepEqual(at.initialFit, data.initialFit);
    for (const g of at.groups) {
      assert.ok(g.qUpdated > 0 && g.qUpdated < 1);
      near(g.predictedEvents, g.n * g.qUpdated);
      near(g.residualTotal, g.events - g.predictedEvents);
      near(g.scoreContribution, g.h * g.residualTotal / data.n);
    }
    near(at.eifMean, at.score);
    near(at.aipw, aipw(at.empiricalModel, at.updatedFit));
  }
  assert.equal(JSON.stringify(rows), original);
  for (const epsilon of [NaN, Infinity, -Infinity, null, '0', 1e308]) assert.throws(() => caseAt(epsilon));
  assert.throws(() => caseAt(100), /boundary/);
});

test('preserved synthetic fixture: the sample score root produces the independently specified update and empirical equation', () => {
  const result = solveCase();
  assert.equal(result.converged, true); assert.ok(result.iterations > 0 && result.iterations <= 200);
  near(result.epsilon, .16223923963495762, 1e-11);
  [.5504938029381764, .7412274916740937, .3999361660282145, .6092024772922973].forEach((q, i) => near(result.groups[i].qUpdated, q, 1e-11));
  near(result.estimate, .2, 1e-11); near(result.score, 0, 1e-12); near(result.eifMean, 0, 1e-12);
  near(result.eifSecondMoment, 1.2192623957849897, 1e-10);
  near(result.se, .07807888305377421, 1e-11);
  assert.ok(result.logLikelihood > caseAt(0).logLikelihood);
  assert.notEqual(result.groups[0].qUpdated, result.groups[0].qObserved);
});

test('preserved synthetic fixture: changed observations change initial fits and the solved result instead of querying an oracle', () => {
  const rows = changed(), d = caseData(rows), solved = solveCase(rows);
  assert.equal(d.n, 140);
  near(d.marginalRisk, 75 / 140);
  near(d.groups[0].qObserved, 20 / 32);
  near(d.groups[0].gHat, 18 / 50);
  near(d.initialFit.q[0][1], 35 / 72);
  near(d.initialFit.q[1][0], 40 / 68);
  assert.ok(Math.abs(solved.estimate - .2) > .01);
  assert.ok(Math.abs(solved.epsilon - solveCase().epsilon) > .01);
  near(solved.score, 0, 1e-12); near(solved.eifMean, 0, 1e-12);
  near(solved.aipw, solved.estimate, 1e-12);
});

test('preserved synthetic fixture: an already solved empirical initial regression is left at epsilon zero', () => {
  const rows = [4, 4, 6, 6, 3, 3, 9, 9].map((n, i) => ({ ...CASE_COUNTS[i], n }));
  const solved = solveCase(rows);
  assert.equal(solved.iterations, 0); assert.equal(solved.epsilon, 0);
  near(solved.estimate, 0); near(solved.score, 0);
});

test('preserved synthetic fixture: exported record and count CSVs preserve the fixed observations and can be reaggregated', () => {
  assert.equal(countsCsv().trim().split('\n').length, 9);
  const lines = recordsCsv().trim().split('\n');
  assert.equal(lines.length, 201); assert.equal(lines[0], 'id,x,a,y');
  const counts = new Map();
  lines.slice(1).forEach((line, i) => {
    const [id, x, a, y] = line.split(',').map(Number); assert.equal(id, i + 1);
    const key = `${x},${a},${y}`; counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  CASE_COUNTS.forEach(c => assert.equal(counts.get(`${c.x},${c.a},${c.y}`), c.n));
  assert.equal(recordsCsv(changed()).trim().split('\n').length, 141);
});

test('preserved synthetic fixture: case mean directions retain the binary risk target at positive, zero and negative positions', () => {
  for (let i = 0; i < 8; i++) for (const t of [-.01, 0, .1]) {
    const d = caseMeanDirection(i, t);
    near(sum(d.cells.map(c => c.h)), 0); near(sum(d.cells.map(c => c.p * c.S)), 0);
    near(d.derivative, CASE_COUNTS[i].y - .58); near(d.pairing, d.derivative);
    near(d.delta, t * d.derivative); near(d.updatedRisk, .58 + t * d.derivative);
    if (t === 0) assert.equal(d.quotient, null); else near(d.quotient, d.derivative);
  }
  for (const index of [-1, 8, .5, NaN]) assert.throws(() => caseMeanDirection(index));
  assert.throws(() => caseMeanDirection(0, -1)); assert.throws(() => caseMeanDirection(0, 1));
});

test('preserved synthetic fixture: all eight point and seven independent contrast directions use direct perturbed targets', () => {
  for (const rows of [CASE_COUNTS, changed()]) {
    const d = caseDirections(rows);
    assert.equal(d.points.length, 8); assert.equal(d.contrasts.length, 7);
    for (const r of [...d.points, ...d.contrasts]) {
      near(sum(r.h), 0); near(r.scoreMean, 0); near(r.numerical, r.paired, 2e-8);
    }
    d.points.forEach((r, i) => near(r.paired, d.D[i]));
    d.contrasts.forEach((r, i) => near(r.paired, d.D[i] - d.D[7]));
  }
});

test('preserved synthetic fixture: the known-g projection drops only the extra treatment component without modifying the final data model', () => {
  for (const rows of [CASE_COUNTS, changed()]) for (const coefficient of [-2, 0, 1, 2]) {
    const before = JSON.stringify(rows), p = caseProjection(rows, coefficient);
    assert.equal(p.dimension, 5); assert.ok(p.maxError < 1e-12);
    p.projected.forEach((v, i) => {
      near(v, p.D[i]); near(p.removed[i], coefficient * p.treatmentPart[i]);
    });
    assert.ok(p.projectedSecondMoment <= p.candidateSecondMoment + 1e-12);
    assert.deepEqual(p.empiricalModel.g, caseData(rows).empiricalModel.g);
    assert.equal(JSON.stringify(rows), before);
  }
  near(caseProjection().projectedSecondMoment, 1.0975);
});
