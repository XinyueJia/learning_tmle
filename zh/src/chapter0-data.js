import {cloneModel,ate} from '../../shared/js/math.js';
import {RHC_MODEL as DEFAULT_MODEL} from '../../shared/js/rhc-model.js';

/** Pure population summaries; endpoints are supported here by direct finite sums. */
export function chapter0Data({ population = DEFAULT_MODEL.px[1], target = 'ate', assignment = 'observational', referenceModel=DEFAULT_MODEL } = {}) {
  if (typeof population !== 'number' || !Number.isFinite(population)) {
    throw new TypeError('Population probability must be finite');
  }
  if (population < 0 || population > 1) {
    throw new RangeError('Population probability must lie between zero and one');
  }
  if (!['ate', 'risk1', 'risk0'].includes(target)) {
    throw new RangeError('Unknown chapter 0 target');
  }
  if (!['observational', 'randomised'].includes(assignment)) {
    throw new RangeError('Unknown chapter 0 assignment');
  }

  const model = cloneModel(referenceModel);
  model.px = [1 - population, population];
  if (assignment === 'randomised') model.g = [.5, .5];
  const rows = model.px.map((p, x) => {
    const q0 = model.q[0][x], q1 = model.q[1][x];
    return {
      x, p, q0, q1, g: model.g[x], cate: q1 - q0,
      contribution0: p * q0, contribution1: p * q1,
    };
  });
  const risk0 = rows.reduce((sum, row) => sum + row.contribution0, 0);
  const risk1 = rows.reduce((sum, row) => sum + row.contribution1, 0);
  const ate = risk1 - risk0;
  // Observed treatment groups have their own X weights; this is an association.
  // Direct sums also work when a population group has zero mass, unlike core validation.
  const observedRisk = a => {
    const masses = rows.map(row => row.p * (a === 1 ? row.g : 1 - row.g));
    const success = masses.reduce((sum, mass, x) => sum + mass * model.q[a][x], 0);
    return success / masses.reduce((sum, mass) => sum + mass, 0);
  };
  const observedRisk1 = observedRisk(1), observedRisk0 = observedRisk(0);
  const naive = observedRisk1 - observedRisk0;
  const targets = {
    ate: { value: ate, label: '平均处理效应（ATE）', unit: '概率差' },
    risk1: { value: risk1, label: '所有人接受RHC时的风险', unit: '概率' },
    risk0: { value: risk0, label: '所有人未接受RHC时的风险', unit: '概率' },
  };
  const selected = targets[target];
  return {
    model, target, assignment, rows, risk0, risk1, ate, naive, observedRisk1, observedRisk0,
    targetValue: selected.value, targetLabel: selected.label, unit: selected.unit,
  };
}

/** Fixed fitted-distribution errors, not repeated-sampling bias or an EIF. */
export function chapter0ErrorData(referenceModel=DEFAULT_MODEL) {
  const truth = cloneModel(referenceModel);
  const target = ate(truth);
  const riskError = .02;
  const scenarios = [1, 0].map(a => {
    const fit = cloneModel(truth);
    fit.q[a][0] += riskError;
    const risk0 = fit.px.reduce((sum, p, x) => sum + p * fit.q[0][x], 0);
    const risk1 = fit.px.reduce((sum, p, x) => sum + p * fit.q[1][x], 0);
    const estimate = ate(fit);
    return { a, x: 0, truthRisk: truth.q[a][0], fittedRisk: fit.q[a][0],
      fit, risk0, risk1, estimate, error: estimate - target };
  });
  return { truth, target, riskError, scenarios };
}
