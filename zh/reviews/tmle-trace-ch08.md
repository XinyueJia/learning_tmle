# Chapter 8 TMLE trace: independent mathematics and pedagogy review

Status: independent source mathematics and pedagogy gates passed after notation fixes; the new workbook passed four direct executions. Lead browser integration acceptance is complete and recorded separately below. This review covers the Chapter 8 trace only. Earlier Chapter 0/1 acceptance is not inherited as evidence for this implementation.

Ownership: this reviewer writes only this file. Read-only direct context: `zh/docs/COURSE_CONTRACT.md`, `zh/src/chapters/ch08.md`, `shared/js/rhc.js` and `shared/julia/RHCCase.jl`. Browser execution and integration evidence belong to the lead and will be attributed separately.

## Independently derived acceptance gates

1. **Fixed data and initial fits.** All 5735 original records retain their source order and explicit row keys. W/design, actual A/Y, initial g and initial q0/q1 remain fixed while epsilon changes. The design has 17 columns; the Q fit appends actual A for 18 columns. Page changes and row selection alter only the visible window.
2. **Actual-arm selection.** Initial qa is A×q1+(1−A)×q0. The observed clever covariate H=A/g−(1−A)/(1−g) is positive for actual A=1 and negative for actual A=0. It is not a probability.
3. **Observed prediction update.** Offset is logit(qa), never logit(Y). Then epsH=epsilon×H, eta=offset+epsH, and updatedQA=expit(eta). The same eta must be the input to expit in formula, column and Julia views. At epsilon=0, epsH is zero and updatedQA equals initial qa.
4. **Score and numerical solution.** The row contribution is H×(Y−updatedQA). Only its complete n-row average is the likelihood score s_n(epsilon). The slope is −mean(H² updatedQA(1−updatedQA)), strictly negative at internal probabilities. Bisection must use that decreasing score and retain an actual bracket. A near-zero average does not imply zero individual residuals.
5. **Both-arm updates.** For every original W, h0=−1/(1−g) and h1=1/g. Each arm uses its own initial logit(q0) or logit(q1), with the same epsilon: updatedQ0=expit(logit(q0)+epsilon×h0), updatedQ1=expit(logit(q1)+epsilon×h1). The observed H cannot be reused for both arms. Actual A/Y stay visible and unchanged.
6. **Standardisation and full EIF.** Contrast=updatedQ1−updatedQ0 remains an n-vector. Psi is its mean over the same complete 5735 rows, not a mean within actual treatment arms or visible rows. EIF=scoreContribution+contrast−psi. Score contribution and full EIF are different row functions; their empirical means agree because the same full-n contrast mean defines psi. This is an empirical centring identity, subject to floating-point tolerance.
7. **Bindings and teaching sequence.** Every displayed formula symbol maps to the correct data column and actual Julia variable. Hover, focus and click must agree without relying only on colour. Input/output shapes, elementwise operations, scalar epsilon and full-row mean are explicit. A mathematical n×1 vector depiction is distinguished from Julia Vector size (n,). New columns appear in the calculation order above; old derivation and executable code remain available.
8. **Meaning and limits.** Hats or explicit fitted labels distinguish model predictions from unknown P0 quantities. The empirical EIF equation is not proof of causal identification, finite-sample unbiasedness, effective coverage, or an automatically valid clinical confidence interval. There is no hidden propensity clipping, row deletion, imputation or regularisation.

## Planned review sequence

Review the pure trace data interface first, including epsilon=0, two finite positive trial values and the solved root. Then compare the renderer and mapping with the independent equations above, and inspect the Julia workbook's actual inputs, outputs and operation order. Run the available workbook directly where possible. Close source-level issues before the lead's browser integration acceptance. No browser pass is claimed by this reviewer.

## Independent baseline calculation

Before trace implementation, this reviewer ran the existing RHCCase implementation with the installed Julia 1.12.5 binary and a writable temporary depot (exit 0). The full original cohort returned:

| epsilon | Standardised risk difference | Mean observed-arm score |
| --- | --- | --- |
| 0 | 0.0864988559023306 | 0.0034691393067677457 |
| 0.003 | 0.08941815023300147 | 0.0005596820311492332 |
| 0.004 | 0.09039149816329757 | −0.00041038579423211213 |
| 0.003576966662876657 | 0.08997972473530443 | −3.402452784305322e−13 |

These give independently checked trial signs and a concrete numerical reference for the new trace. Mean full EIF agreed with mean score to floating-point precision at each trial, although the two row functions are different. These are results for the specified statistical model and cohort, not an external clinical causal truth.

## Initial pure-data and workbook review

The new `shared/js/tmle-trace.js` source satisfies the arithmetic gates above: the actual-arm selector, separate h0/h1, three offsets, same-epsilon shifts, updated predictions, residual, score contribution, contrast and centred EIF are derived in that order. Every summary is calculated over complete vectors before the visible window is selected. It copies initial arrays and does not refit, mutate source data or redefine the propensity. It checks the supplied stored H against original A and g, and errors at probability boundaries. The AIPW summary correctly remains the initial estimate plus initial score while epsilon changes.

The first `zh/julia/tmle_trace.jl` source uses the same operation order and names. Formula εH must therefore bind to actual data/Julia `shift`, with arm-specific `shift0` and `shift1`. Its `score_contribution` differs from `eif` as required. No mathematical blocker was found in these two first source versions.

This reviewer directly ran the new workbook at epsilon=0, 0.003, 0.004 and 0.003576966662876657 with Julia 1.12.5 and the temporary depot. All four exited 0. Their risk differences and score means matched the independent existing-module baseline above; EIF means agreed with score means up to floating-point precision. This is executable trace evidence, not a browser or interaction pass. Renderer, formula bindings and Julia mapping acceptance remain pending their implementation.

## Initial formula/view and mapping pass

The first `tmle-trace-view.js` equations match the independent arithmetic, clearly distinguish current-epsilon predictions from the solved TMLE, and correctly explain actual H versus both-arm directions. Its cumulative column list follows the required dependency order.

One acceptance blocker was reported: the view defines c_i as the score contribution, whereas the first `ch08-trace.json` uses s_i for score contribution and c_i for the centred contrast. A symbol cannot identify two different columns in a feature whose purpose is to link formula symbols, columns and code. Synchronise these names and their line-level formulas. Additional alias clean-up was requested for current-epsilon Q versus a solved-result star, Δ versus τ, and actual-arm H/offset subscripts. The code arithmetic is unchanged by these notation fixes.

The initial read occurred before the new full runtime integration was saved. Interaction bindings and integrated source gate therefore remain pending at this point.

## Source gate after integration and fixes

The notation blocker is closed: score contribution consistently uses c_i, centred contrast uses Δ_{epsilon,i}−psi_epsilon, and current-epsilon Q, Δ, H_A and o_A are synchronised across the view and Julia mapping. The chapter explicitly explains why the `qstar_*` code identifiers represent Q_epsilon until epsilon has been solved.

Reviewed the integrated `rhc-full.js`, cumulative table, linked formula operations, source-line cards and updated Chapter 8 explanation. The runtime calculates full-cohort summaries before selecting the six displayed rows. Original A/Y, baseline preview, initial Q/g and offsets stay fixed; manual epsilon, bisection and solve actions update predictions only. The model uses actual-arm H to fit epsilon and separate h0/h1 for both-arm prediction. Initial AIPW stays fixed. Actual-arm updated prediction, score contributions, both-arm contrasts and full EIF have the correct separate keys and numerical roles.

Formula symbols, headers, cell columns and actual Julia tokens share the same trace keys. Hover/focus/click source handlers use those keys; future-column links move to the relevant step. The runtime checks mapped line text and workbook line count before showing code. Vector shape text correctly distinguishes mathematical n×1 presentation from Julia size (n,). Current-epsilon versus solved-result labels and the limitations on empirical equations and clinical inference are explicit.

No source-level mathematical or pedagogy blocker remains. This gate is based on independent equations, source inspection and the direct workbook runs already recorded; it does not claim a browser, keyboard or viewport test by this reviewer.

Final source snapshots at close-out:

| Source | SHA-256 |
| --- | --- |
| `shared/js/tmle-trace.js` | `3aea31703636a4a436a2e8fd2ce139adbca947a55516e43cc5ffd46a047acc8d` |
| `zh/src/tmle-trace-view.js` | `33c63fdcc79f70096c6a1d6ae61be99a3eef9e92fcfeba3ea3b9adb423f1b7d6` |
| `zh/src/rhc-full.js` | `92048f1e65d5b851ba0abad5391db48f05ede113719d55e6413c84e694b9cb8d` |
| `zh/src/julia/ch08-trace.json` | `0d5fc9b27bb48cd3968f8ed776a3b6d9123698aeda44f1c426c8d755a475bff1` |
| `zh/julia/tmle_trace.jl` | `b08ffc5d76c63cf98e1cd86824cd03af121c4de2a1fc450ba953b80ab366d27c` |

## Lead integration acceptance

The lead reports the following final integration results. These browser and whole-suite checks were executed by the lead, not this independent reviewer. They close the remaining browser integration gate; the independent source inspection and four workbook executions remain separately attributed above.

- `tests/zh/tmle-trace-browser.cjs` exited 0 at both 1360 px and 375 px. It covered persistence of the same DOM table and patient rows; all 10 steps and 26 actual vector columns; observed-arm and both-arm updates; score contributions; synchronised formula/header/Julia hover, focus and tap locking with Esc clearing; 40 mapped source lines; pagination retaining complete-n aggregates; positive and negative epsilon; invalid input preserving the last valid state; bisection, solve and reset; and TeX/MathML. It reported no console errors, page overflow or external requests.
- `tests/zh/rhc-browser.cjs` exited 0 for all nine chapters at both 1360 px and 375 px.
- The final full JavaScript suite passed 144/144 with zero failures or skipped tests (exit 0). This includes the Julia cross-language comparison of 26 × n vector values at four epsilon values, step-panel dependency assertions, and execution of the concatenated ten panels in a fresh Julia process.

This reviewer checked the final saved source changes: stage clicks explicitly select `button[data-trace-stage]`, row selection explicitly selects `select[data-trace-row]`, source cards use div containers, scientific-notation summaries use fewer display digits while unrounded numeric datasets are retained, and the selected patient's shift card now shows the actual shared epsilon multiplied by the matching observed-arm or intervention-arm H value. These changes preserve the source mathematics and pedagogy acceptance. Final source hashes are recorded in the table above.

No source or reported integration gate remains open. Clinical causal identification, valid clinical confidence-interval coverage and learning effectiveness are not conclusions of these implementation checks.

## Teaching follow-up: executable step panels

A final source review checked `traceStepCode(mapping, stage)` and its runtime use. The first panel now includes module loading, original rows, initial fit and n/A/Y definitions; the third includes g before H; the fifth includes epsilon parsing and its finite check before shift and eta. Mapping order is preserved within each panel. Taken in displayed step order, later dependencies are already defined: qa before observed offset; h0/h1 before each arm's shift; both updated arms before contrast; psi before centred; and score contribution plus centred before EIF. This closes the teaching gap between separately shown snippets and a fresh Julia process without changing any mathematical operation.

The saved runtime tells readers to concatenate panels into a .jl file inside `zh/julia`, so the workbook's `@__DIR__`-relative include continues to resolve correctly. The complete workbook remains unchanged. Source acceptance is preserved, and the final hash table above reflects this follow-up. The lead subsequently confirmed that the additional dependency test and execution of all ten concatenated step panels in a fresh Julia process passed. The final suite completed 144/144 with zero failures or skipped tests (exit 0). This fresh-process panel execution was performed by the lead; it is separate from the four direct complete-workbook runs performed by this reviewer.

The lead also reran the final TMLE trace browser checks at 1360 px and 375 px, and the complete nine-chapter RHC browser checks at both viewports, after this teaching follow-up; all exited 0. No pending test result remains.
