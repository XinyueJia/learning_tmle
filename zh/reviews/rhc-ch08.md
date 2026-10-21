# RHC chapter 08: independent mathematics and pedagogy review

Date: 2026-10-16. Status: **authored mathematical/pedagogical narrative accepted**. Reviewer edits are confined to review files. Legacy chapter reviews remain historical and do not approve this migration.

Source reviewed: `zh/src/chapters/ch08.md`. SHA-256 at this review: `9112c54bd9dc3c2a2c246ef8ec3592c2dfd2829f5d71fe058c992024bc0eb1a4`.

## Error correction, targeting and actual multivariable application

The plug-in and AIPW formulas average both treatment predictions over the same original participants. Independently checked the population AIPW bias identity with errors e_a=Qhat_a-Q0_a: the product B has the displayed positive sign. Double robustness and local Neyman orthogonality are distinguished; the n^-1/4 rate example correctly does not guarantee a negligible n^-1/2 product. Cross-fitting is not presented as a substitute for rate or causal assumptions.

The actual-arm Bernoulli likelihood derivative is fully expanded to H(Y-q); its derivative is negative inside the stated probability range. The offset, clever covariate, treatment-arm signs and bisection direction are correct. The script and webpage solve the observed score, not an oracle loss. Saturated sex g makes both AIPW and a targeted plug-in equal the observed sex-standardised contrast; the chapter explicitly limits that equality to the empirical identity rather than claiming clinical exchangeability.

The same 5,735 individual records feed the expanded 17-column baseline design. The chapter states the real fields, main-effects logistic fitting, lack of clipping/imputation/penalisation, omitted acute severity and conditional interpretation. It does not call the smaller antecedent set comprehensive clinical adjustment. The fitted values match the independently executed Julia and JS implementations. Both counterfactual risks are updated and averaged over all participants.

The revised exact error identity now retains -P_n Dhat. Independently: P0 Dhat=ψ0+B-ψhat, which rearranges to ψhat-ψ0=(Pn-P0)Dhat+B-PnDhat. Only an exact score root removes the last term; the text now explains numerical tolerance. Empirical EIF centring, nuisance consistency, empirical-process control, second-order error and causal identification remain separate requirements. No guaranteed clinical confidence interval, true effect recovery or finite-sample superiority is claimed.

The Julia output paragraph now accurately attributes initial summaries, the first five midpoint/score steps and final risks to the script, with offsets/H/interval tables supplied by the webpage. Earlier promised but unprinted columns are no longer attributed to stdout.

## Evidence and acceptance boundary

Independently inspected the chapter, `shared/julia/RHCCase.jl`, `zh/julia/rhc_lessons/ch08.jl`, `shared/js/rhc.js` and `zh/src/rhc-full.js`. Independently ran all 127 RHC Julia checks, including eight scripts from outside the repository, and all seven RHC JS tests, including analytic logistic fixtures and targeting finite differences. The detailed review and issue closures are in `rhc-design.md`.

This accepts authored narrative and checked source calculations. Rendered figures and code explanations, keyboard/mobile behaviour, final protocol/brief consistency and their recorded checks remain distinct integration tasks. The review does not inherit old synthetic-case screenshots or assert unverified clinical causal conditions.
