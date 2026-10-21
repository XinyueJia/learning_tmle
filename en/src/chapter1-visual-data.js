import { mean, contaminate } from '../../shared/js/math.js';
import {RHC_MEAN_MODEL as MEAN_MODEL} from '../../shared/js/rhc-model.js';
import { CASE_COUNTS } from '../../shared/js/case-study.js';

/** Pure, unrounded data for the static steps in chapter 1. */
export function chapter1VisualData() {
  const values = [...MEAN_MODEL.values];
  const probabilities = [...MEAN_MODEL.probabilities];
  const mu = mean(values, probabilities);
  const meanContributions = values.map((value, i) => value * probabilities[i]);
  // These are observed people, unlike the fractional probability weights below.
  const counts = values.map(y => CASE_COUNTS.filter(row => row.y === y).reduce((sum, row) => sum + row.n, 0));
  const total = counts.reduce((sum, count) => sum + count, 0);
  const events = values.reduce((sum, value, i) => sum + value * counts[i], 0);

  const z = Math.max(...values), index = values.indexOf(z), t = .1, totalUnits = 100;
  const beforeUnits = probabilities.map(p => p * totalUnits);
  const removedUnits = beforeUnits.map(units => t * units);
  const retainedUnits = beforeUnits.map((units, i) => units - removedUnits[i]);
  const addedUnits = values.map((_, i) => i === index ? t * totalUnits : 0);
  const afterUnits = retainedUnits.map((units, i) => units + addedUnits[i]);
  const updatedProbabilities = contaminate(probabilities, index, t);
  const updatedMean = mean(values, updatedProbabilities);

  const directions = values.map(value => ({ z: value, d: value - mu }));
  const weightedContributions = directions.map(({ d }, i) => probabilities[i] * d);
  const functionMapRows = values.map((value, i) => {
    const updated = contaminate(probabilities, i, t);
    const exactMean = mean(values, updated);
    const delta = exactMean - mu;
    return { z: value, probabilities: updated, mean: exactMean, delta, rate: delta / t, d: value - mu };
  });
  const randomInfluenceRows = values.map((y, i) => ({
    y, probability: probabilities[i], d: y - mu, units: totalUnits * probabilities[i],
  }));
  const centeringProofRows = values.map((y, i) => ({
    y, probability: probabilities[i], weightedY: probabilities[i] * y,
    weightedBaseline: probabilities[i] * mu, weightedD: probabilities[i] * (y - mu),
  }));
  const meanTotal = centeringProofRows.reduce((sum, row) => sum + row.weightedY, 0);
  const baselineTotal = centeringProofRows.reduce((sum, row) => sum + row.weightedBaseline, 0);
  // Keep D referenced to the original mean when only its probability weights change.
  const referenceRows = values.map((y, i) => ({
    y, d: y - mu,
    originalProbability: probabilities[i], updatedProbability: updatedProbabilities[i],
    originalContribution: probabilities[i] * (y - mu),
    updatedContribution: updatedProbabilities[i] * (y - mu),
  }));
  const exercise = (value, proportion) => {
    const updated = contaminate(probabilities, values.indexOf(value), proportion);
    const updatedMean = mean(values, updated);
    return {
      z: value, t: proportion, probabilities: updated,
      meanContributions: values.map((v, i) => v * updated[i]),
      mean: updatedMean, delta: updatedMean - mu,
    };
  };

  return {
    sample: { values: [...values], counts, total, events, mean: events / total },
    base: { values: [...values], probabilities, mean: mu, meanContributions },
    replacement: {
      z, t, totalUnits, beforeUnits, removedUnits, retainedUnits, addedUnits, afterUnits,
      probabilities: updatedProbabilities, mean: updatedMean,
    },
    mixture: {
      retainedMass: 1 - t, addedMass: t,
      retainedMeanContribution: (1 - t) * mu,
      addedMeanContribution: t * z,
      updatedMean,
      removedMeanContribution: t * mu,
      delta: updatedMean - mu,
    },
    rates: [.1, .01, .001].map(proportion => {
      const exactMean = mean(values, contaminate(probabilities, index, proportion));
      const delta = exactMean - mu;
      return { t: proportion, exactMean, delta, rate: delta / proportion };
    }),
    directions,
    functionMap: { t, rows: functionMapRows },
    randomInfluence: { rows: randomInfluenceRows },
    centeringProof: {
      rows: centeringProofRows,
      mass: probabilities.reduce((sum, probability) => sum + probability, 0),
      meanTotal, baselineTotal, difference: meanTotal - baselineTotal,
      unweightedMean: values.reduce((sum, y) => sum + (y - mu), 0) / values.length,
    },
    referenceDistribution: {
      z, t, referenceMean: mu, updatedMean, rows: referenceRows,
      originalTotal: referenceRows.reduce((sum, row) => sum + row.originalContribution, 0),
      updatedTotal: referenceRows.reduce((sum, row) => sum + row.updatedContribution, 0),
    },
    exercises: [exercise(values[1], .2), exercise(values[0], .8)],
    centering: {
      directions: directions.map(({ d }) => d), weightedContributions,
      total: weightedContributions.reduce((sum, value) => sum + value, 0),
    },
    boundary: { z, minStrict: -probabilities[index] / (1 - probabilities[index]), maxStrict: 1 },
    survival: {
      month: 30, risk: mu, eventFree: 1 - mu,
      updatedRisk: updatedMean, updatedEventFree: 1 - updatedMean,
      riskDelta: updatedMean - mu, eventFreeDelta: mu - updatedMean,
      rows: values.map(y => ({ y, eventFree: 1 - y, riskD: y - mu, eventFreeD: (1 - y) - (1 - mu) })),
    },
    // Hypothetical encoding examples only: the fixed CSV contains no dates.
    survivalWindow: {
      month: 30, schematic: true,
      rows: [
        { id: 'event', eventMonth: 10, lastSeenMonth: 10, y: 1 },
        { id: 'event-free', eventMonth: null, lastSeenMonth: 35, y: 0 },
        { id: 'unknown', eventMonth: null, lastSeenMonth: 20, y: null },
      ],
    },
  };
}
