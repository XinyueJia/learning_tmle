import {renderInlineMath as math} from '../markdown.js';
import {RHC_MODEL} from '../../shared/js/rhc-model.js';
import {ate,fitFromOffsets,aipw,tmle} from '../../shared/js/math.js';

const pp=x=>(100*x).toFixed(4);
const nearZero=x=>Math.abs(x)<1e-9?x.toExponential(2):x.toFixed(6);
export function renderCalibration(initial,target){
 return `<figure class="to-calibration" data-to-calibration>
 <figcaption>Distinguish the empirical EIF equation from the true estimation error</figcaption>
 <div class="to-calibration-grid">
 <div><h4>Initial ${math('\\widehat Q')} · Fixed ${math('\\widehat g')}</h4><p>Risk difference <b>${pp(initial.estimate)} percentage points</b></p><p>Average EIF (probability difference) over actual records<br><b>${nearZero(initial.eif_mean)}</b></p></div>
 <div><h4>Update along ${math('H')} → ${math('\\widehat Q^*')} · Same ${math('\\widehat g')}</h4><p>TMLE risk difference <b>${pp(target.estimate)} percentage points</b></p><p>Average EIF (probability difference) over identical records<br><b>${nearZero(target.eif_mean)} ≈ 0</b></p></div>
 </div>
 <p>Both averages use the empirical distribution ${math('P_n')}: each record has a weight of ${math('1/5735')}. ${math('Q')} and risk difference in EIF change with updates, while ${math('g')} remains fixed.</p>
 <div class="to-unknown"><b>Target in the true population ${math('P_0')}:?</b><br>Without the true target, we cannot calculate “this estimate − the true target”, or conclude from a zero empirical equation that this estimate is more accurate.</div>
 </figure>`;
}
export function referenceScenarios(){
 return [[0,1,'Q is correct, g is wrong'],[.12,0,'g is correct, Q is wrong'],[.12,.5,'Both Q and g have errors']].map(([b,lambda,label])=>{
  const fit=fitFromOffsets(RHC_MODEL,b,lambda),result=tmle(RHC_MODEL,fit);
  return {label,b,lambda,reference:ate(RHC_MODEL),initial:ate(fit),aipw:aipw(RHC_MODEL,fit),tmle:result.estimate,score:result.score,updated:result.updated};
 });
}
export function renderReferenceCalibration(){
 const rows=referenceScenarios(),target=rows[0].reference;
 const x=v=>80+(v+.12)/.24*420;
 const markers=[['initial','initial standardisation'],['aipw','AIPW'],['tmle','TMLE']];
 return `<figure class="to-reference" data-to-reference><figcaption>Does solving the equation remove bias in a fixed RHC reference distribution?</figcaption>
 <p>Adjust only by sex · Known reference risk difference <b data-to-reference-target="${target}">${pp(target)} percentage points</b> · Sum over all reference probabilities</p>
 ${rows.map((r,j)=>`<section class="to-reference-case" data-to-reference-case="${j}">
 <h4>${r.label.replace(/[Qg]/g,symbol=>math(symbol))}</h4>
 <div class="to-scroll" tabindex="0" role="region" aria-label="Three results for ${r.label} and the reference risk difference; scroll horizontally">
 <svg class="to-reference-chart" viewBox="0 0 610 165" role="img" aria-label="${r.label}: initial standardised ${pp(r.initial)}, AIPW ${pp(r.aipw)}, TMLE ${pp(r.tmle)}, reference ${pp(target)}, in percentage points">
 <text x="${x(target)}" y="17" text-anchor="middle">reference target</text>
 <line x1="${x(target)}" x2="${x(target)}" y1="23" y2="128" class="to-reference-line"/>
 ${markers.map(([key,label],i)=>`<text x="4" y="${46+i*34}">${label}</text><line x1="90" x2="500" y1="${42+i*34}" y2="${42+i*34}" class="to-reference-axis"/><circle cx="${x(r[key])}" cy="${42+i*34}" r="6" class="to-reference-dot to-dot-${key}"/><text x="520" y="${46+i*34}" data-to-ref-value="${r[key]}" data-to-ref-kind="${key}">${pp(r[key])}</text>`).join('')}
 ${[-.1,0,.1].map(v=>`<text x="${x(v)}" y="153" text-anchor="middle">${100*v}</text>`).join('')}<text x="520" y="153">percentage point</text></svg>
 </div>
 <div class="to-reference-results"><span>Mean updated estimating function (probability difference) <b data-to-ref-score="${r.score}">${nearZero(r.score)} ≈ 0</b></span><span>TMLE − Reference target <b data-to-ref-error="${r.tmle-target}">${Math.abs(r.tmle-target)<1e-9?'≈ 0':pp(r.tmle-target)} percentage points</b></span></div>
 </section>`).join('')}<p class="to-data-note">The dotted line is fixed at the same reference target; the three dots represent the three calculation results. All cases solve for the roots of the equation; the third case still leaves reference bias. There is no resampling here, and model errors from a fixed reference distribution are shown.</p></figure>`;
}
