# Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation

Interactive self-study notes for readers familiar with applied biostatistics and generalised linear models. An introduction and eight chapters use the same 5,735 patients from the public SUPPORT/RHC cohort to derive and verify influence functions, then build AIPW and TMLE by hand.

The English edition uses British English and the same mathematical engines, observed data and numerical configuration as the Chinese edition. Equations retain editable TeX and accessible MathML. Reading modes connect mathematical objects with executable Julia or base R, including line-by-line inputs, outputs and dimensions.

## Read locally

From the repository root, install the locked dependencies and build both editions:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

Open [English](http://127.0.0.1:4174/en/) or [Chinese](http://127.0.0.1:4174/zh/). The language switch preserves the chapter and query string. The repository root opens English by default; the language menu switches between English and Chinese. An existing local preview service can serve a rebuilt site directly.

## Course

| Chapter | Question |
| --- | --- |
| 0 | How do doubly robust estimation, the EIF and TMLE fit together? |
| 1 | Why is the mean influence function the outcome minus the mean? |
| 2 | How do probability changes become scores and directional derivatives? |
| 3 | How do the population, treatment and outcome mechanisms form the target? |
| 4 | How does differentiating conditional means construct the ATE EIF? |
| 5 | Why must the gradient represent every admissible direction? |
| 6 | How do tangent spaces and projections determine the canonical gradient? |
| 7 | How does the EIF connect to estimation error and the efficiency bound? |
| 8 | How do we build one-step/AIPW and TMLE from patient records? |

Chapter 0 includes the six-step TMLE overview and the one-step/AIPW connection. Chapter 1 retains the full cancellation arguments, eighteen computed illustrations and beginner code explanations. Chapter 8 builds one persistent patient table through ten steps, with twenty-six intermediate columns and linked equations, patient values and code.

The outcome is all-cause death within 30 days; RHC is classified during the first 24 hours. The course distinguishes the statistical standardised risk difference from the identification assumptions needed for a causal interpretation. Patient summaries and references are included in the site.

Chapters load on demand. Returning to a visited chapter preserves its controls; the RHC CSV and initial fit are shared within the page. Chapter fragments must be published alongside the entry pages.

## Run the analyses

Keep `en/` and `shared/` in their repository locations. Julia uses Base and standard libraries; R uses base R.

```sh
julia --startup-file=no --history-file=no en/julia/rhc_lessons/ch01.jl
julia --startup-file=no --history-file=no en/julia/rhc_lessons/ch08.jl
julia --startup-file=no --history-file=no en/julia/tmle_trace.jl
Rscript --vanilla en/R/ch01.R
Rscript --vanilla en/R/ch08.R
Rscript --vanilla en/R/tmle_trace.R
```

## Test and publish

```sh
pnpm test
node tests/en/browser.cjs
node tests/chapter-loading-browser.cjs
```

The browser check requires installed Chrome and Playwright. It serves the build under a simulated repository prefix, checks all chapters at desktop and mobile widths, and exercises language switching, the real data, formula recalls, reading modes and the TMLE solver. R and Julia checks require their respective runtimes; see the verification record for actual execution.

[GitHub Pages instructions](docs/PUBLISHING.md) describe the supplied manual publication workflow. Upload the complete `dist/` structure; the same relative links work for a user site and a project site. Publication remains a separate action in your GitHub repository.

## Source structure

- `src/chapters/`: editable chapter text; `src/tmle-overview.md`: six-step introduction.
- `renderers/` and `src/*.js`: English illustrations and browser interactions.
- `julia/`, `R/` and `src/{julia,R}/`: executable lessons and reviewed line mappings.
- `../shared/`: original RHC source, mathematical engines and common computation modules.
- `docs/` and `reviews/`: course contract, publication instructions, translation reviews and actual verification.
- `../tests/en/` and `../output/en/`: assertions and browser evidence.

Data obtained from hbiostat.org/data courtesy of the Vanderbilt University Department of Biostatistics. Original study: Connors AF Jr et al., *JAMA* (1996), 276:889–897. Dataset links and repository use terms are retained in the course references.
