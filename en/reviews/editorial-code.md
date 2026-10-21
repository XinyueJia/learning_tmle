# Runtime and code-explanation editorial review

Reviewed on 21 October 2026 against `en/docs/COURSE_CONTRACT.md`, using British English. This was a human editorial revision of the existing English text; no translation service or machine-translation API was used.

## Scope actually read

- All 24 modules in `en/src/*.js`, including all 18 `OBJECT_STAGES`, their mathematical/Julia/R captions and operation notes, the ten `TRACE_STEPS` and trace-column meanings, Chapter 0–8 reference-distribution labs, Chapter 0–8 real-data case workbenches, table captions, controls, validation messages and status announcements. Modules containing only interaction/layout code were inspected but did not need prose changes.
- All ten R mappings in `en/src/R/`: `ch00.json` through `ch08.json` and `ch08-trace.json`, including all 264 line explanations and their object labels. Corresponding comments in all ten `en/R/*.R` workbooks were read and kept in step with revised operations.
- Both Julia mappings: the 17 Chapter 1 line explanations and three Chapter 0 excerpts in `object-map.json`, their object/dimension labels, and all 40 line explanations and column labels in `ch08-trace.json`.
- Both language READMEs and all 22 Julia scripts under `en/julia/`, including the retained earlier synthetic lessons, the RHC lessons, the two object workbooks, the trace workbook and command-line audit/example scripts.

## Revisions made

Replaced literal or ambiguous descriptions such as “actual acceptance RHC”, “person-by-person displacement”, “initial fit return container” and “length 2-value table” with explanations of the actual input, operation and result. Julia explanations distinguish broadcasting, matrix multiplication, field access, copying, scalar parameters and vectors. R explanations identify elementwise arithmetic, two-outcome tables, patient vectors and matrix dimensions. The mean-path explanations distinguish the fixed original influence function from a newly centred function under changed weights.

Runtime text now identifies fitted outcome regressions, treatment probabilities, signed update weights, residuals, fixed log-odds offsets, one common epsilon, trial predictions and solved updates more concretely. Captions and metric labels use strata or cells where appropriate. English punctuation and missing spaces in runtime status text were corrected. Empirical variance retains denominator n; reference-distribution calculations remain distinct from unknown P0 and actual estimation error.

A substantive terminology correction was made in the Chapter 8 reference-distribution lab: the control b is now an “additive error in fitted outcome risks”. Inspection of `shared/js/math.js:fitFromOffsets` confirmed that b perturbs probabilities directly; it is not the logistic offset used during targeting. The operation itself was preserved. The joint-tilt explanation now correctly separates centring its score from normalising the resulting joint probabilities.

The Julia README now leads with the real RHC workbooks and identifies the synthetic `lessons/` directory as a retained earlier example. Its source files and data were preserved.

## Checks actually run

- `node --check`, through `sh scripts/node.sh`, passed for all 24 runtime JavaScript modules.
- `sh scripts/node.sh --test tests/en/localisation.test.js` passed all five tests. These include all 18 mathematical-object stages in mathematical, Julia and R modes, comparing patient entries, dimensions and scalar values with the Chinese edition; R source mappings; chapter mathematics and mount identifiers; and original patient quantities in the overview.
- A separate Python baseline audit against `/private/tmp/eif-en-editorial-baseline` checked all ten R and 22 Julia source files. Every source line count is unchanged, and every non-comment line, including all original executable statements, assertions and inline comments, is byte-identical.
- The same audit checked all 321 mapped statement lines against their actual source positions, all three Julia source excerpts against their source ranges, and every mapping’s `lineCount`. It also compared JSON recursively with the baseline after excluding only `operation`, `label` and `dimensionText`: keys, IDs, source paths, code strings, dimensions, formulas, input/output references and other metadata are unchanged. These mappings contain no source-hash fields requiring an update.
- No full build, browser session, R execution or Julia execution was run by this reviewer. Those checks belong to the lead’s integration validation.

## Remaining limits

Original executable print statements were deliberately retained under the preservation requirement. Some Julia terminal strings still use full-width punctuation, inconsistent capitalisation or a missing space before “percentage points” (notably both Chapter 7 lesson variants). These are output-format defects in the legacy executable statements, not revised runtime web prose. Their mathematical values are unaffected.

The prose rendered from shared mathematical-engine source comments remains outside this review’s editing scope. No claim is made that these source comments have received this English editorial revision. No algorithms, clinical conclusions, source cohorts, Chinese files, shared engines, renderers or built output were changed by this reviewer.
