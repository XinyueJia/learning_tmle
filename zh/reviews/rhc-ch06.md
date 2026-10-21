# RHC chapter 06: independent mathematics and pedagogy review

Date: 2026-10-16. Status: **authored mathematical/pedagogical narrative accepted**. Reviewer edits are confined to review files. The legacy `ch06.md` review is historical and is not used as acceptance evidence for this migration.

Source reviewed: `zh/src/chapters/ch06.md`. SHA-256 at this review: `7859032eb24d48b2218718d2580bc1615678402281deea146234fc7793ed18e1`.

## Model-dependent tangent space and projection

The unknown-g full finite model has seven dimensions; the fixed-g exercise has one population and four conditional-outcome dimensions. The displayed five basis functions are centred, nonzero and mutually orthogonal. Conditional averaging makes U=A-g(X) orthogonal to them; the exercise does not claim observational g is known.

The added membership bridge explicitly proves D_X=[τ(1)-τ(0)]B_X and D_Y=Σ H(a,x)B_xa. Thus D* lies in the displayed tangent space, which is essential before projecting D*+bU. The completed-square coefficient and the orthogonal-column projection are correct. The norm decomposition has b², so doubling b quadruples the removed squared norm.

The local coefficient c is distinguished from chapter 1's survival probability. The unknown-g and fixed-Q comparisons are correct. The chapter distinguishes minimal weighted norm and model-specific EIF from an automatic estimator error expansion or finite-sample ranking. The actual Julia calculation uses the true empirical eight-row weights.

## Evidence and acceptance boundary

The reviewer read the actual chapter and relevant lesson/module source, independently checked the derivation, and inspected the closure of the specific local issues recorded in `rhc-design.md`. The reviewer independently ran the RHC Julia test file: all 127 checks passed, including all eight lesson scripts from outside the repository. This supports computational linkage; it does not prove the clinical causal assumptions.

This acceptance covers the authored narrative and checked source calculations. Rendered figures, dynamic Julia explanations, keyboard/mobile behaviour and final migrated protocol/brief consistency require their separately recorded integration checks. No inherited screenshot or older synthetic-case test is counted as fresh evidence.
