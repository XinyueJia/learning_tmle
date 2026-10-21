import {prepareRhc, HISTORY} from './rhc.js';
import {contaminate} from './math.js';

const sum = values => values.reduce((total, value) => total + value, 0);
const dot = (left, right) => sum(left.map((value, i) => value * right[i]));

function outcomeData(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.some(row => ![0, 1].includes(row.y))) {
    throw Error('Non-empty observed binary outcomes required');
  }
  const n = rows.length, Y = rows.map(row => row.y), sumY = sum(Y), meanY = sumY / n;
  const D = Y.map(y => y - meanY), y = [0, 1];
  const counts = y.map(value => Y.filter(observed => observed === value).length);
  const p = counts.map(count => count / n);
  const groupedD = y.map(value => value - meanY);
  const py = p.map((probability, i) => probability * y[i]);
  const pD = p.map((probability, i) => probability * groupedD[i]);
  return {
    Y,
    mean: {n, sumY, meanY, risk: meanY, D, meanD: sum(D) / n},
    grouped: {
      n: 2, patientN: n, alignment: 'outcome', values: y, y, counts, p,
      probabilities: p, py, D: groupedD, pD, meanY: sum(py), meanD: sum(pD),
    },
  };
}

function checkFit(rows, fit) {
  const n = rows.length;
  if (fit.n !== n || !Array.isArray(fit.X) || fit.X.length !== n ||
      !Array.isArray(fit.featureNames) || !fit.featureNames.length ||
      fit.X.some(row => row.length !== fit.featureNames.length || row.some(value => !Number.isFinite(value))) ||
      !Array.isArray(fit.gFit?.beta) || fit.gFit.beta.length !== fit.featureNames.length ||
      !Array.isArray(fit.qFit?.beta) || fit.qFit.beta.length !== fit.featureNames.length + 1 ||
      [...fit.gFit.beta, ...fit.qFit.beta].some(value => !Number.isFinite(value)) ||
      ['g', 'q0', 'q1'].some(key => !Array.isArray(fit[key]) || fit[key].length !== n ||
        fit[key].some(value => !Number.isFinite(value) || value <= 0 || value >= 1))) {
    throw Error('Prepared RHC fit and observed rows must have matching finite dimensions');
  }
  if (!fit.rows || fit.rows.length !== n || fit.rows.some((row, i) => {
    const observed = rows[i];
    return ['x', 'a', 'y', 'age', 'race'].some(key => row[key] !== observed[key]) ||
      !Array.isArray(row.history) || !Array.isArray(observed.history) ||
      row.history.length !== observed.history.length || row.history.some((value, j) => value !== observed.history[j]);
  })) throw Error('Prepared RHC fit must preserve the supplied observation order and values');
}

function metadata(id, kind, symbol, label, dimensions, alignment, values) {
  return {id, colourKey: id, kind, symbol, label, dimensions, alignment, values};
}

/**
 * Unrounded, source-ordered objects for formula and Julia illustrations.
 * Pagination selects displayed rows only; fitting and every mean use all n rows.
 * W is the 17-column prepared design (including intercept and standardised age).
 */
export function objectLessonData(rows, fit = prepareRhc(rows), {start = 0, count = 6} = {}) {
  const outcomes = outcomeData(rows), n = rows.length;
  if (rows.some(row => ![0, 1].includes(row.a))) throw Error('Observed binary treatments required');
  if (!Number.isInteger(start) || start < 0 || start > n || !Number.isInteger(count) || count < 1) {
    throw Error('Display start and positive count must be integer cohort positions');
  }
  checkFit(rows, fit);
  const W = fit.X.map(row => [...row]), featureNames = [...fit.featureNames];
  const baselineW = rows.map(row => [row.x, row.age, row.race, ...row.history]);
  const baselineFeatureNames = ['male', 'age', 'race', ...HISTORY];
  const A = rows.map(row => row.a), Y = outcomes.Y;
  const predictionA0 = Array(n).fill(0), predictionA1 = Array(n).fill(1);
  const qCoefficients = [...fit.qFit.beta], gCoefficients = [...fit.gFit.beta];
  const g = [...fit.g], q0 = [...fit.q0], q1 = [...fit.q1];
  const qa = A.map((a, i) => a ? q1[i] : q0[i]);
  const riskDifference = q1.map((value, i) => value - q0[i]);
  const initialRiskDifference = sum(riskDifference) / n;
  const displayIndices = Array.from({length: Math.min(count, n - start)}, (_, i) => start + i);
  const rowNumbers = displayIndices.map(index => index + 1);
  const shown = displayIndices.map(index => ({
    index, rowNumber: index + 1, x: rows[index].x, a: A[index], y: Y[index],
    age: rows[index].age, race: rows[index].race, history: [...rows[index].history],
    w: [...W[index]], g: g[index], q0: q0[index], q1: q1[index], qa: qa[index],
    riskDifference: riskDifference[index], influence: outcomes.mean.D[index],
  }));
  const {mean, grouped} = outcomes;
  const objects = {
    y: metadata('y', 'vector', 'Y', '观察到的30天结局', [n, 1], 'patient', Y),
    a: metadata('a', 'vector', 'A', '观察到的RHC治疗', [n, 1], 'patient', A),
    design: metadata('design', 'matrix', 'W', '完整基线设计矩阵', [n, featureNames.length], 'patient', W),
    g: metadata('g', 'vector', 'g(W)', '治疗概率预测', [n, 1], 'patient', g),
    q0: metadata('q0', 'vector', 'Q(0,W)', '全A=0的结局预测', [n, 1], 'patient', q0),
    q1: metadata('q1', 'vector', 'Q(1,W)', '全A=1的结局预测', [n, 1], 'patient', q1),
    qa: metadata('qa', 'vector', 'Q(A,W)', '按真实A逐行选择的预测', [n, 1], 'patient', qa),
    'risk-difference': metadata('risk-difference', 'vector', 'Q(1,W)−Q(0,W)', '逐人预测风险差', [n, 1], 'patient', riskDifference),
    influence: metadata('influence', 'vector', 'Y−μ', '逐人均值影响值', [n, 1], 'patient', mean.D),
    p: metadata('p', 'vector', 'p', '两个结局的经验概率', [2, 1], 'outcome', grouped.p),
    'y-support': metadata('y-support', 'vector', 'y', '两个可能结局', [2, 1], 'outcome', grouped.y),
    D: metadata('D', 'vector', 'D(y;P)', '两个结局的均值影响值', [2, 1], 'outcome', grouped.D),
    contrib: metadata('contrib', 'vector', 'p⊙y', '两个结局的均值贡献', [2, 1], 'outcome', grouped.py),
    'influence-contrib': metadata('influence-contrib', 'vector', 'p⊙D', '两个结局的影响值贡献', [2, 1], 'outcome', grouped.pD),
    scalar: metadata('scalar', 'scalar', 'μ', '全队列经验事件风险', [], 'cohort', mean.meanY),
    'risk-scalar': metadata('risk-scalar', 'scalar', 'mean(Q1−Q0)', '全队列初始预测风险差', [], 'cohort', initialRiskDifference),
  };
  // Canonical names also match the Julia object map; shorthand keys remain convenient for formula renderers.
  const canonical = {
    outcomes: 'y', 'treatment-vector': 'a', 'design-matrix': 'design',
    propensity: 'g', probability: 'p', 'support-y': 'y-support',
    'support-influence': 'D', 'mean-contribution': 'contrib',
    'if-contribution': 'influence-contrib', risk: 'scalar',
  };
  for (const [id, key] of Object.entries(canonical)) {
    objects[key].id = id;
    objects[key].colourKey = id;
    objects[id] = objects[key];
  }
  objects['outcome-vector'] = objects.outcomes;
  objects.qa.sourceIds = A.map(a => a ? 'q1' : 'q0');
  objects.qa.selection = 'observed-treatment';
  objects['prediction-a0'] = metadata('prediction-a0', 'vector', '0ₙ', '全A=0预测输入列', [n, 1], 'patient', predictionA0);
  objects['prediction-a1'] = metadata('prediction-a1', 'vector', '1ₙ', '全A=1预测输入列', [n, 1], 'patient', predictionA1);
  objects['q-coefficients'] = metadata('q-coefficients', 'vector', 'β_Q', '结局模型拟合系数', [qCoefficients.length, 1], 'feature', qCoefficients);
  objects['q-coefficients'].featureKeys = [...featureNames, 'A'];
  objects['g-coefficients'] = metadata('g-coefficients', 'vector', 'β_g', '治疗模型拟合系数', [gCoefficients.length, 1], 'feature', gCoefficients);
  objects['g-coefficients'].featureKeys = [...featureNames];
  objects.events = metadata('events', 'scalar', 'sum(y)', '全队列30天事件人数', [], 'cohort', mean.sumY);
  objects['sample-size'] = metadata('sample-size', 'scalar', 'n', '全队列人数', [], 'cohort', n);
  objects['mean-influence'] = metadata('mean-influence', 'scalar', 'mean(D)', '逐人影响值的全队列平均', [], 'cohort', mean.meanD);
  objects['baseline-w'] = metadata('baseline-w', 'matrix', 'W_raw', '15个基线变量（年龄与种族保留原值）', [n, baselineFeatureNames.length], 'patient', baselineW);
  return {
    n, fullN: n, start, count: shown.length, requestedCount: count, displayIndices, rowNumbers, shown,
    W, X: W, featureNames, baselineW, baselineFeatureNames, A, a: A, Y, y: Y, g, q0, q1, qa, riskDifference,
    predictionA0, predictionA1, qCoefficients, gCoefficients,
    initialRiskDifference, initialEstimate: initialRiskDifference,
    ageMean: fit.ageMean, ageSd: fit.ageSd, mean, grouped, objects,
  };
}

/**
 * Reweight the two-outcome distribution; this does not manufacture patient rows.
 * originalD is centred under P, newD under P_t. They are deliberately distinct.
 * Accept lesson data or parsed observed rows, so chapter 1 needs no model fitting.
 */
export function meanContamination(dataOrRows, {z = 1, t = 0} = {}) {
  const grouped = Array.isArray(dataOrRows) ? outcomeData(dataOrRows).grouped : dataOrRows?.grouped;
  if (!grouped || grouped.y?.length !== 2 || grouped.y[0] !== 0 || grouped.y[1] !== 1 ||
      !Array.isArray(grouped.p) || grouped.p.length !== 2 || ![0, 1].includes(z)) {
    throw Error('The observed two-outcome distribution and a binary contamination point are required');
  }
  const y = [...grouped.y], p = [...grouped.p], newP = contaminate(p, z, t);
  const originalMean = dot(p, y), newMean = dot(newP, y);
  const originalD = y.map(value => value - originalMean), newD = y.map(value => value - newMean);
  const pointP = y.map(value => +(value === z));
  const retainedP = p.map(probability => (1 - t) * probability);
  const addedP = pointP.map(probability => t * probability);
  const weightedY = newP.map((probability, i) => probability * y[i]);
  const weightedOldD = newP.map((probability, i) => probability * originalD[i]);
  const weightedNewD = newP.map((probability, i) => probability * newD[i]);
  const delta = newMean - originalMean, derivative = z - originalMean;
  return {
    n: 2, patientN: grouped.patientN, alignment: 'outcome', z, t, y, p,
    retainedP, pointP, addedP, newP, originalMean, newMean, delta,
    rate: t === 0 ? null : delta / t, derivative, linearMean: originalMean + t * derivative,
    originalD, newD, weightedY, weightedOldD, weightedNewD,
    originalMeanD: dot(p, originalD), oldMeanD: sum(weightedOldD), newMeanD: sum(weightedNewD),
    probabilitySum: sum(newP),
  };
}
