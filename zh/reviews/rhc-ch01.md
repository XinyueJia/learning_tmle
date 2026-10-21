# RHC chapter 01: independent mathematics and pedagogy review

Date: 2026-10-16. Status: **authored mathematical/pedagogical narrative accepted**. Reviewer edits are confined to review files. The legacy `ch01.md` review is historical and is not used as acceptance evidence for this migration.

Source reviewed: `zh/src/chapters/ch01.md`. SHA-256 at this review: `7455e8ac4b9b246e2b765533b1dd40fd3b660f8cbb3e48f3b5d6a0be6bfeb38a`.

## Real mortality mean and finite contamination

Independently checked r=1918/5735, c=3817/5735 and r+c=1; empirical reference P=P_n is distinguished from unknown population P_0. The complete expansion of new probabilities, the mean difference, division only by nonzero t, the limiting derivative and the general summation are correct. Weighted centring, fixed old function under new weights and both exercise answers are correct. The survival complement has the opposite IF sign; strict positive z=1 paths have interval (-r/c,1).

The death-time T and dimensionless perturbation t are distinct. The opening now specifies survival at day 30, rather than implying all 3,817 survived to day 180. Point contamination is confined to this finite support, with the continuous-model caveat retained. Descriptive death risk is never presented as a treatment effect.

Source inspection verified all 18 distinct expected figure markers, the actual 32-line first RHC script, and no stale .58/.42/12-month synthetic numerical tokens. The count-to-probability-to-derivative progression and explicit algebra meet the beginner entry requirement. The actual script reads original observations and checks the individual and weighted calculations.

## Evidence and acceptance boundary

The reviewer read the actual chapter and relevant lesson/module source, independently checked the derivation, and inspected the closure of the specific local issues recorded in `rhc-design.md`. The reviewer independently ran the RHC Julia test file: all 127 checks passed, including all eight lesson scripts from outside the repository. This supports computational linkage; it does not prove the clinical causal assumptions.

This acceptance covers the authored narrative and checked source calculations. Rendered figures, dynamic Julia explanations, keyboard/mobile behaviour and final migrated protocol/brief consistency require their separately recorded integration checks. No inherited screenshot or older synthetic-case test is counted as fresh evidence.
