# References and scope

The English edition uses the same original observations, estimands and mathematical derivations as the Chinese edition. The references below distinguish theoretical support, clinical design and presentation style.

## Influence functions and efficiency

- Hines O, Dukes O, Diaz-Ordaz K, Vansteelandt S. *Demystifying statistical learning based on efficient influence functions*. [Version record](https://arxiv.org/abs/2107.00681) · [Version 3](https://arxiv.org/html/2107.00681v3). Section 3.2 develops mixture paths, scores and derivative representations; Section 3.3 gives the mean and treatment-effect examples. Sections 4.2–4.4 connect first-order correction, targeting, cross-fitting and product remainders to estimation and inference.
- Fisher A, Kennedy EH. *Visually communicating and teaching intuition for influence functions*. [Version record](https://arxiv.org/abs/1810.03260) · [Version 3 PDF](https://arxiv.org/pdf/1810.03260v3). Section 3 connects distribution paths, derivatives and one-step estimation; Section 4 treats remainders and estimation error. The sign assigned to a remainder depends on the direction of the displayed expansion.
- Kennedy EH. *Semiparametric theory*. [Version 1](https://arxiv.org/html/1709.06418v1), Section 4. Parametric scores are derivatives of log densities; submodel scores extend this construction to distribution paths. Influence functions represent target derivatives through an expected product with these scores.

The course first uses a finite probability model with positive probabilities. Conditional path normalisation keeps the other mechanisms fixed. Later sections specify the allowed directions, tangent space and remainder conditions needed for general models and efficient inference.

## Causal estimands, standardisation and weighting

- Hernán MA, Robins JM. *Causal Inference: What If*. [Authors' download page](https://miguelhernan.org/whatifbook). Chapters 1–3 introduce potential outcomes, average effects, standardisation, exchangeability, positivity and consistency. The project source review used the 19 August 2026 edition.
- Rosenbaum PR, Rubin DB (1983). [The central role of the propensity score in observational studies for causal effects](https://academic.oup.com/biomet/article-abstract/70/1/41/240879). *Biometrika* 70:41–55. The recorded review consulted the publisher's abstract for the propensity-score definition and matching background.
- Cole SR, Hernán MA (2008). [Constructing Inverse Probability Weights for Marginal Structural Models](https://pmc.ncbi.nlm.nih.gov/articles/PMC2732954/). *American Journal of Epidemiology* 168:656–664. Weighting, exchangeability, positivity and diagnostics are discussed in their longitudinal setting; the RHC teaching analysis uses the treatment and outcome defined on its own study timeline.

## SUPPORT/RHC observations

Connors AF Jr, Speroff T, Dawson NV, et al. (1996). *The effectiveness of right heart catheterization in the initial care of critically ill patients*. *JAMA* 276:889–897. [Original study](https://pubmed.ncbi.nlm.nih.gov/8782638/) · [Official dataset page](https://hbiostat.org/data/repo/rhc.html) · [Variable dictionary](https://hbiostat.org/data/repo/crhc) · [Repository use terms](https://hbiostat.org/data/).

Data obtained from hbiostat.org/data courtesy of the Vanderbilt University Department of Biostatistics.

The fixed original CSV contains 5,735 patients, 2,184 RHC recipients and 1,918 deaths within 30 days. The original study confirmed each patient's death date or survival to 180 days. Recalculation from enrolment and death dates agrees with the published 30-day outcome in all records. The source file, hash and acquisition evidence are shared by both editions. [Patient summary](public-data.html) · [Analysis settings](case-study.html) · [Provenance](../shared/data/public/rhc/provenance.json).

The original cohort selected patients who survived and remained in hospital beyond 48 hours, with RHC classified during the first 24 hours. The standardised risk difference is a statistical target for this cohort. A causal interpretation additionally requires the identification conditions and time alignment explained in the course and analysis settings. The multivariable demonstration uses sex, age, race and 12 medical-history variables; first-day acute physiology may occur after catheterisation, so timing informs the baseline-variable selection.

## Illustrations and code

- [KHStats: An Illustrated Guide to TMLE, Part II](https://www.khstats.com/blog/tmle/tutorial-pt2) informed the organisation of patient objects, equations and computations. The course's figures are computed from its own RHC data and models.
- The supplied causalit article, [Doubly Robust Regression](https://zhuanlan.zhihu.com/p/682351612), informed the problem-led narrative. The original supplied text is preserved in the Chinese reference archive. Mathematical statements in this tutorial are supported by the derivations and theoretical references above.
- R code uses base R. Official references: [An Introduction to R](https://stat.ethz.ch/CRAN/doc/manuals/r-release/R-intro.html), [vector arithmetic](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Arithmetic.html), [matrix multiplication](https://stat.ethz.ch/R-manual/R-devel/library/base/html/matmult.html) and [table input](https://stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html).

