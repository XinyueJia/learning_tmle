# References and further reading

## Influence functions, one-step estimation and efficiency

- Hines O, Dukes O, Diaz-Ordaz K, Vansteelandt S. *Demystifying statistical learning based on efficient influence functions*. [Paper and versions](https://arxiv.org/abs/2107.00681) · [Full text](https://arxiv.org/html/2107.00681v3). Section 3 introduces distribution paths, scores and influence functions. Section 4 covers one-step estimation, TMLE, cross-fitting and remainder conditions.
- Fisher A, Kennedy EH. *Visually communicating and teaching intuition for influence functions*. [Paper and versions](https://arxiv.org/abs/1810.03260) · [Full PDF](https://arxiv.org/pdf/1810.03260v3). Section 3 develops linear approximations and one-step estimation from changes in distributions; Section 4 discusses bias, remainders and estimation error.
- Kennedy EH. *Semiparametric theory*. [Full text](https://arxiv.org/html/1709.06418v1). Section 4 explains the connections between parametric scores, distribution paths and influence functions.

## Causal identification, standardisation and weighting

- Hernán MA, Robins JM. *Causal Inference: What If*. [Authors’ electronic book](https://miguelhernan.org/whatifbook). Chapters 1–3 introduce potential outcomes, average treatment effects, standardisation, consistency, exchangeability and positivity.
- Rosenbaum PR, Rubin DB (1983). [The central role of the propensity score in observational studies for causal effects](https://academic.oup.com/biomet/article-abstract/70/1/41/240879). *Biometrika* 70:41–55. Introduces the propensity score and its role in observational studies.
- Cole SR, Hernán MA (2008). [Constructing Inverse Probability Weights for Marginal Structural Models](https://pmc.ncbi.nlm.nih.gov/articles/PMC2732954/). *American Journal of Epidemiology* 168:656–664. Discusses inverse probability weights, identification conditions and weight diagnostics.

## RHC data and original study

- Connors AF Jr, Speroff T, Dawson NV, et al. (1996). *The effectiveness of right heart catheterization in the initial care of critically ill patients*. *JAMA* 276:889–897. [Original study](https://pubmed.ncbi.nlm.nih.gov/8782638/).
- Vanderbilt University Department of Biostatistics: [Dataset](https://hbiostat.org/data/repo/rhc.html) · [Variable dictionary](https://hbiostat.org/data/repo/crhc) · [Data-use permission](https://hbiostat.org/data/).
- [Patient summary](public-data.html) · [Study and analysis settings](case-study.html) · [Download original CSV](../shared/data/public/rhc/source.csv).

Data obtained from hbiostat.org/data courtesy of the Vanderbilt University Department of Biostatistics.

## Illustrated explanations and code

- [KHStats: An Illustrated Guide to TMLE, Part II](https://www.khstats.com/blog/tmle/tutorial-pt2). A step-by-step illustrated explanation of the TMLE algorithm.
- [causalit: Doubly Robust Regression](https://zhuanlan.zhihu.com/p/682351612). An introduction in Chinese to the connections between regression, weighting and doubly robust estimation.
- Official R documentation: [An Introduction to R](https://stat.ethz.ch/CRAN/doc/manuals/r-release/R-intro.html) · [Vector arithmetic](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Arithmetic.html) · [Matrix multiplication](https://www.stat.math.ethz.ch/R-manual/R-devel/library/base/html/matmult.html) · [Reading tables](https://stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html).
