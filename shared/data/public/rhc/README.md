# SUPPORT / right heart catheterisation

`source.csv` is the unchanged, anonymously downloadable [Vanderbilt CSV](https://hbiostat.org/data/repo/rhc.csv). Retrieved 16 October 2026. It contains 5,735 patients, 62 documented variables and an unnamed export row index. No patients, fields, `NA` markers or spaces were removed. `provenance.json` records the complete audit and source links.

- Bytes: 2,320,412.
- SHA-256: `9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8`.
- `swang1`: 2,184 `RHC`, 3,551 `No RHC`.
- `dth30`: 1,918 `Yes`, 3,817 `No`; no missing values.
- `ptid`: 5,735 distinct identifiers; preserve as strings, including leading zeroes.

The [repository grants permission to use its datasets](https://hbiostat.org/data/), with citation and acknowledgement. No separately named Creative Commons or ODC licence was stated on the inspected page. Cite Connors AF Jr et al. *The effectiveness of right heart catheterization in the initial care of critically ill patients*. JAMA. 1996;276(11):889–897. [Original study record](https://pubmed.ncbi.nlm.nih.gov/8782638/).

Data obtained from http://hbiostat.org/data courtesy of the Vanderbilt University Department of Biostatistics.

The early hand calculations use the released `sex` (`Female=0`, `Male=1`), `swang1` (`No RHC=0`, `RHC=1`), and `dth30` (`No=0`, `Yes=1`). The source sex categories should not be relabelled gender identity. No further selection is applied to the released cohort. All eight cells are positive:

| X / source sex | A / procedure | Y=0 | Y=1 |
| --- | --- | ---: | ---: |
| 0 / Female | 0 / No RHC | 1,143 | 494 |
| 0 / Female | 1 / RHC | 558 | 348 |
| 1 / Male | 0 / No RHC | 1,320 | 594 |
| 1 / Male | 1 / RHC | 796 | 482 |

This is an observational procedure comparison. SUPPORT phase II randomised a separate decision-support intervention; RHC itself was not randomised. The clinical endpoint is 30-day mortality from study entry. The original study reports complete death/survival ascertainment to day 180; using released `dth30` is therefore supported. `lstctdte` alone must not be used to invent censoring: 11 non-event rows have that field less than 30 days after entry, and 2,151 last-contact dates precede a known death.

Study entry is not necessarily hospital admission. The original cohort excluded death or discharge within 48 hours, and RHC was classified over the first 24 hours after study entry. Exact insertion times are unavailable. Day-1 physiological values may follow RHC. Sex alone cannot control confounding by indication. The computed sex-standardised mortality difference is an observed-data quantity with unknown causal truth; neither a clean target-trial emulation nor adequate clinical adjustment is established.

Lesson 8 additionally fits Q and g and executes TMLE for the same 5,735 patients using W: sex, age, race and the 12 recorded history/comorbidity fields. The W design has 17 columns including the intercept and two race indicators; the Q regression also includes A. These fields are complete in this source, so the calculation requires no imputation or patient exclusions. Acute day-1 physiology is omitted because pre-RHC ordering is unavailable. This targets a W-standardised observed-data difference, distinct from the early sex-standardised target. Neither clinical exchangeability nor the selection assumptions are established by the larger adjustment set.

See [Chinese source and design adjudication](../../../../zh/docs/data/RHC_SOURCE.md), the [official dictionary](https://hbiostat.org/data/repo/crhc), and the [official description](https://hbiostat.org/data/repo/rhc.html).
