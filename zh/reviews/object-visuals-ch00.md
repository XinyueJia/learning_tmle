# Chapter 0 object expressions: independent mathematics and pedagogy review

Status: source-level mathematics and pedagogy gate passed after local fixes. Lead integration acceptance is recorded separately below. This is a new review, not an inherited browser pass.

Scope: Chapter 0 object expressions and their direct data/runtime interfaces. Reviewed `zh/docs/COURSE_CONTRACT.md`, `zh/src/chapters/ch00.md`, `shared/julia/RHCCase.jl`, `shared/js/rhc.js` and the existing RHC full-analysis interface. No core or chapter files are owned by this reviewer.

The proposed approach matches the contract when the matrix/vector/scalar objects appear inside the calculation, rather than being replaced by process arrows. The full baseline design has 17 columns: intercept, male, age_z, two race indicators and 12 histories. Its shape is 5735 × 17; the outcome fit appends observed A for 5735 × 18, whereas g receives the 17-column baseline design. Keep the empirical cohort and its row ordering fixed in both prediction inputs.

Required acceptance checks:

- Every displayed patient row has an explicit original row key; W, actual A/Y, initial g, Q0 and Q1 retain that correspondence. A six-row preview is labelled as a preview, and any reported full-cohort mean uses all 5735 rows.
- Prediction inputs change the appended A column to all 0 or all 1, while retaining W. Original A and Y remain visibly separate. Q(A,W) selects Q0 or Q1 by the original A, row by row.
- Q1−Q0 is a vector of fitted conditional risk differences; it is not an estimate of each person's causal effect. The final mean uses the same population in each arm and has the probability-difference unit, with ×100 labelled pp.
- Initial fitted Q and g have hats or equivalent explicit fitted labels. This chapter does not pretend that the true P0, true causal effect, or sufficiency of W is known.
- Matrix, vector and scalar shapes have dimensions and written meanings. Colours remain stable, but labels, row keys and borders carry the meaning without colour.
- Julia operation labels match the executable API and distinguish matrix multiplication, expit broadcast, elementwise selection and cross-patient mean.
- The implementation is accessible HTML/SVG with readable mathematical equivalents; original external raster figures are not copied into the course.

The initial design checklist was followed by the completed source and executable reviews below. Browser, keyboard and viewport tests were delegated to the lead; their results are recorded separately at close-out.

## First implementation pass

Reviewed the first `zh/src/object-grammar.js` and `shared/js/object-data.js` source. The data layer derives predictions from the prepared full RHC fit, validates dimensions and original observation order, selects qa with original A, and computes the initial risk difference from all n rows. Patient preview and coefficient rows use different alignment keys; this is the correct distinction.

Three source issues were sent to the author and remain open at this pass:

1. Julia fit mode visibly places y before hcat(design,a), reversing the actual function arguments. The accurate code block underneath does not repair the contradictory object expression.
2. Julia prediction mode does not group hcat(design, scenarioA) as the n×18 matrix before multiplication by the 18×1 coefficients. The full object expression must show this grouping and actual Julia operand order.
3. No propensity vector or fitted g expression is rendered in the current stages, despite available data and the request for initial g/Q objects.

These are implementation acceptance blockers, not claims about a browser run.

## Source gate after fixes

The second implementation now shows the correct Julia fit argument order; hcat(design, scenarioA) is explicitly grouped and labelled 5735 × 18 before multiplication by the 18 × 1 coefficient vector; and the g details include the fitted 5735 × 1 probability vector. All three first-pass blockers are closed.

The source/runtime preserves original row keys, fixed full-cohort means, actual-A selection, same-W prediction scenarios and initial fitted labels. Selecting or paging rows changes display state only. No source-level mathematical blocker remains for Chapter 0. It is appropriate to proceed to Chapter 1 implementation.

This gate does not certify CSS layout, real keyboard behaviour, viewport overflow, clinical causal identification, or learning effectiveness. Those were not tested by this reviewer.

## Workbook follow-up

The new Chapter 0 continuous object workbook was reviewed after the Chapter 1 integration. A first-pass imported-function redefinition and integer/Float64 fit-interface issue were repaired by the author. This reviewer then executed the installed Julia 1.12.5 binary with a writable temporary depot: the workbook exited 0, confirmed n=5735 and Q input shape (5735,18), and returned initial_estimate=0.0864988559023306. Its assertions check unchanged actual A, qa selection, prediction bounds and agreement with direct actual-A prediction. This adds executable evidence; it does not constitute browser acceptance.

## Lead integration acceptance

The lead reports the following completed integration checks. These browser and whole-suite checks were run by the lead, not this independent reviewer; browser presentation acceptance is complete on that evidence. The independent source gate and the workbooks personally run by this reviewer remain separately documented above.

- `object-browser.cjs` passed twice (exit 0), covering 1360 px and 375 px viewports: colour provenance, 36 px patient-row alignment, pagination retaining all 5735 records in calculations, mathematical/Julia modes, reset, keyboard operation, t=0/t=1, z=0/z=1, old/new D, 17 source cards, duplicate-ID absence, external-request absence, console errors and page overflow.
- `rhc-browser.cjs` passed (exit 0) across all nine chapters at both viewports.
- The full JavaScript suite passed 124/124 with zero skipped tests. Existing RHC Julia checks passed 127/127. Both object workbooks and the cross-language comparison of 23 summaries, eight cells, 35 coefficients and 17 features passed (exit 0).

This reviewer checked the two final source clarifications: the legend distinguishes mathematical n × 1 column presentation from a Julia one-dimensional `Vector` with `size == (n,)`; the retained survival-complement formula recall now correctly describes 30-day all-cause death, matching the actual RHC endpoint. These changes preserve the independent source acceptance.

Source snapshot for `zh/src/object-grammar.js` at this close-out: SHA-256 `1036d62ada548b140d4676aebbe9816d565d6013a5a64060a6ae4159f8fea51a`. These checks do not establish clinical causal identification or learning effectiveness.
