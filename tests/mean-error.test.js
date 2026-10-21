import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {meanErrorData} from '../shared/js/mean-error.js';
import {readRhc} from '../shared/js/rhc.js';
import {parsePublicCsv} from '../shared/js/public-rws.js';

const near = (actual, expected, tolerance = 1e-12) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
  `${actual} != ${expected}`,
);

test('unknown population remains symbolic and never defaults to the empirical mean', () => {
  const result = meanErrorData([0, 1, 1, 1]);
  assert.equal(result.n, 4);
  assert.equal(result.events, 3);
  assert.equal(result.muhat, .75);
  assert.equal(result.reference, null);
  assert.equal(result.referenceStatus, 'unknown');
  assert.equal(result.referenceCentred, null);
  assert.equal(result.grouped.referenceCentred, null);
  assert.equal(result.distance, null);
  assert.equal(result.trueStatus, 'unknown');
  assert.equal(result.trueIF, null);
  assert.equal(result.trueError, null);
  assert.equal(result.symbolic.trueIF, 'Yᵢ − μ₀');
  assert.equal(result.symbolic.trueError, 'μ̂ − μ₀');
  assert.deepEqual(result.sampleCentred, {centre: .75, values: [-.75, .25, .25, .25], mean: 0});
  assert.deepEqual(result.grouped.counts, [1, 3]);
  assert.deepEqual(result.grouped.probabilities, [.25, .75]);
});

test('hand-calculated reference distance equals the complete individual and grouped averages', () => {
  const result = meanErrorData([0, 1, 1, 1], .5);
  assert.equal(result.referenceStatus, 'assumed');
  assert.equal(result.reference, .5);
  assert.deepEqual(result.referenceCentred, {centre: .5, values: [-.5, .5, .5, .5], mean: .25});
  assert.equal(result.distance, .25);
  assert.deepEqual(result.grouped.referenceCentred, {
    values: [-.5, .5], contributions: [-.125, .375], mean: .25,
  });
  assert.notDeepEqual(result.referenceCentred.values, result.sampleCentred.values);
  assert.notEqual(result.referenceCentred.mean, result.sampleCentred.mean);
  assert.equal(result.trueIF, null);
  assert.equal(result.trueError, null);
  const sameCentre = meanErrorData([0, 1, 1, 1], .75);
  assert.equal(sameCentre.distance, 0);
  assert.equal(sameCentre.referenceStatus, 'assumed');
  assert.equal(sameCentre.trueError, null);
});

test('all observed RHC outcomes are retained and independently reproduce the grouped calculation', () => {
  const source = readFileSync(new URL('../shared/data/public/rhc/source.csv', import.meta.url), 'utf8');
  const raw = parsePublicCsv(source.replace(/^""(?=,)/, '"source_row"'));
  const Y = readRhc(source).map(row => row.y);
  const counts = [raw.filter(row => row.dth30 === 'No').length, raw.filter(row => row.dth30 === 'Yes').length];
  assert.equal(counts[0] + counts[1], raw.length);
  for (const m of [null, 0, .2, .6, 1]) {
    const result = meanErrorData(Y, m);
    assert.equal(result.n, raw.length);
    assert.equal(result.events, counts[1]);
    assert.equal(result.muhat, counts[1] / raw.length);
    assert.deepEqual(result.grouped.counts, counts);
    assert.deepEqual(result.outcomes, raw.map(row => +(row.dth30 === 'Yes')));
    assert.equal(result.sampleCentred.values.length, raw.length);
    near(result.sampleCentred.mean, 0);
    near(result.grouped.sampleCentred.mean, 0);
    if (m === null) continue;
    // This independent route uses the original categorical CSV and two counts.
    const groupedMean = (counts[0] * (0 - m) + counts[1] * (1 - m)) / raw.length;
    const directMean = raw.reduce((total, row) => total + (row.dth30 === 'Yes' ? 1 - m : -m), 0) / raw.length;
    near(result.distance, groupedMean);
    near(result.referenceCentred.mean, directMean);
    near(result.referenceCentred.mean, result.distance);
    near(result.grouped.referenceCentred.mean, groupedMean);
    for (let i = 0; i < Y.length; i++) assert.equal(result.referenceCentred.values[i], Y[i] - m);
  }
});

test('both mean boundaries and reference endpoints are legal without model fitting', () => {
  for (const [Y, m, expectedMean, expectedDistance] of [
    [[0, 0], 0, 0, 0], [[0, 0], 1, 0, -1],
    [[1, 1], 0, 1, 1], [[1, 1], 1, 1, 0],
    [[1], .25, 1, .75], [[0], .25, 0, -.25],
  ]) {
    const result = meanErrorData(Y, m);
    assert.equal(result.muhat, expectedMean);
    assert.equal(result.distance, expectedDistance);
    assert.equal(result.referenceCentred.mean, expectedDistance);
    assert.equal(result.sampleCentred.mean, 0);
    assert.equal(result.grouped.referenceCentred.mean, expectedDistance);
  }
});

test('input and returned arrays do not alias, and changing observations recomputes every summary', () => {
  const Y = Object.freeze([0, 1, 1, 1]);
  const result = meanErrorData(Y, .5);
  result.outcomes[0] = 1;
  result.sampleCentred.values[0] = 10;
  result.referenceCentred.values[0] = 20;
  result.grouped.support[0] = 30;
  result.grouped.sampleCentred.values[0] = 40;
  assert.deepEqual(Y, [0, 1, 1, 1]);
  assert.deepEqual(result.grouped.referenceCentred.values, [-.5, .5]);
  assert.deepEqual(result.grouped.sampleCentred.contributions, [-.1875, .1875]);
  assert.deepEqual(result.grouped.referenceCentred.contributions, [-.125, .375]);
  const next = meanErrorData([0, 0, 1], .5);
  assert.equal(next.n, 3);
  assert.equal(next.events, 1);
  assert.equal(next.muhat, 1 / 3);
  near(next.distance, -1 / 6);
  near(next.referenceCentred.mean, -1 / 6);
  assert.deepEqual(meanErrorData(Y, .5).referenceCentred.values, [-.5, .5, .5, .5]);
});

test('rejects empty, sparse, non-binary or non-numeric outcomes and illegal reference means', () => {
  for (const Y of [null, undefined, {}, [], new Uint8Array([0, 1]), Array(2), [0, , 1],
    [NaN], [Infinity], [-1], [2], [.5], ['0'], [true], [{y: 0}]]) {
    assert.throws(() => meanErrorData(Y));
  }
  for (const m of [NaN, Infinity, -Infinity, -.001, 1.001, '0', true, {}, []]) {
    assert.throws(() => meanErrorData([0, 1], m), /assumed reference mean/);
  }
});

test('one observed sample estimates spread even when estimated IF values average to zero', () => {
  const result = meanErrorData([0, 1, 1, 1]);
  assert.equal(result.sampleCentred.mean, 0);
  // By hand: (-3/4)^2 + 3(1/4)^2 = 3/4; divide by 3 then by 4.
  assert.deepEqual(result.iidMeanInference, {
    model: 'iid', n: 4, degreesOfFreedom: 3, sumSquares: .75,
    sampleVariance: .25, standardDeviation: .5, standardError: .25,
  });
  assert.equal(result.trueError, null);
  assert.deepEqual(meanErrorData([0, 1, 1, 1], .1).iidMeanInference, result.iidMeanInference);
  for (const Y of [[0], [1]]) {
    const single = meanErrorData(Y).iidMeanInference;
    assert.equal(single.sumSquares, 0);
    assert.equal(single.sampleVariance, null);
    assert.equal(single.standardError, null);
  }
  for (const Y of [[0, 0], [1, 1]]) {
    assert.equal(meanErrorData(Y).iidMeanInference.standardError, 0);
    assert.equal(meanErrorData(Y).trueError, null);
  }
});

test('RHC iid standard error agrees with independent binary-count formula', () => {
  const raw = parsePublicCsv(readFileSync('shared/data/public/rhc/source.csv', 'utf8').replace(/^""(?=,)/, '"source_row"'));
  const events = raw.filter(row => row.dth30 === 'Yes').length, n = raw.length;
  const result = meanErrorData(raw.map(row => +(row.dth30 === 'Yes')));
  // Binomial counts give sum centred squares = k(n-k)/n, independently of per-row code.
  near(result.iidMeanInference.sumSquares, events * (n - events) / n, 2e-10);
  near(result.iidMeanInference.sampleVariance, events * (n - events) / (n * (n - 1)));
  near(result.iidMeanInference.standardError, Math.sqrt(events * (n - events) / (n * n * (n - 1))));
  assert.ok(result.iidMeanInference.standardError > 0);
  assert.equal(result.trueIF, null);
  assert.equal(result.trueError, null);
});
