import {FEATURE_NAMES, HISTORY} from './rhc.js';

const BASELINE_NAMES = ['male', 'age', 'race', ...HISTORY];
const CALL_KEYS = ['q1', 'q0', 'g'];
const same = (left, right) => Array.isArray(left) && left.length === right.length &&
  right.every((value, i) => value === left[i]);
const binary = value => value === 0 || value === 1;
const probability = value => Number.isFinite(value) && value > 0 && value < 1;

function validate(data) {
  if (!data || !Number.isInteger(data.n) || data.n < 1 || data.fullN !== data.n ||
      !same(data.featureNames, FEATURE_NAMES) || !same(data.baselineFeatureNames, BASELINE_NAMES)) {
    throw Error('Complete objectLessonData with the specified RHC baseline and design columns required');
  }
  const n = data.n;
  for (const key of ['baselineW', 'W', 'A', 'Y', 'q0', 'q1', 'g']) {
    if (!Array.isArray(data[key]) || data[key].length !== n) {
      throw Error(`Full-cohort ${key} must contain exactly n rows`);
    }
  }
  if (!Number.isFinite(data.ageMean) || !Number.isFinite(data.ageSd) || data.ageSd <= 0 ||
      !Array.isArray(data.qCoefficients) || data.qCoefficients.length !== FEATURE_NAMES.length + 1 ||
      !Array.isArray(data.gCoefficients) || data.gCoefficients.length !== FEATURE_NAMES.length ||
      [...data.qCoefficients, ...data.gCoefficients].some(value => !Number.isFinite(value))) {
    throw Error('Finite fitted coefficients and age standardisation metadata required');
  }
  for (let i = 0; i < n; i++) {
    const raw = data.baselineW[i], design = data.W[i];
    if (!Array.isArray(raw) || raw.length !== BASELINE_NAMES.length || !binary(raw[0]) ||
        !Number.isFinite(raw[1]) || raw[1] < 18 || raw[1] > 120 ||
        !['white', 'black', 'other'].includes(raw[2]) || !HISTORY.every((_, j) => binary(raw[j + 3])) ||
        !Array.isArray(design) || design.length !== FEATURE_NAMES.length ||
        design.some(value => !Number.isFinite(value)) ||
        !binary(data.A[i]) || !binary(data.Y[i]) ||
        !CALL_KEYS.every(key => probability(data[key][i]))) {
      throw Error(`Invalid baseline, design, observation or fitted probability at row ${i + 1}`);
    }
    // Check row alignment using the existing encoding; never refit or recalculate predictions.
    const expected = [1, raw[0], (raw[1] - data.ageMean) / data.ageSd,
      +(raw[2] === 'black'), +(raw[2] === 'other'), ...raw.slice(3)];
    if (!expected.every((value, j) => Math.abs(design[j] - value) <= 1e-12)) {
      throw Error(`Raw baseline and prepared design are misaligned at row ${i + 1}`);
    }
  }
}

/**
 * A display projection of an existing full-cohort objectLessonData result.
 * Always show the first six source positions, regardless of its current page.
 * W retains 15 raw baseline variables; design is their existing 17-column encoding.
 * No model fitting, probability calculation, rounding or patient construction occurs here.
 */
export function qgLessonData(data) {
  validate(data);
  const n = data.n, shownN = Math.min(6, n);
  const sourceRows = Array.from({length: shownN}, (_, index) => {
    const w = [...data.baselineW[index]];
    return {
      index, rowNumber: index + 1, w, design: [...data.W[index]],
      x: w[0], age: w[1], race: w[2], history: w.slice(3),
      a: data.A[index], y: data.Y[index],
      q1: data.q1[index], q0: data.q0[index], g: data.g[index],
    };
  });
  const calls = Object.fromEntries(CALL_KEYS.map(key => {
    const isQ = key !== 'g', predictionA = isQ ? +(key === 'q1') : null;
    return [key, {
      key, symbol: isQ ? `Q̂(${predictionA},W)` : 'ĝ(W)',
      event: isQ ? '30-day death (Y=1)' : 'RHC received (A=1)',
      predictionA,
      inputColumns: isQ ? ['w', 'predictionA'] : ['w'],
      readsObservedA: false, readsObservedY: false,
      inputDimensions: [n, BASELINE_NAMES.length + +isQ],
      designDimensions: [n, FEATURE_NAMES.length + +isQ],
      dimensions: [n, 1], shownDimensions: [shownN, 1],
      inputRows: sourceRows.map(row => ({
        rowNumber: row.rowNumber, w: [...row.w], ...(isQ ? {predictionA} : {}),
      })),
      values: [...data[key]], shownValues: sourceRows.map(row => row[key]),
    }];
  }));
  return {
    n, fullN: n, shownN, sourceRows, calls,
    baselineFeatureNames: [...data.baselineFeatureNames], featureNames: [...data.featureNames],
    fit: {
      n, scope: 'full-cohort', baselineCount: BASELINE_NAMES.length,
      designCount: FEATURE_NAMES.length, fittedHere: false,
    },
    provenance: {
      input: 'objectLessonData', rowOrder: 'supplied-cohort-order',
      rowNumberMeaning: 'one-based source position in the supplied cohort',
      selection: 'first-six', predictions: 'existing-full-cohort-fit',
      observedColumns: ['a', 'y'], observedColumnsRole: 'retained observations, not fixed-function prediction inputs',
    },
  };
}

/** Selection changes reading emphasis only; all three prediction columns remain. */
export function qgLessonView(lesson, key = 'q1') {
  if (!CALL_KEYS.includes(key) || !lesson?.calls?.[key] || !Array.isArray(lesson.sourceRows)) {
    throw Error('A qg lesson and one of q1, q0 or g are required');
  }
  return {
    ...lesson, selectedKey: key, selectedCall: lesson.calls[key],
    readingColumns: {w: true, predictionA: key !== 'g', a: false, y: false},
  };
}
