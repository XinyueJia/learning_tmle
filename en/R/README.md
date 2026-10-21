# R workbooks: the same RHC data, from the mean IF to manual TMLE

Chapter 0’s object figures use mathematical objects. Chapter 1 offers mathematical, Julia and R operations. Chapter 0’s workbook language is independent of its object figures. Each chapter’s code-language control switches the complete workbook and line-by-line explanations. Chapter 8 also switches each step’s code, with linked highlighting of formula symbols, patient-table columns and R variables. Both languages use the same data, dimensions and statistical targets.

All R code uses base R; the tested version is R 4.5.2. The webpage displays the corresponding code, and running the workbook locally reproduces the calculations. Preserve the directory relationship between `en/` and `shared/`; original data are in `shared/data/public/rhc/source.csv`.

Run in a terminal at the project root:

```sh
Rscript --vanilla en/R/ch01.R
Rscript --vanilla en/R/ch08.R
```

Or use an R session at the project root:

```r
source("en/R/ch01.R")
```

`source` reads and sequentially executes a saved script. Workbooks load shared functions, then read the original CSV. `<-` saves results; `$` extracts a column or list member. R applies `*`, `+`, `-` and `/` elementwise to equal-length vectors; `%*%` multiplies matrices, and `sum` and `mean` summarise a full vector. Chapter 1’s webpage relates each line to its inputs, outputs, dimensions and mathematical expression.

| File | Operations completed |
| --- | --- |
| ch00.R | Initial Q/g, design matrix, three predictions at the same W, standardisation |
| ch01.R | Death mean, probability replacement, difference quotient, IF, centring and survival complement |
| ch02.R | Probability directions, path score, mean derivative and pairing |
| ch03.R | Three mechanisms, conditional risk, initial fits and common standardisation weights |
| ch04.R | Inverse-probability weights, residuals and initial gradient contributions |
| ch05.R | Checks of all finite independent directions and gradient pairings |
| ch06.R | Weighted projection and norm decomposition in a five-dimensional model |
| ch07.R | Empirical moments, variances and standard errors of two functions |
| ch08.R | Manual bisection, AIPW and TMLE with sex strata and multivariable baseline models |
| tmle_trace.R | Offset, H, ε, updated risks and EIF built column by column in the same patient table |

`tmle_trace.R` defaults to ε=0. To try another value in R:

```r
Sys.setenv(TMLE_EPSILON = "0.003")
source("en/R/tmle_trace.R")
Sys.unsetenv("TMLE_EPSILON")
```

`Sys.setenv` supplies a string for this trial; the script converts it to the shared numeric scalar ε. Chapter 8’s `ch08.R` also prints successive bisection midpoints, scores and convergence results. Chapter 0 provides the study protocol and identification conditions; Chapters 7 and 8 explain conditions for empirical-variance inference.

Shared definitions in `shared/R/EIFCase.R` and `shared/R/RHCCase.R` cover finite-distribution algebra, original CSV reading, explicit Newton regression and logistic targeting. The course reads actual scripts; `en/src/R/` records the formula, inputs, outputs and explanation for every executable line. The build checks correspondence with the source.

Checks from the project root:

```sh
Rscript --vanilla tests/R/kernel-tests.R
sh scripts/node.sh tests/r-cross-language.cjs
sh scripts/node.sh tests/zh/r-parallel-browser.cjs
```

The last command checks the original Chinese edition’s parallel-language interface; it is retained as a historical validation command, not a claim of English-browser validation.

Syntax references: [official R introduction](https://stat.ethz.ch/CRAN/doc/manuals/r-release/R-intro.html), [vector arithmetic](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Arithmetic.html) and [matrix multiplication](https://www.stat.math.ethz.ch/R-manual/R-devel/library/base/html/matmult.html).
