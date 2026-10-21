# RHC chapter 07: independent mathematics and pedagogy review

Date: 2026-10-16. Status: **authored mathematical/pedagogical narrative accepted**. Reviewer edits are confined to review files. The legacy `ch07.md` review is historical and is not used as acceptance evidence for this migration.

Source reviewed: `zh/src/chapters/ch07.md`. SHA-256 at this review: `09eacc6855b710cc3b5b36e2a92b5bd749585994040fd6c79631d9b42eeb3c5b`.

## Asymptotic linearity, variance and efficiency

The mean-error identity correctly uses unknown μ0. The general estimator expansion specifies a centred influence function and an o_P(n^-1/2) remainder; consistency alone is correctly distinguished from a negligible first-order remainder. The iid variance calculation and CLT scaling are correct, with an explicit hospital-dependence caveat.

Regular asymptotic-linear estimator influence functions represent path derivatives. Their projection decomposition yields the correct model-specific variance lower bound; no arbitrary finite-sample MSE claim is made. The completed conditional-variance bridge shows the arm probability cancelling one of the squared inverse-probability factors. The final ATE V formula has the correct terms and V/n scaling.

The script and prose separately identify initial fitted-function moments and saturated empirical-gradient moments. Their centre/second-moment relation is correct, and they are not called an observed true efficiency bound, actual sample error or guaranteed clinical confidence interval. Updating Q requires recomputing the fitted function and moments.

## Evidence and acceptance boundary

The reviewer read the actual chapter and relevant lesson/module source, independently checked the derivation, and inspected the closure of the specific local issues recorded in `rhc-design.md`. The reviewer independently ran the RHC Julia test file: all 127 checks passed, including all eight lesson scripts from outside the repository. This supports computational linkage; it does not prove the clinical causal assumptions.

This acceptance covers the authored narrative and checked source calculations. Rendered figures, dynamic Julia explanations, keyboard/mobile behaviour and final migrated protocol/brief consistency require their separately recorded integration checks. No inherited screenshot or older synthetic-case test is counted as fresh evidence.
