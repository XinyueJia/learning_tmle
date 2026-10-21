import {renderInlineMath as math} from '../markdown.js';

const decimal=x=>(Object.is(x,-0)?0:x).toFixed(6);
const pp=x=>(100*x).toFixed(4)+' percentage points';
const factor=x=>x<0?`(${decimal(x)})`:decimal(x);

/** Use the same initial full-cohort trace as the six-step table. */
export function renderIpwBridge(initial){
 const {vectors:v,shown,summary:s}=initial;
 const ipw=v.y.reduce((sum,y,i)=>sum+v.h[i]*y,0)/s.n;
 const header=(title,formula,description)=>`<header><h4>${title}</h4><div>${math(formula)}</div><p>${description}</p></header>`;
 return `<figure class="to-ipw-bridge" data-to-ipw-bridge>
 <figcaption>Apply the same weight to the outcome and to the residual</figcaption>
 <p>Use the ${math('\\widehat Q')} and ${math('\\widehat g')} fitted above and keep each patient’s observed ${math('W,A,Y')} fixed. The same horizontal row in each column below corresponds to the same record.</p>
 <div class="to-scroll" tabindex="0" role="region" aria-label="Compare the inverse probability weight, weighted outcome and weighted residual of the six RHC records, with horizontal scrolling">
 <div class="to-ipw-objects">
 <section class="to-ipw-object to-ipw-weight">
 ${header('Shared inverse probability weight','H_{A,i}','Calculated from actual treatment and fitted treatment probabilities')}
 ${shown.map(r=>`<div class="to-ipw-row" data-to-ipw-weight-row="${r.row}"><span>Original row ${r.row} · ${math(`A_i=${r.a}`)} · ${math(`\\widehat g_i=${decimal(r.g)}`)}</span><b data-to-ipw-h="${r.h}">${math(`H_{A,i}=${decimal(r.h)}`)}</b></div>`).join('')}
 <footer>${math(`${s.n}\\times1`)} weight vector · first ${shown.length} patients shown</footer>
 </section>
 <section class="to-ipw-object to-ipw-outcome">
 ${header('Left: IPW weighted outcome','H_{A,i}Y_i','The same weight × actual death outcome')}
 ${shown.map(r=>`<div class="to-ipw-row" data-to-ipw-outcome-row="${r.row}"><span>Original row ${r.row} · Actual outcome ${math(`Y_i=${r.y}`)}</span><b data-to-ipw-outcome="${r.h*r.y}">${math(`${factor(r.h)}\\times${r.y}=${decimal(r.h*r.y)}`)}</b></div>`).join('')}
 <footer>${math(`${s.n}\\times1`)} per-person contribution · first ${shown.length} patients shown</footer>
 </section>
 <section class="to-ipw-object to-ipw-residual">
 ${header('Right: AIPW weighted residual','C_i=H_{A,i}(Y_i-\\widehat Q_{A,i})','The same weight × (actual outcome − initial prediction)')}
 ${shown.map(r=>`<div class="to-ipw-row" data-to-ipw-residual-row="${r.row}"><span>Original row ${r.row} · Initial prediction ${math(`\\widehat Q_{A,i}=${decimal(r.qa)}`)}</span><b data-to-ipw-residual="${r.score_contribution}">${math(`${factor(r.h)}\\times(${r.y}-${decimal(r.qa)})=${decimal(r.score_contribution)}`)}</b></div>`).join('')}
 <footer>${math(`${s.n}\\times1`)} per-person correction term · first ${shown.length} patients shown</footer>
 </section>
 </div></div>
 <p class="to-data-note">Six records are displayed; summaries use all ${s.n} records. Products use unrounded values; displayed decimals have six places. Weighted contributions are on the probability difference scale.</p>
 <div class="to-ipw-averages">
 <div><h4>Average the weighted outcomes</h4>${math('\\widehat\\psi_{\\mathrm{IPW}}=\\frac1n\\sum_i H_{A,i}Y_i')}<b data-to-ipw-average="${ipw}">${pp(ipw)}</b><p>This is the Horvitz–Thompson estimate: both weighted arm totals are divided by ${math(`n=${s.n}`)}.</p></div>
 <div><h4>Average the weighted residuals</h4>${math('\\frac1n\\sum_i H_{A,i}(Y_i-\\widehat Q_{A,i})')}<b data-to-ipw-correction="${s.initial_score}">${pp(s.initial_score)}</b><p>This is the correction term. Add it to the initial standardised estimate to obtain AIPW.</p></div>
 </div>
 <p class="to-ipw-zero">For the patient in original row 1, ${math('Y_i=0')}. The IPW contribution is zero, but the weighted residual is non-zero because the initial prediction ${math('\\widehat Q_{A,i}')} is positive.</p>
 </figure>`;
}

/** Show the initial-centre identity before introducing any updated Q. */
export function renderEifAipwBridge(initial){
 const {shown,summary:s}=initial;
 return `<figure class="to-eif-aipw" data-to-eif-aipw>
 <figcaption>Why do EIF values and weighted residuals differ for each patient but have the same average?</figcaption>
 <p>Start with each patient’s weighted residual ${math('C_i')} from the previous figure. Add their predicted risk difference, then subtract the initial standardised estimate ${math('\\widehat\\psi_{\\mathrm{gcomp}}')}.</p>
 <div class="to-scroll" tabindex="0" role="region" aria-label="Weighted residuals and initial EIF values for original RHC rows 1 and 2; scroll horizontally"><div class="to-eif-records">
 <div class="to-eif-record-heading"><span>original row</span><span>${math('C_i')}<br>Weighted residual</span><strong>＋</strong><span>${math('\\widehat Q_{1,i}-\\widehat Q_{0,i}')}<br>Patient’s predicted risk difference</span><strong>−</strong><span>${math('\\widehat\\psi_{\\mathrm{gcomp}}')}<br>Initial standardised estimate</span><strong>＝</strong><span>${math('\\widehat D_i^{\\mathrm{init}}')}<br>Initial EIF value</span></div>
 ${shown.slice(0,2).map(r=>`<div class="to-eif-record" data-to-eif-row="${r.row}"><b>${r.row}</b><span data-to-eif-c="${r.score_contribution}">${math(decimal(r.score_contribution))}</span><strong>＋</strong><span data-to-eif-contrast="${r.contrast}">${math(decimal(r.contrast))}</span><strong>−</strong><span data-to-eif-centre="${s.initial_estimate}">${math(decimal(s.initial_estimate))}</span><strong>＝</strong><span data-to-eif-output="${r.eif}">${math(decimal(r.eif))}</span></div>`).join('')}
 </div></div>
 <p class="to-data-note">The two rows compare individual patients. Values are probability differences, rounded to six decimal places. Each average below uses all ${s.n} patients, the initial fit and the same centre.</p>
 <div class="to-eif-average"><h4>The centring term averages to zero across all patients</h4>
 <div class="to-scroll" tabindex="0" role="region" aria-label="The overall initial EIF average is equal to the weighted residual average, which can be scrolled horizontally."><div class="to-ipw-sum">
 <span>${math('\\frac1n\\sum_i C_i')}<br><b>${pp(s.initial_score)}</b></span><strong>＋</strong>
 <span>${math('\\frac1n\\sum_i(\\widehat Q_{1,i}-\\widehat Q_{0,i})-\\widehat\\psi_{\\mathrm{gcomp}}')}<br><b data-to-eif-centred-average="${s.centred_mean}">${(s.centred_mean*100).toExponential(2)} ≈ 0 percentage points</b></span><strong>＝</strong>
 <span>${math('\\frac1n\\sum_i\\widehat D_i^{\\mathrm{init}}')}<br><b data-to-eif-average="${s.eif_mean}">${pp(s.eif_mean)}</b></span>
 </div></div></div>
 <div class="to-ipw-route"><h4>Apply the one-step correction to obtain AIPW</h4>
 <div class="to-scroll" tabindex="0" role="region" aria-label="Initial standardised estimate plus the mean initial EIF value gives the one-step/AIPW estimate; scroll horizontally."><div class="to-ipw-sum"><span>initial standardisation<br><b>${pp(s.initial_estimate)}</b></span><strong>＋</strong><span>Mean initial EIF value<br><b>${pp(s.eif_mean)}</b></span><strong>＝</strong><span>One-step / AIPW<br><b data-to-ipw-aipw="${s.aipw}">${pp(s.aipw)}</b></span></div></div>
 </div>
 </figure>`;
}
