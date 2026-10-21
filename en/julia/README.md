# Julia workbooks for manual TMLE

The English course uses the original RHC cohort. Its chapter workbooks are in `rhc_lessons/`; `object_ch00.jl`, `object_ch01.jl` and `tmle_trace.jl` provide continuous workbooks for the object figures and the ten-step update.

The retained `lessons/` workbooks demonstrate an earlier teaching example using a joint frequency table of 200 synthetic post-marketing RWS records. They are not evidence about real drug efficacy or safety and do not call a TMLE package. Only Julia Base and the standard libraries LinearAlgebra, Printf and Test are used. Julia modules do not read the JavaScript model or treat constructed values as truth available during fitting. Use the RHC workbooks to reproduce the data displayed in the English course.

Run at the project root:

```sh
JULIA_DEPOT_PATH=/private/tmp/eif-tutorial-julia-depot JULIA_HISTORY=/private/tmp/eif-tutorial-julia-history julia --startup-file=no --history-file=no tests/julia/runtests.jl
JULIA_DEPOT_PATH=/private/tmp/eif-tutorial-julia-depot JULIA_HISTORY=/private/tmp/eif-tutorial-julia-history julia --startup-file=no --history-file=no en/julia/run_case.jl
```

If the `juliaup` launcher fails because of lock-file permissions in the user configuration directory, replace `julia` with the actual executable from an existing installation. No package installation or user-configuration change is needed. The temporary depot holds only standard-library precompilation caches.

`run_case.jl` accepts an optional CSV path; by default it reads `shared/data/rws-counts.csv` at the project root. Every lesson’s include and default CSV paths use `@__DIR__`, so running an absolute script path does not depend on the working directory.

## Chapter sequence

| Chapter | Script | Core calculation and later use |
| --- | --- | --- |
| 01 | `julia en/julia/lessons/ch01.jl` | Event count/total gives endpoint risk, followed by the binary-mean IF; risk becomes a building block for conditional means |
| 02 | `julia en/julia/lessons/ch02.jl` | Mass-conserving direction at one cell, h and score, and mean-IF pairing; distinguish path position from direction |
| 03 | `julia en/julia/lessons/ch03.jl` | Four-group counts/events, empirical px, g and conditional risks; pooling by A alone gives initial Q |
| 04 | `julia en/julia/lessons/ch04.jl` | H and initial empirical EIF; inspect residual contributions and their mean, retaining the diagnostic before correction |
| 05 | `julia en/julia/lessons/ch05.jl` | ATE gradient-direction pairing in the full empirical model, including an outcome direction; finite checks do not replace an all-direction proof |
| 06 | `julia en/julia/lessons/ch06.jl` | Five-basis projection under original empirical probabilities and the canonical gradient; only this exercise assumes known g |
| 07 | `julia en/julia/lessons/ch07.jl` | Empirical IF variance/SE using cell probabilities, ready for recalculation after updating |
| 08 | `julia en/julia/lessons/ch08.jl` | Trial epsilon, explicit bisection, four-group Q updates and averaging over empirical X; check the empirical EIF equation |

The table omits `--startup-file=no --history-file=no` and temporary-depot settings; use the full form above in restricted environments. All eight scripts can run sequentially or independently, without resampling.

`shared/julia/EIFCase.jl` marks core functions with `# BEGIN_CH01`/`# END_CH01` through CH08 for display alongside lesson usage. Reading, validation and preparation for Chapter 3 precede the marked sections as shared input preparation. Other core functions retain chapter order. Chapter 3 summaries contain counts and proportions, without H or offset. Chapter 4 defines H through `clever_h`; Chapter 8 adds H and offset to updated group results. Shared vector/probability validation and weighted inner products lie outside marked sections. Include the whole module before execution; markers organise reading and do not imply identical dependencies.

The code is editable. Chapter 8’s core explicitly gives the mean score, mean log likelihood, derivative, logistic fluctuation, group predictions/residuals, bracket checks and bisection. Lesson 8 displays trial epsilon and the bisection loop. `solve_case` uses the same underlying operations for full recalculation and cross-language checks, without external estimation packages. Module definitions have one shared source; lessons demonstrate their use.

## Stable interface and indexing

```julia
include("shared/julia/EIFCase.jl")
using .EIFCase
counts = read_counts("shared/data/rws-counts.csv")
data = case_data(counts)
initial = case_at(data, 0.0)
updated = solve_case(data)
updated.converged || error(updated.reason)
```

The CSV requires header `x,a,y,n` and all eight cells with positive integer counts, without duplicates or omissions. Zero cells outside the current positive teaching model, non-integer counts, missing cells and invalid labels fail explicitly, without clipping. Input order may vary; output is sorted by x, a and y. Changed counts trigger recomputation of all probabilities.

- x, a and y are 0 or 1. Julia arrays start at 1: `q[a+1,x+1]` indexes treatment a by row and baseline x by column; `px[x+1]` and `g[x+1]` follow x. The four `groups` are ordered by x, then by a within each x stratum.
- `data` contains `n/cells/groups/empirical_model/initial_fit/initial_estimate/observed_difference/marginal_risk`. Each cell retains n and empirical probability p. Groups contain counts, events and `q_observed/p_x/g_hat/initial_q`, without depending on H or logit.
- `mean_if(data)` returns `risk/values/mean`. `point_direction(data,index)` returns `h/score/derivative/pairing`, with cell index 1–8. `linear_path(p,score,t)` rejects invalid non-positive paths.
- `direction_check(data,score;step=1e-6)` returns `finite_difference/pairing/difference`, using the full empirical model’s gradient at the origin. `projection_demo(data;b=1.0)` returns the candidate, five basis directions, projection, residual and squared norms. The misspecified initial-Q empirical function is not called the full empirical model’s canonical gradient.
- `if_variance(data,values)` returns `mean/second_moment/variance/se`. Variance subtracts the weighted mean before squaring; an uncentred second moment is not substituted for variance.
- `fluctuation_score(data,epsilon)` returns `score/slope/log_likelihood`, all averaged per record. `case_at(data,epsilon)` adds `h/offset` to group results and returns updated Q, predicted event counts, residuals, score contributions and `updated_fit/estimate/aipw/eif_rows/eif_mean/eif_second_moment/eif_variance/se`.
- `bisection_step(data,lo,hi)` checks the monotone-score root bracket and returns `midpoint/score` and next `lo/hi`. `solve_case(data;lo=-1.0,hi=1.0,score_tol=1e-12,maxiter=200)` returns the `case_at` result plus `converged/iterations/reason`. Invalid inputs or brackets fail; iteration limits or floating-point stagnation return `converged=false`. Callers must check this and cannot report a failed result as a solved TMLE.

## Output and statistical limits

`run_case.jl` prints `key,value` without a JSON package: n, initial estimate, score0, epsilon, four values such as `qstar_x0_a0`, score, target risk difference, empirical EIF mean/second moment/centred variance, SE and convergence information. Risk differences and SE remain in probability units; multiply by 100 for percentage points. Invalid inputs or failed roots cause process failure, without false-success output.

Chapter 7 separately computes moments of the initial fitted function and the gradient based on saturated empirical Q. These differ from Chapter 8’s updated-function empirical variance. Initial Q intentionally contains A alone; four updated Q values need not equal observed group risks pointwise. A zero empirical score or mean EIF does not prove correct outcome fitting, finite-sample unbiasedness or confidence-interval coverage. Updated SE is the square root of empirical function variance divided by n. Convergence to the true EIF has not been established, so this is not claimed to be a valid inferential SE or true efficiency bound. No confidence interval is printed.

Independent expected-value tests cover initial values, directions, projection, likelihood derivatives, the root and four updated Q values, plus input changes such as changing 16 events to 15 while retaining 20 patients, or doubling another group’s size. Expected values remain in tests, outside fitting algorithms. Module-author tests do not replace independent mathematical acceptance.

## Chapter 1 line-by-line code explanation

The earlier example’s 32-line explanation relates two explicit loops to mathematical sums. `mean_if` computes its own mean from total count and each cell’s n/y rather than retrieving a precalculated risk. The return fields `risk/values/mean` are unchanged. Lesson 1 uses println/round and prints empirical IF means before and after rounding. `ch01-output.txt` records actual execution output; Julia tests launch the script to check it. Handwritten “passed” or forced zeros cannot substitute for verification. Independent tests with changed counts check that the mean is genuinely recomputed.

In this synthetic example, Y is disease progression or all-cause death within 12 months, counted at most once per patient; events counts patients experiencing that endpoint. A=0 is active comparator B. The standardised risk difference is study drug A minus B, so positive values are adverse. Renaming the endpoint cannot turn synthetic efficacy outcomes into safety data.
