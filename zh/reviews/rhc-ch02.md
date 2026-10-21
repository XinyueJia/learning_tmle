# RHC chapter 02: independent mathematics and pedagogy review

Date: 2026-10-16. Status: **authored mathematical/pedagogical narrative accepted**. Reviewer edits are confined to review files. The legacy `ch02.md` review is historical and is not used as acceptance evidence for this migration.

Source reviewed: `zh/src/chapters/ch02.md`. SHA-256 at this review: `83dae09c7cb640c46c4fb01de1f07544b11e9a688a538b2a18ad3839429540bb`.

## Direction, score and weighted pairing

The absolute direction (-c,c), relative score (-1,c/r), score centring and general finite-support pairing are correct. Cancelling positive probabilities and using sum h=0 produces the mean derivative without an extra constant. The full eight-cell selected-observation score correctly pairs to y*-r.

The text distinguishes distance t from direction h and from the fixed starting score. The added local explanation of log slope 1/p and the chain rule supplies the previously missing beginner bridge. Changing the denominator to a new probability is identified as evaluating a different path position. Finite support and continuous regularity are not conflated.

The Julia output description has been corrected to its actual selected-direction h/S and aggregate risks/derivatives, while the extra columns belong to the webpage. No causal identification or treatment-effect assertion is made.

## Evidence and acceptance boundary

The reviewer read the actual chapter and relevant lesson/module source, independently checked the derivation, and inspected the closure of the specific local issues recorded in `rhc-design.md`. The reviewer independently ran the RHC Julia test file: all 127 checks passed, including all eight lesson scripts from outside the repository. This supports computational linkage; it does not prove the clinical causal assumptions.

This acceptance covers the authored narrative and checked source calculations. Rendered figures, dynamic Julia explanations, keyboard/mobile behaviour and final migrated protocol/brief consistency require their separately recorded integration checks. No inherited screenshot or older synthetic-case test is counted as fresh evidence.
