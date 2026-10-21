# Implementation brief for Codex: interactive EIF tutorial

## Goal
Turn the supplied self-contained `EIF_Interactive_Tutorial.html` and editable `EIF_Tutorial_v1.md` into a polished, rigorously validated interactive course for statistically literate readers who are new to semiparametric statistics. The scientific goal is to teach how to **derive and verify an efficient influence function**, rather than to showcase TMLE as a black-box algorithm.

## Content architecture
Preserve the eight-chapter sequence and mathematical emphasis:
1. Mean influence function (`Y−μ` from a point-mass path)
2. Point-mass contamination and its relationship to a score
3. Decomposition `p(x,a,y)=p(y|a,x)p(a|x)p(x)`
4. ATE EIF derived term by term
5. General pathwise derivatives and parametric-submodel scores
6. Tangent spaces, canonical gradient, orthogonal projection
7. Semiparametric efficiency bound and overlap/positivity
8. EIF-based one-step estimation and logistic-fluctuation TMLE

Each chapter should have: (a) an intuitive question, (b) 2–4 progressively introduced equations, (c) a live numerical demonstration, (d) an exercise to predict the direction of a change before touching the slider, (e) a precise technical explanation on demand, and (f) a concise answer/reveal section.

## Maths and data-generating mechanism
Keep the same discrete toy model throughout:
- `X∈{0,1}`, `P(X=1)=0.5`, `g(0)=0.2`, `g(1)=0.8`.
- `Q(0,0)=0.70`, `Q(1,0)=0.80`.
- `Q(0,1)=0.20`, `Q(1,1)=0.50`.
- CATEs are `0.10` and `0.30`; the identified ATE is exactly `0.20`.
- Causal identification assumptions: consistency, conditional exchangeability and positivity. Make explicit that all population experiments assume these conditions and use expectations, not random finite samples.

### Required derivations
- Mean IF: `D*(y;P)=y−E_P(Y)`.
- In the discrete model, `P_t=(1−t)P+tδ_o` has score `S_o(o')=1(o'=o)/p(o')−1`; with centered D, `E[D S_o]=D(o)`.
- Decompose a smooth score into `S_X+S_A+S_Y`, with `E[S_A|X]=0`, `E[S_Y|A,X]=0`.
- Derive the ATE EIF:

  `D*(O;P)=Q(1,X)-Q(0,X)-ψ(P)+A/g(X)(Y−Q(1,X))−(1−A)/(1−g(X))(Y−Q(0,X))`.
- Validate `E_P(D*)=0`, `dψ(P_t)/dt|0=E_P[D* S]` for three independently tilted mechanisms.
- Explain the canonical gradient as Riesz representer of derivative on the tangent space; efficiency = minimum `L²(P)` norm among valid gradients/influence functions in restricted models. **Do not** imply there are nonunique mean-zero gradients in the fully nonparametric model.
- Show the efficiency bound `Var(D*)/n` for regular asymptotically linear estimation, clearly labelled asymptotic, not finite-sample guarantee.
- Explain the TMLE update `logit(Q_ε)=logit(Qhat)+ε H_ghat`, `H_g=A/g-(1−A)/(1−g)`, the empirical EIF equation and the final substitution estimate.

### Critical conceptual distinctions
- Do not confuse `ATE` with `CATE`, or a propensity score with a parametric-submodel score.
- `ψ` can be invariant to changes in `g` even though the EIF depends on `g`: distinguish target functional from observed-data weighting and efficiency.
- Point-mass contamination is a convenient rigorous discrete derivation; do not call it an arbitrary regular smooth path for general continuous distributions.
- Neyman orthogonality is not universally equivalent to double robustness.
- TMLE does not necessarily beat AIPW in finite samples, particularly when both nuisances are misspecified.
- Distinguish estimated EIF equation from having unbiased estimation in an arbitrary finite dataset.
- In module 5, changing **only** `g` should keep both `p(X)` and `p(Y|A,X)` fixed for **all** tilt strengths, not merely to first order. Conditional exponential tilting achieves this. Do not use a globally normalised exponential tilt that also changes `p(X)` at finite perturbations while claiming a pure treatment-mechanism intervention.

## Interface expectations
- Use React + TypeScript + Vite (or an equivalently simple maintainable frontend).
- Render LaTeX clearly and accessibly using KaTeX/MathJax; no rasterised formulas.
- Give each of the eight chapters a route or anchored section, progress navigation, good desktop and mobile layout, and keyboard-accessible controls.
- Keep interactive panels beside the exact equation/concept they explain.
- Use native SVG/D3/Plotly/Recharts for plots. Avoid illustrations that merely repeat the text.
- Every chart must label its numerical units (pp, probability, variance) and distinguish exact functional values, numerical derivatives and linear approximations.
- Offer reset-to-default and controlled presets for 'Q correct only', 'g correct only', and 'both misspecified'.
- Never invent data or current research results. Keep the scientific references visible and links accurate.

## Testing gates
Create automated numeric tests for at least:
1. `μ_t=μ+t(z−μ)` for all selected `z`.
2. `E_P[D*]=0` over all 8 cells of the discrete joint distribution.
3. `dψ(P_t)/dt|0=D*(o)` for each point-mass direction (numerical finite differences).
4. `dψ(P_t)/dt|0=E_P[D*S]` for `S_X`, `S_A` and `S_Y` paths.
5. Pure changes in `g` leave identified ATE unchanged at every finite `t`.
6. `E_P[D* S_A]=0` for every valid treatment-mechanism score.
7. EIF variance follows the Bernoulli ATE analytic expression and increases with poor overlap in this example.
8. Population TMLE satisfies `E[H_ghat(Y−Q*)]=0` numerically.
9. If `Qhat=Q` or `ghat=g`, both AIPW and population TMLE recover `ψ=0.20`.
10. No console errors, broken equation renders, overlapping controls or mobile overflow.

## Work plan
First read both supplied files. Audit every displayed numerical identity and carefully re-derive the EIF. Implement the project incrementally with tests. Use real browser screenshots at 375 px mobile and ≥1280 px desktop to confirm all equations, labels and controls remain readable. Keep both a polished default tutorial and a 'details/proof' mode. Provide a reproducible README with build/test/preview instructions, and state any test not run. Do not deploy without asking where the user wants to host the result.

## Suggested readings
- Hines O et al. (2022), *Demystifying Statistical Learning Based on Efficient Influence Functions*. https://arxiv.org/abs/2107.00681
- Fisher A & Kennedy EH (2021), *Visually Communicating and Teaching Intuition for Influence Functions*. https://arxiv.org/abs/1810.03260
- Background-only Chinese article: `因果推断之Doubly Robust Regression-causalit的文章.md`. Do not inherit its imprecise ATE/CATE or orthogonality statements without checking.
