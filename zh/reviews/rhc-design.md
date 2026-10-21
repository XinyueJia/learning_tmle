# RHC: independent causal-design and mathematical review

Review date: 2026-10-16. Owner: independent design/math reviewer. Scope: this review only; no chapter, protocol, data or implementation edits. Read: `COURSE_CONTRACT.md`, the RHC section of `public-data-design.md`, `shared/js/case-study.js` and `shared/julia/EIFCase.jl`. Implementation acceptance remains pending until the actual migrated files and executed outputs are inspected.

## Decision

Adopt the genuine public RHC cohort for the application running through all eight lessons. It is an observational medical procedure/monitoring study, not an oncology drug study. The eight-cell empirical example can use sex as a deliberately small covariate. Its numerical answer is a **sex-standardised observed-data risk contrast**, not a clinically adequately adjusted causal effect. The final Julia application must also fit a richer antecedent-covariate analysis to the same individual records; storing a public CSV or auditing provenance alone does not deliver the requested application.

The public cohort does not supply a known causal truth, a known treatment-assignment mechanism, or proof of exchangeability. None is required to calculate and study a clearly defined observed-data functional. A causal interpretation remains conditional and should be discussed, not asserted or made an impossible prerequisite for teaching.

## Primary-source evidence and independent data audit

The [repository description](https://hbiostat.org/data/repo/rhc.html) defines `swang1` by RHC on the first day qualifying for SUPPORT. The [original Connors et al. paper](https://ekroc.weebly.com/uploads/2/1/6/3/21633182/connorsetal1996.pdf), Methods, reports 5,735 patients in five hospitals, RHC within 24 hours of study entry, and confirmation of death or survival to day 180 for every patient. SUPPORT excluded death/discharge within 48 hours. Physiology used the most abnormal measurement within 24 hours. ADL/DASI referred to two weeks before admission, although collected later; some functional values were substituted or imputed. These facts limit time ordering, selection and measurement claims. The [official dictionary](https://hbiostat.org/data/repo/crhc) labels `dth30` without missing values and gives dates, historical conditions, demographics and day-one fields. The [repository permission](https://hbiostat.org/data/) allows use with the original citation and Vanderbilt acknowledgement.

Independent in-memory retrieval of [the official CSV](https://hbiostat.org/data/repo/rhc.csv) on the review date produced SHA-256 `9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8`. There are 5,735 records, 2,184 RHC, 3,551 no RHC, and 1,918 `dth30=Yes`. Every released `dth30` agrees with `dthdte-sadmdte≤30` when a death date exists; no death date precedes entry. Every `t3d30` agrees with the minimum of that interval and 30, assigning 30 when no death date is supplied. These are reproducibility checks, not independent outcome adjudication.

Eleven non-30-day-death records have last contact less than 30 days after entry; three have a later recorded death and eight have no recorded death date. Therefore last-contact arithmetic alone does not prove complete 30-day observation. Retain the source's released binary endpoint, supported by the paper's stated ascertainment, and report this discrepancy openly. Missing death dates for survivors are expected; do not recode missing dates as deaths, discard those patients, or create synthetic follow-up dates. No censoring estimator is needed for analysing this provided complete binary endpoint. If instead attempting an independently reconstructed survival outcome, the observation model would require a separate design.

With `x=0` Female, `x=1` Male, `a=1` RHC, `y=1` death by 30 days, the independent eight-cell counts are:

| Sex | Treatment | Survived beyond 30 days | Died by 30 days |
|---|---|---:|---:|
| Female | No RHC | 1143 | 494 |
| Female | RHC | 558 | 348 |
| Male | No RHC | 1320 | 594 |
| Male | RHC | 796 | 482 |

All eight cells are positive. The marginal death risk is `1918/5735 = 0.33443766346992154`. The empirical sex-standardised contrast is `0.07369211904730702`, or approximately **7.369 percentage points** higher risk in the RHC group after this deliberately limited standardisation. It cannot establish harm caused by catheterisation.

## Protocol to appear before the first application calculation

The first chapter should state, in accessible Chinese, the following substantive decisions before presenting the counts.

- **Population:** the 5,735 released eligible critically ill adults in the RHC cohort; inferential generalisation beyond their source population needs extra assumptions. Do not describe all ICU entrants as the target population or silently recreate eligibility from outcome dates.
- **Time zero:** study qualification/entry (`sadmdte`), rather than an invented drug-start date or a guaranteed ICU-admission date.
- **Treatment contrast:** RHC during the first 24 hours versus no RHC during that window. The comparator is usual management without initial RHC. This is an initial strategy contrast; later RHC is not encoded here as permanent adherence to “never RHC”.
- **Outcome:** released 30-day all-cause death indicator `dth30`, with `Yes→1`, `No→0`. Positive contrasts mean higher mortality risk.
- **Primary numerical object for the finite lesson:** standardise the two observed conditional risks to the cohort sex distribution. State directly that sex is chosen to permit complete arithmetic on eight cells and is insufficient clinical adjustment.
- **Application endpoint:** the same functional form using a pre-specified richer covariate vector, fitted from individual data in Julia. Report this together with the limited-adjustment calculation, overlap and the timing/indication limitations.

For a causal reading, name consistency of the strategy and outcome, adequate conditional exchangeability, positivity, and appropriate population selection. Explain indication confounding in ordinary language: patients can receive RHC because they are already sicker. A measured treatment-versus-outcome association may therefore remain even after sex adjustment.

The 24-hour exposure definition is a grace window, not instantaneous random assignment at entry. The data omit exact within-day treatment and covariate timestamps; early clinical changes can affect both treatment and prognosis. Eligibility conditioned on subsequent survival/discharge also constrains an entry-time trial interpretation. Do not claim that baseline adjustment repairs these design limitations, or resolve them by silently moving time zero to day two while retaining the original risk period. The honest delivered analysis is a standardised association; a causal interpretation of an ideal initial-management strategy is conditional on additional design assumptions.

## Covariate strategy for the actual Julia application

Use an explicit, frozen field list, not “all columns except outcome”. A defensible primary analysis can use `age`, `sex`, `race`, `edu`, `income`, `ninsclas`, `ca` and historical comorbidity flags (`cardiohx`, `chfhx`, `dementhx`, `psychhx`, `chrpulhx`, `renalhx`, `liverhx`, `gibledhx`, `malighx`, `immunhx`, `transhx`, `amihx`). These describe antecedent attributes rather than responses to RHC. Admission disease categories `cat1`, `cat2` and diagnosis flags can supplement the set if explicitly treated as presenting diagnoses. More adjustment improves the breadth of measured adjustment; it does not establish that the set suffices for exchangeability.

Pre-specify a secondary expanded model with `aps1`, `scoma1`, physiology and `surv2md1`, labelled **day-one clinical adjustment with uncertain within-day ordering**. These variables are important proxies for severity, but the release does not show their values before catheterisation. DNR on day one has a similar timing concern. Avoid declaring this the uniquely correct causal analysis. Weight and urine output should receive the same timing/measurement audit; urine output is substantially missing.

Do not use `ptid`, the CSV row label, `death`, `dth30`, `t3d30`, death/discharge/last-contact dates, or other outcome information as nuisance predictors. The exposure itself belongs in the outcome model only. Calendar entry time can be a separate clearly documented modelling choice. ADL/DASI should not be described simply as current day-three function: the paper states an antecedent reference period, but collection/substitution/imputation and the released labels make a conservative omission from the primary model reasonable. An optional sensitivity model must explain their provenance rather than treating original imputation as raw complete measurement.

Use all eligible released rows for the primary cohort. Explicit missing categorical `cat2` can be encoded as a missing category. Any additional median imputation, missing indicators, continuous scaling and category mapping must be deterministic and documented. A cross-fitted analysis must learn numeric preprocessing on each training fold, retain stable category definitions, and score only held-out records. Do not delete patients just to make a compact covariate table.

A transparent dependency-light Julia implementation is feasible with `LinearAlgebra`, direct CSV parsing, a fixed design matrix, and hand-written logistic loss/gradient/Hessian updates. Fit `g(W)` using treatment as the response, and `Q(A,W)` using death as the response. Include an intercept and document continuous transformations, categorical reference levels, optional interactions, optimisation tolerance and any fixed ridge penalty. Counterfactual predictions require setting A to 0 and 1 for every participant while keeping W fixed. Do not predict each participant only under their observed A.

Report propensity extrema/quantiles, overlap by arm, any numerical clipping threshold and number affected, optimiser convergence, fluctuation score, plug-in estimate, AIPW estimate, TMLE estimate, and empirical EIF-based standard error. Clipping is an explicit estimation choice, not proof of positivity. A fixed low-dimensional logistic model remains vulnerable to misspecification. The asymptotic interval needs appropriate nuisance convergence/product remainder control; cross-fitting alone does not guarantee it. A simple in-sample implementation may demonstrate the algorithm with its interval labelled approximate; it must not claim automatic semiparametric efficiency.

## Independent hand derivation and interface assessment

Let `Q(a,w)=E(Y|A=a,W=w)`, `g(w)=P(A=1|W=w)` and `ψ(P)=E[Q(1,W)-Q(0,W)]`. This is an observed-data functional with a causal interpretation only under the stated assumptions. In the unknown-g observational nonparametric model its canonical gradient is

`D(P)(O) = H_g(A,W){Y-Q(A,W)} + Q(1,W)-Q(0,W)-ψ(P)`,

where `H_g(a,w)=a/g(w)-(1-a)/(1-g(w))`. Conditional centring gives `E[Y-Q|A,W]=0`; averaging `Q(1,W)-Q(0,W)-ψ` over W gives zero. Perturbing the W law contributes the latter term. Perturbing outcome risks contributes the weighted residual. Perturbing treatment alone leaves the target unchanged. The binary eight-cell derivation is a finite special case; full W changes the nuisance fitting and averaging, not this complete-outcome EIF formula.

For an initial fitted risk `Q0`, the logistic fluctuation sets

`Qε(a,w)=expit{logit Q0(a,w)+ε H_ĝ(a,w)}`.

For each observed Bernoulli record, `dℓ/dη = Y-Qε`, and `dη/dε=H_ĝ`, so the empirical mean log-likelihood derivative is `P_n[H_ĝ(Y-Qε)]`. Its derivative is `-P_n[H_ĝ² Qε(1-Qε)]≤0`. Hence a one-dimensional root search is justified; a finite root requires suitable non-degenerate data. Offsets stay fixed during targeting and ĝ is learned from the observations. After solving the score equation, calculate `ψ̂=P_n[Q*(1,W)-Q*(0,W)]`; its centring term averages to zero by construction, so the empirical EIF mean is the targeting score. Standard error is `sqrt(P_n[(D_i-mean D)²]/n)` under the relevant inferential conditions.

The currently read `case-study.js` and `EIFCase.jl` correctly implement this grouped offset score and its negative slope for their accepted eight-cell input. They calculate Q and g from supplied counts. Their default data still came from the synthetic mathematical model at initial inspection; migration must replace that application source without relabelling the synthetic population's truth as an observed RHC truth.

For the sex-stratified case specifically, `ĝ(x)=n_x1/n_x` is saturated. For any fitted Q, direct substitution yields

`ψ̂(Q)+P_n H_ĝ(Y-Q) = Σx (n_x/n){y_x1/n_x1-y_x0/n_x0}`.

Thus a converged fluctuation returns exactly the empirical sex-standardised contrast, even if Q* is not the saturated four-risk table. The equality is an empirical identity, not a proof that the final Q* is consistently estimated or that sex removes confounding. An initially saturated Q already has zero score and needs no update; using a deliberately simpler initial Q is legitimate if explained as an optimisation lesson.

For the chapter-six known-g tangent-space exercise, explicitly **change the statistical model**: fix g at chosen numerical values. Estimating g from this observational cohort does not make its population value known. In the binary fixed-g model, legal scores span W and outcome directions (dimension five); the treatment residual `A-g(X)` is orthogonal to those directions. Adding it to the canonical gradient still represents the derivative on that restricted space, and projection removes it. In the full unknown-g model the added residual is not another valid gradient, because treatment directions are now legal. The ordinary ATE canonical-gradient formula happens to be the same in these models; that coincidence does not erase the difference in legal scores.

## Acceptance criteria and current status

Provisional design approval: proceed with the real RHC application and explicitly separated small/full-W analyses. Final acceptance requires inspecting the migrated protocol/contract/chapter briefs, actual CSV-to-counts linkage, baseline model field list and executed Julia results. The first lesson must already identify the real population, time zero, intervention, outcome and limitations. All eight lesson code paths must use the same real observations for the application, and the final deliverable must contain the actual manual Julia multivariable TMLE analysis. Synthetic distribution experiments may remain as mathematical experiments when clearly labelled.

### Implementation inspection, same review date

Inspected the newly written `RHCCase.jl` reader, individual design matrix, explicit logistic Newton/line-search fit, counterfactual predictions, individual fluctuation and bisection; also inspected `zh/julia/rhc_lessons/ch08.jl`. The richer executed model uses 17 columns: intercept, sex, standardised age, two race indicators, and twelve historical condition flags. This is **expanded antecedent adjustment**, not all available clinically relevant covariates. Its omission of acute severity is explicit and substantive. The proposed wider field lists above are design options, not claims about fields actually fitted. The current limited conservative model is acceptable for teaching actual multivariable TMLE when that limitation accompanies its results. It does not count as a comprehensive clinical effectiveness analysis.

The implementation fits unknown g and Q from the same original 5,735 records, uses every participant's two counterfactual risk predictions, fixes g/offsets during targeting and solves the observed score. It introduces no nuisance imputation, clipping, penalties or TMLE packages. The code fails visibly for invalid inputs, rank deficiency and non-convergence. No oracle distribution is used. There is no cross-fitting; this is compatible with a transparent small parametric demonstration, subject to the stated model and inference limitations.

Independently executed `tests/julia/rhc-tests.jl` using the installed Julia 1.12.5 binary directly (the launcher could not create its configuration lock within the sandbox). All **127 checks** passed, including all eight scripts run from a working directory outside the repository; individual likelihood/score finite-difference checks; treatment/outcome logistic score equations; and source aggregation. The expanded analysis returns initial plug-in `0.0864988559023306`, AIPW `0.08996799520909834`, targeting ε `0.003576966662876657`, final risk0 `0.30058304496920574`, risk1 `0.39056276970451026`, contrast `0.08997972473530443` and empirical EIF SE `0.013082375165239404`. Its propensity range is approximately `[0.07870,0.68191]`. These are fitted observational results, not causal truth. The score/likelihood derivation above agrees with the implemented signs, offsets and denominator n.

Protocol, course contract and all chapter briefs/text still require final inspection after migration; passing the computation checks alone does not approve the chapter narrative.

### Chapters 0 and 1 prose gate, 2026-10-16

Independently read the newly migrated `zh/src/chapters/ch00.md` and `ch01.md`, and the actual first-lesson RHC Julia source. **Mathematical prose accepted for these two chapters**, allowing the sequential author to proceed to chapter 2. This acceptance covers the authored definitions and derivations, not yet the rendered figures, laboratory output, dynamic Julia explanations or final migrated briefs.

Chapter 0 identifies the genuine source, selected cohort, initial 24-hour treatment window, study-entry origin and released 30-day mortality. It carries the 48-hour selection limitation prominently, distinguishes the sex-standardised functional from the larger-W functional, and does not claim a known causal truth or adequate exchangeability from the data. The chapter separates estimand, estimator, estimate, distribution derivative, estimation error and conditional efficiency. The narrative makes clear that AIPW changes the reported number while TMLE updates fitted Q before standardisation. Its definitions and causal qualifications are compatible with the selected-data problem.

Chapter 1 consistently uses `r=1918/5735`, `c=3817/5735`, `r+c=1` and reference `P=P_n`. It does not infer knowledge of the population law from the observed table. Independently checked: new weights `(1-t)c,(1-t)r+t`; their sum; full expansion to `r+ct`; subtraction and division only for nonzero t; the general `μ+t(z-μ)` summation; both influence values; numerical and general weighted centring; the old-function/new-average distinction; both exercises; the survival-complement negative sign; and the strict positive z=1 interval `(-r/c,1)`. All are correct. The support is explicitly finite, and continuous contamination/regularity limitations are retained. Upper-case event time T and lower-case perturbation t have separate meanings and units. The observed mortality mean is not presented as a treatment effect.

All **18 distinct expected figure markers** remain in the source. An exact source scan found no stale `.58`, `.42`, `12个月`, `12月`, `116`, `84`, `20pp` or `+20` numerical tokens in chapter 1. The actual RHC script has **32 lines**, reads the original CSV, calculates the per-person mean and influence values, independently checks their weighted eight-cell calculation, and does not depend on a synthetic cohort. It is suitable for the proposed source-derived embed once its explanations and actual stdout are rendered and checked.

Pedagogically, the progression from real counts to empirical probabilities, controlled perturbation, explicit multiplication/addition/cancellation, derivative, function, random input and centring is suitable for the specified audience. The code section still depends on lead integration to explain the actual source lines. Two minor prose clarifications were requested: use the bilingual standard term `典范梯度（canonical gradient）` on chapter 0's first formal mention, and make chapter 1's opening `3817人在30日时确认存活` explicit. The current chapter-1 brief is still the old synthetic brief and must be rewritten before final acceptance; its historical passed checks cannot be applied to these new chapters.

### Chapter 2 prose gate, 2026-10-16

Independently read current `zh/src/chapters/ch02.md` and actual `zh/julia/rhc_lessons/ch02.jl`. **Mathematical prose accepted; author may proceed to chapter 3.** This is not acceptance of pending chapter briefs or rendered UI.

Checked the exact two-class direction `h=(-c,c)`, score `(-1,c/r)`, normalisation constraint, log-path derivative at zero, mean-zero score, general finite-support derivative and weighted IF/score pairing. The point-direction pairing expands correctly to `cr+c²=c`. For the full eight-cell support the selected-cell score `-1+1{j=*}/p*` is correct, and centring reduces the derivative to `y*-r`. The chapter distinguishes the selected complete observation type from the entire death category, holds the reference distribution fixed as t varies, and preserves the finite-support/continuous-regularity boundary. No causal sufficiency or population-truth claim appears.

Two small integration corrections were communicated. First, the first use of the log derivative/chain rule should explain that log has local slope `1/p` and that composing it with p(t) multiplies that slope by the probability's slope; merely naming the rule leaves a bridge missing for the specified beginner. Secondly, the Julia introduction currently promises original/new probabilities, D and per-cell pDS, whereas the actual script prints per-cell h/S and aggregate risk/derivative summaries only. Print those additional columns or narrow the description to the output actually shown. The actual script's calculations match the chapter's mathematical claims and were included in the independently passed eight-script execution above.

### Chapter 3 prose gate, 2026-10-16

Independently read current `zh/src/chapters/ch03.md` and `zh/julia/rhc_lessons/ch03.jl`. **Mathematics, design boundaries and pedagogical progression accepted; author may proceed to chapter 4.** Pending briefs and rendered implementation remain separate acceptance tasks. Also inspected the revised chapter-2 log/chain-rule bridge; that previously identified prose gap is closed.

The real denominators are correct: 2,543 Female records, 906 Female RHC records, 348 deaths among those 906; their product cancels to `348/5735`. The source explicitly keeps coordinate order `(X,A,Y)` despite writing the chain factors in order Y, A, X. The empirically estimated nature of these mechanisms is clear. The standardised target uses a common pX, while the unadjusted groups correctly use Female weights `906/2184` and `1637/3551`. Its 7.36921 percentage-point contrast is correctly labelled an observed sex-standardised association.

Holding Q and pX fixed while changing only g leaves this target fixed; setting g to 0.5 in both strata makes the hypothetical arm distributions of X identical to pX and the unadjusted contrast equal to the standardised one. The chapter correctly distinguishes this algebraic mechanism experiment from causal identification and from a clinical change applied to the original patients. It also prepares the separate A-only initial Q without confusing it with the four observed group risks. The Julia source prints the four empirical/initial risk pairs and empirical pX/g as described.

A minor terminology improvement was suggested: explain “saturated” at first use as allowing every `(a,x)` group its own observed risk rather than forcing groups to share risks. Add `standardisation` and `joint distribution` alongside their first formal Chinese mentions when implementing the bilingual terminology convention. These do not affect mathematical acceptance.

### Chapter 4 draft gate, 2026-10-16

Independently read current `zh/src/chapters/ch04.md` and actual `zh/julia/rhc_lessons/ch04.jl`. Quotient derivation, residual/weight signs and candidate centring are **accepted**. Two local corrections were requested before closing the whole prose gate; neither requires changing the derived gradient.

The exact selected-group difference correctly reduces from common denominators to `t(y*-Q)/[v+t(1-v)]`; dividing by nonzero t and taking the limit gives `(y*-Q)/v`. Outside the selected group the common factor cancels. The resulting indicator selects precisely `(a*,x*)`, with denominator `pX(x)πa(x)`. The outer derivative is `τ(x*)-ψ`; cancelling pX in the outcome derivative leaves the correct actual-arm inverse probability. The control-arm minus sign and the example `A=0,Y=1` residual sign are correct, with a separate warning that the complete D can have either sign. Its conditional residual and outer-centred components each have mean zero under the same reference distribution. The chapter explicitly postpones all-direction verification and efficiency.

The outer-product explanation must clarify that τ generally has a nonlinear path, so `(p+t ṗ)(τ+t τ̇)` is only its first-order expansion. A beginner-friendly exact alternative is `p_tτ_t-pτ=(p_t-p)τ+p(τ_t-τ)+(p_t-p)(τ_t-τ)`; after division by t the last term tends to zero. This avoids silently dropping an additional risk-path remainder. Also, the Julia paragraph promises four group contributions and eight fitted influence values, but the actual script currently prints four H values and aggregate summaries only; align the wording or output. The implemented gradient itself and script aggregate calculation are correct. The author may move to chapter 5 after these local closures; final status will record their inspected resolution.

### Chapter 4 closure and chapter 5 draft gate, 2026-10-16

Inspected chapter 4's revised exact product-difference identity and corrected Julia output description. Both local issues are **closed; chapter 4 prose gate accepted**.

Independently read `zh/src/chapters/ch05.md` and its actual RHC lesson script. The all-direction proof is mathematically sound: seven difference-to-eighth-cell basis directions span the sum-zero eight-cell space; strict positive empirical probabilities admit local two-sided paths; conditional score components sum to S and satisfy the required conditional centring; outcome and population derivative terms have the proper weights; conditional centring removes their cross-pairings. The treatment residual counterexample correctly fails as an alternative gradient in the unknown-g model. The L² continuity discussion correctly bounds the pairing with Cauchy–Schwarz and does not claim an estimator's asymptotic expansion from gradient verification.

Three local corrections were sent to the lead. (1) The text says “all nine terms”, but two D components times three score components give **six** products. (2) The Julia prose claims eight point directions; the displayed actual script computes one selected point, seven independent contrasts, and mixed/outcome examples. Align the claim or output. (3) Strengthen the beginner's conditional-risk derivative bridge with `p'_Y=p_Y S_Y`, followed by `Q̇=Σ_y y p_Y S_Y=E[Y S_Y|a,x]=E[(Y-Q)S_Y|a,x]`; this makes the currently stated formula inspectable using the previous chapters' finite sums and conditional centring. No change to the final gradient is needed. The lead may proceed to chapter 6 after these local closures; rendered implementation and briefs remain pending.

### Chapter 5 closure and chapter 6 draft gate, 2026-10-16

Inspected chapter 5's correction to six cross-products, its finite-sum conditional-risk derivative bridge, and its distinction between the webpage's eight point directions and the script's actual examples. All three issues are **closed; chapter 5 prose gate accepted**.

Independently read `zh/src/chapters/ch06.md` and the actual RHC projection script. The five-versus-seven-dimensional distinction is correct: unknown-g observational model permits all seven mean-zero dimensions; fixed-g exercise permits one X and four conditional-outcome dimensions. The displayed five basis functions are mean zero, nonzero and mutually orthogonal under the full-positive empirical table. Conditional averaging correctly makes U orthogonal to each basis column. Its addition is legitimate only for the restricted gradient-representer problem and fails when unknown-g treatment directions are allowed.

The single-column completion of the square and coefficient formula are correct; mutually orthogonal columns justify summing separate projections. The norm decomposition has the proper square coefficient b² and zero cross term. The text clearly distinguishes weighted column length from an unweighted picture and disclaims an automatic estimator expansion. The fixed-Q comparison and the statement that knowing g does not automatically lower the ATE EIF variance are correct. The local projection coefficient c is explicitly distinguished from chapter 1's probability constant.

One essential proof bridge was requested: before concluding the projection of `D*+bU` is D*, explicitly show D* belongs to the displayed T. In the binary setting, `D_X=[τ(1)-τ(0)]B_X` and `D_Y=Σ_(x,a) H_g(a,x)B_(xa)`. Thus D* is a linear combination of those five basis columns; combined with U's orthogonality, this proves the projection claim. With that local addition, the chapter-6 mathematical/pedagogical gate can close and the author can proceed to chapter 7. No other blocker was found.

### Chapter 6 closure and chapter 7 draft gate, 2026-10-16

Inspected chapter 6's explicit basis representation of D_X and D_Y. The membership bridge is **closed; chapter 6 prose gate accepted**.

Independently read `zh/src/chapters/ch07.md` and its actual RHC lesson script. The sample-mean error identity uses the unknown population mean correctly, rather than replacing it with the sample mean and obtaining a vacuous zero. The general asymptotic-linear representation separates its influence function from the target gradient and specifies an `o_P(n^-1/2)` remainder. Its rate examples are correct. The iid variance calculation gives V/n, and the CLT/regularity discussion limits the efficiency bound to its stated estimator class. The projection variance decomposition is correct for centred gradient representatives and does not rank arbitrary finite-sample MSE.

The displayed complete-outcome ATE variance is correct. One local beginner's derivation bridge was requested before closing the full gate: show `E[D_Y²|X]=g Q1(1-Q1)/g²+(1-g) Q0(1-Q0)/(1-g)²`, then cancel one treatment-probability factor to obtain the two inverse-g terms. This explains why squared inverse weights leave first powers in the final variance. The existing sentence moves directly from Bernoulli variance to the result and skips that meaningful step.

The actual script separately computes moments for the initial fitted function and the saturated empirical gradient; the narrative matches these outputs and correctly explains that changing the fitted risks changes the whole function, rather than merely its centring constant. The chapter does not identify the empirical variance with an unknown efficiency bound, claim guaranteed clinical confidence coverage, or infer a nuisance rate from the targeting equation. Chapter 8 may follow once the local conditional-variance expansion is added. Rendered results and final briefs remain pending.

### Chapter 7 closure, chapter 8 draft and JavaScript inspection, 2026-10-16

Inspected the chapter-7 conditional-variance expansion showing cancellation of one treatment-probability factor. That issue is **closed; chapter 7 prose gate accepted**. Fresh chapter-specific authored-narrative reviews for chapters 00–07 are saved as `rhc-ch00.md` through `rhc-ch07.md`; legacy reviews remain historical.

Independently read all of chapter 8, its actual Julia script, `shared/js/rhc.js` and the actual `zh/src/rhc-full.js` UI. The population AIPW error product B has the correct positive sign under the stated definition. The score expansion, negative slope, treatment-specific update signs, saturated-sex empirical identity and full 17-column fitted design are correct. The full JS implementation learns g and Q from raw observations with explicit Newton steps, predicts both intervention risks for every participant, performs the same logistic fluctuation, and recomputes the empirical gradient and variance. The UI explicitly triggers root solving and labels its model and inference limitations. No oracle or clinical-truth constant is used in fitting or targeting.

Independently executed `sh scripts/node.sh --test tests/rhc.test.js`: **all seven tests passed**, including analytically solvable logistic fixtures, finite-difference targeting checks, negative-score update direction, original-data counts, baseline score equations and final observational estimate. This supplements the earlier independent Julia execution; it is not a browser test.

Two chapter-8 local closures were requested. The exact error identity must retain `-P_n Dhat` when the solver only reaches a tolerance: `ψhat_T-ψ0=(P_n-P0)Dhat+B-P_n Dhat`; the last term vanishes only for an exact targeting root. The current prose says the equation is approximately zero before dropping it in an exact equality. Also align the Julia output description with its printed initial summaries, first five midpoint/score steps and final fitted risks; it does not currently print every offset, H and interval endpoint. These corrections do not change the fitted result or the positive sign of B.

### Chapter 8 closure, 2026-10-16

Inspected the revised exact error identity retaining `-P_n Dhat` and its explicit numerical-root tolerance explanation, plus the corrected actual Julia output description. Both issues are **closed; chapter 8 authored mathematics/pedagogy gate accepted**. All chapters 00–08 now have fresh independent narrative reviews, `rhc-ch00.md` through `rhc-ch08.md`, with reviewed source hashes and explicit integration boundaries. Final protocol/contract/brief and rendered checks remain pending as separate tasks.

### Migrated documentation consistency review, 2026-10-16

Read the rewritten `COURSE_CONTRACT.md`, `RWS_CASE_PROTOCOL.md`, `CASE_STUDY.md`, root/Chinese READMEs, `zh/src/public-data.md` and all nine current chapter briefs, then rescanned all current chapter narratives. The migrated documents consistently name the same 5,735 participants, original 30-day endpoint, observational RHC treatment, empirical reference law and unknown population law. They distinguish the sex-standardised target from the actual expanded 17-column antecedent model; they no longer promise a 20-percentage-point truth, a sufficient binary confounder, a drug comparison, or established clinical causal identification. The current briefs point to the real narrative and fresh reviews, with tests delegated to actual verification records rather than old pass claims. The synthetic-version reference directory exists.

Rechecked all nine reviewed chapter source hashes against the fresh `rhc-chXX.md` files: **all nine match**. The actual `rhc_case.jl` prints both logistic coefficient vectors and feature order, supporting the public page's reproducibility claim. The main course/protocol/brief documentation is accepted for mathematical/design consistency.

One ancillary source-note closure remains: `zh/docs/data/RHC_SOURCE.md` still describes the formal application as only sex-standardisation and talks about the multivariable analysis as future work. It must name the now-executed conservative W analysis as well. Its functional-status warning should distinguish later collection from the original paper's two-weeks-before-admission reference period; omission is conservative because of measurement/imputation provenance, not proof these were post-RHC states. The lead was also already updating the SOURCES Ng heading to historical status and adding the RHC entry. Browser/rendered acceptance remains outside this documentation gate until the actual integration checks finish.

### Ancillary source-note closure, 2026-10-16

Inspected the corrected `RHC_SOURCE.md` sections: they now distinguish the executed Ψ_X and Ψ_W analyses, name the complete 17-column design, and correctly separate later ADL/DASI collection from the original paper's antecedent reference period. These issues are **closed**. Current chapter prose, mathematical source computations, protocol, contract, application notes, READMEs, public-data page and briefs are accepted for this reviewer's mathematics/design consistency scope. The planned bibliography heading/RHC-source entry still awaits its final inspection. Rendered/mobile integration remains the lead's separately recorded verification scope.

### Final bibliography and limited screenshot inspection, 2026-10-16

Inspected the completed SOURCES RHC entry and the historical-candidate heading for Ng. The current entry points to the original study and official repository/dictionary, carries the correct 5,735/1,918 counts, outcome ascertainment, treatment/selection limits, antecedent ADL/DASI distinction, conservative W caveat and required Vanderbilt acknowledgement. This closes the bibliography issue. **All mathematical, causal-design, authored-pedagogy and migrated-documentation issues raised by this reviewer are closed.**

Directly viewed these saved screenshots (the reviewer did **not** run their browser capture):

- `output/zh/playwright/rhc-centering-375.png`: the two weighted sums, product rows and zero-difference conclusion are legible at the captured mobile width. The two-step algebra matches r/c and the prose; decimal rounding is explicitly disclosed. Labels and result rows are contained in their cards.
- `output/zh/playwright/rhc-window-375.png`: the three schematic trajectories distinguish death by day 30, known survival beyond the horizon and an unknown state at day 20. The 30-day line, indicators and non-patient schematic warning are readable. No clinical timestamps are passed off as actual observations.
- `output/zh/playwright/rhc-full-solved-1360.png`: the actual full-model count, initial/TMLE risk differences, near-zero scientific-notation score, g/Q ranges, explicit solve/reset controls and per-person two-treatment prediction table are readable. The initial model and clinical-adjustment limitations are visible. Displayed values agree with the inspected computation.

This is a visual/pedagogical review of three concrete image files, not independent execution of desktop/mobile automation, keyboard or screen-reader tests. The lead's full browser runs and final layout-polish rerun remain evidenced by the lead's own verification record. Independent execution by this reviewer remains the 127 Julia checks and seven targeted RHC JavaScript tests recorded above. No extra clinical identification, learner-outcome or confidence-coverage claim is made.
