# RHC chapter 00: independent mathematics and pedagogy review

Date: 2026-10-16. Status: **authored mathematical/pedagogical narrative accepted**. Reviewer edits are confined to review files. The legacy `ch00.md` review is historical and is not used as acceptance evidence for this migration.

Source reviewed: `zh/src/chapters/ch00.md`. SHA-256 at this review: `185e336e33dd62e1ad5192015180828c0ea770d5e665d3645abdb69fe5bce535`.

## Conceptual and causal-design entry

The chapter identifies the released 5,735-person cohort, first-24-hour RHC classification, study-entry origin and released 30-day mortality. Its 48-hour eligibility selection warning prevents an unsupported interpretation as an entry-time randomised trial. Mortality contrasts are oriented consistently: positive means higher death risk.

The potential-outcome target, observed-data standardisation and identification conditions are separated. The limited sex target and expanded W target are explicitly distinct statistical functionals; neither is called an established clinical causal effect. The initial AIPW versus TMLE explanation correctly locates the former correction in the reported estimate and the latter in Q before standardisation. Influence values, target gradients, estimation error and efficiency are separate concepts. The first canonical-gradient mention now has its Chinese and English names.

No unknown truth, sufficient-confounding claim or automatic estimator efficiency is imported from the previous synthetic example.

## Evidence and acceptance boundary

The reviewer read the actual chapter and relevant lesson/module source, independently checked the derivation, and inspected the closure of the specific local issues recorded in `rhc-design.md`. The reviewer independently ran the RHC Julia test file: all 127 checks passed, including all eight lesson scripts from outside the repository. This supports computational linkage; it does not prove the clinical causal assumptions.

This acceptance covers the authored narrative and checked source calculations. Rendered figures, dynamic Julia explanations, keyboard/mobile behaviour and final migrated protocol/brief consistency require their separately recorded integration checks. No inherited screenshot or older synthetic-case test is counted as fresh evidence.
