# Chapter 1: direct algebra wording — independent pedagogy review

Date: 16 October 2026. Status: **passed; no open pedagogical issues within this revision's scope**.

The user's feedback is that the bookkeeping analogy adds abstraction to familiar algebra. This review checks that the delivered revision explains the distributive law, summation, common factors, subtraction and cancellation directly, while retaining the complete derivations and beginner Julia explanations. It does not repeat the earlier mathematical proof or re-certify the entire course.

## Material and comparison

After the lead's ready message I reviewed the current `zh/src/chapters/ch01.md`, `zh/renderers/chapter1-visuals.js`, `zh/src/julia/ch01-walkthrough.md` and `zh/docs/chapters/ch01.md`. I compared all four with the exact pre-edit copies in `/private/tmp/eif-before-direct-algebra/`. I also generated the current 18 figures through `chapter1Figures()` to check the actual HTML strings, including captions, recalls, SVG descriptions and ARIA labels. Only this review file was edited by the reviewer.

## Pedagogical findings

- The opening numerical mean change now begins with substitution and calculation. The general description says to subtract tμ and add tz; readers no longer have to interpret entries in a separate bookkeeping model.
- Section 2.2 directly identifies the three terms produced by distribution, tells readers to sum each class of terms, and explains that t can leave the sum because it does not depend on j. This is an explanation of the visible algebra, rather than an analogy requiring a second interpretation.
- Section 3.4 directly expands each p_j(y_j−μ) into p_jy_j−p_jμ, sums the two term classes, and subtracts the results. It explains that the second sum factors into μ times the probability sum 1. The numerical .58−.58 calculation and full symbolic derivation both remain.
- The constant-expectation paragraph now says to calculate a weighted sum directly. Section 3.5 explicitly repeats distribution, separation of sums and cancellation for the new weights, while keeping the old function centre fixed.
- The mean-change figure describes subtraction and addition in its lead and accessible description. The centring proof's title, lead, local recall, scale description, result label and caption all use operations and weighted terms. Its explanation still includes why the Y=0 group cannot be omitted from the mean-weighted term.
- The Julia guide describes the first loop as summing event counts and dividing by total people, and the second as calculating influence values and their probability-weighted average. Initialisation and accumulation are explained directly. The distinction between `risk` and `weighted_mean` is now a distinction between stored results. The actual line-by-line explanations have not been shortened or replaced with a new program.
- The brief mirrors these changes. Its historical integration paragraph also uses “probability-weighted calculation”, so it no longer reintroduces the analogy while describing verification.

The remaining terms “contribution”, “retained component”, “removed weight” and “added weight” name actual quantities in the probability calculation; they do not ask the reader to learn a second bookkeeping framework. Internal `ledger` CSS classes, helper names and SVG marker IDs are invisible implementation identifiers and have no pedagogical effect. Renaming them is unnecessary for this request.

## Preservation and actual checks

The snapshot comparison independently confirmed:

- All **33 displayed formula groups** in Chapter 1 are byte-for-byte identical.
- Both displayed formula groups and all **40 inline maths spans** in the Julia guide are identical.
- Chapter 1's existing inline maths spans are unchanged. The only insertion is an explicit `$j$` in the new explanation that t does not depend on the index j: 458 spans become 459. No mathematical expression was removed or altered.
- The four diffs contain wording changes rather than calculation changes. The complete distribution, separation of sums, common-factor extraction, indicator selection, μ−μ cancellation, non-zero t cancellation, limit, centring and survival-complement steps remain in place.
- The current actual Julia core and entry script still hash to `ee1c2eeb7fc8f801ebdcf69ade62c6cdc3a1ed09889602766d0542bfac324034` and `7ee4701caedbb875d188d0f13cb83bc4c65bf782f092491f75d6c7f29a10662e`, respectively, matching the source hashes already recorded before this revision. The guide retains **18 core cards and 14 entry-script cards**.
- A literal search found no Chinese bookkeeping character `账` in any of the four revised files. The actual generated HTML for all **18 figures** also contains none, and all 18 retain their local formula recall. The changed visible and accessible strings were read as well as searched.

I did not run a browser or Julia execution for this wording review, inspect fresh screenshots, or independently repeat the lead's reported build and test suite. The source comparison and actual figure generation support the narrow conclusion here: the unwanted analogy has been removed from the reviewed reading and figure surfaces, direct descriptions explain the same operations, and the detailed formula and Julia teaching structure has been preserved. Browser layout and interaction verification remain with the lead.
