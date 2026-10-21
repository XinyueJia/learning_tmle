# Narrative editorial review

Reviewed on 21 October 2026 against `/private/tmp/eif-en-editorial-baseline`.

## Material read and revised

Read `en/docs/COURSE_CONTRACT.md`, then Chapters 0–8 in order, including derivations, notation recaps, exercises, answers, code explanations and transitions. Also read and revised the complete `en/src/tmle-overview.md` and `en/src/public-data.md`. This was an editorial review of the existing English prose; no machine-translation API was used. This pass did not compare the prose sentence by sentence with the Chinese edition.

- Chapter 0: clarified the common baseline distribution, the two regression responses and the distinction between correcting the estimate and updating fitted risks. Split the six-step introduction into a readable sequence.
- Chapter 1: clarified probability replacement, rates versus changes, reference versus true population distributions, and the function mapping outcomes to influence values. Removed stale claims that the shortened Chapter 0 had already introduced the transfer notation, functional notation, intercept-only model and detailed notation. Introduced those ideas locally while preserving their formulae.
- Chapter 2: clarified direction versus step size, the gradient–score inner product and what stays fixed when the path parameter changes.
- Chapter 3: replaced awkward descriptions of counts, denominator cancellation and standardisation with direct explanations. Distinguished the saturated and initial fitted outcome functions.
- Chapter 4: shortened the title and clarified why the treatment probability remains after cancelling the outer baseline weight. Distinguished influence-function values from the average score being targeted.
- Chapter 5: made admissible directions consistent, described the seven contrast directions directly and clarified the dot-product analogy and score decomposition.
- Chapter 6: clarified basis functions, model restrictions and projection, using the cohort’s empirical weights. Preserved the distinction between an admissible treatment direction in the full model and an orthogonal component in the fixed-treatment-mechanism model.
- Chapter 7: stated explicitly that EIF variance divided by sample size describes the leading variance of estimation error, rather than the realised error. Retained the empirical variance divisor n and all inference qualifications.
- Chapter 8: clarified the weighted-residual expectation in the bias identity, observed-treatment predictions, the rate-product explanation, the score equation and the final standardisation step. Retained the distinction between trial and solved risk updates and the numerical tolerance term.
- TMLE overview: clarified influence-function values versus the whole fitted function, one-step/AIPW equality, the shared update coefficient, the empirical score equation and the empirical variance calculation. Kept all six step markers.
- Public-data page: made the baseline-characteristics heading grammatical; retained study titles, source attribution and links.

British spellings are retained. The original study title retains its published spelling.

## Preservation checks actually run

A Python comparison against the lead’s baseline verified, for every owned source file:

- the complete ordered sequence of inline and display mathematical expressions is unchanged;
- HTML element tags, attributes, IDs and comment markers are unchanged;
- fenced code blocks are unchanged.

All 11 source files passed. All source files retain their original line counts. Summary text and headings were edited as prose; the structural tags were preserved. The ordered formula comparison includes the one-step/AIPW identity, empirical definitions and all derivation lines.

This editorial pass did not run a website build, render a browser view, execute Julia or R, recalculate numerical results, or validate clinical confidence-interval coverage. Those checks should be reported separately by the lead. No shared mathematical engine, renderer, code source, JSON, Chinese source or generated build file was edited by this reviewer.

## Mathematical and scope notes

Two existing statements required clarification in prose and were reported to the lead: Chapter 8’s displayed bias expression is the conditional expectation of the **weighted** residual, and Chapter 7’s variance expression concerns the leading variance of estimation error. The displayed mathematics was retained unchanged.

The regular-submodel, overlap, square-integrability, remainder and empirical-process qualifications remain in place. They were read for editorial consistency, not independently re-proved in this pass. No unresolved mathematical ambiguity requiring a silent theorem rewrite was identified. The course’s existing qualifications about clinical identification, learner rates, sampling dependence and interval coverage remain substantive limits; this review does not certify them.

## Independent renderer naming cross-check

After completing the narrative pass, read the current `en/renderers/tmle-ipw-bridge.js`, `en/renderers/dr-intro.js` and `en/src/tmle-trace-view.js` without editing them. These files were being polished concurrently, so these observations concern the snapshot read, rather than final line numbers or a rendered UI.

The core mathematical naming agrees with the narrative. The IPW bridge defines the initial weighted residual C separately from the full individual fitted EIF, adds the centred prediction contrast for each patient, and cancels that contrast only after taking the full-cohort average. Its final estimate uses the initial fitted EIF average. The introductory figures distinguish observed-treatment residuals from the two predictions used for standardisation. The trace correctly labels current predictions with trial epsilon, keeps initial offsets and fitted g fixed, and states that the current plug-in estimate becomes the TMLE only after solving the score equation.

Reported two points to the lead:

- The A=0 trace-step introduction says to reuse epsilon “fitted in the observed arm”. At a manually entered trial epsilon, it need not yet be fitted. “Observed arm” could also suggest fitting within a single treatment group. Suggested stating that the same current epsilon is used for everyone, and that epsilon is fitted using all patients’ observed-treatment predictions.
- The bridge correctly computes the one-step/AIPW estimate but labels the route only AIPW in this snapshot. Explicitly naming the one-step equality there would align the visual vocabulary with the revised narrative.

No additional mathematical mismatch was found in this naming check. This was a source review, without execution or browser rendering.
