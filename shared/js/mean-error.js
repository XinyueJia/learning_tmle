const sum = values => values.reduce((total, value) => total + value, 0);

/**
 * Compare a complete observed binary outcome vector with its empirical centre
 * and, optionally, an explicitly assumed reference mean. No model is fitted.
 * The population mean is unknown: a supplied reference never becomes its truth.
 */
export function meanErrorData(outcomes, reference = null) {
  if (!Array.isArray(outcomes) || outcomes.length === 0) {
    throw Error('A non-empty array of observed binary outcomes is required');
  }
  for (const value of outcomes) {
    if (value !== 0 && value !== 1) {
      throw Error('Observed outcomes must be numeric 0 or 1');
    }
  }
  if (reference !== null && (!Number.isFinite(reference) || reference < 0 || reference > 1)) {
    throw Error('The assumed reference mean must be null or a finite number in [0, 1]');
  }

  const Y = [...outcomes], n = Y.length, events = sum(Y), muhat = events / n;
  const support = [0, 1], counts = [n - events, events];
  const probabilities = counts.map(count => count / n);
  const sampleValues = Y.map(value => value - muhat);
  const sampleSupport = support.map(value => value - muhat);
  const sampleContributions = sampleSupport.map((value, i) => probabilities[i] * value);
  const sampleCentred = {centre: muhat, values: sampleValues, mean: sum(sampleValues) / n};
  // Estimated IF spread uses this one observed sample. This is the iid
  // sample-mean standard error, not this sample's unknown realised error.
  const sumSquares = sum(sampleValues.map(value => value * value));
  const sampleVariance = n > 1 ? sumSquares / (n - 1) : null;
  const iidMeanInference = {
    model: 'iid', n, degreesOfFreedom: n - 1, sumSquares,
    sampleVariance,
    standardDeviation: sampleVariance === null ? null : Math.sqrt(sampleVariance),
    standardError: sampleVariance === null ? null : Math.sqrt(sampleVariance / n),
  };
  const referenceValues = reference === null ? null : Y.map(value => value - reference);
  const referenceSupport = reference === null ? null : support.map(value => value - reference);
  const referenceContributions = referenceSupport === null ? null :
    referenceSupport.map((value, i) => probabilities[i] * value);

  return {
    n, events, muhat, outcomes: Y, reference,
    referenceStatus: reference === null ? 'unknown' : 'assumed',
    sampleCentred,
    iidMeanInference,
    referenceCentred: referenceValues === null ? null : {
      centre: reference, values: referenceValues, mean: sum(referenceValues) / n,
    },
    distance: reference === null ? null : muhat - reference,
    // An assumed m does not identify P0 or turn its IF/error into observed data.
    trueStatus: 'unknown', trueIF: null, trueError: null,
    symbolic: {
      populationMean: 'μ₀', trueIF: 'Yᵢ − μ₀',
      trueIFMean: '(1/n)∑ᵢ(Yᵢ − μ₀)', trueError: 'μ̂ − μ₀',
    },
    grouped: {
      alignment: 'outcome', patientN: n, support, counts, probabilities,
      sampleCentred: {
        values: sampleSupport, contributions: sampleContributions, mean: sum(sampleContributions),
      },
      referenceCentred: referenceSupport === null ? null : {
        values: referenceSupport, contributions: referenceContributions, mean: sum(referenceContributions),
      },
    },
  };
}
