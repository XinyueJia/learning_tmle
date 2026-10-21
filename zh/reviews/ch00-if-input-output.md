# Chapter 0 IF input/output: independent mathematics and pedagogy review

Status: independent mathematics and pedagogy source gate passed after precision fixes; lead-run dedicated IF browser checks passed. Final lead integration regression results are complete and recorded separately below. This review concerns Chapter 0 only and does not reopen Chapter 1 or the existing five object figures.

Ownership: this reviewer writes only this file. Read-only context includes the course contract, Chapter 0's IF introduction and the directly relevant mean-IF interfaces. Browser execution is excluded from this review; any later browser evidence will be attributed to the lead.

## Independently derived acceptance gates

1. **Declare the temporary target.** The preview explicitly introduces the descriptive mean target Ψ_mean(P)=E_P[Y]. It cannot silently reuse the preceding risk-difference target Ψ(P)=E_P[Q1−Q0] or call z−μ the ATE IF. Its numerical μ is the observed RHC 30-day death proportion 1918/5735, not a known clinical causal truth.
2. **Fix the full context.** The target functional, reference distribution and model/support are declared before varying inputs. In the preview P_ref=P_n, or explicitly its Y marginal, with outcome support {0,1}. Changing z or a displayed patient does not refit P or change μ. P may mathematically index a family D_P; the prose should explain the fixed-context reading rather than categorically saying P is not a parameter.
3. **Give a correctly typed input and output.** D^mean_P maps one observed outcome value z in {0,1} to one signed real number. Patient identity, complete dataset and path step t are not the argument for this single-observation map. The 0/1 labels are actual death indicators, not treatment labels, probabilities or potential outcomes.
4. **Separate function, value, random variable and vector.** D_P is the fixed rule. D_P(z) is its scalar value at a specified input. D_P(Y) is a random variable when Y is drawn from P. Applying the rule to all observed Y_i gives a vector of realised contributions. A six-row preview is only a display window; it does not make D_P a six-input function or redefine the cohort.
5. **Explain what the scalar means.** For the finite binary mean, the point-mass path P_t=(1−t)P+tδ_z gives Ψ_mean(P_t)−Ψ_mean(P)=t(z−μ). D^mean_P(z)=z−μ is the rate per unit contamination proportion; t×D is the actual change. It is not the change caused by treating one person, deleting a record or changing one patient's outcome.
6. **Bound the path claim.** Ordinary mixing has 0≤t≤1; this binary reference has positive mass at both support points, so a valid local path exists around zero. The preview must not promote point-mass contamination to a general regular-submodel definition for continuous models. A short bounded example can precede the later derivation without claiming to have supplied the general semiparametric definition.
7. **Preserve signs and centring roles.** D(0)=−1918/5735 and D(1)=3817/5735. Neither value is zero. Their P-weighted mean is zero. At P_ref=P_n, averaging the same realised vector is an empirical centring identity; it does not imply that a fixed-P0 influence function averages to zero in every sample, or that estimation error vanishes.
8. **Bridge to the later observation type.** For the later risk-difference target, input o=(w,a,y) is one observed record and output D_P(o) is one signed scalar under fixed target/model/reference context. It is appropriate to postpone the full ATE formula. Neither the input nor output is a person's causal effect, a death-risk prediction or a clinical score.
9. **Keep the intervention scope.** Preserve the existing clinical conditions and five object figures. The new function preview belongs to the Chapter 0 IF introduction, with mathematical notation and accessible input→rule→output structure. It must not alter underlying observations, fitted-model code or Chapter 1's full derivation.

## Planned checks

Review the revised prose and preview source against these equations and types, inspect how changes of z/row preserve context, and report precise issues. Check the transition from the empirical preview to the later sampling-error discussion for apparent contradictions. Source acceptance will remain separate from lead-run browser evidence; this reviewer will not execute or claim browser checks.

## First revised-prose pass

The revised Sections 4 and 5.2 correctly introduce fixed target/model/reference context, the observation-to-real-number map, and the difference between a rule and one value. They explicitly switch to a descriptive mean target for the 0/1 example; z−μ is not presented as the ATE IF. The signs, patient-identity independence, non-probability/non-causal interpretation and P_n centring explanation are correct. The paragraph preceding Section 5.3 now distinguishes same-sample empirical centring from a fixed-reference influence function's sampling fluctuation, preventing the apparent contradiction identified in the initial checklist.

Two precision checks were sent to the author/lead for final integration: make scalar-z contamination explicitly a path for the Y marginal when the general observation is O=(W,A,Y), and distinguish the pre-observation random vector [D_P(O_i)] from its realised values [D_P(o_i)]. The preview source remains pending at this pass. No numerical error was found in the revised prose.

## Preview source pass

Reviewed `zh/renderers/if-function.js`, `zh/src/if-function.js` and `zh/src/if-function.css`. The preview explicitly declares the binary outcome model and P=P_{n,Y}, resolving the observation-type/marginal-law precision check. It uses the real object-data mean and two influence values; the displayed substitutions are exactly −1918/5735 and 3817/5735, with six-decimal displays identified as approximations. Input, fixed rule and output remain separate objects, with the scalar's signed-rate unit and non-ATE interpretation visible.

The live control only switches which precomputed 0/1 panel is shown, and reset restores the selected input. It does not change the reference law, mean, cohort or fitted models. The hidden panel uses native hidden state, and the diagram retains accessible mathematical renderings and a local scroll region. No browser execution was performed by this reviewer.

Requested final wording refinements: state the ordinary binary replacement bound 0≤t≤1 when interpreting tD as the change; explicitly distinguish the sample random vector from its realised counterpart in the object table. These do not change any computation. The source gate will close after their saved wording is checked.

## Final source gate, including first Q/g introduction

The saved changes close both precision requests. The preview now explicitly limits ordinary binary probability replacement to 0≤t≤1 and states that tD is the exact mean change in this setting. The function/object table now identifies [D_P(O_i)] as a pre-observation random vector and gives [D_P(o_i)] as its realised counterpart. The explicit P_{n,Y} model context resolves scalar input versus full-record law without denying that P can index the function family.

The user subsequently expanded the Chapter 0 scope to introduce Q/g before their first use. Reviewed the new Section 3: it defines W as baseline-vector data, A as actual RHC and Y as actual death; Q takes (a,w) and outputs a conditional death mean/probability, while g takes w and outputs a treatment-assignment probability. The text keeps population functions at P distinct from fitted functions with hats. It explains the same-w two-input comparison, preserves actual observations, and warns that two model outputs are not two observed potential outcomes. The standardised target uses the same W distribution in both arms, and the absence of g from that target is correctly distinguished from its later role in weighting and correction. The later statistical-model definition describes a set of allowed laws rather than presenting a single regression fit as the whole semiparametric model.

The general IF map remains an observation-to-signed-scalar rule under fixed target/model/reference context. The descriptive mean detour is explicitly separate from the preceding risk-difference target. Rate versus finite change, unknown P0 versus empirical reference, sample centring versus P0-based sampling fluctuation, and non-causal interpretation are all stated correctly. The existing five object placeholders and Chapter 1 derivation remain outside this local change. No source-level mathematical or pedagogy blocker remains.

## Saved-image and lead browser evidence

This reviewer viewed the lead-produced `if-input-output-1360.png` saved image. Input, fixed context/rule, signed scalar and exact substitution are visibly distinct, with the binary bound and rate/change explanation below. This is a saved-pixel inspection, not a browser run by this reviewer.

The lead reports actual dedicated IF Chrome checks at 1360 px and 375 px, both exiting 0. They covered real 0/1 outputs, fixed context, reset and keyboard interaction, local range/arrow scrolling, MathML, and absence of page overflow, errors and external requests. Any later full-suite results will be attributed to the lead separately.

## Source snapshots

| Source | SHA-256 |
| --- | --- |
| `zh/src/chapters/ch00.md` | `dbf1e48020841cc4a1ca9b754870ca1f3868413c183589d522e7e4a3cf5869d6` |
| `zh/renderers/if-function.js` | `fd67188e4537aeb8f2c3f98e9a06d40574d395fd432919ae35f9556ab61ecf22` |
| `zh/src/if-function.js` | `f7235d507288695209b7adfe0f1ed0711b04988370b2de7359ba8f1d8cba50da` |
| `zh/src/if-function.css` | `f093d5bcc7f85f0106ebf58c38553981bc25a2ac5ab8c74e90339291fdf8417f` |

## Q/g table layout follow-up

Checked the final scoped `qg-introduction` wrapper, runtime addition of `diagram-scroll` to that table's existing focusable/labelled wrapper, and its 1060 px minimum-width fixed table layout with four 240/170/300/350 px columns. Inline mathematical spans stay unbroken inside the locally scrollable table. The table's mathematical text, Q/g roles and formulas are unchanged; the change prevents narrow-screen header compression and formula line splitting. The source snapshots above include this layout refinement. Source acceptance is preserved; the lead's completed width/formula-height/scroll and integration results are recorded in the subsequent close-out below.

## Local mathematical-positioning follow-up

This reviewer checked the last scoped CSS addition: `.qg-introduction .inline-math` now has `position:relative` alongside no-wrap. It anchors KaTeX's absolutely positioned accessible MathML within the mathematical span and its local scroller. It does not remove or hide a mathematical node, alter formula content or change an input/output definition. The final CSS hash above reflects this refinement; independent source acceptance remains passed.

After this final positioning change, the lead reports that `if-function-browser.cjs` and the complete nine-chapter `rhc-browser.cjs` both exited 0 at 1360 px and 375 px, without page overflow, console errors or external requests. The IF test includes a document-width assertion before any scrolling. These are lead-executed checks; the final blue-layout confirmation follows below.

## Final lead integration close-out

The lead confirms that the final `blue-reading-browser.cjs` run exited 0 at both 1360 px and 375 px. Each viewport checked 46 expressions, row/operator alignment, no-wrap structure, range and keyboard scrolling, mathematical-mode absence of Julia implementation DOM, Chapter 8 chains/linking, all five pages' theme, reduced-motion behaviour and console/offline checks. The final build contains nine chapters. The complete JavaScript suite passed 157/157 with zero failures or skipped tests, including the real Julia checks.

These runs belong to the lead and are separate from this reviewer's mathematical/source and saved-image inspections. No source or reported integration gate remains open for this Chapter 0 change. Actual screen-reader use, physical-device behaviour and learning effectiveness were not measured by this review.
