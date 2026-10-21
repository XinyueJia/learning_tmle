const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

(async () => {
  const { CASE_COUNTS: SOURCE_COUNTS, caseAt, solveCase, countsCsv } = await import('../shared/js/case-study.js');
  // Explicit historical fixture: the current source is tested by rhc-cross-language.cjs.
  const CASE_COUNTS=[24,56,4,16,16,4,40,40].map((n,i)=>({...SOURCE_COUNTS[i],n}));
  const near = (actual, expected, label, tolerance = 1e-9) => assert(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} != ${expected}`,
  );
  const temporary = mkdtempSync(join(tmpdir(), 'eif-julia-crosscheck-'));
  try {
    const alteredEvents = CASE_COUNTS.map(c => ({ ...c, n: c.n + (c.x === 0 && c.a === 1 ? c.y === 1 ? -1 : 1 : 0) }));
    const alteredComposition = CASE_COUNTS.map(c => ({ ...c, n: c.x === 1 && c.a === 1 ? 20 : c.n }));
    for (const [index, rows, expected] of [[0, CASE_COUNTS, .20], [1, alteredEvents, .175], [2, alteredComposition, .175]]) {
      const csvPath = join(temporary, `counts-${index}.csv`);
      writeFileSync(csvPath, countsCsv(rows));
      const output = execFileSync(process.env.JULIA_BIN || 'julia',
        ['--startup-file=no', '--history-file=no', 'zh/julia/run_case.jl', csvPath],
        { cwd: join(__dirname, '..'), encoding: 'utf8', timeout: 60000 });
      const pairs = output.trim().split(/\r?\n/);
      assert.equal(pairs.shift(), 'key,value');
      const julia = Object.fromEntries(pairs.map(line => {
        const [key, value] = line.split(',');
        return [key, Number(value)];
      }));
      const initial = caseAt(0, rows), js = solveCase(rows);
      near(js.estimate, expected, `independent fixture ${index}`);
      near(julia.estimate, expected, `Julia independent fixture ${index}`);
      for (const [key, value] of Object.entries({
        n: js.n, marginal_risk: js.marginalRisk, initial_estimate: js.initialEstimate,
        score0: initial.score, epsilon: js.epsilon, score: js.score,
        slope: js.slope, log_likelihood: js.logLikelihood, estimate: js.estimate,
        eif_mean: js.eifMean, eif_second_moment: js.eifSecondMoment,
        eif_variance: js.eifVariance, se: js.se,
      })) near(julia[key], value, `fixture ${index}: ${key}`);
      for (const g of js.groups) near(julia[`qstar_x${g.x}_a${g.a}`], g.qUpdated, `fixture ${index}: Q(${g.a},${g.x})`);
      assert.equal(julia.converged, 1);
      if (index === 0) {
        near(julia.initial_estimate, -.04, 'initial estimate');
        near(julia.score0, .24, 'initial empirical score');
        near(julia.epsilon, .16223923963495762, 'independently bracketed reference root');
        near(julia.eif_variance, 1.2192623957849897, 'independently enumerated updated function variance');
      }
      console.log(`PASS Julia/JavaScript and independent fixture ${index}: n=${julia.n}, estimate=${julia.estimate}`);
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
