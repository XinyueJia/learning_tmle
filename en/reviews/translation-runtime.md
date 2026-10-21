# English runtime and executable-source translation review

British English is used in the translated runtime prose. This review covers `en/src/*.js` except `app.js` and `case-workbench.js` (owned by the lead), and `en/julia/**` plus `en/R/**`.

## Completed

- Translated the object diagrams and explanations for Chapters 0 and 1, including all stages in mathematical, Julia and R modes, controls, dimensions, accessible labels, error messages, formula explanations and patient-row status messages.
- Added local English object-label metadata in `en/src/object-grammar.js` so labels returned by shared numerical modules are translated without changing shared data or mathematical code.
- Translated the complete Chapter 8 patient-table trace: column meanings and units, ten steps, questions and answers, code controls, line explanations, diagnostics, prediction paths, error messages and variance guidance. Trial Qε remains distinct from solved Q*.
- Translated the other owned runtime modules: mean-error and influence-function interactions, method comparisons, overview, case context, chapter-0 data labels and the additional public-source audit.
- Translated all comments and human-facing printed labels in copied Julia and R executable files, plus both README files. Numerical logic, data keys, assertions, BEGIN/END markers and source line counts are preserved. Local R fallback paths and executable lesson commands use `en/`.
- Synchronised 321 mapped executable lines, their source paths and excerpt code with the English source files. Shared source excerpts remain in `shared/`. JSON explanatory prose is owned by the renderer agent; its editorial pass follows this metadata handoff.
- Updated the stale mean-error cross-reference to Chapter 1, Section 4. Repaired missing spaces in dynamic Chapter 8 descriptions.

## Verification performed

- Node syntax checks passed for `object-grammar.js` and `rhc-full.js`.
- All 18 object stages rendered in mathematical, Julia and R modes without Chinese text. Complete object figures were also checked for Chinese text.
- All English R scripts parsed successfully. Standalone `ch00.R`, `ch01.R` and `tmle_trace.R` ran successfully against the original cohort: n=5735 and 1918 deaths, with initial standardisation approximately 0.08649885590233014.
- Standalone Julia `object_ch00.jl`, `object_ch01.jl` and `tmle_trace.jl` ran successfully using the installed Julia binary with a temporary depot. The object workbooks passed their existing assertions. Initial standardisation was 0.0864988559023306; trace score and full EIF means agreed to floating-point precision.
- Direct comparison against the original edition confirmed unchanged line counts across every copied R/Julia script and unchanged assertion expressions (ignoring translated inline comments).
- A text scan found no Chinese ideographs in the owned JavaScript modules or any copied `.R`, `.jl` or recorded output file.

## Limits and handoff

No build, browser session, deployment or publication was performed by this agent. The lead owns edition builds and browser validation. The `juliaup` launcher could not acquire its configuration lock under the sandbox; the existing app-bundle Julia executable worked. Including multiple standalone workbooks in one Julia session redefined their module and caused an exported-name ambiguity; each workbook passed when run independently, as intended.

The lesson-source SHA256 for the legacy Chapter 1 walkthrough must be `33b9f82a70af9ec3a384c8b84b94dabc7c575fc62f1c072e235b928653a88c5e` (trimmed `en/julia/lessons/ch01.jl`). The lead was notified; the shared core hash is unchanged. R comments were initially translated from the JSON operation explanations; the renderer agent is performing a further editorial pass on those explanations, and exact prose identity between a source comment and its separate explanation is not required. No numerical change is implied by editorial wording.
