import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc, prepareRhc} from '../shared/js/rhc.js';
import {parsePublicCsv} from '../shared/js/public-rws.js';
import {objectLessonData, meanContamination} from '../shared/js/object-data.js';

const source = readFileSync(new URL('../shared/data/public/rhc/source.csv', import.meta.url), 'utf8');
const raw = parsePublicCsv(source.replace(/^""(?=,)/, '"source_row"'));
const rows = readRhc(source), fit = prepareRhc(rows), data = objectLessonData(rows, fit);
const sum = values => values.reduce((total, value) => total + value, 0);
const near = (actual, expected, tolerance = 1e-12) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
  `${actual} != ${expected}`,
);

test('object data retain actual cohort outcomes and the first six source records', () => {
  assert.equal(data.n, 5735);
  assert.equal(data.fullN, raw.length);
  assert.equal(data.mean.sumY, 1918);
  assert.equal(data.mean.sumY, raw.filter(row => row.dth30 === 'Yes').length);
  near(data.mean.meanY, 1918 / 5735);
  near(data.mean.meanD, 0);
  assert.deepEqual(data.rowNumbers, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(data.shown.map(row => row.a), [0, 1, 1, 0, 1, 0]);
  assert.deepEqual(data.shown.map(row => row.y), [0, 0, 0, 0, 1, 0]);
  assert.deepEqual(data.shown.map(row => row.age), [70.25098, 78.17896, 46.09198, 75.33197, 67.90997, 86.07794]);
  for (const row of data.shown) {
    const original = raw[row.index];
    assert.equal(row.rowNumber, Number(original.source_row));
    assert.equal(row.a, +(original.swang1 === 'RHC'));
    assert.equal(row.y, +(original.dth30 === 'Yes'));
    assert.equal(row.x, +(original.sex === 'Male'));
    assert.equal(row.race, original.race);
  }
});

test('page windows share the same full-cohort fit and maintain row alignment without filtering', () => {
  const second = objectLessonData(rows, fit, {start: 6, count: 6});
  assert.deepEqual(second.rowNumbers, [7, 8, 9, 10, 11, 12]);
  assert.equal(second.n, 5735);
  assert.equal(second.initialRiskDifference, data.initialRiskDifference);
  assert.equal(second.mean.meanY, data.mean.meanY);
  assert.deepEqual(second.W, data.W);
  assert.deepEqual(second.g, data.g);
  for (const page of [data, second]) {
    for (const shown of page.shown) {
      const i = shown.index;
      assert.equal(shown.rowNumber, i + 1);
      assert.deepEqual(shown.w, fit.X[i]);
      assert.equal(shown.g, fit.g[i]);
      assert.equal(shown.qa, rows[i].a ? fit.q1[i] : fit.q0[i]);
      assert.equal(shown.influence, rows[i].y - 1918 / 5735);
      assert.equal(shown.age, Number(raw[i].age));
    }
  }
  const tail = objectLessonData(rows, fit, {start: 5733, count: 6});
  assert.deepEqual(tail.rowNumbers, [5734, 5735]);
  assert.equal(tail.count, 2);
  assert.equal(tail.requestedCount, 6);
  assert.equal(objectLessonData(rows, fit, {start: rows.length}).count, 0);
});

test('design and predictions have honest dimensions and select Q(A,W) using actual A', () => {
  assert.equal(data.W.length, 5735);
  assert.equal(data.featureNames.length, 17);
  assert.equal(data.baselineFeatureNames.length, 15);
  assert.ok(data.W.every(row => row.length === 17));
  assert.ok(data.baselineW.every(row => row.length === 15));
  assert.deepEqual(data.W[0].slice(0, 2), [1, 1]);
  near(data.W[0][2], (70.25098 - fit.ageMean) / fit.ageSd);
  assert.deepEqual(data.W[0].slice(3, 5), [0, 0]);
  assert.deepEqual(data.baselineW[0].slice(0, 3), [1, 70.25098, 'white']);
  for (const key of ['A', 'Y', 'g', 'q0', 'q1', 'qa', 'riskDifference']) assert.equal(data[key].length, 5735);
  assert.equal(data.mean.D.length, 5735);
  for (let i = 0; i < rows.length; i++) {
    assert.equal(data.qa[i], data.A[i] === 1 ? data.q1[i] : data.q0[i]);
    near(data.riskDifference[i], data.q1[i] - data.q0[i]);
  }
  near(data.initialRiskDifference, .0864988559023306);
  near(data.initialRiskDifference, sum(data.riskDifference) / 5735);
  assert.deepEqual(data.objects['design-matrix'].dimensions, [5735, 17]);
  assert.deepEqual(data.objects['baseline-w'].dimensions, [5735, 15]);
  assert.deepEqual(data.objects['outcome-vector'].dimensions, [5735, 1]);
  assert.deepEqual(data.objects.risk.dimensions, []);
  assert.equal(data.objects.design, data.objects['design-matrix']);
  assert.equal(data.X, data.W);
  assert.equal(data.a, data.A);
  assert.equal(data.y, data.Y);
  assert.equal(data.objects.y, data.objects.outcomes);
  assert.equal(data.objects['outcome-vector'], data.objects.outcomes);
  assert.equal(data.objects.outcomes.id, 'outcomes');
  assert.equal(data.objects.g, data.objects.propensity);
  assert.equal(data.objects.a, data.objects['treatment-vector']);
  assert.equal(data.objects.scalar, data.objects.risk);
  assert.equal(data.initialEstimate, data.initialRiskDifference);
  assert.equal(data.objects.qa.selection, 'observed-treatment');
  assert.deepEqual(data.objects.qa.sourceIds, rows.map(row => row.a ? 'q1' : 'q0'));
  assert.equal(data.qCoefficients.length, 18);
  assert.equal(data.gCoefficients.length, 17);
  assert.deepEqual(data.objects['q-coefficients'].dimensions, [18, 1]);
  assert.deepEqual(data.objects['g-coefficients'].dimensions, [17, 1]);
  assert.equal(data.objects['q-coefficients'].alignment, 'feature');
  assert.deepEqual(data.objects['q-coefficients'].featureKeys, [...data.featureNames, 'A']);
  assert.deepEqual(data.objects['g-coefficients'].featureKeys, data.featureNames);
  assert.equal(data.predictionA0.length, 5735);
  assert.equal(data.predictionA1.length, 5735);
  assert.ok(data.predictionA0.every(value => value === 0));
  assert.ok(data.predictionA1.every(value => value === 1));
  assert.notEqual(data.predictionA0, data.A);
  assert.notEqual(data.predictionA1, data.A);
  for (const row of data.shown) {
    for (const a of [0, 1]) {
      const linear = [...row.w, a].reduce((total, value, j) => total + value * data.qCoefficients[j], 0);
      near(a ? row.q1 : row.q0, 1 / (1 + Math.exp(-linear)));
    }
  }
});

test('two outcome rows aggregate actual counts without becoming two patient observations', () => {
  const grouped = data.grouped;
  assert.equal(grouped.n, 2);
  assert.equal(grouped.patientN, 5735);
  assert.equal(grouped.alignment, 'outcome');
  assert.deepEqual(grouped.y, [0, 1]);
  assert.deepEqual(grouped.counts, [3817, 1918]);
  assert.deepEqual(grouped.p, [3817 / 5735, 1918 / 5735]);
  assert.equal(grouped.probabilities, grouped.p);
  assert.equal(grouped.values, grouped.y);
  for (const [short, canonical] of Object.entries({p: 'probability', 'y-support': 'support-y', D: 'support-influence', contrib: 'mean-contribution', 'influence-contrib': 'if-contribution'})) {
    assert.equal(data.objects[short], data.objects[canonical]);
  }
  assert.deepEqual(grouped.py, [0, 1918 / 5735]);
  near(sum(grouped.p), 1);
  near(sum(grouped.py), data.mean.meanY);
  near(sum(grouped.pD), 0);
  near(grouped.D[0], -1918 / 5735);
  near(grouped.D[1], 3817 / 5735);
  assert.notEqual(sum(grouped.D) / 2, data.mean.meanD);
  assert.deepEqual(data.objects.probability.dimensions, [2, 1]);
  assert.equal(data.objects.probability.alignment, 'outcome');
  assert.equal(data.objects.influence.alignment, 'patient');
});

test('contamination distinguishes fixed old D under new weights from re-centred new D', () => {
  for (const z of [0, 1]) for (const t of [0, .1, .75, 1]) {
    const change = meanContamination(data, {z, t});
    const mu = 1918 / 5735, expected = (1 - t) * mu + t * z;
    assert.equal(change.patientN, 5735);
    assert.equal(change.n, 2);
    assert.deepEqual(change.y, [0, 1]);
    assert.deepEqual(change.originalD, [-mu, 1 - mu]);
    near(change.newMean, expected);
    near(change.linearMean, expected);
    near(change.delta, t * (z - mu));
    near(change.oldMeanD, t * (z - mu));
    near(change.newMeanD, 0);
    near(change.originalMeanD, 0);
    near(change.probabilitySum, 1);
    near(sum(change.weightedY), expected);
    near(sum(change.weightedOldD), t * (z - mu));
    if (t === 0) assert.equal(change.rate, null);
    else near(change.rate, z - mu);
    for (let i = 0; i < 2; i++) {
      near(change.newP[i], change.retainedP[i] + change.addedP[i]);
      near(change.pointP[i], +(i === z));
      near(change.newD[i], i - expected);
    }
    assert.equal('Y' in change, false, 'a distribution perturbation does not invent a new observed cohort');
  }
  const negative = meanContamination(rows, {z: 1, t: -.1});
  near(negative.newMean, 1.1 * 1918 / 5735 - .1);
  assert.deepEqual(data.grouped.p, [3817 / 5735, 1918 / 5735]);
});

test('altered inputs recompute means, fit and sample size rather than using cohort constants', () => {
  const altered = rows.slice(0, 1000).map((row, i) => i === 0 ? {...row, y: 1} : row);
  const changed = objectLessonData(altered);
  assert.equal(changed.n, 1000);
  assert.equal(changed.mean.sumY, raw.slice(0, 1000).filter(row => row.dth30 === 'Yes').length + 1);
  assert.equal(changed.mean.meanY, changed.mean.sumY / 1000);
  assert.equal(changed.shown[0].y, 1);
  assert.equal(changed.grouped.patientN, 1000);
  assert.notEqual(changed.mean.meanY, data.mean.meanY);
  assert.notEqual(changed.q0[0], data.q0[0]);
  near(changed.initialRiskDifference, sum(changed.q1.map((value, i) => value - changed.q0[i])) / 1000);
  const contamination = meanContamination(altered, {z: 0, t: .2});
  near(contamination.newMean, .8 * changed.mean.meanY);
});

test('object data neither mutate fitted values nor accept stale or misaligned fits', () => {
  const isolated = objectLessonData(rows, fit);
  isolated.W[0][0] = 123;
  isolated.q0[0] = .99;
  isolated.qCoefficients[0] = 123;
  isolated.gCoefficients[0] = 123;
  isolated.shown[0].history[0] = 123;
  assert.equal(fit.X[0][0], 1);
  assert.notEqual(fit.q0[0], .99);
  assert.notEqual(fit.qFit.beta[0], 123);
  assert.notEqual(fit.gFit.beta[0], 123);
  assert.equal(rows[0].history[0], 0);
  assert.throws(() => objectLessonData([...rows].reverse(), fit), /observation order/);
  assert.throws(() => objectLessonData(rows.slice(1), fit), /matching finite dimensions/);
  assert.throws(() => objectLessonData(rows.map((row, i) => i ? row : {...row, y: 1}), fit), /observation order/);
  for (const options of [{start: -1}, {start: 5736}, {start: .5}, {count: 0}, {count: 1.5}]) {
    assert.throws(() => objectLessonData(rows, fit, options));
  }
  assert.throws(() => meanContamination([], {z: 1, t: .1}));
  assert.throws(() => meanContamination(rows, {z: 2, t: .1}));
  assert.throws(() => meanContamination(rows, {z: 1, t: 1.1}));
  assert.throws(() => meanContamination(rows, {z: 1, t: NaN}));
});
