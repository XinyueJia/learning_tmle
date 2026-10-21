import test from 'node:test';
import assert from 'node:assert/strict';
import { chapter0Data, chapter0ErrorData } from '../../zh/src/chapter0-data.js';
import { DEFAULT_MODEL, joint } from '../../shared/js/math.js';

const near = (actual, expected, tolerance = 1e-12) => assert.ok(
  Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`,
);
const nearArray = (actual, expected) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => near(value, expected[i]));
};

test('default rows retain the shared Q mechanism and expose distinct risks and contrasts', () => {
  const data = chapter0Data();
  assert.equal(data.target, 'ate');
  assert.equal(data.assignment, 'observational');
  assert.deepEqual(data.model.px, [.5, .5]);
  assert.deepEqual(data.model.g, [.2, .8]);
  assert.deepEqual(data.model.q, [[.7, .2], [.8, .5]]);
  assert.deepEqual(data.rows.map(row => row.x), [0, 1]);
  nearArray(data.rows.map(row => row.p), [.5, .5]);
  nearArray(data.rows.map(row => row.q0), [.7, .2]);
  nearArray(data.rows.map(row => row.q1), [.8, .5]);
  nearArray(data.rows.map(row => row.g), [.2, .8]);
  nearArray(data.rows.map(row => row.cate), [.1, .3]);
  nearArray(data.rows.map(row => row.contribution0), [.35, .1]);
  nearArray(data.rows.map(row => row.contribution1), [.4, .25]);
  near(data.risk0, .45); near(data.risk1, .65);
  near(data.observedRisk0, .60); near(data.observedRisk1, .56);
  near(data.ate, .20); near(data.naive, -.04);
  near(data.targetValue, .20);
  assert.equal(data.unit, '概率差');
  assert.equal(data.targetLabel, '平均处理效应（ATE）');
});

test('population changes reweight fixed stratum risks with independent expected values', () => {
  const scenarios = [
    { population: .2, px: [.8, .2], risk0: .60, risk1: .74, ate: .14, naive: -7 / 340, observedRisk0: 57 / 85, observedRisk1: .65 },
    { population: .8, px: [.2, .8], risk0: .30, risk1: .56, ate: .26, naive: 23 / 340, observedRisk0: .45, observedRisk1: 44 / 85 },
  ];
  for (const expected of scenarios) {
    const data = chapter0Data({ population: expected.population });
    nearArray(data.model.px, expected.px);
    assert.deepEqual(data.model.q, [[.7, .2], [.8, .5]]);
    assert.deepEqual(data.model.g, [.2, .8]);
    near(data.risk0, expected.risk0); near(data.risk1, expected.risk1);
    near(data.ate, expected.ate); near(data.naive, expected.naive);
    near(data.observedRisk0, expected.observedRisk0); near(data.observedRisk1, expected.observedRisk1);
  }
});

test('randomised assignment changes the observable contrast while preserving causal summaries', () => {
  const scenarios = [
    { population: .2, risk0: .60, risk1: .74, ate: .14 },
    { population: .5, risk0: .45, risk1: .65, ate: .20 },
    { population: .8, risk0: .30, risk1: .56, ate: .26 },
  ];
  for (const expected of scenarios) {
    const data = chapter0Data({ population: expected.population, assignment: 'randomised' });
    const observational = chapter0Data({ population: expected.population });
    assert.equal(data.assignment, 'randomised');
    assert.deepEqual(data.model.g, [.5, .5]);
    nearArray(data.rows.map(row => row.g), [.5, .5]);
    assert.deepEqual(data.model.px, observational.model.px);
    assert.deepEqual(data.model.q, observational.model.q);
    near(data.risk0, expected.risk0); near(data.risk1, expected.risk1);
    near(data.ate, expected.ate); near(data.naive, expected.ate);
    near(data.observedRisk0, expected.risk0); near(data.observedRisk1, expected.risk1);
  }
});

test('selecting a target changes only its value, label and unit', () => {
  const original = chapter0Data();
  for (const [target, value, label] of [
    ['risk0', .45, '所有人启动活性对照药物B时的风险'],
    ['risk1', .65, '所有人启动研究药物A时的风险'],
  ]) {
    const data = chapter0Data({ target });
    assert.equal(data.target, target);
    near(data.targetValue, value);
    assert.equal(data.targetLabel, label); assert.equal(data.unit, '概率');
    assert.deepEqual(data.model, original.model);
    assert.deepEqual(data.rows, original.rows);
    near(data.risk0, .45); near(data.risk1, .65);
    near(data.ate, .20); near(data.naive, -.04);
  }
});

test('population endpoints are calculated exactly without clipping absent groups', () => {
  for (const assignment of ['observational', 'randomised']) {
    for (const [population, risk0, risk1, effect] of [[0, .7, .8, .1], [1, .2, .5, .3]]) {
      const data = chapter0Data({ population, assignment });
      assert.deepEqual(data.model.px, [1 - population, population]);
      near(data.risk0, risk0); near(data.risk1, risk1);
      near(data.ate, effect); near(data.naive, effect);
      near(data.observedRisk0, risk0); near(data.observedRisk1, risk1);
      const absent = data.rows[population === 0 ? 1 : 0];
      assert.equal(absent.p, 0);
      assert.equal(absent.contribution0, 0); assert.equal(absent.contribution1, 0);
    }
  }
});

test('non-finite, non-numeric and out-of-range population probabilities fail', () => {
  for (const population of [NaN, Infinity, -Infinity, '0.5', null, true, [], {}]) {
    assert.throws(() => chapter0Data({ population }), TypeError);
  }
  for (const population of [-.01, 1.01]) {
    assert.throws(() => chapter0Data({ population }), RangeError);
  }
});

test('unknown targets and assignment mechanisms fail rather than silently defaulting', () => {
  for (const target of ['naive', 'risk', '', null, 0, {}, ['ate']]) {
    assert.throws(() => chapter0Data({ target }), RangeError);
  }
  for (const assignment of ['randomized', 'unknown', '', null, 0, {}, ['observational']]) {
    assert.throws(() => chapter0Data({ assignment }), RangeError);
  }
});

test('returned models and rows are independent across calls and cannot mutate the default model', () => {
  const first = chapter0Data();
  const second = chapter0Data();
  first.model.px[0] = 99; first.model.g[0] = 99; first.model.q[0][0] = 99;
  first.model.q[1][1] = 99; first.rows[0].p = 99; first.rows[1].q1 = 99;
  near(first.rows[0].q0, .7);
  near(second.rows[0].p, .5); near(second.rows[1].q1, .5);
  assert.deepEqual(second.model, { px: [.5, .5], g: [.2, .8], q: [[.7, .2], [.8, .5]] });
  assert.deepEqual(DEFAULT_MODEL, { px: [.5, .5], g: [.2, .8], q: [[.7, .2], [.8, .5]] });
  assert.deepEqual(chapter0Data().model, second.model);
  const randomised = chapter0Data({ assignment: 'randomised' });
  randomised.model.g[0] = 99;
  assert.deepEqual(chapter0Data({ assignment: 'randomised' }).model.g, [.5, .5]);
});

test('fixed treatment and control risk errors propagate with independently calculated signs and magnitudes', () => {
  const data = chapter0ErrorData();
  near(data.target, .20); near(data.riskError, .02);
  const [treated, control] = data.scenarios;
  near(treated.truthRisk, .80); near(treated.fittedRisk, .82);
  near(treated.risk1, .66); near(treated.risk0, .45);
  near(treated.estimate, .21); near(treated.error, .01);
  near(control.truthRisk, .70); near(control.fittedRisk, .72);
  near(control.risk1, .65); near(control.risk0, .46);
  near(control.estimate, .19); near(control.error, -.01);
});

test('each fitted-error scenario is a normalised distribution changing exactly one conditional risk', () => {
  const data = chapter0ErrorData();
  for (const scenario of data.scenarios) {
    assert.deepEqual(scenario.fit.px, [.5, .5]);
    assert.deepEqual(scenario.fit.g, [.2, .8]);
    for (let a = 0; a < 2; a++) for (let x = 0; x < 2; x++) {
      if (a === scenario.a && x === 0) continue;
      near(scenario.fit.q[a][x], [[.7, .2], [.8, .5]][a][x]);
    }
    near(joint(scenario.fit).reduce((sum, cell) => sum + cell.p, 0), 1);
  }
  assert.deepEqual(data.truth, { px: [.5,.5], g: [.2,.8], q: [[.7,.2],[.8,.5]] });
});

test('fitted-error examples do not alias one another, the truth, or subsequent chapter resets', () => {
  const data = chapter0ErrorData();
  data.scenarios[0].fit.px[0] = 99;
  data.scenarios[0].fit.q[0][0] = 99;
  data.truth.g[0] = 99;
  near(data.scenarios[1].fit.px[0], .5);
  near(data.scenarios[1].fit.q[0][0], .72);
  near(data.scenarios[1].fit.g[0], .2);
  assert.deepEqual(chapter0Data().model, DEFAULT_MODEL);
  assert.deepEqual(chapter0ErrorData().truth, DEFAULT_MODEL);
});
