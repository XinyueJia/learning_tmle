import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {meanTransfer} from '../shared/js/mean-transfer.js';
import {readRhc} from '../shared/js/rhc.js';
import {parsePublicCsv} from '../shared/js/public-rws.js';

const near = (actual, expected, tolerance = 1e-12) => assert.ok(
  Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
  `${actual} != ${expected}`,
);

test('hand-calculated transfer pairs signed probability changes with fixed old influence values', () => {
  const result = meanTransfer([0, 0, 0, 1], .125);
  assert.equal(result.n, 4);
  assert.equal(result.events, 1);
  assert.deepEqual(result.support, [0, 1]);
  assert.deepEqual(result.counts, [3, 1]);
  assert.deepEqual(result.baseP, [.75, .25]);
  assert.deepEqual(result.changedP, [.625, .375]);
  assert.equal(result.baseMean, .25);
  assert.equal(result.changedMean, .375);
  assert.equal(result.exactChange, .125);
  assert.deepEqual(result.allowed, [-.25, .75]);
  assert.deepEqual(result.directionWeights, [-.125, .125]);
  assert.deepEqual(result.fixedInfluence, [-.25, .75]);
  assert.deepEqual(result.weightedTerms, [.03125, .09375]);
  assert.equal(result.pairedChange, .125);
  assert.notDeepEqual(result.fixedInfluence, [-.375, .625]);

  const reversed = meanTransfer([0, 0, 0, 1], -.125);
  assert.deepEqual(reversed.changedP, [.875, .125]);
  assert.deepEqual(reversed.directionWeights, [.125, -.125]);
  assert.deepEqual(reversed.fixedInfluence, [-.25, .75]);
  assert.deepEqual(reversed.weightedTerms, [-.03125, -.09375]);
  assert.equal(reversed.pairedChange, -.125);
  assert.equal(reversed.exactChange, -.125);
});

test('complete raw RHC categorical counts independently determine the base and transferred mean', () => {
  const source = readFileSync(new URL('../shared/data/public/rhc/source.csv', import.meta.url), 'utf8');
  const raw = parsePublicCsv(source.replace(/^""(?=,)/, '"source_row"'));
  const zeros = raw.filter(row => row.dth30 === 'No').length;
  const ones = raw.filter(row => row.dth30 === 'Yes').length;
  assert.equal(zeros + ones, raw.length);
  assert.equal(raw.length, 5735);
  assert.equal(ones, 1918);
  const Y = readRhc(source).map(row => row.y);
  const p0 = zeros / raw.length, p1 = ones / raw.length;
  for (const delta of [-p1, -.2, 0, .1, p0]) {
    const result = meanTransfer(Y, delta);
    assert.equal(result.n, raw.length);
    assert.equal(result.events, ones);
    assert.deepEqual(result.outcomes, raw.map(row => +(row.dth30 === 'Yes')));
    assert.deepEqual(result.baseP, [p0, p1]);
    assert.deepEqual(result.counts, [zeros, ones]);
    assert.deepEqual(result.allowed, [-p1, p0]);
    assert.deepEqual(result.changedP, [p0 - delta, p1 + delta]);
    near(result.baseMean, p1);
    near(result.changedMean, p1 + delta);
    near(result.exactChange, delta);
    near(result.pairedChange, delta);
    near(result.baseProbabilitySum, 1);
    near(result.changedProbabilitySum, 1);
    near(result.weightedTerms[0], delta * p1);
    near(result.weightedTerms[1], delta * p0);

    // Independent route: reweight every ORIGINAL CSV row within its observed
    // category. Both categories have positive mass; the Y values never change.
    let weightTotal = 0, weightedOutcomeTotal = 0, pairedTotal = 0;
    for (const row of raw) {
      const y = row.dth30 === 'Yes' ? 1 : 0;
      const oldProbability = y ? p1 : p0;
      const newProbability = y ? p1 + delta : p0 - delta;
      const ratio = newProbability / oldProbability;
      weightTotal += ratio;
      weightedOutcomeTotal += ratio * y;
      pairedTotal += (ratio - 1) * (y - p1);
    }
    near(weightTotal / raw.length, 1);
    near(result.changedMean, weightedOutcomeTotal / raw.length);
    near(result.pairedChange, pairedTotal / raw.length);
  }
});

test('both endpoints, zero transfer and absent-support boundaries remain legal', () => {
  for (const [Y, delta, expectedP, expectedChange] of [
    [[0, 0, 0, 1], -.25, [1, 0], -.25],
    [[0, 0, 0, 1], .75, [0, 1], .75],
    [[0, 0], 0, [1, 0], 0], [[0, 0], 1, [0, 1], 1],
    [[1, 1], 0, [0, 1], 0], [[1, 1], -1, [1, 0], -1],
    [[0], .5, [.5, .5], .5], [[1], -.5, [.5, .5], -.5],
  ]) {
    const result = meanTransfer(Y, delta);
    assert.deepEqual(result.changedP, expectedP);
    assert.equal(result.exactChange, expectedChange);
    assert.equal(result.pairedChange, expectedChange);
    near(result.changedProbabilitySum, 1);
    assert.deepEqual(result.outcomes, Y);
  }
  const unchanged = meanTransfer([0, 0, 0, 1]);
  assert.deepEqual(unchanged.changedP, [.75, .25]);
  assert.equal(unchanged.delta, 0);
  assert.equal(unchanged.exactChange, 0);
  assert.equal(unchanged.pairedChange, 0);
});

test('floating-point bounds use actual machine probabilities and never silently repair a transfer', () => {
  const Y = [0, 0, 0, 1, 1, 1, 1, 1, 1, 1];
  assert.deepEqual(meanTransfer(Y, .3).changedP, [0, 1]);
  assert.deepEqual(meanTransfer(Y, -.7).changedP, [1, 0]);
  const delta = .3 - Number.EPSILON;
  const result = meanTransfer(Y, delta);
  assert.equal(result.delta, delta);
  assert.equal(result.changedP[0], .3 - delta);
  assert.equal(result.changedP[1], .7 + delta);
  assert.ok(result.changedP[0] > 0);
  near(result.changedProbabilitySum, 1);
  assert.throws(() => meanTransfer(Y, .1 + .2), /\[-p1, p0\]/);
  assert.throws(() => meanTransfer(Y, -.7 - Number.EPSILON), /\[-p1, p0\]/);
});

test('input is preserved, returned arrays are separate and changed input recomputes the mean', () => {
  const Y = Object.freeze([0, 0, 0, 1]);
  const result = meanTransfer(Y, .125);
  for (const key of ['outcomes', 'support', 'counts', 'baseP', 'changedP', 'allowed',
    'directionWeights', 'fixedInfluence', 'weightedTerms']) result[key][0] = 123;
  assert.deepEqual(Y, [0, 0, 0, 1]);
  const next = meanTransfer([0, 1], .125);
  assert.equal(next.n, 2);
  assert.equal(next.events, 1);
  assert.equal(next.baseMean, .5);
  assert.equal(next.changedMean, .625);
  assert.deepEqual(next.fixedInfluence, [-.5, .5]);
  assert.deepEqual(meanTransfer(Y, .125).baseP, [.75, .25]);
});

test('rejects unknown, sparse and non-binary outcomes and invalid probability transfers', () => {
  for (const Y of [null, undefined, {}, [], new Uint8Array([0, 1]), Array(2), [0, , 1],
    [NaN], [Infinity], [-1], [2], [.5], ['0'], [true], [{y: 0}]]) {
    assert.throws(() => meanTransfer(Y));
  }
  for (const delta of [null, NaN, Infinity, -Infinity, '0', true, {}, [], -.251, .751]) {
    assert.throws(() => meanTransfer([0, 0, 0, 1], delta));
  }
  assert.throws(() => meanTransfer([0, 0], -.001));
  assert.throws(() => meanTransfer([1, 1], .001));
});
