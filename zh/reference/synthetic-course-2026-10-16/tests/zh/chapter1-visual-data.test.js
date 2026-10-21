import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chapter1VisualData } from '../../zh/src/chapter1-visual-data.js';
import { chapter1Figures, renderChapter1Visuals } from '../../zh/renderers/chapter1-visuals.js';

const near = (actual, expected, tolerance = 1e-12) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const nearArray = (actual, expected) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => near(value, expected[i]));
};
const sum = values => values.reduce((total, value) => total + value, 0);

// Expected values below are independently specified, rather than calculated by
// the helper under test or by its shared contamination function.
test('the same 200 fixed RWS records give 116 events, risk .58 and binary weights', () => {
  const { sample, base } = chapter1VisualData();
  assert.deepEqual(sample.values, [0, 1]);
  assert.deepEqual(sample.counts, [84, 116]);
  assert.equal(sample.total, 200);
  assert.equal(sample.events, 116);
  near(sample.mean, .58);
  assert.deepEqual(base.values, [0, 1]);
  nearArray(base.probabilities, [.42, .58]);
  nearArray(base.meanContributions, [0, .58]);
  near(base.mean, .58);
  const [header, ...lines] = readFileSync(new URL('../../shared/data/rws-counts.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
  assert.equal(header, 'x,a,y,n');
  const counts = lines.map(line => line.split(',').map(Number));
  assert.equal(sum(counts.map(row => row[3])), 200);
  assert.equal(sum(counts.map(row => row[2] * row[3])), 116);
});

test('replacement preserves exact fractional percentages and adds ten per cent at one', () => {
  const { replacement: r } = chapter1VisualData();
  assert.equal(r.z, 1); near(r.t, .1); assert.equal(r.totalUnits, 100);
  nearArray(r.beforeUnits, [42, 58]);
  nearArray(r.removedUnits, [4.2, 5.8]);
  nearArray(r.retainedUnits, [37.8, 52.2]);
  nearArray(r.addedUnits, [0, 10]);
  nearArray(r.afterUnits, [37.8, 62.2]);
  near(sum(r.beforeUnits), 100); near(sum(r.removedUnits), 10);
  near(sum(r.retainedUnits), 90); near(sum(r.addedUnits), 10); near(sum(r.afterUnits), 100);
  nearArray(r.probabilities, [.378, .622]);
  near(r.mean, .622);
  assert.notEqual(r.probabilities[1], .1, 'newly added mass is not the entire mass at Y=1');
});

test('the mixture retains .522, adds .1, and gains .042 after removing .058', () => {
  const { mixture: m } = chapter1VisualData();
  near(m.retainedMass, .9); near(m.addedMass, .1);
  near(m.retainedMeanContribution, .522);
  near(m.addedMeanContribution, .1);
  near(m.updatedMean, .622);
  near(m.removedMeanContribution, .058);
  near(m.delta, .042);
});

test('independently reweighted finite changes all have rate .42', () => {
  const { rates, directions } = chapter1VisualData();
  const expected = [[.1, .622, .042], [.01, .5842, .0042], [.001, .58042, .00042]];
  assert.equal(rates.length, 3);
  rates.forEach((row, i) => {
    near(row.t, expected[i][0]); near(row.exactMean, expected[i][1]);
    near(row.delta, expected[i][2]); near(row.rate, .42);
  });
  assert.deepEqual(directions.map(row => row.z), [0, 1]);
  nearArray(directions.map(row => row.d), [-.58, .42]);
});

test('exercises independently expose new probabilities, contributions and signed changes', () => {
  const { exercises: [atOne, atZero] } = chapter1VisualData();
  assert.equal(atOne.z, 1); near(atOne.t, .2);
  nearArray(atOne.probabilities, [.336, .664]);
  nearArray(atOne.meanContributions, [0, .664]);
  near(atOne.mean, .664); near(atOne.delta, .084);
  assert.equal(atZero.z, 0); near(atZero.t, .8);
  nearArray(atZero.probabilities, [.884, .116]);
  nearArray(atZero.meanContributions, [0, .116]);
  near(atZero.mean, .116); near(atZero.delta, -.464);
});

test('weighted directions cancel and strict positivity excludes both path endpoints', () => {
  const { centering, boundary } = chapter1VisualData();
  nearArray(centering.directions, [-.58, .42]);
  nearArray(centering.weightedContributions, [-.2436, .2436]);
  near(centering.total, 0);
  assert.equal(boundary.z, 1); near(boundary.minStrict, -29 / 21); near(boundary.maxStrict, 1);
  near(.58 + .42 * boundary.minStrict, 0);
  near(.42 * (1 - boundary.maxStrict), 0);
});

test('both contamination points map exact reweighted means to changes and rates', () => {
  const { functionMap } = chapter1VisualData();
  near(functionMap.t, .1);
  assert.deepEqual(functionMap.rows.map(row => row.z), [0, 1]);
  nearArray(functionMap.rows[0].probabilities, [.478, .522]);
  nearArray(functionMap.rows[1].probabilities, [.378, .622]);
  nearArray(functionMap.rows.map(row => row.mean), [.522, .622]);
  nearArray(functionMap.rows.map(row => row.delta), [-.058, .042]);
  nearArray(functionMap.rows.map(row => row.rate), [-.58, .42]);
  nearArray(functionMap.rows.map(row => row.d), [-.58, .42]);
});

test('mapping random Y to its influence preserves probabilities and signs', () => {
  const { randomInfluence } = chapter1VisualData();
  assert.deepEqual(randomInfluence.rows.map(row => row.y), [0, 1]);
  nearArray(randomInfluence.rows.map(row => row.d), [-.58, .42]);
  nearArray(randomInfluence.rows.map(row => row.probability), [.42, .58]);
  nearArray(randomInfluence.rows.map(row => row.units), [42, 58]);
  nearArray(randomInfluence.rows.map(row => row.probability * row.d), [-.2436, .2436]);
});

test('centring subtracts independently weighted totals rather than equally averaging D', () => {
  const { centeringProof: proof } = chapter1VisualData();
  assert.deepEqual(proof.rows.map(row => row.y), [0, 1]);
  nearArray(proof.rows.map(row => row.probability), [.42, .58]);
  nearArray(proof.rows.map(row => row.weightedY), [0, .58]);
  nearArray(proof.rows.map(row => row.weightedBaseline), [.2436, .3364]);
  nearArray(proof.rows.map(row => row.weightedD), [-.2436, .2436]);
  near(proof.mass, 1); near(proof.meanTotal, .58); near(proof.baselineTotal, .58);
  near(proof.difference, 0); near(proof.unweightedMean, -.08);
});

test('changed reference weights keep the old D and give weighted average .042', () => {
  const { referenceDistribution: reference } = chapter1VisualData();
  assert.equal(reference.z, 1); near(reference.t, .1);
  near(reference.referenceMean, .58); near(reference.updatedMean, .622);
  nearArray(reference.rows.map(row => row.d), [-.58, .42]);
  nearArray(reference.rows.map(row => row.originalProbability), [.42, .58]);
  nearArray(reference.rows.map(row => row.updatedProbability), [.378, .622]);
  nearArray(reference.rows.map(row => row.originalContribution), [-.2436, .2436]);
  nearArray(reference.rows.map(row => row.updatedContribution), [-.21924, .26124]);
  near(reference.originalTotal, 0); near(reference.updatedTotal, .042);
});

test('survival complement has opposite changes and opposite influence at both inputs', () => {
  const { survival: s } = chapter1VisualData();
  assert.equal(s.month, 12);
  near(s.risk, .58); near(s.eventFree, .42);
  near(s.updatedRisk, .622); near(s.updatedEventFree, .378);
  near(s.riskDelta, .042); near(s.eventFreeDelta, -.042);
  assert.deepEqual(s.rows.map(row => row.eventFree), [1, 0]);
  nearArray(s.rows.map(row => row.riskD), [-.58, .42]);
  nearArray(s.rows.map(row => row.eventFreeD), [.58, -.42]);
});

test('schematic time window separates confirmed event-free status from unknown follow-up', () => {
  const { survivalWindow: w } = chapter1VisualData();
  assert.equal(w.month, 12); assert.equal(w.schematic, true);
  assert.deepEqual(w.rows.map(row => [row.eventMonth, row.lastSeenMonth, row.y]), [[4, 4, 1], [null, 14, 0], [null, 8, null]]);
});

test('all eighteen figures retain IDs, popover recalls and exact proportional ledgers', () => {
  const figures = chapter1Figures();
  const ids = ['sample', 'distribution', 'replacement', 'mixture', 'mean-change', 'rate', 'general', 'rate-function', 'influence', 'random-influence', 'centering', 'centering-proof', 'reference-distribution', 'exercise-one', 'exercise-two', 'boundary', 'survival-window', 'survival-complement'];
  assert.deepEqual(Object.keys(figures).sort(), [...ids].sort());
  for (const id of ids) {
    const html = figures[id];
    assert.match(html, new RegExp(`data-visual-id="${id}"`));
    assert.equal((html.match(/class="formula-recall"/g) || []).length, 1, `${id} has one local recall`);
    assert.match(html, /class="recall-trigger"/);
    assert.match(html, /popover="auto"/);
    assert.doesNotMatch(html, /katex-error|0分|1分|3分|结局编码变化或个人处理效应.*分/);
  }
  assert.doesNotMatch(figures.replacement, /weight-cell|weight-grid|data-grid-stage/);
  for (const [stage, mass] of [['before', 1], ['retained', .9], ['after', 1]]) assert.match(figures.replacement, new RegExp(`data-weight-stage="${stage}" data-active-mass="${mass}"`));
  assert.match(figures['reference-distribution'], /-0\.21924/);
  assert.match(figures['reference-distribution'], /\+0\.26124/);
  assert.match(figures.rate, /0\.00042/);
  assert.match(figures.rate, /\\frac\{0\.00042\}\{0\.001\}=0\.42/);
  assert.match(figures.replacement, /37\.8%/); assert.match(figures.replacement, /62\.2%/);
  assert.match(figures['survival-window'], /data-schematic="true"/);
  assert.match(figures['survival-window'], /没有事件日期或随访日期/);
  assert.match(figures['survival-window'], /不能填0/);
  assert.match(figures['survival-complement'], /data-survival-y="0" data-risk-d="-0.58" data-survival-d="0.58"/);
  assert.match(figures['survival-complement'], /data-survival-y="1" data-risk-d="0.42" data-survival-d="-0.42"/);
  const rendered = renderChapter1Visuals(ids.map(id => `<div class="course-visual" data-visual="${id}"></div>`).join(''));
  assert.equal((rendered.match(/class="step-visual"/g) || []).length, 18);
  assert.doesNotMatch(rendered, /class="course-visual"/);
  assert.throws(() => renderChapter1Visuals('<div class="course-visual" data-visual="missing"></div>'), /Unknown chapter 1 visual/);
});

test('each call returns independent arrays and nested survival data', () => {
  const first = chapter1VisualData();
  first.sample.values[0] = 99;
  first.replacement.probabilities[0] = 99;
  first.functionMap.rows[0].probabilities[0] = 99;
  first.randomInfluence.rows[0].d = 99;
  first.centeringProof.rows[0].weightedD = 99;
  first.referenceDistribution.rows[0].updatedProbability = 99;
  first.survival.rows[0].eventFreeD = 99;
  first.survivalWindow.rows[0].y = 99;
  assert.equal(first.base.values[0], 0);
  near(first.base.probabilities[0], .42);
  near(first.functionMap.rows[1].probabilities[0], .378);
  near(first.referenceDistribution.rows[1].d, .42);
  const next = chapter1VisualData();
  assert.equal(next.sample.values[0], 0);
  near(next.replacement.probabilities[0], .378);
  near(next.randomInfluence.rows[0].d, -.58);
  near(next.centeringProof.rows[0].weightedD, -.2436);
  near(next.referenceDistribution.rows[0].updatedProbability, .378);
  near(next.survival.rows[0].eventFreeD, .58);
  assert.equal(next.survivalWindow.rows[0].y, 1);
});
