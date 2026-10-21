# RHC chapter 03: independent mathematics and pedagogy review

Date: 2026-10-16. Status: **authored mathematical/pedagogical narrative accepted**. Reviewer edits are confined to review files. The legacy `ch03.md` review is historical and is not used as acceptance evidence for this migration.

Source reviewed: `zh/src/chapters/ch03.md`. SHA-256 at this review: `9e57bea6e4b9c7a4e8d2d015c9b6c11d38cafed50f6d88354cdd56f5c28bf9fd`.

## Three mechanisms and standardisation

The conditioning denominators are correct: Female n=2543, Female RHC n=906 and deaths among those 906 equal 348. The chain factors cancel to 348/5735; the source explicitly fixes coordinate order (X,A,Y) separately from multiplication order.

The target uses common population weights; unadjusted Female arm weights 906/2184 and 1637/3551 are correct. The 7.36921 percentage-point target is labelled a sex-standardised association. Holding Q and pX fixed while changing g leaves the target fixed. Setting both g values to 0.5 equalises the hypothetical arm population weights, so the unadjusted and standardised contrasts agree.

Saturated observed group risks and the deliberately simpler A-only initial Q remain separate. Saturation is now explained as a risk for each (a,x) group; standardisation has its English term. The script prints these empirical/initial risk pairs and empirical pX/g, as described. Expanding W is not claimed to establish exchangeability.

## Evidence and acceptance boundary

The reviewer read the actual chapter and relevant lesson/module source, independently checked the derivation, and inspected the closure of the specific local issues recorded in `rhc-design.md`. The reviewer independently ran the RHC Julia test file: all 127 checks passed, including all eight lesson scripts from outside the repository. This supports computational linkage; it does not prove the clinical causal assumptions.

This acceptance covers the authored narrative and checked source calculations. Rendered figures, dynamic Julia explanations, keyboard/mobile behaviour and final migrated protocol/brief consistency require their separately recorded integration checks. No inherited screenshot or older synthetic-case test is counted as fresh evidence.
