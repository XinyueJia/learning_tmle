# Learning TMLE: Notes on Influence Functions and Doubly Robust Estimation

<details>
<summary>🌐 English</summary>

- **English**
- [简体中文](../zh/README.md)

</details>

These self-study notes start with **influence functions** and build towards doubly robust estimation and targeted maximum likelihood estimation (TMLE). Using the same public SUPPORT/RHC patient data throughout, they connect mathematical derivations, visual explanations and calculations in Julia and R.

## Explore the chapters

| Chapter | What we work out |
| --- | --- |
| [0 · Getting started](https://xinyuejia.github.io/learning_tmle/en/#chapter-0) | How doubly robust estimation, the EIF and TMLE fit together |
| [1 · The mean](https://xinyuejia.github.io/learning_tmle/en/#chapter-1) | Why the mean influence function is the outcome minus the mean |
| [2 · Perturbing a distribution](https://xinyuejia.github.io/learning_tmle/en/#chapter-2) | How probability changes lead to scores and directional derivatives |
| [3 · Separating the mechanisms](https://xinyuejia.github.io/learning_tmle/en/#chapter-3) | How outcome risk, treatment allocation and baseline characteristics form the target |
| [4 · Deriving the ATE EIF](https://xinyuejia.github.io/learning_tmle/en/#chapter-4) | Where residuals, inverse probability weights and centring come from |
| [5 · Checking every direction](https://xinyuejia.github.io/learning_tmle/en/#chapter-5) | How the gradient represents changes along smooth paths |
| [6 · Finding the efficient gradient](https://xinyuejia.github.io/learning_tmle/en/#chapter-6) | How model restrictions, tangent spaces and projections determine the EIF |
| [7 · Understanding estimation error](https://xinyuejia.github.io/learning_tmle/en/#chapter-7) | How the EIF connects to uncertainty and the efficiency bound |
| [8 · Building AIPW and TMLE](https://xinyuejia.github.io/learning_tmle/en/#chapter-8) | How to construct both estimates from the same patient records |

## The case study

The worked example follows 5,735 critically ill patients in the SUPPORT/RHC observational dataset. Treatment records whether a patient received right heart catheterisation (RHC) during the first 24 hours; the outcome is all-cause death within 30 days. The same records connect the initial mortality mean to the final adjusted risk comparison.

[Patient summary and data sources](https://xinyuejia.github.io/learning_tmle/en/public-data.html) · [References and further reading](https://xinyuejia.github.io/learning_tmle/en/sources.html)

Original study: Connors AF Jr, Speroff T, Dawson NV, et al. *The effectiveness of right heart catheterization in the initial care of critically ill patients.* JAMA. 1996;276(11):889–897. [Study record](https://pubmed.ncbi.nlm.nih.gov/8782638/).

Data obtained from [hbiostat.org/data](https://hbiostat.org/data/repo/rhc.html) courtesy of the Vanderbilt University Department of Biostatistics.
