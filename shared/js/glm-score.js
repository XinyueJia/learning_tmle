/** Single-observation Bernoulli scores and target derivatives at an interior mean. */
export function bernoulliScoreObjects(mu, y) {
  if (!Number.isFinite(mu) || mu <= 0 || mu >= 1) throw Error('An interior Bernoulli mean is required');
  if (y !== 0 && y !== 1) throw Error('A binary outcome is required');
  const information = mu * (1 - mu), scoreBeta = y - mu;
  return {y, mu, beta: Math.log(mu / (1 - mu)), information, scoreBeta,
    scoreMu: scoreBeta / information, ifLogit: scoreBeta / information,
    ifMean: scoreBeta, pairing: scoreBeta * scoreBeta};
}

/** Uses every observed outcome for the fixed empirical reference; preserves row order. */
export function glmScoreData(outcomes) {
  if (!Array.isArray(outcomes) || !outcomes.length || outcomes.some(y => y !== 0 && y !== 1)) {
    throw Error('Non-empty binary outcomes required');
  }
  const n = outcomes.length, events = outcomes.reduce((a, b) => a + b, 0), mu = events / n;
  const base = bernoulliScoreObjects(mu, 0);
  const rows = outcomes.map((y, i) => ({record: i + 1, ...bernoulliScoreObjects(mu, y)}));
  const support = [0, 1].map(y => {
    const row = bernoulliScoreObjects(mu, y), p = y ? mu : 1 - mu;
    return {...row, p, count: y ? events : n - events, weightedProduct: p * row.pairing};
  });
  return {n, events, mu, beta: base.beta, information: base.information, rows, support,
    pairedDerivative: support.reduce((total, row) => total + row.weightedProduct, 0)};
}
