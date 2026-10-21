# Chapter translation handover

Translated the current Chinese source into British English in chapter order, Chapter 0 through Chapter 8, followed by the six-step TMLE overview and public-data reference panel. Scope: `en/src/chapters/ch00.md`–`ch08.md`, `en/src/tmle-overview.md`, and `en/src/public-data.md`.

The English edition retains the complete teaching sequence, derivations, notation recaps, exercises and answers, clinical interpretation limits, supplementary details, patient counts, numerical results and interactive instructions. Chapter headings use `Chapter N: …`. Executable lesson paths in shell examples point to `en/julia/`; shared module/data paths remain shared. The published article title retains its original American spelling.

Checks actually performed:

- Compared each English file with its current Chinese source: identical line counts in all 11 files, totalling 1452 lines.
- Confirmed all 68 display-mathematics blocks have identical structure after allowing translation of TeX `text` labels.
- Confirmed every interactive div and TMLE step marker is unchanged.
- Searched the owned content for Chinese characters: none remain, including in TeX labels and hidden supplementary links.
- Compared inline mathematical expressions and restored original expression boundaries where prose had initially combined them. Additional mathematical delimiters only make formerly plain-text symbols legible.
- Preserved the fixed empirical reference versus unknown true distribution distinction, initial versus updated Q, trial Qepsilon versus solved Qstar, the one-step/AIPW identity, and empirical EIF variance with denominator n.

No build, browser interaction, Julia/R numerical run or deployment was performed by this translation worker. Integration and runtime verification belong to the lead. Statements within lesson prose about existing cross-checks translate the current source; they are not new verification claims by this worker.

Source ambiguities retained for the lead’s judgement: Chapters 1–2 refer back to a Chapter 0 delta notation that is not visible in the short introductory chapter; this cross-reference is preserved faithfully. The clinical references to first-day RHC and 48-hour selection are retained without independently revising the study protocol.

## Independent runtime prose review

Read `en/src/object-grammar.js`, `en/src/tmle-trace-view.js` and `en/src/rhc-full.js` without editing them. No critical mathematical translation defect was found in the requested distinctions:

- Chapter 1’s reference is explicitly fixed at P=P_n; initial risk-difference prose keeps the true clinical causal target unknown.
- The trace labels current predictions Qepsilon and explicitly distinguishes trial epsilon from solved epsilon; the updated plug-in becomes TMLE only after solving.
- Each patient’s full fitted EIF includes both the weighted residual/score contribution and centred prediction contrast. Equality is asserted for full-sample means, not individual contributions.
- Empirical EIF variance explicitly uses denominator n; no n−1 substitution appears.
- Y is consistently observed all-cause death within 30 days; the survival endpoint is status at day 30.

Minor prose corrections sent to the lead:

- `object-grammar.js`: change American `Recentering` to `Recentring`.
- Its mean-IF explanation refers to Chapter 0, Section 5.2, which is absent from the short visible introduction; use Chapter 1 §4 or explicitly link the supplement. This cross-reference was inherited from the source.
- `rhc-full.js`: insert spaces between interpolated patient counts and `entries`, between age and `years`, and at the joins surrounding conditional text in workbook, current-code and summary explanations. These joins currently produce strings such as `5735entries`, `variables.Julia` and `selected.Current`.
- Optional typographical polish: replace surviving full-width Chinese punctuation in English UI joins with ordinary English punctuation.

This was a source-level language/concept review, not a browser or numerical integration test. Runtime changes remain with their owners.

## Runtime repair after ownership transfer

The lead subsequently transferred `en/src/app.js` and `en/src/case-workbench.js` for direct human review. Compared all experiments and case panels against their Chinese originals and repaired the machine draft’s stray newline/phrase spill, including the `g(x) original→current`, initial treatment-only risk difference and observed-event count labels. Removed the unrelated trailing fragment in the AIPW/TMLE experiment. Translated all three remaining Chinese accessibility labels and replaced full-width prose punctuation. Reworded awkward model, projection, residual, empirical-moment and root-finding explanations using natural British English.

Retained the lead’s corrected mathematics: only-Q-correct implies epsilon=0; the full conditional-variance expression V(r); the known-g versus unrestricted-model distinction; empirical variance using denominator n; confirmed death within 30 days; trial Qepsilon versus solved Qstar; and population reference identities versus unknown P0 and empirical Pn. The AIPW metric displays the complete one-step estimate and is labelled accordingly, rather than suggesting that the displayed number is only the additive correction.

Verified the English `chapter0-data.js` supplies English target labels. Its unit labels are capitalised, so the app’s presentation comparison now normalises case before choosing percentage points versus percentages. This is the sole non-string adjustment; mathematical engines, IDs, data attributes, control ranges and executable calculations are unchanged.

Checks actually performed after the final edits:

- `sh scripts/node.sh --check en/src/app.js` — passed.
- `sh scripts/node.sh --check en/src/case-workbench.js` — passed.
- No Chinese characters remain in either file.

The lead retains build, browser and numerical integration validation. No external translation service, deployment or shared numerical-module edit was used for this repair.
