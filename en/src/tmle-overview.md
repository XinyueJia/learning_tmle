<!-- tmle-step:0 -->
### ① Add three columns of initial risk predictions

We have already fitted the outcome regression. Now attach its outputs to the patient table: observed-treatment predictions will give residuals; predictions under both treatments will compare risks in the same baseline population. All three columns come from the same initial $Q$.

$$
\widehat Q_{A,i}=\widehat Q(A_i,W_i),\qquad
\widehat Q_{1,i}=\widehat Q(1,W_i),\qquad
\widehat Q_{0,i}=\widehat Q(0,W_i).
$$

> **Notation recap:** $i$ is the original patient row; $W_i$ is that person’s baseline and $A_i$ their observed treatment. Compare $\widehat Q_{A,i}$ with observed outcome $Y_i$; $\widehat Q_{1,i}$ and $\widehat Q_{0,i}$ predict mortality risk with RHC and no RHC as inputs respectively. Subscripts 0 and 1 denote treatment levels; hats denote fitted quantities, and all predictions are probabilities.

**Pass to the next step:** one observed-treatment prediction column and two prediction columns for standardisation.

<!-- tmle-step:1 -->
### ② Identify $H$ in AIPW’s weighted residuals

Step ① retained the initial risk predictions. Return to AIPW in §2 of this chapter: first calculate the standardised risk difference, then add the average patient-level weighted residual $C_i$. The earlier group-specific definitions of $C_i$ for RHC and no RHC combine into one line:

$$
C_i=\underbrace{\left\{\frac{A_i}{\widehat g_i}
-\frac{1-A_i}{1-\widehat g_i}\right\}}_{H_{A,i}}
(Y_i-\widehat Q_{A,i}).
$$

> **Notation recap:** $C_i$ is patient $i$’s correction contribution; $Y_i$ is observed mortality and $\widehat Q_{A,i}=\widehat Q(A_i,W_i)$ the initial prediction. The fitted RHC probability is $\widehat g_i=\widehat g(W_i)$. Since $A_i$ is 0 or 1, the braces automatically select the relevant group’s weight. Denote this coefficient multiplying the residual by $H_{A,i}$.

**$H_{A,i}$ is the signed inverse probability weight used in IPW above.** IPW multiplies it by the observed outcome; AIPW multiplies it by “observed outcome minus initial prediction”. For the later update of both treatment predictions, retain the coefficients for both inputs:

$$
H_{1,i}=\frac1{\widehat g_i},\qquad
H_{0,i}=-\frac1{1-\widehat g_i},\qquad
H_{A,i}=A_iH_{1,i}+(1-A_i)H_{0,i}.
$$

> **Notation recap:** $H_{1,i}$ and $H_{0,i}$ correspond to RHC and no-RHC inputs; $H_{A,i}$ selects one according to observed treatment. The weight $H$ is dimensionless; its minus sign comes from “RHC risk minus no-RHC risk”. In the TMLE update, this coefficient is called the clever covariate.

<div class="tmle-ipw-placeholder"></div>

**Now put the same $C_i$ back into the initial fitted EIF.** It also includes the deviation of the individual predicted risk difference from the overall average:

$$
\widehat D_i^{\mathrm{init}}
=\underbrace{C_i}_{H_{A,i}(Y_i-\widehat Q_{A,i})}
+(\widehat Q_{1,i}-\widehat Q_{0,i})
-\widehat\psi_{\mathrm{gcomp}}.
$$

> **Notation recap:** $\widehat D_i^{\mathrm{init}}$ is the initial fitted EIF’s value for record $i$; $\widehat Q_{1,i}-\widehat Q_{0,i}$ is this person’s initial predicted risk difference, and $\widehat\psi_{\mathrm{gcomp}}$ the average predicted risk difference across all 5735 patients. All $Q$, $g$ and centring values here come from the initial fit.

Thus an individual EIF value generally differs from $C_i$; the extra centring term disappears only after averaging over everyone. Sum each term separately:

$$
\begin{aligned}
\frac1n\sum_{i=1}^n\widehat D_i^{\mathrm{init}}
&=\frac1n\sum_{i=1}^n C_i
 +\frac1n\sum_{i=1}^n(\widehat Q_{1,i}-\widehat Q_{0,i})
 -\frac1n\sum_{i=1}^n\widehat\psi_{\mathrm{gcomp}}\\
&=\frac1n\sum_{i=1}^n C_i
 +\widehat\psi_{\mathrm{gcomp}}
 -\frac n n\widehat\psi_{\mathrm{gcomp}}\\
&=\frac1n\sum_{i=1}^n C_i.
\end{aligned}
$$

> **Notation recap:** $n=5735$ and the sums cover every patient. In the second line, the average predicted risk difference equals $\widehat\psi_{\mathrm{gcomp}}$ by definition. The last term adds the same centre $n$ times and divides by $n$. These two terms cancel; the average weighted residual may still be non-zero.

Distinguish three objects: $\widehat\psi_{\mathrm{gcomp}}$ is one risk difference estimate from initial $\widehat Q$; $\widehat D^{\mathrm{init}}$ is a function built from initial $\widehat Q$, $\widehat g$ and that centre; averaging its outputs over 5735 patients and adding this to the initial estimate gives **one-step estimation**. For the present standardised risk difference, this one-step estimate is exactly AIPW:

$$
\begin{aligned}
\widehat\psi_{\mathrm{one\text{-}step}}=\widehat\psi_{\mathrm{AIPW}}
&=\widehat\psi_{\mathrm{gcomp}}
 +\frac1n\sum_{i=1}^n\widehat D_i^{\mathrm{init}}\\
&=\widehat\psi_{\mathrm{gcomp}}+\frac1n\sum_{i=1}^n C_i\\
&=\frac1n\sum_{i=1}^n
 \{\widehat Q_{1,i}-\widehat Q_{0,i}+C_i\}.
\end{aligned}
$$

> **Notation recap:** $\widehat\psi_{\mathrm{one\text{-}step}}$ and $\widehat\psi_{\mathrm{AIPW}}$ are the same final point estimate here; $\widehat\psi_{\mathrm{gcomp}}$ is the initial, uncorrected estimate, $\widehat D_i^{\mathrm{init}}$ the initial EIF value for patient $i$, and $C_i$ that patient’s weighted residual. With $n=5735$, summing and dividing by $n$ averages over all patients. Hats denote fitted or sample-calculated quantities; multiplying risk differences by 100 gives percentage points.

<div class="tmle-eif-aipw-placeholder"></div>

**“One step” means one EIF correction after the initial fits.**

**TMLE starts from the same initial fits and applies the correction to the prediction function.** AIPW’s one-step estimate retains initial predictions and directly yields a corrected number; TMLE retains $\widehat g$, updates $\widehat Q$ along the same $H$, then standardises the updated predictions. Using $H$ as a covariate in a logistic update makes its score $H$ times the updated residual. The next step fits the update size with this regression, bringing the overall average weighted residual close to zero.

<!-- tmle-step:2 -->
### ③ Fit a logistic regression with just one coefficient

“Updating $Q$” means turning **the initial conditional-mean estimate $\widehat Q$ into a new estimated function $\widehat Q^*$**. The update involves three things:

- **Initial model parameters stay fixed.** Every fitted coefficient $\widehat\beta$ of the initial logistic regression keeps its value, as does initial $g$.
- **Add one coefficient to estimate.** The fluctuation parameter $\varepsilon$ controls the shared update size in direction $H$.
- **The new function produces new predictions.** After fitting $\widehat\varepsilon$, initial $Q$ together with this adjustment defines $\widehat Q^*$; updated predictions in the table are evaluations of that new function at each patient’s inputs.

Specifically, use the initial prediction’s logit as a fixed offset, observed mortality $Y$ as response, and $H$ as the sole covariate. Fit a logistic regression **without an additional intercept**. For any input $(a,w)$, the prediction family is:

$$
\operatorname{logit}Q_\varepsilon(a,w)
=\underbrace{\operatorname{logit}\widehat Q(a,w)}_{\text{retain the initial model}}
+\underbrace{\varepsilon H(a,w)}_{\text{new adjustment term}}.
$$

> **Notation recap:** $a$ is a treatment input, 0 or 1, and $w$ a baseline input; $H(a,w)$ writes Step ②’s $H$ for any such input. The function $Q_\varepsilon$ estimates the conditional mean at a given $\varepsilon$ and returns to $\widehat Q$ when $\varepsilon=0$. Fitting uses observed $(A_i,W_i)$ to obtain individual offsets and $H_{A,i}$, with offset coefficient fixed at 1. The only estimated coefficient, $\varepsilon$, is shared by all patients; $\widehat Q^*=Q_{\widehat\varepsilon}$. Logit acts on predicted probabilities; the regression response is still binary $Y_i$.

The familiar “covariate times residual” score is $H$ times the residual here. Fitting $\varepsilon$ brings its full-sample average close to zero:

$$
\frac1n\sum_i H_{A,i}\{Y_i-Q_{\widehat\varepsilon}(A_i,W_i)\}\approx0.
$$

> **Notation recap:** $n=5735$; $\widehat\varepsilon$ is the fitted shared coefficient, and braces contain each updated residual. This is the likelihood score equation for $\varepsilon$, with $H$ constructed from the propensity score. The numerical solver stops when the score is within a specified tolerance of zero.

**Why is one shared $\varepsilon$ enough?** We are estimating one population risk difference. Each time we standardise current $Q$, the EIF component “individual predicted risk difference minus overall average” automatically has empirical average zero. The remaining equation to solve by updating is the single mean-zero weighted-residual equation above.

Along the logistic update path used in this example, $H$ is fixed, and varying one $\varepsilon$ continuously changes that summary. The figure below shows the finite root found in this fit. One $\varepsilon$ therefore suffices for this targeted correction. This conclusion depends on choosing a direction matching the EIF, beyond merely having a scalar target. The prediction quality of $Q$ across all baseline profiles still relies on learning and checking the initial regression.

**A shared $\varepsilon$ still gives different individual adjustments.** The amount added to each person’s logit is $\varepsilon$ times their own $H$; its sign and size vary with treatment and baseline characteristics. Compare the first two patients from the same CSV below, then see how the equation approaches zero across all 5735.

<div class="tmle-direction-placeholder"></div>

<!-- tmle-step:3 -->
### ④ Apply the same $\varepsilon$ to both treatment predictions

Step ③ produced the new estimated function $\widehat Q^*$. Now supply each person’s $(1,W_i)$ and $(0,W_i)$ separately to calculate predictions under both treatments. Each evaluation first converts the initial prediction to logit, adds the same $\widehat\varepsilon$ times the relevant $H$, then applies expit to return to probability. Expit is the inverse of logit.

$$
\widehat Q^*_{a,i}
=\operatorname{expit}\{\operatorname{logit}\widehat Q_{a,i}
+\widehat\varepsilon H_{a,i}\},\qquad a\in\{0,1\}.
$$

> **Notation recap:** $a$ is the treatment level supplied for this evaluation; $\widehat Q_{a,i}$ and $H_{a,i}$ select that arm’s columns. The star marks updated $Q$; both arms share Step ③’s fitted $\widehat\varepsilon$. The update adds on the logit scale and returns a mortality probability between 0 and 1. Observed $W$, $A$, $Y$ and initial $g$ stay fixed.

**Pass to the next step:** two updated mortality-risk columns. Below, compare the operations before and after updating the same patient.

<!-- tmle-step:4 -->
### ⑤ Standardise again using updated $Q$

Return to the original research question. For each person, subtract updated no-RHC risk from updated RHC risk, then average to obtain the TMLE estimate. This point estimate is the average difference between the two predicted risks.

$$
\widehat\psi_{\mathrm{TMLE}}=\frac1n\sum_{i=1}^n
(\widehat Q^*_{1,i}-\widehat Q^*_{0,i}).
$$

> **Notation recap:** $\widehat\psi_{\mathrm{TMLE}}$ is the final risk difference; $\widehat Q^*_{1,i}$ and $\widehat Q^*_{0,i}$ are Step ④’s updated predictions under both treatments. The average covers all $n=5735$ patients; multiplying by 100 gives percentage points.

**What does making the equation zero accomplish?** Initial $Q$ predicts under both treatments. Observed mortality lets us calculate each record’s “observed outcome minus predicted probability” residual, then examine their aggregate. The EIF’s $H$ weights the residuals for the target population and combines them as “RHC minus no RHC”. This average provides correction information specific to the risk difference.

AIPW adds it to the initial risk difference. TMLE updates $Q$ along $H$ until updated predictions and observed outcomes agree on this weighted check, then recalculates the risk difference. **Zero means this within-sample check is satisfied; whether the estimate is closer to the true target is a separate question requiring the truth for direct assessment.**

<div class="tmle-calibration-placeholder"></div>

**Why is this correction doubly robust?** Follow where the residuals come from:

- **When $Q$ is correct:** among people with the same baseline characteristics and treatment, the prediction equals their mean mortality risk. Such residuals average to zero in the population; multiplying by $H$, determined by treatment and baseline, still gives average zero. Initial standardisation already gives the target, and the population correction does not move it away.
- **When $g$ is correct:** even with biased $Q$, correct inverse probability weights convert observed residuals in each arm into average prediction bias in the common target population. Subtracting the two arms’ biases exactly supplies the missing part of the initial risk difference.
- **When both have errors:** the predictions and the weights used to correct them are both inaccurate, so bias can remain. The remainder involves both $Q$ error and $g$ error: initial $Q$ for AIPW and updated $Q$ for TMLE. This explains why estimating either accurately helps.

These relationships average over a population distribution. AIPW uses the correction directly; TMLE makes updated $Q$ satisfy an equation with the same structure. For estimation, double robustness means that, under the relevant regularity conditions, the estimator approaches the target as sample size grows if at least one of $Q$ and $g$ is consistently estimated. Finite samples also contain sampling error, so one update may move closer to or further from the true value. We can directly verify equations and calculations in these data; double robustness explains why this correction is useful under those conditions.

<details>
<summary>Can bias remain after the equation is zero in a known reference distribution?</summary>

Fix the joint frequencies of sex, RHC and 30-day mortality among these 5735 patients as a **teaching reference distribution**, denoted $P_{\mathrm{ref}}$. Adjusting only for sex, its reference risk difference is directly calculable. Below, all averages use this fixed distribution to isolate the effects of errors in $Q$ and $g$.

“Correct $Q$” uses the actual mortality proportion in each sex–treatment group of the reference distribution; “correct $g$” uses each sex group’s actual RHC proportion. We deliberately change these predictions to create three scenarios. All use the same TMLE update rule.

<div class="tmle-reference-placeholder"></div>

In the third scenario the equation is zero, yet TMLE still differs from the reference target. This shows that **solving the equation and removing all estimation error are different achievements**. The first two scenarios illustrate the population double-robustness relationship: one correct component returns us to the reference target.

The figure’s reference risk difference adjusts only for sex; the actual analysis above adjusts for a fuller $W$, so they target different statistical quantities. $P_{\mathrm{ref}}$ treats this sample’s frequencies as known probabilities; the true population $P_0$ remains unknown. This comparison illustrates the correction mechanism. Accuracy of the actual RHC analysis still depends on model fitting, sampling and causal identification conditions.

<details>
<summary>Review how the reference experiment changes $Q$ and $g$</summary>

Sex is ordered Female, Male. Correct $Q$ uses the four reference mortality proportions. For incorrect $Q$, increase no-RHC predictions by 0.12 and 0.06 respectively, and decrease RHC predictions by 0.06 and 0.12 respectively. Correct $g$ uses the two reference RHC proportions; the first scenario sets both to 0.5, and the third moves each original value halfway towards 0.5. All predictions remain between 0 and 1. Within each update, the initial fitted $Q$ and $g$ stay fixed; only a shared $\varepsilon$ is fitted, then the equation is checked with updated $Q$ and fixed $g$.

</details>
</details>

<!-- tmle-step:5 -->
### ⑥ Use the updated EIF to study uncertainty

After obtaining the point estimate, the EIF has a second use. Substitute updated $Q$, fixed $g$ and the final risk difference into the EIF and calculate one output per patient. It adds a “weighted residual” to “the deviation of the individual predicted risk difference from the overall average”:

$$
\widehat D_i=H_{A,i}(Y_i-\widehat Q^*_{A,i})
+(\widehat Q^*_{1,i}-\widehat Q^*_{0,i})-\widehat\psi_{\mathrm{TMLE}}.
$$

> **Notation recap:** $\widehat D_i$ is the fitted EIF value for observed record $i$; $\widehat Q^*_{A,i}$ selects the updated prediction under observed $A$, and $H$ still uses initial $g$. The subtracted term is Step ⑤’s overall risk difference. Individual values may be non-zero; their average is close to zero because Step ③ brings the average of the first term close to zero and Step ⑤ centres the last two.

First calculate the **empirical variance** of these values: using the current sample, measure their dispersion around their sample average. In the RHC cohort, subtract the average from each of the 5735 EIF values, square, then average. The denominator here is $n$, or 5735. The sample variance commonly used to estimate population variance without bias uses $n-1$; this tutorial uses variance under the empirical distribution, with denominator $n$. This dispersion provides a scale for estimation error. Under inference conditions including independent observations, sufficient overlap and negligible fitting-error remainders, estimate standard error (SE) as:

$$
\overline D=\frac1n\sum_{i=1}^n\widehat D_i,\qquad
\widehat{\mathrm{Var}}(\widehat D)=\frac1n\sum_{i=1}^n(\widehat D_i-\overline D)^2,\qquad
\widehat{\mathrm{SE}}=\sqrt{\frac{\widehat{\mathrm{Var}}(\widehat D)}n}.
$$

> **Notation recap:** $\widehat D_i$ is patient $i$’s EIF value and $\overline D$ their sample average; $\widehat{\mathrm{Var}}(\widehat D)$ is the variance calculated above, and $n$ the number of independent observations. Taking the square root gives the risk difference’s standard error. The figure uses this same formula; Chapters 7–8 explain conditions and error control for valid inference.

**The EIF’s two uses now connect:** Steps ②–③ use it to select an update direction and solve an equation; this step uses it to quantify estimation uncertainty. Double robustness guarantees consistency under the relevant conditions; valid interval estimation also needs the inference conditions here.
