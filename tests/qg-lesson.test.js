import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readRhc, prepareRhc, HISTORY, FEATURE_NAMES} from '../shared/js/rhc.js';
import {parsePublicCsv} from '../shared/js/public-rws.js';
import {objectLessonData} from '../shared/js/object-data.js';
import {qgLessonData, qgLessonView} from '../shared/js/qg-lesson.js';

const source = readFileSync(new URL('../shared/data/public/rhc/source.csv', import.meta.url), 'utf8');
const provenance = JSON.parse(readFileSync(new URL('../shared/data/public/rhc/provenance.json', import.meta.url), 'utf8'));
const raw = parsePublicCsv(source.replace(/^""(?=,)/, '"source_row"'));
const rows = readRhc(source), fit = prepareRhc(rows);
// Deliberately pass a different visible page: this lesson must keep source rows 1–6.
const data = objectLessonData(rows, fit, {start: 12, count: 2});
const lesson = qgLessonData(data);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
// Independent calculation from the original design and fitted coefficients.
function fittedProbability(design, coefficients) {
  let linear = 0;
  for (let j = 0; j < design.length; j++) linear += design[j] * coefficients[j];
  return 1 / (1 + Math.exp(-linear));
}

function fixture() {
  const baselineW = [
    [0, 40, 'white', ...Array(12).fill(0)],
    [1, 60, 'black', ...Array.from({length: 12}, (_, i) => i % 2)],
    [0, 80, 'other', ...Array(12).fill(1)],
  ];
  const ageMean = 60, ageSd = Math.sqrt(800 / 3);
  const W = baselineW.map(w => [1, w[0], (w[1] - ageMean) / ageSd,
    +(w[2] === 'black'), +(w[2] === 'other'), ...w.slice(3)]);
  const qCoefficients = FEATURE_NAMES.map((_, j) => (j - 4) / 50).concat(.7);
  const gCoefficients = FEATURE_NAMES.map((_, j) => (j - 2) / 80);
  return {
    n: 3, fullN: 3, baselineW, W, ageMean, ageSd,
    featureNames: [...FEATURE_NAMES], baselineFeatureNames: ['male', 'age', 'race', ...HISTORY],
    A: [1, 0, 1], Y: [0, 1, 1], qCoefficients, gCoefficients,
    q0: W.map(w => fittedProbability([...w, 0], qCoefficients)),
    q1: W.map(w => fittedProbability([...w, 1], qCoefficients)),
    g: W.map(w => fittedProbability(w, gCoefficients)),
  };
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test('six displayed patients retain verified CSV provenance and every raw W/A/Y value', () => {
  assert.equal(createHash('sha256').update(source).digest('hex'), provenance.source_sha256);
  assert.equal(lesson.n, raw.length);
  assert.equal(lesson.n, provenance.audit.rows);
  assert.equal(lesson.shownN, 6);
  assert.deepEqual(data.rowNumbers, [13, 14]);
  assert.deepEqual(lesson.sourceRows.map(row => row.rowNumber), [1, 2, 3, 4, 5, 6]);
  for (const row of lesson.sourceRows) {
    const original = raw[row.index];
    assert.equal(row.rowNumber, Number(original.source_row));
    assert.equal(row.age, Number(original.age));
    assert.equal(row.x, +(original.sex === 'Male'));
    assert.equal(row.race, original.race);
    assert.equal(row.a, +(original.swang1 === 'RHC'));
    assert.equal(row.y, +(original.dth30 === 'Yes'));
    assert.deepEqual(row.history, HISTORY.map(key => Number(original[key])));
    assert.deepEqual(row.w, [row.x, row.age, row.race, ...row.history]);
    assert.deepEqual(row.design, fit.X[row.index]);
  }
  assert.equal(lesson.provenance.input, 'objectLessonData');
  assert.equal(lesson.provenance.selection, 'first-six');
  assert.equal(lesson.provenance.predictions, 'existing-full-cohort-fit');
});

test('all three outputs match independent original-design linear predictors for the entire cohort', () => {
  for (let i = 0; i < rows.length; i++) {
    near(lesson.calls.q0.values[i], fittedProbability([...fit.X[i], 0], fit.qFit.beta));
    near(lesson.calls.q1.values[i], fittedProbability([...fit.X[i], 1], fit.qFit.beta));
    near(lesson.calls.g.values[i], fittedProbability(fit.X[i], fit.gFit.beta));
  }
  for (const row of lesson.sourceRows) for (const key of ['q0', 'q1', 'g']) {
    assert.equal(row[key], fit[key][row.index]);
    assert.equal(lesson.calls[key].shownValues[row.index], row[key]);
  }
});

test('call metadata distinguish fixed prediction inputs from observed A/Y and full-cohort fitting', () => {
  assert.equal(lesson.fit.n, rows.length);
  assert.equal(lesson.fit.scope, 'full-cohort');
  assert.equal(lesson.fit.fittedHere, false);
  assert.equal(lesson.fit.baselineCount, 15);
  assert.equal(lesson.fit.designCount, 17);
  assert.deepEqual(lesson.featureNames, fit.featureNames);
  assert.deepEqual(lesson.baselineFeatureNames, ['male', 'age', 'race', ...HISTORY]);
  for (const key of ['q1', 'q0', 'g']) {
    const call = lesson.calls[key], isQ = key !== 'g';
    assert.deepEqual(call.dimensions, [rows.length, 1]);
    assert.deepEqual(call.shownDimensions, [6, 1]);
    assert.deepEqual(call.inputDimensions, [rows.length, isQ ? 16 : 15]);
    assert.deepEqual(call.designDimensions, [rows.length, isQ ? 18 : 17]);
    assert.deepEqual(call.inputColumns, isQ ? ['w', 'predictionA'] : ['w']);
    assert.equal(call.readsObservedA, false);
    assert.equal(call.readsObservedY, false);
    for (const input of call.inputRows) {
      assert.equal('a' in input, false);
      assert.equal('y' in input, false);
      assert.deepEqual(input.w, lesson.sourceRows[input.rowNumber - 1].w);
      if (isQ) assert.equal(input.predictionA, +(key === 'q1'));
      else assert.equal('predictionA' in input, false);
    }
    assert.match(call.symbol, isQ ? /Q̂/ : /ĝ/);
  }
  assert.notEqual(lesson.calls.q1.event, lesson.calls.g.event);
});

test('pure mode selection retains patient identity and all three probability outputs', () => {
  const before = structuredClone(lesson);
  for (const key of ['q1', 'q0', 'g']) {
    const view = qgLessonView(lesson, key);
    assert.equal(view.selectedKey, key);
    assert.equal(view.selectedCall, lesson.calls[key]);
    assert.deepEqual(view.sourceRows, lesson.sourceRows);
    assert.deepEqual(Object.keys(view.calls), ['q1', 'q0', 'g']);
    assert.deepEqual(view.readingColumns, {w: true, predictionA: key !== 'g', a: false, y: false});
  }
  assert.equal(qgLessonView(lesson).selectedKey, 'q1');
  assert.deepEqual(lesson, before);
  for (const key of ['Q', 'q2', '', null]) assert.throws(() => qgLessonView(lesson, key));
  assert.throws(() => qgLessonView(null));
});

test('small manually specified fixtures stay small and supplied predictions are used without refitting', () => {
  const input = fixture(), out = qgLessonData(input);
  assert.equal(out.n, 3);
  assert.equal(out.shownN, 3);
  assert.deepEqual(out.sourceRows.map(row => row.rowNumber), [1, 2, 3]);
  for (const key of ['q1', 'q0', 'g']) assert.deepEqual(out.calls[key].values, input[key]);
  assert.equal(out.sourceRows[1].race, 'black');
  assert.deepEqual(out.sourceRows[1].history, input.baselineW[1].slice(3));
  assert.equal(out.fit.n, 3);
  assert.deepEqual(out.calls.q0.shownDimensions, [3, 1]);
});

test('changed real cohorts produce changed actual observations, fitted values and dimensions', () => {
  const changedRows = rows.slice(0, 1000).map((row, i) => i === 0 ? {...row, y: 1} : row);
  const changedFit = prepareRhc(changedRows);
  const changed = qgLessonData(objectLessonData(changedRows, changedFit));
  assert.equal(changed.n, changedRows.length);
  assert.equal(changed.sourceRows[0].y, 1);
  assert.notEqual(changed.sourceRows[0].q0, lesson.sourceRows[0].q0);
  assert.notEqual(changed.sourceRows[0].g, lesson.sourceRows[0].g);
  for (const key of ['q1', 'q0', 'g']) {
    assert.equal(changed.calls[key].values.length, changedRows.length);
    assert.deepEqual(changed.calls[key].shownValues, changedFit[key].slice(0, 6));
  }
});

test('projection accepts frozen input and returned arrays cannot mutate the source data', () => {
  const input = deepFreeze(fixture()), before = structuredClone(input);
  const out = qgLessonData(input);
  out.sourceRows[0].w[1] = 99;
  out.sourceRows[0].history[0] = 1;
  out.sourceRows[0].design[0] = 99;
  out.calls.q0.values[0] = .99;
  out.calls.q0.inputRows[0].w[1] = 98;
  out.featureNames[0] = 'changed';
  out.baselineFeatureNames[0] = 'changed';
  assert.deepEqual(input, before);
});

test('malformed, incomplete and misaligned inputs fail explicitly', () => {
  for (const input of [null, {}, {...fixture(), n: 0}, {...fixture(), n: 3.5}, {...fixture(), fullN: 4}]) {
    assert.throws(() => qgLessonData(input));
  }
  const mutations = [
    input => input.featureNames.reverse(),
    input => { delete input.featureNames[0]; },
    input => input.baselineFeatureNames.pop(),
    input => input.qCoefficients.pop(),
    input => { input.gCoefficients[0] = NaN; },
    input => { input.ageSd = 0; },
    input => { input.ageMean = Infinity; },
    input => input.W.pop(),
    input => input.baselineW[0].pop(),
    input => { input.baselineW[0][0] = 2; },
    input => { input.baselineW[0][1] = NaN; },
    input => { input.baselineW[0][2] = 'unknown'; },
    input => { input.baselineW[0][3] = 2; },
    input => { delete input.baselineW[0][3]; },
    input => { input.W[0][2] += .1; },
    input => { delete input.W[0][0]; },
    input => { input.W[0][0] = Infinity; },
    input => { input.A[0] = 2; },
    input => { input.Y[0] = -1; },
    input => input.q0.pop(),
    input => { input.q1[0] = 1; },
    input => { input.g[0] = 0; },
    input => { input.q0[0] = NaN; },
  ];
  for (const mutate of mutations) {
    const input = fixture();
    mutate(input);
    assert.throws(() => qgLessonData(input));
  }
});
