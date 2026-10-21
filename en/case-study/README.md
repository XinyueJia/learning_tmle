# RHC study and analysis settings

| Item | Setting used in this tutorial |
| --- | --- |
| Data and study | Public observational SUPPORT cohort: 5,735 critically ill patients. [Original study](https://pubmed.ncbi.nlm.nih.gov/8782638/) · [Patient summary and data sources](public-data.html) |
| Time zero and eligibility | The first time a patient met the SUPPORT eligibility criteria; the original study selected patients who remained alive and in hospital beyond 48 hours. |
| Treatment $A$ | Right heart catheterisation (RHC) within the first 24 hours, recorded as `swang1`: 2,184 received RHC and 3,551 did not. |
| Outcome $Y$ | All-cause death within 30 days of enrolment, recorded as `dth30`: 1,918 deaths and 3,817 survivors. Death on day 30 is counted. |
| Estimand | The standardised difference in 30-day mortality risk between RHC and no RHC, averaged over the baseline distribution of all 5,735 patients. |
| Adjustment variables | Chapters 1–7 mainly use the original sex variable; Chapter 8 extends the baseline to sex, age, race and 12 medical-history variables. |
| Initial fits | $g$ predicts receipt of RHC; $Q$ predicts mortality from baseline and treatment. The multivariable version uses main-effects logistic regressions with intercepts. |
| Encoding | The 15 baseline variables produce 17 design columns, including an intercept; $Q$ adds treatment. Age is standardised using the full-cohort mean and standard deviation with divisor $n$; white is the reference race category. |
| Computation | g-computation → AIPW one-step correction; TMLE updates $Q$ along an EIF-guided direction and standardises again. Every chapter uses the same patient records. |
| Causal interpretation | An ATE interpretation requires consistency, conditional exchangeability and positivity. Time zero, the treatment window and cohort selection jointly define the population to which the result applies. |
| Julia code | [Chapter 1](julia/rhc_lessons/ch01.jl) · [Chapter 8](julia/rhc_lessons/ch08.jl) · [Complete analysis](julia/rhc_case.jl) |
| R code | [Chapter 1](R/ch01.R) · [Chapter 8](R/ch08.R) · [Patient-level TMLE](R/tmle_trace.R) |
