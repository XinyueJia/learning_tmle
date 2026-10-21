const sum = values => values.reduce((total, value) => total + value, 0);

function assertProbabilities(probabilities) {
  if (probabilities.some(value => !Number.isFinite(value) || value < 0 || value > 1) ||
      Math.abs(sum(probabilities) - 1) > 8 * Number.EPSILON) {
    throw Error('Outcome probabilities must lie in [0, 1] and sum to one');
  }
}

/**
 * Transfer delta probability mass from outcome 0 to outcome 1, keeping the
 * observed cohort and the original mean influence function fixed.
 * The equality of the paired and exact changes is specific to this linear mean.
 * No model is fitted and no patient outcome is manufactured or altered.
 */
export function meanTransfer(outcomes, delta = 0) {
  if (!Array.isArray(outcomes) || outcomes.length === 0) {
    throw Error('A non-empty array of observed binary outcomes is required');
  }
  for (const value of outcomes) {
    if (value !== 0 && value !== 1) throw Error('Observed outcomes must be numeric 0 or 1');
  }
  if (!Number.isFinite(delta)) throw Error('The probability transfer must be a finite number');

  const Y = [...outcomes], n = Y.length, events = sum(Y);
  const support = [0, 1], counts = [n - events, events];
  const baseP = counts.map(count => count / n);
  const allowed = [-baseP[1], baseP[0]];
  // Bounds use the actual computed probabilities, with no tolerance or clamping.
  if (delta < allowed[0] || delta > allowed[1]) {
    throw Error('The probability transfer must lie in [-p1, p0]');
  }
  const changedP = [baseP[0] - delta, baseP[1] + delta];
  assertProbabilities(baseP);
  assertProbabilities(changedP);

  const baseMean = events / n;
  const changedMean = sum(changedP.map((probability, i) => probability * support[i]));
  const directionWeights = [-delta, delta];
  const fixedInfluence = [-baseMean, 1 - baseMean];
  const weightedTerms = directionWeights.map((weight, i) => weight * fixedInfluence[i]);
  return {
    n, events, outcomes: Y, support, counts, delta, allowed,
    baseP, changedP, baseMean, changedMean, exactChange: changedMean - baseMean,
    directionWeights, fixedInfluence, weightedTerms, pairedChange: sum(weightedTerms),
    baseProbabilitySum: sum(baseP), changedProbabilitySum: sum(changedP),
  };
}
