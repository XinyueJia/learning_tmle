# Genuine public NSCLC observations: frozen publisher CSV

Ng W-W, Lin C-C, Cheng C-Y, Jiang J-S, Kao S-J, Yeh DY (2021). *Real-world outcomes of first- and second-generation tyrosine kinase inhibitors first-line in patients with epidermal growth factor receptor mutation-positive non-small cell lung cancer: A retrospective observational cohort study*. PLOS ONE 16(6): e0253335. [Original article](https://doi.org/10.1371/journal.pone.0253335), [S1 Dataset](https://doi.org/10.1371/journal.pone.0253335.s001).

`source.csv` is the unmodified publisher file: 12,469 bytes, 107 rows and34 columns. It contains anonymised observational records, not a randomised trial, reconstructed survival records or simulated patients. The original initial-drug labels are retained: Afatinib47, Erlotinib33, Gefitinib27. Raw strings, all rows and the undocumented `filter_$` column remain unchanged. A mutation-negative label occurs in one row; this file is not silently relabelled as107 verified mutation-positive patients.

## Licence and provenance

The article copyright notice and [PLOS licensing policy](https://journals.plos.org/plosone/s/licenses-and-copyright) permit reuse under [CC BY4.0](https://creativecommons.org/licenses/by/4.0/) with attribution. No separate restrictive supplementary notice was found. See `provenance.json` for the original download URL, citation, retrieved date2026-10-16 and SHA-256. This project authors its audit code and summaries separately; it does not alter the CSV or claim authorship of the original data.

SHA-256: `5194dca457f8efac8cbd771f47dee06b3aabe3885923585cd8f0d452471fbd9d`.

## Intended use and limits

Use these real records to practise source review, data loading, filtering and endpoint admissibility. The article/public codebook does not resolve the exact event/status/time pairing needed for the tutorial's12-month progression-or-all-cause-death target. Thirteen records have `PFS_month>Follow_up_month`; different time origins might explain this, so these are review flags rather than proven erroneous records. Death without a recorded progression is not automatically invalid. The audit counts based on proposed pairings are provisional file checks, not clinical risks.

The endpoint gate stays **closed** at every selected time threshold. No unknown endpoint is recoded as0; no row is deleted to create complete follow-up. No clinical ATE/TMLE is computed from this file. Source interpretation, time zero, eligibility, censoring, baseline adjustment and the observational causal assumptions must be established first. Subsequent therapies/response fields must not be used as baseline confounders without timing evidence.

The eight-cell synthetic dataset elsewhere in the project remains an explicitly complete-outcome mathematics example. Its fictional drug labels, counts and known truth do not describe this public cohort. The new public companion is not yet a replacement for the eight-lesson clinical PFS analysis.
