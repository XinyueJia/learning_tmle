# Chapter 1 object expressions: independent mathematics and pedagogy review

Status: source-level mathematics and pedagogy gate passed after local fixes; both Julia workbooks executed successfully by this reviewer. Lead integration acceptance is recorded separately below. This is a new review, not an inherited browser pass.

Scope: Chapter 1 object expressions and their direct data/runtime interfaces. Reviewed `zh/docs/COURSE_CONTRACT.md`, `zh/src/chapters/ch01.md`, `shared/julia/RHCCase.jl` and the executable `zh/julia/rhc_lessons/ch01.jl`. No core or chapter files are owned by this reviewer.

Required acceptance checks:

- The patient outcome vector has 5735 entries and weights 1/5735. A preview shows explicitly identified rows and omission marks; its six entries cannot be summed and labelled as the 5735-person result.
- Grouping into support values y=0,1 changes the row keys visibly. The 2 × 1 support vector and its probabilities (3817/5735, 1918/5735) produce exactly the same mean as the full patient vector. A support row is not a patient row.
- Weight perturbation holds the 0/1 support fixed and computes p_t=(1−t)p+t e_z, followed by support × new probability and a sum. This neither rewrites patient outcomes nor assigns treatment.
- For D=Y−μ, the n-vector preview uses patient keys, while the grouped function values (−μ,1−μ) use support keys. A selected patient highlights a contribution and leaves the full weighted mean invariant.
- The expected influence value uses the matching weights, and its zero value is identified as an aggregate property, not an assertion that each influence value is zero.
- Julia `y .- risk` explicitly denotes broadcasting a scalar subtraction across a vector. Mathematical rowwise multiplication and cross-row summation have distinct symbols and dimension labels. Julia transpose `'`, if used for a weighted inner product, is explained and cannot be confused with a broadcast dot.
- Reference μ stays fixed while p_t changes; a new distribution's centring function is distinguished from the original D. μ is empirical/reference rather than a known P0 mean.
- All object meanings and row identities remain legible without colour, controls are labelled, and mathematical text remains accessible.

The initial design checklist was followed by the completed source and executable reviews below. Browser, keyboard and viewport tests were delegated to the lead; their results are recorded separately at close-out.

## First implementation pass

Reviewed all 13 Chapter 1 stages in `zh/src/object-grammar.js`, their wrapper in `zh/renderers/chapter1-visuals.js`, the live runtime, the two object workbooks and the added chapter explanation.

The independently expanded calculation is correct: the two-support mean is p(0)×0+p(1)×1; perturbation preserves total mass; its new mean is (1−t)μ+tz, hence μ_t−μ=t(z−μ). At t=0 the finite quotient is undefined while the derivative remains z−μ; at t=1 the distribution is concentrated at z. The old influence function has new-weight expectation μ_t−μ, and the new function centred at μ_t has new-weight expectation zero. The renderer uses the correct data values for each of these statements. Both centring and linearity show the full distribution and cancellation steps rather than assuming the answer.

The patient-versus-support row transition is explicit; support rows never carry patient data-record attributes. All whole-cohort results use n=5735, while paging/selecting only changes presentation state. P=P_n and unknown P0 are kept distinct. The old 18 figures remain available, and the collapsed worked-example wrappers clearly state their fixed z=1, t=0.1 conditions.

Issues sent to the author:

1. The Chapter 0 workbook defines `expit(x)` after importing the exported RHCCase function with `using`. Julia normally requires explicit import to extend that binding. Use the existing exported function. Direct execution through the available Juliaup launcher failed before running the script because the launcher could not create its configuration lockfile; no workbook pass is claimed here.
2. The Julia scalar label is always `risk`, while grouped operations and their code snippets use `mu`. Make their alias and fixed-reference role explicit.
3. The old/new stage displays the new function but leaves its new-weight multiplication and sum-to-zero in text/code only. Put those objects in the expression body as well.

No false clinical causal claim was found. Browser, keyboard and viewport acceptance remain outside this source review.

## Final source and workbook gate

All three first-pass issues are closed. The scalar names now explicitly relate `mu` to `risk`, with their fixed-reference and empirical roles explained. The old/new stage renders the full new-weight multiplication, contribution vector, sum and re-centred scalar. The point-mass object is identified as its two support masses. The Chapter 0 workbook uses the exported expit and the fit's Float64 outcome vector, retaining every original outcome value.

This reviewer executed both workbooks with the installed Julia 1.12.5 binary and a writable temporary depot. Both exited 0 with their assertion success messages. Chapter 0 returned n=5735, Q input shape (5735,18) and initial risk difference 0.0864988559023306. Chapter 1 returned risk 0.33443766346992154, new mean 0.40099389712292943 at z=1,t=0.1, old-function/new-weight mean 0.06655623365300789 and re-centred mean −2.7755575615628914e−17. The workbook also checks both z values at t=0,0.01,0.1,1 and finite-difference derivatives.

No source-level mathematical or pedagogy blocker remains. The 13 object stages correctly separate patient/support/coefficient alignments, vector/scalar operations, actual observations from perturbation weights, and fixed-reference from changed-reference functions. Clinical causal identification and learning effectiveness are not established by these checks. Browser layout and real keyboard/viewport behaviour were not tested by this reviewer.

## Lead integration acceptance

The lead reports the following completed integration checks. These browser and whole-suite checks were run by the lead, not this independent reviewer; browser presentation acceptance is complete on that evidence. The independent source gate and the workbooks personally run by this reviewer remain separately documented above.

- `object-browser.cjs` passed twice (exit 0), covering 1360 px and 375 px viewports: colour provenance, 36 px patient-row alignment, pagination retaining all 5735 records in calculations, mathematical/Julia modes, reset, keyboard operation, t=0/t=1, z=0/z=1, old/new D, 17 source cards, duplicate-ID absence, external-request absence, console errors and page overflow.
- `rhc-browser.cjs` passed (exit 0) across all nine chapters at both viewports.
- The full JavaScript suite passed 124/124 with zero skipped tests. Existing RHC Julia checks passed 127/127. Both object workbooks and the cross-language comparison of 23 summaries, eight cells, 35 coefficients and 17 features passed (exit 0).

This reviewer checked the two final source clarifications: the legend distinguishes mathematical n × 1 column presentation from a Julia one-dimensional `Vector` with `size == (n,)`; the retained survival-complement formula recall now correctly describes 30-day all-cause death, matching the actual RHC endpoint. These changes preserve the independent source acceptance.

Source snapshot for `zh/src/object-grammar.js` at this close-out: SHA-256 `1036d62ada548b140d4676aebbe9816d565d6013a5a64060a6ae4159f8fea51a`. These checks do not establish clinical causal identification or learning effectiveness.
