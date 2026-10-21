# English figure and renderer editorial review

Reviewed against `en/docs/COURSE_CONTRACT.md`, using `/private/tmp/eif-en-editorial-baseline` as the pre-edit baseline. Revisions were written manually in British English; no translation service was used.

## Scope and changes

Substantive prose revision covered the active RHC figures: `dr-intro`, `chapter1-visuals`, `tmle-overview`, `tmle-ipw-bridge`, `qg-visual`, `eif-correction`, `target-comparison`, `glm-score`, `ols-error`, `mean-error`, `if-function`, `if-motivation`, `if-notation`, `estimation-routes`, `propensity-bridge`, `tmle-calibration` and `rhc-patient-summary`. This includes headings, explanatory paragraphs, captions, controls, accessible labels and patient-column descriptions. Chapter 1’s fixed examples remain accessible in disclosure panels and were reviewed as visible teaching material.

The edits replace topic-first and literal phrasing with direct descriptions of the calculation. Examples include “Weighted fixed basis” → “Weighted fixed mean”, “Why exactly offset?” → “Why do the contributions cancel?”, and “AIPW contributes per person” → “AIPW contribution per person”. The propensity-weighting caption now correctly describes an arm-specific numerator as weighted deaths **in that arm**, rather than “of all arms”; the numerical calculation is unchanged.

The active R and Julia renderer wrappers (`r-code`, `rhc-code`) received prose and heading revisions, including a stray introductory “The”, missing spaces around inline code, and input/output descriptions. `parallel-code` was inspected and left unchanged. Small wrappers `object-visuals` and `tmle-trace-maths` contain no independent teaching prose needing revision. `julia-display-comments` was inspected but left unchanged to preserve the comment mapping. Historical synthetic helpers `case-code` and `julia-walkthrough` received limited wrapper/heading edits; `chapter0-visuals` was inspected but did not receive a full historical-prose revision. This review therefore does not claim a complete edit of unused synthetic teaching routes.

## Preserved distinctions

The revised text preserves the initial plug-in estimate, AIPW/one-step correction to the final scalar, and TMLE’s update of Q followed by standardisation. Weighted residuals remain distinct from full individual EIF values and AIPW contributions. The trial Qε and solved Q* remain distinct. Fitted-law expectations, empirical averages, fixed reference distributions and unknown P₀ remain distinct. Probability normalisation of a retained component is described separately from standardisation over baseline variables. The mortality endpoint remains death within 30 days.

The ordinary sample-mean standard-error illustration in `mean-error` retains its sample-variance divisor n−1. This is intentionally different from the TMLE EIF empirical variance, whose divisor is n. The distinction was raised with the lead and preservation was confirmed. No numerical engine, source comment, source hash, mapping metadata, patient order or executable R/Julia lesson was edited in this scope.

## Checks actually run

- `sh scripts/node.sh --check` on every `en/renderers/*.js` file: passed.
- `sh scripts/node.sh --test tests/en/localisation.test.js`: all 5 tests passed.
- A temporary baseline comparison rendered 14 active renderer entry points and every Chapter 1 fixed figure. Ordered signatures of data attributes, IDs, classes, form values, ARIA control references and KaTeX source annotations matched the baseline. Generated symbol-recall counters were normalised because sequential rendering increments them; no other identifiers were normalised. The script was `/private/tmp/check-figure-parity.mjs` and its fixtures used the original RHC cohort and shared engines.
- Source comments in all 21 changed renderer files were compared with the baseline and remained verbatim.

No distribution build, browser run, visual layout check, publication or deployment was performed by this reviewer. Numerical/formula signature comparisons verify preservation of the checked rendered structures; they are not a substitute for the lead’s full course and browser checks.
