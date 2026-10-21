# English edition contract

Use British English. Translate the current Chinese course faithfully, retaining every derivation, mathematical condition, exercise, answer, patient row and interactive operation. Readers know GLMs, but are new to semiparametric statistics and Julia. Use natural, concrete English, without literal Chinese topic-first phrasing. Data and mathematical engines remain in shared/. Preserve IDs, CSS classes, data attributes, variable names and TeX mathematics. Use the identical original SUPPORT/RHC cohort: n=5735, 1918 deaths within 30 days, 2184 RHC. Initial standardisation 0.08649885590233014, AIPW 0.089967995209098, TMLE 0.08997972473530443, epsilon 0.003576966662876657. Preserve distinctions between unknown P0, empirical Pn, fixed reference distributions and fitted Q/g; Qepsilon is a trial, Qstar the solved update. AIPW is the one-step estimator in this setting. EIF empirical variance divides by n. No publication or deployment is authorised; prepare GitHub Pages files only.

File ownership is assigned by lead; do not edit outside your scope. Source language files in zh/ must remain untouched. No independent rewrites of mathematical content. Source and code paths in the new edition use en/ while numerical modules stay shared/. Record progress and review notes honestly; do not claim tests not run.

## English editorial conventions (21 October 2026)

Use concrete, verb-led titles and complete explanations of inputs, operations and outputs. Refer to patient records, strata, influence-function values, weighted residual corrections and fitted functions precisely. Use standardisation for averaging predictions over a target population, normalisation for rescaling probability weights, and centring for subtracting a mean. An offset is the fixed initial log-odds predictor; the reference-distribution b control is an additive probability error. A trial epsilon is distinct from the fitted epsilon. The initial fitted EIF and its individual values are distinct from their sample average and the one-step/AIPW estimate. Code terminology should match the actual object type and operation, including broadcasting, matrix multiplication and returned records.

### Reader-facing references and maintainer records (21 October 2026)

Public references are authored in src/sources.md. Verification logs, source-audit notes, hashes, editorial history and implementation records stay in docs/ and reviews/; they are not linked from the reading interface. Keep citations, attribution and mathematical assumptions needed to understand the methods visible.

### Language selection (21 October 2026)

The root entry opens English by default. Explicit language URLs keep their edition. A compact language dropdown preserves the current page, query and chapter. Keep keyboard access and a visible current-language marker; chapter navigation must only update chapter links.

### Chapter loading (21 October 2026)

Keep each complete rendered chapter in chapters/chapter-N.html. The entry shell selects chapters using the existing hash and relative URLs. Initialise each retained chapter once, preserve its local controls and keep chapter navigation separate from language selection. Use shared browser data caching for the original RHC CSV and initial fit. New chapter content must be registered with formula recall handlers. Handle request failure/retry and out-of-order navigation; never load other chapter fragments speculatively.

### Publication name (21 October 2026)

The repository is learning-tmle. Use the titles in shared/js/site-config.js consistently in both editions. Current documentation and repository-prefix tests use /learning-tmle/. The local workspace directory remains TMLE_tutorial; original references and historical verification records retain their original names.
