import {
  DEFAULT_MODEL, joint, fromJoint, ate, naive, eif, expit, logit,
  contaminate, pointScore, inner, project,
} from './math.js';

export {RHC_N as CASE_SIZE} from './rhc-config.js';
import {RHC_COUNTS} from './rhc-config.js';
export const CASE_COUNTS=RHC_COUNTS;

function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function validateCounts(rows) {
  if (!Array.isArray(rows) || rows.length !== 8) throw new TypeError('Eight observed count rows are required');
  const seen = new Set();
  const result = rows.map(row => {
    if (!row || !['x', 'a', 'y'].every(k => row[k] === 0 || row[k] === 1)) throw new RangeError('Cell coordinates must be binary');
    const key = `${row.x}${row.a}${row.y}`;
    if (seen.has(key)) throw new RangeError('Duplicate count cell');
    seen.add(key);
    if (!Number.isSafeInteger(row.n) || row.n <= 0) throw new RangeError('This finite-positive teaching case requires positive integer cell counts');
    return { x: row.x, a: row.a, y: row.y, n: row.n };
  }).sort((a, b) => a.x - b.x || a.a - b.a || a.y - b.y);
  if (!Number.isSafeInteger(result.reduce((s, r) => s + r.n, 0))) throw new RangeError('Total count exceeds safe integer range');
  return result;
}

/** Every quantity after CASE_COUNTS creation depends only on the supplied observations. */
export function caseData(rows = CASE_COUNTS) {
  const counts = validateCounts(rows);
  const n = counts.reduce((s, c) => s + c.n, 0);
  const cells = counts.map(c => ({ ...c, p: c.n / n }));
  const empiricalModel = fromJoint(cells);
  const arms = [0, 1].map(a => {
    const selected = counts.filter(c => c.a === a);
    return selected.reduce((s, c) => s + c.n * c.y, 0) / selected.reduce((s, c) => s + c.n, 0);
  });
  const initialFit = {
    px: [...empiricalModel.px], g: [...empiricalModel.g],
    q: arms.map(q => [q, q]),
  };
  const groups = [];
  for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) {
    const selected = counts.filter(c => c.x === x && c.a === a);
    const groupN = selected.reduce((s, c) => s + c.n, 0);
    const events = selected.reduce((s, c) => s + c.n * c.y, 0);
    const gHat = empiricalModel.g[x];
    groups.push({ x, a, n: groupN, events, qObserved: events / groupN,
      px: empiricalModel.px[x], gHat, h: a ? 1 / gHat : -1 / (1 - gHat),
      initialQ: arms[a], offset: logit(arms[a]),
    });
  }
  return { n, cells, groups, empiricalModel, initialFit,
    initialEstimate: ate(initialFit), observedDifference: naive(empiricalModel),
    marginalRisk: cells.reduce((s, c) => s + c.p * c.y, 0),
  };
}

const softplus = z => z > 0 ? z + Math.log1p(Math.exp(-z)) : Math.log1p(Math.exp(z));
function groupAt(group, epsilon, n) {
  const predictor = finite(group.offset + epsilon * group.h, 'Fluctuation predictor');
  const qUpdated = expit(predictor);
  const predictedEvents = group.n * qUpdated;
  const residualTotal = group.events - predictedEvents;
  const weightedResidual = group.h * residualTotal;
  return { ...group, qUpdated, predictedEvents, residualTotal, weightedResidual,
    scoreContribution: weightedResidual / n,
    slopeContribution: -group.n / n * group.h ** 2 * qUpdated * (1 - qUpdated),
    logLikelihoodContribution: (-group.events * softplus(-predictor) - (group.n - group.events) * softplus(predictor)) / n,
  };
}

export function caseAt(epsilon = 0, rows = CASE_COUNTS) {
  finite(epsilon, 'epsilon');
  const data = caseData(rows);
  const groups = data.groups.map(g => groupAt(g, epsilon, data.n));
  if (groups.some(g => g.qUpdated <= 0 || g.qUpdated >= 1)) throw new RangeError('epsilon yields a numerical probability boundary; use a smaller magnitude');
  const updatedFit = { px: [...data.initialFit.px], g: [...data.initialFit.g], q: [[0, 0], [0, 0]] };
  groups.forEach(g => { updatedFit.q[g.a][g.x] = g.qUpdated; });
  const estimate = ate(updatedFit);
  const score = groups.reduce((s, g) => s + g.scoreContribution, 0);
  const eifRows = data.cells.map(c => {
    const g = groups.find(g => g.x === c.x && g.a === c.a);
    const parts = eif(updatedFit, c);
    return { ...c, h: g.h, qUpdated: g.qUpdated, dx: parts.dx, dy: parts.dy, D: parts.total };
  });
  const eifMean = eifRows.reduce((s, c) => s + c.p * c.D, 0);
  const eifSecondMoment = eifRows.reduce((s, c) => s + c.p * c.D ** 2, 0);
  const eifVariance = eifRows.reduce((s, c) => s + c.p * (c.D - eifMean) ** 2, 0);
  return { ...data, epsilon, groups, updatedFit, estimate, score,
    slope: groups.reduce((s, g) => s + g.slopeContribution, 0),
    logLikelihood: groups.reduce((s, g) => s + g.logLikelihoodContribution, 0),
    aipw: estimate + score, eifRows, eifMean, eifSecondMoment, eifVariance,
    se: Math.sqrt(eifVariance / data.n),
  };
}

export function solveCase(rows = CASE_COUNTS) {
  const data = caseData(rows);
  const scoreAt = epsilon => data.groups.reduce((s, g) => s + groupAt(g, epsilon, data.n).scoreContribution, 0);
  const tolerance = 1e-12;
  if (Math.abs(scoreAt(0)) <= tolerance) return { ...caseAt(0, rows), converged: true, iterations: 0 };
  let lo = -1, hi = 1;
  for (let i = 0; (scoreAt(lo) < 0 || scoreAt(hi) > 0) && i < 60; i++) {
    if (scoreAt(lo) < 0) lo *= 2;
    if (scoreAt(hi) > 0) hi *= 2;
  }
  if (!(scoreAt(lo) >= 0 && scoreAt(hi) <= 0)) throw new RangeError('Could not bracket empirical score root');
  for (let iterations = 1; iterations <= 200; iterations++) {
    const epsilon = lo + (hi - lo) / 2;
    const score = scoreAt(epsilon);
    if (Math.abs(score) <= tolerance) return { ...caseAt(epsilon, rows), converged: true, iterations };
    if (score > 0) lo = epsilon; else hi = epsilon;
  }
  throw new Error('Empirical score root did not converge within 200 iterations');
}

export function countsCsv(rows = CASE_COUNTS) {
  return 'x,a,y,n\n' + validateCounts(rows).map(c => `${c.x},${c.a},${c.y},${c.n}`).join('\n') + '\n';
}

export function recordsCsv(rows = CASE_COUNTS) {
  let id = 0;
  return 'id,x,a,y\n' + validateCounts(rows).flatMap(c => Array.from({ length: c.n }, () => `${++id},${c.x},${c.a},${c.y}`)).join('\n') + '\n';
}

export function caseMeanDirection(index = 3, t = .01, rows = CASE_COUNTS) {
  const data = caseData(rows);
  if (!Number.isInteger(index) || index < 0 || index >= 8) throw new RangeError('Choose one of eight case cells');
  finite(t, 't');
  const p = data.cells.map(c => c.p);
  const updated = contaminate(p, index, t);
  if (updated.some(p => p <= 0)) throw new RangeError('This exercise requires strictly positive updated cell probabilities');
  const cells = data.cells.map((c, i) => {
    const h = (i === index ? 1 : 0) - c.p;
    const S = h / c.p, D = c.y - data.marginalRisk;
    return { ...c, updatedP: updated[i], h, S, D, contribution: c.p * D * S };
  });
  const updatedRisk = cells.reduce((s, c) => s + c.updatedP * c.y, 0);
  return { ...data, index, t, cells, updatedRisk, delta: updatedRisk - data.marginalRisk,
    quotient: t === 0 ? null : (updatedRisk - data.marginalRisk) / t,
    derivative: data.cells[index].y - data.marginalRisk,
    pairing: cells.reduce((s, c) => s + c.contribution, 0),
  };
}

/** Full observed-table target: use its saturated gradient, not the initial fitted function. */
export function caseDirections(rows = CASE_COUNTS) {
  const data = caseData(rows), p = data.cells.map(c => c.p);
  const D = data.cells.map(c => eif(data.empiricalModel, c).total);
  const targetAt = h => {
    const step = 1e-7;
    const value = t => ate(fromJoint(data.cells.map((c, i) => ({ ...c, p: c.p + t * h[i] }))));
    return (value(step) - value(-step)) / (2 * step);
  };
  const evaluate = (label, h, S) => {
    const paired = inner(p, D, S), numerical = targetAt(h);
    return { label, h, S, scoreMean: inner(p, S, p.map(() => 1)), paired, numerical, error: numerical - paired };
  };
  return { ...data, D,
    points: data.cells.map((c, i) => evaluate(`(${c.x},${c.a},${c.y})`, p.map((v, j) => (i === j ? 1 : 0) - v), pointScore(p, i))),
    contrasts: data.cells.slice(0, 7).map((c, i) => {
      const h = p.map((_, j) => (j === i ? 1 : 0) - (j === 7 ? 1 : 0));
      return evaluate(`(${c.x},${c.a},${c.y}) − (1,1,1)`, h, h.map((v, j) => v / p[j]));
    }),
  };
}

export function caseProjection(rows = CASE_COUNTS, coefficient = 1) {
  finite(coefficient, 'Projection coefficient');
  const data = caseData(rows), p = data.cells.map(c => c.p), model = data.empiricalModel;
  const D = data.cells.map(c => eif(model, c).total);
  const treatmentPart = data.cells.map(c => c.a - model.g[c.x]);
  const candidate = D.map((d, i) => d + coefficient * treatmentPart[i]);
  const basis = [data.cells.map(c => c.x - model.px[1])];
  for (let x = 0; x < 2; x++) for (let a = 0; a < 2; a++) basis.push(data.cells.map(c => c.x === x && c.a === a ? c.y - model.q[a][x] : 0));
  const projected = project(p, candidate, basis);
  return { ...data, coefficient, dimension: basis.length, D, candidate, treatmentPart, projected,
    removed: candidate.map((v, i) => v - projected[i]),
    maxError: Math.max(...D.map((v, i) => Math.abs(v - projected[i]))),
    candidateSecondMoment: inner(p, candidate, candidate), projectedSecondMoment: inner(p, projected, projected),
  };
}

/** A distinct, saturated empirical-distribution gradient for the chapter 7 comparison. */
export function caseEmpiricalMoments(rows = CASE_COUNTS) {
  const data = caseData(rows);
  const values = data.cells.map(c => eif(data.empiricalModel, c).total);
  const eifMean = data.cells.reduce((sum, c, i) => sum + c.p * values[i], 0);
  const eifSecondMoment = data.cells.reduce((sum, c, i) => sum + c.p * values[i] ** 2, 0);
  const eifVariance = data.cells.reduce((sum, c, i) => sum + c.p * (values[i] - eifMean) ** 2, 0);
  return { values, eifMean, eifSecondMoment, eifVariance, se: Math.sqrt(eifVariance / data.n) };
}
